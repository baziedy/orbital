export interface TargetInfo {
  id: string;
  name: string;
  ra: number;
  dec: number;
  description: string;
  object_type: string;
  proper_motion?: string;
  spectral_interest: string;
  distance_ly?: string;
  magnitude?: string;
  challenge_relevance: string;
  source_url?: string;
  has_curated_observations?: boolean;
  reference_image_url?: string;
  reference_image_credit?: string;
}

export interface ObservationRecord {
  observation_id: string;
  target_name: string;
  ra: number;
  dec: number;
  observation_date: string;
  instrument: string;
  band: string;
  wavelength_range: string;
  data_source: string;
  is_demo: boolean;
  fits_url?: string;
  preview_url: string;
  exposure_time?: number | null;
  spatial_resolution_arcsec?: number | null;
  flux_density?: string;
  quality_flag: string;
  notes?: string;
}

export interface SearchResponse {
  status: "success" | "no_results" | "archive_unavailable" | "demo_mode";
  message: string;
  target_resolved?: string;
  ra: number;
  dec: number;
  radius_deg: number;
  total_results: number;
  data_source: string;
  observations: ObservationRecord[];
  archive_status: string;
  demo_available: boolean;
}

export interface MetricDiff {
  name: string;
  value_a: string;
  value_b: string;
  delta: string;
  scientific_significance: string;
}

export interface CompareResponse {
  obs_id_a: string;
  obs_id_b: string;
  is_compatible: boolean;
  incompatibility_reason?: string;
  temporal_baseline_days: number | null;
  angular_separation_arcsec: number;
  flux_differential_pct: number | null;
  difference_image_url?: string;
  metrics: MetricDiff[];
  analysis_summary: string;
  recommendation: string;
}
