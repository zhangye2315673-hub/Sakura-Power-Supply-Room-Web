const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = 1600;
const HEIGHT = 1000;
const OUTWARD_BIAS = 40;

type Edge = 'top' | 'right' | 'bottom' | 'left';
type LocalPoint = readonly [tangent: number, inward: number];
type ClusterTuple = readonly [
  center: number,
  radius: number,
  depth: number,
  lean: number,
  birth: number,
  variant: number,
];

type ShardKind = 'blade' | 'slab' | 'chip';
type ShardDefinition = Readonly<{
  kind: ShardKind;
  offset: number;
  width: number;
  depth: number;
  tip: number;
  base: number;
  birth: number;
  palette: number;
}>;

type ShapePart = Readonly<{
  element: SVGPolygonElement;
  points: readonly LocalPoint[];
  anchor: number;
  birthOffset: number;
  dayFill: string;
  nightFill: string;
  dayStroke: string;
  nightStroke: string;
  strokeWidth: number;
}>;

type CrystalCluster = Readonly<{
  edge: Edge;
  center: number;
  birth: number;
  group: SVGGElement;
  parts: readonly ShapePart[];
}>;

type RootPart = Readonly<{
  edge: Edge;
  birth: number;
  element: SVGPolygonElement;
  samples: readonly number[];
  strokeWidth: number;
}>;

export type RefrigeratorIceOutlineMode = 'full' | 'half' | 'none';

const TOP: readonly ClusterTuple[] = [
  [18, 126, 178, 12, 0.18, 0],
  [190, 104, 126, -13, 0.38, 2],
  [410, 82, 92, 10, 0.56, 1],
  [650, 108, 132, -18, 0.34, 3],
  [890, 72, 80, 8, 0.62, 1],
  [1110, 96, 112, 15, 0.46, 2],
  [1340, 118, 148, -14, 0.32, 3],
  [1582, 142, 192, -18, 0.17, 0],
] as const;

const BOTTOM: readonly ClusterTuple[] = [
  [18, 168, 228, 22, 0.16, 0],
  [250, 140, 178, -22, 0.31, 3],
  [500, 92, 108, 14, 0.52, 1],
  [720, 68, 72, -8, 0.63, 2],
  [935, 78, 86, 8, 0.58, 1],
  [1165, 112, 138, -18, 0.43, 2],
  [1390, 152, 198, 20, 0.27, 3],
  [1582, 172, 236, -22, 0.15, 0],
] as const;

const LEFT: readonly ClusterTuple[] = [
  [28, 118, 168, 14, 0.19, 0],
  [225, 88, 112, -12, 0.43, 2],
  [455, 72, 84, 9, 0.61, 1],
  [690, 90, 118, -15, 0.47, 3],
  [875, 116, 164, 17, 0.28, 2],
  [985, 132, 190, -18, 0.17, 0],
] as const;

const RIGHT: readonly ClusterTuple[] = [
  [26, 132, 188, -16, 0.18, 0],
  [220, 96, 126, 14, 0.39, 3],
  [445, 74, 88, -9, 0.59, 1],
  [675, 92, 122, 15, 0.45, 2],
  [865, 122, 172, -18, 0.27, 3],
  [986, 142, 202, 20, 0.16, 0],
] as const;

