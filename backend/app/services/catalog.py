from typing import List, Dict, Optional
import os
import re
import threading
from pathlib import Path
from app.models.schemas import TargetInfo, ObservationRecord
from app.config import settings

CURATED_TARGETS: Dict[str, TargetInfo] = {
    "wise_0855": TargetInfo(
        id="wise_0855",
        name="WISE 0855-0714",
        ra=133.79510,
        dec=-7.24510,
        description="Known Y-type brown dwarf included as a named search target. Its curated reference images are not SPHEREx observations.",
        object_type="Y-type brown dwarf",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="Explore the target field; the current tools do not detect or characterize the object.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=WISE%200855-0714"
    ),
    "barnards_star": TargetInfo(
        id="barnards_star",
        name="Barnard's Star",
        ra=269.45208,
        dec=4.69339,
        description="Nearby red dwarf included as a named search target. Curated reference images do not measure its motion.",
        object_type="Red dwarf star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="Compare reference fields; the current tools do not measure source motion.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Barnard%27s%20Star"
    ),
    "epsilon_indi": TargetInfo(
        id="epsilon_indi",
        name="Epsilon Indi Ba/Bb",
        ra=331.04415,
        dec=-56.78284,
        description="Epsilon Indi Ba/Bb is a brown-dwarf pair included as a named search target. Curated reference images do not resolve or measure the pair.",
        object_type="Brown-dwarf pair",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="Inspect the named target; binary deblending is not performed.",
        source_url="https://simbad.u-strasbg.fr/simbad/sim-id?Ident=Epsilon+Indi+B"
    ),
    "rw_aurigae": TargetInfo(
        id="rw_aurigae",
        name="RW Aurigae",
        ra=76.95375,
        dec=30.40111,
        description="Young stellar system included as a named search target. Curated reference images do not demonstrate disk changes.",
        object_type="Young stellar system",
        proper_motion=None,
        spectral_interest="The 9.8 µm silicate feature is outside SPHEREx's 0.75–5.00 µm range; any in-band variability must be evaluated from released archive data, not inferred from the local reference images.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A variable young stellar system provides time-domain context; curated reference images do not demonstrate disk changes or a SPHEREx detection.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=RW%20Aur"
    ),
    "r_draconis": TargetInfo(
        id="r_draconis",
        name="R Draconis",
        ra=248.33750,
        dec=66.71194,
        description="Mira-type variable star included as a named search target. Curated reference images do not measure its brightness or period.",
        object_type="Mira-type variable star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A known variable star provides time-domain context; ORBITAL does not derive its period or mass-loss properties.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=R%20Dra"
    ),
    "kapteyn": TargetInfo(
        id="kapteyn",
        name="Kapteyn's Star",
        ra=77.91917,
        dec=-45.01833,
        description="Nearby red dwarf included as an additional named search target. Curated reference images do not measure its velocity.",
        object_type="Red dwarf star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A known high-proper-motion star is useful context for long-baseline astrometry; ORBITAL does not measure its velocity.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Kapteyn%27s%20Star"
    ),
    "wolf_359": TargetInfo(
        id="wolf_359",
        name="Wolf 359 (CN Leonis)",
        ra=164.12083,
        dec=7.01472,
        description="Nearby red dwarf included as an additional named search target. ORBITAL does not identify flares in its reference images.",
        object_type="Red dwarf star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A nearby flare star provides time-domain context; ORBITAL does not identify or measure a flare.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Wolf%20359"
    ),
    "mira": TargetInfo(
        id="mira",
        name="Mira (Omicron Ceti)",
        ra=34.84042,
        dec=-2.97778,
        description="Mira-type variable star included as an additional named search target. Curated reference images do not measure its light curve.",
        object_type="Mira-type variable star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A well-known variable star provides context for time-domain astronomy; ORBITAL does not produce a measured light curve.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Mira"
    ),
    "teegarden": TargetInfo(
        id="teegarden",
        name="Teegarden's Star",
        ra=43.25375,
        dec=16.88139,
        description="Nearby red dwarf included as an additional named search target. Curated reference images do not measure its motion.",
        object_type="Red dwarf star",
        proper_motion=None,
        spectral_interest="Reference context only; these image previews do not contain extracted spectra.",
        distance_ly=None,
        magnitude=None,
        challenge_relevance="A known nearby high-proper-motion star provides context for multi-epoch inspection; ORBITAL does not measure its motion.",
        source_url="https://simbad.cds.unistra.fr/simbad/sim-id?Ident=Teegarden%27s%20Star"
    )
}

