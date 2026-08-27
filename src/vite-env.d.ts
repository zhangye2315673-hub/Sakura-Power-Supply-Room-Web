/// <reference types="vite/client" />

interface ThreeGameDiagnostics {
  frame: number;
  seed: number;
  puzzleRevision: number;
  layoutSignature: string;
  mode: 'campaign' | 'random' | 'skill' | 'rush';
  exploration: {
    active: boolean;
    environmentScale: number;
    lanternPreserved: boolean;
  };
  challengeKind: 'standard' | 'double-ended' | null;
  levelId: number | null;
  shape: 'cube' | 'cuboid' | 'octahedron' | 'pyramid' | 'cylinder' | 'sphere' | 'torus' | 'arch' | null;
  totalArrows: number;
  doubleEndedCables: number;
  remainingArrows: number;
  initiallyFree: number;
  lengthMix: {
    short: number;
    medium: number;
    long: number;
  };
  availableArrows: number;
  clickTarget: {
    id: string;
    end: 'head' | 'tail';
    color: number;
    x: number;
    y: number;
  } | null;
  availableClickTargets: Array<{
    id: string;
    end: 'head' | 'tail';
    color: number;
    x: number;
    y: number;
  }>;
  blockedClickTarget: {
    id: string;
    end: 'head' | 'tail';
    color: number;
    x: number;
    y: number;
  } | null;
  activeAnimations: number;
  queuedConnections: number;
  activeConnections: number;
  activeFlingMotions: Array<{
    id: string;
    progress: number;
    worldPosition: number[];
    worldDistanceFromLaunch: number;
    distanceFromBundleCenter: number;
    angularVelocity: number[];
    direction: number[];
    screenX: number;
    screenY: number;
    detachedFromCableRoot: boolean;
  }>;
  completedFlingMotions: Array<{
    id: string;
    maxScreenRadius: number;
    distanceMonotonic: boolean;
  }>;
  activeMotion: {
    id: string;
    end: 'head' | 'tail';
    kind: 'exit' | 'bump' | 'skill-fling';
    color: number;
    targetId: string | null;
    targetAccent: number | null;
    pathDistance: number;
    rootOffset: number;
  } | null;
  routing: {
    requiredColors: number[];
    coveredColors: number[];
    assignableColors: number[];
    allRequiredCovered: boolean;
    reservations: Array<{ cableId: string; color: number; targetId: string }>;
  };
  hoveredArrow: string | null;
  hoveredCableEnd: 'head' | 'tail' | null;
  activeBurstPetals: number;
  theme: {
    season: import('./theme/SeasonController').SeasonSnapshot;
    seasonParticles: {
      weights: Record<import('./theme/SeasonProfiles').SeasonMode, number>;
      springOpacity: number;
      summerOpacity: number;
      autumnOpacity: number;
      winterOpacity: number;
      fireflyOpacity: number;
      refrigeratorSnowVisible: boolean;
      refrigeratorColdProgress: number;
    };
    mode: import('./theme/ThemeController').ThemeMode;
    targetMode: import('./theme/ThemeController').ThemeMode;
    progress: number;
    transitioning: boolean;
    reducedMotion: boolean;
    source: 'query' | 'saved' | 'default' | 'manual';
    stars: number;
    explorationEyes: {
      pairs: number;
      progress: number;
    };
    lantern: import('./theme/NightEnvironment').LanternSnapshot;
    quality: {
      tier: import('./theme/ThemeController').NightQualityTier;
      lowDuration: number;
      highDuration: number;
    };
  };
  audio: {
    unlocked: boolean;
    muted: boolean;
    state: AudioContextState | 'unavailable';
    buses: Record<import('./audio/AudioManager').AudioBusName, number>;
    activeNodes: number;
    activeAppliances: import('./systems/ApplianceCatalog').ApplianceKind[];
  };
  sensory: Array<{
    kind: string;
    state: import('./systems/ApplianceCatalog').ApplianceState;
    matchedNodes: string[];
    missingFunctionalNode: boolean;
    lightIntensity: number;
    neonMaterialCount: number;
    neonIntensity: number;
    poweredReveal: number;
  }>;
  performances: {
    sessions: number;
    timelineOwners: number;
    kinds: string[];
    elapsedByKind: Record<string, number | undefined>;
    signalsByKind: Record<string, number | undefined>;
    activeTotal: number;
    activeByKind: Record<string, number>;
    capacityByKind: Record<string, number>;
    activeToastNdc: [number, number, number] | null;
    lampBeam: {
      timelineTime: number;
      headPhase: string;
      headPitch: number;
      headRoll: number;
      sourceRadius: number;
      farRadius: number;
      farToNearRatio: number;
      length: number;
      spotAngle: number;
      socket: [number, number, number];
      direction: [number, number, number];
      groundSpot: [number, number, number];
      geometryAxis: '-Y-near/+Y-far';
    } | null;
    radio: import('./appliances/performance/RadioPerformance').RadioPerformanceDiagnostics;
    hairDryer: import('./appliances/performance/HairDryerPerformance').HairDryerPerformanceDiagnostics | null;
  };
  opening: {
    active: boolean;
    ready: boolean;
    progress: number;
    transitioning: boolean;
    cameraPhase: 'idle' | 'insert' | 'hold' | 'fade-out' | 'background-hold' | 'reveal' | 'pull';
    screenX: number;
    screenY: number;
    trailLength: number;
    petalMotion: number;
    impactCount: number;
    seasonWeights: Record<import('./theme/SeasonProfiles').SeasonMode, number>;
    visibleSeasonLayers: import('./theme/SeasonProfiles').SeasonMode[];
    summerFirefliesVisible: boolean;
    jellyScale: [number, number, number];
  };
  locale: 'zh' | 'en';
  randomLives: number;
  randomGameOver: boolean;
  skill: {
    testId: import('./skill/SkillTestMode').SkillTestId | null;
    invulnerable: boolean;
    registrySize: number;
    phase: import('./skill/SkillChallengeEngine').SkillChallengePhase;
    inputLocked: boolean;
    lives: number;
    maxLives: number;
    buff: import('./skill/SkillChallengeEngine').SkillStatusId | null;
    buffTurnsRemaining: number | null;
    debuff: import('./skill/SkillChallengeEngine').SkillStatusId | null;
    debuffTurnsRemaining: number | null;
    remainingCableIds: string[];
    lampHintCableId: string | null;
    popcornHintCableId: string | null;
    cableEffects: Array<{
      id: string;
      baseColor: number;
      cableColor: number;
      tailColor: number;
      glowStrength: number;
      skillTintStrength: number;
      skillTintEmissionScale: number;
      recycleSelectionState: 'none' | 'hover' | 'selected';
      recycleHighlightStrength: number;
      recyclePulse: number;
      recycleScale: number;
      bundleSpacingOffset: number[];
      bundleSpacingOffsetLength: number;
      overheatAmount: number;
      overheatReveal: number;
      overheatTurns: number;
      inductionRevealActive: boolean;
      inductionHeatAmount: number;
      inductionRingCount: number;
      inductionRingProgresses: [number, number];
      inductionRingTangentAlignments: [number, number];
      inductionRingMotion: string;
      plugOverheatAmount: number;
      plugOverheatReveal: number;
      plugOverheatMaterialCount: number;
      plugOverheatPathScale: number;
      coffeeStainAmount: number;
      coffeeStainReveal: number;
      coffeeStainDirection: number;
      freezeAmount: number;
      freezeProgress: number;
      iceShellVisible: boolean;
      iceShellOpacity: number;
      plugIceShellCount: number;
      visualThicknessScale: number;
      geometryThicknessScale: number;
      plugJointThicknessScale: number;
      fakeTailPlugVisible: boolean;
      lampGuideEnd: 'head' | 'tail' | null;
    }>;
    effectAssets: string[];
    popcornTransientCount: number;
    microwaveMarkers: Array<{
      cableId: string;
      quaternion: [number, number, number, number];
      rings: Array<{ type: string; depthTest: boolean }>;
    }>;
    popcornMarkers: Array<{
      cableId: string;
      position: [number, number, number];
      kernelCount: number;
      ringSegmentCount: number;
      rayCount: number;
      ringTubeRadius: number;
      directionAlignment: number;
      orientationMode: string;
      kernelAngularGaps: number[];
    }>;
    bubbleShield: import('./skill/BubbleShieldPresentation').BubbleShieldDiagnostics;
    soundWaveShield: import('./skill/SoundWaveShieldPresentation').SoundWaveShieldDiagnostics;
    dehumidifierDryShield: import('./skill/DehumidifierDryShieldPresentation').DehumidifierDryShieldDiagnostics;
    portableSpeakerSpacing: import('./skill/PortableSpeakerSpacingPresentation').PortableSpeakerSpacingDiagnostics;
    dehumidifierCanopyPetals: {
      active: boolean;
      particleCount: number;
      radius: number;
      direction: readonly [number, number, number];
      path: 'open-canopy-outer-arc';
      seasonalProps: true;
    };
    steamReveal: {
      active: boolean;
      progress: number;
      origin: number;
      direction: 'left-to-right' | 'right-to-left';
    };
    steamClear: {
      active: boolean;
      progress: number;
      origin: number;
      direction: 'left-to-right' | 'right-to-left';
    };
    printerCopyReady: boolean;
    cardCount: number;
    presentation: import('./skill/SkillPresentationController').SkillPresentationDiagnostics;
    televisionReconstruction: import('./skill/TelevisionReconstructionTransition').TelevisionReconstructionDiagnostics;
    toasterHeatSwap: import('./skill/ToasterHeatSwapTransition').ToasterHeatSwapDiagnostics;
    refrigeratorFreeze: import('./skill/RefrigeratorFreezePresentation').RefrigeratorFreezeDiagnostics;
    kettleThaw: import('./skill/KettleThawPresentation').KettleThawDiagnostics;
    washerSpin: import('./skill/WasherSpinPresentation').WasherSpinDiagnostics;
    refrigeratorScreenIce: import('./skill/RefrigeratorScreenIceOverlay').RefrigeratorScreenIceDiagnostics;
    coldParticles: {
      progress: number;
      snowflakeCount: number;
    };
    screenEffect: {
      mode: import('./style/post').SkillScreenEffect;
      progress: number;
      splashActive: boolean;
      splashProgress: number;
    };
  } | null;
  rush: {
    challengeId: string;
    flow: 'sequence' | 'random-pool' | null;
    phase: import('./game/RushRound').RushRoundPhase;
    timeLimitSeconds: number;
    remainingSeconds: number;
    removals: number;
    mistakes: number;
  } | null;
  doubleEndedHints: {
    briefingVisible: boolean;
    visibleEnds: number;
    visibleClickTargets: number;
  };
  hint: {
    enabled: boolean;
    target: { id: string; end: 'head' | 'tail' } | null;
    remaining: number;
    maximum: number;
    visibleEnds: number;
    scale: number;
  };
  sceneVisibility: {
    arrows: boolean;
    appliances: boolean;
    connections: boolean;
    opening: boolean;
  };
  appliances: Array<{
    id: string;
    kind: string;
    accent: number;
    sizeTier: 'S' | 'M' | 'L' | 'XL';
    plugStyleId:
      | 'round-two-pin'
      | 'usb-c'
      | 'flat-two-blade'
      | 'three-pin'
      | 'grounded-round'
      | 'dc-barrel'
      | 'magnetic-pogo';
    state: 'idle' | 'connected' | 'active' | 'inflating' | 'hidden' | 'spawning';
    connections: number;
    activeTimeRemaining: number;
    animationSignal: number;
    screenX: number;
    screenY: number;
    screenWidth: number;
    screenHeight: number;
    rootScreenY: number;
    instanceId: string;
    dragging: boolean;
    dropping: boolean;
    dropOffset: number;
    landingSway: number;
    landingTilt: number;
    landingImpactCount: number;
    landingContactSide: -1 | 0 | 1;
    lifecycleScale: number;
    inflationPeakCount: number;
    deforming: boolean;
    deformPull: number;
    deformSignedPull: number;
    screenUpAlignment: number;
    orientationQuaternion: [number, number, number, number];
    facingSide: -1 | 1;
    outwardEdge: 'left' | 'right' | 'top' | 'bottom';
  }>;
  context: {
    losses: number;
    restores: number;
    lossAtMs: number | null;
  };
  timings: {
    generationMs: number;
    modelBuildMs: number;
    preloadMaxSliceMs: number;
  };
  renderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  canvas: {
    clientWidth: number;
    clientHeight: number;
    width: number;
    height: number;
  };
  orbit: {
    yaw: number;
    pitch: number;
    appliancePitch: number;
    radius: number;
  };
}