const SHARD_VARIANTS: readonly (readonly ShardDefinition[])[] = [
  [
    { kind: 'slab', offset: -0.42, width: 0.56, depth: 0.66, tip: -0.34, base: 0.04, birth: 0, palette: 1 },
    { kind: 'blade', offset: 0.46, width: 0.44, depth: 0.78, tip: 0.58, base: 0.02, birth: 0.035, palette: 0 },
    { kind: 'slab', offset: 0, width: 0.72, depth: 1, tip: 0.16, base: 0.08, birth: 0.075, palette: 2 },
    { kind: 'chip', offset: -0.56, width: 0.38, depth: 0.38, tip: -0.7, base: 0.12, birth: 0.13, palette: 3 },
  ],
  [
    { kind: 'chip', offset: -0.48, width: 0.5, depth: 0.46, tip: -0.62, base: 0.04, birth: 0, palette: 0 },
    { kind: 'blade', offset: 0.08, width: 0.6, depth: 1, tip: -0.08, base: 0.06, birth: 0.055, palette: 2 },
    { kind: 'slab', offset: 0.55, width: 0.43, depth: 0.58, tip: 0.7, base: 0.1, birth: 0.12, palette: 1 },
  ],
  [
    { kind: 'blade', offset: -0.4, width: 0.52, depth: 0.78, tip: -0.55, base: 0.03, birth: 0, palette: 1 },
    { kind: 'slab', offset: 0.2, width: 0.66, depth: 1, tip: 0.34, base: 0.07, birth: 0.06, palette: 0 },
    { kind: 'chip', offset: 0.64, width: 0.34, depth: 0.42, tip: 0.72, base: 0.14, birth: 0.135, palette: 3 },
  ],
  [
    { kind: 'chip', offset: -0.68, width: 0.38, depth: 0.42, tip: -0.78, base: 0.06, birth: 0, palette: 3 },
    { kind: 'slab', offset: -0.32, width: 0.58, depth: 0.82, tip: -0.46, base: 0.04, birth: 0.025, palette: 0 },
    { kind: 'blade', offset: 0.26, width: 0.55, depth: 1, tip: 0.42, base: 0.07, birth: 0.075, palette: 2 },
    { kind: 'slab', offset: 0.68, width: 0.35, depth: 0.54, tip: 0.78, base: 0.13, birth: 0.14, palette: 1 },
  ],
] as const;

const PALETTES = [
  { base: '#9edfe2', dark: '#60bbc9', light: '#d6f0e8', shine: '#f5efd8' },
  { base: '#7dced8', dark: '#55b4c5', light: '#c8ece6', shine: '#edf1d8' },
  { base: '#b7e6e3', dark: '#72c5cf', light: '#e1f2e9', shine: '#f7efd7' },
  { base: '#a6dadd', dark: '#69bfcb', light: '#d7ede4', shine: '#f4ebcf' },
] as const;

const NIGHT_PALETTES = [
  { base: '#527f8d', dark: '#345e70', light: '#769ca4', shine: '#9fb6ad' },
  { base: '#456f80', dark: '#2d5669', light: '#688f9a', shine: '#8fa99f' },
  { base: '#648e98', dark: '#426d7c', light: '#89a8aa', shine: '#a8b9ad' },
  { base: '#577d88', dark: '#385f70', light: '#77999d', shine: '#9cafaa' },
] as const;

const ICE_OUTLINE_DAY = '#496a8d';
const ICE_OUTLINE_NIGHT = '#263b50';
const ICE_FACET_DAY = '#587b98';
const ICE_FACET_NIGHT = '#35566b';

const ROOTS: readonly Readonly<{ edge: Edge; birth: number; samples: readonly number[] }>[] = [
  { edge: 'top', birth: 0.03, samples: [24, 17, 28, 19, 23, 15, 27, 18, 25, 16, 22, 14, 26, 18, 24, 16, 27] },
  { edge: 'right', birth: 0.07, samples: [22, 16, 27, 18, 24, 15, 28, 17, 23, 19, 26] },
  { edge: 'bottom', birth: 0.11, samples: [26, 18, 23, 15, 28, 19, 24, 16, 27, 17, 22, 14, 26, 18, 24, 16, 28] },
  { edge: 'left', birth: 0.15, samples: [24, 17, 27, 15, 22, 18, 28, 16, 25, 19, 26] },
] as const;

