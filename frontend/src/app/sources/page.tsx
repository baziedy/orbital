import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";

type Source = {
  name: string;
  url: string;
  role: string;
  status?: string;
};

const archiveSources: Source[] = [
  {
    name: "SPHEREx Data Release 1 (DR1) — DOI: 10.26131/IRSA678",
    url: "https://doi.org/10.26131/IRSA678",
    role: "Official NASA/IPAC Infrared Science Archive DOI and catalog dataset for the first full-sky release of SPHEREx near-infrared spectral images.",
    status: "Primary data archive",
  },
  {
    name: "SPHEREx Quick Release 3 (QR3) — DOI: 10.26131/IRSA662",
    url: "https://doi.org/10.26131/IRSA662",
    role: "NASA/IPAC Infrared Science Archive DOI for SPHEREx Quick Release 3 multi-epoch repeat observation products.",
    status: "Repeat epoch archive",
  },
  {
    name: "NASA/IPAC SPHEREx Archive",
    url: "https://irsa.ipac.caltech.edu/Missions/spherex.html",
    role: "Mission archive information and access to released SPHEREx products.",
    status: "Official archive",
  },
  {
    name: "IRSA Simple Image Access service",
    url: "https://irsa.ipac.caltech.edu/SIA",
    role: "The backend queries current SPHEREx DR1 and QR3 science-image collections, then requests an on-premises spatial cutout for display.",
    status: "Queried by the app",
  },
  {
    name: "SPHEREx Data Access Guide",
    url: "https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/",
    role: "IRSA documentation for current SPHEREx data products and programmatic access.",
  },
  {
    name: "SPHEREx Data Products Guide",
    url: "https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-products/",
    role: "IRSA documentation for the Level-2 Spectral Image MEF, including its IMAGE, FLAGS, VARIANCE, ZODI, ePSF, and WCS-WAVE extensions.",
  },
  {
    name: "IRSA SPHEREx Cutout Service",
    url: "https://irsa.ipac.caltech.edu/data/SPHEREx/docs/cutout_tool.html",
    role: "Returns spatial subsets of the selected SPHEREx FITS product while preserving its scientific extensions and metadata.",
    status: "Queried by the app",
  },
  {
    name: "IVOA Simple Image Access (SIA) Recommendation",
    url: "https://ivoa.net/documents/SIA/20151223/",
    role: "Standard describing the image discovery protocol used by the live archive query.",
  },
  {
    name: "NASA SPHEREx mission overview",
    url: "https://science.nasa.gov/mission/spherex/",
    role: "Mission description and survey context.",
  },
  {
    name: "SPHEREx in Orbit (artist's concept)",
    url: "https://science.nasa.gov/photojournal/spherex-in-orbit-artists-concept/",
    role: "NASA/JPL-Caltech illustration used as decorative mission artwork; it is not an observational image.",
    status: "Decorative artist's concept",
  },
  {
    name: "STScI Digitized Sky Survey",
    url: "https://archive.stsci.edu/dss/",
    role: "DSS archive used as the reference-image source for curated demo sequences.",
    status: "Curated demo imagery",
  },
  {
    name: "MAST DSS Data Use Policy",
    url: "https://archive.stsci.edu/publishing/data-use",
    role: "DSS image rights depend on the original plate; MAST identifies a CC BY-NC-SA 4.0 license and asks users to acknowledge the original source and STScI.",
    status: "Image license and attribution",
  },
  {
    name: "STScI DSS FITS cutout service",
    url: "https://archive.stsci.edu/cgi-bin/dss_search?ra=08+55+10.83&dec=-07+14+42.5&v=poss2ukstu_red&format=FITS",
    role: "Example source FITS cutout for the WISE 0855-0714 DSS reference field.",
    status: "Example reference cutout",
  },
];

