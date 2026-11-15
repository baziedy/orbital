"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, AlertCircle, BookOpen, ArrowLeftRight, ChevronDown, Search, Check } from "lucide-react";
import { fetchObservation, fetchObservations, compareObservations, searchSky } from "@/lib/api";
import { ObservationRecord, CompareResponse, SearchResponse } from "@/types";
import ComparisonSlider from "@/components/ComparisonSlider";
import AstrometricCalculator from "@/components/AstrometricCalculator";
import LightCurveAnalyzer from "@/components/LightCurveAnalyzer";
import PlanetXCalculator from "@/components/PlanetXCalculator";
import StudyNotes from "@/components/StudyNotes";

interface ComparePreset {
  category: "spherex" | "dss";
  label: string;
  desc: string;
  obsA: string;
  obsB: string;
}

const challengePresets: ComparePreset[] = [
  {
    category: "spherex",
    label: "WISE 0855 (SPHEREx DR1)",
    desc: "SPHEREx DR1 Band D3 repeat passes separated by 220.6 days.",
    obsA: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--59cacf82a176",
    obsB: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--b87e92e69420",
  },
  {
    category: "spherex",
    label: "Barnard's Star (DR1 / QR3)",
    desc: "SPHEREx multi-epoch survey passes in Band D1 separated by 371 days.",
    obsA: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--31de4af59697",
    obsB: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--f1f6543752f8",
  },
  {
    category: "spherex",
    label: "Epsilon Indi B (DR1 / QR3)",
    desc: "SPHEREx near-infrared Band D2 repeat passes separated by 525.6 days.",
    obsA: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--498bacc86bd1",
    obsB: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-qr3-level2--aa3a782faede",
  },
  {
    category: "spherex",
    label: "RW Aurigae (SPHEREx DR1)",
    desc: "SPHEREx DR1 Band D1 repeat passes of young stellar system separated by 183.8 days.",
    obsA: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--dfdafcc56a5c",
    obsB: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--81e1ef2e951c",
  },
  {
    category: "spherex",
    label: "R Draconis (SPHEREx DR1)",
    desc: "SPHEREx Band D3 repeat passes of Mira variable separated by 223.3 days.",
    obsA: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--7d4ee047c78e",
    obsB: "SPHEREx-https-irsa.ipac.caltech.edu-ibe-data-spherex-dr1-level2--79b3f0593d13",
  },
  {
    category: "dss",
    label: "Barnard's Star (DSS Reference)",
    desc: "Historical STScI POSS photographic plates (POSSI-E vs POSSII-N).",
    obsA: "DSS-REF-BARNARD-P1",
    obsB: "DSS-REF-BARNARD-P2",
  },
  {
    category: "dss",
    label: "WISE 0855 (DSS Reference)",
    desc: "Historical STScI SERC-I vs SERC-ER precursor photographic plates.",
    obsA: "DSS-REF-W0855-P1",
    obsB: "DSS-REF-W0855-P2",
  },
  {
    category: "dss",
    label: "Epsilon Indi (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-EPSINDI-P1",
    obsB: "DSS-REF-EPSINDI-P2",
  },
  {
    category: "dss",
    label: "RW Aurigae (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-RWAUR-P1",
    obsB: "DSS-REF-RWAUR-P2",
  },
  {
    category: "dss",
    label: "R Draconis (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-RDRA-P1",
    obsB: "DSS-REF-RDRA-P2",
  },
  {
    category: "dss",
    label: "Kapteyn's Star (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-KAPTEYN-P1",
    obsB: "DSS-REF-KAPTEYN-P2",
  },
  {
    category: "dss",
    label: "Wolf 359 (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-WOLF359-P1",
    obsB: "DSS-REF-WOLF359-P2",
  },
  {
    category: "dss",
    label: "Mira (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-MIRA-P1",
    obsB: "DSS-REF-MIRA-P2",
  },
  {
    category: "dss",
    label: "Teegarden (DSS Reference)",
    desc: "Historical photographic reference plates for context.",
    obsA: "DSS-REF-TEEGARDEN-P1",
    obsB: "DSS-REF-TEEGARDEN-P2",
  },
];