SPHEREX_CURATED_OBSERVATIONS: List[ObservationRecord] = [
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--59cacf82a176",
        target_name="WISE 0855-0714",
        ra=134.41458,
        dec=-9.00414,
        observation_date="2025-05-05T16:48:02.419Z",
        instrument="SPHEREx",
        band="SPHEREx-D3",
        wavelength_range="1.63–2.43 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W19_1B/l2b-v27-2026-197/3/level2_2025W19_1B_0116_1D3_spx_l2b-v27-2026-197.fits?center=133.795100%2C-7.245100&size=0.050000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--59cacf82a176",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-09-27 23:59:28. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2025W19_1B_0116_1/D3. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--b87e92e69420",
        target_name="WISE 0855-0714",
        ra=134.09684,
        dec=-7.78643,
        observation_date="2025-12-12T06:47:16.253Z",
        instrument="SPHEREx",
        band="SPHEREx-D3",
        wavelength_range="1.63–2.43 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W50_2A/l2b-v27-2026-210/3/level2_2025W50_2A_0232_1D3_spx_l2b-v27-2026-210.fits?center=133.795100%2C-7.245100&size=0.050000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--b87e92e69420",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-10-06 12:29:32. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2025W50_2A_0232_1/D3. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--31de4af59697",
        target_name="Barnard's Star",
        ra=269.45208,
        dec=4.69339,
        observation_date="2025-08-27T05:06:02.592Z",
        instrument="SPHEREx",
        band="SPHEREx-D1",
        wavelength_range="0.75–1.12 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W35_1A/l2b-v27-2026-230/1/level2_2025W35_1A_0432_4D1_spx_l2b-v27-2026-230.fits?center=269.452000%2C4.693000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--31de4af59697",
        exposure_time=113.58,
        spatial_resolution_arcsec=6.20,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="SPHEREx DR1 Level-2 science image from detector array D1. Survey pass 1."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--f1f6543752f8",
        target_name="Barnard's Star",
        ra=269.45208,
        dec=4.69339,
        observation_date="2026-09-02T06:10:07.910Z",
        instrument="SPHEREx",
        band="SPHEREx-D1",
        wavelength_range="0.75–1.12 µm",
        data_source="NASA/IPAC IRSA spherex_qr3",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/qr3/level2/2026W36_1A/l2b-v27-2026-252/1/level2_2026W36_1A_0510_1D1_spx_l2b-v27-2026-252.fits?center=269.452000%2C4.693000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--f1f6543752f8",
        exposure_time=113.58,
        spatial_resolution_arcsec=6.20,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="SPHEREx QR3 Level-2 science image from detector array D1. Survey pass 2 (+371.0 days)."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--0cba7e2a7228",
        target_name="Barnard's Star",
        ra=269.45208,
        dec=4.69339,
        observation_date="2025-08-15T20:45:11.376Z",
        instrument="SPHEREx",
        band="SPHEREx-D6",
        wavelength_range="4.41–5.01 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W33_2C/l2b-v27-2026-228/6/level2_2025W33_2C_0321_1D6_spx_l2b-v27-2026-228.fits?center=269.452000%2C4.693000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--0cba7e2a7228",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="SPHEREx DR1 Level-2 science image from detector array D6."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--498bacc86bd1",
        target_name="Epsilon Indi Ba/Bb",
        ra=331.04415,
        dec=-56.78284,
        observation_date="2025-04-24T20:31:57.101Z",
        instrument="SPHEREx",
        band="SPHEREx-D2",
        wavelength_range="1.10–1.65 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W17_4B/l2b-v27-2026-196/2/level2_2025W17_4B_0017_1D2_spx_l2b-v27-2026-196.fits?center=330.279000%2C-56.787000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--498bacc86bd1",
        exposure_time=113.58,
        spatial_resolution_arcsec=5.12,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="SPHEREx DR1 Level-2 science image from detector array D2. Epoch 1 pass."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--aa3a782faede",
        target_name="Epsilon Indi Ba/Bb",
        ra=331.04415,
        dec=-56.78284,
        observation_date="2026-10-02T11:28:25.766Z",
        instrument="SPHEREx",
        band="SPHEREx-D2",
        wavelength_range="1.10–1.65 µm",
        data_source="NASA/IPAC IRSA spherex_qr3",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/qr3/level2/2026W40_2A/l2b-v27-2026-285/2/level2_2026W40_2A_0216_2D2_spx_l2b-v27-2026-285.fits?center=330.279000%2C-56.787000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--aa3a782faede",
        exposure_time=113.58,
        spatial_resolution_arcsec=5.12,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="SPHEREx QR3 Level-2 science image from detector array D2. Epoch 2 pass (+525.6 days)."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--dfdafcc56a5c",
        target_name="RW Aurigae",
        ra=75.11186,
        dec=31.56000,
        observation_date="2025-09-01T10:04:17.501Z",
        instrument="SPHEREx",
        band="SPHEREx-D1",
        wavelength_range="0.75–1.12 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W36_1A/l2b-v27-2026-232/1/level2_2025W36_1A_0095_1D1_spx_l2b-v27-2026-232.fits?center=77.265000%2C30.401000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--dfdafcc56a5c",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-10-04 14:04:49. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2025W36_1A_0095_1/D1. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--81e1ef2e951c",
        target_name="RW Aurigae",
        ra=77.81991,
        dec=30.95044,
        observation_date="2026-03-04T07:54:38.045Z",
        instrument="SPHEREx",
        band="SPHEREx-D1",
        wavelength_range="0.75–1.12 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2026W10_1A/l2b-v27-2026-229/1/level2_2026W10_1A_0445_1D1_spx_l2b-v27-2026-229.fits?center=77.265000%2C30.401000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--81e1ef2e951c",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-10-08 13:43:32. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2026W10_1A_0445_1/D1. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--7d4ee047c78e",
        target_name="R Draconis",
        ra=253.63363,
        dec=67.03898,
        observation_date="2025-05-16T22:56:23.626Z",
        instrument="SPHEREx",
        band="SPHEREx-D3",
        wavelength_range="1.63–2.43 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W20_2D/l2b-v27-2026-198/3/level2_2025W20_2D_0243_1D3_spx_l2b-v27-2026-198.fits?center=248.337000%2C66.868000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--7d4ee047c78e",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-09-28 07:20:04. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2025W20_2D_0243_1/D3. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
    ObservationRecord(
        observation_id="SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--79b3f0593d13",
        target_name="R Draconis",
        ra=244.30456,
        dec=66.17111,
        observation_date="2025-12-26T05:13:59.779Z",
        instrument="SPHEREx",
        band="SPHEREx-D3",
        wavelength_range="1.63–2.43 µm",
        data_source="NASA/IPAC IRSA spherex_dr1",
        is_demo=False,
        fits_url="https://irsa.ipac.caltech.edu/ibe/data/spherex/dr1/level2/2025W52_2A/l2b-v27-2026-211/3/level2_2025W52_2A_0161_2D3_spx_l2b-v27-2026-211.fits?center=248.337000%2C66.868000&size=0.100000",
        preview_url="/api/images/SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--79b3f0593d13",
        exposure_time=113.58,
        spatial_resolution_arcsec=3.08,
        flux_density=None,
        quality_flag="Archive quality flag unavailable",
        notes="Live SIA result from spherex_dr1. Archive release date: 2026-10-06 19:20:38. Archive dataset ID: ivo://irsa.ipac/spherex_dr1?2025W52_2A_0161_2/D3. Metadata and access URL supplied by NASA/IPAC IRSA."
    ),
]

