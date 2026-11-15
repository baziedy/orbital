import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import search, observations, images, compare, targets, guide

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = FastAPI(
    title="ORBITAL — SPHEREx Archive API",
    description="API for querying released SPHEREx archive records and serving image previews.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(observations.router)
app.include_router(images.router)
app.include_router(compare.router)
app.include_router(targets.router)
app.include_router(guide.router)

@app.get("/")
async def root():
    return {
        "project": "ORBITAL",
        "subtitle": "SPHEREx Archive Exploration",
        "challenge": "Planet X and SPHEREx",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ORBITAL archive backend",
        "irsa_endpoint": settings.irsa_sia_url,
        "cache_directory": str(settings.cache_dir)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.backend_port, reload=True)