const catalogSources: Source[] = [
  {
    name: "SIMBAD Astronomical Database",
    url: "https://simbad.cds.unistra.fr/simbad/",
    role: "Object-identification and catalog-reference links for the nine curated challenge targets. Target facts in ORBITAL are static context, not fetched from SIMBAD on each page load.",
  },
  {
    name: "CDS Sesame name resolver",
    url: "https://cds.unistra.fr/cgi-bin/nph-sesame/-oxp/SNV?Barnard%27s%20Star",
    role: "Resolves supported typed object names to sky coordinates for searches.",
    status: "Queried by the app",
  },
  {
    name: "Aladin Lite",
    url: "https://aladin.cds.unistra.fr/AladinLite/",
    role: "Interactive sky-atlas viewer embedded in the Explore workspace.",
    status: "Embedded in the app",
  },
  {
    name: "AllWISE Explanatory Supplement",
    url: "https://irsa.ipac.caltech.edu/data/WISE/docs/release/AllWISE/expsup/",
    role: "Documentation for the AllWISE survey layer and its catalog context in the sky atlas.",
  },
  {
    name: "Two Micron All Sky Survey (2MASS)",
    url: "https://irsa.ipac.caltech.edu/Missions/2mass.html",
    role: "Survey overview for 2MASS. The local reference-image panel does not load 2MASS images.",
  },
  {
    name: "Gaia Data Release 3",
    url: "https://www.cosmos.esa.int/web/gaia/data-release-3",
    role: "Catalog reference only. The app does not query Gaia or use Gaia records in its calculations.",
    status: "Not queried by the app",
  },
];

const optionalChallengeResources: Source[] = [
  {
    name: "SPHEREx Tutorial Notebooks",
    url: "https://caltech-ipac.github.io/irsa-tutorials/spherex/",
    role: "IRSA notebook examples for querying and inspecting SPHEREx spectral-image data. ORBITAL uses its own SIA and cutout requests.",
    status: "Reference only",
  },
  {
    name: "WiseView",
    url: "https://github.com/backyardworlds/wiseview",
    role: "WISE/unWISE image-blinking tool listed as an inspiration resource; its images and code are not ingested by ORBITAL.",
    status: "Inspiration only",
  },
  {
    name: "Canadian Space Agency: NEOSSat",
    url: "https://www.asc-csa.gc.ca/eng/satellites/neossat/",
    role: "Mission overview for a separate Canadian telescope that observes asteroids, comets, satellites, space debris, and exoplanet systems.",
    status: "Optional partner resource",
  },
  {
    name: "CADC NEOSSat Archive",
    url: "https://www.cadc-ccda.hia.nrc-cnrc.gc.ca/en/neossat/",
    role: "Canadian Astronomy Data Centre access to NEOSSat observations; ORBITAL does not query or combine those data with SPHEREx.",
    status: "Not queried",
  },
  {
    name: "NEOSSat Data Tutorial",
    url: "https://github.com/asc-csa/NEOSSAT_Tutorial",
    role: "Canadian Space Agency Python tutorial for finding, downloading, and visualizing NEOSSat data; not used in ORBITAL's data pipeline.",
    status: "Reference only",
  },
  {
    name: "CSA NEOSSat Open Data Portal",
    url: "https://donnees-data.asc-csa.gc.ca/en/dataset/9ae3e718-8b6d-40b7-8aa4-858f00e84b30",
    role: "Canadian Space Agency open-data record for NEOSSat astronomy images; not used as an app data source.",
    status: "Not queried",
  },
];

const targetCatalogRecords: Source[] = [
  ["WISE 0855-0714", "WISE%200855-0714"],
  ["Barnard's Star", "Barnard%27s%20Star"],
  ["Epsilon Indi Ba/Bb", "Epsilon+Indi+B"],
  ["RW Aurigae", "RW%20Aur"],
  ["R Draconis", "R%20Dra"],
  ["Kapteyn's Star", "Kapteyn%27s%20Star"],
  ["Wolf 359 (CN Leonis)", "Wolf%20359"],
  ["Mira (Omicron Ceti)", "Mira"],
  ["Teegarden's Star", "Teegarden%27s%20Star"],
].map(([name, identifier]) => ({
  name,
  url: `https://simbad.cds.unistra.fr/simbad/sim-id?Ident=${identifier}`,
  role: "SIMBAD object record linked from the curated target context.",
}));

