"use client";

import { useState, useEffect, useMemo } from "react";
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react";
import { ObservationRecord } from "@/types";

interface ObservationTimelineProps {
  observations: ObservationRecord[];
  selectedObservationId: string | null;
  onSelectObservation: (obs: ObservationRecord) => void;
}

export default function ObservationTimeline({
  observations,
  selectedObservationId,
  onSelectObservation,
}: ObservationTimelineProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const timelineObservations = useMemo(() => observations.slice(0, 5), [observations]);
  const isCuratedDemo = timelineObservations.some((observation) => observation.is_demo);

  useEffect(() => {
    if (!isPlaying || timelineObservations.length <= 1) return;

    const interval = setInterval(() => {
      const currentIndex = timelineObservations.findIndex((o) => o.observation_id === selectedObservationId);
      const nextIndex = (currentIndex + 1) % timelineObservations.length;
      onSelectObservation(timelineObservations[nextIndex]);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, timelineObservations, selectedObservationId, onSelectObservation]);

  if (!timelineObservations.length) return null;

  const currentIndex = timelineObservations.findIndex((o) => o.observation_id === selectedObservationId);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectObservation(timelineObservations[currentIndex - 1]);
    } else {
      onSelectObservation(timelineObservations[timelineObservations.length - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < timelineObservations.length - 1) {
      onSelectObservation(timelineObservations[currentIndex + 1]);
    } else {
      onSelectObservation(timelineObservations[0]);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-5 rounded-sm shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#E7E7E4]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#F7F7F5] border border-[#E7E7E4] flex items-center justify-center text-[#111111]">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-widest font-semibold text-[#111111]">Multi-Epoch Timeline</h3>
            <p className="text-[11px] text-[#737373]">
              {isCuratedDemo
                ? `${timelineObservations.length} curated demo frame${timelineObservations.length === 1 ? "" : "s"}; dates are illustrative and images are DSS references, not SPHEREx data.`
                : `${timelineObservations.length} archive observation${timelineObservations.length === 1 ? "" : "s"} shown (maximum 5)`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handlePrev}
            className="p-1.5 border border-[#E7E7E4] rounded-sm hover:bg-[#F7F7F5] text-[#111111] transition-colors"
            title="Previous Epoch"
            aria-label="Previous observation"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] text-[#FFFFFF] text-xs font-mono-sci uppercase rounded-sm hover:bg-[#26282E] transition-colors"
            title={isPlaying ? "Pause Timeline Cadence" : "Play Cadence Sequence"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Play Sequence</span>
              </>
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 border border-[#E7E7E4] rounded-sm hover:bg-[#F7F7F5] text-[#111111] transition-colors"
            title="Next Epoch"
            aria-label="Next observation"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative pt-6 pb-2 overflow-x-auto">
        <div className="absolute top-[37px] left-8 right-8 h-[1px] bg-[#E7E7E4]" />

        <div className="flex items-start justify-between min-w-[580px] px-4 relative z-10">
          {timelineObservations.map((obs) => {
            const isSelected = obs.observation_id === selectedObservationId;
            const dateDisplay = obs.observation_date.slice(0, 10);

            return (
              <button
                key={obs.observation_id}
                onClick={() => onSelectObservation(obs)}
                className="flex flex-col items-center group cursor-pointer text-center focus:outline-none"
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? "bg-[#111111] border-2 border-[#111111] ring-4 ring-[#111111]/10 scale-110"
                      : "bg-[#FFFFFF] border-2 border-[#D1D1CB] group-hover:border-[#111111]"
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isSelected ? "bg-[#FFFFFF]" : "bg-transparent group-hover:bg-[#111111]"
                    }`}
                  />
                </div>

                <div className="mt-2.5 font-mono-sci">
                  <span className={`text-xs block ${isSelected ? "font-bold text-[#111111]" : "text-[#737373]"}`}>
                    {dateDisplay}
                  </span>
                  <span className="text-[10px] text-[#8A8A83] block uppercase tracking-wider">
                    {obs.observation_id.split("-").pop() || "PASS"} • {obs.band.split(" ")[0]}
                  </span>
                  {isSelected && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 bg-[#111111] text-[#FFFFFF] text-[9px] rounded-[2px] font-semibold">
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
