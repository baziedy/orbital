import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, CheckCircle } from "lucide-react";
import { refreshImageUrl } from "@/lib/api";
import { fetchServerObservation } from "@/lib/server-api";
import SpectralInspector from "@/components/SpectralInspector";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ObservationDetailPage({ params }: PageProps) {
  const { id } = await params;
  let observation;
  try {
    observation = await fetchServerObservation(id);
  } catch {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono-sci text-[#737373] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Sky Explorer</span>
        </Link>
      </div>

      <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E7E4]">
        <div>
          <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci">Observation Record</span>
          <h1 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] mt-1">
            {observation.observation_id}
          </h1>
          <p className="text-xs font-mono-sci text-[#737373] mt-1">
            TARGET: {observation.target_name} • {observation.is_demo ? "ILLUSTRATIVE DATE" : "OBSERVATION DATE"}: {observation.observation_date.slice(0, 10)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {observation.fits_url && (
            <a
              href={observation.fits_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] text-[#FFFFFF] text-xs font-mono-sci uppercase rounded-sm hover:bg-[#26282E] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{observation.is_demo ? "Open Source FITS" : "Download Archive FITS"}</span>
            </a>
          )}
        </div>
      </div>

      <div data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 bg-[#101114] overflow-hidden relative">
          <div className="relative w-full h-[520px] md:h-[620px]">
            <img
              src={refreshImageUrl(observation.preview_url)}
              alt={observation.target_name}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#FFFFFF]/40 pointer-events-none"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#FFFFFF]/40 pointer-events-none"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#FFFFFF]/40 pointer-events-none"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#FFFFFF]/40 pointer-events-none"></div>

            <div className="absolute bottom-4 left-4 bg-[#101114]/80 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-xs font-mono-sci text-[#FFFFFF]">
              <span>
                {observation.is_demo
                  ? "DSS REFERENCE CUTOUT • NOT SPHEREx DATA"
                  : "DISPLAY PREVIEW • NOT CALIBRATED PHOTOMETRY"}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 sm:p-6 rounded-sm space-y-4 font-mono-sci text-xs shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#111111] pb-2 border-b border-[#E7E7E4]">
              {observation.is_demo ? "Catalog Target Coordinates" : "Astrometric Coordinates"}
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">Right Ascension (J2000):</span>
                <span className="text-[#111111] font-semibold">{observation.ra.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">Declination (J2000):</span>
                <span className="text-[#111111] font-semibold">{observation.dec.toFixed(5)}°</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">Spatial Sampling:</span>
                <span className="text-[#111111]">{observation.spatial_resolution_arcsec != null ? `${observation.spatial_resolution_arcsec}″ / pixel` : "Not provided"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#737373]">Quality Flag:</span>
                <span className="text-[#64748B] font-medium">{observation.quality_flag}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 sm:p-6 rounded-sm space-y-4 font-mono-sci text-xs shadow-sm">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#111111] pb-2 border-b border-[#E7E7E4]">
                Data and Survey Details
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-[#737373] uppercase block">Instrument or Survey</span>
                <span className="text-[#111111] font-medium">{observation.instrument}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#737373] uppercase block">
                  {observation.is_demo ? "Reference Survey" : "Archive Band Metadata"}
                </span>
                <span className="text-[#0284C7] font-semibold">{observation.band}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">{observation.is_demo ? "Wavelength note:" : "Wavelength Range:"}</span>
                <span className="text-[#111111]">{observation.wavelength_range}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">Exposure Time:</span>
                <span className="text-[#111111]">{observation.exposure_time != null ? `${observation.exposure_time} seconds` : "Not provided"}</span>
              </div>
              {observation.flux_density && (
                <div className="flex justify-between py-1 border-b border-[#F7F7F5]">
                <span className="text-[#737373]">Archive Flux Metadata:</span>
                  <span className="text-[#111111] font-semibold">{observation.flux_density}</span>
                </div>
              )}
              <div className="flex justify-between py-1">
                <span className="text-[#737373]">Data Provenance:</span>
                <span className="text-[#111111] font-semibold">{observation.data_source}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 rounded-sm space-y-2 text-xs text-[#737373] leading-relaxed shadow-sm">
            <div className="flex items-center gap-2 text-[#111111] font-semibold">
              <CheckCircle className="w-4 h-4 text-[#059669]" />
              <span>{observation.is_demo ? "Curated Demo Reference" : "Archive Record"}</span>
            </div>
            <p>
              {observation.is_demo
                ? "This is a DSS reference image. Its displayed date is illustrative and its pixels are not SPHEREx measurements."
                : "This archive image is presented as a display preview, not as calibrated source photometry."}
            </p>
          </div>
        </div>
      </div>

      <div data-reveal>
        <SpectralInspector
          targetName={observation.target_name}
          fluxDensity={observation.flux_density}
        />
      </div>
    </main>
  );
}