const methodSources: Source[] = [
  {
    name: "Astropy: coordinate separations and offsets",
    url: "https://docs.astropy.org/en/stable/coordinates/matchsep.html",
    role: "Reference for spherical-coordinate separation concepts. ORBITAL implements a great-circle haversine calculation in its comparison tools.",
  },
  {
    name: "NASA: Planet X",
    url: "https://science.nasa.gov/solar-system/planet-x/",
    role: "Background for the hypothetical Planet Nine scenario; NASA notes that the planet has not been observed and remains theoretical.",
  },
  {
    name: "NumPy: inverse hyperbolic sine",
    url: "https://numpy.org/doc/stable/reference/generated/numpy.arcsinh.html",
    role: "Reference for the asinh transform used in the display-only FITS preview stretch.",
  },
  {
    name: "Astropy FITS handling",
    url: "https://docs.astropy.org/en/stable/io/fits/",
    role: "Documentation for reading FITS data in the preview pipeline.",
  },
  {
    name: "NASA FITS Standard",
    url: "https://fits.gsfc.nasa.gov/standard40/fits_standard40aa-le.pdf",
    role: "Format standard for astronomical FITS data products.",
  },
  {
    name: "IVOA Observation Core data model",
    url: "https://ivoa.net/documents/ObsCore/20170509/",
    role: "Reference for common archive observation metadata and discovery fields.",
  },
  {
    name: "Pillow image processing",
    url: "https://pillow.readthedocs.io/en/stable/",
    role: "Library used to resize and encode display-preview PNG files.",
  },
];

