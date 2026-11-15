from fastapi import APIRouter, HTTPException
from app.models.schemas import CompareRequest, CompareResponse
from app.services.catalog import get_observation_by_id
from app.services.comparison_engine import analyze_observation_pair

router = APIRouter(prefix="/api", tags=["compare"])

@router.post("/compare", response_model=CompareResponse)
async def compare_observations(request: CompareRequest):
    """
    Compare two astronomical observations. Evaluates coordinate separation,
    temporal baseline, and spectral compatibility before producing differential metrics.
    """
    obs_a = get_observation_by_id(request.obs_id_a)
    obs_b = get_observation_by_id(request.obs_id_b)

    if not obs_a:
        raise HTTPException(status_code=404, detail=f"Observation A ('{request.obs_id_a}') not found.")
    if not obs_b:
        raise HTTPException(status_code=404, detail=f"Observation B ('{request.obs_id_b}') not found.")

    return analyze_observation_pair(obs_a, obs_b)
