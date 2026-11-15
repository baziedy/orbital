"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Activity, Layers, Volume2, Square, Filter } from "lucide-react";

interface SpectralInspectorProps {
  targetName?: string;
  fluxDensity?: string;
}

interface SpectralPoint {
  channel: number;
  wavelength: number;
  arrayIndex: number;
  flux: number;
  coaddedFlux: number;
  isAbsorptionLine?: boolean;
  feature?: string;
}

const SPHEREX_ARRAYS = [
  { index: 1, name: "Array 1", range: "0.75 - 1.09 µm", rPower: "R = 39", startWl: 0.75, endWl: 1.09, bands: 17 },
  { index: 2, name: "Array 2", range: "1.10 - 1.62 µm", rPower: "R = 41", startWl: 1.10, endWl: 1.62, bands: 17 },
  { index: 3, name: "Array 3", range: "1.63 - 2.41 µm", rPower: "R = 41", startWl: 1.63, endWl: 2.41, bands: 17 },
  { index: 4, name: "Array 4", range: "2.42 - 3.82 µm", rPower: "R ~ 35", startWl: 2.42, endWl: 3.82, bands: 17 },
  { index: 5, name: "Array 5", range: "3.83 - 4.41 µm", rPower: "R = 112", startWl: 3.83, endWl: 4.41, bands: 17 },
  { index: 6, name: "Array 6", range: "4.42 - 5.00 µm", rPower: "R = 128", startWl: 4.42, endWl: 5.00, bands: 17 },
];

const MOLECULAR_FEATURES = [
  { wl: 0.84, label: "TiO", array: 1, desc: "Titanium Oxide absorption (cool stellar photosphere)" },
  { wl: 1.66, label: "CH₄", array: 3, desc: "Methane atmospheric band (brown dwarf diagnostic)" },
  { wl: 1.88, label: "Pa-α", array: 3, desc: "Paschen-alpha accretion line" },
  { wl: 2.20, label: "CH₄", array: 3, desc: "Methane atmospheric overtone" },
  { wl: 3.05, label: "H₂O Ice", array: 4, desc: "Water ice absorption band (circumstellar / planetary)" },
  { wl: 3.32, label: "CH₄", array: 4, desc: "Fundamental methane band" },
  { wl: 4.27, label: "CO₂ Ice", array: 5, desc: "Carbon dioxide ice absorption" },
  { wl: 4.67, label: "CO Ice", array: 6, desc: "Carbon monoxide ice feature" },
];

const SONIFICATION_CHANNEL_SECONDS = 0.09;

function createSpectrumAudioBuffer(context: AudioContext, points: SpectralPoint[], useCoaddedFlux: boolean) {
  const samplesPerChannel = Math.max(1, Math.round(SONIFICATION_CHANNEL_SECONDS * context.sampleRate));
  const buffer = context.createBuffer(1, samplesPerChannel * points.length, context.sampleRate);
  const samples = buffer.getChannelData(0);
  const fluxValues = points.map((point) => useCoaddedFlux ? point.coaddedFlux : point.flux);
  const maxFlux = Math.max(...fluxValues, 0.001);
  const minWavelength = points[0]?.wavelength ?? 0.75;
  const maxWavelength = points[points.length - 1]?.wavelength ?? 5;
  const fadeSamples = Math.max(1, Math.round(0.008 * context.sampleRate));

  points.forEach((point, pointIndex) => {
    const wavelengthPosition = Math.max(0, Math.min(1,
      (point.wavelength - minWavelength) / Math.max(0.001, maxWavelength - minWavelength),
    ));
    const frequency = 180 * (6 ** wavelengthPosition);
    const flux = fluxValues[pointIndex];
    const amplitude = (0.012 + (flux / maxFlux) * 0.14) * (point.isAbsorptionLine ? 0.58 : 1);
    const channelStart = pointIndex * samplesPerChannel;

    for (let sampleIndex = 0; sampleIndex < samplesPerChannel; sampleIndex++) {
      const fadeIn = Math.min(1, sampleIndex / fadeSamples);
      const fadeOut = Math.min(1, (samplesPerChannel - sampleIndex - 1) / fadeSamples);
      const envelope = Math.min(fadeIn, fadeOut);
      const time = sampleIndex / context.sampleRate;
      samples[channelStart + sampleIndex] = Math.sin(2 * Math.PI * frequency * time) * amplitude * envelope;
    }
  });

  return buffer;
}

