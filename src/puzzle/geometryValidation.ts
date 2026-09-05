import * as THREE from 'three';
import {
  DIRECTION_VECTORS,
  PLUG_HEAD_BODY_CLEARANCE_LENGTH,
  PLUG_HEAD_MAX_LENGTH,
  PLUG_HEAD_MAX_RADIUS,
  PLUG_HEAD_PIN_CLEARANCE,
  PLUG_HEAD_PIN_RADIUS,
  PLUG_HEAD_CLEARANCE,
  ARROW_RADIUS,
  STATIC_BODY_CLEARANCE,
  STATIC_PLUG_CLEARANCE,
  cableSocketPointsToWorld,
  type ArrowDefinition,
  type CableEnd,
  type GridPoint,
  directionKeyFromDelta,
} from './types';

export type GeometryIssue = {
  kind: 'invalid-segment' | 'shared-lane' | 'body-overlap' | 'self-overlap' | 'plug-overlap' | 'self-plug-overlap' | 'head-tail-overlap';
  arrowId: string;
  otherArrowId?: string;
  distance?: number;
};

function gridSegmentDirection(start: GridPoint, end: GridPoint): GridPoint {
  return [
    Math.sign(end[0] - start[0]),
    Math.sign(end[1] - start[1]),
    Math.sign(end[2] - start[2]),
  ];
}

export function plugEndpointDirectionIsValid(definition: ArrowDefinition): boolean {
  if (definition.path.length < 2) return false;
  const head = definition.path[definition.path.length - 1];
  const previous = definition.path[definition.path.length - 2];
  const outward = gridSegmentDirection(previous, head);
  return directionKeyFromDelta(outward) === definition.exitDirection;
}

export function allPlugEndpointDirectionsAreValid(
  definitions: readonly ArrowDefinition[],
): boolean {
  return definitions.every(plugEndpointDirectionIsValid);
}

type Segment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  index: number;
};

function segmentsFor(definition: ArrowDefinition): Segment[] {
  const socketPoints = cableSocketPointsToWorld(definition);
  return socketPoints.slice(0, -1).map((point, index) => ({
    start: point,
    end: socketPoints[index + 1],
    index,
  }));
}

function pointSegmentDistanceSq(point: THREE.Vector3, start: THREE.Vector3, end: THREE.Vector3): number {
  const delta = end.clone().sub(start);
  const lengthSq = delta.lengthSq();
  if (lengthSq <= 1e-9) return point.distanceToSquared(start);
  const t = THREE.MathUtils.clamp(point.clone().sub(start).dot(delta) / lengthSq, 0, 1);
  return point.distanceToSquared(start.clone().addScaledVector(delta, t));
}

function segmentDistanceSq(a: Segment, b: Segment): number {
  const u = a.end.clone().sub(a.start);
  const v = b.end.clone().sub(b.start);
  const w = a.start.clone().sub(b.start);
  const aa = u.dot(u);
  const bb = u.dot(v);
  const cc = v.dot(v);
  const dd = u.dot(w);
  const ee = v.dot(w);
  const denominator = aa * cc - bb * bb;
  let sNumerator = denominator;
  let sDenominator = denominator;
  let tNumerator = denominator;
  let tDenominator = denominator;

  if (denominator < 1e-9) {
    sNumerator = 0;
    sDenominator = 1;
    tNumerator = ee;
    tDenominator = cc;
  } else {
    sNumerator = bb * ee - cc * dd;
    tNumerator = aa * ee - bb * dd;
    if (sNumerator < 0) {
      sNumerator = 0;
      tNumerator = ee;
      tDenominator = cc;
    } else if (sNumerator > sDenominator) {
      sNumerator = sDenominator;
      tNumerator = ee + bb;
      tDenominator = cc;
    }
  }

  if (tNumerator < 0) {
    tNumerator = 0;
    if (-dd < 0) sNumerator = 0;
    else if (-dd > aa) sNumerator = sDenominator;
    else {
      sNumerator = -dd;
      sDenominator = aa;
    }
  } else if (tNumerator > tDenominator) {
    tNumerator = tDenominator;
    if (-dd + bb < 0) sNumerator = 0;
    else if (-dd + bb > aa) sNumerator = sDenominator;
    else {
      sNumerator = -dd + bb;
      sDenominator = aa;
    }
  }

  const sc = Math.abs(sNumerator) < 1e-9 ? 0 : sNumerator / sDenominator;
  const tc = Math.abs(tNumerator) < 1e-9 ? 0 : tNumerator / tDenominator;
  return w.addScaledVector(u, sc).addScaledVector(v, -tc).lengthSq();
}

