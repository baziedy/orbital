"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import styles from "@/styles/ResearchWorkspace.module.scss";

import { Activity, ArrowDownToLine, CalendarDays, FileImage, FileText, FolderPlus, ImagePlus, Info, Plus, Save, Search, Trash2 } from "lucide-react";

type EpochImage = {

  id: string;

  name: string;

  type: string;

  size: number;

  observedAt: string;

  band: string;

  ra: string;

  dec: string;

  notes: string;

  blob: Blob;

};

type ResearchAttachment = {

  id: string;

  name: string;

  type: string;

  size: number;

  addedAt: string;

  blob: Blob;

};

type ImageAnalysis = {

  epochAId: string;

  epochBId: string;

  calculatedAt: string;

  baselineDays: number | null;

  meanA: number;

  meanB: number;

  meanChangePct: number | null;

  meanAbsoluteDifference: number;

  centroidShiftPixels: number;

  fieldCenterOffsetArcsec: number | null;

  properMotionArcsecPerYear: number | null;

  tangentialSpeedKmS: number | null;

};

type ResearchStudy = {

  id: string;

  title: string;

  target: string;

  distanceLy: string;

  createdAt: string;

  updatedAt: string;

  notes: string;

  epochs: EpochImage[];

  attachments: ResearchAttachment[];

  analysis: ImageAnalysis | null;

};

const DB_NAME = "orbital-research-workspace-v1";

const STORE_NAME = "studies";

const ACCEPTED_IMAGES = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

const IMAGE_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif";

const ACCEPTED_DATA = new Set(["fits", "fit", "fts", "fz", "gz", "csv", "tsv", "ecsv", "json", "txt", "dat", "md", "yaml", "yml", "xml", "vot", "votable", "npy", "h5", "hdf5", "parquet", "xlsx", "pdf", "zip"]);

const DATA_ACCEPT = ".fits,.fit,.fts,.fz,.fits.gz,.csv,.tsv,.ecsv,.json,.txt,.dat,.md,.yaml,.yml,.xml,.vot,.votable,.npy,.h5,.hdf5,.parquet,.xlsx,.pdf,.zip";

const IMAGE_MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const getImageMimeType = (name: string, type = "") =>
  IMAGE_MIME_TYPES[name.split(".").pop()?.toLowerCase() || ""] ||
  (type.startsWith("image/") ? type : "application/octet-stream");

const isRasterImage = (epoch: EpochImage) => ACCEPTED_IMAGES.has(epoch.name.split(".").pop()?.toLowerCase() || "");

function openDatabase(): Promise<IDBDatabase> {

  return new Promise((resolve, reject) => {

    if (typeof indexedDB === "undefined") return reject(new Error("This browser does not support local research storage."));

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {

      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "id" });

    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () => reject(request.error || new Error("Could not open research storage."));

  });

}

async function loadStudies(): Promise<ResearchStudy[]> {

  const db = await openDatabase();

  return new Promise((resolve, reject) => {

    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();

    request.onsuccess = () => { db.close(); resolve((request.result as ResearchStudy[]).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))); };

    request.onerror = () => { db.close(); reject(request.error || new Error("Could not load saved studies.")); };

  });

}

async function storeStudy(study: ResearchStudy): Promise<void> {

  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {

    const transaction = db.transaction(STORE_NAME, "readwrite");

    transaction.objectStore(STORE_NAME).put(study);

    transaction.oncomplete = () => resolve();

    transaction.onerror = () => reject(transaction.error || new Error("Could not save this study. Check browser storage space."));

    transaction.onabort = () => reject(transaction.error || new Error("Saving this study was cancelled."));

  }).finally(() => db.close());

}

async function deleteStudyRecord(id: string): Promise<void> {

  const db = await openDatabase();

  await new Promise<void>((resolve, reject) => {

    const transaction = db.transaction(STORE_NAME, "readwrite");

    transaction.objectStore(STORE_NAME).delete(id);

    transaction.oncomplete = () => resolve();

    transaction.onerror = () => reject(transaction.error || new Error("Could not delete this study."));

  }).finally(() => db.close());

}

