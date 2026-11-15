from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Literal, Optional
from hashlib import sha256
import numpy as np
from PIL import Image, ImageOps

from app.services.fits_processor import download_and_process_fits
from app.services.catalog import get_observation_by_id
from app.config import settings
from app.services.comparison_engine import analyze_observation_pair

router = APIRouter(prefix="/api", tags=["images"])

BACKEND_ROOT = Path(__file__).resolve().parents[2]
ASSET_DIR = BACKEND_ROOT / "assets"
TARGET_PREVIEW_DIR = ASSET_DIR / "targets"
TARGET_CURATED_DIR = ASSET_DIR / "curated"
CURATED_ARCHIVE_PREVIEWS = {
    "DSS-REF-W0855-P1": TARGET_PREVIEW_DIR / "wise0855_epoch1.png",
    "DSS-REF-W0855-P2": TARGET_PREVIEW_DIR / "wise0855_epoch2.png",
    "DSS-REF-W0855-P3": TARGET_PREVIEW_DIR / "wise0855_epoch3.png",
    "DSS-REF-BARNARD-P1": TARGET_PREVIEW_DIR / "barnard_epoch1.png",
    "DSS-REF-BARNARD-P2": TARGET_PREVIEW_DIR / "barnard_epoch2.png",
    "DSS-REF-BARNARD-P3": TARGET_PREVIEW_DIR / "barnard_epoch3.png",
    "DSS-REF-RWAUR-P1": TARGET_PREVIEW_DIR / "rwaur_epoch1.png",
    "DSS-REF-RWAUR-P2": TARGET_PREVIEW_DIR / "rwaur_epoch2.png",
    "DSS-REF-RDRA-P1": TARGET_PREVIEW_DIR / "rdra_epoch1.png",
    "DSS-REF-RDRA-P2": TARGET_PREVIEW_DIR / "rdra_epoch2.png",
    "DSS-REF-EPSINDI-P1": TARGET_PREVIEW_DIR / "epsindi_epoch1.png",
    "DSS-REF-EPSINDI-P2": TARGET_PREVIEW_DIR / "epsindi_epoch2.png",
    "DSS-REF-KAPTEYN-P1": TARGET_PREVIEW_DIR / "kapteyn_epoch1.png",
    "DSS-REF-KAPTEYN-P2": TARGET_PREVIEW_DIR / "kapteyn_epoch2.png",
    "DSS-REF-WOLF359-P1": TARGET_PREVIEW_DIR / "wolf359_epoch1.png",
    "DSS-REF-WOLF359-P2": TARGET_PREVIEW_DIR / "wolf359_epoch2.png",
    "DSS-REF-MIRA-P1": TARGET_PREVIEW_DIR / "mira_epoch1.png",
    "DSS-REF-MIRA-P2": TARGET_PREVIEW_DIR / "mira_epoch2.png",
    "DSS-REF-TEEGARDEN-P1": TARGET_PREVIEW_DIR / "teegarden_epoch1.png",
    "DSS-REF-TEEGARDEN-P2": TARGET_PREVIEW_DIR / "teegarden_epoch2.png",
}

def _find_image_file_for_obs(obs_id: str) -> Optional[Path]:
    if obs_id in CURATED_ARCHIVE_PREVIEWS and CURATED_ARCHIVE_PREVIEWS[obs_id].exists():
        return CURATED_ARCHIVE_PREVIEWS[obs_id]

    curated_png = TARGET_CURATED_DIR / f"{obs_id}.png"
    if curated_png.exists():
        return curated_png

    cached_png = settings.cache_previews_dir / f"{obs_id}.png"
    if cached_png.exists():
        try:
            with Image.open(cached_png) as preview:
                preview.verify()
            with Image.open(cached_png) as preview:
                grayscale = preview.convert("L")
                if preview.width > 1 and preview.height > 1 and grayscale.getextrema()[0] != grayscale.getextrema()[1]:
                    return cached_png
        except OSError:
            pass
        cached_png.unlink(missing_ok=True)

    obs = get_observation_by_id(obs_id)
    if obs and obs.preview_url:
        rel_path = obs.preview_url.lstrip("/")
        if rel_path.startswith("api/images/"):
            target_id = rel_path.replace("api/images/", "")
            if target_id in CURATED_ARCHIVE_PREVIEWS and CURATED_ARCHIVE_PREVIEWS[target_id].exists():
                return CURATED_ARCHIVE_PREVIEWS[target_id]

        bundled_asset = ASSET_DIR / rel_path
        if bundled_asset.exists():
            return bundled_asset

        file_name = Path(obs.preview_url).name
        cache_named = settings.cache_previews_dir / file_name
        if cache_named.exists():
            return cache_named

    return None

