import { canNestBoundary, classifyBoundaryPlacement } from "./boundaryPolicy";
import type { BoundaryKind, Capability, CloudId } from "./catalog";

export interface DiagramNodeLike {
  id: string;
  type?: string;
  position: { x: number; y: number };
  style?: { width?: number | string; height?: number | string };
  data?: Record<string, unknown>;
}

export interface PlacementService {
  id: string;
  category: string;
  caps: Capability[];
}

export interface BoundaryGeometryOptions {
  cloud: CloudId;
  resolveService: (node: DiagramNodeLike) => PlacementService | undefined;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const NODE_W = 176;
export const NODE_H = 66;
export const BOUNDARY_W = 380;
export const BOUNDARY_H = 240;

const NODE_GUARD = 14;
const BOUNDARY_OUTER_GAP = 26;
const BOUNDARY_TOP_GAP = 34;
const BOUNDARY_SIDE_GAP = 28;
const BOUNDARY_MIN_W = 180;
const BOUNDARY_MIN_H = 120;

const BOUNDARY_DEPTH: Record<string, number> = {
  region: 0,
  vpc: 1,
  az: 2,
  "security-boundary": 3,
  "public-subnet": 4,
  "private-subnet": 4,
  "database-layer": 4,
  k8s: 5,
  "service-group": 5,
};

export function boundaryDepth(kind?: string): number {
  if (!kind) return 6;
  return BOUNDARY_DEPTH[kind] ?? 6;
}

export function isBoundaryNode(node: DiagramNodeLike): boolean {
  return node.type === "boundary";
}

export function getBoundaryKind(node: DiagramNodeLike): BoundaryKind | undefined {
  if (!isBoundaryNode(node)) return undefined;
  return (node.data as { kind?: BoundaryKind } | undefined)?.kind;
}

function sizeOf(node: DiagramNodeLike) {
  const width = Number(node.style?.width ?? (isBoundaryNode(node) ? BOUNDARY_W : NODE_W));
  const height = Number(node.style?.height ?? (isBoundaryNode(node) ? BOUNDARY_H : NODE_H));
  return {
    width: Number.isFinite(width) && width > 0 ? width : isBoundaryNode(node) ? BOUNDARY_W : NODE_W,
    height: Number.isFinite(height) && height > 0 ? height : isBoundaryNode(node) ? BOUNDARY_H : NODE_H,
  };
}

export function rectForNode(node: DiagramNodeLike): Rect {
  const size = sizeOf(node);
  return {
    x: node.position.x,
    y: node.position.y,
    width: size.width,
    height: size.height,
  };
}

export function inflateRect(rect: Rect, pad: number): Rect {
  return {
    x: rect.x - pad,
    y: rect.y - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  };
}

export function inflateRectXY(rect: Rect, padX: number, padY: number): Rect {
  return {
    x: rect.x - padX,
    y: rect.y - padY,
    width: rect.width + padX * 2,
    height: rect.height + padY * 2,
  };
}

export function moveRect(rect: Rect, dx: number, dy: number): Rect {
  return { ...rect, x: rect.x + dx, y: rect.y + dy };
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function rectContainsRect(outer: Rect, inner: Rect): boolean {
  return (
    outer.x <= inner.x &&
    outer.y <= inner.y &&
    outer.x + outer.width >= inner.x + inner.width &&
    outer.y + outer.height >= inner.y + inner.height
  );
}

export function rectCenter(rect: Rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

export function unionRect(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let minX = rects[0]!.x;
  let minY = rects[0]!.y;
  let maxX = rects[0]!.x + rects[0]!.width;
  let maxY = rects[0]!.y + rects[0]!.height;
  for (const rect of rects.slice(1)) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function boundaryPadding(kind?: BoundaryKind) {
  switch (kind) {
    case "region":
    case "vpc":
      return { top: BOUNDARY_TOP_GAP + 4, right: BOUNDARY_SIDE_GAP + 6, bottom: BOUNDARY_SIDE_GAP + 6, left: BOUNDARY_SIDE_GAP + 6 };
    case "az":
      return { top: BOUNDARY_TOP_GAP, right: BOUNDARY_SIDE_GAP, bottom: BOUNDARY_SIDE_GAP, left: BOUNDARY_SIDE_GAP };
    case "security-boundary":
      return { top: BOUNDARY_TOP_GAP - 2, right: BOUNDARY_SIDE_GAP, bottom: BOUNDARY_SIDE_GAP, left: BOUNDARY_SIDE_GAP };
    case "public-subnet":
    case "private-subnet":
    case "database-layer":
    case "k8s":
    case "service-group":
    default:
      return { top: BOUNDARY_TOP_GAP - 4, right: BOUNDARY_SIDE_GAP - 2, bottom: BOUNDARY_SIDE_GAP - 2, left: BOUNDARY_SIDE_GAP - 2 };
  }
}

function fitBoundaryRect(boundary: DiagramNodeLike, members: Rect[]) {
  const current = rectForNode(boundary);
  const kind = getBoundaryKind(boundary);
  const union = unionRect(members);
  if (!union) return current;
  const pad = boundaryPadding(kind);
  return {
    x: Math.round(union.x - pad.left),
    y: Math.round(union.y - pad.top),
    width: Math.round(Math.max(BOUNDARY_MIN_W, union.width + pad.left + pad.right)),
    height: Math.round(Math.max(BOUNDARY_MIN_H, union.height + pad.top + pad.bottom)),
  };
}

function pushRectOutOfObstacle(rect: Rect, obstacle: Rect, gap = NODE_GUARD): Rect {
  const expanded = inflateRect(obstacle, gap);
  if (!rectIntersects(rect, expanded)) return rect;

  const center = rectCenter(rect);
  const obstacleCenter = rectCenter(expanded);
  const left = expanded.x - (rect.x + rect.width);
  const right = expanded.x + expanded.width - rect.x;
  const up = expanded.y - (rect.y + rect.height);
  const down = expanded.y + expanded.height - rect.y;

  const horizontal = Math.abs(center.x - obstacleCenter.x) >= Math.abs(center.y - obstacleCenter.y);
  if (horizontal) {
    const dx = center.x < obstacleCenter.x ? left : right;
    return moveRect(rect, dx, 0);
  }

  const dy = center.y < obstacleCenter.y ? up : down;
  return moveRect(rect, 0, dy);
}

function nodeKind(node: DiagramNodeLike): string {
  if (node.type === "boundary") return getBoundaryKind(node) ?? "";
  return String((node.data as { kind?: string } | undefined)?.kind ?? node.type ?? "");
}

function resolveServicePlacement(
  boundary: BoundaryKind,
  node: DiagramNodeLike,
  opts: BoundaryGeometryOptions,
) {
  const svc = opts.resolveService(node);
  if (!svc) return "Allowed" as const;
  return classifyBoundaryPlacement(boundary, { id: svc.id, category: svc.category, caps: svc.caps }, opts.cloud);
}

function isValidBoundaryMember(boundary: BoundaryKind, node: DiagramNodeLike, opts: BoundaryGeometryOptions) {
  return node.type !== "boundary" && node.type !== "text" && resolveServicePlacement(boundary, node, opts) === "Recommended";
}

function containsWithTolerance(outer: Rect, inner: Rect, tolerance = 2) {
  return (
    outer.x <= inner.x + tolerance &&
    outer.y <= inner.y + tolerance &&
    outer.x + outer.width >= inner.x + inner.width - tolerance &&
    outer.y + outer.height >= inner.y + inner.height - tolerance
  );
}

/** Resolve overlaps without moving valid boundary children out of their group. */
function resolveLayoutCollisions<T extends DiagramNodeLike>(nodes: T[], opts: BoundaryGeometryOptions): T[] {
  const next = nodes as DiagramNodeLike[];
  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    const boundaries = next.filter(isBoundaryNode);
    const services = next.filter((node) => node.type !== "boundary" && node.type !== "text");

    // Keep unrelated services outside boundaries and keep sibling boundaries
    // separated. Nested boundaries are allowed only when the parent fully
    // contains the child and the nesting is semantically valid.
    for (let i = 0; i < boundaries.length; i++) {
      const outer = boundaries[i]!;
      const outerRect = rectForNode(outer);
      const outerKind = getBoundaryKind(outer);
      if (!outerKind) continue;

      for (const service of services) {
        if (isValidBoundaryMember(outerKind, service, opts)) continue;
        const serviceRect = inflateRect(rectForNode(service), NODE_GUARD);
        if (!rectIntersects(serviceRect, outerRect)) continue;
        const pushed = pushRectOutOfObstacle(serviceRect, outerRect, BOUNDARY_OUTER_GAP);
        service.position.x = Math.round(pushed.x + NODE_GUARD);
        service.position.y = Math.round(pushed.y + NODE_GUARD);
        moved = true;
      }

      for (let j = i + 1; j < boundaries.length; j++) {
        const inner = boundaries[j]!;
        const innerKind = getBoundaryKind(inner);
        if (!innerKind || canNestBoundary(outerKind, innerKind)) {
          if (innerKind && containsWithTolerance(outerRect, rectForNode(inner))) continue;
        }
        const innerRect = rectForNode(inner);
        if (!rectIntersects(inflateRect(outerRect, NODE_GUARD), innerRect)) continue;
        const pushed = pushRectOutOfObstacle(innerRect, outerRect, BOUNDARY_OUTER_GAP);
        inner.position.x = Math.round(pushed.x);
        inner.position.y = Math.round(pushed.y);
        moved = true;
      }
    }

    // Resolve service collisions by moving the later node the shortest
    // available direction. Boundary fitting on the next pass then follows the
    // moved child rather than leaving a stale oversized container.
    for (let i = 0; i < services.length; i++) {
      const first = services[i]!;
      const firstRect = inflateRect(rectForNode(first), NODE_GUARD);
      for (let j = i + 1; j < services.length; j++) {
        const second = services[j]!;
        const secondRect = inflateRect(rectForNode(second), NODE_GUARD);
        if (!rectIntersects(firstRect, secondRect)) continue;
        const pushed = pushRectOutOfObstacle(secondRect, firstRect, NODE_GUARD);
        second.position.x = Math.round(pushed.x + NODE_GUARD);
        second.position.y = Math.round(pushed.y + NODE_GUARD);
        moved = true;
      }
    }

    if (!moved) break;
  }
  return next as T[];
}

export function normalizeBoundaryLayout<T extends DiagramNodeLike>(nodes: T[], opts: BoundaryGeometryOptions): T[] {
  if (nodes.length === 0) return nodes;

  let next = nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    style: node.style ? { ...node.style } : node.style,
    data: node.data ? { ...node.data } : node.data,
  })) as T[];