export type RefrigeratorScreenIceDiagnostics = Readonly<{
  progress: number;
  visible: boolean;
  crystalCount: number;
  visibleCrystalCount: number;
  connectedRootCount: number;
  centerObscured: false;
}>;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp01((value - edge0) / Math.max(1e-6, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(SVG_NS, tag);
}

function globalPoint(edge: Edge, center: number, point: LocalPoint): readonly [number, number] {
  if (edge === 'top') return [center + point[0], point[1]];
  if (edge === 'bottom') return [center + point[0], HEIGHT - point[1]];
  if (edge === 'left') return [point[1], center + point[0]];
  return [WIDTH - point[1], center + point[0]];
}

function pointString(points: readonly (readonly [number, number])[]): string {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

function mixHexColor(from: string, to: string, amount: number): string {
  const fromValue = Number.parseInt(from.slice(1), 16);
  const toValue = Number.parseInt(to.slice(1), 16);
  const channel = (shift: number): number => Math.round(
    ((fromValue >> shift) & 0xff) * (1 - amount) + ((toValue >> shift) & 0xff) * amount,
  );
  return `rgb(${channel(16)} ${channel(8)} ${channel(0)})`;
}

export class RefrigeratorScreenIceOverlay {
  readonly root: SVGSVGElement;
  private readonly backgroundGrade: SVGRectElement;
  private readonly crystals: CrystalCluster[] = [];
  private readonly roots: RootPart[] = [];
  private progress = 0;
  private themeProgress = 0;
  private outlineScale = 0.5;
  private visibleCrystalCount = 0;
  private connectedRootCount = 0;

  constructor(canvas: HTMLCanvasElement) {
    const parent = canvas.parentElement;
    if (!parent) throw new Error('Refrigerator screen ice requires a canvas parent.');
    this.root = createSvgElement('svg');
    this.root.id = 'refrigerator-screen-ice';
    this.root.classList.add('refrigerator-screen-ice');
    this.root.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    this.root.setAttribute('preserveAspectRatio', 'none');
    this.root.setAttribute('shape-rendering', 'geometricPrecision');
    this.root.setAttribute('aria-hidden', 'true');

    this.backgroundGrade = createSvgElement('rect');
    this.backgroundGrade.setAttribute('width', `${WIDTH}`);
    this.backgroundGrade.setAttribute('height', `${HEIGHT}`);
    this.backgroundGrade.setAttribute('fill', '#e7f5f3');
    this.backgroundGrade.style.opacity = '0';
    this.root.append(this.backgroundGrade);

    for (const spec of ROOTS) this.roots.push(this.createRoot(spec.edge, spec.birth, spec.samples));
    this.addCrystals('top', TOP);
    this.addCrystals('right', RIGHT);
    this.addCrystals('bottom', BOTTOM);
    this.addCrystals('left', LEFT);
    canvas.insertAdjacentElement('afterend', this.root);
    this.setProgress(0);
  }

  setProgress(value: number): void {
    const progress = clamp01(value);
    if (Math.abs(progress - this.progress) < 0.0005) return;
    this.progress = progress;
    this.root.classList.toggle('visible', progress > 0.002);
    const gradeOpacity = progress * (0.16 - this.themeProgress * 0.035);
    this.backgroundGrade.style.opacity = `${gradeOpacity}`;
    this.connectedRootCount = 0;
    for (const root of this.roots) {
      const local = smoothstep(0, 1, progress);
      root.element.style.opacity = local > 0.01 ? `${Math.min(1, local * 1.28)}` : '0';
      root.element.setAttribute('points', pointString(this.rootPoints(root, local)));
      if (local > 0.94) this.connectedRootCount += 1;
    }

    this.visibleCrystalCount = 0;
    for (const crystal of this.crystals) {
      let clusterGrowth = 0;
      for (const part of crystal.parts) {
        // The border and every crystal layer share one growth curve; append order supplies depth.
        const local = smoothstep(0, 1, progress);
        clusterGrowth = Math.max(clusterGrowth, local);
        part.element.style.display = local > 0.008 ? '' : 'none';
        part.element.style.opacity = `${smoothstep(0.02, 0.2, local)}`;
        const grown = part.points.map(([tangent, inward]): LocalPoint => [
          part.anchor + (tangent - part.anchor) * (0.14 + local * 0.86),
          inward * local,
        ]);
        part.element.setAttribute(
          'points',
          pointString(grown.map((point) => globalPoint(crystal.edge, crystal.center, point))),
        );
      }
      crystal.group.style.display = clusterGrowth > 0.008 ? '' : 'none';
      // Diagnostics count established crystal bodies, not the first translucent pixels.
      if (clusterGrowth > 0.6) this.visibleCrystalCount += 1;
    }
  }

  setThemeProgress(value: number): void {
    const next = clamp01(value);
    if (Math.abs(next - this.themeProgress) < 0.001) return;
    this.themeProgress = next;
    this.backgroundGrade.setAttribute('fill', mixHexColor('#e7f5f3', '#142536', next));
    this.backgroundGrade.style.opacity = `${this.progress * (0.16 - next * 0.035)}`;
    this.updateAppearance();
  }

  setOutlineMode(mode: RefrigeratorIceOutlineMode): void {
    this.outlineScale = mode === 'none' ? 0 : mode === 'half' ? 0.5 : 1;
    this.updateAppearance();
  }

  get diagnostics(): RefrigeratorScreenIceDiagnostics {
    return {
      progress: this.progress,
      visible: this.progress > 0.002,
      crystalCount: this.crystals.length,
      visibleCrystalCount: this.visibleCrystalCount,
      connectedRootCount: this.connectedRootCount,
      centerObscured: false,
    };
  }

  dispose(): void {
    this.root.remove();
  }

  private addCrystals(edge: Edge, specs: readonly ClusterTuple[]): void {
    for (const [center, radius, depth, lean, birth, variant] of specs) {
      this.crystals.push(this.createCluster(edge, center, radius, depth, lean, birth, variant));
    }
  }

  private createCluster(
    edge: Edge,
    center: number,
    radius: number,
    depth: number,
    lean: number,
    birth: number,
    variant: number,
  ): CrystalCluster {
    const group = createSvgElement('g');
    group.classList.add('refrigerator-ice-crystal');
    const parts: ShapePart[] = [];
    for (const shard of SHARD_VARIANTS[variant % SHARD_VARIANTS.length]) {
      this.addShard(group, parts, edge, radius, depth, lean, shard);
    }
    this.root.append(group);
    return { edge, center, birth, group, parts };
  }

  private addShard(
    group: SVGGElement,
    parts: ShapePart[],
    edge: Edge,
    radius: number,
    depth: number,
    clusterLean: number,
    shard: ShardDefinition,
  ): void {
    const anchor = radius * shard.offset;
    const tangentScale = edge === 'top' ? 0.68 : 1;
    const halfWidth = radius * shard.width * tangentScale;
    const base = depth * shard.base;
    const shardDepth = depth * shard.depth * (edge === 'top' ? 1.1 : 1);
    const tip = radius * shard.tip + clusterLean * shard.depth;
    const left: LocalPoint = [anchor - halfWidth, base];
    const right: LocalPoint = [anchor + halfWidth, base + depth * 0.018];
    let outline: readonly LocalPoint[];
    let darkFacet: readonly LocalPoint[];
    let lightFacet: readonly LocalPoint[];
    let shineFacet: readonly LocalPoint[];

    const shapeKind: ShardKind = edge === 'top' ? 'blade' : shard.kind;
    if (shapeKind === 'blade') {
      const leftShoulder: LocalPoint = [anchor - halfWidth * 0.68, shardDepth * 0.58];
      const rightShoulder: LocalPoint = [anchor + halfWidth * 0.72, shardDepth * 0.34];
      const tipPoint: LocalPoint = [tip, shardDepth];
      const join: LocalPoint = [anchor + (tip - anchor) * 0.2, shardDepth * 0.36];
      outline = [left, right, rightShoulder, tipPoint, leftShoulder];
      darkFacet = [left, leftShoulder, tipPoint, join];
      lightFacet = [join, right, rightShoulder, tipPoint];
      shineFacet = [join, rightShoulder, [tip * 0.7 + anchor * 0.3, shardDepth * 0.66]];
    } else if (shard.kind === 'slab') {
      const upperLeft: LocalPoint = [anchor - halfWidth * 0.58, shardDepth * 0.76];
      const upperRight: LocalPoint = [anchor + halfWidth * 0.7, shardDepth * 0.68];
      const tipPoint: LocalPoint = [tip, shardDepth];
      const join: LocalPoint = [anchor + halfWidth * 0.05, shardDepth * 0.38];
      outline = [left, right, upperRight, tipPoint, upperLeft];
      darkFacet = [left, upperLeft, tipPoint, join];
      lightFacet = [join, right, upperRight, tipPoint];
      shineFacet = [join, upperRight, [tip * 0.58 + anchor * 0.42, shardDepth * 0.78], tipPoint];
    } else {
      const upperLeft: LocalPoint = [anchor - halfWidth * 0.74, shardDepth * 0.72];
      const upperRight: LocalPoint = [anchor + halfWidth * 0.54, shardDepth * 0.82];
      const tipPoint: LocalPoint = [tip, shardDepth];
      const join: LocalPoint = [anchor - halfWidth * 0.04, shardDepth * 0.42];
      outline = [left, right, upperRight, tipPoint, upperLeft];
      darkFacet = [left, upperLeft, tipPoint, join];
      lightFacet = [join, right, upperRight, tipPoint];
      shineFacet = [join, upperRight, tipPoint];
    }

    const shiftOutward = (points: readonly LocalPoint[]): readonly LocalPoint[] => points.map(
      ([tangent, inward]): LocalPoint => [tangent, inward - OUTWARD_BIAS],
    );
    const palette = PALETTES[shard.palette % PALETTES.length];
    const nightPalette = NIGHT_PALETTES[shard.palette % NIGHT_PALETTES.length];
    parts.push(this.addPolygon(group, shiftOutward(outline), anchor, shard.birth, palette.base, nightPalette.base, ICE_OUTLINE_DAY, ICE_OUTLINE_NIGHT, 4.6));
    parts.push(this.addPolygon(group, shiftOutward(darkFacet), anchor, shard.birth, palette.dark, nightPalette.dark, ICE_FACET_DAY, ICE_FACET_NIGHT, 1.15));
    parts.push(this.addPolygon(group, shiftOutward(lightFacet), anchor, shard.birth, palette.light, nightPalette.light, ICE_FACET_DAY, ICE_FACET_NIGHT, 1.15));
    parts.push(this.addPolygon(group, shiftOutward(shineFacet), anchor, shard.birth, palette.shine, nightPalette.shine, 'none', 'none', 0));
  }

  private addPolygon(
    group: SVGGElement,
    points: readonly LocalPoint[],
    anchor: number,
    birthOffset: number,
    dayFill: string,
    nightFill: string,
    dayStroke: string,
    nightStroke: string,
    strokeWidth: number,
  ): ShapePart {
    const element = createSvgElement('polygon');
    element.setAttribute('fill', dayFill);
    element.setAttribute('stroke', dayStroke);
    element.setAttribute('stroke-width', `${strokeWidth}`);
    element.setAttribute('stroke-linejoin', 'round');
    element.setAttribute('vector-effect', 'non-scaling-stroke');
    group.append(element);
    return {
      element,
      points,
      anchor,
      birthOffset,
      dayFill,
      nightFill,
      dayStroke,
      nightStroke,
      strokeWidth,
    };
  }

  private createRoot(edge: Edge, birth: number, samples: readonly number[]): RootPart {
    const element = createSvgElement('polygon');
    element.classList.add('refrigerator-ice-root');
    element.setAttribute('fill', '#94d5da');
    element.setAttribute('stroke', '#496a8d');
    element.setAttribute('stroke-width', '4.2');
    element.setAttribute('stroke-linejoin', 'round');
    element.setAttribute('vector-effect', 'non-scaling-stroke');
    this.root.append(element);
    return { edge, birth, element, samples, strokeWidth: 4.2 };
  }

  private updateAppearance(): void {
    for (const crystal of this.crystals) {
      for (const part of crystal.parts) {
        part.element.setAttribute('fill', mixHexColor(part.dayFill, part.nightFill, this.themeProgress));
        part.element.setAttribute(
          'stroke',
          part.dayStroke === 'none'
            ? 'none'
            : mixHexColor(part.dayStroke, part.nightStroke, this.themeProgress),
        );
        part.element.setAttribute('stroke-width', `${part.strokeWidth * this.outlineScale}`);
      }
    }
    for (const root of this.roots) {
      root.element.setAttribute('fill', mixHexColor('#94d5da', '#466f7d', this.themeProgress));
      root.element.setAttribute('stroke', mixHexColor(ICE_OUTLINE_DAY, ICE_OUTLINE_NIGHT, this.themeProgress));
      root.element.setAttribute('stroke-width', `${root.strokeWidth * this.outlineScale}`);
    }
  }

  private rootPoints(root: RootPart, growth: number): readonly (readonly [number, number])[] {
    const horizontal = root.edge === 'top' || root.edge === 'bottom';
    const extent = horizontal ? WIDTH : HEIGHT;
    const outer: readonly (readonly [number, number])[] = root.edge === 'top'
      ? [[0, 0], [WIDTH, 0]]
      : root.edge === 'bottom'
        ? [[WIDTH, HEIGHT], [0, HEIGHT]]
        : root.edge === 'left'
          ? [[0, HEIGHT], [0, 0]]
          : [[WIDTH, 0], [WIDTH, HEIGHT]];
    const inner = root.samples.map((sampleDepth, index) => {
      const along = extent * index / (root.samples.length - 1);
      return globalPoint(root.edge, along, [0, sampleDepth * growth]);
    });
    if (root.edge === 'top' || root.edge === 'right') inner.reverse();
    return [...outer, ...inner];
  }
}
