from fastapi import APIRouter, HTTPException
from typing import List
from app.models.schemas import SearchRequest, SearchResponse, ObservationRecord
from app.services.target_resolver import resolve_target
from app.services.nasa_irsa import query_irsa_sia
from app.services.catalog import (
    CURATED_TARGETS,
    CURATED_OBSERVATIONS,
    MAX_CURATED_EPOCHS_PER_TARGET,
    get_curated_observations_for_target,
)

router = APIRouter(prefix="/api", tags=["search"])

@router.post("/search", response_model=SearchResponse)
async def search_sky(request: SearchRequest):
    ra = request.ra
    dec = request.dec
    resolved_name = request.target_name

    if request.target_name:
        curated_target = next(
            (target for target in CURATED_TARGETS.values() if target.name.casefold() == request.target_name.casefold()),
            None,
        )
        if curated_target:
            resolved_name = curated_target.name
            if ra is None or dec is None or request.demo_mode:
                ra, dec = curated_target.ra, curated_target.dec
        else:
            res = await resolve_target(request.target_name)
            if res:
                res_ra, res_dec, resolved_name = res
                if ra is None or dec is None or request.demo_mode:
                    ra, dec = res_ra, res_dec
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not resolve celestial object '{request.target_name}'. No matching object found in SIMBAD, NED, or catalog. Verify the spelling or clear the object name to query by coordinates."
                )
            
    if ra is None or dec is None:
        raise HTTPException(
            status_code=400,
            detail="Must provide either an astronomical object name or both Right Ascension (RA) and Declination (Dec)."
        )

    if request.demo_mode:
        curated_obs = []
        if resolved_name:
            curated_obs = [
                obs
                for obs in get_curated_observations_for_target(resolved_name)
                if obs.is_demo
            ]
        if not curated_obs and not request.target_name:
            for obs in CURATED_OBSERVATIONS:
                if (
                    obs.is_demo
                    and abs(obs.ra - ra) < request.radius * 5.0
                    and abs(obs.dec - dec) < request.radius * 5.0
                ):
                    curated_obs.append(obs)

        curated_obs = sorted(
            curated_obs, key=lambda obs: obs.observation_date
        )[:MAX_CURATED_EPOCHS_PER_TARGET]
                    
        return SearchResponse(
            status="demo_mode",
            message=f"Displaying curated mission-demo reference frames for {resolved_name or 'selected coordinates'}.",
            target_resolved=resolved_name,
            ra=ra,
            dec=dec,
            radius_deg=request.radius,
            total_results=len(curated_obs),
            data_source="CURATED_SAMPLE",
            observations=curated_obs,
            archive_status="DSS reference cutouts with illustrative sequence dates; not SPHEREx data.",
            demo_available=True
        )

    live_obs, query_status, diag_msg = await query_irsa_sia(ra, dec, request.radius, resolved_name or "")

    demo_available = False
    if resolved_name and len(get_curated_observations_for_target(resolved_name)) > 0:
        demo_available = True
    else:
        for obs in CURATED_OBSERVATIONS:
            if abs(obs.ra - ra) < 2.0 and abs(obs.dec - dec) < 2.0:
                demo_available = True
                break

    if query_status == "success" and len(live_obs) > 0:
        return SearchResponse(
            status="success",
            message=f"Found {len(live_obs)} live SPHEREx observation records from NASA/IPAC IRSA.",
            target_resolved=resolved_name,
            ra=ra,
            dec=dec,
            radius_deg=request.radius,
            total_results=len(live_obs),
            data_source="NASA/IPAC IRSA SPHEREx",
            observations=live_obs,
            archive_status=diag_msg,
            demo_available=demo_available
        )
    elif query_status in ("archive_unavailable", "archive_error"):
        return SearchResponse(
            status="archive_unavailable",
            message=diag_msg,
            target_resolved=resolved_name,
            ra=ra,
            dec=dec,
            radius_deg=request.radius,
            total_results=0,
            data_source="NASA/IPAC IRSA SPHEREx",
            observations=[],
            archive_status=diag_msg,
            demo_available=demo_available
        )
    else:
        return SearchResponse(
            status="no_results",
            message=f"No public SPHEREx observations currently cataloged within {request.radius}° of RA {ra:.4f}, Dec {dec:.4f}.",
            target_resolved=resolved_name,
            ra=ra,
            dec=dec,
            radius_deg=request.radius,
            total_results=0,
            data_source="NASA/IPAC IRSA SPHEREx",
            observations=[],
            archive_status=diag_msg,
            demo_available=demo_available
        )
