import re
from typing import Optional, Tuple
import httpx
from app.services.catalog import CURATED_TARGETS

def parse_sexagesimal(ra_str: str, dec_str: str) -> Optional[Tuple[float, float]]:
    try:
        ra_match = re.match(r'(\d+)[:h\s]+(\d+)[:m\s]+([\d.]+)', ra_str.strip())
        if ra_match:
            h, m, s = float(ra_match.group(1)), float(ra_match.group(2)), float(ra_match.group(3))
            ra_deg = (h + m/60.0 + s/3600.0) * 15.0
        else:
            ra_deg = float(ra_str.strip())

        dec_clean = dec_str.strip()
        sign = -1.0 if dec_clean.startswith('-') else 1.0
        dec_clean = dec_clean.lstrip('+-')
        dec_match = re.match(r'(\d+)[:d°\s]+(\d+)[:m\'\s]+([\d.]+)', dec_clean)
        if dec_match:
            d, m, s = float(dec_match.group(1)), float(dec_match.group(2)), float(dec_match.group(3))
            dec_deg = sign * (d + m/60.0 + s/3600.0)
        else:
            dec_deg = sign * float(dec_clean)

        return ra_deg, dec_deg
    except Exception:
        return None

async def resolve_target(name: str) -> Optional[Tuple[float, float, str]]:
    name_clean = name.strip()
    
    if "," in name_clean:
        parts = name_clean.split(",", 1)
        coords = parse_sexagesimal(parts[0], parts[1])
        if coords:
            return coords[0], coords[1], f"Custom Field (RA {coords[0]:.4f}°, Dec {coords[1]:.4f}°)"

    name_key = name_clean.lower().replace(" ", "").replace("-", "").replace("_", "")

    for target in CURATED_TARGETS.values():
        t_key = target.name.lower().replace(" ", "").replace("-", "").replace("_", "")
        if name_key in t_key or t_key in name_key or name_key == target.id:
            return target.ra, target.dec, target.name

    try:
        url = f"https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?{name_clean}"
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                text = resp.text
                match = re.search(r'<jpos>([\d\.\+\-]+)\s+([\d\.\+\-]+)</jpos>', text)
                if match:
                    ra = float(match.group(1))
                    dec = float(match.group(2))
                    return ra, dec, name_clean
    except Exception:
        pass

    return None