function gridSegmentKey(start: GridPoint, end: GridPoint): string {
  const a = start.join(',');
  const b = end.join(',');
  return a < b ? `${a}>${b}` : `${b}>${a}`;
}

function expandUnitEdges(definition: ArrowDefinition): string[] {
  const keys: string[] = [];
  for (let index = 0; index < definition.path.length - 1; index += 1) {
    const start = definition.path[index];
    const end = definition.path[index + 1];
    const delta: GridPoint = [
      Math.sign(end[0] - start[0]),
      Math.sign(end[1] - start[1]),
      Math.sign(end[2] - start[2]),
    ];
    const length = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]) + Math.abs(end[2] - start[2]);
    for (let step = 0; step < length; step += 1) {
      const a: GridPoint = [
        start[0] + delta[0] * step,
        start[1] + delta[1] * step,
        start[2] + delta[2] * step,
      ];
      const b: GridPoint = [a[0] + delta[0], a[1] + delta[1], a[2] + delta[2]];
      keys.push(gridSegmentKey(a, b));
    }
  }
  return keys;
}

type PlugEnvelope = {
  body: Segment;
  contacts: Segment;
};

const PLUG_BODY_RADIUS = PLUG_HEAD_MAX_RADIUS;
const PLUG_CONTACT_RADIUS = PLUG_HEAD_PIN_RADIUS + PLUG_HEAD_PIN_CLEARANCE;
// Generation needs a little more room than the static collision envelope:
// rounded cable fillets and the first frame of a plug pull occupy a visible
// halo around the socket. Without this margin, a head placed immediately
// before a turn can be technically clear yet visually interleave another
// cable's body.
const PLUG_HEAD_GENERATION_CLEARANCE = PLUG_BODY_RADIUS + ARROW_RADIUS + 0.07;

function plugEnvelope(definition: ArrowDefinition, end: CableEnd = 'head'): PlugEnvelope {
  const endpointIndex = end === 'head' ? definition.path.length - 1 : 0;
  const head = cableSocketPointsToWorld(definition)[endpointIndex];
  const directionKey = end === 'head'
    ? definition.exitDirection
    : directionKeyFromDelta([
        Math.sign(definition.path[0][0] - definition.path[1][0]),
        Math.sign(definition.path[0][1] - definition.path[1][1]),
        Math.sign(definition.path[0][2] - definition.path[1][2]),
      ]);
  const direction = DIRECTION_VECTORS[directionKey];
  return {
    body: {
      start: head,
      end: head.clone().addScaledVector(direction, PLUG_HEAD_BODY_CLEARANCE_LENGTH),
      index: -1,
    },
    contacts: {
      start: head.clone().addScaledVector(direction, PLUG_HEAD_BODY_CLEARANCE_LENGTH * 0.88),
      end: head.clone().addScaledVector(direction, PLUG_HEAD_MAX_LENGTH),
      index: -2,
    },
  };
}

function plugEnvelopes(definition: ArrowDefinition): PlugEnvelope[] {
  return definition.doubleEnded
    ? [plugEnvelope(definition, 'head'), plugEnvelope(definition, 'tail')]
    : [plugEnvelope(definition, 'head')];
}

function nonAdjacentSegmentsForPlug(
  segments: readonly Segment[],
  end: CableEnd,
): Segment[] {
  if (segments.length === 0) return [];
  const ordered = end === 'head' ? [...segments].reverse() : [...segments];
  const feedDirection = ordered[0].end.clone().sub(ordered[0].start).normalize();
  const adjacentIndices = new Set<number>();
  for (const segment of ordered) {
    const direction = segment.end.clone().sub(segment.start).normalize();
    if (Math.abs(direction.dot(feedDirection)) < 0.999) break;
    adjacentIndices.add(segment.index);
  }
  return segments.filter((segment) => !adjacentIndices.has(segment.index));
}

function envelopeAgainstBodyIsClear(envelope: PlugEnvelope, segment: Segment): boolean {
  const bodyClearance = PLUG_BODY_RADIUS + ARROW_RADIUS + PLUG_HEAD_CLEARANCE;
  const contactClearance = PLUG_CONTACT_RADIUS + ARROW_RADIUS + PLUG_HEAD_CLEARANCE;
  return segmentDistanceSq(envelope.body, segment) >= bodyClearance ** 2 &&
    segmentDistanceSq(envelope.contacts, segment) >= contactClearance ** 2;
}

