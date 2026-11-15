"use client";

import { useState, useMemo } from "react";
import { Telescope, Orbit } from "lucide-react";

type OrbitPresetKey = "planet_x" | "sedna" | "kbo" | "custom";

interface PlanetXCalculatorProps {
  onApplyCoordinates?: (ra: number, dec: number, targetName: string) => void;
}

export default function PlanetXCalculator({ onApplyCoordinates }: PlanetXCalculatorProps) {
  const [distanceAu, setDistanceAu] = useState<number>(500);
  const [earthMass, setEarthMass] = useState<number>(5.5);
  const [targetType, setTargetType] = useState<OrbitPresetKey>("planet_x");

  const presets: { key: OrbitPresetKey; label: string; au: number; mass: number; desc: string }[] = [
    { key: "planet_x", label: "Illustrative Planet Nine scenario", au: 500, mass: 6.0, desc: "Example parameters only; not a confirmed object or fitted orbit." },
    { key: "sedna", label: "Generic body at 84 AU", au: 84, mass: 0.0003, desc: "Illustrative inputs; mass and orbital elements are not measured here." },
    { key: "kbo", label: "Generic body at 150 AU", au: 150, mass: 0.002, desc: "Illustrative inputs; mass and orbital elements are not measured here." },
    { key: "custom", label: "Custom Outer Body", au: distanceAu, mass: earthMass, desc: "User-defined orbital parameters" }
  ];

  const handleSelectPreset = (key: OrbitPresetKey, au: number, mass: number) => {
    setTargetType(key);
    if (key !== "custom") {
      setDistanceAu(au);
      setEarthMass(mass);
    }
  };

  const astro = useMemo(() => {
    const d = Math.max(distanceAu, 10);
    const m = Math.max(earthMass, 0.0001);

    const maxSixMonthShiftArcsec = (2.0 / d) * 206264.806;

    const periodYears = Math.pow(d, 1.5);
    const orbitalVelKms = 29.78 / Math.sqrt(d);
    const planetToSunMassRatio = m * 3.00349e-6;
    const solarReflexSpeedKms = orbitalVelKms * planetToSunMassRatio / (1 + planetToSunMassRatio);

    const sixMonthOrbitalTravelKm = orbitalVelKms * 0.5 * 365.25 * 86400;
    const distanceKm = d * 1.496e8;
    const sixMonthProperMotionArcsec = (sixMonthOrbitalTravelKm / distanceKm) * 206264.806;

    const parallaxToProperMotionRatio = maxSixMonthShiftArcsec / Math.max(sixMonthProperMotionArcsec, 0.00001);

    const spherexPixelsShift = maxSixMonthShiftArcsec / 6.2;

    return {
      d,
      m,
      maxSixMonthShiftArcsec,
      periodYears,
      orbitalVelKms,
      solarReflexSpeedKms,
      sixMonthProperMotionArcsec,
      parallaxToProperMotionRatio,
      spherexPixelsShift
    };
  }, [distanceAu, earthMass]);

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm p-6 space-y-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] animate-pulse" />
            <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83] tracking-widest font-semibold">
              ORBITAL Educational Module • Idealized Orbit Scenario
            </span>
          </div>
          <h3 className="text-xl font-editorial tracking-tight text-[#111111]">
            Planet X Parallax & Orbital Velocity Simulator
          </h3>
          <p className="text-xs text-[#737373] max-w-2xl">
            Explore an idealized circular-orbit example over 30–1,200 AU. Outputs are geometric scenarios, not a Planet Nine orbit fit, SPHEREx detection forecast, or measured object properties.
          </p>
        </div>

        {onApplyCoordinates && (
          <button
            onClick={() => {
              onApplyCoordinates(133.7951, -7.2451, "WISE 0855-0714");
              const el = document.getElementById("sky-viewer-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#111111] text-[#FFFFFF] text-xs font-mono-sci uppercase tracking-wider rounded-sm hover:bg-[#26282E] transition-all shadow-xs"
          >
            <Telescope className="w-3.5 h-3.5" />
            <span>Load WISE 0855-0714 reference target</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83] font-semibold mr-1">Presets:</span>
        {presets.map((p) => (
          <button
            key={p.key}
            onClick={() => handleSelectPreset(p.key, p.au, p.mass)}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono-sci transition-all ${
              targetType === p.key
                ? "bg-[#111111] text-[#FFFFFF] font-semibold shadow-xs"
                : "bg-[#F7F7F5] border border-[#E7E7E4] text-[#555555] hover:text-[#111111] hover:border-[#111111]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-sci">
            <span className="font-semibold text-[#111111]">HELIOCENTRIC DISTANCE (AU)</span>
            <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">{distanceAu} AU ({(distanceAu * 0.0000158).toFixed(4)} ly)</span>
          </div>
          <input
            type="range"
            min={30}
            max={1200}
            step={10}
            value={distanceAu}
            onChange={(e) => {
              setDistanceAu(parseFloat(e.target.value));
              setTargetType("custom");
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono-sci text-[#8A8A83]">
            <span>30 AU (Neptune)</span>
            <span>500 AU (example)</span>
            <span>1200 AU (example)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono-sci">
            <span className="font-semibold text-[#111111]">PLANETARY MASS (M⊕)</span>
            <span className="text-amber-700 dark:text-amber-300 font-bold text-sm">{earthMass} M⊕ ({earthMass >= 1 ? `${earthMass.toFixed(1)} Earths` : "Dwarf Body"})</span>
          </div>
          <input
            type="range"
            min={0.001}
            max={15}
            step={0.1}
            value={earthMass}
            onChange={(e) => {
              setEarthMass(parseFloat(e.target.value));
              setTargetType("custom");
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono-sci text-[#8A8A83]">
            <span>0.001 M⊕ (example)</span>
            <span>5.0 M⊕ (Super-Earth)</span>
            <span>15 M⊕ (Uranus-mass)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-3.5 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83]">Max 6-Mo. Parallax Shift</span>
          <div className="text-xl font-bold font-mono-sci text-amber-700 dark:text-amber-300">
            {astro.maxSixMonthShiftArcsec >= 60
              ? `${(astro.maxSixMonthShiftArcsec / 60).toFixed(2)}′ (${astro.maxSixMonthShiftArcsec.toFixed(0)}″)`
              : `${astro.maxSixMonthShiftArcsec.toFixed(1)}″`}
          </div>
          <span className="text-[10px] text-[#737373] block">
            2 AU baseline (geometry dependent)
          </span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83]">Orbital Period</span>
          <div className="text-xl font-bold font-mono-sci text-amber-700 dark:text-amber-300">
            {astro.periodYears > 1000
              ? `${(astro.periodYears / 1000).toFixed(1)}k yrs`
              : `${astro.periodYears.toFixed(0)} yrs`}
          </div>
          <span className="text-[10px] text-[#737373] block">
            v = {astro.orbitalVelKms.toFixed(2)} km/s
          </span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83]">Parallax / Orbital Drift Ratio</span>
          <div className="text-xl font-bold font-mono-sci text-amber-700 dark:text-amber-300">
            {astro.parallaxToProperMotionRatio.toFixed(0)}×
          </div>
          <span className="text-[10px] text-[#737373] block">
            Idealized maximum-shift ratio
          </span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83]">Nominal Pixel-Scale Equivalent</span>
          <div className="text-xl font-bold font-mono-sci text-amber-700 dark:text-amber-300">
            {astro.spherexPixelsShift.toFixed(2)} px
          </div>
          <span className="text-[10px] text-[#737373] block">
            At an approximate 6.2″/pixel scale
          </span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm space-y-1">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83]">Solar Reflex Speed</span>
          <div className="text-xl font-bold font-mono-sci text-amber-700 dark:text-amber-300">
            {astro.solarReflexSpeedKms.toExponential(2)} km/s
          </div>
          <span className="text-[10px] text-[#737373] block">Two-body estimate from entered mass</span>
        </div>
      </div>

      <div className="p-4 bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Orbit className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-semibold text-[#111111] font-mono-sci uppercase">
              Interpreting the idealized motion comparison:
            </h4>
            <p className="text-[#555555] leading-relaxed max-w-3xl">
              For the assumed circular orbit at <span className="font-semibold text-amber-800 dark:text-amber-300">{astro.d} AU</span>, the maximum geometric parallax displacement over an idealized 2 AU baseline is <span className="font-semibold text-amber-800 dark:text-amber-300">{astro.maxSixMonthShiftArcsec >= 60 ? `${(astro.maxSixMonthShiftArcsec / 60).toFixed(2)} arcmin (${astro.maxSixMonthShiftArcsec.toFixed(0)}″)` : `${astro.maxSixMonthShiftArcsec.toFixed(1)}″`}</span>. The displayed ratio compares that maximum with this toy model&apos;s six-month orbital travel; real apparent paths depend on orbit, viewing geometry, observing dates, and measurement uncertainty. The pixel equivalent is only a scale conversion and says nothing about detectability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
