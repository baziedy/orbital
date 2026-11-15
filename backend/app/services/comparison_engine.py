from datetime import datetime, timezone
import math
import re
from typing import List, Optional

from app.models.schemas import CompareResponse, MetricDiff, ObservationRecord

_FLUX_VALUE_RE = re.compile(
    r"^\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)\s*([A-Za-zµμ/]+)\s*$"
)


def compute_angular_separation_arcsec(
    ra1: float, dec1: float, ra2: float, dec2: float
) -> float:
    """Return great-circle separation for ICRS-like RA/Dec coordinates in degrees."""
    if not all(math.isfinite(value) for value in (ra1, dec1, ra2, dec2)):
        raise ValueError("Coordinates must be finite numbers.")
    if not (0.0 <= ra1 < 360.0 and 0.0 <= ra2 < 360.0):
        raise ValueError("Right ascension must be in [0, 360) degrees.")
    if not (-90.0 <= dec1 <= 90.0 and -90.0 <= dec2 <= 90.0):
        raise ValueError("Declination must be in [-90, 90] degrees.")

    phi1, phi2 = math.radians(dec1), math.radians(dec2)
    delta_phi = phi2 - phi1
    delta_lambda = math.radians(ra2 - ra1)
    haversine = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    haversine = min(1.0, max(0.0, haversine))
    angle = 2.0 * math.atan2(math.sqrt(haversine), math.sqrt(1.0 - haversine))
    return math.degrees(angle) * 3600.0


