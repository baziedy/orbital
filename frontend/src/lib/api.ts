import { SearchResponse, TargetInfo, ObservationRecord, CompareResponse } from "@/types";

let backendWarmupStarted = false;

export function warmBackend(): void {
  if (backendWarmupStarted) return;
  backendWarmupStarted = true;
  void fetch("/api/health", { cache: "no-store" }).catch(() => {});
}

export function refreshImageUrl(url: string): string {
  if (!url.startsWith("/api/images/") && !url.startsWith("/api/diff")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}preview_revision=3`;
}

export async function fetchTargets(): Promise<TargetInfo[]> {
  try {
    const res = await fetch("/api/targets", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch targets");
    return await res.json();
  } catch (err) {
    console.error("Error fetching targets:", err);
    return [];
  }
}

export async function searchSky(params: {
  ra?: number;
  dec?: number;
  radius?: number;
  target_name?: string;
  demo_mode?: boolean;
}): Promise<SearchResponse> {
  const res = await fetch("/api/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ra: params.ra,
      dec: params.dec,
      radius: params.radius ?? 0.01,
      target_name: params.target_name,
      demo_mode: params.demo_mode ?? false,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: "Search request failed" }));
    throw new Error(errorBody.detail || "Search request failed");
  }

  return await res.json();
}

export async function fetchObservations(): Promise<ObservationRecord[]> {
  try {
    const res = await fetch("/api/observations", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch observations");
    return await res.json();
  } catch (err) {
    console.error("Error fetching observations:", err);
    return [];
  }
}

export async function fetchObservation(id: string): Promise<ObservationRecord> {
  const res = await fetch(`/api/observations/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Observation ${id} not found`);
  }
  return await res.json();
}

export async function compareObservations(idA: string, idB: string): Promise<CompareResponse> {
  const res = await fetch("/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ obs_id_a: idA, obs_id_b: idB }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: "Comparison request failed" }));
    throw new Error(errorBody.detail || "Comparison request failed");
  }

  return await res.json();
}
