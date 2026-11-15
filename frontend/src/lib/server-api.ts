import type { ObservationRecord } from "@/types";

/** Fetch an observation from the backend during a server-rendered request.
 * Vercel injects BACKEND_URL through the frontend service binding at runtime.
 * The localhost fallback keeps ordinary `next dev` usable without Vercel CLI.
 */
export async function fetchServerObservation(id: string): Promise<ObservationRecord> {
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
  const url = new URL(`/api/observations/${encodeURIComponent(id)}`, backendUrl);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Observation ${id} not found`);
  }
  return response.json();
}