HISTORICAL_DSS_OBSERVATIONS: List[ObservationRecord] = [
    ObservationRecord(
        observation_id="DSS-REF-W0855-P1",
        target_name="WISE 0855-0714",
        ra=133.79510,
        dec=-7.24510,
        observation_date="2025-05-15T14:22:10Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=08+55+10.83&dec=-07+14+42.5&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/wise0855_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-W0855-P2",
        target_name="WISE 0855-0714",
        ra=133.79525,
        dec=-7.24522,
        observation_date="2025-11-18T09:41:05Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=08+55+10.83&dec=-07+14+42.5&v=poss2ukstu_red&format=FITS",
        preview_url="/targets/wise0855_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-W0855-P3",
        target_name="WISE 0855-0714",
        ra=133.79540,
        dec=-7.24535,
        observation_date="2026-05-20T18:15:30Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=08+55+10.83&dec=-07+14+42.5&v=poss1_red&format=FITS",
        preview_url="/targets/wise0855_epoch3.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),

    ObservationRecord(
        observation_id="DSS-REF-BARNARD-P1",
        target_name="Barnard's Star",
        ra=269.45208,
        dec=4.69339,
        observation_date="2025-05-02T11:04:19Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=17+57+48.5&dec=+04+41+36&v=poss1_red&format=FITS",
        preview_url="/targets/barnard_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-BARNARD-P2",
        target_name="Barnard's Star",
        ra=269.45197,
        dec=4.69486,
        observation_date="2025-11-06T03:50:42Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=17+57+48.5&dec=+04+41+36&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/barnard_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-BARNARD-P3",
        target_name="Barnard's Star",
        ra=269.45185,
        dec=4.69632,
        observation_date="2026-05-10T14:12:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=17+57+48.5&dec=+04+41+36&v=quickv&format=FITS",
        preview_url="/targets/barnard_epoch3.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),

    ObservationRecord(
        observation_id="DSS-REF-RWAUR-P1",
        target_name="RW Aurigae",
        ra=76.95375,
        dec=30.40111,
        observation_date="2025-05-18T20:11:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=05+07+48.9&dec=+30+24+04&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/rwaur_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-RWAUR-P2",
        target_name="RW Aurigae",
        ra=76.95375,
        dec=30.40111,
        observation_date="2025-11-22T08:14:22Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=05+07+48.9&dec=+30+24+04&v=poss2ukstu_red&format=FITS",
        preview_url="/targets/rwaur_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),

    ObservationRecord(
        observation_id="DSS-REF-RDRA-P1",
        target_name="R Draconis",
        ra=248.33750,
        dec=66.71194,
        observation_date="2025-05-22T02:00:10Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=16+33+21.0&dec=+66+42+43&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/rdra_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-RDRA-P2",
        target_name="R Draconis",
        ra=248.33750,
        dec=66.71194,
        observation_date="2025-11-26T16:45:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=16+33+21.0&dec=+66+42+43&v=poss2ukstu_blue&format=FITS",
        preview_url="/targets/rdra_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),

    ObservationRecord(
        observation_id="DSS-REF-EPSINDI-P1",
        target_name="Epsilon Indi Ba/Bb",
        ra=331.04415,
        dec=-56.78284,
        observation_date="2025-06-12T19:20:10Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=22+04+10.6&dec=-56+46+58.2&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/epsindi_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-EPSINDI-P2",
        target_name="Epsilon Indi Ba/Bb",
        ra=331.04415,
        dec=-56.78284,
        observation_date="2025-12-14T05:10:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=22+04+10.6&dec=-56+46+58.2&v=poss2ukstu_red&format=FITS",
        preview_url="/targets/epsindi_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-KAPTEYN-P1",
        target_name="Kapteyn's Star",
        ra=77.91917,
        dec=-45.01833,
        observation_date="2025-05-28T14:10:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=05+11+40.6&dec=-45+01+06&v=poss2ukstu_red&format=FITS",
        preview_url="/targets/kapteyn_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-KAPTEYN-P2",
        target_name="Kapteyn's Star",
        ra=77.91917,
        dec=-45.01833,
        observation_date="2025-11-30T08:25:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=05+11+40.6&dec=-45+01+06&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/kapteyn_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-WOLF359-P1",
        target_name="Wolf 359 (CN Leonis)",
        ra=164.12083,
        dec=7.01472,
        observation_date="2025-05-01T22:15:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=10+56+29.0&dec=+07+00+53&v=poss1_red&format=FITS",
        preview_url="/targets/wolf359_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-WOLF359-P2",
        target_name="Wolf 359 (CN Leonis)",
        ra=164.12083,
        dec=7.01472,
        observation_date="2025-11-04T04:40:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=10+56+29.0&dec=+07+00+53&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/wolf359_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-MIRA-P1",
        target_name="Mira (Omicron Ceti)",
        ra=34.84042,
        dec=-2.97778,
        observation_date="2025-06-02T19:00:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=02+19+20.8&dec=-02+58+40&v=poss1_red&format=FITS",
        preview_url="/targets/mira_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-MIRA-P2",
        target_name="Mira (Omicron Ceti)",
        ra=34.84042,
        dec=-2.97778,
        observation_date="2025-12-05T03:30:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=02+19+20.8&dec=-02+58+40&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/mira_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-TEEGARDEN-P1",
        target_name="Teegarden's Star",
        ra=43.25375,
        dec=16.88139,
        observation_date="2025-06-18T16:20:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=02+53+00.9&dec=+16+52+53&v=poss1_red&format=FITS",
        preview_url="/targets/teegarden_epoch1.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    ),
    ObservationRecord(
        observation_id="DSS-REF-TEEGARDEN-P2",
        target_name="Teegarden's Star",
        ra=43.25375,
        dec=16.88139,
        observation_date="2025-12-22T21:10:00Z",
        instrument="STScI Digitized Sky Survey photographic plate",
        band="Reference plate survey",
        wavelength_range="Photographic response; not a SPHEREx band",
        data_source="STScI Digitized Sky Survey reference cutout; not SPHEREx",
        is_demo=True,
        fits_url="https://archive.stsci.edu/cgi-bin/dss_search?ra=02+53+00.9&dec=+16+52+53&v=poss2ukstu_ir&format=FITS",
        preview_url="/targets/teegarden_epoch2.png",
        exposure_time=None,
        spatial_resolution_arcsec=None,
        flux_density=None,
        quality_flag="REFERENCE_ONLY",
        notes="DSS reference image with an illustrative sequence date; not SPHEREx data."
    )
]

MAX_CURATED_EPOCHS_PER_TARGET = 12

REFERENCE_PLATE_METADATA = {
    "DSS-REF-W0855-P1": ("SERC-I", "A44G"),
    "DSS-REF-W0855-P2": ("SERC-ER", "A0N6"),
    "DSS-REF-W0855-P3": ("POSSI-E", "0DAG"),
    "DSS-REF-BARNARD-P1": ("POSSI-E", "099V"),
    "DSS-REF-BARNARD-P2": ("POSSII-N", "A1GM"),
    "DSS-REF-BARNARD-P3": ("Pal-QV", "02V7"),
    "DSS-REF-RWAUR-P1": ("POSSII-N", "A28Z"),
    "DSS-REF-RWAUR-P2": ("POSSII-F", "A26S"),
    "DSS-REF-RDRA-P1": ("POSSII-N", "A1ZC"),
    "DSS-REF-RDRA-P2": ("POSSII-J", "A06P"),
    "DSS-REF-EPSINDI-P1": ("SERC-I", "A3A1"),
    "DSS-REF-EPSINDI-P2": ("AAO-SES", "A0V6"),
    "DSS-REF-KAPTEYN-P1": ("AAO-SES", "A00C"),
    "DSS-REF-KAPTEYN-P2": ("SERC-I", "A327"),
    "DSS-REF-WOLF359-P1": ("POSSI-E", "06Z7"),
    "DSS-REF-WOLF359-P2": ("POSSII-N", "A421"),
    "DSS-REF-MIRA-P1": ("POSSI-E", "0DA0"),
    "DSS-REF-MIRA-P2": ("SERC-I", "A448"),
    "DSS-REF-TEEGARDEN-P1": ("POSSI-E", "06Z4"),
    "DSS-REF-TEEGARDEN-P2": ("POSSII-N", "A2UE"),
}


def _normalized_target_name(name: str) -> str:
    return re.sub(r"[\W_]+", "", name.casefold())


_TARGETS_BY_NORMALIZED_NAME = {
    _normalized_target_name(target.name): target for target in CURATED_TARGETS.values()
}

CURATED_OBSERVATIONS: List[ObservationRecord] = SPHEREX_CURATED_OBSERVATIONS + HISTORICAL_DSS_OBSERVATIONS

for _observation in HISTORICAL_DSS_OBSERVATIONS:
    _target = _TARGETS_BY_NORMALIZED_NAME.get(
        _normalized_target_name(_observation.target_name)
    )
    if _target is not None:
        _observation.ra = _target.ra
        _observation.dec = _target.dec

    _survey_name, _plate_id = REFERENCE_PLATE_METADATA.get(
        _observation.observation_id, ("DSS", "unknown")
    )

    _observation.instrument = "STScI Digitized Sky Survey photographic plate"
    _observation.band = f"Reference plate survey: {_survey_name}"
    _observation.wavelength_range = "Photographic response; not a SPHEREx band"
    _observation.data_source = (
        f"STScI DSS cutout; survey {_survey_name}, plate {_plate_id}; not SPHEREx"
    )
    _observation.exposure_time = None
    _observation.spatial_resolution_arcsec = None
    _observation.flux_density = None
    _observation.quality_flag = "REFERENCE_ONLY"
    _observation.notes = (
        f"The displayed date is an illustrative sequence date, not the plate date. "
        f"The source FITS header identifies survey {_survey_name}, plate {_plate_id}. "
        "This is a DSS photographic reference image, not SPHEREx data or a target "
        "flux or motion measurement."
    )


RUNTIME_OBSERVATIONS: Dict[str, ObservationRecord] = {}
_RUNTIME_OBSERVATION_DIR = settings.cache_dir / "runtime_observations"


def _runtime_observation_path(obs_id: str) -> Path:
    from hashlib import sha256

    return _RUNTIME_OBSERVATION_DIR / f"{sha256(obs_id.encode('utf-8')).hexdigest()}.json"


def register_observation(obs: ObservationRecord):
    RUNTIME_OBSERVATIONS[obs.observation_id] = obs
    try:
        _RUNTIME_OBSERVATION_DIR.mkdir(parents=True, exist_ok=True)
        destination = _runtime_observation_path(obs.observation_id)
        temporary = destination.with_suffix(
            f".{os.getpid()}.{threading.get_ident()}.tmp"
        )
        temporary.write_text(obs.model_dump_json(), encoding="utf-8")
        temporary.replace(destination)
    except OSError:
        pass


def get_curated_observations_for_target(name: str) -> List[ObservationRecord]:
    name_clean = _normalized_target_name(name)
    if not name_clean:
        return []
    results = []
    for obs in CURATED_OBSERVATIONS:
        obs_clean = _normalized_target_name(obs.target_name)
        if name_clean in obs_clean or obs_clean in name_clean:
            results.append(obs)
    return sorted(results, key=lambda obs: obs.observation_date)[
        :MAX_CURATED_EPOCHS_PER_TARGET
    ]


def get_observation_by_id(obs_id: str) -> Optional[ObservationRecord]:
    if obs_id in RUNTIME_OBSERVATIONS:
        return RUNTIME_OBSERVATIONS[obs_id]
    for obs in CURATED_OBSERVATIONS:
        if obs.observation_id == obs_id:
            return obs
    try:
        cached = _runtime_observation_path(obs_id)
        if cached.is_file():
            record = ObservationRecord.model_validate_json(
                cached.read_text(encoding="utf-8")
            )
            if record.observation_id == obs_id:
                RUNTIME_OBSERVATIONS[obs_id] = record
                return record
    except (OSError, ValueError):
        pass
    return None
