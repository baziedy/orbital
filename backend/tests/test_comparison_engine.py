import unittest

from app.models.schemas import ObservationRecord
from app.services.comparison_engine import (
    analyze_observation_pair,
    compute_angular_separation_arcsec,
    parse_iso_date,
)


def observation(
    observation_id: str,
    *,
    ra: float = 10.0,
    dec: float = 20.0,
    date: str = "2025-01-01T00:00:00Z",
    band: str = "Band 2",
    flux: str | None = "10 mJy",
    is_demo: bool = False,
) -> ObservationRecord:
    return ObservationRecord(
        observation_id=observation_id,
        target_name="Test target",
        ra=ra,
        dec=dec,
        observation_date=date,
        instrument="Test instrument",
        band=band,
        wavelength_range="1.1 - 1.7 µm",
        data_source="Test source",
        is_demo=is_demo,
        preview_url="/test.png",
        exposure_time=1.0,
        spatial_resolution_arcsec=1.0,
        flux_density=flux,
        quality_flag="NOMINAL",
    )


class ComparisonEngineTests(unittest.TestCase):
    def test_angular_separation_handles_right_ascension_wraparound(self) -> None:
        separation = compute_angular_separation_arcsec(359.999, 0.0, 0.001, 0.0)
        self.assertAlmostEqual(separation, 7.2, places=6)

    def test_angular_separation_rejects_invalid_coordinates(self) -> None:
        with self.assertRaises(ValueError):
            compute_angular_separation_arcsec(360.0, 0.0, 0.0, 0.0)

    def test_naive_iso_date_is_treated_as_utc(self) -> None:
        naive = parse_iso_date("2025-01-01T00:00:00")
        utc = parse_iso_date("2025-01-01T00:00:00Z")
        self.assertEqual(naive, utc)

    def test_same_band_flux_difference_is_relative_to_a(self) -> None:
        result = analyze_observation_pair(
            observation("A", flux="10 mJy"),
            observation("B", date="2025-02-01T00:00:00Z", flux="11 mJy"),
        )
        self.assertTrue(result.is_compatible)
        self.assertEqual(result.flux_differential_pct, 10.0)
        self.assertIn("Field-Center Separation", [metric.name for metric in result.metrics])
        self.assertIn("not a measurement", result.analysis_summary.lower())

    def test_different_bands_are_not_comparable(self) -> None:
        result = analyze_observation_pair(
            observation("A", band="Band 1"),
            observation("B", band="Band 2", date="2025-02-01T00:00:00Z"),
        )
        self.assertFalse(result.is_compatible)
        self.assertIsNone(result.flux_differential_pct)
        self.assertIn("different spectral bands", result.incompatibility_reason or "")
        self.assertIn("Field-Center Separation", [metric.name for metric in result.metrics])
        self.assertEqual(result.temporal_baseline_days, 31.0)

    def test_missing_or_invalid_flux_is_not_reported_as_zero(self) -> None:
        result = analyze_observation_pair(
            observation("A", flux="not a flux"),
            observation("B", date="2025-02-01T00:00:00Z", flux="11 mJy"),
        )
        self.assertTrue(result.is_compatible)
        self.assertIsNone(result.flux_differential_pct)
        flux_metric = next(metric for metric in result.metrics if metric.name == "Photometric Flux")
        self.assertIn("Unavailable", flux_metric.delta)

    def test_invalid_dates_keep_available_metrics_without_fabricating_rate(self) -> None:
        invalid = analyze_observation_pair(
            observation("A", date="not-a-date"),
            observation("B", date="2025-02-01T00:00:00Z"),
        )
        same = analyze_observation_pair(observation("A"), observation("B"))
        self.assertTrue(invalid.is_compatible)
        self.assertTrue(same.is_compatible)
        self.assertIn("Field-Center Separation", [metric.name for metric in invalid.metrics])
        self.assertIn("unavailable time baseline", invalid.analysis_summary)
        self.assertNotIn("annualized field-center offset rate:", invalid.analysis_summary)
        self.assertNotIn("annualized field-center offset rate:", same.analysis_summary)
        epoch_metric = next(metric for metric in invalid.metrics if metric.name == "Observation Epoch")
        self.assertIn("Unavailable", epoch_metric.delta)


if __name__ == "__main__":
    unittest.main()