function SourceList({ sources }: { sources: Source[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {sources.map((source) => (
        <li key={source.name}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full items-start justify-between gap-4 rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-4 transition-colors hover:border-[#111111] dark:hover:border-[#FFFFFF]"
          >
            <span className="space-y-1">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#111111]">
                {source.name}
                {source.status && (
                  <span className="rounded-sm bg-[#F0F9FF] dark:bg-[#161820] px-1.5 py-0.5 text-[9px] font-mono-sci uppercase tracking-wide text-[#0369A1] dark:text-[#9CA3AF]">
                    {source.status}
                  </span>
                )}
              </span>
              <span className="block text-xs leading-relaxed text-[#737373]">{source.role}</span>
            </span>
            <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0 text-[#8A8A83] group-hover:text-[#0284C7]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function SourcesPage() {
  return (
    <main className="min-h-screen bg-[#F7F7F5] text-[#111111]">
      <div className="mx-auto max-w-7xl space-y-14 px-6 py-12 md:py-16">
        <header className="max-w-3xl space-y-4">
          <span className="text-[10px] font-mono-sci font-bold uppercase tracking-[0.3em] text-[#0284C7]">
            Provenance &amp; methodology
          </span>
          <h1 className="font-editorial text-4xl tracking-tight sm:text-5xl">Sources &amp; Calculations</h1>
          <p className="text-sm leading-relaxed text-[#555555]">
            Explore the archives, catalogs, standards, and scientific references used by ORBITAL.
            Each entry explains whether the app queries it, embeds it, or cites it only as background.
          </p>
          <div className="rounded-sm border border-[#FDE68A] dark:border-[#B45309]/40 bg-[#FFFBEB] dark:bg-[#78350F]/20 p-4 text-xs leading-relaxed text-[#92400E] dark:text-[#FDE68A] space-y-2">
            <p className="font-semibold uppercase tracking-wider text-[11px]">
              NASA Space Apps Challenge Data &amp; Compliance Statement
            </p>
            <p className="italic">
              &quot;NASA does not endorse any non-U.S. Government entity and is not responsible for information contained on non-U.S. Government websites. For non-U.S. Government websites, participants must comply with any data use parameters of that specific website.&quot;
            </p>
            <p>
              ORBITAL is an independent educational web application created for the 2026 NASA Space Apps Challenge (&quot;Planet X and SPHEREx&quot;). It is not an official NASA website. Primary sky images and archive metadata are retrieved from NASA/IPAC IRSA DR1 (DOI: 10.26131/IRSA678) and QR3 (DOI: 10.26131/IRSA662). Curated precursor plates are historical STScI DSS photographic cutouts. Calculation outputs, simulated orbits, and spectral curves are educational display aids.
            </p>
            <p>
              <span className="font-semibold">AI assistance disclosure:</span> Language-model tools assisted with code development and project documentation. No AI-generated astronomical data, observation imagery, or scientific results are used; the illustrative spectral sonification is generated programmatically.
            </p>
          </div>

          <div className="rounded-sm border border-[#BAE6FD] dark:border-[#0369A1]/40 bg-[#F0F9FF] dark:bg-[#0C4A6E]/20 p-4 text-xs leading-relaxed text-[#0369A1] dark:text-[#BAE6FD] space-y-2.5">
            <p className="font-semibold uppercase tracking-wider text-[11px] text-[#0284C7] dark:text-[#38BDF8]">
              Required NASA/IPAC IRSA &amp; SPHEREx Mission Acknowledgment
            </p>
            <blockquote className="border-l-2 border-[#0284C7] pl-3 italic text-[#0F172A] dark:text-[#F1F5F9]">
              &quot;This publication makes use of data products from the Spectro-Photometer for the History of the Universe, Epoch of Reionization and Ices Explorer (SPHEREx), which is a joint project of the Jet Propulsion Laboratory and the California Institute of Technology, and is funded by the National Aeronautics and Space Administration.&quot;
            </blockquote>
            <blockquote className="border-l-2 border-[#0284C7] pl-3 italic text-[#0F172A] dark:text-[#F1F5F9]">
              &quot;This research has made use of the NASA/IPAC Infrared Science Archive, which is funded by the National Aeronautics and Space Administration and operated by the California Institute of Technology.&quot;
            </blockquote>
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
              Release DOIs: SPHEREx DR1 (<a href="https://doi.org/10.26131/IRSA678" target="_blank" rel="noopener noreferrer" className="underline font-semibold">10.26131/IRSA678</a>) &bull; SPHEREx QR3 (<a href="https://doi.org/10.26131/IRSA662" target="_blank" rel="noopener noreferrer" className="underline font-semibold">10.26131/IRSA662</a>).
            </p>
          </div>
        </header>

        <section className="space-y-4" aria-labelledby="archive-sources">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">01 / Data &amp; imagery</span>
            <h2 id="archive-sources" className="mt-1 font-editorial text-2xl">Archives and image services</h2>
          </div>
          <SourceList sources={archiveSources} />
        </section>

        <section className="space-y-4" aria-labelledby="optional-resources">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">02 / Challenge references</span>
            <h2 id="optional-resources" className="mt-1 font-editorial text-2xl">Tutorials and partner resources</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#737373]">
              These links include optional challenge resources and design inspiration. NEOSSat and CADC data are separate from SPHEREx and are not used by ORBITAL.
            </p>
          </div>
          <SourceList sources={optionalChallengeResources} />
        </section>

        <section className="space-y-4" aria-labelledby="catalog-sources">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">03 / Object context</span>
            <h2 id="catalog-sources" className="mt-1 font-editorial text-2xl">Catalogs and sky atlas</h2>
          </div>
          <SourceList sources={catalogSources} />
          <h3 className="pt-3 font-semibold text-[#111111]">Curated target records</h3>
          <SourceList sources={targetCatalogRecords} />
          <p className="text-[11px] leading-relaxed text-[#737373]">
            Each curated target card links to its corresponding SIMBAD object record. Values shown
            in the app are manually curated and can differ by catalog, band, epoch, or literature
            source; check the linked record before using them scientifically.
          </p>
        </section>

        <section id="calculation-methods" className="scroll-mt-24 space-y-5" aria-labelledby="calculation-sources">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">04 / Reproducibility</span>
            <h2 id="calculation-sources" className="mt-1 font-editorial text-2xl">What the calculations mean</h2>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#737373]">
              These equations describe the current app implementations. Coordinate offsets use
              input or archive field centers; image statistics use displayed pixels. Neither
              method measures a target centroid unless a separate calibrated astrometric workflow
              is performed.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-5">
              <h3 className="font-semibold">Angular separation and time baseline</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">
                Great-circle separation is calculated from RA/Dec with the haversine formula and
                converted from radians to arcseconds. The elapsed baseline is the absolute
                difference between the two timestamps; the annualized field-center rate is
                separation ÷ (days / 365.25).
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#737373]">
                This is a field-center offset rate, not measured stellar proper motion. See{" "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[0].url} target="_blank" rel="noopener noreferrer">
                  Astropy coordinate-separation documentation
                </a>.
              </p>
            </article>

            <article className="rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-5">
              <h3 className="font-semibold">Flux differences and image comparisons</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">
                When valid same-band flux metadata exists, the relative change is 100 ×
                (flux B − flux A) ÷ flux A. Uploaded-image comparisons instead resize images to a
                common display canvas, compute grayscale pixel statistics, and estimate a
                brightness-weighted image-center shift.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#737373]">
                Those pixel calculations are sensitive to image scaling and background; they are
                not WCS-registered or calibrated photometry. Curated demos omit invented flux
                values, so no demo flux difference is reported. Where an entered distance is
                available, the estimated tangential speed uses v<sub>t</sub> = 4.74047 ×
                μ<sub>arcsec/yr</sub> × d<sub>pc</sub>; because μ here can be a field-center
                offset rate, this speed is not necessarily the target&apos;s physical velocity.
              </p>
            </article>

            <article className="rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-5">
              <h3 className="font-semibold">Outer Solar System simulator</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">
                For a circular orbit around a one-solar-mass Sun, the simplified model uses
                P ≈ a<sup>3/2</sup> years and v ≈ 29.78 / √a km/s, where a is in AU. A six-month
                Earth-baseline parallax displacement is approximated as 2 × 206264.806 / d
                arcseconds for distance d in AU. Solar reflex speed is calculated as the modeled
                orbital speed multiplied by M<sub>planet</sub> / (M<sub>sun</sub> + M<sub>planet</sub>),
                using the entered mass in Earth masses.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#737373]">
                The model assumes circular motion and idealized geometry; it is not an orbit fit,
                detection, or prediction of a confirmed Planet Nine. Background:{" "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[1].url} target="_blank" rel="noopener noreferrer">
                  NASA Planet X overview
                </a>.
              </p>
            </article>

            <article className="rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-5">
              <h3 className="font-semibold">Illustrative spectral inspector</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">
                The current target-shaped spectral curves are generated by illustrative
                client-side functions, not retrieved spectra or measured SPHEREx data. Molecular
                feature labels and sonification are educational visual/audio conventions only.
              </p>
            </article>

            <article className="rounded-sm border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-5">
              <h3 className="font-semibold">FITS display previews</h3>
              <p className="mt-2 text-xs leading-relaxed text-[#555555]">
                The backend reads the FITS IMAGE extension, clips a display range, applies a custom
                asinh stretch, and resizes the result into a PNG preview. These display operations
                do not perform WCS registration, source detection, or photometric calibration.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[#737373]">
                References:{" "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[2].url} target="_blank" rel="noopener noreferrer">NumPy asinh</a>
                {" · "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[3].url} target="_blank" rel="noopener noreferrer">Astropy FITS</a>
                {" · "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[4].url} target="_blank" rel="noopener noreferrer">NASA FITS Standard</a>
                {" · "}
                <a className="text-[#0284C7] hover:underline" href={methodSources[6].url} target="_blank" rel="noopener noreferrer">Pillow</a>
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="method-references">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">05 / Standards &amp; references</span>
            <h2 id="method-references" className="mt-1 font-editorial text-2xl">Technical documentation</h2>
          </div>
          <SourceList sources={methodSources} />
        </section>

        <section className="space-y-4" aria-labelledby="interface-resources">
          <div>
            <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83]">06 / Interface resources</span>
            <h2 id="interface-resources" className="mt-1 font-editorial text-2xl">Typography</h2>
          </div>
          <SourceList sources={[
            {
              name: "Google Fonts",
              url: "https://fonts.google.com/",
              role: "The interface requests Inter, DM Serif Display, and JetBrains Mono font families.",
            },
          ]} />
        </section>

        <div className="flex flex-wrap gap-3 border-t border-[#E7E7E4] pt-6">
          <Link href="/explore" className="inline-flex items-center gap-2 rounded-sm bg-[#111111] dark:bg-[#FFFFFF] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white dark:text-[#111111] hover:bg-[#26282E] dark:hover:bg-[#E5E7EB]">
            Open Sky Explorer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link href="/about" className="inline-flex items-center gap-2 rounded-sm border border-[#D1D1CB] dark:border-[#26282E] px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#111111] dark:text-[#F3F4F6] hover:border-[#111111] dark:hover:border-[#FFFFFF]">
            Mission overview <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}
