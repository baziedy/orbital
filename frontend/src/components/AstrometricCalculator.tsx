"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { CheckCircle2 } from "lucide-react";

interface AstrometricCalculatorProps {
  initialRaA?: number;
  initialDecA?: number;
  initialRaB?: number;
  initialDecB?: number;
  initialYearA?: number;
  initialYearB?: number;
  dateA?: string;
  dateB?: string;
  targetName?: string;
  distanceLy?: number;
}

function decimalYearFromDate(dateValue: string | undefined, fallback: number) {
  if (!dateValue) return fallback;
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateValue);
  const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? `${dateValue}T00:00:00Z`
    : hasTimezone ? dateValue : `${dateValue}Z`;
  const timestamp = Date.parse(normalizedDate);
  if (!Number.isFinite(timestamp)) return fallback;

  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const yearStart = Date.UTC(year, 0, 1);
  const nextYearStart = Date.UTC(year + 1, 0, 1);
  return year + (timestamp - yearStart) / (nextYearStart - yearStart);
}

export default function AstrometricCalculator({
  initialRaA = 269.45208,
  initialDecA = 4.69339,
  initialRaB = 269.45197,
  initialDecB = 4.69486,
  initialYearA = 2025.3347,
  initialYearB = 2025.8486,
  dateA,
  dateB,
  distanceLy = 5.96,
}: AstrometricCalculatorProps) {
  const [ra1, setRa1] = useState<number>(initialRaA);
  const [dec1, setDec1] = useState<number>(initialDecA);
  const [year1, setYear1] = useState<number>(() => decimalYearFromDate(dateA, initialYearA));

  const [ra2, setRa2] = useState<number>(initialRaB);
  const [dec2, setDec2] = useState<number>(initialDecB);
  const [year2, setYear2] = useState<number>(() => decimalYearFromDate(dateB, initialYearB));
  const [distLy, setDistLy] = useState<number>(distanceLy);

  const needleRef = useRef<HTMLDivElement>(null);

  const presets = [
    { name: "Barnard's Star", r1: 269.45208, d1: 4.69339, r2: 269.45197, d2: 4.69486, y1: 2025.3347, y2: 2025.8486, dist: 5.96 },
    { name: "WISE 0855-0714", r1: 133.79510, d1: -7.24510, r2: 133.79525, d2: -7.24522, y1: 2025.30, y2: 2025.80, dist: 7.43 },
    { name: "Kapteyn's Star", r1: 77.91917, d1: -45.01833, r2: 77.92180, d2: -45.01990, y1: 2025.26, y2: 2025.78, dist: 12.76 },
    { name: "Wolf 359", r1: 164.12083, d1: 7.01472, r2: 164.11970, d2: 7.01390, y1: 2025.33, y2: 2025.84, dist: 7.86 },
    { name: "Teegarden's Star", r1: 43.25375, d1: 16.88139, r2: 43.25510, d2: 16.88200, y1: 2025.46, y2: 2025.97, dist: 12.50 },
    { name: "Epsilon Indi Ba", r1: 331.04415, d1: -56.78284, r2: 331.04423, d2: -56.78348, y1: 2025.45, y2: 2025.95, dist: 11.81 },
  ];

  const handleApplyPreset = (p: typeof presets[0]) => {
    setRa1(p.r1);
    setDec1(p.d1);
    setRa2(p.r2);
    setDec2(p.d2);
    setYear1(p.y1);
    setYear2(p.y2);
    setDistLy(p.dist);
  };

  const dtYears = (() => {
    const years = Math.abs(year2 - year1);
    return Number.isFinite(years) && years > 0 ? years : null;
  })();
  const coordinatesValid = [ra1, dec1, ra2, dec2].every(Number.isFinite)
    && ra1 >= 0 && ra1 < 360 && ra2 >= 0 && ra2 < 360
    && dec1 >= -90 && dec1 <= 90 && dec2 >= -90 && dec2 <= 90;
  const radiansPerDegree = Math.PI / 180;
  const arcsecondsPerRadian = 206264.806247;
  const deltaRaRad = ((((ra2 - ra1) + 540) % 360) - 180) * radiansPerDegree;
  const dec1Rad = dec1 * radiansPerDegree;
  const dec2Rad = dec2 * radiansPerDegree;
  const haversine = Math.sin((dec2Rad - dec1Rad) / 2) ** 2
    + Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.sin(deltaRaRad / 2) ** 2;
  const clampedHaversine = Math.min(1, Math.max(0, haversine));
  const totalShiftArcsec = coordinatesValid
    ? 2 * Math.atan2(Math.sqrt(clampedHaversine), Math.sqrt(1 - clampedHaversine)) * arcsecondsPerRadian
    : null;
  const properMotionArcsecYr = totalShiftArcsec !== null && dtYears !== null
    ? totalShiftArcsec / dtYears
    : null;
  const positionAngle = coordinatesValid && totalShiftArcsec !== null && totalShiftArcsec > 0
    ? (Math.atan2(
      Math.sin(deltaRaRad) * Math.cos(dec2Rad),
      Math.cos(dec1Rad) * Math.sin(dec2Rad) - Math.sin(dec1Rad) * Math.cos(dec2Rad) * Math.cos(deltaRaRad)
    ) * (180 / Math.PI) + 360) % 360
    : null;
  const meanDecRad = ((dec1 + dec2) / 2) * radiansPerDegree;
  const eastOffsetArcsec = coordinatesValid ? deltaRaRad * Math.cos(meanDecRad) * arcsecondsPerRadian : 0;
  const northOffsetArcsec = coordinatesValid ? (dec2Rad - dec1Rad) * arcsecondsPerRadian : 0;
  const distParsecs = distLy / 3.26156;
  const vtKmS = properMotionArcsecYr !== null && Number.isFinite(distParsecs) && distParsecs > 0
    ? 4.74047 * properMotionArcsecYr * distParsecs
    : null;

  useEffect(() => {
    if (needleRef.current) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(needleRef.current, {
          rotation: (positionAngle ?? 0) - 90,
          transformOrigin: "center center",
        });
        return;
      }
      gsap.to(needleRef.current, {
        rotation: (positionAngle ?? 0) - 90,
        transformOrigin: "center center",
        duration: 0.65,
        ease: "power3.out",
      });
    }
  }, [positionAngle]);

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-6 rounded-sm shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] uppercase tracking-mega font-mono-sci text-[#8A8A83] font-semibold">
              Coordinate Offset Calculator
            </span>
          </div>
          <h3 className="text-xl font-editorial tracking-tight text-[#111111] mt-0.5">
            What Offset Do These Coordinates Define?
          </h3>
          <p className="text-xs text-[#555555] mt-1 max-w-2xl leading-relaxed">
            This calculator reports the angular offset and annualized rate between entered field-center coordinates. It does not track a source or measure proper motion. Any speed estimate also depends on the assumed distance.
          </p>
          <p className="text-[11px] text-amber-800 mt-2 max-w-2xl leading-relaxed">
            Preset coordinates and dates are illustrative examples, not measurements retrieved from an archive or catalog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 font-mono-sci text-xs">
          <span className="text-[#8A8A83] text-[10px] uppercase mr-1">Presets:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-2.5 py-1 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm hover:border-[#111111] text-[#737373] hover:text-[#111111] transition-colors"
            >
              {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono-sci text-xs">
        <div className="p-4 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm space-y-3">
          <div className="flex items-center justify-between text-[#111111] font-semibold border-b border-[#E7E7E4] pb-2">
            <span>Epoch 1 (Reference Pass)</span>
            <span className="text-[#737373] font-normal">T₁ = {year1.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#737373] uppercase block">RA (deg)</label>
              <input
                type="number"
                step="0.0001"
                value={ra1}
                onChange={(e) => setRa1(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FFFFFF] border border-[#E7E7E4] px-2.5 py-1.5 text-xs text-[#111111] rounded-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#737373] uppercase block">Dec (deg)</label>
              <input
                type="number"
                step="0.0001"
                value={dec1}
                onChange={(e) => setDec1(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FFFFFF] border border-[#E7E7E4] px-2.5 py-1.5 text-xs text-[#111111] rounded-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm space-y-3">
          <div className="flex items-center justify-between text-[#111111] font-semibold border-b border-[#E7E7E4] pb-2">
            <span>Epoch 2 (Follow-up Pass)</span>
            <span className="text-[#0284C7] font-semibold">T₂ = {year2.toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-[#737373] uppercase block">RA (deg)</label>
              <input
                type="number"
                step="0.0001"
                value={ra2}
                onChange={(e) => setRa2(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FFFFFF] border border-[#E7E7E4] px-2.5 py-1.5 text-xs text-[#111111] rounded-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#737373] uppercase block">Dec (deg)</label>
              <input
                type="number"
                step="0.0001"
                value={dec2}
                onChange={(e) => setDec2(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#FFFFFF] border border-[#E7E7E4] px-2.5 py-1.5 text-xs text-[#111111] rounded-sm focus:outline-none focus:border-[#111111]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono-sci text-xs">
        <div className="p-4 bg-[#101114] text-[#FFFFFF] border border-[#26282E] rounded-sm space-y-1">
          <span className="text-[10px] uppercase text-[#9CA3AF] block">Annualized Field-Center Offset Rate</span>
          <span className="text-2xl font-bold text-amber-300 block">
            {properMotionArcsecYr === null ? "Unavailable" : `${properMotionArcsecYr.toFixed(2)}″/yr`}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">
            Δθ = {totalShiftArcsec === null ? "N/A" : `${totalShiftArcsec.toFixed(2)}″`} · Baseline: {dtYears === null ? "N/A" : `${(dtYears * 365.25).toFixed(1)} days (${dtYears.toFixed(2)} yr)`}
          </span>
        </div>

        <div className="p-4 bg-[#101114] text-[#FFFFFF] border border-[#26282E] rounded-sm space-y-1">
          <span className="text-[10px] uppercase text-[#9CA3AF] block">Position Angle (PA)</span>
          <span className="text-2xl font-bold text-[#FBBF24] block">
            {positionAngle === null ? "N/A" : `${positionAngle.toFixed(1)}°`}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">N-through-E: {positionAngle === null ? "N/A" : positionAngle > 180 ? `${(360 - positionAngle).toFixed(1)}° W of N` : `${positionAngle.toFixed(1)}° E of N`}</span>
        </div>

        <div className="p-4 bg-[#101114] text-[#FFFFFF] border border-[#26282E] rounded-sm space-y-1">
          <span className="text-[10px] uppercase text-[#9CA3AF] block">Offset-Based Speed Estimate</span>
          <span className="text-2xl font-bold text-amber-200 block">
            {vtKmS === null ? "N/A" : `${vtKmS.toFixed(1)} km/s`}
          </span>
          <span className="text-[10px] text-[#9CA3AF]">Uses assumed distance • {distLy} ly</span>
        </div>

        <div className="p-4 bg-[#101114] text-[#FFFFFF] border border-[#26282E] rounded-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase text-[#9CA3AF] block">Coordinate Offset Vector</span>
            <span className="text-xs font-semibold text-[#FFFFFF] block">
              {!coordinatesValid ? "Invalid coordinates" : `${eastOffsetArcsec >= 0 ? "Eastward" : "Westward"} & ${northOffsetArcsec >= 0 ? "North" : "South"}`}
            </span>
          </div>

          <div className="w-12 h-12 rounded-full border border-[#26282E] relative flex items-center justify-center">
            <span className="absolute -top-3 text-[8px] text-[#9CA3AF]">N</span>
            <span className="absolute -right-3 text-[8px] text-[#9CA3AF]">E</span>
            <div
              ref={needleRef}
              className="w-7 h-0.5 bg-amber-500 origin-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 -mt-0.5 ml-auto" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/60 rounded-sm flex items-center justify-between text-xs font-mono-sci">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
          <span>
            This is a coordinate calculation, not a source-motion measurement or candidate assessment.
          </span>
        </div>
        <span className="text-[#737373] text-[11px] hidden sm:block">
          Baseline: 4.74 · µ · d
        </span>
      </div>
    </div>
  );
}