@router.get("/images/{observation_id}")
async def get_observation_image(observation_id: str):
    observation = get_observation_by_id(observation_id)
    if observation is None:
        raise HTTPException(status_code=404, detail="Observation was not found.")

    found = _find_image_file_for_obs(observation_id)
    headers = {
        "X-Data-Source": observation.data_source,
        "X-Observation-ID": observation_id,
        "X-Demo-Data": str(observation.is_demo).lower(),
        "X-Preview-Processing": "Display preview; not calibrated source photometry",
        "Cache-Control": "public, max-age=3600",
    }
    if found:
        return FileResponse(found, media_type="image/png", headers=headers)

    if observation.fits_url:
        processed = await download_and_process_fits(observation.fits_url, observation_id)
        if processed and processed.exists():
            return FileResponse(processed, media_type="image/png", headers=headers)

    raise HTTPException(
        status_code=502,
        detail="No archive preview is available; a synthetic image was not substituted.",
    )

@router.get("/diff")
async def get_difference_preview(
    obs_a: str = Query(..., description="Observation ID for reference Epoch 1"),
    obs_b: str = Query(..., description="Observation ID for comparison Epoch 2"),
    mode: Literal["diff", "coadd"] = Query(
        "diff", description="'diff' for display subtraction or 'coadd' for display averaging"
    ),
):
    observation_a = get_observation_by_id(obs_a)
    observation_b = get_observation_by_id(obs_b)
    if observation_a is None or observation_b is None:
        raise HTTPException(status_code=404, detail="One or both observations were not found.")

    comparison = analyze_observation_pair(observation_a, observation_b)
    if not comparison.is_compatible:
        raise HTTPException(status_code=422, detail=comparison.incompatibility_reason)

    cache_digest = sha256(f"display-v2:{mode}:{obs_a}:{obs_b}".encode("utf-8")).hexdigest()
    cache_key = f"display_{cache_digest}.png"
    out_path = settings.cache_previews_dir / cache_key
    headers = {
        "X-Mathematical-Operation": (
            "Mean display intensity (A+B)/2"
            if mode == "coadd"
            else "Normalized display raster difference (B-A)"
        ),
        "X-Scientific-Calibration": "Not astrometrically registered or photometrically calibrated",
        "X-Display-Preparation": "Aspect-preserving resize and pad to a common 512-pixel display canvas",
        "X-Reference-Epoch": obs_a,
        "X-Comparison-Epoch": obs_b,
        "Cache-Control": "public, max-age=86400",
    }
    if out_path.exists():
        return FileResponse(out_path, media_type="image/png", headers=headers)

    path_a = _find_image_file_for_obs(obs_a)
    path_b = _find_image_file_for_obs(obs_b)
    if path_a is None and observation_a.fits_url:
        path_a = await download_and_process_fits(observation_a.fits_url, obs_a)
    if path_b is None and observation_b.fits_url:
        path_b = await download_and_process_fits(observation_b.fits_url, obs_b)
    if path_a is None or path_b is None:
        raise HTTPException(
            status_code=502,
            detail="Both real preview images are required; no synthetic difference was substituted.",
        )

    try:
        with Image.open(path_a) as image_a, Image.open(path_b) as image_b:
            gray_a = ImageOps.pad(
                image_a.convert("L"), (512, 512), method=Image.Resampling.LANCZOS
            )
            gray_b = ImageOps.pad(
                image_b.convert("L"), (512, 512), method=Image.Resampling.LANCZOS
            )
            arr_a = np.asarray(gray_a, dtype=np.float32)
            arr_b = np.asarray(gray_b, dtype=np.float32)
    except OSError as exc:
        raise HTTPException(status_code=422, detail="An observation preview could not be decoded.") from exc

    if mode == "coadd":
        result_array = np.clip((arr_a + arr_b) / 2.0, 0, 255).astype(np.uint8)
    else:
        normalized_a = (arr_a - np.median(arr_a)) / max(float(np.std(arr_a)), 1e-5)
        normalized_b = (arr_b - np.median(arr_b)) / max(float(np.std(arr_b)), 1e-5)
        result_array = np.clip(128.0 + (normalized_b - normalized_a) * 35.0, 0, 255).astype(np.uint8)

    Image.fromarray(result_array).save(out_path, format="PNG")
    return FileResponse(out_path, media_type="image/png", headers=headers)
