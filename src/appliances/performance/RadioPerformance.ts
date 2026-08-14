export type RadioMechanicalDiagnostics = {
  timeline: number;
  hingeAngle: number | null;
  extension: number;
  rise: number;
  overshoot: number;
  sway: number;
  segmentExtensions: number[];
  retractionPhase: 'none' | 'tip' | 'segment-3' | 'segment-2' | 'segment-1' | 'hinge-return';
  tipCapVisible: boolean;
  tipTracksHighestSection: boolean;
  tipTopError: number | null;
  nearVertical: boolean;
};

export type RadioWaveDiagnostics = {
  timeline: number;
  emitter: 'radio-speaker-socket';
  source: [number, number, number];
  forward: [number, number, number];
  geometry: 'closed-irregular-tube';
  frontOnly: true;
  activeCount: number;
  geometryVariants: number[];
  minVelocityDotForward: number | null;
};

export type RadioPerformanceDiagnostics = {
  mechanics: RadioMechanicalDiagnostics | null;
  wave: RadioWaveDiagnostics | null;
};
