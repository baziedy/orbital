import asyncio
import io
import logging
import math
import re
from hashlib import sha256
from typing import List, Tuple
from urllib.parse import urlencode
import httpx
from app.config import settings
from app.models.schemas import ObservationRecord
from app.services.catalog import register_observation

logger = logging.getLogger(__name__)

SPHEREX_COLLECTIONS = (
    "spherex_dr1",
    "spherex_dr1_deep",
    "spherex_qr3",
    "spherex_qr3_deep",
)
SIA_MAX_RECORDS = 1000

def _row_value(row, key: str, default: str = "") -> str:
    try:
        columns = getattr(getattr(row, "table", None), "colnames", None)
        column = next((name for name in columns or () if name.lower() == key.lower()), key)
        value = row[column]
    except (KeyError, IndexError, TypeError):
        return default
    if value is None:
        return default
    value = str(value).strip()
    return default if value in {"", "--", "masked", "None", "nan"} else value

def _row_float(row, key: str):
    value = _row_value(row, key)
    if not value:
        return None
    try:
        number = float(value)
        return number if math.isfinite(number) else None
    except (TypeError, ValueError):
        return None

def _mjd_date(row) -> str:
    mjd = _row_float(row, "t_min")
    if mjd is None:
        return "Date not provided"
    try:
        from astropy.time import Time
        return Time(mjd, format="mjd", scale="utc").isot + "Z"
    except Exception:
        return "Date not provided"

def _wavelength_range(row) -> str:
    low = _row_float(row, "em_min")
    high = _row_float(row, "em_max")
    if low is None or high is None:
        return "Archive wavelength range unavailable"
    return f"{low * 1e6:.2f}–{high * 1e6:.2f} µm"

def _safe_observation_id(row, index: int = 0) -> Tuple[str, str]:
    publisher_id = _row_value(row, "obs_publisher_did") or _row_value(row, "obs_id")
    access_url = _row_value(row, "access_url")
    identity = access_url or publisher_id
    if not identity:
        stable_fields = (
            "obs_collection", "s_ra", "s_dec", "t_min", "t_max",
            "em_min", "em_max", "energy_bandpassname",
        )
        identity = "|".join(_row_value(row, field) for field in stable_fields).strip("|")
    if not identity:
        return "", ""
    safe_id = re.sub(r"[^A-Za-z0-9._-]+", "-", identity).strip("-.")[:56]
    suffix = sha256(identity.encode("utf-8")).hexdigest()[:12]
    return f"SPHEREx-{safe_id or 'observation'}-{suffix}", publisher_id

def _cutout_url(access_url: str, ra: float, dec: float, radius_deg: float) -> str:
    size_deg = max(radius_deg * 2.0, 0.05)
    separator = "&" if "?" in access_url else "?"
    query = urlencode({"center": f"{ra:.6f},{dec:.6f}", "size": f"{size_deg:.6f}"})
    return f"{access_url}{separator}{query}"

