from typing import List, Optional
from pydantic import BaseModel, Field

class TargetInfo(BaseModel):
    id: str
    name: str
    ra: float
    dec: float
    description: str
    object_type: str
    proper_motion: Optional[str] = None
    spectral_interest: str
    distance_ly: Optional[str] = None
    magnitude: Optional[str] = None
    challenge_relevance: str
    source_url: Optional[str] = None
    has_curated_observations: bool = False
    reference_image_url: Optional[str] = None
    reference_image_credit: Optional[str] = None

class SearchRequest(BaseModel):
    ra: Optional[float] = Field(None, ge=0.0, lt=360.0, description="Right Ascension in decimal degrees")
    dec: Optional[float] = Field(None, ge=-90.0, le=90.0, description="Declination in decimal degrees")
    radius: float = Field(0.01, ge=0.0001, le=1.0, description="Search radius in decimal degrees")
    target_name: Optional[str] = Field(None, description="Astronomical object name to resolve")
    demo_mode: bool = Field(False, description="Explicit request for curated demo data mode")

class ObservationRecord(BaseModel):
    observation_id: str
    target_name: str
    ra: float = Field(ge=0.0, lt=360.0, description="Right Ascension in decimal degrees")
    dec: float = Field(ge=-90.0, le=90.0, description="Declination in decimal degrees")
    observation_date: str
    instrument: str
    band: str
    wavelength_range: str
    data_source: str
    is_demo: bool = False
    fits_url: Optional[str] = None
    preview_url: str
    exposure_time: Optional[float] = None
    spatial_resolution_arcsec: Optional[float] = None
    flux_density: Optional[str] = None
    quality_flag: str
    notes: Optional[str] = None

class SearchResponse(BaseModel):
    status: str  # "success", "no_results", "archive_unavailable", "demo_mode"
    message: str
    target_resolved: Optional[str] = None
    ra: float
    dec: float
    radius_deg: float
    total_results: int
    data_source: str
    observations: List[ObservationRecord]
    archive_status: str
    demo_available: bool

class CompareRequest(BaseModel):
    obs_id_a: str
    obs_id_b: str

class MetricDiff(BaseModel):
    name: str
    value_a: str
    value_b: str
    delta: str
    scientific_significance: str

class CompareResponse(BaseModel):
    obs_id_a: str
    obs_id_b: str
    is_compatible: bool
    incompatibility_reason: Optional[str] = None
    temporal_baseline_days: Optional[float] = None
    angular_separation_arcsec: float
    flux_differential_pct: Optional[float] = None
    difference_image_url: Optional[str] = None
    metrics: List[MetricDiff]
    analysis_summary: str
    recommendation: str