function envelopesAreClear(a: PlugEnvelope, b: PlugEnvelope): boolean {
  const bodyBody = PLUG_BODY_RADIUS * 2 + PLUG_HEAD_CLEARANCE;
  const bodyContact = PLUG_BODY_RADIUS + PLUG_CONTACT_RADIUS + PLUG_HEAD_CLEARANCE;
  const contactContact = PLUG_CONTACT_RADIUS * 2 + PLUG_HEAD_CLEARANCE;
  return segmentDistanceSq(a.body, b.body) >= bodyBody ** 2 &&
    segmentDistanceSq(a.body, b.contacts) >= bodyContact ** 2 &&
    segmentDistanceSq(a.contacts, b.body) >= bodyContact ** 2 &&
    segmentDistanceSq(a.contacts, b.contacts) >= contactContact ** 2;
}

export function validatePuzzleGeometry(definitions: readonly ArrowDefinition[]): GeometryIssue[] {
  const issues: GeometryIssue[] = [];
  const bodyClearanceSq = STATIC_BODY_CLEARANCE ** 2;
  const plugClearanceSq = STATIC_PLUG_CLEARANCE ** 2;
  const segmentCatalog = definitions.map((definition) => segmentsFor(definition));
  const edgeOwners = new Map<string, string>();

  definitions.forEach((definition, arrowIndex) => {
    for (let index = 0; index < definition.path.length - 1; index += 1) {
      const start = definition.path[index];
      const end = definition.path[index + 1];
      const changedAxes = [0, 1, 2].filter((axis) => start[axis] !== end[axis]);
      if (changedAxes.length !== 1) {
        issues.push({ kind: 'invalid-segment', arrowId: definition.id });
      }
    }

    for (const edge of expandUnitEdges(definition)) {
      const owner = edgeOwners.get(edge);
      if (owner) issues.push({ kind: 'shared-lane', arrowId: definition.id, otherArrowId: owner });
      else edgeOwners.set(edge, definition.id);
    }

    const ownSegments = segmentCatalog[arrowIndex];
    for (let left = 0; left < ownSegments.length; left += 1) {
      for (let right = left + 2; right < ownSegments.length; right += 1) {
        const distanceSq = segmentDistanceSq(ownSegments[left], ownSegments[right]);
        if (distanceSq < bodyClearanceSq) {
          issues.push({ kind: 'self-overlap', arrowId: definition.id, distance: Math.sqrt(distanceSq) });
        }
      }
    }

    const ownPlugs = plugEnvelopes(definition);
    ownPlugs.forEach((ownPlug, plugIndex) => {
      const end: CableEnd = plugIndex === 0 ? 'head' : 'tail';
      const nonAdjacentSegments = nonAdjacentSegmentsForPlug(ownSegments, end);
      for (const segment of nonAdjacentSegments) {
        if (envelopeAgainstBodyIsClear(ownPlug, segment)) continue;
        const distanceSq = Math.min(
          segmentDistanceSq(ownPlug.body, segment),
          segmentDistanceSq(ownPlug.contacts, segment),
        );
        issues.push({ kind: 'self-plug-overlap', arrowId: definition.id, distance: Math.sqrt(distanceSq) });
      }
    });
    if (definition.doubleEnded && !envelopesAreClear(ownPlugs[0], ownPlugs[1])) {
      issues.push({ kind: 'head-tail-overlap', arrowId: definition.id });
    }
    const tail = cableSocketPointsToWorld(definition)[0];
    const headTailDistanceSq = pointSegmentDistanceSq(tail, ownPlugs[0].body.start, ownPlugs[0].contacts.end);
    if (!definition.doubleEnded && headTailDistanceSq < plugClearanceSq) {
      issues.push({
        kind: 'head-tail-overlap',
        arrowId: definition.id,
        distance: Math.sqrt(headTailDistanceSq),
      });
    }
  });

  for (let left = 0; left < definitions.length; left += 1) {
    for (let right = left + 1; right < definitions.length; right += 1) {
      const leftDefinition = definitions[left];
      const rightDefinition = definitions[right];
      for (const a of segmentCatalog[left]) {
        for (const b of segmentCatalog[right]) {
          const distanceSq = segmentDistanceSq(a, b);
          if (distanceSq < bodyClearanceSq) {
            issues.push({
              kind: 'body-overlap',
              arrowId: leftDefinition.id,
              otherArrowId: rightDefinition.id,
              distance: Math.sqrt(distanceSq),
            });
          }
        }
      }

      const leftPlugs = plugEnvelopes(leftDefinition);
      const rightPlugs = plugEnvelopes(rightDefinition);
      for (const leftPlug of leftPlugs) {
        for (const segment of segmentCatalog[right]) {
          if (envelopeAgainstBodyIsClear(leftPlug, segment)) continue;
          const distanceSq = Math.min(
            segmentDistanceSq(leftPlug.body, segment),
            segmentDistanceSq(leftPlug.contacts, segment),
          );
          issues.push({ kind: 'plug-overlap', arrowId: leftDefinition.id, otherArrowId: rightDefinition.id, distance: Math.sqrt(distanceSq) });
        }
      }
      for (const rightPlug of rightPlugs) {
        for (const segment of segmentCatalog[left]) {
          if (envelopeAgainstBodyIsClear(rightPlug, segment)) continue;
          const distanceSq = Math.min(
            segmentDistanceSq(rightPlug.body, segment),
            segmentDistanceSq(rightPlug.contacts, segment),
          );
          issues.push({ kind: 'plug-overlap', arrowId: rightDefinition.id, otherArrowId: leftDefinition.id, distance: Math.sqrt(distanceSq) });
        }
      }

      for (const leftPlug of leftPlugs) {
        for (const rightPlug of rightPlugs) {
          if (envelopesAreClear(leftPlug, rightPlug)) continue;
          const plugDistanceSq = Math.min(
            segmentDistanceSq(leftPlug.body, rightPlug.body),
            segmentDistanceSq(leftPlug.body, rightPlug.contacts),
            segmentDistanceSq(leftPlug.contacts, rightPlug.body),
            segmentDistanceSq(leftPlug.contacts, rightPlug.contacts),
          );
          issues.push({ kind: 'plug-overlap', arrowId: leftDefinition.id, otherArrowId: rightDefinition.id, distance: Math.sqrt(plugDistanceSq) });
        }
      }
    }
  }

  return issues;
}