  const boundaries = () =>
    next
      .filter(isBoundaryNode)
      .sort((a, b) => boundaryDepth(nodeKind(a)) - boundaryDepth(nodeKind(b)));

  for (let pass = 0; pass < 3; pass++) {
    const currentBoundaries = boundaries();
    if (currentBoundaries.length === 0) break;

    for (const boundary of currentBoundaries) {
      const kind = getBoundaryKind(boundary);
      if (!kind) continue;

      const serviceMembers = next.filter((node) => {
        if (node.id === boundary.id || node.type === "boundary") return false;
        const placement = resolveServicePlacement(kind, node, opts);
        if (node.type === "text") return false;
        return placement === "Recommended";
      });

      const nestedBoundaries = next.filter((node) => {
        if (!isBoundaryNode(node) || node.id === boundary.id) return false;
        const childKind = nodeKind(node) as BoundaryKind;
        if (boundaryDepth(childKind) <= boundaryDepth(kind) || !canNestBoundary(kind, childKind)) return false;
        return next.some((candidate) => {
          if (candidate.type === "boundary" || candidate.type === "text") return false;
          return resolveServicePlacement(childKind, candidate, opts) === "Recommended";
        });
      });

      const memberRects = [
        ...serviceMembers.map((node) => inflateRect(rectForNode(node), NODE_GUARD)),
        ...nestedBoundaries.map((node) => inflateRect(rectForNode(node), NODE_GUARD)),
      ];

      if (memberRects.length > 0) {
        const fitted = fitBoundaryRect(boundary, memberRects);
        boundary.position.x = fitted.x;
        boundary.position.y = fitted.y;
        boundary.style = {
          ...(boundary.style ?? {}),
          width: fitted.width,
          height: fitted.height,
        };
      }

      const updatedBoundaryRect = rectForNode(boundary);
      const outerProtected = inflateRect(updatedBoundaryRect, BOUNDARY_OUTER_GAP);

      for (const node of next) {
        if (node.id === boundary.id) continue;
        if (node.type === "boundary") continue;

        const placement = resolveServicePlacement(kind, node, opts);
        if (placement !== "External") continue;

        const nodeRect = inflateRect(rectForNode(node), NODE_GUARD);
        if (!rectIntersects(nodeRect, outerProtected)) continue;

        const pushed = pushRectOutOfObstacle(nodeRect, updatedBoundaryRect, BOUNDARY_OUTER_GAP);
        node.position.x = Math.round(pushed.x + NODE_GUARD);
        node.position.y = Math.round(pushed.y + NODE_GUARD);
      }
    }
  }

  return resolveLayoutCollisions(next, opts);
}
