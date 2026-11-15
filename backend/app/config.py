from pathlib import Path
import os
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_CACHE_DIR = Path("/tmp/orbital-cache") if os.getenv("VERCEL") == "1" else BASE_DIR / "cache"
CACHE_DIR = Path(os.getenv("ORBITAL_CACHE_DIR", str(DEFAULT_CACHE_DIR)))
CACHE_FITS_DIR = CACHE_DIR / "fits"
CACHE_PREVIEWS_DIR = CACHE_DIR / "previews"

CACHE_FITS_DIR.mkdir(parents=True, exist_ok=True)
CACHE_PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseSettings):
    app_name: str = "ORBITAL SPHEREx Archive API"
    environment: str = "production"
    backend_port: int = 8000
    cache_dir: Path = CACHE_DIR
    cache_fits_dir: Path = CACHE_FITS_DIR
    cache_previews_dir: Path = CACHE_PREVIEWS_DIR
    
    irsa_sia_url: str = "https://irsa.ipac.caltech.edu/SIA"
    irsa_spherex_url: str = "https://irsa.ipac.caltech.edu/Missions/spherex.html"
    irsa_tap_url: str = "https://irsa.ipac.caltech.edu/TAP"
    request_timeout_seconds: float = 4.0
    max_retries: int = 2

    class Config:
        env_file = BASE_DIR / ".env"
        extra = "allow"

settings = Settings()
