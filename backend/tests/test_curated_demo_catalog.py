import asyncio
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

from app.routes.images import CURATED_ARCHIVE_PREVIEWS
from app.routes.search import search_sky
from app.services.catalog import (
    CURATED_OBSERVATIONS,
    CURATED_TARGETS,
    HISTORICAL_DSS_OBSERVATIONS,
    MAX_CURATED_EPOCHS_PER_TARGET,
    get_curated_observations_for_target,
)
from app.models.schemas import SearchRequest


class CuratedDemoCatalogTests(unittest.TestCase):
    def test_curated_target_observations_are_capped_and_chronological(self):
        for target in CURATED_TARGETS.values():
            with self.subTest(target=target.name):
                observations = get_curated_observations_for_target(target.name)
                dates = [observation.observation_date for observation in observations]

                self.assertLessEqual(len(observations), MAX_CURATED_EPOCHS_PER_TARGET)
                self.assertEqual(dates, sorted(dates))
                self.assertTrue(observations)

    def test_curated_records_are_labeled_as_reference_demos(self):
        for observation in HISTORICAL_DSS_OBSERVATIONS:
            with self.subTest(observation=observation.observation_id):
                self.assertTrue(observation.is_demo)
                self.assertIn("Digitized Sky Survey", observation.instrument)
                self.assertIn("not SPHEREx", observation.data_source)
                self.assertEqual(observation.quality_flag, "REFERENCE_ONLY")
                self.assertIsNone(observation.flux_density)
                self.assertIsNone(observation.exposure_time)
                self.assertIsNone(observation.spatial_resolution_arcsec)
                self.assertIn("illustrative sequence date", observation.notes)

    def test_each_curated_observation_has_a_readable_local_preview(self):
        for observation in HISTORICAL_DSS_OBSERVATIONS:
            with self.subTest(observation=observation.observation_id):
                preview_path = CURATED_ARCHIVE_PREVIEWS.get(observation.observation_id)
                self.assertIsNotNone(preview_path)
                self.assertTrue(Path(preview_path).is_file())
                with Image.open(preview_path) as preview:
                    preview.verify()
                    self.assertGreater(preview.width, 1)
                    self.assertGreater(preview.height, 1)

    def test_demo_search_limits_coordinate_matches(self):
        template = next(
            observation for observation in CURATED_OBSERVATIONS if observation.is_demo
        )
        observations = [
            template.model_copy(
                update={
                    "observation_id": f"TEST-{index}",
                    "observation_date": f"2025-01-{index:02d}T00:00:00Z",
                }
            )
            for index in range(1, 16)
        ]

        async def run_search():
            with patch("app.routes.search.CURATED_OBSERVATIONS", observations):
                return await search_sky(
                    SearchRequest(
                        ra=template.ra,
                        dec=template.dec,
                        radius=1.0,
                        demo_mode=True,
                    )
                )

        response = asyncio.run(run_search())
        self.assertEqual(len(response.observations), MAX_CURATED_EPOCHS_PER_TARGET)
        self.assertEqual(response.total_results, MAX_CURATED_EPOCHS_PER_TARGET)
        self.assertTrue(all(observation.is_demo for observation in response.observations))


if __name__ == "__main__":
    unittest.main()