export function geometryIsClear(definitions: readonly ArrowDefinition[]): boolean {
  return validatePuzzleGeometry(definitions).length === 0;
}

export function candidateGeometryIsClear(
  candidate: ArrowDefinition,
  existing: readonly ArrowDefinition[],
): boolean {
  if (!plugEndpointDirectionIsValid(candidate)) return false;
  if (validatePuzzleGeometry([candidate]).length > 0) return false;

  const bodyClearanceSq = STATIC_BODY_CLEARANCE ** 2;
  const candidateSegments = segmentsFor(candidate);
  const candidateEdges = new Set(expandUnitEdges(candidate));
  const candidatePlugs = plugEnvelopes(candidate);

  for (const other of existing) {
    if (expandUnitEdges(other).some((edge) => candidateEdges.has(edge))) return false;

    const otherSegments = segmentsFor(other);
    // The visible plug is a capsule extending away from the head socket. A
    // socket-point-only test misses the common case where the first cable run
    // turns immediately and the plug body itself sweeps through a neighbour.
    // Apply the larger generation halo to the complete candidate plug body.
    if (candidatePlugs.some((plug) => otherSegments.some((segment) => (
      segmentDistanceSq(plug.body, segment) < PLUG_HEAD_GENERATION_CLEARANCE ** 2
    )))) return false;
    for (const candidateSegment of candidateSegments) {
      for (const otherSegment of otherSegments) {
        if (segmentDistanceSq(candidateSegment, otherSegment) < bodyClearanceSq) return false;
      }
    }

    const otherPlugs = plugEnvelopes(other);
    for (const candidatePlug of candidatePlugs) {
      for (const segment of otherSegments) {
        if (!envelopeAgainstBodyIsClear(candidatePlug, segment)) return false;
      }
    }
    for (const otherPlug of otherPlugs) {
      for (const segment of candidateSegments) {
        if (!envelopeAgainstBodyIsClear(otherPlug, segment)) return false;
      }
    }
    for (const candidatePlug of candidatePlugs) {
      for (const otherPlug of otherPlugs) {
        if (!envelopesAreClear(candidatePlug, otherPlug)) return false;
      }
    }
  }

  return true;
}