function ObservationPicker({
  side,
  selected,
  observations,
  otherTarget,
  otherId,
  otherBand,
  disabled,
  onSelect,
  onSearchArchive,
}: {
  side: "A" | "B";
  selected: ObservationRecord | null;
  observations: ObservationRecord[];
  otherTarget?: string;
  otherId: string;
  otherBand?: string;
  disabled: boolean;
  onSelect: (id: string) => void;
  onSearchArchive: (query: string) => Promise<SearchResponse>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isArchiveSearching, setIsArchiveSearching] = useState(false);
  const [archiveSearchMessage, setArchiveSearchMessage] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const listId = `compare-observation-options-${side.toLowerCase()}`;

  const groups = useMemo(() => {
    const matches = observations.filter((observation) => {
      if (observation.observation_id === otherId) return false;
      const text = `${observation.target_name} ${observation.band} ${observation.observation_date} ${observation.observation_id}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    });
    if (!otherTarget) return [{ label: "All observations", items: matches }].filter((group) => group.items.length > 0);

    const sameTarget = matches
      .filter((observation) => observation.target_name.toLocaleLowerCase() === otherTarget.toLocaleLowerCase())
      .sort((a, b) => Number(b.band === otherBand) - Number(a.band === otherBand));
    const otherTargets = matches.filter((observation) => observation.target_name.toLocaleLowerCase() !== otherTarget.toLocaleLowerCase());
    const recommendedCount = 6;
    return [
      { label: `For ${otherTarget}`, items: sameTarget.slice(0, recommendedCount) },
      { label: "Other targets", items: otherTargets },
      { label: `More ${otherTarget} observations`, items: sameTarget.slice(recommendedCount) },
    ].filter((group) => group.items.length > 0);
  }, [observations, otherId, otherTarget, otherBand, query]);

  const searchNASAArchive = async () => {
    const searchTerm = query.trim();
    if (!searchTerm || isArchiveSearching) return;
    setIsArchiveSearching(true);
    setArchiveSearchMessage(null);
    try {
      const result = await onSearchArchive(searchTerm);
      setArchiveSearchMessage(result.observations.length > 0
        ? `Found ${result.observations.length} NASA/IPAC observations. They are now in the list below.`
        : result.message || "No NASA/IPAC observations matched that search.");
    } catch (searchError) {
      setArchiveSearchMessage(searchError instanceof Error ? searchError.message : "NASA/IPAC search failed. Try again.");
    } finally {
      setIsArchiveSearching(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={pickerRef} className="relative min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-mono-sci text-[10px] font-semibold uppercase tracking-wider text-[#555555] dark:text-[#D1D5DB]">
          <span className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] text-white ${side === "A" ? "bg-amber-700" : "bg-orange-600"}`}>{side}</span>
          {side === "A" ? "Observation A (Image Preview)" : "Observation B (Image Preview)"}
        </span>
        {selected && <span className="text-[10px] font-mono-sci text-[#737373] dark:text-[#9CA3AF]">{selected.is_demo ? "REFERENCE" : "SPHEREx"}</span>}
      </div>

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => { setQuery(""); setOpen((value) => !value); }}
        className="flex min-h-[76px] w-full min-w-0 items-center justify-between gap-3 rounded-sm border border-[#E7E7E4] bg-white px-3 py-3 text-left transition hover:border-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:cursor-wait disabled:opacity-60 dark:border-[#343741] dark:bg-[#101114] dark:hover:border-amber-400"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#111111] dark:text-[#F3F4F6]">{selected?.target_name || (disabled ? "Loading observations…" : "Choose an observation")}</span>
          <span className="mt-1 block truncate text-xs text-[#737373] dark:text-[#A1A1AA]">{selected ? `${selected.is_demo ? `Reference epoch ${selected.observation_id.split("-").pop()?.replace("P", "")}` : selected.observation_date.slice(0, 10)} · ${selected.band}` : "Select an observation"}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#737373] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-1.5 max-h-[min(62vh,440px)] overflow-hidden rounded-sm border border-[#D8D8D2] bg-white shadow-lg dark:border-[#343741] dark:bg-[#12141A]">
          <label className="flex items-center gap-2 border-b border-[#E7E7E4] px-3 dark:border-[#26282E]">
            <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#8A8A83]" />
            <input autoFocus type="search" value={query} onChange={(event) => { setQuery(event.target.value); setArchiveSearchMessage(null); }} placeholder="Search loaded observations…" aria-label={`Search Observation ${side} options`} className="h-10 min-w-0 flex-1 border-0 bg-transparent text-xs text-[#111111] outline-none focus:ring-0 dark:text-[#F3F4F6]" />
          </label>
          {archiveSearchMessage && <p role="status" className="border-b border-[#E7E7E4] px-3 py-2 text-[10px] leading-relaxed text-[#555555] dark:border-[#26282E] dark:text-[#D1D5DB]">{archiveSearchMessage}</p>}
          <div className="flex items-center justify-between gap-2 border-b border-[#E7E7E4] px-3 py-2 dark:border-[#26282E]">
            <span className="text-[10px] text-[#737373] dark:text-[#9CA3AF]">Find more observations by object name</span>
            <button type="button" onClick={() => void searchNASAArchive()} disabled={!query.trim() || isArchiveSearching} className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-[#111111] px-2.5 py-1.5 font-mono-sci text-[9px] font-semibold uppercase tracking-wide text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-amber-500 dark:text-[#111111] dark:hover:bg-amber-400">
              {isArchiveSearching ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
              {isArchiveSearching ? "Searching" : "Search NASA IRSA"}
            </button>
          </div>
          <div id={listId} role="listbox" aria-label={`Select observation ${side}`} className="max-h-[min(45vh,320px)] overflow-y-auto p-1.5">
            {groups.length === 0 ? <p className="px-3 py-6 text-center text-xs text-[#737373] dark:text-[#A1A1AA]">No observations match that search.</p> : groups.map((group) => (
              <div key={group.label} role="group" aria-label={group.label}>
                <div className="px-2.5 pb-1 pt-2 font-mono-sci text-[9px] font-semibold uppercase tracking-wider text-[#8A8A83]">{group.label}</div>
                {group.items.map((observation) => {
                  const isSelected = observation.observation_id === selected?.observation_id;
                  return (
                    <button
                      key={observation.observation_id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { onSelect(observation.observation_id); setOpen(false); setQuery(""); }}
                      className={`flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-2 text-left transition ${isSelected ? "bg-amber-50 dark:bg-amber-950/30" : "hover:bg-[#F7F7F5] dark:hover:bg-[#1A1D26]"} disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-[#222222] dark:text-[#E5E7EB]">{observation.target_name}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-[#737373] dark:text-[#9CA3AF]">{observation.is_demo ? `Reference epoch ${observation.observation_id.split("-").pop()?.replace("P", "")}` : observation.observation_date.slice(0, 10)} · {observation.band}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-sm bg-[#F7F7F5] px-1.5 py-1 font-mono-sci text-[8px] text-[#737373] dark:bg-[#1A1D26] dark:text-[#A1A1AA]">{observation.is_demo ? "DSS" : "SPHEREx"}</span>
                        {isSelected && <Check aria-label="Selected" className="h-3.5 w-3.5 text-amber-700 dark:text-amber-300" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const paramObsA = searchParams.get("obsA") || "";
  const paramObsB = searchParams.get("obsB") || "";

  const [obsIdA, setObsIdA] = useState<string>("");
  const [obsIdB, setObsIdB] = useState<string>("");

  const [allObservations, setAllObservations] = useState<ObservationRecord[]>([]);
  const [hasLoadedObservations, setHasLoadedObservations] = useState<boolean>(false);
  const [obsA, setObsA] = useState<ObservationRecord | null>(null);
  const [obsB, setObsB] = useState<ObservationRecord | null>(null);
  const [comparisonResult, setComparisonResult] = useState<CompareResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [presetCategory, setPresetCategory] = useState<"all" | "spherex" | "dss">("spherex");

  useEffect(() => {
    let active = true;
    fetchObservations()
      .then((records) => {
        if (!active) return;
        const seen = new Set<string>();
        const uniqueRecords: ObservationRecord[] = [];
        for (const record of records) {
          if (!seen.has(record.observation_id)) {
            seen.add(record.observation_id);
            uniqueRecords.push(record);
          }
        }
        setAllObservations(uniqueRecords);
        if (uniqueRecords.length === 0) {
          setError("No observation records are available. Check that the backend is reachable and try again.");
          setIsLoading(false);
          return;
        }

        const availableIds = new Set(uniqueRecords.map((record) => record.observation_id));
        let selectedA = availableIds.has(paramObsA) ? paramObsA : "";
        let selectedB = availableIds.has(paramObsB) ? paramObsB : "";

        if (!selectedA || !selectedB || selectedA === selectedB) {
          const preset = challengePresets.find(
            (item) => availableIds.has(item.obsA) && availableIds.has(item.obsB)
          );
          if (preset) {
            selectedA = preset.obsA;
            selectedB = preset.obsB;
          } else {
            const first = uniqueRecords[0];
            const second = uniqueRecords.find(
              (record) =>
                record.observation_id !== first.observation_id &&
                record.target_name === first.target_name &&
                record.band === first.band
            ) ?? uniqueRecords.find((record) => record.observation_id !== first.observation_id);

            if (!second) {
              setError("At least two distinct observations are needed for comparison.");
              setIsLoading(false);
              return;
            }

            selectedA = first.observation_id;
            selectedB = second.observation_id;
          }
        }

        setObsIdA(selectedA);
        setObsIdB(selectedB);
      })
      .catch((observationsError: unknown) => {
        if (!active) return;
        setAllObservations([]);
        setError(observationsError instanceof Error ? observationsError.message : "Failed to load observations.");
        setIsLoading(false);
      })
      .finally(() => {
        if (active) setHasLoadedObservations(true);
      });

    return () => {
      active = false;
    };
  }, [paramObsA, paramObsB]);

  const availableObservationIds = useMemo(
    () => new Set(allObservations.map((record) => record.observation_id)),
    [allObservations]
  );

  const searchNASAArchiveForCompare = async (query: string): Promise<SearchResponse> => {
    const result = await searchSky({ target_name: query, demo_mode: false });
    if (result.observations.length > 0) {
      setAllObservations((current) => {
        const knownIds = new Set(current.map((record) => record.observation_id));
        const newRecords = result.observations.filter((record) => {
          if (knownIds.has(record.observation_id)) return false;
          knownIds.add(record.observation_id);
          return true;
        });
        return newRecords.length > 0 ? [...current, ...newRecords] : current;
      });
    }
    return result;
  };

  const updateSelection = (nextA: string, nextB: string) => {
    setIsLoading(true);
    setError(null);
    setObsIdA(nextA);
    setObsIdB(nextB);
  };

  useEffect(() => {
    if (!hasLoadedObservations || !obsIdA || !obsIdB) return;

    const availableIds = new Set(allObservations.map((record) => record.observation_id));
    if (!availableIds.has(obsIdA) || !availableIds.has(obsIdB)) return;

    let active = true;
    Promise.all([
      fetchObservation(obsIdA),
      fetchObservation(obsIdB),
      compareObservations(obsIdA, obsIdB),
    ])
      .then(([dataA, dataB, compareData]) => {
        if (!active) return;
        setObsA(dataA);
        setObsB(dataB);
        setComparisonResult(compareData);

        const url = new URL(window.location.href);
        url.searchParams.set("obsA", obsIdA);
        url.searchParams.set("obsB", obsIdB);
        window.history.replaceState({}, "", url.toString());
      })
      .catch((comparisonError: unknown) => {
        if (!active) return;
        setObsA(null);
        setObsB(null);
        setComparisonResult(null);
        setError(comparisonError instanceof Error ? comparisonError.message : "Failed to compare observations.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allObservations, hasLoadedObservations, obsIdA, obsIdB]);

  const isVariableTarget =
    obsA?.target_name.toLowerCase().includes("draconis") ||
    obsA?.target_name.toLowerCase().includes("aurigae") ||
    obsA?.target_name.toLowerCase().includes("mira");

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8 min-w-0 overflow-x-hidden">
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
          <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci">ORBITAL Comparative Astrometry</span>
          <h1 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] mt-1">
            Orbital Differential Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-1">
            Compare archive records or curated reference-image previews. Image differences and field-center offsets are descriptive display aids, not calibrated motion or variability measurements.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 bg-[#F7F7F5] dark:bg-[#161820] p-1 border border-[#E7E7E4] dark:border-[#26282E] rounded-sm text-xs font-mono-sci max-w-full overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setPresetCategory("spherex")}
              className={`px-2.5 py-1 rounded-[2px] transition-all font-medium ${
                presetCategory === "spherex"
                  ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111] shadow-xs"
                  : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
              }`}
            >
              SPHEREx DR1/QR3 Repeat Passes
            </button>
            <button
              onClick={() => setPresetCategory("dss")}
              className={`px-2.5 py-1 rounded-[2px] transition-all font-medium ${
                presetCategory === "dss"
                  ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111] shadow-xs"
                  : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
              }`}
            >
              Historical DSS Reference Plates
            </button>
            <button
              onClick={() => setPresetCategory("all")}
              className={`px-2.5 py-1 rounded-[2px] transition-all font-medium ${
                presetCategory === "all"
                  ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111] shadow-xs"
                  : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
              }`}
            >
              All
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-sci">
            {challengePresets
              .filter((p) => presetCategory === "all" || p.category === presetCategory)
              .map((preset) => {
                const isActive = obsIdA === preset.obsA && obsIdB === preset.obsB;
                const isAvailable = availableObservationIds.has(preset.obsA) && availableObservationIds.has(preset.obsB);
                return (
                  <button
                    key={preset.label}
                    onClick={() => updateSelection(preset.obsA, preset.obsB)}
                    disabled={!hasLoadedObservations || !isAvailable}
                    className={`px-3 py-1.5 rounded-sm transition-all text-left ${
                      isActive
                        ? "bg-[#111111] text-[#FFFFFF] font-semibold shadow-xs"
                        : isAvailable
                          ? "bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] text-[#737373] hover:text-[#111111] hover:border-[#111111]"
                          : "bg-[#F7F7F5] dark:bg-[#161820] border border-[#E7E7E4] dark:border-[#26282E] text-[#B5B5AF] cursor-not-allowed"
                    }`}
                    title={isAvailable ? preset.desc : "This pair is currently not cached in the active catalog."}
                  >
                    <span>{preset.label}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {comparisonResult && !comparisonResult.is_compatible && comparisonResult.incompatibility_reason && (
        <div data-reveal className="bg-[#FFFBEB] dark:bg-[#78350F]/20 border border-[#FDE68A] dark:border-[#B45309]/40 p-3.5 rounded-sm flex items-start gap-2.5 text-xs font-mono-sci text-[#92400E] dark:text-[#FDE68A]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D97706]" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-semibold uppercase tracking-wider block">
              Multi-Spectral Visual Inspection Active
            </span>
            <span>{comparisonResult.incompatibility_reason}</span>
          </div>
        </div>
      )}

      <div data-reveal className="relative bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-4 sm:p-6 rounded-sm space-y-4 shadow-sm w-full max-w-full min-w-0 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7E7E4] dark:border-[#26282E]">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci font-semibold">
              Observation Preview Selection • Dual-Record Comparator
            </span>
            <h2 className="text-lg font-bold font-editorial text-[#111111] dark:text-[#F3F4F6]">
              Select two observations to compare preview images and metadata
            </h2>
            <p className="text-xs text-[#737373] dark:text-[#9CA3AF]">Choose one observation for A and one for B. Observations of the same target appear first, with matching spectral bands prioritized.</p>
          </div>
          <button
            onClick={() => updateSelection(obsIdB, obsIdA)}
            disabled={!obsIdA || !obsIdB || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#F7F7F5] dark:bg-[#161820] border border-[#E7E7E4] dark:border-[#343741] text-[#111111] dark:text-[#F3F4F6] hover:border-amber-500 text-xs font-mono-sci rounded-sm transition-colors self-start sm:self-auto disabled:cursor-not-allowed disabled:opacity-50"
            title="Swap Observation A and Observation B"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap Observation A ↔ B</span>
          </button>
        </div>

        <div className="grid w-full min-w-0 grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
          <div className="min-w-0 rounded-sm border border-amber-200 bg-amber-50/50 p-3 sm:p-4 dark:border-amber-900/50 dark:bg-amber-950/10">
            <ObservationPicker
              side="A"
              selected={obsA}
              observations={allObservations}
              otherTarget={obsB?.target_name}
              otherId={obsIdB}
              otherBand={obsB?.band}
              disabled={!hasLoadedObservations}
              onSelect={(id) => updateSelection(id, obsIdB)}
              onSearchArchive={searchNASAArchiveForCompare}
            />
            {obsA && <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-amber-200/80 pt-2.5 font-mono-sci text-[10px] dark:border-amber-900/40">
              <span className="text-[#8A8A83]">Coordinates</span><span className="truncate text-right text-[#444444] dark:text-[#D1D5DB]">{obsA.ra.toFixed(4)}°, {obsA.dec.toFixed(4)}°</span>
              <span className="text-[#8A8A83]">Instrument</span><span className="truncate text-right text-[#444444] dark:text-[#D1D5DB]">{obsA.instrument}</span>
            </div>}
          </div>

          <div className="min-w-0 rounded-sm border border-orange-200 bg-orange-50/50 p-3 sm:p-4 dark:border-orange-900/50 dark:bg-orange-950/10">
            <ObservationPicker
              side="B"
              selected={obsB}
              observations={allObservations}
              otherTarget={obsA?.target_name}
              otherId={obsIdA}
              otherBand={obsA?.band}
              disabled={!hasLoadedObservations}
              onSelect={(id) => updateSelection(obsIdA, id)}
              onSearchArchive={searchNASAArchiveForCompare}
            />
            {obsB && <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 border-t border-orange-200/80 pt-2.5 font-mono-sci text-[10px] dark:border-orange-900/40">
              <span className="text-[#8A8A83]">Coordinates</span><span className="truncate text-right text-[#444444] dark:text-[#D1D5DB]">{obsB.ra.toFixed(4)}°, {obsB.dec.toFixed(4)}°</span>
              <span className="text-[#8A8A83]">Instrument</span><span className="truncate text-right text-[#444444] dark:text-[#D1D5DB]">{obsB.instrument}</span>
            </div>}
          </div>
        </div>
      </div>

      <div data-reveal className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 sm:p-6 rounded-sm space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#111111]" />
          <h2 className="text-base font-semibold font-mono-sci uppercase text-[#111111]">
            Blink comparison as an image-inspection technique
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
              Clyde Tombaugh used a blink comparator to compare photographic plates during the search that led to Pluto&apos;s discovery. ORBITAL offers a browser-based image comparison exercise; its curated reference images and illustrative sequence dates do not reproduce that discovery or establish a new object.
        </p>

        <div data-reveal-group className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs font-mono-sci text-[#555555]">
          <div className="border-t border-[#E7E7E4] pt-4 space-y-1.5">
              <span className="font-bold text-[#111111] block text-sm">1. Inspect the previews</span>
            <p>
              Use the slider or blink view to inspect the available previews. Curated DSS sequence dates are illustrative, and the images are not SPHEREx observations.
            </p>
          </div>
          <div className="border-t border-[#E7E7E4] pt-4 space-y-1.5">
              <span className="font-bold text-[#111111] block text-sm">2. Compare display pixels</span>
            <p>
              The B − A view subtracts normalized display pixels. It does not perform WCS registration, source detection, or photometric calibration.
            </p>
          </div>
          <div className="border-t border-[#E7E7E4] pt-4 space-y-1.5">
              <span className="font-bold text-[#111111] block text-sm">3. Review catalog context</span>
            <p>
              A difference in field-center coordinates is not a measurement of a source&apos;s motion. Follow the source links and calculation notes on the Sources page before drawing a scientific conclusion.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-center text-[#737373] font-mono-sci text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#111111]" />
          <span>Loading observation records and comparison metadata...</span>
        </div>
      ) : error ? (
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-6 rounded-sm text-xs text-[#991B1B] font-mono-sci">
          <AlertCircle className="w-5 h-5 mb-2 text-[#DC2626]" />
          <strong>Comparison Error:</strong> {error}
        </div>
      ) : obsA && obsB ? (
        <div data-reveal className="space-y-10">
          <ComparisonSlider obsA={obsA} obsB={obsB} comparisonResult={comparisonResult} />

          <PlanetXCalculator />

          <AstrometricCalculator
            key={`${obsA.observation_id}:${obsB.observation_id}`}
            initialRaA={obsA.ra}
            initialDecA={obsA.dec}
            initialRaB={obsB.ra}
            initialDecB={obsB.dec}
            dateA={obsA.observation_date}
            dateB={obsB.observation_date}
            targetName={obsA.target_name}
          />

          {isVariableTarget && (
            <LightCurveAnalyzer targetName={obsA.target_name} />
          )}
        </div>
      ) : null}
      <div data-reveal className="max-w-xl">
        <StudyNotes workspace="Studio" />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-12 text-center text-xs font-mono-sci">Loading Comparison Studio...</div>}>
      <CompareContent />
    </Suspense>
  );
}
