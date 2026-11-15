import os
from pathlib import Path
from typing import Optional
import numpy as np
from PIL import Image
from astropy.io import fits
import httpx
from app.config import settings

def process_fits_array_to_png(data: np.ndarray, output_path: Path) -> Path:
    clean_data = np.nan_to_num(data.astype(float), nan=0.0, posinf=0.0, neginf=0.0)
    sky = float(np.median(clean_data))
    sub_sample = clean_data[clean_data < sky + 2.5 * max(1.0, float(np.std(clean_data)))]
    std = float(np.std(sub_sample)) if len(sub_sample) > 0 else 10.0
    vmin = sky - 0.25 * std
    vmax = float(np.percentile(clean_data, 99.85))
    if vmax <= vmin:
        vmax = vmin + 1.0
    clipped = np.clip(clean_data, vmin, vmax)
    scaled = (clipped - vmin) / (vmax - vmin)
    asinh_s = np.arcsinh(12.0 * scaled) / np.arcsinh(12.0)
    uint8_img = np.clip(asinh_s * 255.0, 0, 255).astype(np.uint8)
    if uint8_img.shape[0] != 512 or uint8_img.shape[1] != 512:
        img = Image.fromarray(uint8_img).resize((512, 512), Image.Resampling.LANCZOS)
    else:
        img = Image.fromarray(uint8_img)
    img.save(output_path, format="PNG")
    return output_path

async def download_and_process_fits(fits_url: str, obs_id: str) -> Optional[Path]:
    output_png = settings.cache_previews_dir / f"{obs_id}.png"
    if output_png.exists():
        return output_png
        
    local_fits = settings.cache_fits_dir / f"{obs_id}.fits"
    
    try:
        if not local_fits.exists():
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(fits_url)
                if resp.status_code == 200:
                    local_fits.write_bytes(resp.content)
                else:
                    return None
                    
        with fits.open(local_fits) as hdul:
            science_hdu = next(
                (hdu for hdu in hdul if str(getattr(hdu, "name", "")).upper() == "IMAGE" and hdu.data is not None),
                None,
            )

            if science_hdu is not None and science_hdu.data is not None:
                data = science_hdu.data
                if getattr(data, "ndim", 0) == 2:
                    return process_fits_array_to_png(data, output_png)
    except Exception:
        pass
        
    return None