function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`; }

function angularSeparationArcsec(raA: number, decA: number, raB: number, decB: number) {

  const rad = Math.PI / 180;

  const dRa = (raB - raA) * rad;

  const dDec = (decB - decA) * rad;

  const a = Math.sin(dDec / 2) ** 2 + Math.cos(decA * rad) * Math.cos(decB * rad) * Math.sin(dRa / 2) ** 2;

  return 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a)))) / rad * 3600;

}

async function imageMetrics(file: EpochImage) {

  const bitmap = await createImageBitmap(file.blob);

  const width = 320;

  const height = 320;

  const canvas = document.createElement("canvas");

  canvas.width = width;

  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) { bitmap.close(); throw new Error("Your browser could not analyze the selected image."); }

  context.fillStyle = "black";

  context.fillRect(0, 0, width, height);

  const scale = Math.min(width / bitmap.width, height / bitmap.height);

  const drawWidth = bitmap.width * scale;

  const drawHeight = bitmap.height * scale;

  context.drawImage(bitmap, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);

  bitmap.close();

  const pixels = context.getImageData(0, 0, width, height).data;

  const gray = new Float32Array(width * height);

  let sum = 0;

  for (let i = 0, p = 0; i < pixels.length; i += 4, p += 1) {

    const value = 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];

    gray[p] = value;

    sum += value;

  }

  const mean = sum / gray.length;

  const sorted = Array.from(gray).sort((a, b) => a - b);

  const background = sorted[Math.floor(sorted.length * 0.5)];

  let weightSum = 0;

  let xSum = 0;

  let ySum = 0;

  for (let i = 0; i < gray.length; i += 1) {

    const weight = Math.max(0, gray[i] - background);

    weightSum += weight;

    xSum += (i % width) * weight;

    ySum += Math.floor(i / width) * weight;

  }

  return { mean, gray, centroidX: weightSum ? xSum / weightSum : width / 2, centroidY: weightSum ? ySum / weightSum : height / 2, width, height };

}

async function calculateImageAnalysis(a: EpochImage, b: EpochImage, distanceLy: string): Promise<ImageAnalysis> {

  const [imageA, imageB] = await Promise.all([imageMetrics(a), imageMetrics(b)]);

  let absoluteDifference = 0;

  for (let i = 0; i < imageA.gray.length; i += 1) absoluteDifference += Math.abs(imageA.gray[i] - imageB.gray[i]);

  const meanA = imageA.mean;

  const meanB = imageB.mean;

  const raA = Number(a.ra); const decA = Number(a.dec); const raB = Number(b.ra); const decB = Number(b.dec);

  const hasCoordinates = Boolean(a.ra.trim() && a.dec.trim() && b.ra.trim() && b.dec.trim()) && [raA, decA, raB, decB].every(Number.isFinite) && raA >= 0 && raA < 360 && raB >= 0 && raB < 360 && Math.abs(decA) <= 90 && Math.abs(decB) <= 90;

  const dateA = a.observedAt && a.observedAt.trim() ? new Date(`${a.observedAt}T00:00:00Z`).getTime() : null;

  const dateB = b.observedAt && b.observedAt.trim() ? new Date(`${b.observedAt}T00:00:00Z`).getTime() : null;

  const baseline = dateA != null && dateB != null && Number.isFinite(dateA) && Number.isFinite(dateB)
    ? Math.abs((dateB ?? 0) - (dateA ?? 0)) / 86400000
    : null;

  const fieldCenterOffsetArcsec = hasCoordinates ? angularSeparationArcsec(raA, decA, raB, decB) : null;

  const properMotionArcsecPerYear = fieldCenterOffsetArcsec != null && baseline != null && baseline > 0

    ? fieldCenterOffsetArcsec / (baseline / 365.25)

    : null;

  const distanceParsecs = Number(distanceLy) / 3.26156;

  const tangentialSpeedKmS = properMotionArcsecPerYear != null && Number.isFinite(distanceParsecs) && distanceParsecs > 0

    ? 4.74 * properMotionArcsecPerYear * distanceParsecs

    : null;

  return {

    epochAId: a.id,

    epochBId: b.id,

    calculatedAt: new Date().toISOString(),

    baselineDays: baseline,

    meanA,

    meanB,

    meanChangePct: meanA > 0 ? (meanB - meanA) / meanA * 100 : null,

    meanAbsoluteDifference: absoluteDifference / imageA.gray.length,

    centroidShiftPixels: Math.hypot(imageB.centroidX - imageA.centroidX, imageB.centroidY - imageA.centroidY),

    fieldCenterOffsetArcsec,

    properMotionArcsecPerYear,

    tangentialSpeedKmS,

  };

}

function downloadReport(study: ResearchStudy) {

  const analysis = study.analysis;

  const attachmentRows = (study.attachments || []).map((attachment) => `- ${attachment.name} (${formatBytes(attachment.size)})`).join("\n");

  const imageRows = study.epochs.map((epoch, index) => `${index + 1}. ${epoch.name}\n   Date: ${epoch.observedAt || "Not set"} | Band: ${epoch.band || "Not set"}\n   Field center: ${epoch.ra || "—"}° RA, ${epoch.dec || "—"}° Dec\n   Notes: ${epoch.notes || "—"}`).join("\n");

  const result = analysis ? [

    `Epochs compared: ${study.epochs.find((epoch) => epoch.id === analysis.epochAId)?.name || "A"} → ${study.epochs.find((epoch) => epoch.id === analysis.epochBId)?.name || "B"}`,

    `Time baseline: ${analysis.baselineDays == null ? "Unavailable" : `${analysis.baselineDays.toFixed(1)} days`}`,

    `Mean display brightness change: ${analysis.meanChangePct == null ? "Unavailable" : `${analysis.meanChangePct.toFixed(2)}%`}`,

    `Mean absolute display pixel difference: ${analysis.meanAbsoluteDifference.toFixed(2)} / 255`,

    `Brightness-weighted image-center shift: ${analysis.centroidShiftPixels.toFixed(2)} pixels`,

    `Entered field-center separation: ${analysis.fieldCenterOffsetArcsec == null ? "Not calculated (enter RA/Dec for both epochs)" : `${analysis.fieldCenterOffsetArcsec.toFixed(3)} arcsec`}`,

    `Field-center offset rate (not source proper motion): ${analysis.properMotionArcsecPerYear == null ? "Unavailable" : `${analysis.properMotionArcsecPerYear.toFixed(3)} arcsec/year`}`,

    `Illustrative speed derived from field-center offset and entered distance: ${analysis.tangentialSpeedKmS == null ? "Unavailable" : `${analysis.tangentialSpeedKmS.toFixed(2)} km/s`}`,

    "These image calculations are visual comparisons only. They are not calibrated photometry, WCS registration, or object proper-motion measurements.",

  ].join("\n") : "No image comparison has been calculated yet.";

  const report = [`ORBITAL MY RESEARCH REPORT`, `Generated: ${new Date().toISOString()}`, `Study: ${study.title}`, `Target / subject: ${study.target || "Not specified"}`, `Distance: ${study.distanceLy ? `${study.distanceLy} light-years` : "Not provided"}`, "", "IMAGES / EPOCHS", imageRows || "No images added.", "", "SUPPORTING DATA FILES", attachmentRows || "No additional files attached.", "", "COMPARISON CALCULATIONS", result, "", "RESEARCH NOTES", study.notes || "No notes.", ""].join("\n");

  const link = document.createElement("a");

  link.href = URL.createObjectURL(new Blob([report], { type: "text/plain" }));

  link.download = `${study.title.trim().replace(/[^a-z0-9]+/gi, "_") || "orbital_research"}.txt`;

  link.click();

  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);

}

export default function ResearchWorkspace() {

  const [studies, setStudies] = useState<ResearchStudy[]>([]);

  const [activeId, setActiveId] = useState("");

  const [newTitle, setNewTitle] = useState("");

  const [newTarget, setNewTarget] = useState("");

  const [newDistanceLy, setNewDistanceLy] = useState("");

  const [newStudyFiles, setNewStudyFiles] = useState<File[]>([]);

  const [newStudyAttachments, setNewStudyAttachments] = useState<File[]>([]);

  const [newFiles, setNewFiles] = useState<File[]>([]);

  const [newAttachments, setNewAttachments] = useState<File[]>([]);

  const [studyNotesDrafts, setStudyNotesDrafts] = useState<Record<string, string>>({});

  const [query, setQuery] = useState("");

  const [epochAId, setEpochAId] = useState("");

  const [epochBId, setEpochBId] = useState("");

  const [metadataDraft, setMetadataDraft] = useState<Partial<EpochImage>>({});

  const [selectedAttachmentId, setSelectedAttachmentId] = useState("");

  const [attachmentPreview, setAttachmentPreview] = useState<{ id: string; text: string } | null>(null);

  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const imageUrlsRef = useRef<Record<string, { sourceBlob: Blob; url: string }>>({});

  const [viewMode, setViewMode] = useState<"side" | "overlay" | "blink">("overlay");

  const [blinkB, setBlinkB] = useState(false);

  const [blinkSpeedMs, setBlinkSpeedMs] = useState(1000);

  const [overlayPosition, setOverlayPosition] = useState(50);

  const [isSaving, setIsSaving] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const newImagesInput = useRef<HTMLInputElement>(null);

  const addImagesInput = useRef<HTMLInputElement>(null);

  const newDataInput = useRef<HTMLInputElement>(null);

  const addDataInput = useRef<HTMLInputElement>(null);

  useEffect(() => {

    loadStudies().then((saved) => {

      setStudies(saved);

      if (saved[0]) setActiveId(saved[0].id);

    }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load saved research."));

  }, []);

  const activeStudy = studies.find((study) => study.id === activeId) || null;

  const activeEpochs = activeStudy?.epochs;

  const studyNotesDraft = activeStudy ? (studyNotesDrafts[activeStudy.id] ?? activeStudy.notes) : "";

  const activeEpoch = activeStudy?.epochs.find((epoch) => epoch.id === epochAId) || activeStudy?.epochs[0] || null;

  const compareEpochA = activeStudy?.epochs.find((epoch) => epoch.id === epochAId) || activeStudy?.epochs[0] || null;

  const compareEpochB = activeStudy?.epochs.find((epoch) => epoch.id === epochBId) || activeStudy?.epochs[1] || null;

  const selectedAttachment = activeStudy?.attachments?.find((attachment) => attachment.id === selectedAttachmentId) || activeStudy?.attachments?.[0] || null;

  const selectedAnalysis = activeStudy?.analysis && activeStudy.analysis.epochAId === compareEpochA?.id && activeStudy.analysis.epochBId === compareEpochB?.id ? activeStudy.analysis : null;

  const filteredStudies = useMemo(() => studies.filter((study) => `${study.title} ${study.target} ${study.notes}`.toLowerCase().includes(query.trim().toLowerCase())), [studies, query]);

  useEffect(() => {

    if (viewMode !== "blink" || !compareEpochA || !compareEpochB || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => setBlinkB((current) => !current), blinkSpeedMs);

    return () => window.clearInterval(timer);

  }, [viewMode, compareEpochA, compareEpochB, blinkSpeedMs]);

  useEffect(() => {

    let cancelled = false;

    if (!selectedAttachment || selectedAttachment.size > 2 * 1024 * 1024) return () => { cancelled = true; };

    const extension = selectedAttachment.name.split(".").pop()?.toLowerCase() || "";

    const isText = /^(csv|tsv|ecsv|json|txt|dat|md|yaml|yml|xml|vot|votable)$/i.test(extension) || selectedAttachment.type.startsWith("text/") || /json|xml/.test(selectedAttachment.type);

    if (!isText) return () => { cancelled = true; };

    selectedAttachment.blob.text().then((value) => {

      if (cancelled) return;

      if (extension === "json") {

        try { setAttachmentPreview({ id: selectedAttachment.id, text: JSON.stringify(JSON.parse(value), null, 2) }); }

        catch { setAttachmentPreview({ id: selectedAttachment.id, text: value.slice(0, 30000) }); }

      } else setAttachmentPreview({ id: selectedAttachment.id, text: value.slice(0, 30000) });

    }).catch(() => { if (!cancelled) setAttachmentPreview({ id: selectedAttachment.id, text: "Could not read a preview for this file. Download it to inspect the contents." }); });

    return () => { cancelled = true; };

  }, [selectedAttachment]);

  useEffect(() => {

    if (!activeEpochs) {
      Object.values(imageUrlsRef.current).forEach(({ url }) => URL.revokeObjectURL(url));
      imageUrlsRef.current = {};
      return;
    }

    const entries = activeEpochs.filter(isRasterImage);
    const previous = imageUrlsRef.current;
    const next: Record<string, { sourceBlob: Blob; url: string }> = {};

    entries.forEach((epoch) => {
      const current = previous[epoch.id];
      if (current?.sourceBlob === epoch.blob) {
        next[epoch.id] = current;
        return;
      }

      if (current) URL.revokeObjectURL(current.url);

      const type = getImageMimeType(epoch.name, epoch.type);
      const blob = epoch.blob.type === type ? epoch.blob : new Blob([epoch.blob], { type });
      next[epoch.id] = { sourceBlob: epoch.blob, url: URL.createObjectURL(blob) };
    });

    Object.entries(previous).forEach(([id, entry]) => {
      if (!next[id]) URL.revokeObjectURL(entry.url);
    });

    imageUrlsRef.current = next;
    setImageUrls(Object.fromEntries(Object.entries(next).map(([id, entry]) => [id, entry.url])));

  }, [activeEpochs]);

  useEffect(() => () => {
    Object.values(imageUrlsRef.current).forEach(({ url }) => URL.revokeObjectURL(url));
    imageUrlsRef.current = {};

  }, [imageUrlsRef]);

  const validateImages = (files: FileList | File[]) => {

    const accepted: File[] = [];

    const rejected: string[] = [];

    Array.from(files).forEach((file) => {

      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      if (!ACCEPTED_IMAGES.has(extension)) rejected.push(`${file.name}: choose PNG, JPG, WebP, or GIF.`);

      else if (file.size > 100 * 1024 * 1024) rejected.push(`${file.name}: maximum image size is 100 MB.`);

      else accepted.push(file);

    });

    setError(rejected.join(" "));

    return accepted;

  };

  const handleNewImages = (event: ChangeEvent<HTMLInputElement>) => {

    const selectedFiles = Array.from(event.currentTarget.files || []);

    const accepted = validateImages(selectedFiles);

    if (accepted.length) setNewStudyFiles((current) => [...current, ...accepted]);

    event.currentTarget.value = "";

  };

  const handleEpochImages = (event: ChangeEvent<HTMLInputElement>) => {

    const selectedFiles = Array.from(event.currentTarget.files || []);

    const accepted = validateImages(selectedFiles);

    if (accepted.length) setNewFiles((current) => [...current, ...accepted]);

    event.currentTarget.value = "";

  };

  const validateDataFiles = (files: FileList | File[]) => {

    const accepted: File[] = [];

    const rejected: string[] = [];

    Array.from(files).forEach((file) => {

      const extension = file.name.split(".").pop()?.toLowerCase() || "";

      const compressedFits = /\.(fits|fit|fts)\.gz$/i.test(file.name);

      if (!ACCEPTED_DATA.has(extension) || (extension === "gz" && !compressedFits)) rejected.push(`${file.name}: unsupported data file type.`);

      else if (file.size > 100 * 1024 * 1024) rejected.push(`${file.name}: maximum file size is 100 MB.`);

      else accepted.push(file);

    });

    setError(rejected.join(" "));

    return accepted;

  };

  const handleNewData = (event: ChangeEvent<HTMLInputElement>) => {

    const selectedFiles = Array.from(event.currentTarget.files || []);

    const accepted = validateDataFiles(selectedFiles);

    if (accepted.length) setNewStudyAttachments((current) => [...current, ...accepted]);

    event.currentTarget.value = "";

  };

  const handleMoreData = (event: ChangeEvent<HTMLInputElement>) => {

    const selectedFiles = Array.from(event.currentTarget.files || []);

    const accepted = validateDataFiles(selectedFiles);

    if (accepted.length) setNewAttachments((current) => [...current, ...accepted]);

    event.currentTarget.value = "";

  };

  const makeEpochs = (images: File[]): EpochImage[] => images.map((file) => {
    const type = getImageMimeType(file.name, file.type);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      type,
      size: file.size,
      observedAt: "",
      band: "",
      ra: "",
      dec: "",
      notes: "",
      blob: file.slice(0, file.size, type),
    };
  });

  const makeAttachments = (files: File[]): ResearchAttachment[] => files.map((file) => ({

    id: crypto.randomUUID(), name: file.name, type: file.type || "application/octet-stream", size: file.size, addedAt: new Date().toISOString(), blob: file.slice(0, file.size, file.type || "application/octet-stream"),

  }));

  const commitStudy = async (updated: ResearchStudy, confirmation = "Research saved on this device."): Promise<boolean> => {

    setIsSaving(true);

    setError("");

    try {

      await storeStudy(updated);

      setStudies((current) => [updated, ...current.filter((study) => study.id !== updated.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));

      setActiveId(updated.id);

      setMessage(confirmation);

      window.setTimeout(() => setMessage(""), 2200);

      return true;

    } catch (reason) {

      setError(reason instanceof Error ? reason.message : "Could not save research on this device.");

      return false;

    } finally { setIsSaving(false); }

  };

  const createStudy = async () => {

    if (!newTitle.trim()) { setError("Add a title for this research study first."); return; }

    if ((newFiles.length || newAttachments.length) && !window.confirm("There are unsaved files staged for the currently selected study. Create this new study and discard those staged files?")) return;

    const study: ResearchStudy = { id: crypto.randomUUID(), title: newTitle.trim(), target: newTarget.trim(), distanceLy: newDistanceLy, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), notes: "", epochs: makeEpochs(newStudyFiles), attachments: makeAttachments(newStudyAttachments), analysis: null };

    if (await commitStudy(study, "Study created and saved.")) {

      setSelectedAttachmentId(study.attachments[0]?.id || "");

      setNewTitle(""); setNewTarget(""); setNewDistanceLy(""); setNewStudyFiles([]); setNewStudyAttachments([]); setNewFiles([]); setNewAttachments([]);

    }

  };

  const addEpochs = async () => {

    if (!activeStudy || !newFiles.length) return;

    if (await commitStudy({ ...activeStudy, epochs: [...activeStudy.epochs, ...makeEpochs(newFiles)], updatedAt: new Date().toISOString(), analysis: null }, `${newFiles.length} image${newFiles.length === 1 ? "" : "s"} added to the study.`)) {

      setNewFiles([]);

    }

  };

  const addAttachments = async () => {

    if (!activeStudy || !newAttachments.length) return;

    const savedAttachments = makeAttachments(newAttachments);

    if (await commitStudy({ ...activeStudy, attachments: [...(activeStudy.attachments || []), ...savedAttachments], updatedAt: new Date().toISOString() }, `${newAttachments.length} supporting file${newAttachments.length === 1 ? "" : "s"} saved with the study.`)) {

      setSelectedAttachmentId(savedAttachments[0]?.id || "");

      setNewAttachments([]);

    }

  };

  const removeAttachment = async (attachment: ResearchAttachment) => {

    if (!activeStudy) return;

    const nextAttachments = (activeStudy.attachments || []).filter((entry) => entry.id !== attachment.id);

    const nextSelectedId = selectedAttachmentId === attachment.id ? nextAttachments[0]?.id || "" : selectedAttachmentId;

    if (await commitStudy({ ...activeStudy, attachments: nextAttachments, updatedAt: new Date().toISOString() }, "Supporting file removed.")) {

      setSelectedAttachmentId(nextSelectedId);

      setAttachmentPreview((current) => (current && current.id === attachment.id ? null : current));

    }

  };

  const downloadAttachment = (attachment: ResearchAttachment) => {

    const url = URL.createObjectURL(attachment.blob);

    const link = document.createElement("a"); link.href = url; link.download = attachment.name; link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  };

  const updateActiveStudy = (updates: Partial<ResearchStudy>, confirmation?: string) => {

    if (!activeStudy) return;

    void commitStudy({ ...activeStudy, ...updates, updatedAt: new Date().toISOString() }, confirmation);

  };

  const saveEpochMetadata = () => {

    if (!activeStudy || !activeEpoch) return;

    const epochs = activeStudy.epochs.map((epoch) => epoch.id === activeEpoch.id ? { ...epoch, ...metadataDraft } : epoch);

    updateActiveStudy({ epochs, analysis: null }, "Image details saved.");

    setMetadataDraft({});

  };

  const runComparison = async () => {

    if (!activeStudy || !compareEpochA || !compareEpochB || compareEpochA.id === compareEpochB.id) return;

    setIsSaving(true); setError(""); setMessage("");

    try {

      const analysis = await calculateImageAnalysis(compareEpochA, compareEpochB, activeStudy.distanceLy);

      await commitStudy({ ...activeStudy, analysis, updatedAt: new Date().toISOString() }, "Image comparison calculated and saved with this study.");

    } catch (reason) {

      setError(reason instanceof Error ? reason.message : "Could not calculate this image comparison.");

      setIsSaving(false);

    }

  };

  const removeEpoch = async (epoch: EpochImage) => {

    if (!activeStudy || !window.confirm(`Remove “${epoch.name}” from this study?`)) return;

    await commitStudy({ ...activeStudy, epochs: activeStudy.epochs.filter((entry) => entry.id !== epoch.id), analysis: null, updatedAt: new Date().toISOString() }, "Image removed from the study.");

  };

  const deleteStudy = async (study: ResearchStudy) => {

    if (!window.confirm(`Delete “${study.title}” and its saved images? This cannot be undone.`)) return;

    try {

      await deleteStudyRecord(study.id);

      const remaining = studies.filter((entry) => entry.id !== study.id);

      setStudies(remaining);

      if (activeId === study.id) { setNewFiles([]); setNewAttachments([]); }

      setActiveId(remaining[0]?.id || "");

      setMessage("Study deleted.");

    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete this study."); }

  };

  const exportEpoch = (epoch: EpochImage) => {

    const url = URL.createObjectURL(epoch.blob);

    const link = document.createElement("a"); link.href = url; link.download = epoch.name; link.click();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

  };

  const comparisonMetrics = selectedAnalysis ? [

    { label: "Time baseline", value: selectedAnalysis.baselineDays == null ? "Add dates" : selectedAnalysis.baselineDays === 0 ? "Same day" : `${selectedAnalysis.baselineDays.toFixed(1)} days` },

    { label: "Mean brightness change", value: selectedAnalysis.meanChangePct == null ? "Add image data" : `${selectedAnalysis.meanChangePct.toFixed(2)}%` },

    { label: "Mean pixel difference", value: `${selectedAnalysis.meanAbsoluteDifference.toFixed(2)} / 255` },

    { label: "Image-center shift", value: `${selectedAnalysis.centroidShiftPixels.toFixed(2)} px` },

    { label: "Field-center offset", value: selectedAnalysis.fieldCenterOffsetArcsec == null ? "Add RA/Dec" : `${selectedAnalysis.fieldCenterOffsetArcsec.toFixed(3)}″` },

    { label: "Field-center offset rate", value: selectedAnalysis.properMotionArcsecPerYear == null ? "Add dates + RA/Dec" : `${selectedAnalysis.properMotionArcsecPerYear.toFixed(3)}″/yr` },

    { label: "Illustrative speed from field centers", value: selectedAnalysis.tangentialSpeedKmS == null ? "Add distance" : `${selectedAnalysis.tangentialSpeedKmS.toFixed(2)} km/s` },

  ] : [];

  return <main className={`${styles.pageShell} mx-auto w-full max-w-[1600px] space-y-8 px-4 py-8 text-[#17191C] sm:px-6 lg:px-10 lg:py-12`}>

    <header className="flex flex-col gap-5 border-b border-[#E6E9ED] pb-7 sm:flex-row sm:items-end sm:justify-between">

      <div><span className="font-mono-sci text-xs uppercase tracking-[.2em] text-sky-700">Explore · Compare · Save</span><h1 className="mt-1 font-editorial text-3xl tracking-tight text-[#111] sm:text-4xl">My Research</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#666]">Build a study from your own images. Add as many observing epochs as you need, compare any two, record the setup, and save the calculations and notes with the study.</p></div>

      <span className="shrink-0 rounded-lg border border-[#E6E9ED] bg-white px-3 py-2 font-mono-sci text-xs text-[#666]">{studies.length} SAVED STUD{studies.length === 1 ? "Y" : "IES"}</span>

    </header>

    <div className={`${styles.workspaceLayout} grid min-w-0 gap-7 xl:gap-9`}>

      <aside className="space-y-4">

        <section className="rounded-lg border border-[#E6E9ED] bg-white p-5 shadow-sm">

          <div className="mb-3 flex items-center gap-2"><FolderPlus className="h-4 w-4 text-sky-700"/><h2 className="font-editorial text-lg">Start a study</h2></div>

          <div className="space-y-2.5">

            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Study title" aria-label="New study title" className="w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />

            <input value={newTarget} onChange={(event) => setNewTarget(event.target.value)} placeholder="Target or subject (optional)" aria-label="Target or subject" className="w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />

            <input type="number" min="0" step="any" value={newDistanceLy} onChange={(event) => setNewDistanceLy(event.target.value)} placeholder="Distance in light-years (optional)" aria-label="Target distance in light-years" className="w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />

            <input ref={newImagesInput} type="file" multiple accept={IMAGE_ACCEPT} onChange={handleNewImages} className="hidden" />

            <button type="button" onClick={() => newImagesInput.current?.click()} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-[#D7DDE4] bg-[#F7F9FB] px-3 py-3 text-xs text-[#444] hover:border-sky-500 hover:text-sky-700"><ImagePlus className="h-4 w-4"/>Choose image epochs</button>

            <input ref={newDataInput} type="file" multiple accept={DATA_ACCEPT} onChange={handleNewData} className="hidden" />

            <button type="button" onClick={() => newDataInput.current?.click()} className="w-full rounded-lg border border-dashed border-[#D7DDE4] px-3 py-2 text-xs text-[#666] hover:border-sky-500 hover:text-sky-700">Attach supporting data (FITS, CSV, text, PDF…)</button>

            {newStudyFiles.length > 0 && <div className="max-h-28 space-y-1 overflow-y-auto rounded-lg bg-sky-50 p-2">{newStudyFiles.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{file.name}</span><button type="button" onClick={() => setNewStudyFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`} className="text-[#888] hover:text-red-700"><Trash2 className="h-3 w-3"/></button></div>)}</div>}

            {newStudyAttachments.length > 0 && <p className="text-xs text-[#666]">{newStudyAttachments.length} supporting data file{newStudyAttachments.length === 1 ? "" : "s"} attached</p>}

            <button type="button" onClick={() => void createStudy()} disabled={!newTitle.trim() || isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#17191C] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#30343A] disabled:opacity-40"><Plus className="h-3.5 w-3.5"/>Create research study</button>

          </div>

        </section>

        <section className="rounded-lg border border-[#E6E9ED] bg-white p-4 shadow-sm">

          <div className="mb-2 flex items-center justify-between"><h2 className="font-editorial text-lg">Saved studies</h2><span className="font-mono-sci text-xs text-[#888]">{filteredStudies.length}</span></div>

          <label className="mb-2 flex items-center gap-2 rounded-lg border border-[#E6E9ED] px-2"><Search className="h-3 w-3 text-[#888]"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a study…" className="min-w-0 flex-1 py-2 text-xs outline-none" /></label>

          <div className="max-h-72 space-y-1 overflow-y-auto">{filteredStudies.map((study) => <div key={study.id} className={`flex items-center gap-1 rounded-lg border p-1 ${activeId === study.id ? "border-sky-200 bg-sky-50" : "border-transparent hover:bg-[#F7F9FB]"}`}><button type="button" onClick={() => {

            if (activeId !== study.id && (newFiles.length || newAttachments.length) && !window.confirm("Discard the files waiting to be saved to the current study?")) return;

            if (activeId !== study.id) { setNewFiles([]); setNewAttachments([]); }

            setActiveId(study.id); setMetadataDraft({});

          }} className="min-w-0 flex-1 px-2 py-2 text-left"><span className="block truncate text-xs font-semibold text-[#222]">{study.title}</span><span className="block truncate font-mono-sci text-xs text-[#888]">{study.target || "No target"} · {study.epochs.length} image{study.epochs.length === 1 ? "" : "s"}</span></button><button type="button" onClick={() => void deleteStudy(study)} aria-label={`Delete ${study.title}`} className="rounded p-1.5 text-[#888] hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5"/></button></div>)}

            {filteredStudies.length === 0 && <p className="px-2 py-5 text-center text-xs text-[#888]">{studies.length ? "No matching study." : "Create a study to begin."}</p>}

          </div>

        </section>

        <p className="px-1 text-xs leading-relaxed text-[#888]">Research studies and uploaded images are saved in this browser on this device. They are not sent to the ORBITAL server.</p>

      </aside>

      <section className="min-w-0 space-y-6">

        {(error || message) && <p role={error ? "alert" : "status"} className={`rounded-lg px-3 py-2 text-xs ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{error || message}</p>}

        {!activeStudy ? <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-[#D8DEE6] bg-white px-6 text-center"><FileImage className="h-9 w-9 text-sky-700"/><h2 className="mt-3 font-editorial text-2xl">Your research bench</h2><p className="mt-2 max-w-md text-sm leading-relaxed text-[#737373]">Create a study, then add two or more images as observation epochs. You can compare the images, enter coordinates and dates, and save a report with your notes.</p></div> : <>

          <div className="flex flex-col gap-3 rounded-lg border border-[#E6E9ED] bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">

            <div className="min-w-0"><span className="font-mono-sci text-xs uppercase tracking-widest text-sky-700">Research study</span><h2 className="break-words font-editorial text-2xl text-[#111]">{activeStudy.title}</h2><p className="mt-1 text-xs text-[#737373]">{activeStudy.target || "Target or subject not specified"}{activeStudy.distanceLy ? ` · ${activeStudy.distanceLy} ly` : ""} · created {new Date(activeStudy.createdAt).toLocaleDateString()}</p></div>

            <div className="flex shrink-0 flex-wrap gap-2"><input ref={addImagesInput} type="file" multiple accept={IMAGE_ACCEPT} onChange={handleEpochImages} className="hidden" /><button type="button" onClick={() => addImagesInput.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-[#E6E9ED] bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:border-sky-500"><ImagePlus className="h-3.5 w-3.5"/>Add epochs</button><button type="button" onClick={() => downloadReport(activeStudy)} className="flex items-center gap-1.5 rounded-lg bg-[#111] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303030]"><ArrowDownToLine className="h-3.5 w-3.5"/>Export study report</button></div>

          </div>

          {newFiles.length > 0 && <div className="flex flex-col gap-2 rounded-lg border border-sky-200 bg-sky-50 p-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-xs text-sky-950">{newFiles.length} image{newFiles.length === 1 ? "" : "s"} ready to add to <strong>{activeStudy.title}</strong></span><div className="flex items-center gap-2"><button type="button" onClick={() => void addEpochs()} disabled={isSaving} className="rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Save epochs</button></div></div>}

          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(260px,.8fr)]">

            <div className="min-w-0 space-y-5">

              <section className={`${styles.comparePanel} min-w-0 overflow-hidden rounded-2xl border border-[#E6E9ED] bg-white shadow-sm`}>

                <div className={styles.compareHeader}>
                  <div className="min-w-0"><span className="font-mono-sci text-[10px] uppercase tracking-[0.2em] text-sky-700">Observation preview</span><h3 className="mt-1 font-editorial text-xl font-semibold text-[#17191C]">Multi-epoch comparison</h3><p className="mt-1 text-xs text-[#777]">Review changes between two observations</p></div>
                  <div className={styles.epochPickers}>
                    <label className={styles.epochPicker}><span>Reference</span><select aria-label="Reference image" value={compareEpochA?.id || ""} onChange={(event) => setEpochAId(event.target.value)}>{activeStudy.epochs.map((epoch, index) => <option key={epoch.id} value={epoch.id}>{index + 1}. {epoch.name}</option>)}</select></label>
                    <label className={styles.epochPicker}><span>Comparison</span><select aria-label="Comparison image" value={compareEpochB?.id || ""} onChange={(event) => setEpochBId(event.target.value)}>{activeStudy.epochs.map((epoch, index) => <option key={epoch.id} value={epoch.id}>{index + 1}. {epoch.name}</option>)}</select></label>
                  </div>
                </div>

                {compareEpochA && compareEpochB && compareEpochA.id !== compareEpochB.id && imageUrls[compareEpochA.id] && imageUrls[compareEpochB.id] ? <>

                  <div className={styles.compareToolbar}>
                    <div className={styles.viewModes}>{(["side", "overlay", "blink"] as const).map((mode) => <button type="button" key={mode} onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} className={styles.viewModeButton}>{mode === "side" ? "Side by side" : mode === "overlay" ? "Split view" : "Blink"}</button>)}</div>
                    <button type="button" onClick={() => void runComparison()} disabled={isSaving} className={styles.analyzeButton}><Activity className="h-3.5 w-3.5"/>{isSaving ? "Calculating…" : "Calculate changes"}</button>
                  </div>

                  {viewMode === "side" && <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2"><EpochPreview epoch={compareEpochA} src={imageUrls[compareEpochA.id]} label="Before · Observation A"/><EpochPreview epoch={compareEpochB} src={imageUrls[compareEpochB.id]} label="After · Observation B"/></div>}

                  {viewMode === "overlay" && <div className={styles.comparisonWorkspace}>
                    <div className={styles.comparisonStage}>
                      <Image src={imageUrls[compareEpochB.id]} alt={`Comparison epoch ${compareEpochB.name}`} width={1600} height={900} unoptimized className={styles.comparisonImage}/>
                      <Image src={imageUrls[compareEpochA.id]} alt={`Reference epoch ${compareEpochA.name}`} width={1600} height={900} unoptimized className={styles.comparisonImage} style={{ clipPath: `inset(0 ${100 - overlayPosition}% 0 0)` }}/>
                      <div className={`${styles.observationCard} ${styles.observationBefore}`}><span>Before · Observation A</span><strong>{compareEpochA.observedAt || "Date not set"}</strong><small>{compareEpochA.band || "Band not specified"}</small></div>
                      <div className={`${styles.observationCard} ${styles.observationAfter}`}><span>After · Observation B</span><strong>{compareEpochB.observedAt || "Date not set"}</strong><small>{compareEpochB.band || "Band not specified"}</small></div>
                      <div className={styles.sliderDivider} style={{ left: `${overlayPosition}%` }}><span className={styles.sliderHandle}><span/></span></div>
                      <input aria-label="Drag to compare observations" type="range" min="0" max="100" value={overlayPosition} onChange={(event) => setOverlayPosition(Number(event.target.value))} className={styles.comparisonRange}/>
                    </div>
                  </div>}

                  {viewMode === "blink" && <div className={styles.blinkWorkspace}>
                    <div className={styles.blinkControls} role="group" aria-label="Blink cadence">
                      <span className={styles.blinkControlsLabel}>Blink cadence</span>
                      {[{ label: "0.5s", ms: 500 }, { label: "1s", ms: 1000 }, { label: "2s", ms: 2000 }].map((speed) => <button
                        key={speed.ms}
                        type="button"
                        aria-pressed={blinkSpeedMs === speed.ms}
                        onClick={() => setBlinkSpeedMs(speed.ms)}
                        className={styles.blinkSpeedButton}
                      >{speed.label}</button>)}
                      <span className={styles.blinkHint}>per image</span>
                    </div>
                    <div className={styles.blinkPreview}>
                      <EpochPreview epoch={blinkB ? compareEpochB : compareEpochA} src={imageUrls[(blinkB ? compareEpochB : compareEpochA).id]} label={blinkB ? "After · Observation B" : "Before · Observation A"}/>
                    </div>
                  </div>}

                  <p className={styles.compareDisclaimer}><Info className="mt-0.5 h-3.5 w-3.5 shrink-0"/>Image comparisons are display-level only. They are not WCS registered, PSF matched, or calibrated scientific measurements.</p>

                </> : <div className="flex min-h-44 flex-col items-center justify-center rounded-lg border border-dashed border-[#D8DEE6] bg-[#F7F9FB] px-4 text-center"><FileImage className="h-6 w-6 text-[#AAA]"/><p className="mt-2 text-xs font-semibold text-[#555]">Add at least two supported images to compare epochs.</p><p className="mt-1 text-xs text-[#888]">PNG, JPG, WebP, and GIF images can be previewed here.</p></div>}

              </section>

              {selectedAnalysis && <section className={styles.resultsPanel} aria-labelledby="comparison-results-title">
                <div className={styles.resultsHeader}>
                  <div>
                    <div className={styles.resultsEyebrow}><span aria-hidden="true"/>Observation Comparison · Motion Analysis</div>
                    <h3 id="comparison-results-title" className={styles.resultsTitle}>What Changed Between These Observations?</h3>
                    <p className={styles.resultsDescription}>Display-level image statistics and field-center context for the selected epochs.</p>
                  </div>
                  <span className={styles.resultsBadge}>DISPLAY-LEVEL</span>
                </div>
                <div className={styles.metricGrid}>
                  {comparisonMetrics.map(({ label, value }, index) => <div key={label} className={styles.metricCard} data-tone={index % 4}>
                    <span className={styles.metricLabel}>{label}</span>
                    <span className={styles.metricValue}>{value}</span>
                  </div>)}
                </div>
              </section>}

              <section className="rounded-lg border border-[#E6E9ED] bg-white p-5 shadow-sm">

                <div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="font-editorial text-xl">Image epochs</h3><p className="text-xs text-[#777]">Add dates, bands, field centers, and per-image notes.</p></div><span className="font-mono-sci text-xs text-[#888]">{activeStudy.epochs.length} EPOCH{activeStudy.epochs.length === 1 ? "" : "S"}</span></div>

                {activeStudy.epochs.length === 0 ? <p className="rounded-lg bg-[#F7F9FB] p-4 text-center text-xs text-[#777]">No images yet. Use “Add epochs” to add two or more images.</p> : <div className="grid gap-3 sm:grid-cols-2">{activeStudy.epochs.map((epoch, index) => <article key={epoch.id} className={`min-w-0 overflow-hidden rounded-lg border bg-white p-2 shadow-sm transition-shadow hover:shadow-sm ${activeEpoch?.id === epoch.id ? "border-sky-300 ring-1 ring-sky-100" : "border-[#E6E9ED]"}`}><button type="button" onClick={() => { setEpochAId(epoch.id); setMetadataDraft({}); }} className="group relative mb-2 flex aspect-[1.7] w-full items-center justify-center overflow-hidden bg-[#111]">{imageUrls[epoch.id] ? <Image src={imageUrls[epoch.id]} alt={epoch.name} width={1200} height={800} unoptimized className="h-full w-full object-contain transition-transform group-hover:scale-[1.02]"/> : <span className="text-xs text-white/70">Image preview unavailable</span>}<span className="absolute left-2 top-2 rounded-lg bg-black/70 px-2 py-1 font-mono-sci text-xs text-white">EPOCH {index + 1}</span></button><div className="flex min-w-0 items-center justify-between gap-1"><button type="button" onClick={() => { setEpochAId(epoch.id); setMetadataDraft({}); }} className="truncate text-left text-xs font-semibold text-[#333]">{epoch.name}</button><span className="flex shrink-0 items-center"><button type="button" onClick={() => exportEpoch(epoch)} aria-label={`Download ${epoch.name}`} className="rounded p-1.5 text-[#777] hover:bg-white hover:text-sky-700"><ArrowDownToLine className="h-3.5 w-3.5"/></button><button type="button" onClick={() => void removeEpoch(epoch)} aria-label={`Remove ${epoch.name} from study`} className="rounded p-1.5 text-[#777] hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5"/></button></span></div><p className="mt-1 flex flex-wrap items-center gap-1 font-mono-sci text-xs text-[#777]"><span className="rounded-lg bg-sky-50 px-1.5 py-1 text-sky-800">{epoch.observedAt || "Date not set"}</span><span className="rounded-lg bg-violet-50 px-1.5 py-1 text-violet-800">{epoch.band || "Band not set"}</span><span className="px-1 py-1">{formatBytes(epoch.size)}</span></p></article>)}</div>}

              </section>

            </div>

            <aside className="min-w-0 space-y-5">

              {activeEpoch && <section className="rounded-lg border border-[#E6E9ED] bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-700"/><h3 className="font-editorial text-xl">Epoch details</h3></div><p className="mb-3 break-all text-xs font-semibold text-[#444]">{activeEpoch.name}</p><div className="space-y-2"><label className="block text-xs uppercase tracking-wide text-[#777]">Observation date<input type="date" value={metadataDraft.observedAt ?? activeEpoch.observedAt} onChange={(event) => setMetadataDraft((current) => ({ ...current, observedAt: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-[#222]"/></label><label className="block text-xs uppercase tracking-wide text-[#777]">Band / filter<input value={metadataDraft.band ?? activeEpoch.band} onChange={(event) => setMetadataDraft((current) => ({ ...current, band: event.target.value }))} placeholder="e.g. 2MASS K band" className="mt-1 w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 normal-case"/></label><div className="grid grid-cols-2 gap-2"><label className="text-xs uppercase tracking-wide text-[#777]">RA · degrees<input type="number" step="any" value={metadataDraft.ra ?? activeEpoch.ra} onChange={(event) => setMetadataDraft((current) => ({ ...current, ra: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"/></label><label className="text-xs uppercase tracking-wide text-[#777]">Dec · degrees<input type="number" step="any" value={metadataDraft.dec ?? activeEpoch.dec} onChange={(event) => setMetadataDraft((current) => ({ ...current, dec: event.target.value }))} className="mt-1 w-full rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"/></label></div><label className="block text-xs uppercase tracking-wide text-[#777]">Epoch notes<textarea value={metadataDraft.notes ?? activeEpoch.notes} onChange={(event) => setMetadataDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Instrument, exposure, source, or observation notes" className="mt-1 w-full resize-y rounded-lg border border-[#E6E9ED] bg-white px-3 py-2.5 text-sm text-[#20242A] outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 normal-case"/></label><button type="button" onClick={saveEpochMetadata} disabled={isSaving} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E6E9ED] px-3 py-2 text-xs font-semibold hover:border-sky-500 disabled:opacity-50"><Save className="h-3.5 w-3.5"/>Save image details</button></div></section>}

              <section className="overflow-hidden rounded-lg border border-[#E6E9ED] bg-white shadow-sm">

                <div className="flex items-center justify-between gap-3 border-b border-[#E6E9ED] bg-[#F7F9FB] px-4 py-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-100 bg-sky-50 text-sky-700"><FileText className="h-4 w-4"/></span><div><h3 className="font-editorial text-lg">Supporting files</h3><p className="font-mono-sci text-xs uppercase tracking-wide text-[#888]">Data · spectra · source files</p></div></div><input ref={addDataInput} type="file" multiple accept={DATA_ACCEPT} onChange={handleMoreData} className="hidden"/><button type="button" onClick={() => addDataInput.current?.click()} className="rounded-lg bg-[#111] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303030]">Attach files</button></div>

                {newAttachments.length > 0 && <div className="space-y-2 border-b border-sky-100 bg-sky-50/70 p-3"><p className="text-xs font-medium text-sky-950">{newAttachments.length} file{newAttachments.length === 1 ? "" : "s"} ready · save to add to this study</p><div className="max-h-24 space-y-1 overflow-y-auto">{newAttachments.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 text-xs text-[#444]"><span className="truncate">{file.name} · {formatBytes(file.size)}</span><button type="button" onClick={() => setNewAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))} aria-label={`Remove ${file.name}`} className="rounded p-1 hover:bg-white"><Trash2 className="h-3 w-3"/></button></div>)}</div><button type="button" onClick={() => void addAttachments()} disabled={isSaving} className="w-full rounded-lg bg-sky-700 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50">{isSaving ? "Saving files…" : "Save files with this study"}</button></div>}

                <div className="grid min-w-0 sm:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">

                  <div className="max-h-52 min-w-0 space-y-1 overflow-y-auto border-b border-[#E6E9ED] p-2 sm:border-b-0 sm:border-r">{(activeStudy.attachments || []).map((attachment) => <div key={attachment.id} className={`flex items-center gap-1 rounded-lg border p-1 ${selectedAttachment?.id === attachment.id ? "border-sky-200 bg-sky-50" : "border-transparent hover:border-[#E6E9ED]"}`}><button type="button" onClick={() => setSelectedAttachmentId(attachment.id)} className="min-w-0 flex-1 px-1.5 py-1 text-left"><span className="block truncate text-xs font-medium text-[#333]">{attachment.name}</span><span className="font-mono-sci text-xs text-[#888]">{formatBytes(attachment.size)}</span></button><button type="button" onClick={() => downloadAttachment(attachment)} aria-label={`Download ${attachment.name}`} className="rounded p-1.5 text-[#777] hover:bg-white hover:text-sky-700"><ArrowDownToLine className="h-3.5 w-3.5"/></button><button type="button" onClick={() => void removeAttachment(attachment)} aria-label={`Remove ${attachment.name}`} className="rounded p-1.5 text-[#777] hover:bg-red-50 hover:text-red-700"><Trash2 className="h-3.5 w-3.5"/></button></div>)}{!(activeStudy.attachments || []).length && !newAttachments.length && <p className="py-5 text-center text-xs text-[#888]">No supporting files yet.</p>}</div>

                  <div className="min-h-32 min-w-0 bg-white p-3">{selectedAttachment ? <><div className="mb-2 flex items-center justify-between gap-2"><span className="truncate font-mono-sci text-xs uppercase tracking-wide text-[#777]">Preview · {selectedAttachment.name}</span><span className="shrink-0 text-xs text-[#999]">{formatBytes(selectedAttachment.size)}</span></div>{attachmentPreview?.id === selectedAttachment.id ? <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-[#E6E9ED] bg-[#F7F9FB] p-2.5 font-mono-sci text-xs leading-relaxed text-[#444]">{attachmentPreview.text}</pre> : selectedAttachment.size > 2 * 1024 * 1024 ? <p className="rounded-lg bg-[#F7F9FB] p-3 text-xs leading-relaxed text-[#666]">Text preview is limited to files under 2 MB. Download this file to inspect the full contents.</p> : <p className="rounded-lg bg-[#F7F9FB] p-3 text-xs leading-relaxed text-[#666]">This file type does not have an inline text preview. Download it to open it in a compatible viewer.</p>}</> : <p className="flex min-h-24 items-center justify-center text-center text-xs text-[#888]">Attach or select a text file to preview it here.</p>}</div>

                </div>

              </section>

              <section className="w-full min-w-0 rounded-sm border border-[#E7E7E4] bg-white p-3 shadow-xs" aria-label="Research study notes">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-mono-sci text-[9px] uppercase tracking-widest text-[#0284C7]">Research workspace</span>
                    <h3 className="truncate font-editorial text-lg">Study Notes</h3>
                  </div>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#737373]">Saved with this study and included in its exported report.</p>
                <textarea
                  aria-label="Write study notes"
                  value={studyNotesDraft}
                  onChange={(event) => setStudyNotesDrafts((current) => ({ ...current, [activeStudy.id]: event.target.value }))}
                  onBlur={() => { if (studyNotesDraft !== activeStudy.notes) updateActiveStudy({ notes: studyNotesDraft }, "Study notes saved."); }}
                  rows={7}
                  placeholder="Record an observation, hypothesis, or follow-up question…"
                  className="orbital-note-editor mt-3 min-h-32 w-full resize-y overflow-auto rounded-sm border border-[#E7E7E4] bg-[#FAFAF8] p-3 text-sm leading-relaxed outline-none focus:border-[#0284C7]"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => updateActiveStudy({ notes: studyNotesDraft }, "Study notes saved.")}
                    disabled={isSaving || studyNotesDraft === activeStudy.notes}
                    className="inline-flex items-center gap-2 rounded-sm bg-[#111111] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303030] disabled:opacity-40"
                  >
                    <Save className="h-3.5 w-3.5"/>
                    Save note
                  </button>
                </div>
              </section>

              <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><div className="mb-1 flex items-center gap-1.5 font-semibold"><Info className="h-3.5 w-3.5"/>How to read these calculations</div><p>Brightness and pixel differences depend on image scaling, background, exposure, and filter. Entered RA/Dec separation compares the field centers you supply. These values are exploratory display calculations, not calibrated object measurements.</p></section>

            </aside>

          </div>

        </>}

      </section>

    </div>

  </main>;

}

function EpochPreview({ epoch, src, label }: { epoch: EpochImage; src: string; label: string }) {

  return <figure className="min-w-0 overflow-hidden rounded-lg border border-[#E6E9ED] bg-[#111]"><div className="flex aspect-square max-h-[520px] items-center justify-center"><Image src={src} alt={`${label}: ${epoch.name}`} width={1200} height={1200} unoptimized className="h-full w-full object-contain"/></div><figcaption className="truncate bg-white px-2.5 py-2 text-xs text-[#555]">{label} · {epoch.observedAt || "Date not set"} · {epoch.band || "Band not set"}</figcaption></figure>;

}