interface Window {
  __PLUG_SHOWCASE_DIAGNOSTICS__?: {
    styleCount: number;
    view: string;
    debugEnabled: boolean;
    explodeAmount: number;
    selectableParts: string[];
    selectedPart: string | null;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  __FINISH_OPENING_FOR_EVIDENCE__?: () => boolean;
  __SETTLE_APPLIANCE_FOR_EVIDENCE__?: () => boolean;
  __ACTIVATE_APPLIANCE_FOR_EVIDENCE__?: (kind: string) => boolean;
    __ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__?: (id: string) => boolean;
  __PULL_CABLE_FOR_EVIDENCE__?: (id?: string, end?: 'head' | 'tail') => boolean;
  __COFFEE_SPLASH_PROGRESS_OVERRIDE__?: number;
  __COFFEE_STAIN_PROGRESS_OVERRIDE__?: number;
    __SHOW_SKILL_EFFECT_FOR_EVIDENCE__?: (asset: string, yaw?: number) => boolean;
  __SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__?: (
    skill: 'radio' | 'robot-vacuum' | 'rice-cooker',
  ) => boolean;
  __FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__?: (timeMs: number) => boolean;
  __SKILL_REVIEW_READY__?: boolean;
  __CONTEXT_RECOVERY_EXTENSION__?: WEBGL_lose_context;
  /** Deterministic visual-regression clock for the shared appliance timeline. */
  __APPLIANCE_PERFORMANCE_TIME_OVERRIDE__?: number;
  /** Exact ballistic age used by fixed-time appliance visual evidence. */
  __APPLIANCE_PERFORMANCE_FLIGHT_TIME_OVERRIDE__?: number;
  /** Fixed fan steam-clear progress used only by visual evidence. */
  __STEAM_CLEAR_PROGRESS_OVERRIDE__?: number;
  /** Fixed humidifier steam-reveal progress used only by visual evidence. */
  __STEAM_REVEAL_PROGRESS_OVERRIDE__?: number;
  __THREE_GAME_DIAGNOSTICS__?: ThreeGameDiagnostics;
  __APPLIANCE_GALLERY_DIAGNOSTICS__?: {
    open: boolean;
    selected: string;
    catalogSize: number;
    active: boolean;
    cycle: number;
    power: number;
    animationSignal: number;
    neonMaterialCount: number;
    neonIntensity: number;
    lidRotationX: number | null;
    refrigeratorDoorRotationY: number | null;
    refrigeratorInteriorVisible: boolean | null;
    deforming: boolean;
    deformPull: number;
    deformSignedPull: number;
    deformReboundPullRatio: number;
    deformReboundResponse: number;
    deformEnabled: boolean;
    deformRenderableMeshes: number;
    deformBoundRenderableMeshes: number;
    deformGrabEdgeFactor: number;
    deformGrabCornerFactor: number;
    deformGrabCenterFactor: number;
    deformWholeCoupling: number;
    deformLocalGain: number;
    deformIndentStrength: number;
    orbitAzimuth: number;
    performanceSessions: number;
    performanceTimelineOwners: number;
    performanceElapsed: number;
    performanceActiveByKind: Record<string, number>;
    performanceCapacityByKind: Record<string, number>;
    activeToastNdc: [number, number, number] | null;
    lampBeam: ThreeGameDiagnostics['performances']['lampBeam'];
    radio: ThreeGameDiagnostics['performances']['radio'];
    hairDryer: ThreeGameDiagnostics['performances']['hairDryer'];
    refrigerator: ThreeGameDiagnostics['performances']['refrigerator'];
    spectacleSessions: number;
    spectacleActiveTotal: number;
    petalBurstCount: number;
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
}
