import Link from "next/link";
import {
  ExternalLink,
  ArrowRight
} from "lucide-react";

export default function AboutPage() {
  const hardwareSpecs = [
    { label: "Telescope", value: "Three-mirror, 20 cm effective diameter", note: "NASA/JPL spacecraft specification" },
    { label: "Instantaneous Field of View", value: "11.3° × 3.5°", note: "Per exposure" },
    { label: "Spectral Coverage", value: "0.75 – 5.00 µm", note: "102 near-infrared spectral channels" },
    { label: "Spectral Technology", value: "Six linear variable filters", note: "Wavelength response varies across detector arrays" },
    { label: "Archive Image Products", value: "2040 × 2040 pixels", note: "Per SPHEREx spectral image detector product" },
    { label: "Approximate Pixel Scale", value: "6.15 arcsec / pixel", note: "Displayed as an approximate archive-image scale" },
    { label: "Thermal Architecture", value: "Passive cooling", note: "No electrical coolers or consumable coolant" },
    { label: "Orbit", value: "Polar, about 98 minutes", note: "Along Earth's day-night terminator" },
    { label: "All-Sky Survey Cadence", value: "About every six months", note: "Four maps during the 27-month prime mission" },
  ];

  const dataPipelineSteps = [
    {
      level: "Mission processing",
      name: "Performed upstream",
      desc: "SPHEREx instrument and mission processing occurs upstream. ORBITAL does not ingest raw spacecraft telemetry.",
      badge: "NASA mission",
    },
    {
      level: "Archive products",
      name: "NASA/IPAC IRSA",
      desc: "The backend queries released SPHEREx records from IRSA and retrieves FITS products. The selected product's own metadata remains available at its source link.",
      badge: "NASA data source",
    },
    {
      level: "ORBITAL display",
      name: "ORBITAL preview",
      desc: "The app stretches selected FITS pixels into a preview image. It does not align images to Gaia, calibrate photometry, extract spectra, or generate source catalogs.",
      badge: "Display only",
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-6 py-16 space-y-20">
      <div data-reveal-group className="max-w-4xl space-y-4 pb-8 border-b border-[#E7E7E4]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#10B981]" />
          <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci">
            Technical Architecture & Astrophysics
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-editorial tracking-tight text-[#111111]">
          About SPHEREx & ORBITAL
        </h1>
        <p className="text-sm md:text-base text-[#737373] leading-relaxed">
          Explore the SPHEREx mission, query released archive metadata, and inspect image previews with clear context for what the data can and cannot show.
        </p>
      </div>

      <section data-reveal className="bg-[#FFFFFF] border-y border-[#E7E7E4] px-6 md:px-10 py-10 md:py-14 space-y-8">
        <div className="space-y-2 max-w-2xl">
          <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#0284C7] font-bold">
            The Human Story: Astronomy Explained in Plain English
          </span>
          <h2 className="text-3xl font-editorial tracking-tight text-[#111111]">
            How SPHEREx Works &amp; Why It Matters
          </h2>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            No PhD required: here is why NASA built this spacecraft and how people can explore released archive imagery.
          </p>
        </div>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-[#555555]">
          <div className="border-t border-[#E7E7E4] pt-4 space-y-2">
              <span className="font-bold text-sm text-[#111111] block">1. Why Survey Infrared Light?</span>
            <p>
              SPHEREx measures near-infrared light from 0.75 to 5.00 µm. Some infrared wavelengths pass through dust more readily than visible light, but dust can still absorb and scatter light. A display preview alone cannot establish an object&apos;s temperature, composition, or detectability.
            </p>
          </div>

          <div className="border-t border-[#E7E7E4] pt-4 space-y-2">
            <span className="font-bold text-sm text-[#111111] block">2. How does SPHEREx record spectral information?</span>
            <p>
              SPHEREx records 102 near-infrared spectral channels across six detector arrays. Spectral features can help researchers study materials such as water and biogenic ices, but ORBITAL does not extract spectra or identify molecules from its image previews.
            </p>
          </div>

          <div className="border-t border-[#E7E7E4] pt-4 space-y-2">
            <span className="font-bold text-sm text-[#111111] block">3. Why Scan the Whole Sky Every 6 Months?</span>
            <p>
              The challenge brief describes a six-month all-sky survey cadence. Comparing epochs can reveal changes, but apparent motion combines parallax, an object&apos;s own motion, orbital motion, and measurement effects. ORBITAL blinks previews but does not register images or measure source positions.
            </p>
          </div>

          <div className="border-t border-[#E7E7E4] pt-4 space-y-2">
            <span className="font-bold text-sm text-[#111111] block">4. Comparing images over time</span>
            <p>
              Clyde Tombaugh identified Pluto through photographic plate comparisons. SPHEREx is mapping the sky in infrared spectral channels. ORBITAL offers exploratory viewing only; it does not automatically find candidates or establish discoveries.
            </p>
          </div>
        </div>
      </section>

      <section data-reveal className="space-y-8">
        <div>
          <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83] block mb-1">
            Optomechanical Architecture
          </span>
          <h2 className="text-3xl font-editorial tracking-tight text-[#111111]">
            Observatory Hardware & Technical Specifications
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-3xl leading-relaxed">
            SPHEREx is built around an innovative, fully passive optical payload designed for extreme reliability, wide angular coverage, and high infrared throughput.
          </p>
        </div>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono-sci text-xs">
          {hardwareSpecs.map((spec) => (
            <div
              key={spec.label}
              className="border-t border-[#E7E7E4] pt-4 space-y-1.5 hover:border-[#111111] transition-colors"
            >
              <span className="text-[10px] text-[#8A8A83] uppercase block">{spec.label}</span>
              <span className="text-sm font-semibold text-[#111111] block">{spec.value}</span>
              <span className="text-[11px] text-[#737373] block">{spec.note}</span>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-12 border-t border-[#E7E7E4]">
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83] block">
            Spectrophotometry Innovation
          </span>
          <h2 className="text-2xl sm:text-3xl font-editorial tracking-tight text-[#111111]">
            How Linear Variable Filters (LVF) Work
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            Traditional slit spectrographs require targeting one star at a time, while filter wheels introduce moving parts that can jam in space.
          </p>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            SPHEREx solves this by mounting <strong>Linear Variable Filters (LVF)</strong> directly over the six detector arrays. The transmitted wavelength varies continuously along the dispersion axis of the detector chip.
          </p>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            The instrument pairs six detector arrays with linear variable filters. Mission processing combines measurements from multiple exposures to build 102-channel spectra across 0.75–5.0 µm.
          </p>
        </div>

        <div className="lg:col-span-7 bg-[#101114] text-[#FFFFFF] p-6 rounded-sm border border-[#26282E] shadow-xl space-y-6 font-mono-sci text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#26282E]">
            <span className="text-[#38BDF8] font-semibold text-sm">6-Detector Array Focal Plane Configuration (Nominal Design & Archive Ranges)</span>
            <span className="text-[#9CA3AF] text-[10px]">TOTAL CHANNELS: 102</span>
          </div>

          <div data-reveal-group className="space-y-3">
            {[
              { id: 1, range: "0.75 – 1.09 µm", r: "R = 39", primary: "Target-dependent spectra" },
              { id: 2, range: "1.10 – 1.62 µm", r: "R = 41", primary: "Target-dependent spectra" },
              { id: 3, range: "1.63 – 2.41 µm", r: "R = 41", primary: "Target-dependent spectra" },
              { id: 4, range: "2.42 – 3.82 µm", r: "R = 35", primary: "Target-dependent spectra" },
              { id: 5, range: "3.83 – 4.41 µm", r: "R = 112", primary: "Target-dependent spectra" },
              { id: 6, range: "4.42 – 5.00 µm", r: "R = 128", primary: "Target-dependent spectra" },
            ].map((arr) => (
              <div
                key={arr.id}
                className="border-b border-[#26282E] py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <span className="text-[#38BDF8] font-bold">Array {arr.id}:</span>{" "}
                  <span className="text-[#FFFFFF]">{arr.range}</span>
                  <span className="text-[#9CA3AF] text-[10px] block sm:inline sm:ml-2">({arr.r})</span>
                </div>
                <span className="text-[10px] text-[#FBBF24] bg-[#26282E] px-2 py-0.5 rounded-[2px] self-start sm:self-auto">
                  {arr.primary}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-[#9CA3AF] border-t border-[#26282E] flex items-center justify-between">
            <span>PASSIVE RADIATIVE COOLING</span>
            <span className="text-[#10B981]">NO CONSUMABLE COOLANT</span>
          </div>
          <div className="text-[10px] text-[#6B7280] leading-relaxed pt-1">
            Ranges and resolving powers follow the current NASA/IPAC IRSA Data Products guide. Actual archive products carry their own wavelength metadata; displayed target examples are not spectral measurements.
          </div>
        </div>
      </section>

      <section data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-12 border-t border-[#E7E7E4]">
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83] block">
            Time-Domain Astrometry
          </span>
          <h2 className="text-2xl sm:text-3xl font-editorial tracking-tight text-[#111111]">
            The Blink Method: From Pluto to Planet X
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            In 1930, young astronomer Clyde Tombaugh sat in a dark basement at Lowell Observatory using a mechanical <strong>blink comparator</strong> to switch between photographic glass plates taken six days apart. One faint speck jumped: <strong>Pluto</strong> was discovered.
          </p>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            Nearly a century later, the exact same principle drives modern time-domain astrophysics. NASA citizen science initiatives like <em>Backyard Worlds: Planet 9</em> have used public volunteer inspection to discover thousands of nearby brown dwarfs and cold substellar companions.
          </p>
          <p className="text-xs sm:text-sm text-[#737373] leading-relaxed">
            ORBITAL brings this capability directly to your browser:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#737373]">
            <li><strong>Blink preview:</strong> Alternates selected images for visual inspection; it does not automatically detect moving objects.</li>
            <li><strong>Display difference:</strong> Subtracts display rasters without WCS registration or photometric calibration, so residuals are not reliable motion detections.</li>
            <li><strong>Review marks:</strong> User-placed canvas positions help record an area for later inspection; they are not sky coordinates or detections.</li>
          </ul>
        </div>

        <div className="lg:col-span-7 bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-6 rounded-sm space-y-6 font-mono-sci text-xs shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E7E7E4]">
            Astrometric Equations & Motion Derivation
          </h3>

          <div className="space-y-4 text-xs text-[#737373]">
            <div className="border-t border-[#E7E7E4] pt-4 space-y-1">
              <span className="text-[#111111] font-bold block">Total Annual Proper Motion (µ):</span>
              <code className="text-[#0284C7] font-semibold text-sm">
                µ = √[ (µ_α · cos δ)² + µ_δ² ]
              </code>
              <p className="text-[11px] pt-1">
                Where µ_α and µ_δ are the coordinate drift rates in Right Ascension and Declination measured in arcseconds per year.
              </p>
            </div>

            <div className="border-t border-[#E7E7E4] pt-4 space-y-1">
              <span className="text-[#111111] font-bold block">Image Subtraction Residual Dipole (D):</span>
              <code className="text-[#8B5CF6] font-semibold text-sm">
                D(x, y) = 128 + [ Frame_B(x, y) − Frame_A(x, y) ]
              </code>
              <p className="text-[11px] pt-1">
                This is a display-raster arithmetic example only. The current app does not register images, match PSFs, or guarantee that stationary sources cancel; residual shapes cannot be treated as detections.
              </p>
            </div>

            <div className="border-t border-[#E7E7E4] pt-4 space-y-1">
              <span className="text-[#111111] font-bold block">Idealized independent-sample scaling:</span>
              <code className="text-[#10B981] font-semibold text-sm">
                SNR_total = √N · SNR_single (under ideal assumptions)
              </code>
              <p className="text-[11px] pt-1">
                This general relation assumes independent, comparable measurements. SPHEREx channels have different wavelength responses, and ORBITAL does not co-add data or calculate an SNR gain.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section data-reveal className="space-y-8 pt-12 border-t border-[#E7E7E4]">
        <div>
          <span className="text-[10px] font-mono-sci uppercase tracking-widest text-[#8A8A83] block mb-1">
            Data Architecture & Protocols
          </span>
          <h2 className="text-3xl font-editorial tracking-tight text-[#111111]">
            Archive Products & Processing
          </h2>
          <p className="text-xs sm:text-sm text-[#737373] mt-1 max-w-3xl leading-relaxed">
            Released SPHEREx products are served through NASA/IPAC IRSA. ORBITAL queries their metadata and renders display-only FITS previews.
          </p>
        </div>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono-sci text-xs">
          {dataPipelineSteps.map((step) => (
            <div
              key={step.level}
              className="border-t border-[#E7E7E4] py-5 space-y-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] uppercase px-2 py-0.5 bg-[#F7F7F5] border border-[#E7E7E4] text-[#8A8A83] rounded-[2px]">
                  {step.badge}
                </span>
                <h3 className="text-base font-semibold text-[#111111] mt-2 mb-1">{step.level}</h3>
                <span className="text-xs text-[#0284C7] font-medium block mb-2">{step.name}</span>
                <p className="text-xs text-[#737373] leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 font-mono-sci text-xs">
          <a
            href="https://irsa.ipac.caltech.edu/Missions/spherex.html"
            target="_blank"
            rel="noopener noreferrer"
            className="border-t border-[#E7E7E4] py-4 hover:border-[#111111] transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-[#111111] block">NASA/IPAC IRSA SPHEREx Portal</span>
              <span className="text-[10px] text-[#737373]">Official mission archive repository at Caltech</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8A83] group-hover:text-[#111111]" />
          </a>

          <a
            href="https://caltech-ipac.github.io/spherex-archive-documentation/spherex-data-access/"
            target="_blank"
            rel="noopener noreferrer"
            className="border-t border-[#E7E7E4] py-4 hover:border-[#111111] transition-colors flex items-center justify-between group"
          >
            <div>
              <span className="font-semibold text-[#111111] block">SPHEREx Data Access Guide</span>
              <span className="text-[10px] text-[#737373]">Virtual Observatory SIA & TAP technical protocols</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#8A8A83] group-hover:text-[#111111]" />
          </a>
        </div>
      </section>

      <div data-reveal className="bg-[#101114] text-[#FFFFFF] p-8 md:p-10 border-y border-[#26282E] flex flex-col md:flex-row items-center justify-between gap-6 shadow-none">
        <div className="space-y-1">
          <h3 className="text-xl font-editorial tracking-tight text-[#FFFFFF]">Launch the Scientific Workspace</h3>
          <p className="text-xs text-[#9CA3AF]">
            Query celestial coordinates, inspect named target fields, or compare image previews.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/explore"
            className="about-primary-cta px-6 py-3 text-xs font-semibold uppercase tracking-widest rounded-sm transition-colors flex items-center gap-2 whitespace-nowrap shadow-md"
          >
            <span>Sky Explorer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/compare"
            className="px-6 py-3 bg-transparent border border-[#26282E] text-[#FFFFFF] text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-[#26282E] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <span>Differential Studio</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