async def query_irsa_sia(ra: float, dec: float, radius_deg: float, target_name: str = "") -> Tuple[List[ObservationRecord], str, str]:
    sia_params = [("COLLECTION", collection) for collection in SPHEREX_COLLECTIONS]
    sia_params.extend([
        ("POS", f"CIRCLE {ra:.6f} {dec:.6f} {radius_deg:.6f}"),
        ("MAXREC", str(SIA_MAX_RECORDS)),
        ("RESPONSEFORMAT", "VOTABLE"),
    ])
    
    headers = {
        "User-Agent": "ORBITAL-NASA-SpaceApps-SPHEREx-Explorer/1.0",
        "Accept": "text/xml, application/x-votable+xml, application/json, */*"
    }
    
    observations: List[ObservationRecord] = []
    last_error_diag = ""

    for attempt in range(3):
        try:
            async with httpx.AsyncClient(timeout=max(settings.request_timeout_seconds, 20.0)) as client:
                response = await client.get(settings.irsa_sia_url, params=sia_params, headers=headers)
                
                if response.status_code == 200:
                    try:
                        from astropy.io.votable import parse_single_table
                        votable = parse_single_table(io.BytesIO(response.content))
                        data = votable.to_table(use_names_over_ids=True)
                        limit_reached = len(data) >= SIA_MAX_RECORDS
                            
                        for i, row in enumerate(data):
                            data_product_type = _row_value(row, "dataproduct_type").lower()
                            data_product_subtype = _row_value(row, "dataproduct_subtype").lower()
                            access_format = _row_value(row, "access_format").lower()
                            if data_product_type and data_product_type != "image":
                                continue
                            if data_product_subtype and data_product_subtype != "science":
                                continue
                            if access_format and "fits" not in access_format:
                                continue
                            collection = _row_value(row, "obs_collection", "SPHEREx QR")
                            obs_id, publisher_id = _safe_observation_id(row, i)
                            acc_url = _row_value(row, "access_url")
                            if not obs_id or not acc_url.startswith("http"):
                                continue
                            center_ra = _row_float(row, "s_ra")
                            center_dec = _row_float(row, "s_dec")
                            band_str = _row_value(row, "energy_bandpassname", collection)
                            instrument = _row_value(row, "instrument_name", "SPHEREx")
                            target = target_name or _row_value(row, "target_name") or f"RA {ra:.4f}, Dec {dec:.4f}"
                            release_date = _row_value(row, "obs_release_date")
                            exposure = _row_float(row, "t_exptime")
                            resolution = _row_float(row, "s_resolution")
                            details = [f"Live SIA result from {collection}."]
                            if release_date:
                                details.append(f"Archive release date: {release_date}.")
                            if publisher_id:
                                details.append(f"Archive dataset ID: {publisher_id}.")
                            details.append("Metadata and access URL supplied by NASA/IPAC IRSA.")
                                
                            record = ObservationRecord(
                                observation_id=obs_id,
                                target_name=target,
                                ra=center_ra if center_ra is not None and 0 <= center_ra < 360 else ra,
                                dec=center_dec if center_dec is not None and -90 <= center_dec <= 90 else dec,
                                observation_date=_mjd_date(row),
                                instrument=instrument,
                                band=band_str,
                                wavelength_range=_wavelength_range(row),
                                data_source=f"NASA/IPAC IRSA {collection}",
                                is_demo=False,
                                fits_url=_cutout_url(acc_url, ra, dec, radius_deg) if acc_url.startswith("http") else None,
                                preview_url=acc_url if acc_url.lower().endswith((".png", ".jpg", ".jpeg")) else f"/api/images/{obs_id}",
                                exposure_time=exposure,
                                spatial_resolution_arcsec=resolution,
                                quality_flag="Archive quality flag unavailable",
                                notes=" ".join(details),
                            )
                            observations.append(record)
                            register_observation(record)
                            
                        observations.sort(key=lambda item: item.observation_date)
                        diagnostic = f"NASA/IPAC IRSA SIA returned {len(observations)} live SPHEREx science-image records across DR1 and available quick releases."
                        if limit_reached:
                            diagnostic += f" The archive response reached the {SIA_MAX_RECORDS}-record request limit, so additional records may be omitted."
                        return observations, "success", diagnostic
                    except Exception as parse_err:
                        logger.warning(f"Failed to parse VOTable from IRSA: {parse_err}")
                        return [], "no_results", "NASA IRSA returned a response that could not be parsed as a VOTable."
                
                elif response.status_code in (500, 502, 503, 504):
                    last_error_diag = f"NASA/IPAC IRSA SIA service is temporarily experiencing an upstream error (HTTP {response.status_code}). Please retry or view curated mission data."
                    if attempt < 2:
                        await asyncio.sleep(0.6 * (attempt + 1))
                        continue
                    return [], "archive_unavailable", last_error_diag
                
                else:
                    return [], "archive_unavailable", f"NASA IRSA SIA service responded with HTTP status {response.status_code}."
                    
        except httpx.TimeoutException:
            last_error_diag = "NASA/IPAC IRSA query timed out after 20 seconds. The archive service may be experiencing high latency or scheduled maintenance."
            if attempt < 2:
                await asyncio.sleep(0.6 * (attempt + 1))
                continue
            return [], "archive_unavailable", last_error_diag
        except Exception as exc:
            last_error_diag = f"Network connection to NASA/IPAC IRSA could not be established: {str(exc)}"
            if attempt < 2:
                await asyncio.sleep(0.6 * (attempt + 1))
                continue
            return [], "archive_unavailable", last_error_diag

    return [], "archive_unavailable", last_error_diag or "NASA/IPAC IRSA service is temporarily unavailable."