def parse_iso_date(value: str) -> Optional[datetime]:
    try:
        normalized = value[:-1] + "+00:00" if value.endswith(("Z", "z")) else value
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _parse_flux_mjy(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    match = _FLUX_VALUE_RE.fullmatch(value)
    if not match or match.group(2).casefold() not in {"mjy", "millijy", "millijansky"}:
        return None

    flux = float(match.group(1))
    return flux if math.isfinite(flux) and flux > 0.0 else None


def analyze_observation_pair(
    obs_a: ObservationRecord, obs_b: ObservationRecord
) -> CompareResponse:
    separation_arcsec = compute_angular_separation_arcsec(
        obs_a.ra, obs_a.dec, obs_b.ra, obs_b.dec
    )
    date_a = parse_iso_date(obs_a.observation_date)
    date_b = parse_iso_date(obs_b.observation_date)
    baseline_days = (
        abs((date_b - date_a).total_seconds()) / 86400.0
        if date_a is not None and date_b is not None
        else 0.0
    )

    same_observation = obs_a.observation_id == obs_b.observation_id
    same_band = obs_a.band == obs_b.band
    same_target = (
        obs_a.target_name.strip().casefold() == obs_b.target_name.strip().casefold()
    )
    is_demo = obs_a.is_demo or obs_b.is_demo
    reasons: List[str] = []
    if same_observation:
        reasons.append("Choose two distinct observations.")
    max_separation_arcsec = 18000.0 if (not is_demo or same_target) else 1800.0
    if separation_arcsec > max_separation_arcsec:
        reasons.append(
            f"Field-center separation ({separation_arcsec / 60.0:.1f} arcmin) "
            f"exceeds the {int(max_separation_arcsec / 60.0)} arcmin image-comparison limit."
        )
    if not same_band:
        reasons.append(
            "The records use different spectral bands or reference-image bands; mathematical pixel subtraction is unavailable. "
            "Visual Blink and Split Slider comparison remain active."
        )
    flux_a = _parse_flux_mjy(obs_a.flux_density) if same_band and not same_observation else None
    flux_b = _parse_flux_mjy(obs_b.flux_density) if same_band and not same_observation else None
    flux_diff_pct = (
        round((flux_b - flux_a) / flux_a * 100.0, 2)
        if flux_a is not None and flux_b is not None
        else None
    )
    reported_baseline_days = None if is_demo else baseline_days
    annualized_field_center_rate = (
        separation_arcsec / (baseline_days / 365.25)
        if baseline_days > 0 and not is_demo
        else None
    )

    metrics: List[MetricDiff] = [
        MetricDiff(
            name="Sequence Date" if is_demo else "Observation Epoch",
            value_a=(
                f"Illustrative: {obs_a.observation_date[:10]}"
                if obs_a.is_demo
                else obs_a.observation_date[:10]
            ),
            value_b=(
                f"Illustrative: {obs_b.observation_date[:10]}"
                if obs_b.is_demo
                else obs_b.observation_date[:10]
            ),
            delta=(
                "Not calculated for an illustrative demo date"
                if is_demo
                else (
                    f"{baseline_days:.1f} days"
                    if date_a is not None and date_b is not None
                    else "Unavailable (invalid observation date)"
                )
            ),
            scientific_significance=(
                "Curated sequence labels are illustrative, not the reference plates' observation dates."
                if is_demo
                else "The elapsed time between the observation timestamps, when both dates are valid."
            ),
        ),
        MetricDiff(
            name="Reference Image Type" if is_demo else "Spectral Band",
            value_a=obs_a.band,
            value_b=obs_b.band,
            delta="Same band" if same_band else "Different bands",
            scientific_significance=(
                "For curated records, this identifies the reference plate type; it is not a spectral band."
                if is_demo
                else "Flux and pixel differences are only compared when the spectral bands match."
            ),
        ),
        MetricDiff(
            name="Photometric Flux",
            value_a=obs_a.flux_density or "Unavailable",
            value_b=obs_b.flux_density or "Unavailable",
            delta=(
                f"{flux_diff_pct:+.2f}% relative to A"
                if flux_diff_pct is not None
                else (
                    "Unavailable (different bands)"
                    if not same_band
                    else "Unavailable (missing or invalid mJy values)"
                )
            ),
            scientific_significance="A metadata flux ratio is meaningful only when both values are positive and in mJy; it is not a calibrated variability measurement.",
        ),
        MetricDiff(
            name="Field-Center Separation",
            value_a=f"({obs_a.ra:.5f}, {obs_a.dec:.5f})",
            value_b=f"({obs_b.ra:.5f}, {obs_b.dec:.5f})",
            delta=f"{separation_arcsec:.3f} arcsec",
            scientific_significance="This is the angular separation of the observation field centers, not a measured source-centroid displacement.",
        ),
    ]

    if is_demo:
        baseline_summary = "with illustrative sequence labels and no scientific time baseline"
    elif date_a is not None and date_b is not None:
        baseline_summary = (
            f"over {baseline_days:.1f} days"
            if baseline_days > 0
            else "at the same timestamp (no annualized rate)"
        )
    else:
        baseline_summary = "with an unavailable time baseline"
    rate_summary = (
        f" (annualized field-center offset rate: {annualized_field_center_rate:.2f} arcsec/year)"
        if annualized_field_center_rate is not None
        else ""
    )
    flux_summary = (
        f" The supplied flux metadata differs by {flux_diff_pct:+.2f}% relative to A."
        if flux_diff_pct is not None
        else ""
    )
    reason_summary = f" Image comparison unavailable: {' '.join(reasons)}" if reasons else ""
    summary = (
        f"Field centers differ by {separation_arcsec:.3f} arcsec {baseline_summary}"
        f"{rate_summary}.{flux_summary} This is not a measurement of target proper motion."
        f"{reason_summary}"
    )
    if is_demo:
        recommendation = (
            "Curated reference images have illustrative sequence dates and are not "
            "SPHEREx observations. Treat the field-center offset as descriptive context only."
        )
    elif not reasons:
        recommendation = (
            "Treat the field-center offset and catalog flux ratio as descriptive "
            "metadata only. Source proper motion requires measured, registered "
            "source centroids and astrometric uncertainty estimates."
        )
    else:
        recommendation = (
            "The field-center and valid epoch metrics remain available. For pixel or "
            "flux comparison, select distinct observations from the same band with nearby fields."
        )

    return CompareResponse(
        obs_id_a=obs_a.observation_id,
        obs_id_b=obs_b.observation_id,
        is_compatible=not reasons,
        incompatibility_reason=" ".join(reasons) or None,
        temporal_baseline_days=reported_baseline_days,
        angular_separation_arcsec=separation_arcsec,
        flux_differential_pct=flux_diff_pct,
        difference_image_url=(
            f"/api/diff?obs_a={obs_a.observation_id}"
            f"&obs_b={obs_b.observation_id}&mode=diff"
            if not reasons
            else None
        ),
        metrics=metrics,
        analysis_summary=summary,
        recommendation=recommendation,
    )
