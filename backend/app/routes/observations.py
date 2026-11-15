from typing import List
from fastapi import APIRouter, HTTPException
from app.models.schemas import ObservationRecord
from app.services.catalog import get_observation_by_id, CURATED_OBSERVATIONS, RUNTIME_OBSERVATIONS

router = APIRouter(prefix="/api", tags=["observations"])

@router.get("/observations", response_model=List[ObservationRecord])
async def list_all_observations():
    seen = set()
    result = []
    for obs in CURATED_OBSERVATIONS + list(RUNTIME_OBSERVATIONS.values()):
        if obs.observation_id not in seen:
            seen.add(obs.observation_id)
            result.append(obs)
    return result

@router.get("/observations/{observation_id}", response_model=ObservationRecord)
async def get_observation(observation_id: str):
    obs = get_observation_by_id(observation_id)
    if not obs:
        raise HTTPException(
            status_code=404,
            detail=f"Observation with ID '{observation_id}' was not found in active cache or catalog."
        )
    return obs
