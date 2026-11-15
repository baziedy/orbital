from fastapi import APIRouter
from typing import List
from app.models.schemas import TargetInfo
from app.services.catalog import CURATED_TARGETS, CURATED_OBSERVATIONS

router = APIRouter(prefix="/api", tags=["targets"])

@router.get("/targets", response_model=List[TargetInfo])
async def list_curated_targets():
    """Return curated target context and whether a demo sequence is available."""
    observations_by_name = {observation.target_name.lower() for observation in CURATED_OBSERVATIONS}
    return [
        target.model_copy(update={"has_curated_observations": target.name.lower() in observations_by_name})
        for target in CURATED_TARGETS.values()
    ]