export default function SpectralInspector({ targetName = "WISE 0855-0714" }: SpectralInspectorProps) {
  const [selectedArray, setSelectedArray] = useState<number>(0);
  const [isCoadded, setIsCoadded] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackChannel, setPlaybackChannel] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (playbackFrameRef.current !== null) cancelAnimationFrame(playbackFrameRef.current);
      if (audioSourceRef.current) {
        audioSourceRef.current.onended = null;
        try { audioSourceRef.current.stop(); } catch { /* Playback may already have ended. */ }
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const spectralData = useMemo<SpectralPoint[]>(() => {
    const points: SpectralPoint[] = [];
    const tLower = targetName.toLowerCase();
    const isYBrownDwarf = tLower.includes("wise") || tLower.includes("0855");
    const isBarnard = tLower.includes("barnard");
    const isRDraconis = tLower.includes("draconis");
    const isRWAur = tLower.includes("aurigae");
    const isEpsIndi = tLower.includes("indi") || tLower.includes("eps");
    const isKapteyn = tLower.includes("kapteyn");
    const isWolf = tLower.includes("wolf") || tLower.includes("359");
    const isMira = tLower.includes("mira") || tLower.includes("ceti");
    const isTeegarden = tLower.includes("teegarden");

    let globalChannel = 1;

    SPHEREX_ARRAYS.forEach((arr) => {
      const step = (arr.endWl - arr.startWl) / arr.bands;
      for (let i = 0; i < arr.bands; i++) {
        const wl = parseFloat((arr.startWl + i * step + step / 2).toFixed(3));
        
        let flux = 10.0;
        if (isYBrownDwarf) {
          if (wl < 2.0) flux = 0.15 + (wl - 0.75) * 0.1;
          else if (wl < 3.8) flux = 0.5 + Math.sin(wl * 3) * 0.2;
          else flux = 2.4 + (wl - 3.8) * 1.5;
        } else if (isBarnard) {
          flux = 28.0 * Math.exp(-Math.pow(wl - 1.4, 2) / 0.8) + 12.0;
        } else if (isRDraconis) {
          flux = 45.0 * Math.exp(-Math.pow(wl - 1.8, 2) / 1.5) + 15.0;
        } else if (isRWAur) {
          flux = 14.0 + (wl - 0.75) * 3.5;
        } else if (isEpsIndi) {
          flux = 22.0 * Math.exp(-Math.pow(wl - 1.3, 2) / 0.7) + (wl > 3.0 ? 5.0 : 2.0);
        } else if (isKapteyn) {
          flux = 35.0 * Math.exp(-Math.pow(wl - 1.3, 2) / 0.8) + 14.0;
        } else if (isWolf) {
          flux = 20.0 * Math.exp(-Math.pow(wl - 1.25, 2) / 0.6) + 8.0;
        } else if (isMira) {
          flux = 75.0 * Math.exp(-Math.pow(wl - 1.85, 2) / 1.6) + 30.0;
        } else if (isTeegarden) {
          flux = 16.0 * Math.exp(-Math.pow(wl - 1.15, 2) / 0.5) + 5.0;
        } else {
          flux = 15.0 + Math.sin(wl * 2) * 5.0;
        }

        let featureTag: string | undefined = undefined;
        let isAbs = false;

        MOLECULAR_FEATURES.forEach((feat) => {
          if (Math.abs(wl - feat.wl) < 0.04) {
            flux *= 0.45;
            featureTag = feat.label;
            isAbs = true;
          }
        });

        const noise = (Math.sin(globalChannel * 13) * 0.2);
        const sampleA = Math.max(0.01, parseFloat((flux + noise).toFixed(3)));
        const sampleB = Math.max(0.01, parseFloat((flux + Math.sin(globalChannel * 7.7 + 0.5) * 0.2).toFixed(3)));
        const illustrativeMean = parseFloat(((sampleA + sampleB) / 2).toFixed(3));

        points.push({
          channel: globalChannel,
          wavelength: wl,
          arrayIndex: arr.index,
          flux: sampleA,
          coaddedFlux: illustrativeMean,
          isAbsorptionLine: isAbs,
          feature: featureTag,
        });

        globalChannel++;
      }
    });

    return points;
  }, [targetName]);

  const filteredData = useMemo(() => {
    if (activeFilter === "H2O") return spectralData.filter((p) => p.arrayIndex === 4);
    if (activeFilter === "CH4") return spectralData.filter((p) => p.arrayIndex === 3 || p.arrayIndex === 4);
    if (activeFilter === "CO2") return spectralData.filter((p) => p.arrayIndex === 5);
    if (activeFilter === "CO") return spectralData.filter((p) => p.arrayIndex === 6);
    if (activeFilter === "TIO") return spectralData.filter((p) => p.arrayIndex === 1);
    if (selectedArray === 0) return spectralData;
    return spectralData.filter((p) => p.arrayIndex === selectedArray);
  }, [spectralData, selectedArray, activeFilter]);

  const activePoint = selectedChannel
    ? spectralData.find((p) => p.channel === selectedChannel)
    : filteredData[Math.floor(filteredData.length / 2)];

  const stopSonification = async () => {
    if (playbackFrameRef.current !== null) cancelAnimationFrame(playbackFrameRef.current);
    playbackFrameRef.current = null;
    const source = audioSourceRef.current;
    audioSourceRef.current = null;
    if (source) {
      source.onended = null;
      try { source.stop(); } catch { /* Playback may already have ended. */ }
    }
    const context = audioCtxRef.current;
    audioCtxRef.current = null;
    if (context && context.state !== "closed") await context.close().catch(() => {});
    setIsPlayingAudio(false);
    setPlaybackChannel(null);
  };

  const handleToggleSonification = async () => {
    if (isPlayingAudio) {
      await stopSonification();
      return;
    }

    const browserWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextConstructor = window.AudioContext || browserWindow.webkitAudioContext;
    if (!AudioContextConstructor) {
      setAudioError("Audio playback is not supported by this browser.");
      return;
    }

    setAudioError(null);
    try {
      const context = new AudioContextConstructor();
      audioCtxRef.current = context;
      await context.resume();
      if (context.state !== "running") throw new Error("Audio is paused by the browser. Try pressing play again.");

      const playbackData = filteredData;
      if (playbackData.length === 0) throw new Error("No spectral channels are selected.");
      const source = context.createBufferSource();
      source.buffer = createSpectrumAudioBuffer(context, playbackData, isCoadded);
      source.connect(context.destination);
      const startAt = context.currentTime + 0.025;
      audioSourceRef.current = source;
      source.onended = () => {
        if (audioSourceRef.current !== source) return;
        audioSourceRef.current = null;
        if (playbackFrameRef.current !== null) cancelAnimationFrame(playbackFrameRef.current);
        playbackFrameRef.current = null;
        if (audioCtxRef.current === context) audioCtxRef.current = null;
        setIsPlayingAudio(false);
        setPlaybackChannel(null);
        if (context.state !== "closed") void context.close().catch(() => {});
      };
      source.start(startAt);
      setIsPlayingAudio(true);
      setPlaybackChannel(playbackData[0]?.channel ?? null);

      const updatePlayhead = () => {
        if (audioSourceRef.current !== source || context.state === "closed") {
          playbackFrameRef.current = null;
          return;
        }
        const elapsed = Math.max(0, context.currentTime - startAt);
        const channelIndex = Math.floor(elapsed / SONIFICATION_CHANNEL_SECONDS);
        if (channelIndex >= playbackData.length) {
          setIsPlayingAudio(false);
          setPlaybackChannel(null);
          playbackFrameRef.current = null;
          return;
        }
        setPlaybackChannel(playbackData[channelIndex]?.channel ?? null);
        playbackFrameRef.current = requestAnimationFrame(updatePlayhead);
      };
      playbackFrameRef.current = requestAnimationFrame(updatePlayhead);
    } catch (error) {
      const context = audioCtxRef.current;
      if (context && context.state !== "closed") await context.close().catch(() => {});
      audioCtxRef.current = null;
      audioSourceRef.current = null;
      setIsPlayingAudio(false);
      setPlaybackChannel(null);
      setAudioError(error instanceof Error ? error.message : "Could not start audio. Check your device volume and try again.");
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-6 rounded-sm shadow-xs space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
            <span className="text-[10px] uppercase tracking-mega font-mono-sci text-[#8A8A83] font-semibold">
            Illustrative Spectral Curve • 102 Example Channels
            </span>
          </div>
          <h3 className="text-xl font-editorial tracking-tight text-[#111111] mt-0.5">
            Spectral Curve Explorer & Audio Sonification
          </h3>
          <p className="text-xs text-[#555555] mt-1 max-w-2xl leading-relaxed">
            The curve is generated for demonstration and is not a measured SPHEREx spectrum. Red markers show reference wavelengths; they are not detected features in this target.
          </p>
          <p className="text-[10px] text-[#737373] mt-2 max-w-2xl leading-relaxed font-mono-sci">
            Sonification follows the visible channels at 90 ms per channel ({(filteredData.length * SONIFICATION_CHANNEL_SECONDS).toFixed(1)} s). Wavelength maps to pitch and the illustrative curve value maps to volume.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleSonification}
            aria-pressed={isPlayingAudio}
            className={`px-3.5 py-1.5 rounded-sm text-xs font-mono-sci uppercase tracking-wider flex items-center gap-2 border transition-all ${
              isPlayingAudio
                ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                : "bg-[#111111] text-[#FFFFFF] border-[#111111] hover:bg-[#26282E]"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Sonification</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>Listen to Spectrum (Sonify)</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isPlayingAudio) void stopSonification();
              setIsCoadded((value) => !value);
            }}
            aria-pressed={isCoadded}
            className={`px-3 py-1.5 rounded-sm text-xs font-mono-sci uppercase tracking-wider flex items-center gap-2 border transition-all ${
              isCoadded
                ? "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-300 dark:text-[#111111] dark:border-amber-300"
                : "bg-[#F7F7F5] border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isCoadded ? "Illustrative Co-add" : "Single Band"}</span>
          </button>
        </div>
      </div>

      {audioError && <div role="alert" className="rounded-sm border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">{audioError}</div>}

      {isCoadded && <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100">Illustrative mean of two generated samples. This is not an observed co-add or a signal-to-noise estimate.</p>}

      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm text-xs font-mono-sci">
        <span className="text-[10px] uppercase font-bold text-[#8A8A83] px-2 flex items-center gap-1">
          <Filter className="w-3 h-3" />
          <span>Ice & Volatile Filter:</span>
        </span>
        {[
          { key: "ALL", label: "All 102 Channels" },
          { key: "H2O", label: "Water Ice H₂O (3.05 µm)" },
          { key: "CH4", label: "Methane CH₄ (1.66 - 3.32 µm)" },
          { key: "CO2", label: "CO₂ Ice (4.27 µm)" },
          { key: "CO", label: "CO Ice (4.67 µm)" },
          { key: "TIO", label: "TiO Stellar (0.84 µm)" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => {
              if (isPlayingAudio) void stopSonification();
              setActiveFilter(f.key);
              setSelectedArray(0);
            }}
            className={`px-2.5 py-1 rounded-[2px] transition-all ${
              activeFilter === f.key
                ? "bg-[#111111] text-[#FFFFFF] font-semibold"
                : "text-[#555555] hover:text-[#111111] hover:bg-[#E7E7E4]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 text-xs font-mono-sci">
        <button
          onClick={() => {
            if (isPlayingAudio) void stopSonification();
            setSelectedArray(0);
            setActiveFilter("ALL");
          }}
          className={`py-2 px-3 rounded-sm border text-left transition-colors ${
            selectedArray === 0 && activeFilter === "ALL"
              ? "bg-[#111111] text-[#FFFFFF] border-[#111111] font-semibold"
              : "bg-[#F7F7F5] border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
          }`}
        >
          <div className="text-[10px] uppercase text-[#8A8A83]">Full Sky</div>
          <div className="font-semibold text-xs mt-0.5">All 102 Bands</div>
          <div className="text-[10px] opacity-75">0.75 - 5.0 µm</div>
        </button>

        {SPHEREX_ARRAYS.map((arr) => {
          const isSelected = selectedArray === arr.index && activeFilter === "ALL";
          return (
            <button
              key={arr.index}
              onClick={() => {
                if (isPlayingAudio) void stopSonification();
                setSelectedArray(arr.index);
                setActiveFilter("ALL");
              }}
              className={`py-2 px-3 rounded-sm border text-left transition-colors ${
                isSelected
                  ? "bg-[#111111] text-[#FFFFFF] border-[#111111] font-semibold"
                  : "bg-[#F7F7F5] border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
              }`}
            >
              <div className="text-[10px] uppercase text-[#8A8A83]">{arr.name}</div>
              <div className="font-semibold text-xs mt-0.5">{arr.range}</div>
              <div className="text-[10px] opacity-75">{arr.rPower} (17 ch)</div>
            </button>
          );
        })}
      </div>

      <div className="bg-[#101114] border border-[#26282E] p-4 rounded-sm">
        <div className="flex items-center justify-between text-xs font-mono-sci text-[#9CA3AF] mb-3 pb-2 border-b border-[#26282E]">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider">
              Illustrative Spectral Curve
            </span>
            <span className="text-[#6B7280]">|</span>
            <span>Target: {targetName}</span>
            {playbackChannel && (
              <span className="text-[#F59E0B] font-bold animate-pulse">
                • PLAYING CH #{playbackChannel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-[#38BDF8]" />
              <span>{isCoadded ? "Illustrative 2-sample mean" : "Generated sample (arbitrary units)"}</span>
            </div>
          </div>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={filteredData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
              onClick={(event) => {
                const channel = event?.activePayload?.[0]?.payload?.channel;
                if (typeof channel === "number") setSelectedChannel(channel);
              }}
            >
              <defs>
                <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey="wavelength"
                tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                tickFormatter={(val) => `${val} µm`}
                stroke="#26282E"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                stroke="#26282E"
                domain={[0, "auto"]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as SpectralPoint;
                    return (
                      <div className="bg-[#101114] border border-[#26282E] p-2.5 rounded-sm shadow-xl text-xs font-mono-sci space-y-1">
                        <div className="text-[#38BDF8] font-bold">
                          Channel #{data.channel} (Array {data.arrayIndex})
                        </div>
                        <div className="text-[#FFFFFF]">
                          Wavelength: <span className="text-[#FBBF24]">{data.wavelength} µm</span>
                        </div>
                        <div className="text-[#9CA3AF]">
                          Illustrative value: <span className="text-[#FFFFFF]">{isCoadded ? data.coaddedFlux : data.flux}</span>
                        </div>
                        {data.feature && (
                          <div className="text-[#EF4444] font-semibold pt-1 border-t border-[#26282E]">
                            Feature: {data.feature} Absorption
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {MOLECULAR_FEATURES.map((feat) => (
                <ReferenceLine
                  key={feat.wl}
                  x={feat.wl}
                  stroke="#EF4444"
                  strokeDasharray="3 3"
                  label={{
                    value: feat.label,
                    fill: "#EF4444",
                    fontSize: 9,
                    fontFamily: "monospace",
                    position: "top",
                  }}
                />
              ))}

              {playbackChannel && (
                <ReferenceLine
                  x={spectralData.find((p) => p.channel === playbackChannel)?.wavelength}
                  stroke="#F59E0B"
                  strokeWidth={2}
                />
              )}

              <Area
                type="monotone"
                dataKey={isCoadded ? "coaddedFlux" : "flux"}
                stroke="#38BDF8"
                strokeWidth={2}
                isAnimationActive={false}
                fillOpacity={1}
                fill="url(#spectrumGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-[#26282E] flex flex-wrap items-center gap-3 text-[11px] font-mono-sci text-[#9CA3AF]">
          <span className="text-[#6B7280] uppercase text-[10px]">Reference wavelength markers (not detections):</span>
          {MOLECULAR_FEATURES.map((feat) => (
            <span
              key={`${feat.label}-${feat.wl}`}
              className="px-2 py-0.5 rounded-[2px] bg-[#26282E] text-[#E5E7EB] border border-[#374151] flex items-center gap-1.5"
              title={feat.desc}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              <span>{feat.label} ({feat.wl} µm)</span>
            </span>
          ))}
        </div>
      </div>

      {activePoint && (
        <div className="bg-[#F7F7F5] border border-[#E7E7E4] p-4 rounded-sm grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono-sci">
          <div>
            <span className="text-[10px] uppercase text-[#8A8A83] block">Active Channel</span>
            <span className="font-semibold text-sm text-[#111111]">
              Channel #{activePoint.channel} / 102
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[#8A8A83] block">Central Wavelength</span>
            <span className="font-semibold text-sm text-[#111111]">
              {activePoint.wavelength} µm (Linear Variable Filter)
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[#8A8A83] block">Generated Value</span>
            <span className="font-semibold text-sm text-[#111111]">
              {isCoadded ? activePoint.coaddedFlux : activePoint.flux} (arbitrary units)
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-[#8A8A83] block">Array Configuration</span>
            <span className="font-semibold text-sm text-[#111111]">
              Array {activePoint.arrayIndex} (illustrative example)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
