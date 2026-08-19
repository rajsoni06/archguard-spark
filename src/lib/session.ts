import type { ProjectContext } from "./ruleEngine";

const CTX_KEY = "archguard.project.context";
const GRAPH_KEY = "archguard.project.graph";

export interface StoredGraph {
  nodes: unknown[];
  edges: unknown[];
}

const read = <T,>(key: string): T | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

const write = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — session stays in memory only */
  }
};

/** Back-fill defaults for new fields added after initial release. */
const migrateContext = (ctx: ProjectContext | null): ProjectContext | null => {
  if (!ctx) return null;
  // Use Object.assign to avoid duplicate-key TS error with exactOptionalPropertyTypes
  return Object.assign(
    { traffic: "10K RPS", availability: "99.9%", consistency: "Strong", latency: "<100ms" },
    ctx,
  ) as ProjectContext;
};

export const loadContext = () => migrateContext(read<ProjectContext>(CTX_KEY));

export const saveContext = (ctx: ProjectContext) => write(CTX_KEY, ctx);
export const loadGraph = () => read<StoredGraph>(GRAPH_KEY);
export const saveGraph = (graph: StoredGraph) => write(GRAPH_KEY, graph);

export const clearSession = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CTX_KEY);
  window.localStorage.removeItem(GRAPH_KEY);
};
