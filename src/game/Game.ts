import * as THREE from 'three';
import { Loop } from '../core/Loop';
import {
  availableCableEnds,
  cableEndDirection,
  cableEndsFor,
  checkCableEndExit,
  findRemovalSequence,
  makeRuntime,
} from '../puzzle/collision';
import { createRandomSeed } from '../puzzle/generator';
import {
  RUSH_CHALLENGES,
  getNextRushChallenge,
  getRushChallenge,
  pickRushChallenge,
  type RushChallenge,
} from '../puzzle/rushChallenges';
import { selectRandomChallengeMode } from '../puzzle/randomChallengeModes';
import {
  DIRECTION_VECTORS,
  type ArrowDefinition,
  type DirectionKey,
  type LevelDefinition,
  type ArrowRuntime,
  type CableEnd,
  type PuzzleDefinition,
} from '../puzzle/types';
import {
  CAMPAIGN_LEVELS,
  applianceSeedForPuzzle,
  getCampaignLevel,
  getDoubleEndedLevel,
  getRandomLevel,
  getSkillChallengeLevel,
  getStandardRandomLevel,
  seedForCampaignLevel,
} from '../puzzle/levels';
import { PlugCableModel } from '../render/PlugCableModel';
import { setOutlineResolution } from '../style/outline';
import { PAL } from '../style/palette';
import { SakuraPipeline, type SkillScreenEffect } from '../style/post';
import { buildSky, type SkyRig } from '../style/sky';
import { Hud } from '../systems/Hud';
import { ApplianceScene, type ApplianceTarget } from '../systems/ApplianceScene';
import { ApplianceGallery } from '../systems/ApplianceGallery';
import { ConnectionSystem } from '../systems/ConnectionSystem';
import { OrbitController } from '../systems/OrbitController';
import { PetalField } from '../systems/PetalField';
import { OpeningScene } from '../systems/OpeningScene';
import { AppliancePerformanceSystem } from '../systems/AppliancePerformanceSystem';
import { StartScreen } from '../systems/StartScreen';
import { RushModeUi } from '../systems/RushModeUi';
import { DoubleEndedModeUi } from '../systems/DoubleEndedModeUi';
import { selectTutorialAppliances } from '../systems/ApplianceCatalog';
import { getLocale, t, toggleLocale } from '../systems/Locale';
import { RushRound } from './RushRound';
import {
  APPLIANCE_SKILL_REGISTRY,
  SkillChallengeEngine,
  pickPrinterCopyCableId,
  type SkillCommand,
  type SkillContext,
  type SkillDamageEvent,
  type SkillResolution,
} from '../skill/SkillChallengeEngine';
import { SkillChallengeUi } from '../skill/SkillChallengeUi';
import {
  SkillPresentationController,
  type SkillPresentationTarget,
} from '../skill/SkillPresentationController';
import {
  buildTelevisionSpatialReplacements,
  reverseCableKeepingExternalEndpoints,
  frozenStatusBlocksEveryAvailableCable,
  skillTopologyDefinitionsAreCommitSafe,
} from '../skill/skillTopology';
import {
  SKILL_EFFECT_ASSET_REFERENCES,
  SkillEffectModelKit,
  type SkillEffectAssetId,
} from '../skill/SkillEffectModelKit';
import { SoundWaveShieldPresentation } from '../skill/SoundWaveShieldPresentation';
import { DehumidifierDryShieldPresentation } from '../skill/DehumidifierDryShieldPresentation';
import {
  PortableSpeakerSpacingPresentation,
  type PortableSpeakerSpacingTarget,
} from '../skill/PortableSpeakerSpacingPresentation';
import { ThemeController, type ThemeMode } from '../theme/ThemeController';
import { GlobalToolbar } from '../theme/GlobalToolbar';
import { NightEnvironment } from '../theme/NightEnvironment';
import { AdaptiveNightQuality } from '../theme/AdaptiveQuality';
import { SeasonController } from '../theme/SeasonController';
import { ApplianceSensoryController } from '../appliances/ApplianceSensoryController';
import { POWERED_ACTIVE_DURATION } from '../appliances/poweredAnimation';
import { AudioManager } from '../audio/AudioManager';
import { TelevisionReconstructionTransition } from '../skill/TelevisionReconstructionTransition';
import { ToasterHeatSwapTransition } from '../skill/ToasterHeatSwapTransition';
import { RefrigeratorFreezePresentation } from '../skill/RefrigeratorFreezePresentation';
import { KETTLE_THAW_DURATION, KettleThawPresentation } from '../skill/KettleThawPresentation';
import { RefrigeratorScreenIceOverlay } from '../skill/RefrigeratorScreenIceOverlay';
import { WasherSpinPresentation } from '../skill/WasherSpinPresentation';
import { BubbleShieldPresentation } from '../skill/BubbleShieldPresentation';

type GameMode = 'campaign' | 'random' | 'skill' | 'rush';
type RushFlow = 'sequence' | 'random-pool';

const DIAGNOSTICS_PUBLISH_INTERVAL_FRAMES = 6;

type ArrowAnimation = {
  arrow: ArrowRuntime;
  model: PlugCableModel;
  kind: 'exit' | 'bump' | 'skill-fling';
  target: ApplianceTarget | null;
  queueAfterExit: boolean;
  elapsed: number;
  wallClockStartedAtSeconds: number | null;
  duration: number;
  direction: THREE.Vector3;
  end: CableEnd;
  autoCommitted?: boolean;
  originPosition?: THREE.Vector3;
  originQuaternion?: THREE.Quaternion;
  originScale?: THREE.Vector3;
  bundleCenterWorld?: THREE.Vector3;
  flightAngularVelocity?: THREE.Vector3;
  maxScreenRadius?: number;
  previousFlightDistance?: number;
  distanceMonotonic?: boolean;
};

type CableChoice = Readonly<{ arrow: ArrowRuntime; end: CableEnd }>;
type CableScreenTarget = Readonly<{
  id: string;
  end: CableEnd;
  color: number;
  x: number;
  y: number;
}>;

type PendingApplianceConnection = {
  arrow: ArrowRuntime;
  color: number;
  start: THREE.Vector3;
  direction: THREE.Vector3;
};

type PuzzleWorkerResponse = {
  requestId: number;
  puzzle?: PuzzleDefinition;
  error?: string;
  generationMs?: number;
};

const easeOutCubic = (value: number): number => 1 - (1 - value) ** 3;
const MAX_HINT_USES = 3;
const SKILL_RECYCLE_SELECTION_COMMIT_DELAY_MS = 850;
const SKILL_BUFF_SWAP_VISUAL_DURATION_MS = 720;

type RenderCostProfileEntry = {
  name: string;
  type: string;
  visible: boolean;
  objects: number;
  renderables: number;
  visibleRenderables: number;
  meshes: number;
  lines: number;
  points: number;
  lights: number;
  materials: number;
  geometries: number;
  triangles: number;
  potentialTriangles: number;
  calls: number;
};

type RenderCostProfile = {
  capturedAt: string;
  liveRenderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  sceneRenderer: {
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
  };
  estimatedPostProcessCalls: number;
  entries: RenderCostProfileEntry[];
};

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(26, 1, 0.1, 140);
  private readonly applianceGeometryWarmupScene = new THREE.Scene();
  private readonly applianceGeometryWarmupCamera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  private readonly applianceGeometryWarmupTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    stencilBuffer: false,
  });
  private readonly applianceGeometryWarmupMaterial = new THREE.MeshBasicMaterial();
  private pipeline: SakuraPipeline;
  private readonly sky: SkyRig;
  private readonly hud = new Hud();
  private applianceGallery: ApplianceGallery | null = null;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly arrowRoot = new THREE.Group();
  private readonly appliances = new ApplianceScene();
  private readonly connections = new ConnectionSystem();
  // Keep ambient sakura sparse enough to read as individual flat petals on
  // mobile and desktop; the opening wreath has its own 22-petal belt.
  private readonly petals = new PetalField(28);
  private readonly openingScene = new OpeningScene();
  private readonly performances = new AppliancePerformanceSystem();
  private readonly sensory = new ApplianceSensoryController();
  private readonly theme = new ThemeController();
  private readonly season = new SeasonController();
  private readonly audio = new AudioManager();
  private readonly sun = new THREE.DirectionalLight(PAL.sun, 2.25);
  private readonly fill = new THREE.DirectionalLight(PAL.fill, 1.08);
  private readonly bounce = new THREE.DirectionalLight(0xd8cbe8, 0.34);
  private readonly hemi = new THREE.HemisphereLight(PAL.hemiSky, PAL.hemiGround, 1.12);
  private readonly globalToolbar: GlobalToolbar;
  private readonly nightEnvironment: NightEnvironment;
  private readonly adaptiveQuality: AdaptiveNightQuality;
  private readonly landedTargets = new WeakSet<ApplianceTarget>();
  private readonly startScreen = new StartScreen({
    onStart: () => this.beginOpeningTransition(),
    onRandom: () => this.startRandomFromOpening(),
    onExplore: () => this.startExploreFromOpening(),
    onRush: () => this.startRushFromOpening(),
    onDoubleEnded: () => this.startDoubleEndedFromOpening(),
    onSkill: () => this.startSkillFromOpening(),
    onProgress: (progress) => this.openingScene.setProgress(progress),
  });
  private readonly rushUi = new RushModeUi({
    onStart: () => this.startRushRound(),
    onNext: () => this.advanceRushOrLoadRandomChallenge(),
    onRetry: () => this.retryRushPuzzle(),
    onHome: () => this.returnToOpening(),
  });
  private readonly doubleEndedUi = new DoubleEndedModeUi({
    onStart: () => this.startDoubleEndedChallenge(),
    onHome: () => this.returnToOpening(),
  });
  private readonly skillUi = new SkillChallengeUi({
    onCardSelected: (index) => this.handleSkillCardSelected(index),
  });
  private readonly skillEffects = new SkillEffectModelKit();
  private readonly bubbleShield = new BubbleShieldPresentation();
  private readonly soundWaveShield = new SoundWaveShieldPresentation();
  private readonly dehumidifierDryShield = new DehumidifierDryShieldPresentation();
  private readonly portableSpeakerSpacing = new PortableSpeakerSpacingPresentation();
  private readonly televisionReconstruction = new TelevisionReconstructionTransition();
  private readonly toasterHeatSwap = new ToasterHeatSwapTransition();
  private readonly refrigeratorFreeze = new RefrigeratorFreezePresentation();
  private readonly kettleThaw = new KettleThawPresentation();
  private readonly refrigeratorScreenIce: RefrigeratorScreenIceOverlay;
  private readonly washerSpin = new WasherSpinPresentation();
  private readonly skillPresentation: SkillPresentationController;
  private readonly puzzleWorker: Worker;
  private readonly prefetchWorker: Worker;
  private readonly orbit: OrbitController;
  private readonly loop = new Loop(
    (delta, elapsed) => this.update(delta, elapsed),
    () => this.render(),
  );

  private puzzle: PuzzleDefinition | null = null;
  private arrows: ArrowRuntime[] = [];
  private readonly models = new Map<string, PlugCableModel>();
  private readonly animations: ArrowAnimation[] = [];
  private readonly pendingApplianceConnections: PendingApplianceConnection[] = [];
  private hoveredId: string | null = null;
  private hoveredEnd: CableEnd | null = null;
  private frame = 0;
  private removedCount = 0;
  private availableCount = 0;
  private applianceRoutingRevision = -1;
  private clickTarget: CableScreenTarget | null = null;
  private availableClickTargets: CableScreenTarget[] = [];
  private availableChoices: CableChoice[] = [];
  private blockedClickTarget: CableScreenTarget | null = null;
  private activeHint: Readonly<{ id: string; end: CableEnd }> | null = null;
  private hintUsesRemaining = MAX_HINT_USES;
  private puzzleRequestId = 0;
  private prefetchRequestId = 0;
  private prefetchedLevel: {
    levelId: number;
    puzzle: PuzzleDefinition;
    generationMs: number;
  } | null = null;
  private prefetchingLevelId: number | null = null;
  private waitingForPrefetchLevelId: number | null = null;
  private puzzleRevision = 0;
  private currentLevel: LevelDefinition | null = null;
  private currentMode: GameMode = 'random';
  private explorationMode = false;
  private explorationReturnTheme: ThemeMode | null = null;
  private currentRushChallenge: RushChallenge | null = null;
  private rushSelectionHint: RushChallenge | null = null;
  private rushRound: RushRound | null = null;
  private rushFlow: RushFlow | null = null;
  private randomLives = 3;
  private randomGameOver = false;
  private skillEngine: SkillChallengeEngine | null = null;
  private skillInputLocked = false;
  private skillCommitTimer = 0;
  private skillSettleCueTimer = 0;
  private skillSettleTimer = 0;
  private skillEvidenceCleanupTimer = 0;
  private skillRecycleSelectionTimer = 0;
  private skillBuffSwapTimer = 0;
  private skillBuffVisualReleaseAt = 0;
  private lastSkillBuffId: string | null = null;
  private skillEvidenceVisible = false;
  private coffeeLockExitTarget: ApplianceTarget | null = null;
  private coffeeStainElapsed = 0;
  private coffeeStainStrength = 0;
  private readonly coffeeStainDuration = 4.8;
  private readonly coffeeStainProfiles = new Map<string, { delay: number; direction: number }>();
  private readonly skillTransientHighlights = new Set<string>();
  private readonly skillColorShufflePreview = new Map<string, {
    color: number;
    strength: number;
    emissionScale: number;
  }>();
  private portableSpeakerSpacingTargetsCache: PortableSpeakerSpacingTarget[] = [];
  private skillTransientScreenEffect: SkillScreenEffect = 'none';
  private desktopComputerFeedback: {
    startedAt: number;
    hadBuff: boolean;
    livesAfter: number;
    committed: boolean;
  } | null = null;
  private pendingDryShieldAbsorb = false;
  private readonly skillAutoRemovalEnds = new Map<string, CableEnd>();
  private pendingWasherFlingRemovals: ArrowRuntime[] = [];
  private washerFlingHistory: Array<{
    id: string;
    maxScreenRadius: number;
    distanceMonotonic: boolean;
  }> = [];
  private readonly washerFlightEuler = new THREE.Euler();
  private readonly washerFlightQuaternion = new THREE.Quaternion();
  private readonly washerFlightWorldPosition = new THREE.Vector3();
  private readonly washerFlightProjectedPosition = new THREE.Vector3();
  private radioRouteCableIds: string[] = [];
  private openingActive = true;
  private openingTransitioning = false;
  private initialPuzzlePreparing = false;
  private openingCameraPhase: 'idle' | 'insert' | 'hold' | 'fade-out' | 'background-hold' | 'reveal' | 'pull' = 'idle';
  private openingCameraElapsed = 0;
  private lastOpeningFrameElapsed = 0;
  private readonly openingCameraFinal = new THREE.Vector3();
  private readonly openingCameraClose = new THREE.Vector3();
  private readonly openingCameraFinalTarget = new THREE.Vector3(0, 0.05, 0);
  private readonly lanternScreenPosition = new THREE.Vector2();
  private readonly openingLanternFocus = new THREE.Vector3();
  private readonly openingHoldDuration = 0.65;
  private readonly openingFadeOutDuration = 1;
  private readonly openingBackgroundHoldDuration = 0.5;
  private readonly openingRevealDuration = 1.25;
  private readonly openingCameraPullDuration = 2.6;
  private readonly sceneTransitionCurtain: HTMLElement;
  private startupTimer = 0;
  private readonly bootTime = performance.now();
  private generationMs = 0;
  private modelBuildMs = 0;
  private preloadMaxSliceMs = 0;
  private performanceEffectsWarmed = false;
  private contextLossAtMs: number | null = null;
  private contextLosses = 0;
  private contextRestores = 0;
  private contextUnavailable = false;
  private readonly onResize = () => this.resize();
  private readonly onUiButtonClick = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('button')) {
      this.audio.playInteraction('button');
    }
  };
  private readonly onOpenApplianceGallery = () => {
    if (!this.applianceGallery) this.applianceGallery = new ApplianceGallery(this.theme, this.audio);
    this.applianceGallery.show();
  };
  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.contextUnavailable = true;
    this.contextLosses += 1;
    this.contextLossAtMs = performance.now() - this.bootTime;
    this.hud.flash(getLocale() === 'zh' ? '渲染器正在恢复' : 'Restoring the renderer');
  };
  private readonly onContextRestored = () => {
    this.contextRestores += 1;
    requestAnimationFrame(() => {
      // Resources from the lost GL context cannot be safely deleted through
      // the restored context. Replace the pipeline and let the orphaned JS
      // wrappers be collected instead of issuing cross-context delete calls.
      this.renderer.resetState();
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.renderer.toneMapping = THREE.NoToneMapping;
      this.renderer.info.autoReset = false;
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFShadowMap;
      this.renderer.setClearColor(PAL.fog, 1);
      this.pipeline = new SakuraPipeline(this.renderer, this.scene, this.camera);
      this.pipeline.setThemeProgress(this.theme.progress);
      this.pipeline.setExplorationProgress(this.explorationMode ? 1 : 0);
      this.pipeline.setQualityTier(this.adaptiveQuality.tier);
      this.syncSkillPresentation();
      this.resize();
      this.contextUnavailable = false;
    });
  };
  private readonly onPuzzleGenerated = (event: MessageEvent<PuzzleWorkerResponse>) => {
    const result = event.data;
    if (result.requestId !== this.puzzleRequestId) return;
    if (!result.puzzle) {
      this.hud.showLoadError(result.error ?? '线路生成失败');
      return;
    }
    this.generationMs = result.generationMs ?? 0;
    if (this.openingActive && this.puzzle === null && !this.initialPuzzlePreparing) {
      this.initialPuzzlePreparing = true;
      void this.applyPuzzle(result.puzzle, true).catch((error) => {
        this.initialPuzzlePreparing = false;
        this.startScreen.showError(error instanceof Error ? error.message : String(error));
        this.hud.showLoadError(error instanceof Error ? error.message : String(error));
      });
      return;
    }
    this.hud.completePuzzleLoad(() => this.applyPuzzle(result.puzzle!));
  };
  private readonly onPuzzlePrefetched = (event: MessageEvent<PuzzleWorkerResponse>) => {
    const result = event.data;
    if (result.requestId !== this.prefetchRequestId || this.prefetchingLevelId === null) return;
    const levelId = this.prefetchingLevelId;
    this.prefetchingLevelId = null;
    if (!result.puzzle) {
      if (this.waitingForPrefetchLevelId === levelId) {
        this.waitingForPrefetchLevelId = null;
        const level = getCampaignLevel(levelId);
        this.loadPuzzle(seedForCampaignLevel(level.id), level, 'campaign');
      }
      return;
    }
    this.prefetchedLevel = {
      levelId,
      puzzle: result.puzzle,
      generationMs: result.generationMs ?? 0,
    };
    if (this.waitingForPrefetchLevelId !== levelId) return;
    this.waitingForPrefetchLevelId = null;
    this.generationMs = this.prefetchedLevel.generationMs;
    const puzzle = this.prefetchedLevel.puzzle;
    this.hud.completePuzzleLoad(() => this.applyPuzzle(puzzle));
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    const transitionCurtain = document.querySelector<HTMLElement>('#scene-transition-curtain');
    if (!transitionCurtain) throw new Error('Missing scene transition curtain');
    this.sceneTransitionCurtain = transitionCurtain;
    this.refrigeratorScreenIce = new RefrigeratorScreenIceOverlay(canvas);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.info.autoReset = false;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.setClearColor(PAL.fog, 1);

    this.scene.fog = new THREE.Fog(PAL.fog, 30, 82);
    this.scene.add(this.arrowRoot);
    this.scene.add(this.appliances.root);
    this.scene.add(this.connections.root);
    this.scene.add(this.petals.mesh);
    this.scene.add(this.openingScene.root);
    this.scene.add(this.performances.root);
    this.scene.add(this.sensory.root);
    this.scene.add(this.skillEffects.root);
    this.scene.add(this.bubbleShield.root);
    this.scene.add(this.soundWaveShield.root);
    this.scene.add(this.dehumidifierDryShield.root);
    this.arrowRoot.add(this.televisionReconstruction.root);
    this.arrowRoot.add(this.toasterHeatSwap.root);
    this.arrowRoot.visible = false;
    this.appliances.root.visible = false;
    this.connections.root.visible = false;
    window.__PROFILE_RENDER_BREAKDOWN__ = () => this.profileRenderBreakdown();
    this.appliances.setBurstHandler((origin, direction, count) => {
      this.petals.burst(origin, direction, count);
    });
    this.sky = buildSky(this.scene);
    this.createLighting();
    this.applianceGeometryWarmupCamera.position.set(0, 0, 13.6);
    this.applianceGeometryWarmupCamera.lookAt(0, 0, 0);
    this.applianceGeometryWarmupCamera.updateMatrixWorld(true);
    this.applianceGeometryWarmupScene.overrideMaterial = this.applianceGeometryWarmupMaterial;
    this.appliances.setReplacementWarmupHandler(async (root) => {
      this.performances.primeRoot(root);
      await this.renderer.compileAsync(root, this.camera, this.scene);
      this.uploadApplianceGeometry(root);
    });

    this.pipeline = new SakuraPipeline(this.renderer, this.scene, this.camera);
    this.skillPresentation = new SkillPresentationController(this.scene, this.camera, {
      commitAutoRemoval: (cableId) => {
        const started = this.animateSkillAutoRemoval(cableId);
        queueMicrotask(() => this.publishDiagnostics());
        return started;
      },
      setCableVisualScale: (scale) => {
        for (const model of this.models.values()) model.setVisualThickness(scale);
      },
      getRiceCableVisualScale: () => (
        [...this.models.values()][0]?.visualThicknessScale ?? 1
      ),
      getCableBaseColor: (cableId) => this.models.get(cableId)?.skillVisualState.baseColor ?? null,
      setCableSkillSweep: (cableId, progress, strength, color) => {
        this.models.get(cableId)?.setSkillSweep(progress, strength, color);
      },
      setCableSkillTint: (cableId, color, strength, emissionScale) => {
        if (color === null) this.skillColorShufflePreview.delete(cableId);
        else this.skillColorShufflePreview.set(cableId, { color, strength, emissionScale });
        this.models.get(cableId)?.setSkillTint(color, strength, emissionScale);
      },
      setCableSkillRecolor: (cableId, color, progress) => {
        this.models.get(cableId)?.setSkillRecolor(color, progress);
      },
      commitCableColors: (changes) => {
        this.applySkillRecolors(changes);
        this.publishDiagnostics();
      },
    });
    this.nightEnvironment = new NightEnvironment(
      this.canvas,
      this.scene,
      this.camera,
      this.sky,
      { sun: this.sun, fill: this.fill, bounce: this.bounce, hemi: this.hemi },
    );
    this.adaptiveQuality = new AdaptiveNightQuality((tier) => {
      this.pipeline.setQualityTier(tier);
      this.nightEnvironment.setQualityTier(tier);
    }, {
      // The live game spends a noticeable amount of time in night mode during
      // scene transitions. Leave the default two-second rule for the shared
      // quality class/tests, but react faster here so expensive bloom and sky
      // work step down before a transition can visibly freeze.
      degradeAfterSeconds: 1.25,
      restoreAfterSeconds: 8,
    });
    this.globalToolbar = new GlobalToolbar(this.theme, this.season, this.audio, this.hud.languageButton);
    const initialTheme = this.theme.snapshot;
    const initialEnvironment = this.season.resolveEnvironment(initialTheme.progress);
    const initialSeason = this.season.snapshot;
    this.pipeline.setThemeProgress(initialTheme.progress);
    this.nightEnvironment.setThemeProgress(initialTheme.progress);
    this.nightEnvironment.setSeasonEnvironment(initialEnvironment);
    this.sky.setSeasonWeights(initialSeason.weights);
    this.petals.setSeasonState(initialSeason.weights, initialTheme.progress);
    this.openingScene.setSeasonState(initialSeason.weights, initialTheme.progress);
    this.nightEnvironment.setReducedMotion(initialTheme.reducedMotion);
    this.startScreen.setStage('start.loading.sky', 0.12, 0.22);
    this.puzzleWorker = new Worker(new URL('../puzzle/generator.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.prefetchWorker = new Worker(new URL('../puzzle/generator.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.puzzleWorker.addEventListener('message', this.onPuzzleGenerated);
    this.prefetchWorker.addEventListener('message', this.onPuzzlePrefetched);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
    this.appliances.bind(canvas, this.camera);
    this.orbit = new OrbitController(canvas, this.camera, {
      onClick: (x, y) => this.handleClick(x, y),
      onHover: (x, y) => this.handleHover(x, y),
      onLeave: () => this.setHovered(null),
      onViewChanged: () => {
        this.refreshAvailability(false);
        this.publishDiagnostics();
      },
    });

    this.hud.resetButton.addEventListener('click', this.resetCurrentPuzzle);
    this.hud.newButton.addEventListener('click', this.loadNewPuzzle);
    this.hud.continueButton.addEventListener('click', this.loadNextPuzzle);
    this.hud.applianceGalleryButton.addEventListener('click', this.onOpenApplianceGallery);
    this.hud.homeButton.addEventListener('click', this.returnToOpening);
    this.hud.languageButton.addEventListener('click', this.toggleLanguage);
    this.hud.retryRandomButton.addEventListener('click', this.retryRandomPuzzle);
    this.hud.gameOverNewButton.addEventListener('click', this.loadNewPuzzle);
    this.hud.hintButton.addEventListener('click', this.revealHint);
    document.querySelector('#app')?.addEventListener('click', this.onUiButtonClick);
    window.addEventListener('resize', this.onResize);
    this.resize();

    // Fixed-time visual evidence selects one known appliance without relying
    // on a software-rendered screen ray being visible behind another model.
    // The hook still enters the normal handleClick/connection/timeline path.
    if (Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) {
      window.__FINISH_OPENING_FOR_EVIDENCE__ = () => this.finishOpeningForEvidence();
      window.__SETTLE_APPLIANCE_FOR_EVIDENCE__ = () => this.settleApplianceForEvidence();
      window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__ = (kind) => this.activateApplianceForEvidence(kind);
      window.__ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__ = (id) => this.activateRushCableForEvidence(id);
      window.__PULL_CABLE_FOR_EVIDENCE__ = (id, end = 'head') => this.pullCableForEvidence(id, end);
      window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ = (asset, yaw = 0) => {
        if (!(asset in SKILL_EFFECT_ASSET_REFERENCES)) return false;
        this.arrowRoot.visible = false;
        this.appliances.root.visible = false;
        this.connections.root.visible = false;
        this.performances.root.visible = false;
        this.skillEffects.root.visible = true;
        const model = this.skillEffects.showAssetForEvidence(asset as SkillEffectAssetId, yaw);
        return Boolean(model.userData.assetId && model.getObjectByName('attachment-socket'));
      };
      window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__ = (skill) => (
        this.showSkillPresentationForEvidence(skill)
      );
      window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__ = (timeMs) => (
        this.freezeSkillPresentationForEvidence(timeMs)
      );
    }

    const params = new URLSearchParams(window.location.search);
    this.rushSelectionHint = getRushChallenge(params.get('rush'));
    const parsedSeed = Number(params.get('seed'));
    const parsedLevel = Number(params.get('level'));
    const hasCampaignLevel = Number.isInteger(parsedLevel) && parsedLevel >= 1 && parsedLevel <= CAMPAIGN_LEVELS.length;
    const hasExplicitSeed = Number.isFinite(parsedSeed) && parsedSeed > 0;
    const randomRequested = params.get('mode') === 'random' && params.get('direct') === '1';
    const exploreRequested = params.get('mode') === 'explore' && params.get('direct') === '1';
    const doubleRequested = params.get('mode') === 'double' && params.get('direct') === '1';
    const skillRequested = params.get('mode') === 'skill' && params.get('direct') === '1';
    const rushRequested = params.get('mode') === 'rush' && params.get('direct') === '1';
    this.setExplorationMode(exploreRequested);
    if (rushRequested) {
      this.currentRushChallenge = this.rushSelectionHint ?? RUSH_CHALLENGES[0];
      this.rushSelectionHint = null;
      this.rushRound = new RushRound(this.currentRushChallenge.timeLimitSeconds);
      this.rushFlow = 'sequence';
    }
    const staleRandomUrl = params.get('mode') === 'random' && !randomRequested;
    const directChallengeRequested = randomRequested || exploreRequested || doubleRequested || skillRequested;
    const initialSeed = rushRequested && this.currentRushChallenge
      ? this.currentRushChallenge.level.seed
      : directChallengeRequested
      ? (hasExplicitSeed ? parsedSeed >>> 0 : createRandomSeed())
      : hasExplicitSeed && !staleRandomUrl
        ? parsedSeed >>> 0
        : seedForCampaignLevel(hasCampaignLevel ? parsedLevel : 1);
    const initialLevel = rushRequested && this.currentRushChallenge
      ? this.currentRushChallenge.level
      : doubleRequested
        ? getDoubleEndedLevel(initialSeed)
        : skillRequested
          ? getSkillChallengeLevel(initialSeed)
          : exploreRequested
            ? getStandardRandomLevel(initialSeed)
          : randomRequested
            ? getRandomLevel(initialSeed)
      : getCampaignLevel(hasCampaignLevel ? parsedLevel : 1);
    const initialMode: GameMode = rushRequested
      ? 'rush'
      : skillRequested
        ? 'skill'
        : randomRequested || exploreRequested || doubleRequested
          ? 'random'
          : 'campaign';
    if (skillRequested) {
      this.skillEngine = this.createSkillEngine(initialSeed);
      this.skillUi.setVisible(true);
      this.skillUi.render(this.skillEngine.state);
    }
    // Let the renderer compile the sky and post-processing passes before the
    // procedural search starts in its worker. Chromium's software WebGL path
    // can otherwise reset the context when both workloads spike together.
    this.startupTimer = window.setTimeout(() => {
      void this.prepareOpeningAndLoadPuzzle(initialSeed, initialLevel, initialMode);
    }, 80);
    this.hud.beginPuzzleLoad(
      rushRequested ? 'loading.rush' : skillRequested ? 'loading.skill' : 'loading.first',
    );
    this.publishDiagnostics();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    window.clearTimeout(this.startupTimer);
    this.puzzleWorker.removeEventListener('message', this.onPuzzleGenerated);
    this.puzzleWorker.terminate();
    this.prefetchWorker.removeEventListener('message', this.onPuzzlePrefetched);
    this.prefetchWorker.terminate();
    this.orbit.dispose();
    this.pipeline.dispose();
    this.globalToolbar.dispose();
    this.nightEnvironment.dispose();
    this.sky.dispose();
    this.theme.dispose();
    this.season.dispose();
    this.audio.dispose();
    this.sensory.dispose();
    this.petals.dispose();
    this.performances.dispose();
    this.clearPuzzle();
    this.connections.dispose();
    this.appliances.dispose();
    this.applianceGallery?.dispose();
    this.openingScene.dispose();
    this.skillPresentation.dispose();
    this.televisionReconstruction.dispose();
    this.toasterHeatSwap.dispose();
    this.washerSpin.dispose();
    this.refrigeratorScreenIce.dispose();
    this.skillEffects.dispose();
    this.bubbleShield.dispose();
    this.soundWaveShield.dispose();
    this.dehumidifierDryShield.dispose();
    this.startScreen.dispose();
    this.rushUi.dispose();
    this.doubleEndedUi.dispose();
    this.skillUi.dispose();
    this.hud.dispose();
    this.applianceGeometryWarmupTarget.dispose();
    this.applianceGeometryWarmupMaterial.dispose();
    this.renderer.dispose();
    if (window.__PROFILE_RENDER_BREAKDOWN__) window.__PROFILE_RENDER_BREAKDOWN__ = undefined;
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    window.removeEventListener('resize', this.onResize);
    this.hud.resetButton.removeEventListener('click', this.resetCurrentPuzzle);
    this.hud.newButton.removeEventListener('click', this.loadNewPuzzle);
    this.hud.continueButton.removeEventListener('click', this.loadNextPuzzle);
    this.hud.applianceGalleryButton.removeEventListener('click', this.onOpenApplianceGallery);
    this.hud.homeButton.removeEventListener('click', this.returnToOpening);
    this.hud.languageButton.removeEventListener('click', this.toggleLanguage);
    this.hud.retryRandomButton.removeEventListener('click', this.retryRandomPuzzle);
    this.hud.gameOverNewButton.removeEventListener('click', this.loadNewPuzzle);
    this.hud.hintButton.removeEventListener('click', this.revealHint);
    document.querySelector('#app')?.removeEventListener('click', this.onUiButtonClick);
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
    window.__ACTIVATE_APPLIANCE_FOR_EVIDENCE__ = undefined;
    window.__ACTIVATE_RUSH_CABLE_FOR_EVIDENCE__ = undefined;
    window.__SHOW_SKILL_EFFECT_FOR_EVIDENCE__ = undefined;
    window.__SHOW_SKILL_PRESENTATION_FOR_EVIDENCE__ = undefined;
    window.__FREEZE_SKILL_PRESENTATION_FOR_EVIDENCE__ = undefined;
    window.clearTimeout(this.skillSettleTimer);
    window.clearTimeout(this.skillCommitTimer);
    window.clearTimeout(this.skillSettleCueTimer);
    window.clearTimeout(this.skillEvidenceCleanupTimer);
    window.clearTimeout(this.skillBuffSwapTimer);
    this.skillBuffSwapTimer = 0;
    this.skillBuffVisualReleaseAt = 0;
    this.lastSkillBuffId = null;
    window.clearTimeout(this.skillRecycleSelectionTimer);
  }

  private uploadApplianceGeometry(root: THREE.Object3D): void {
    const originalParent = root.parent;
    const originalIndex = originalParent?.children.indexOf(root) ?? -1;
    const rootVisible = root.visible;
    const culling: Array<{ object: THREE.Object3D; frustumCulled: boolean }> = [];
    root.traverse((object) => {
      culling.push({ object, frustumCulled: object.frustumCulled });
      object.frustumCulled = false;
    });
    root.visible = true;
    const previousTarget = this.renderer.getRenderTarget();
    root.removeFromParent();
    this.applianceGeometryWarmupScene.add(root);
    try {
      this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
      this.renderer.clear();
      this.renderer.render(this.applianceGeometryWarmupScene, this.applianceGeometryWarmupCamera);
    } finally {
      root.removeFromParent();
      if (originalParent) {
        originalParent.add(root);
        if (originalIndex >= 0 && originalIndex < originalParent.children.length - 1) {
          originalParent.children.splice(originalParent.children.indexOf(root), 1);
          originalParent.children.splice(originalIndex, 0, root);
        }
      }
      root.visible = rootVisible;
      culling.forEach(({ object, frustumCulled }) => {
        object.frustumCulled = frustumCulled;
      });
      this.renderer.setRenderTarget(previousTarget);
    }
  }

  private async warmPerformanceEffectsAsync(): Promise<void> {
    if (this.performanceEffectsWarmed) return;
    this.performanceEffectsWarmed = true;
    const root = this.performances.root;
    const previousTarget = this.renderer.getRenderTarget();
    const poweredApplianceLight = new THREE.PointLight(0xffffff, 1, 12, 1.65);
    poweredApplianceLight.position.set(0, 1, 0);
    poweredApplianceLight.castShadow = false;
    const states: Array<{
      object: THREE.Object3D;
      visible: boolean;
      frustumCulled: boolean;
    }> = [];
    root.traverse((object) => {
      states.push({
        object,
        visible: object.visible,
        frustumCulled: object.frustumCulled,
      });
      object.frustumCulled = false;
      object.visible = !(object instanceof THREE.Light);
    });
    this.scene.add(poweredApplianceLight);
    try {
      await this.renderer.compileAsync(root, this.camera, this.scene);
      this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
      this.renderer.clear();
      // Render through the exact live scene once. Physical splash materials
      // depend on its real directional-light, fog, tone and shadow defines;
      // compiling them in a simplified warmup scene creates a different GPU
      // program and still stalls when the animation reveals them later.
      this.renderer.render(this.scene, this.camera);
    } finally {
      states.forEach(({ object, visible, frustumCulled }) => {
        object.visible = visible;
        object.frustumCulled = frustumCulled;
      });
      poweredApplianceLight.removeFromParent();
      poweredApplianceLight.dispose();
      this.renderer.setRenderTarget(previousTarget);
    }
  }

  private readonly resetCurrentPuzzle = () => {
    if (!this.puzzle) return;
    this.randomGameOver = false;
    this.hud.beginPuzzleLoad('loading.reset');
    requestAnimationFrame(() => {
      this.resetPuzzleState(true);
      if (this.currentMode === 'rush' && this.currentRushChallenge) {
        this.rushUi.showBriefing(this.currentRushChallenge);
      }
    });
  };

  private readonly loadNewPuzzle = () => {
    this.cancelPrefetch();
    this.randomGameOver = false;
    this.hud.hideGameOver();
    const seed = createRandomSeed();
    if (this.explorationMode) {
      this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed), true);
      return;
    }
    const challengeMode = selectRandomChallengeMode(seed);
    if (challengeMode === 'rush') {
      this.rushFlow = 'random-pool';
      this.loadRushChallenge(pickRushChallenge(seed));
      return;
    }
    if (challengeMode === 'skill') {
      this.loadSkillChallenge(seed);
      return;
    }
    this.loadClassicRandomPuzzle(
      seed,
      challengeMode === 'double-ended' ? getDoubleEndedLevel(seed) : getStandardRandomLevel(seed),
    );
  };

  private loadClassicRandomPuzzle(
    seed: number,
    level = getRandomLevel(seed),
    exploration = false,
  ): void {
    this.setExplorationMode(exploration);
    this.skillEngine = null;
    this.lastSkillBuffId = null;
    this.skillBuffVisualReleaseAt = 0;
    window.clearTimeout(this.skillBuffSwapTimer);
    this.skillBuffSwapTimer = 0;
    this.setSkillInputLocked(false);
    this.skillTransientScreenEffect = 'none';
    this.pipeline.setSkillEffect('none', true);
    this.skillUi.setVisible(false);
    this.appliances.setReplacementFilter(null);
    this.currentRushChallenge = null;
    this.rushRound = null;
    this.rushFlow = null;
    this.rushUi.hide();
    this.doubleEndedUi.hide();
    this.petals.mesh.visible = true;
    this.loadPuzzle(seed, level, 'random');
  }

  private readonly startRandomFromOpening = () => {
    if (!this.leaveOpeningForModeSelection()) return;
    const seed = createRandomSeed();
    this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed));
  };

  private readonly startExploreFromOpening = () => {
    if (!this.leaveOpeningForModeSelection()) return;
    const seed = createRandomSeed();
    this.loadClassicRandomPuzzle(seed, getStandardRandomLevel(seed), true);
  };

  private readonly startDoubleEndedFromOpening = () => {
    if (!this.leaveOpeningForModeSelection()) return;
    const seed = createRandomSeed();
    this.loadClassicRandomPuzzle(seed, getDoubleEndedLevel(seed));
  };

  private readonly startSkillFromOpening = () => {
    if (!this.leaveOpeningForModeSelection()) return;
    this.loadSkillChallenge(createRandomSeed());
  };

  private loadSkillChallenge(seed: number): void {
    this.setExplorationMode(false);
    this.currentRushChallenge = null;
    this.rushRound = null;
    this.rushFlow = null;
    this.rushUi.hide();
    this.doubleEndedUi.hide();
    this.petals.mesh.visible = true;
    this.skillEngine = this.createSkillEngine(seed);
    this.lastSkillBuffId = null;
    this.setSkillInputLocked(false);
    this.skillUi.setVisible(true);
    this.skillUi.render(this.skillEngine.state);
    this.appliances.setReplacementFilter((definition) => {
      const debuffActive = this.skillEngine?.state.debuff !== null;
      return !debuffActive || ![
        'humidifier', 'refrigerator', 'coffee-maker', 'rice-cooker', 'microwave', 'phone',
      ].includes(definition.id);
    });
    this.loadPuzzle(seed, getSkillChallengeLevel(seed), 'skill');
  }

  private leaveOpeningForModeSelection(): boolean {
    if (!this.openingActive || !this.puzzle) return false;
    this.cancelPrefetch();
    this.startScreen.beginExit();
    this.startScreen.finishExit();
    this.openingActive = false;
    this.openingTransitioning = false;
    this.openingCameraPhase = 'idle';
    this.openingScene.root.visible = false;
    this.arrowRoot.visible = false;
    this.appliances.root.visible = false;
    this.connections.root.visible = false;
    this.petals.mesh.visible = false;
    return true;
  }

  private setExplorationMode(active: boolean): void {
    if (this.explorationMode === active) return;
    this.explorationMode = active;
    document.documentElement.classList.toggle('exploration-mode-active', active);
    if (active) {
      this.explorationReturnTheme = this.theme.targetMode;
      this.theme.setMode('night');
    } else if (this.explorationReturnTheme) {
      this.theme.setMode(this.explorationReturnTheme);
      this.explorationReturnTheme = null;
    }
    this.globalToolbar.setThemeLocked(active);
    this.pipeline.setExplorationProgress(active ? 1 : 0);
    this.nightEnvironment.setExplorationProgress(active ? 1 : 0);
  }

  private createSkillEngine(seed: number): SkillChallengeEngine {
    return new SkillChallengeEngine(seed);
  }

  private readonly startRushFromOpening = () => {
    if (!this.openingActive || !this.puzzle) return;
    if (this.currentMode === 'rush' && this.currentRushChallenge && this.rushRound) {
      this.startScreen.beginExit();
      this.startScreen.finishExit();
      this.openingActive = false;
      this.openingTransitioning = false;
      this.openingCameraPhase = 'idle';
      this.openingScene.root.visible = false;
      this.arrowRoot.visible = true;
      this.appliances.root.visible = false;
      this.connections.root.visible = false;
      this.petals.mesh.visible = false;
      this.rushUi.showBriefing(this.currentRushChallenge);
      this.refreshAvailability(true);
      this.publishDiagnostics();
      return;
    }
    const challenge = this.rushSelectionHint ?? RUSH_CHALLENGES[0];
    this.rushSelectionHint = null;
    if (!this.leaveOpeningForModeSelection()) return;
    this.rushFlow = 'sequence';
    this.loadRushChallenge(challenge);
  };

  private loadRushChallenge(challenge: RushChallenge): void {
    this.setExplorationMode(false);
    this.cancelPrefetch();
    this.skillEngine = null;
    this.setSkillInputLocked(false);
    this.skillTransientScreenEffect = 'none';
    this.pipeline.setSkillEffect('none', true);
    this.skillUi.setVisible(false);
    this.appliances.setReplacementFilter(null);
    this.rushUi.hide();
    this.doubleEndedUi.hide();
    this.currentRushChallenge = challenge;
    this.rushRound = new RushRound(challenge.timeLimitSeconds);
    this.loadPuzzle(challenge.level.seed, challenge.level, 'rush');
  }

  private advanceRushOrLoadRandomChallenge(): void {
    if (this.rushFlow === 'sequence' && this.currentRushChallenge) {
      const nextChallenge = getNextRushChallenge(this.currentRushChallenge);
      if (nextChallenge) {
        this.loadRushChallenge(nextChallenge);
        return;
      }
    }
    this.loadNewPuzzle();
  }

  private startRushRound(): void {
    if (this.currentMode !== 'rush' || !this.rushRound || this.rushRound.phase !== 'briefing') return;
    this.rushRound.start(performance.now() * 0.001);
    this.rushUi.showRunning();
    this.refreshAvailability(true);
    this.publishDiagnostics();
  }

  private startDoubleEndedChallenge(): void {
    if (!this.isDoubleEndedChallenge() || !this.doubleEndedUi.briefingVisible) return;
    this.doubleEndedUi.showPlaying();
    this.refreshAvailability(true);
    this.publishDiagnostics();
  }

  private readonly retryRushPuzzle = () => {
    if (this.currentMode !== 'rush' || !this.currentRushChallenge || !this.puzzle) return;
    this.hud.beginPuzzleLoad('loading.reset');
    requestAnimationFrame(() => {
      this.resetPuzzleState(true);
      this.rushUi.showBriefing(this.currentRushChallenge!);
    });
  };

  private readonly retryRandomPuzzle = () => {
    if (!this.puzzle || (this.currentMode !== 'random' && this.currentMode !== 'skill')) return;
    this.randomGameOver = false;
    this.hud.beginPuzzleLoad('loading.reset');
    requestAnimationFrame(() => this.resetPuzzleState(false));
  };

  private resetPuzzleState(preserveRandomLives: boolean): void {
    if (!this.puzzle) return;
    this.setHovered(null);
    this.animations.length = 0;
    this.pendingApplianceConnections.length = 0;
    this.connections.clear();
    this.performances.reset();
    window.clearTimeout(this.skillEvidenceCleanupTimer);
    window.clearTimeout(this.skillBuffSwapTimer);
    this.skillBuffSwapTimer = 0;
    this.skillBuffVisualReleaseAt = 0;
    this.lastSkillBuffId = null;
    this.skillPresentation.reset();
    this.skillEffects.reset();
    this.bubbleShield.reset();
    this.soundWaveShield.reset();
    this.dehumidifierDryShield.reset();
    this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
    this.portableSpeakerSpacingTargetsCache = [];
    this.televisionReconstruction.reset();
    this.toasterHeatSwap.reset();
    this.washerSpin.reset();
    this.kettleThaw.reset();
    this.refrigeratorFreeze.reset();
    this.petals.setColdProgress(0);
    this.appliances.reset();
    this.arrows = this.puzzle.arrows.map(makeRuntime);
    this.appliances.setRequiredColors(
      this.currentMode === 'rush' ? [] : this.arrows.map((arrow) => arrow.definition.color),
    );
    this.applianceRoutingRevision = this.appliances.routingRevision;
    this.removedCount = 0;
    this.randomGameOver = false;
    this.setSkillInputLocked(false);
    window.clearTimeout(this.skillSettleTimer);
    window.clearTimeout(this.skillCommitTimer);
    window.clearTimeout(this.skillSettleCueTimer);
    this.skillTransientHighlights.clear();
    this.desktopComputerFeedback = null;
    this.pendingDryShieldAbsorb = false;
    delete document.documentElement.dataset.desktopComputerFeedback;
    this.pendingWasherFlingRemovals = [];
    this.coffeeLockExitTarget = null;
    this.coffeeStainElapsed = 0;
    this.coffeeStainStrength = 0;
    this.coffeeStainProfiles.clear();
    this.skillAutoRemovalEnds.clear();
    this.radioRouteCableIds = [];
    if (this.currentMode === 'skill') {
      this.skillEngine ??= this.createSkillEngine(this.puzzle.seed);
      this.skillEngine.reset(this.puzzle.seed);
      this.randomLives = this.skillEngine.state.currentLives;
      this.skillUi.setVisible(true);
      this.skillUi.render(this.skillEngine.state);
      this.commitSkillDefinitions(
        new Map(this.puzzle.arrows.map((definition) => [definition.id, definition] as const)),
        false,
      );
    }
    this.activeHint = null;
    this.availableChoices = [];
    if (this.currentMode === 'rush') this.rushRound?.reset();
    this.puzzleRevision += 1;
    if (!preserveRandomLives) {
      if (this.currentMode === 'random') this.randomLives = 3;
      this.hintUsesRemaining = MAX_HINT_USES;
    }
    this.hud.setRandomLives(
      this.currentMode === 'random' || this.currentMode === 'skill',
      this.randomLives,
      this.currentMode === 'skill' ? this.skillEngine?.state.maxLives ?? 3 : 3,
    );
    this.hud.setHintUses(this.hintUsesRemaining);
    this.appliances.root.visible = this.currentMode !== 'rush';
    this.connections.root.visible = this.currentMode !== 'rush';
    this.petals.mesh.visible = this.currentMode !== 'rush';

    for (const model of this.models.values()) {
      model.resetPose();
    }

    this.hud.setPuzzle(
      this.puzzle.seed,
      this.arrows.length,
      this.arrows.length,
      this.currentMode === 'campaign' && this.currentLevel
        ? 'mode.level'
        : this.currentMode === 'rush'
          ? 'mode.rush'
          : this.currentMode === 'skill'
            ? 'mode.skill'
          : this.explorationMode
            ? 'mode.explore'
          : 'mode.random',
      this.currentMode === 'campaign' && this.currentLevel
        ? this.currentLevel.id < CAMPAIGN_LEVELS.length
          ? 'continue.next'
          : 'continue.random'
        : this.currentMode === 'rush'
          ? 'continue.random'
          : 'continue.first',
      this.currentMode === 'campaign' && this.currentLevel
        ? { level: this.currentLevel.id.toString().padStart(2, '0'), shapeId: this.currentLevel.shape }
        : {},
    );
    this.hud.flash(t('flash.summary', { count: this.arrows.length, free: this.puzzle.initiallyFree }));
    this.refreshAvailability(true);
    if (this.isDoubleEndedChallenge()) this.doubleEndedUi.showBriefing();
    this.publishDiagnostics();
  }

  private readonly toggleLanguage = () => {
    toggleLocale();
    this.startScreen.refreshLocale();
    this.hud.refreshLocale();
    this.rushUi.refreshLocale();
    this.doubleEndedUi.refreshLocale();
    this.publishDiagnostics();
  };

  private readonly revealHint = () => {
    this.refreshAvailability(false);
    if (!this.canRevealHint() || this.availableChoices.length === 0) {
      this.hud.showHintUnavailable();
      return;
    }

    const visibleChoice = this.clickTarget
      ? this.availableChoices.find(({ arrow, end }) =>
        arrow.definition.id === this.clickTarget?.id && end === this.clickTarget.end)
      : null;
    const selected = visibleChoice ?? this.availableChoices[0];
    this.activeHint = { id: selected.arrow.definition.id, end: selected.end };
    this.applyActiveHint(true);
    this.hintUsesRemaining = Math.max(0, this.hintUsesRemaining - 1);
    this.hud.setHintUses(this.hintUsesRemaining);
    this.hud.setHintEnabled(this.canRevealHint() && this.availableChoices.length > 0);
    this.hud.showHintUsed(this.hintUsesRemaining);
    this.publishDiagnostics();
  };

  private readonly returnToOpening = () => {
    if (this.openingActive) return;
    if (
      this.animations.length > 0
      || this.pendingApplianceConnections.length > 0
      || this.connections.activeCount > 0
    ) {
      this.hud.flash(t('flash.wait'));
      return;
    }
    this.setHovered(null);
    this.clearActiveHint();
    this.hud.setHintEnabled(false);
    this.rushUi.hide();
    this.doubleEndedUi.hide();
    this.rushRound = null;
    this.currentRushChallenge = null;
    this.rushFlow = null;
    this.setExplorationMode(false);
    this.setSkillInputLocked(false);
    this.skillEngine = null;
    this.skillTransientScreenEffect = 'none';
    this.pipeline.setSkillEffect('none', true);
    this.skillUi.setVisible(false);
    this.appliances.setReplacementFilter(null);
    this.openingActive = true;
    this.openingTransitioning = false;
    this.openingCameraPhase = 'idle';
    this.openingCameraElapsed = 0;
    this.sceneTransitionCurtain.style.opacity = '0';
    this.sceneTransitionCurtain.classList.remove('visible');
    this.openingScene.reset();
    this.openingScene.root.visible = true;
    this.arrowRoot.visible = false;
    this.appliances.root.visible = false;
    this.connections.root.visible = false;
    this.petals.mesh.visible = true;
    this.hud.hidePanels();
    this.startScreen.showAgain();
    this.orbit.setAngles(0.76, 0.56);
    this.orbit.setRadius(19.2);
    this.publishDiagnostics();
    if (this.currentMode === 'campaign' && this.currentLevel?.id === 1) return;
    const firstLevel = getCampaignLevel(1);
    this.loadPuzzle(seedForCampaignLevel(firstLevel.id), firstLevel, 'campaign');
  };

  private readonly loadNextPuzzle = () => {
    this.setExplorationMode(false);
    const nextId = this.currentMode === 'campaign' && this.currentLevel
      ? this.currentLevel.id + 1
      : 1;
    if (nextId > CAMPAIGN_LEVELS.length) {
      this.loadNewPuzzle();
      return;
    }
    const level = getCampaignLevel(nextId);
    this.currentLevel = level;
    this.currentMode = 'campaign';
    this.hud.beginPuzzleLoad('loading.level', true, { level: level.id });
    if (this.prefetchedLevel?.levelId === level.id) {
      const prefetched = this.prefetchedLevel;
      this.prefetchedLevel = null;
      this.generationMs = prefetched.generationMs;
      this.hud.completePuzzleLoad(() => this.applyPuzzle(prefetched.puzzle));
      return;
    }
    if (this.prefetchingLevelId === level.id) {
      this.waitingForPrefetchLevelId = level.id;
      return;
    }
    this.loadPuzzle(seedForCampaignLevel(level.id), level, 'campaign');
  };

  private async prepareOpeningAndLoadPuzzle(
    seed: number,
    level: LevelDefinition,
    mode: GameMode,
  ): Promise<void> {
    try {
      this.startScreen.setStage('start.loading.bundle', 0.12, 0.24);
      await this.openingScene.prepareAsync((progress, buildMs) => {
        this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
        this.startScreen.setExactProgress('start.loading.bundle', 0.12 + progress * 0.12);
      });
      this.loadPuzzle(seed, level, mode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.startScreen.showError(message);
      this.hud.showLoadError(message);
    }
  }

  private loadPuzzle(seed: number, level?: LevelDefinition, mode: GameMode = 'random'): void {
    this.puzzleRequestId += 1;
    this.currentLevel = level ?? null;
    this.currentMode = mode;
    this.doubleEndedUi.hide();
    this.hud.beginPuzzleLoad(
      mode === 'campaign' && level
        ? 'loading.level'
        : mode === 'rush'
          ? 'loading.rush'
          : mode === 'skill'
            ? 'loading.skill'
            : 'loading.random',
      this.puzzle !== null,
      mode === 'campaign' && level ? { level: level.id } : {},
    );
    this.hud.flash(t('flash.wiring'));
    if (this.openingActive && this.puzzle === null) {
      this.startScreen.setStage('start.loading.first', 0.24, 0.56);
    }
    this.puzzleWorker.postMessage({
      requestId: this.puzzleRequestId,
      seed,
      targetCount: level?.targetCount ?? 30,
      level,
      mode,
    });
  }

  private async applyPuzzle(
    puzzle: PuzzleDefinition,
    staged = false,
    preserveRandomLives = false,
  ): Promise<void> {
    const modelBuildStartedAt = performance.now();
    this.clearPuzzle();
    this.puzzle = puzzle;
    this.puzzleRevision += 1;
    this.arrows = this.puzzle.arrows.map(makeRuntime);
    this.removedCount = 0;
    this.randomGameOver = false;
    if (this.currentMode === 'skill') {
      this.skillEngine = this.createSkillEngine(puzzle.seed);
      this.skillInputLocked = false;
      this.skillTransientHighlights.clear();
      this.skillTransientScreenEffect = 'none';
      this.skillUi.setVisible(true);
      this.skillUi.render(this.skillEngine.state);
      this.appliances.setReplacementFilter((definition) => {
        const debuffActive = this.skillEngine?.state.debuff !== null;
        return !debuffActive || ![
          'humidifier', 'refrigerator', 'coffee-maker', 'rice-cooker', 'microwave', 'phone',
        ].includes(definition.id);
      });
      this.randomLives = this.skillEngine.state.currentLives;
    } else {
      this.skillEngine = null;
      this.skillUi.setVisible(false);
      this.skillTransientScreenEffect = 'none';
      this.pipeline.setSkillEffect('none', true);
      this.appliances.setReplacementFilter(null);
    }
    if (!preserveRandomLives) {
      if (this.currentMode === 'random') this.randomLives = 3;
      this.hintUsesRemaining = MAX_HINT_USES;
    }
    this.hud.setRandomLives(
      this.currentMode === 'random' || this.currentMode === 'skill',
      this.randomLives,
      this.currentMode === 'skill' ? this.skillEngine?.state.maxLives ?? 3 : 3,
    );
    this.hud.setHintUses(this.hintUsesRemaining);
    const applianceSeed = applianceSeedForPuzzle(
      puzzle.seed,
      this.currentMode === 'campaign' && this.currentLevel ? this.currentLevel.id : 0,
    );
    const activeColors = [...new Set(puzzle.arrows.map((arrow) => arrow.color))];
    const configuredDefinitions = this.currentMode === 'campaign' && this.currentLevel?.id === 1
      ? selectTutorialAppliances(activeColors.length)
      : undefined;
    if (!staged) this.preloadMaxSliceMs = 0;
    if (this.currentMode === 'rush') {
      this.appliances.clear();
      this.appliances.setRequiredColors([]);
      if (staged) this.startScreen.setExactProgress('start.loading.cables', 0.82);
    } else if (staged) {
      this.startScreen.setStage('start.loading.appliances', 0.58, 0.82);
      await this.appliances.configureAsync(applianceSeed, (progress, buildMs) => {
        this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
        this.startScreen.setExactProgress('start.loading.appliances', 0.58 + progress * 0.18);
      }, configuredDefinitions, activeColors);
    } else {
      await this.appliances.configureAsync(applianceSeed, (_progress, buildMs) => {
        this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
      }, configuredDefinitions, activeColors);
    }
    this.appliances.setSingleTargetColorAliases([]);
    this.appliances.setRequiredColors(
      this.currentMode === 'rush' ? [] : this.arrows.map((arrow) => arrow.definition.color),
    );
    if (this.currentMode !== 'rush') {
      await this.warmPerformanceEffectsAsync();
      for (const target of this.appliances.targets) {
        this.performances.prime(target);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
      await this.appliances.prepareInitialReplacementsAsync((progress, buildMs) => {
        this.preloadMaxSliceMs = Math.max(this.preloadMaxSliceMs, buildMs);
        if (staged) {
          this.startScreen.setExactProgress('start.loading.appliances', 0.76 + progress * 0.06);
        }
      });
    }
    this.applianceRoutingRevision = this.appliances.routingRevision;

    for (let index = 0; index < this.arrows.length; index += 1) {
      const arrow = this.arrows[index];
      const cableBuildStartedAt = performance.now();
      const model = new PlugCableModel(
        arrow.definition,
        this.currentMode === 'rush'
          ? undefined
          : this.appliances.getPlugStyleForColor(arrow.definition.color),
      );
      this.models.set(arrow.definition.id, model);
      this.arrowRoot.add(model.root);
      this.preloadMaxSliceMs = Math.max(
        this.preloadMaxSliceMs,
        performance.now() - cableBuildStartedAt,
      );
      if (staged) {
        this.startScreen.setExactProgress(
          'start.loading.cables',
          0.82 + ((index + 1) / this.arrows.length) * 0.11,
        );
      }
      const shouldYieldModelBuild = !staged
        || (index + 1) % 5 === 0
        || index === this.arrows.length - 1;
      if (shouldYieldModelBuild) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    }
    this.modelBuildMs = performance.now() - modelBuildStartedAt;

    this.hud.setPuzzle(
      this.puzzle.seed,
      this.arrows.length,
      this.arrows.length,
      this.currentMode === 'campaign' && this.currentLevel
        ? 'mode.level'
        : this.currentMode === 'rush'
          ? 'mode.rush'
          : this.currentMode === 'skill'
            ? 'mode.skill'
          : this.explorationMode
            ? 'mode.explore'
          : 'mode.random',
      this.currentMode === 'campaign' && this.currentLevel
        ? this.currentLevel.id < CAMPAIGN_LEVELS.length
          ? 'continue.next'
          : 'continue.random'
        : this.currentMode === 'rush'
          ? 'continue.random'
          : 'continue.first',
      this.currentMode === 'campaign' && this.currentLevel
        ? { level: this.currentLevel.id.toString().padStart(2, '0'), shapeId: this.currentLevel.shape }
        : {},
    );
    this.hud.flash(t('flash.summary', { count: this.arrows.length, free: this.puzzle.initiallyFree }));
    if (this.currentLevel) {
      const preset = this.currentLevel.shape === 'torus'
        ? { yaw: 0.62, pitch: 0.72 }
        : this.currentLevel.shape === 'sphere'
          ? { yaw: 0.76, pitch: 0.66 }
          : { yaw: 0.76, pitch: 0.56 };
      this.orbit.setAngles(preset.yaw, preset.pitch);
      this.orbit.setRadius(this.currentLevel.cameraRadius);
    }
    this.refreshAvailability(true);
    const url = new URL(window.location.href);
    url.searchParams.set('seed', String(this.puzzle.seed));
    if (this.currentMode === 'campaign' && this.currentLevel) {
      url.searchParams.set('level', String(this.currentLevel.id));
      url.searchParams.delete('mode');
      url.searchParams.delete('rush');
      url.searchParams.delete('direct');
      url.searchParams.delete('skill');
    } else if (this.currentMode === 'rush' && this.currentRushChallenge) {
      url.searchParams.delete('level');
      url.searchParams.set('mode', 'rush');
      url.searchParams.set('rush', this.currentRushChallenge.id);
      url.searchParams.set('direct', '1');
      url.searchParams.delete('skill');
    } else if (this.currentMode === 'skill') {
      url.searchParams.delete('level');
      url.searchParams.set('mode', 'skill');
      url.searchParams.delete('skill');
      url.searchParams.set('direct', '1');
      url.searchParams.delete('rush');
    } else {
      url.searchParams.delete('level');
      url.searchParams.set('mode', this.explorationMode ? 'explore' : 'random');
      url.searchParams.set('direct', '1');
      url.searchParams.delete('rush');
      url.searchParams.delete('skill');
    }
    window.history.replaceState({}, '', url);
    this.prefetchedLevel = this.prefetchedLevel?.levelId === this.currentLevel?.id
      ? null
      : this.prefetchedLevel;
    this.prefetchNextCampaignLevel();
    if (!this.openingActive) {
      this.arrowRoot.visible = true;
      this.appliances.root.visible = this.currentMode !== 'rush';
      this.connections.root.visible = this.currentMode !== 'rush';
      this.petals.mesh.visible = this.currentMode !== 'rush';
    }
    this.publishDiagnostics();
    if (staged) {
      this.startScreen.setStage('start.loading.scene', 0.94, 0.985);
      await this.warmInitialSceneInSlices();
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      this.initialPuzzlePreparing = false;
      this.startScreen.markReady();
      this.publishDiagnostics();
    } else if (this.currentMode === 'rush' && this.currentRushChallenge) {
      this.rushUi.showBriefing(this.currentRushChallenge);
    } else if (this.isDoubleEndedChallenge()) {
      this.doubleEndedUi.showBriefing();
    }
  }

  private prefetchNextCampaignLevel(): void {
    if (
      this.currentMode !== 'campaign' ||
      !this.currentLevel ||
      this.currentLevel.id >= CAMPAIGN_LEVELS.length
    ) {
      return;
    }
    const level = getCampaignLevel(this.currentLevel.id + 1);
    if (this.prefetchedLevel?.levelId === level.id || this.prefetchingLevelId === level.id) return;
    this.prefetchRequestId += 1;
    this.prefetchingLevelId = level.id;
    this.prefetchWorker.postMessage({
      requestId: this.prefetchRequestId,
      seed: seedForCampaignLevel(level.id),
      targetCount: level.targetCount,
      level,
      mode: 'campaign',
    });
  }

  private cancelPrefetch(): void {
    this.prefetchRequestId += 1;
    this.prefetchingLevelId = null;
    this.waitingForPrefetchLevelId = null;
    this.prefetchedLevel = null;
  }

  private clearPuzzle(): void {
    window.clearTimeout(this.skillEvidenceCleanupTimer);
    window.clearTimeout(this.skillRecycleSelectionTimer);
    window.clearTimeout(this.skillBuffSwapTimer);
    this.skillBuffSwapTimer = 0;
    this.skillBuffVisualReleaseAt = 0;
    this.lastSkillBuffId = null;
    this.desktopComputerFeedback = null;
    this.pendingDryShieldAbsorb = false;
    this.hud.setContinueReady(false);
    delete document.documentElement.dataset.desktopComputerFeedback;
    this.setHovered(null);
    this.animations.length = 0;
    this.pendingApplianceConnections.length = 0;
    this.skillAutoRemovalEnds.clear();
    this.pendingWasherFlingRemovals = [];
    this.washerFlingHistory = [];
    this.coffeeLockExitTarget = null;
    this.coffeeStainElapsed = 0;
    this.coffeeStainStrength = 0;
    this.coffeeStainProfiles.clear();
    this.radioRouteCableIds = [];
    this.connections.clear();
    this.performances.reset();
    this.skillPresentation.reset();
    this.skillEffects.reset();
    this.bubbleShield.reset();
    this.soundWaveShield.reset();
    this.dehumidifierDryShield.reset();
    this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
    this.portableSpeakerSpacingTargetsCache = [];
    this.televisionReconstruction.reset();
    this.toasterHeatSwap.reset();
    this.washerSpin.reset();
    this.kettleThaw.reset();
    this.refrigeratorFreeze.reset();
    this.petals.setColdProgress(0);
    this.appliances.clear();
    this.appliances.setRequiredColors([]);
    this.applianceRoutingRevision = this.appliances.routingRevision;
    for (const model of this.models.values()) {
      model.root.parent?.remove(model.root);
      model.dispose();
    }
    this.models.clear();
    this.arrows = [];
    this.activeHint = null;
    this.availableChoices = [];
    this.clickTarget = null;
    this.availableClickTargets = [];
    this.blockedClickTarget = null;
    this.doubleEndedUi.hide();
  }

  private async warmInitialSceneInSlices(): Promise<void> {
    const cableModels = [...this.models.values()];
    const cableRoots = cableModels.map((model) => model.root);
    const applianceRoots = this.appliances.targets.map((target) => target.root);
    const batches = [...cableRoots, ...applianceRoots];
    if (batches.length === 0) return;

    const arrowRootVisible = this.arrowRoot.visible;
    const applianceRootVisible = this.appliances.root.visible;
    const connectionRootVisible = this.connections.root.visible;
    const openingRootVisible = this.openingScene.root.visible;
    const petalsVisible = this.petals.mesh.visible;
    const batchVisibility = batches.map((object) => object.visible);

    this.arrowRoot.visible = true;
    this.appliances.root.visible = true;
    this.connections.root.visible = false;
    this.openingScene.root.visible = false;
    this.petals.mesh.visible = false;
    batches.forEach((object) => {
      object.visible = false;
    });

    try {
      for (let index = 0; index < batches.length; index += 1) {
        const object = batches[index];
        const cableModel = index < cableModels.length ? cableModels[index] : null;
        cableModel?.setIceShellWarmupVisible(true);
        object.visible = true;
        object.updateWorldMatrix(true, true);

        const compileStartedAt = performance.now();
        this.renderer.compile(object, this.camera, this.scene);
        this.preloadMaxSliceMs = Math.max(
          this.preloadMaxSliceMs,
          performance.now() - compileStartedAt,
        );

        object.visible = false;
        cableModel?.setIceShellWarmupVisible(false);
        this.startScreen.setExactProgress(
          index < cableRoots.length ? 'start.loading.materials' : 'start.loading.applianceMaterials',
          0.94 + ((index + 1) / batches.length) * 0.045,
        );
        if ((index + 1) % 5 === 0 || index === batches.length - 1) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
    } finally {
      cableModels.forEach((model) => model.setIceShellWarmupVisible(false));
      batches.forEach((object, index) => {
        object.visible = batchVisibility[index];
      });
      this.arrowRoot.visible = arrowRootVisible;
      this.appliances.root.visible = applianceRootVisible;
      this.connections.root.visible = connectionRootVisible;
      this.openingScene.root.visible = openingRootVisible;
      this.petals.mesh.visible = petalsVisible;
    }
  }

  private beginOpeningTransition(): void {
    if (!this.openingActive || this.openingTransitioning || !this.puzzle) return;
    this.openingTransitioning = true;
    this.openingCameraPhase = 'insert';
    this.openingCameraElapsed = 0;
    this.openingCameraFinal.copy(this.camera.position);
    this.sceneTransitionCurtain.style.opacity = '0';
    this.sceneTransitionCurtain.classList.remove('visible');
    this.startScreen.beginExit();
    this.openingScene.beginTransition();
    this.audio.playInteraction('mode-start');
  }

  private finishOpeningTransition(): void {
    if (!this.openingActive) return;
    this.openingActive = false;
    this.openingScene.root.visible = false;
    this.arrowRoot.visible = true;
    this.appliances.root.visible = this.currentMode !== 'rush';
    this.connections.root.visible = this.currentMode !== 'rush';
    this.petals.mesh.visible = this.currentMode !== 'rush';
    if (this.currentMode !== 'rush') this.appliances.beginOpeningCameraTransition();
    this.startScreen.finishExit();
    this.openingCameraClose
      .copy(this.openingCameraFinal)
      .sub(this.openingCameraFinalTarget)
      .normalize()
      .multiplyScalar(5.4)
      .add(this.openingCameraFinalTarget);
    this.camera.position.copy(this.openingCameraClose);
    this.camera.lookAt(this.openingCameraFinalTarget);
    this.openingCameraPhase = 'background-hold';
    this.openingCameraElapsed = 0;
    // The close-up camera is still moving. Do not expose a click coordinate
    // that will be stale by the time the reveal/pull cinematic finishes.
    this.clickTarget = null;
    this.availableClickTargets = [];
    this.blockedClickTarget = null;
    this.publishDiagnostics();
  }

  private updateOpeningCameraTransition(delta: number): void {
    if (this.openingCameraPhase === 'idle') return;
    this.openingCameraElapsed += delta;

    if (this.openingCameraPhase === 'insert') {
      if (!this.openingScene.transitionComplete) return;
      this.openingCameraPhase = 'hold';
      this.openingCameraElapsed = 0;
      return;
    }

    if (this.openingCameraPhase === 'hold') {
      if (this.openingCameraElapsed < this.openingHoldDuration) return;
      this.openingCameraPhase = 'fade-out';
      this.openingCameraElapsed = 0;
      this.sceneTransitionCurtain.classList.add('visible');
      return;
    }

    if (this.openingCameraPhase === 'fade-out') {
      const progress = THREE.MathUtils.clamp(this.openingCameraElapsed / this.openingFadeOutDuration, 0, 1);
      this.sceneTransitionCurtain.style.opacity = String(THREE.MathUtils.smoothstep(progress, 0, 1));
      if (progress >= 1) this.finishOpeningTransition();
      return;
    }

    if (this.openingCameraPhase === 'background-hold') {
      // Let the old scene disappear completely before the new one starts to
      // emerge. Keeping one clean background-only beat avoids a visible cut
      // between the opening plug and the level-one cable cluster.
      this.sceneTransitionCurtain.style.opacity = '1';
      this.camera.position.copy(this.openingCameraClose);
      this.camera.lookAt(this.openingCameraFinalTarget);
      if (this.openingCameraElapsed < this.openingBackgroundHoldDuration) return;
      this.openingCameraPhase = 'reveal';
      this.openingCameraElapsed = 0;
      return;
    }

    if (this.openingCameraPhase === 'reveal') {
      this.camera.position.copy(this.openingCameraClose);
      this.camera.lookAt(this.openingCameraFinalTarget);
      const progress = THREE.MathUtils.clamp(this.openingCameraElapsed / this.openingRevealDuration, 0, 1);
      this.sceneTransitionCurtain.style.opacity = String(1 - THREE.MathUtils.smoothstep(progress, 0, 1));
      if (progress < 1) return;
      this.sceneTransitionCurtain.style.opacity = '0';
      this.sceneTransitionCurtain.classList.remove('visible');
      this.openingCameraPhase = 'pull';
      this.openingCameraElapsed = 0;
      return;
    }

    const progress = THREE.MathUtils.clamp(this.openingCameraElapsed / this.openingCameraPullDuration, 0, 1);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
    this.camera.position.lerpVectors(this.openingCameraClose, this.openingCameraFinal, eased);
    this.camera.lookAt(this.openingCameraFinalTarget);
    if (progress >= 1) {
      this.openingCameraPhase = 'idle';
      this.openingTransitioning = false;
      this.orbit.setAngles(0.76, this.currentLevel?.shape === 'sphere' ? 0.66 : 0.56);
      this.orbit.setRadius(this.currentLevel?.cameraRadius ?? 19.2);
      // The click target was projected for the close-up camera. Re-project it
      // once the final orbit framing is restored so the first cable click
      // lands on the visible arrow rather than its transition-era coordinate.
      this.refreshAvailability(true);
      if (this.currentMode === 'rush' && this.currentRushChallenge) {
        this.rushUi.showBriefing(this.currentRushChallenge);
      } else if (this.isDoubleEndedChallenge()) {
        this.doubleEndedUi.showBriefing();
      }
      this.publishDiagnostics();
    }
  }

  private createLighting(): void {
    const sun = this.sun;
    sun.position.set(-8.5, 11, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -7;
    sun.shadow.camera.right = 7;
    sun.shadow.camera.top = 7;
    sun.shadow.camera.bottom = -7;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 35;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.035;
    this.scene.add(sun, sun.target);

    const fill = this.fill;
    fill.position.set(8, 4.5, -7);
    this.scene.add(fill, fill.target);

    const bounce = this.bounce;
    bounce.position.set(2, -5, 7);
    this.scene.add(bounce, bounce.target);

    this.scene.add(this.hemi);
  }

  private finishOpeningForEvidence(): boolean {
    if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) || !this.puzzle) return false;
    this.openingActive = false;
    this.openingTransitioning = false;
    this.openingCameraPhase = 'idle';
    this.openingCameraElapsed = 0;
    this.openingScene.root.visible = false;
    this.arrowRoot.visible = true;
    this.appliances.root.visible = this.currentMode !== 'rush';
    this.connections.root.visible = this.currentMode !== 'rush';
    this.petals.mesh.visible = this.currentMode !== 'rush';
    this.startScreen.finishExit();
    this.sceneTransitionCurtain.style.opacity = '0';
    this.sceneTransitionCurtain.classList.remove('visible');
    this.orbit.setAngles(0.76, this.currentLevel?.shape === 'sphere' ? 0.66 : 0.56);
    this.orbit.setRadius(this.currentLevel?.cameraRadius ?? 19.2);
    this.refreshAvailability(true);
    this.publishDiagnostics();
    return true;
  }

  private settleApplianceForEvidence(): boolean {
    if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
    if (this.openingActive || this.openingTransitioning || this.animations.length > 0) return false;
    const replaced = this.appliances.replaceActiveTargetForEvidence();
    if (!replaced) return false;
    this.syncRequiredColors();
    this.refreshAvailability(false);
    this.publishDiagnostics();
    return true;
  }

  /**
   * Deterministic selection hook for fixed-time visual evidence. It is only
   * installed when the performance clock override is present, and still
   * enters the normal handleClick -> exit animation -> connection path.
   */
  private activateApplianceForEvidence(kind: string): boolean {
    if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
    if (this.openingActive || this.openingTransitioning || this.animations.length > 0 || this.randomGameOver) return false;
    const target = this.appliances.targets.find((candidate) => candidate.kind === kind);
    if (!target) return false;
    const arrow = this.arrows.find((candidate) =>
      candidate.state === 'idle' &&
      candidate.definition.color === target.accent &&
      this.appliances.canAssignColor(candidate.definition.color) &&
      cableEndsFor(candidate.definition).some((end) =>
        checkCableEndExit(candidate, this.arrows, end).clear),
    );
    if (!arrow || !arrow.samplePoints[0]) return false;
    const end = cableEndsFor(arrow.definition).find((candidateEnd) =>
      checkCableEndExit(arrow, this.arrows, candidateEnd).clear,
    ) ?? 'head';
    this.camera.updateMatrixWorld(true);
    const projected = (end === 'head'
      ? arrow.samplePoints[arrow.samplePoints.length - 1]
      : arrow.samplePoints[0]).clone().project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    const clientX = rect.left + ((projected.x + 1) * 0.5) * rect.width;
    const clientY = rect.top + ((1 - projected.y) * 0.5) * rect.height;
    this.handleClick(clientX, clientY, arrow.definition.id, end);
    const animation = this.animations.find((candidate) =>
      candidate.arrow === arrow && candidate.kind === 'exit');
    if (animation) {
      animation.elapsed = animation.duration;
      animation.wallClockStartedAtSeconds = null;
      this.updateAnimations(0, performance.now() * 0.001);
    }
    return arrow.state !== 'idle' || this.animations.some((animation) => animation.arrow === arrow);
  }

  private pullCableForEvidence(id?: string, end: CableEnd = 'head'): boolean {
    if (this.openingActive || this.openingTransitioning || this.animations.length > 0 || this.randomGameOver) return false;
    this.refreshAvailability(false);
    const choice = id
      ? this.availableChoices.find(({ arrow, end: choiceEnd }) =>
        arrow.definition.id === id && choiceEnd === end,
      ) ?? this.availableChoices.find(({ arrow }) => arrow.definition.id === id)
      : undefined;
    const forcedChoice = id
      ? this.arrows.find((arrow) => arrow.definition.id === id && arrow.state === 'idle')
      : undefined;
    const selected = choice
      ?? (forcedChoice ? { arrow: forcedChoice, end } : undefined)
      ?? this.availableChoices[0];
    if (!selected) return false;
    this.handleClick(0, 0, selected.arrow.definition.id, selected.end);
    const animation = this.animations.find((candidate) =>
      candidate.arrow === selected.arrow && candidate.kind === 'exit');
    if (Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) && animation) {
      this.publishDiagnostics();
      animation.elapsed = animation.duration;
      animation.wallClockStartedAtSeconds = null;
      this.updateAnimations(0, performance.now() * 0.001);
    }
    return selected.arrow.state !== 'idle' || this.animations.some((candidate) => candidate.arrow === selected.arrow);
  }

  private activateRushCableForEvidence(id: string): boolean {
    if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__)) return false;
    if (this.currentMode !== 'rush' || this.rushRound?.phase !== 'running' || this.animations.length > 0) return false;
    const arrow = this.arrows.find((candidate) => candidate.definition.id === id && candidate.state === 'idle');
    if (!arrow) return false;
    const end = cableEndsFor(arrow.definition).find((candidateEnd) =>
      checkCableEndExit(arrow, this.arrows, candidateEnd).clear);
    if (!end) return false;
    this.handleClick(0, 0, arrow.definition.id, end);
    const animation = this.animations.find((candidate) => candidate.arrow === arrow && candidate.kind === 'exit');
    if (!animation) return false;
    // Software WebGL can render below one frame per second in CI. Complete the
    // already-validated RUSH exit through the normal animation/removal path so
    // the fixed-solution evidence measures puzzle logic instead of GPU speed.
    const nowSeconds = performance.now() * 0.001;
    animation.elapsed = animation.duration;
    animation.wallClockStartedAtSeconds = null;
    this.updateAnimations(0, nowSeconds);
    return arrow.state === 'removed';
  }

  private showSkillPresentationForEvidence(skill: 'radio' | 'robot-vacuum' | 'rice-cooker'): boolean {
    if (!Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__) || this.openingActive) return false;
    const availableIds = [...new Set(this.availableChoices.map(({ arrow }) => arrow.definition.id))];
    const targetCableIds = skill === 'rice-cooker'
      ? this.arrows.filter((arrow) => arrow.state !== 'removed').map((arrow) => arrow.definition.id)
      : skill === 'radio'
        ? (this.skillEngine
            ? this.createSkillContext().removalSequence.slice(0, 3)
            : availableIds.slice(0, 3))
        : availableIds;
    if (targetCableIds.length === 0) return false;
    const resolution: SkillResolution = {
      skillId: skill === 'radio' ? 'route-broadcast' : skill === 'robot-vacuum' ? 'snapshot-sweep' : 'rice-thick-cable',
      appliance: skill,
      label: skill,
      targetCableIds,
      commands: [],
      requiresSelection: null,
      topologyChanged: skill === 'robot-vacuum',
      presentation: { cue: 'evidence', commit: 'evidence', settle: 'evidence', assetIds: [] },
    };
    this.skillPresentation.reset();
    this.skillEffects.reset();
    this.bubbleShield.reset();
    this.soundWaveShield.reset();
    this.dehumidifierDryShield.reset();
    this.portableSpeakerSpacing.reset(this.getPortableSpeakerSpacingTargets());
    this.arrowRoot.visible = true;
    this.skillEvidenceVisible = true;
    this.skillPresentation.root.visible = true;
    const evidenceCount = skill === 'radio' ? 3 : skill === 'robot-vacuum' ? targetCableIds.length : Math.min(5, targetCableIds.length);
    const evidencePositions = Array.from({ length: evidenceCount }, (_, index) => {
      const columns = Math.min(3, evidenceCount);
      const row = Math.floor(index / columns);
      const column = index % columns;
      const x = columns === 1 ? 0 : (column / (columns - 1) - 0.5) * 2.5;
      const y = 0.8 - row * 0.9;
      return this.camera.localToWorld(new THREE.Vector3(x, y, -4.2));
    });
    if (skill === 'robot-vacuum') {
      this.skillAutoRemovalEnds.clear();
      const snapshotEnds = availableCableEnds(this.arrows);
      targetCableIds.forEach((id) => {
        const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
        if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
      });
    }
    const evidenceTargets: SkillPresentationTarget[] = evidencePositions.map((position, index) => {
      const cableId = targetCableIds[index] ?? `evidence-${index + 1}`;
      const path = skill === 'rice-cooker'
        ? [
            position.clone().add(new THREE.Vector3(-0.65, -0.18, 0)),
            position.clone().add(new THREE.Vector3(0, 0.2, 0)),
            position.clone().add(new THREE.Vector3(0.65, -0.18, 0)),
          ]
        : undefined;
      return { cableId, position, path };
    });
    const duration = this.skillPresentation.play(resolution, evidenceTargets);
    this.skillPresentation.render();
    this.publishDiagnostics();
    const cleanupEvidence = (): void => {
      const presentation = this.skillPresentation.diagnostics;
      const sequencePending = skill === 'robot-vacuum'
        && presentation.autoRemovalOrder.length < presentation.targetCount;
      const exitsPending = skill === 'robot-vacuum'
        && this.animations.some((animation) => animation.autoCommitted);
      if (sequencePending || exitsPending) {
        this.skillEvidenceCleanupTimer = window.setTimeout(cleanupEvidence, 100);
        return;
      }
      this.skillPresentation.complete();
      this.skillEvidenceVisible = false;
      if (skill === 'rice-cooker') {
        for (const model of this.models.values()) model.setVisualThickness(1);
      }
      this.publishDiagnostics();
    };
    this.skillEvidenceCleanupTimer = window.setTimeout(cleanupEvidence, duration + 80);
    return true;
  }

  private freezeSkillPresentationForEvidence(timeMs: number): boolean {
    const frozen = this.skillPresentation.freezeForEvidence(timeMs);
    if (frozen) {
      this.skillPresentation.render();
      this.publishDiagnostics();
    }
    return frozen;
  }

  private handleClick(
    clientX: number,
    clientY: number,
    forcedArrowId?: string,
    forcedEnd: CableEnd = 'head',
  ): void {
    if (
      this.openingActive
      || this.openingTransitioning
      || this.animations.some((animation) => animation.kind === 'bump')
      || this.randomGameOver
      || (this.currentMode === 'rush' && this.rushRound?.phase !== 'running')
      || this.doubleEndedUi.briefingVisible
      || (this.currentMode === 'skill'
        && this.skillInputLocked
        && this.skillEngine?.state.phase !== 'select-recycle-target')
    ) return;
    const picked = forcedArrowId
      ? { id: forcedArrowId, end: forcedEnd }
      : this.pickArrow(clientX, clientY);
    if (!picked) return;
    const arrow = this.arrows.find((entry) => entry.definition.id === picked.id);
    const model = this.models.get(picked.id);
    if (!arrow || !model || arrow.state !== 'idle') return;

    if (this.currentMode === 'skill' && this.skillEngine?.state.phase === 'select-recycle-target') {
      this.commitSkillRecycleSelection(arrow);
      return;
    }

    const fakePlug = this.currentMode === 'skill'
      && picked.end === 'tail'
      && this.skillEngine?.getFakePlugCableIds().includes(arrow.definition.id);
    const frozen = this.currentMode === 'skill'
      && this.skillEngine?.getFrozenCableIds().includes(arrow.definition.id);
    const result = fakePlug || frozen
      ? { clear: false, blockerId: arrow.definition.id, contact: null }
      : checkCableEndExit(arrow, this.arrows, picked.end);
    const direction = DIRECTION_VECTORS[cableEndDirection(arrow.definition, picked.end)].clone();
    this.setHovered(null);

    if (result.clear) {
      const target = this.currentMode === 'rush'
        ? null
        : this.appliances.reserveAssignment(arrow.definition.id, arrow.definition.color);
      const queueAfterExit = this.currentMode !== 'rush'
        && this.currentMode !== 'skill'
        && !target
        && this.appliances.canQueueColor(arrow.definition.color);
      if (this.currentMode !== 'rush' && !target && !queueAfterExit) return;
      if (this.currentMode === 'skill') {
        const wasLastCableAtPullStart = this.arrows.length - this.removedCount === 1;
        if (!target || !this.skillEngine?.beginManualPull(
          arrow.definition.id,
          target.kind,
          wasLastCableAtPullStart,
        )) return;
        this.setSkillInputLocked(true);
      }
      arrow.state = 'moving';
      if (this.activeHint?.id === picked.id && this.activeHint.end === picked.end) {
        this.clearActiveHint();
      }
      model.setAvailableEnds([]);
      this.animations.push({
        arrow,
        model,
        kind: 'exit',
        target,
        queueAfterExit,
        elapsed: 0,
        wallClockStartedAtSeconds: this.currentMode === 'rush'
          ? performance.now() * 0.001
          : null,
        duration: this.currentMode === 'rush'
          ? Math.min(0.9, 0.48 + model.pathLength * 0.04)
          : Math.min(1.5, 0.66 + model.pathLength * 0.065),
        direction,
        end: picked.end,
      });
      this.hud.flash(t('flash.moving'));
    } else {
      arrow.state = 'bumping';
      this.animations.push({
        arrow,
        model,
        kind: 'bump',
        target: null,
        queueAfterExit: false,
        elapsed: 0,
        wallClockStartedAtSeconds: this.currentMode === 'rush'
          ? performance.now() * 0.001
          : null,
        duration: 0.38,
        direction,
        end: picked.end,
      });
      if (result.contact) this.petals.burst(result.contact, direction.clone().negate());
      this.hud.showBlocked();
      this.audio.playInteraction('blocked');
      if (this.currentMode === 'random') this.loseRandomLife();
      if (this.currentMode === 'skill') {
        const impactPosition = result.contact
          ?? model.getHeadWorldPosition(new THREE.Vector3(), picked.end);
        this.handleSkillBlockedAttempt(Boolean(fakePlug), impactPosition);
      }
      if (this.currentMode === 'rush') this.rushRound?.recordMistake();
    }
  }

  private loseRandomLife(): void {
    if (this.randomGameOver || this.currentMode !== 'random') return;
    this.randomLives = Math.max(0, this.randomLives - 1);
    this.hud.setRandomLives(true, this.randomLives);
    this.hud.showLifeLost(this.randomLives);
    if (this.randomLives > 0) return;
    this.randomGameOver = true;
    this.setHovered(null);
    this.hud.showGameOver();
    this.audio.playInteraction('failed');
  }

  private setSkillInputLocked(locked: boolean, selectionMode = false): void {
    this.skillInputLocked = locked;
    this.skillUi.setInputLocked(locked);
    this.orbit.setEnabled(!locked || selectionMode);
    this.orbit.setClickOnly(false);
    this.appliances.setInteractionEnabled(!locked);
    if (locked) this.setHovered(null);
  }

  private handleSkillBlockedAttempt(fakePlug: boolean, impactPosition: THREE.Vector3): void {
    const wasSoundWaveProtected = this.skillEngine?.state.buff?.id === 'soothing-record';
    const result = this.skillEngine?.handleBlockedAttempt(fakePlug);
    if (!result || !this.skillEngine) return;
    this.randomLives = result.lives;
    this.hud.setRandomLives(true, result.lives, this.skillEngine.state.maxLives);
    this.skillUi.render(this.skillEngine.state);
    this.syncSkillPresentation();
    if (result.protected) {
      if (wasSoundWaveProtected) this.soundWaveShield.playImpact(impactPosition);
      this.hud.flash('防护状态抵挡了这次错误');
      return;
    }
    if (result.revived) {
      this.hud.flash('CONTINUE：已恢复生命');
      return;
    }
    this.hud.showLifeLost(result.lives);
    if (!result.failed) return;
    this.randomGameOver = true;
    this.hud.showGameOver();
    this.audio.playInteraction('failed');
  }

  private showSkillDamageFeedback(event: SkillDamageEvent): void {
    this.randomLives = event.lives;
    this.hud.setRandomLives(true, event.lives, this.skillEngine?.state.maxLives ?? 3);
    if (event.revived) {
      this.hud.flash('微波炉超时：CONTINUE 已恢复生命', true);
      return;
    }
    this.hud.showLifeLost(event.lives);
    this.skillUi.setCuePhase('commit', '超时：生命 -1');
  }

  private createSkillContext(): SkillContext {
    // A line already committed to an automatic exit remains in the logical
    // array until its flight finishes, but must not be selected by another
    // skill during that window.
    const remaining = this.arrows.filter((arrow) => arrow.state !== 'removed' && arrow.state !== 'moving');
    const physicallyAvailable = new Set(
      availableCableEnds(remaining).map(({ id }) => id),
    );
    const frozen = new Set(this.skillEngine?.getFrozenCableIds() ?? []);
    const fake = new Set(this.skillEngine?.getFakePlugCableIds() ?? []);
    const definitions = remaining.map((arrow) => arrow.definition);
    return {
      remainingCables: remaining.map((arrow) => ({
        id: arrow.definition.id,
        color: arrow.definition.color,
        available: physicallyAvailable.has(arrow.definition.id) && !frozen.has(arrow.definition.id),
        fakePlug: fake.has(arrow.definition.id),
      })),
      availableCableIds: [...physicallyAvailable].filter((id) => !frozen.has(id)),
      removalSequence: findRemovalSequence(definitions) ?? [],
      routeColors: [...new Set(this.appliances.targets.map((target) => target.accent))],
      state: this.skillEngine!.state,
    };
  }

  private resolveSkillConnection(_target: ApplianceTarget, arrow: ArrowRuntime): void {
    const engine = this.skillEngine;
    if (!engine) return;
    const desktopComputerHadBuff = _target.kind === 'desktop-computer' && engine.state.buff !== null;
    const remaining = this.arrows.length - this.removedCount;
    const outcome = engine.resolveConnected(this.createSkillContext(), remaining === 0);
    engine.consumeDryShieldBlock();
    this.pendingDryShieldAbsorb = outcome.blockedByDryShield;
    const resolution = outcome.resolution;
    let presentationDuration: number | undefined;

    if (outcome.coffeeBlocked && engine.state.debuff?.id === 'coffee-lock'
      && engine.state.debuff.turnsRemaining === 0) {
      this.coffeeLockExitTarget = _target;
    }

    if (outcome.damage) this.showSkillDamageFeedback(outcome.damage);

    if (resolution) {
      if (resolution.appliance === 'radio') {
        this.radioRouteCableIds = [...resolution.targetCableIds];
      }
      presentationDuration = this.playSkillPresentation(resolution, _target);
      if (resolution.appliance === 'refrigerator') {
        this.refrigeratorFreeze.activate(resolution.targetCableIds);
      }
      this.skillTransientScreenEffect = resolution.appliance === 'television'
        ? 'television-glitch'
        : resolution.appliance === 'toaster'
          ? 'toaster-heat'
        : resolution.appliance === 'kettle'
          ? 'kettle-thaw-heat'
        : resolution.appliance === 'printer'
          ? 'printer-scan'
        : resolution.appliance === 'desktop-computer'
          ? 'blue-screen'
          : 'none';
      if (resolution.appliance === 'printer') {
        this.pipeline.setSkillEffect('printer-scan');
        this.publishDiagnostics();
      }
      if (resolution.appliance === 'desktop-computer') {
        this.beginDesktopComputerFeedback(desktopComputerHadBuff, engine.state.currentLives);
      }
      this.skillTransientHighlights.clear();
      if (!this.isDedicatedSkillPresentation(resolution) && resolution.appliance !== 'popcorn-machine') {
        resolution.targetCableIds.forEach((id) => this.skillTransientHighlights.add(id));
      }
      const definition = APPLIANCE_SKILL_REGISTRY.get(resolution.appliance);
      this.skillUi.showCue(resolution.label, 'cue', definition?.description ?? '', _target.label);
      this.beginFanSteamClear(resolution, _target);
      this.beginHumidifierSteamReveal(resolution, _target);
      this.beginCoffeeSplash(resolution);
      this.applySkillCommands(resolution.commands, resolution.appliance, _target);
      const commitCueDelay = resolution.appliance === 'blender'
        ? 4_680
        : resolution.appliance === 'desktop-computer'
          ? 3_720
        : resolution.appliance === 'hair-dryer'
          && resolution.commands.some((command) => command.type === 'recolor')
          ? 2_040
          : 220;
      this.queueSkillCommitCue('效果生效', commitCueDelay);
    } else if (outcome.blockedByDryShield) {
      this.skillUi.showCue('干燥护罩吸收', 'cue', '本次负面技能已被护罩抵挡。', _target.label);
      this.queueSkillCommitCue('已吸收');
    } else if (outcome.coffeeBlocked) {
      this.skillUi.showCue('技能被封锁', 'cue', '咖啡封技生效中，本次家电技能不会发动。', _target.label);
      this.queueSkillCommitCue('已阻止');
    } else {
      const definition = APPLIANCE_SKILL_REGISTRY.get(_target.kind);
      const isLastCable = remaining === 0;
      this.skillUi.showCue(
        isLastCable ? '最后一根线' : '技能未发动',
        'cue',
        isLastCable ? '挑战收尾连接不触发家电技能。' : `当前条件不满足：${definition?.description ?? '本次没有可结算效果。'}`,
        _target.label,
      );
      this.queueSkillCommitCue(isLastCable ? '挑战收尾' : '无效果');
    }

    if (resolution?.appliance !== 'desktop-computer') this.syncSkillState();

    if (engine.state.phase === 'select-card') {
      this.skillUi.showCards(engine.cards);
      this.setSkillInputLocked(true);
      return;
    }
    if (engine.state.phase === 'select-recycle-target') {
      this.beginSkillRecycleSelection();
      return;
    }
    this.finishSkillResolution(resolution?.topologyChanged ?? false, presentationDuration);
    void arrow;
  }

  private isDedicatedSkillPresentation(resolution: SkillResolution): boolean {
    return resolution.appliance === 'radio'
      || resolution.appliance === 'robot-vacuum'
      || resolution.appliance === 'rice-cooker'
      || resolution.appliance === 'blender'
      || resolution.appliance === 'stand-mixer'
      || resolution.appliance === 'toaster'
      || resolution.appliance === 'refrigerator'
      || resolution.appliance === 'kettle'
      || resolution.appliance === 'washer'
      || resolution.appliance === 'portable-speaker'
      || resolution.appliance === 'hair-dryer';
  }

  private beginFanSteamClear(resolution: SkillResolution, sourceTarget?: ApplianceTarget): void {
    const clearsSteam = resolution.appliance === 'fan' && resolution.commands.some((command) =>
      command.type === 'clear-status' && command.slot === 'debuff' && command.reason === 'fan');
    if (!clearsSteam) return;
    const fan = sourceTarget?.kind === 'fan'
      ? sourceTarget
      : this.appliances.targets.find((target) => target.kind === 'fan' && target.root.visible);
    this.pipeline.beginSteamClear(fan?.screenPosition.x ?? 0.1);
  }

  private beginHumidifierSteamReveal(resolution: SkillResolution, sourceTarget?: ApplianceTarget): void {
    const createsSteam = resolution.appliance === 'humidifier' && resolution.commands.some((command) =>
      command.type === 'set-status'
      && command.slot === 'debuff'
      && command.status.id === 'bathroom-steam');
    if (!createsSteam) return;
    const humidifier = sourceTarget?.kind === 'humidifier'
      ? sourceTarget
      : this.appliances.targets.find((target) => target.kind === 'humidifier' && target.root.visible);
    this.pipeline.beginSteamReveal(humidifier?.screenPosition.x ?? 0.1, POWERED_ACTIVE_DURATION);
  }

  private beginCoffeeSplash(resolution: SkillResolution): void {
    const createsCoffeeLock = resolution.appliance === 'coffee-maker' && resolution.commands.some((command) =>
      command.type === 'set-status'
      && command.slot === 'debuff'
      && command.status.id === 'coffee-lock');
    if (!createsCoffeeLock) return;
    this.coffeeStainElapsed = 0;
    this.coffeeStainStrength = 0;
    this.prepareCoffeeStainProfiles();
    this.pipeline.beginCoffeeSplash();
  }

  private prepareCoffeeStainProfiles(): void {
    this.coffeeStainProfiles.clear();
    const points = this.arrows.flatMap(({ definition }) => definition.path);
    if (points.length === 0) return;
    const minX = Math.min(...points.map(([x]) => x));
    const maxY = Math.max(...points.map(([, y]) => y));
    const minZ = Math.min(...points.map(([, , z]) => z));
    const maxX = Math.max(...points.map(([x]) => x));
    const minY = Math.min(...points.map(([, y]) => y));
    const maxZ = Math.max(...points.map(([, , z]) => z));
    const diagonal = Math.max(1, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ));
    const distanceFromInkCorner = ([x, y, z]: readonly [number, number, number]): number => Math.hypot(
      x - minX,
      maxY - y,
      z - minZ,
    ) / diagonal;
    for (const { definition } of this.arrows) {
      const tailDistance = distanceFromInkCorner(definition.path[0]);
      const headDistance = distanceFromInkCorner(definition.path[definition.path.length - 1]);
      const nearestDistance = Math.min(...definition.path.map(distanceFromInkCorner));
      const seed = [...definition.id].reduce((value, character) => (
        Math.imul(value ^ character.charCodeAt(0), 16777619) >>> 0
      ), 2166136261) / 4294967295;
      this.coffeeStainProfiles.set(definition.id, {
        delay: THREE.MathUtils.clamp(nearestDistance * 0.38 + (seed - 0.5) * 0.045, 0, 0.44),
        direction: headDistance <= tailDistance ? 1 : 0,
      });
    }
  }

  private updateCoffeeStain(delta: number, elapsed: number): void {
    const coffeeLock = this.skillEngine?.state.debuff?.id === 'coffee-lock'
      ? this.skillEngine.state.debuff
      : null;
    if (!coffeeLock) return;
    if (this.coffeeStainProfiles.size === 0) this.prepareCoffeeStainProfiles();
    this.coffeeStainElapsed += delta;
    const evidenceProgress = window.__COFFEE_STAIN_PROGRESS_OVERRIDE__;
    const progress = Number.isFinite(evidenceProgress)
      ? THREE.MathUtils.clamp(evidenceProgress!, 0, 1)
      : THREE.MathUtils.clamp(this.coffeeStainElapsed / this.coffeeStainDuration, 0, 1);
    const targetStrength = (coffeeLock.turnsRemaining ?? 0) / 4;
    const blend = 1 - Math.exp(-delta * 2.8);
    this.coffeeStainStrength = THREE.MathUtils.lerp(this.coffeeStainStrength, targetStrength, blend);
    for (const [id, model] of this.models) {
      const profile = this.coffeeStainProfiles.get(id) ?? { delay: 0, direction: 0 };
      const localProgress = THREE.MathUtils.clamp(
        (progress - profile.delay) / Math.max(0.001, 1 - profile.delay),
        0,
        1,
      );
      const reveal = localProgress * localProgress * (3 - 2 * localProgress);
      model.setCoffeeStain(this.coffeeStainStrength, reveal, elapsed, profile.direction);
    }
  }

  private playSkillPresentation(
    resolution: SkillResolution,
    sourceTarget?: ApplianceTarget,
  ): number | undefined {
    if (resolution.appliance === 'portable-speaker') {
      return this.portableSpeakerSpacing.start(this.getPortableSpeakerSpacingTargets());
    }
    if (resolution.appliance === 'kettle') {
      const frozenCableIds = this.skillEngine?.state.debuff?.id === 'frozen-plug'
        ? [...this.skillEngine.state.debuff.targetCableIds]
        : [...this.refrigeratorFreeze.diagnostics.targetCableIds];
      const kettle = sourceTarget?.kind === 'kettle'
        ? sourceTarget
        : this.appliances.targets.find((target) => target.kind === 'kettle' && target.state === 'active');
      const getTimelineElapsed = kettle ? () => kettle.getActiveElapsed() : undefined;
      this.refrigeratorFreeze.beginThaw(KETTLE_THAW_DURATION, getTimelineElapsed);
      return this.kettleThaw.start({
        targetCableIds: frozenCableIds,
        getTimelineElapsed,
      });
    }
    if (
      resolution.appliance === 'hair-dryer'
      && resolution.commands.some((command) => command.type === 'clear-status'
        && command.slot === 'debuff'
        && command.reason === 'hair-dryer')
    ) {
      this.refrigeratorFreeze.beginThaw(2.4);
    }
    const targetIds = resolution.appliance === 'rice-cooker' || resolution.appliance === 'stand-mixer'
      ? this.arrows.filter((candidate) => candidate.state !== 'removed').map((candidate) => candidate.definition.id)
      : resolution.appliance === 'blender'
        ? resolution.commands.flatMap((command) => command.type === 'recolor'
          ? command.changes.map(({ cableId }) => cableId)
          : [])
        : resolution.targetCableIds;
    const targets = targetIds
      .map((id): SkillPresentationTarget | null => {
        const model = this.models.get(id);
        const arrow = this.arrows.find((candidate) => candidate.definition.id === id);
        if (!model) return null;
        return {
          cableId: id,
          position: model.getHeadWorldPosition(new THREE.Vector3()),
          path: resolution.appliance === 'rice-cooker' || resolution.appliance === 'stand-mixer'
            ? arrow?.samplePoints.map((point) => point.clone())
            : undefined,
        };
      })
      .filter((target): target is SkillPresentationTarget => Boolean(target));
    if (this.isDedicatedSkillPresentation(resolution)) {
      if (resolution.appliance === 'refrigerator') {
        return POWERED_ACTIVE_DURATION * 1_000;
      }
      if (resolution.appliance === 'robot-vacuum') {
        this.skillAutoRemovalEnds.clear();
        const snapshotEnds = availableCableEnds(this.arrows);
        resolution.targetCableIds.forEach((id) => {
          const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
          if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
        });
      }
      if (resolution.appliance === 'washer') {
        this.pendingWasherFlingRemovals = [];
        this.washerFlingHistory = [];
        const snapshotEnds = availableCableEnds(this.arrows);
        resolution.targetCableIds.forEach((id) => {
          const snapshot = snapshotEnds.find((candidate) => candidate.id === id);
          if (snapshot) this.skillAutoRemovalEnds.set(id, snapshot.end);
        });
        return this.washerSpin.start({
          cableRoot: this.arrowRoot,
          camera: this.camera,
          arrows: this.arrows,
          models: this.models,
          targetIds: resolution.targetCableIds,
          onLaunch: (cableId, launch) => this.animateSkillAutoRemoval(cableId, true, launch),
        });
      }
      return this.skillPresentation.play(resolution, targets);
    }
    this.skillEffects.play(resolution.appliance, targets.map((target) => target.position));
    return resolution.appliance === 'television'
      || resolution.appliance === 'toaster'
      || resolution.appliance === 'refrigerator'
      || resolution.appliance === 'desktop-computer'
      ? POWERED_ACTIVE_DURATION * 1_000
      : resolution.appliance === 'printer'
        ? 1_400
      : undefined;
  }

  private applySkillCommands(
    commands: readonly SkillCommand[],
    source?: SkillResolution['appliance'],
    sourceTarget?: ApplianceTarget,
  ): void {
    for (const command of commands) {
      switch (command.type) {
        case 'auto-remove':
          if (
            source !== 'robot-vacuum'
            && command.source !== 'robot-vacuum'
            && source !== 'washer'
            && command.source !== 'washer'
          ) {
            command.cableIds.forEach((id) => this.commitSkillAutoRemoval(id));
          }
          break;
        case 'recolor':
          if (source !== 'blender' && source !== 'hair-dryer') this.applySkillRecolors(command.changes);
          break;
        case 'reconstruct':
          if (source === 'television') this.beginTelevisionReconstruction(command.cableIds, sourceTarget);
          else this.applySkillTopologyMutation(command.cableIds, 'reconstruct');
          break;
        case 'swap-ends':
          if (source === 'toaster') this.beginToasterEndSwap(command.cableIds, sourceTarget);
          else this.applySkillTopologyMutation(command.cableIds, 'swap-ends');
          break;
        case 'expand':
          this.applySkillTopologyMutation(command.cableIds, 'expand');
          break;
        case 'fake-plugs':
          if (this.skillEngine?.state.debuff?.id === 'fake-double-plug') {
            command.cableIds.forEach((id) => this.models.get(id)?.setFakeTailPlug(true));
          }
          break;
        case 'freeze':
          // Frozen identities are enforced from the committed DEBUFF state in
          // refreshAvailability. The command remains explicit for cue targets.
          break;
        default:
          break;
      }
    }
    if (source === 'game-controller' && commands.some((command) => command.type === 'grant-continue')) {
      const continueBuff = this.skillEngine?.state.buff;
      if (continueBuff?.id === 'continue') {
        this.hud.showContinueGranted(Number(continueBuff.payload.restoreLives ?? 1));
      }
    }
    this.appliances.setRequiredColors(
      this.arrows.filter((arrow) => arrow.state !== 'removed').map((arrow) => arrow.definition.color),
    );
    this.refreshAvailability(false);
  }

  private applySkillRecolors(changes: readonly { cableId: string; color: number }[]): void {
    const replacements = new Map<string, ArrowDefinition>();
    changes.forEach(({ cableId, color }) => {
      const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === 'idle');
      if (arrow) replacements.set(cableId, { ...arrow.definition, color });
    });
    this.commitSkillDefinitions(replacements, false);
  }

  private applySkillTopologyMutation(
    cableIds: readonly string[],
    kind: 'reconstruct' | 'swap-ends' | 'expand',
  ): void {
    const replacements = this.buildSkillTopologyReplacements(cableIds, kind);
    this.commitSkillDefinitions(replacements, true);
  }

  private buildSkillTopologyReplacements(
    cableIds: readonly string[],
    kind: 'reconstruct' | 'swap-ends' | 'expand',
  ): Map<string, ArrowDefinition> {
    const remaining = this.arrows.filter((arrow) => arrow.state !== 'removed');
    if (kind === 'reconstruct') {
      return buildTelevisionSpatialReplacements(
        remaining.map((arrow) => arrow.definition),
        cableIds,
      );
    }
    const replacements = new Map<string, ArrowDefinition>();
    for (const id of cableIds) {
      const arrow = remaining.find((candidate) => candidate.definition.id === id && candidate.state === 'idle');
      if (!arrow) continue;
      const definition = arrow.definition;
      if (kind === 'swap-ends') {
        const candidate = reverseCableKeepingExternalEndpoints(definition);
        const trial = remaining.map((entry) => (
          entry === arrow ? candidate : replacements.get(entry.definition.id) ?? entry.definition
        ));
        if (skillTopologyDefinitionsAreCommitSafe(trial)) replacements.set(id, candidate);
        continue;
      }
      const directions = Object.keys(DIRECTION_VECTORS) as DirectionKey[];
      const currentIndex = directions.indexOf(definition.exitDirection);
      for (let offset = 1; offset <= directions.length; offset += 1) {
        const exitDirection = directions[(currentIndex + offset) % directions.length];
        const candidate = { ...definition, exitDirection };
        const trial = remaining.map((entry) => (
          entry === arrow ? candidate : replacements.get(entry.definition.id) ?? entry.definition
        ));
        const trialRuntimes = trial.map(makeRuntime);
        const targetRuntime = trialRuntimes.find((runtime) => runtime.definition.id === id);
        if (
          targetRuntime
          && skillTopologyDefinitionsAreCommitSafe(trial)
          && checkCableEndExit(targetRuntime, trialRuntimes, 'head').clear
        ) {
          replacements.set(id, candidate);
          break;
        }
      }
    }
    return replacements;
  }

  private beginTelevisionReconstruction(
    cableIds: readonly string[],
    sourceTarget?: ApplianceTarget,
  ): void {
    const replacements = this.buildSkillTopologyReplacements(cableIds, 'reconstruct');
    if (replacements.size === 0) return;
    const television = sourceTarget?.kind === 'television'
      ? sourceTarget
      : this.appliances.targets.find((target) => target.kind === 'television' && target.state === 'active');
    this.televisionReconstruction.start({
      replacements,
      existingModels: this.models,
      getPlugStyle: (color) => this.appliances.getPlugStyleForColor(color),
      getTimelineElapsed: television ? () => television.getActiveElapsed() : undefined,
      commit: () => {
        const committed = this.commitSkillDefinitions(replacements, true);
        this.refreshAvailability(false);
        return committed;
      },
    });
    void this.renderer.compileAsync(
      this.televisionReconstruction.root,
      this.camera,
      this.scene,
    );
  }

  private beginToasterEndSwap(
    cableIds: readonly string[],
    sourceTarget?: ApplianceTarget,
  ): void {
    const replacements = this.buildSkillTopologyReplacements(cableIds, 'swap-ends');
    if (replacements.size === 0) return;
    const toaster = sourceTarget?.kind === 'toaster'
      ? sourceTarget
      : this.appliances.targets.find((target) => target.kind === 'toaster' && target.state === 'active');
    this.toasterHeatSwap.start({
      replacements,
      existingModels: this.models,
      getPlugStyle: (color) => this.appliances.getPlugStyleForColor(color),
      getTimelineElapsed: toaster ? () => toaster.getActiveElapsed() : undefined,
      commit: () => {
        const committed = this.commitSkillDefinitions(replacements, true);
        this.refreshAvailability(false);
        return committed;
      },
    });
    void this.renderer.compileAsync(this.toasterHeatSwap.root, this.camera, this.scene);
  }

  private commitSkillDefinitions(
    replacements: ReadonlyMap<string, ArrowDefinition>,
    requireSolvable: boolean,
  ): boolean {
    if (replacements.size === 0) return false;
    const remainingDefinitions = this.arrows
      .filter((arrow) => arrow.state !== 'removed')
      .map((arrow) => replacements.get(arrow.definition.id) ?? arrow.definition);
    if (requireSolvable && !skillTopologyDefinitionsAreCommitSafe(remainingDefinitions)) return false;

    for (let index = 0; index < this.arrows.length; index += 1) {
      const arrow = this.arrows[index];
      const next = replacements.get(arrow.definition.id);
      if (!next || arrow.state === 'removed') continue;
      const replacement = makeRuntime(next);
      replacement.state = arrow.state;
      this.arrows[index] = replacement;
      const previousModel = this.models.get(next.id);
      previousModel?.dispose();
      const model = new PlugCableModel(next, this.appliances.getPlugStyleForColor(next.color));
      model.setVisualThickness(this.skillEngine?.state.debuff?.id === 'rice-thick-cable' ? 1.5 : 1);
      this.models.set(next.id, model);
      this.arrowRoot.add(model.root);
    }
    return true;
  }

  private commitSkillAutoRemoval(cableId: string): boolean {
    const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === 'idle');
    const model = this.models.get(cableId);
    if (!arrow || !model) return false;
    const origin = arrow.samplePoints[arrow.samplePoints.length - 1] ?? new THREE.Vector3();
    this.petals.burst(origin, new THREE.Vector3(0, 0.8, 0.2), 20);
    model.root.visible = false;
    this.completeRemoval(arrow);
    this.skillEngine?.notifyAutoRemoved(cableId, this.arrows.length - this.removedCount > 0);
    return true;
  }

  private animateSkillAutoRemoval(
    cableId: string,
    washerFling = false,
    washerLaunch?: Readonly<{ directionWorld: THREE.Vector3; bundleCenterWorld: THREE.Vector3 }>,
    followNormalPull = false,
  ): boolean {
    const arrow = this.arrows.find((candidate) => candidate.definition.id === cableId && candidate.state === 'idle');
    const model = this.models.get(cableId);
    if (!arrow || !model) return false;
    const end = this.skillAutoRemovalEnds.get(cableId) ?? 'head';
    arrow.state = 'moving';
    model.setAvailableEnds([]);

    let originPosition: THREE.Vector3 | undefined;
    let originQuaternion: THREE.Quaternion | undefined;
    let originScale: THREE.Vector3 | undefined;
    if (washerFling) {
      model.root.updateWorldMatrix(true, false);
      originPosition = model.root.getWorldPosition(new THREE.Vector3());
      originQuaternion = model.root.getWorldQuaternion(new THREE.Quaternion());
      originScale = model.root.getWorldScale(new THREE.Vector3());
      this.scene.attach(model.root);
      model.root.position.copy(originPosition);
      model.root.quaternion.copy(originQuaternion);
      model.root.scale.copy(originScale);
    }

    this.animations.push({
      arrow,
      model,
      kind: washerFling ? 'skill-fling' : 'exit',
      target: null,
      queueAfterExit: false,
      elapsed: 0,
      wallClockStartedAtSeconds: null,
      duration: washerFling
        ? 2.35
        : followNormalPull
          ? Math.min(1.5, 0.66 + model.pathLength * 0.065)
          : Math.min(0.62, 0.4 + model.pathLength * 0.025),
      direction: washerFling
        ? washerLaunch?.directionWorld.clone().normalize() ?? new THREE.Vector3(1, 0, 0)
        : DIRECTION_VECTORS[cableEndDirection(arrow.definition, end)].clone(),
      end,
      autoCommitted: true,
      originPosition,
      originQuaternion,
      originScale,
      bundleCenterWorld: washerFling ? washerLaunch?.bundleCenterWorld.clone() : undefined,
      flightAngularVelocity: washerFling
        ? this.getWasherFlightAngularVelocity(cableId)
        : undefined,
    });
    return true;
  }

  private triggerPrinterCopyAutoRemoval(): void {
    const context = this.createSkillContext();
    const cableId = pickPrinterCopyCableId(context);
    if (!cableId) return;
    const availableEnd = availableCableEnds(this.arrows).find((candidate) => candidate.id === cableId);
    if (availableEnd) this.skillAutoRemovalEnds.set(cableId, availableEnd.end);
    if (!this.animateSkillAutoRemoval(cableId, false, undefined, true)) return;
    this.skillTransientScreenEffect = 'printer-scan';
    this.pipeline.setSkillEffect('printer-scan');
    this.skillUi.showCue(
      '复印抽线',
      'commit',
      '正确线离开线组时，复印线立即跟随抽出；它不会连接家电。',
      '打印机',
    );
    this.publishDiagnostics();
  }

  private getWasherFlightAngularVelocity(cableId: string): THREE.Vector3 {
    let hash = 0;
    for (let index = 0; index < cableId.length; index += 1) {
      hash = (hash * 31 + cableId.charCodeAt(index)) >>> 0;
    }
    const sign = (hash & 1) === 0 ? 1 : -1;
    return new THREE.Vector3(
      sign * (3.4 + ((hash >>> 3) % 17) / 10),
      -sign * (4.1 + ((hash >>> 8) % 19) / 10),
      sign * (2.8 + ((hash >>> 13) % 23) / 10),
    );
  }

  private handleSkillCardSelected(index: number): void {
    if (this.currentMode !== 'skill' || !this.skillEngine) return;
    const desktopComputerHadBuff = this.skillEngine.state.buff !== null;
    const resolution = this.skillEngine.selectCard(index, this.createSkillContext());
    const blockedByDryShield = this.skillEngine.consumeDryShieldBlock();
    this.skillUi.hideCards();
    if (!resolution) {
      this.pendingDryShieldAbsorb = blockedByDryShield;
      if (blockedByDryShield) {
        this.skillUi.showCue('干燥护罩吸收', 'cue', '选中的负面技能已被护罩抵挡。', '扭蛋技能选定');
        this.queueSkillCommitCue('已吸收');
      }
      this.finishSkillResolution(false);
      return;
    }
    this.skillTransientHighlights.clear();
    const presentationDuration = this.playSkillPresentation(resolution);
    if (resolution.appliance === 'refrigerator') {
      this.refrigeratorFreeze.activate(resolution.targetCableIds);
    }
    if (resolution.appliance === 'radio') {
      this.radioRouteCableIds = [...resolution.targetCableIds];
    }
    this.skillTransientScreenEffect = resolution.appliance === 'television'
      ? 'television-glitch'
      : resolution.appliance === 'toaster'
        ? 'toaster-heat'
      : resolution.appliance === 'kettle'
        ? 'kettle-thaw-heat'
      : resolution.appliance === 'printer'
        ? 'printer-scan'
      : resolution.appliance === 'desktop-computer'
        ? 'blue-screen'
        : 'none';
    if (resolution.appliance === 'desktop-computer') {
      this.beginDesktopComputerFeedback(desktopComputerHadBuff, this.skillEngine.state.currentLives);
    }
    if (!this.isDedicatedSkillPresentation(resolution) && resolution.appliance !== 'popcorn-machine') {
      resolution.targetCableIds.forEach((id) => this.skillTransientHighlights.add(id));
    }
    const definition = APPLIANCE_SKILL_REGISTRY.get(resolution.appliance);
    this.skillUi.showCue(resolution.label, 'cue', definition?.description ?? '', '扭蛋技能选定');
    this.queueSkillCommitCue(
      '效果生效',
      resolution.appliance === 'blender'
        ? 4_680
        : resolution.appliance === 'desktop-computer'
          ? 3_720
          : 220,
    );
    this.beginFanSteamClear(resolution);
    this.beginHumidifierSteamReveal(resolution);
    this.beginCoffeeSplash(resolution);
    this.applySkillCommands(resolution.commands, resolution.appliance);
    if (resolution.appliance !== 'desktop-computer') this.syncSkillState();
    if (this.skillEngine.state.phase === 'select-recycle-target') {
      this.beginSkillRecycleSelection();
      return;
    }
    this.finishSkillResolution(resolution.topologyChanged, presentationDuration);
  }

  private beginSkillRecycleSelection(): void {
    window.clearTimeout(this.skillRecycleSelectionTimer);
    for (const model of this.models.values()) model.setRecycleSelectionState('none');
    this.skillUi.hideCards();
    this.skillUi.setRecycleSelection(true);
    this.setSkillInputLocked(true, true);
    this.refreshAvailability(false);
  }

  private commitSkillRecycleSelection(arrow: ArrowRuntime): void {
    if (!this.skillEngine || this.skillEngine.state.phase !== 'select-recycle-target') return;
    const model = this.models.get(arrow.definition.id);
    this.setHovered(null);
    model?.setRecycleSelectionState('selected');
    this.skillEngine.commitRecycleSelection(arrow.definition.id);
    this.skillUi.setRecycleSelection(false);
    this.setSkillInputLocked(true);
    this.publishDiagnostics();
    window.clearTimeout(this.skillRecycleSelectionTimer);
    this.skillRecycleSelectionTimer = window.setTimeout(() => {
      this.skillRecycleSelectionTimer = 0;
      model?.setRecycleSelectionState('none');
      this.commitSkillAutoRemoval(arrow.definition.id);
      this.finishSkillResolution(true);
    }, SKILL_RECYCLE_SELECTION_COMMIT_DELAY_MS);
  }

  private finishSkillResolution(topologyChanged: boolean, presentationDuration?: number): void {
    if (!this.skillEngine) return;
    this.syncSkillState();
    if (this.skillEngine.state.phase === 'failed') {
      this.randomGameOver = true;
      this.hud.showGameOver();
      this.audio.playInteraction('failed');
      this.setSkillInputLocked(true);
      return;
    }
    window.clearTimeout(this.skillSettleTimer);
    window.clearTimeout(this.skillSettleCueTimer);
    const totalDuration = Math.max(topologyChanged ? 900 : 650, presentationDuration ?? 0);
    const settleDelay = Math.max(280, totalDuration - 320);
    this.skillSettleCueTimer = window.setTimeout(() => {
      const remaining = this.arrows.length - this.removedCount;
      this.skillUi.setCuePhase('settle', remaining === 0 ? '挑战完成' : '结算完成');
    }, settleDelay);
    const settleWhenReady = (): void => {
      if (!this.skillEngine) return;
      const presentation = this.skillPresentation.diagnostics;
      const sequencePending = presentation.skillId === 'snapshot-sweep'
        && presentation.autoRemovalOrder.length < presentation.targetCount;
      const exitsPending = presentation.skillId === 'snapshot-sweep'
        && this.animations.some((animation) => animation.autoCommitted);
      const washerPending = this.washerSpin.diagnostics.active
        || this.animations.some((animation) => animation.autoCommitted);
      const kettlePending = this.kettleThaw.diagnostics.active;
      const toasterPending = this.toasterHeatSwap.diagnostics.active;
      const coffeePending = this.skillEngine.state.debuff?.id === 'coffee-lock'
        && this.skillEngine.state.debuff.turnsRemaining === 0
        && (this.coffeeLockExitTarget?.activeTimeRemaining ?? 0) > 0;
      if (sequencePending || exitsPending || washerPending || kettlePending || toasterPending || coffeePending) {
        this.skillSettleTimer = window.setTimeout(settleWhenReady, 100);
        return;
      }
      this.commitPendingWasherFlingRemovals();
      const remaining = this.arrows.length - this.removedCount;
      this.skillTransientHighlights.clear();
      this.kettleThaw.reset();
      this.skillTransientScreenEffect = 'none';
      this.desktopComputerFeedback = null;
      this.skillPresentation.complete();
      this.skillEngine.clearExhaustedCoffeeLock();
      this.coffeeLockExitTarget = null;
      this.skillEngine.settle();
      this.skillEngine.reselectInvalidHints(this.createSkillContext());
      this.syncSkillState();
      this.setSkillInputLocked(false);
      this.syncRequiredColors();
      this.applianceRoutingRevision = this.appliances.routingRevision;
      this.refreshAvailability(false);
      if (remaining === 0 && this.connections.activeCount === 0) {
        this.hud.showComplete();
        this.audio.playInteraction('complete');
      }
    };
    this.skillSettleTimer = window.setTimeout(settleWhenReady, totalDuration);
  }

  private queueSkillCommitCue(label = '效果生效', delay = 220): void {
    window.clearTimeout(this.skillCommitTimer);
    this.skillCommitTimer = window.setTimeout(() => this.skillUi.setCuePhase('commit', label), delay);
  }

  private syncSkillState(): void {
    if (!this.skillEngine) return;
    this.randomLives = this.skillEngine.state.currentLives;
    this.hud.setRandomLives(
      true,
      this.randomLives,
      this.skillEngine.state.maxLives,
    );
    this.skillUi.render(this.skillEngine.state);
    this.syncSkillPresentation();
  }

  private getPortableSpeakerSpacingTargets(): PortableSpeakerSpacingTarget[] {
    let targetIndex = 0;
    let cacheMatches = true;
    for (const arrow of this.arrows) {
      if (arrow.state !== 'idle' && arrow.state !== 'bumping') continue;
      const model = this.models.get(arrow.definition.id);
      if (!model?.root.visible) continue;
      const cached = this.portableSpeakerSpacingTargetsCache[targetIndex];
      if (!cached
        || cached.id !== arrow.definition.id
        || cached.center !== model.getBundleBaseCenterRef()
        || cached.clearanceSegments !== model.getBundleClearanceSegments()) {
        cacheMatches = false;
        break;
      }
      targetIndex += 1;
    }
    if (cacheMatches && targetIndex === this.portableSpeakerSpacingTargetsCache.length) {
      return this.portableSpeakerSpacingTargetsCache;
    }

    const targets: PortableSpeakerSpacingTarget[] = [];
    for (const arrow of this.arrows) {
      if (arrow.state !== 'idle' && arrow.state !== 'bumping') continue;
      const model = this.models.get(arrow.definition.id);
      if (!model?.root.visible) continue;
      targets.push({
        id: arrow.definition.id,
        center: model.getBundleBaseCenterRef(),
        clearanceSegments: model.getBundleClearanceSegments(),
        setOffset: (offset) => model.setBundleSpacingOffset(offset),
      });
    }
    this.portableSpeakerSpacingTargetsCache = targets;
    return targets;
  }

  private syncSkillPresentation(): void {
    if (!this.skillEngine) return;
    const state = this.skillEngine.state;
    const nextBuffId = state.buff?.id ?? null;
    const buffChanged = nextBuffId !== this.lastSkillBuffId;
    if (buffChanged) {
      const replacingBuff = this.lastSkillBuffId !== null && nextBuffId !== null;
      this.lastSkillBuffId = nextBuffId;
      if (replacingBuff) {
        this.clearSkillBuffVisuals();
        this.skillBuffVisualReleaseAt = performance.now() + SKILL_BUFF_SWAP_VISUAL_DURATION_MS;
        window.clearTimeout(this.skillBuffSwapTimer);
        this.skillBuffSwapTimer = window.setTimeout(() => {
          this.skillBuffSwapTimer = 0;
          this.skillBuffVisualReleaseAt = 0;
          this.syncSkillPresentation();
        }, SKILL_BUFF_SWAP_VISUAL_DURATION_MS);
      }
    }
    const buffVisualsBlocked = performance.now() < this.skillBuffVisualReleaseAt;
    this.hud.setContinueReady(
      state.buff?.id === 'continue',
      state.buff?.id === 'continue' ? Number(state.buff.payload.restoreLives ?? 1) : 1,
    );
    const frozenCableIds = state.debuff?.id === 'frozen-plug' ? state.debuff.targetCableIds : [];
    this.refrigeratorFreeze.syncStatus(frozenCableIds);
    const fakeIds = new Set(this.skillEngine.getFakePlugCableIds());
    const glowHighlighted = new Set<string>([
      ...this.skillTransientHighlights,
      ...(state.lampHintCableId ? [state.lampHintCableId] : []),
      ...(state.debuff?.id === 'overheated-plug' ? state.debuff.targetCableIds : []),
    ]);
    const revealAll = state.buff?.id === 'induction-reveal';
    const inductionCableIds = new Set(
      revealAll ? this.availableChoices.map(({ arrow }) => arrow.definition.id) : [],
    );
    const screenEffect: SkillScreenEffect = this.skillTransientScreenEffect !== 'none'
      ? this.skillTransientScreenEffect
      : state.debuff?.id === 'bathroom-steam'
        ? 'bathroom-steam'
        : state.debuff?.id === 'coffee-lock'
          ? 'coffee-lock'
          : 'none';
    this.pipeline.setSkillEffect(screenEffect);
    if (screenEffect === 'coffee-lock') {
      const turns = state.debuff?.id === 'coffee-lock' ? state.debuff.turnsRemaining ?? 0 : 0;
      this.pipeline.setSkillEffectProgress(turns / 4);
    }
    const cablePositions = new Map<string, THREE.Vector3>();
    const cableOrientations = new Map<string, THREE.Quaternion>();
    for (const [id, model] of this.models) {
      cablePositions.set(id, model.getHeadWorldPosition());
      cableOrientations.set(id, model.getHeadWorldQuaternion());
    }
    const availablePositions = this.availableChoices
      .map(({ arrow, end }) => this.models.get(arrow.definition.id)?.getHeadWorldPosition(new THREE.Vector3(), end))
      .filter((position): position is THREE.Vector3 => Boolean(position));
    const hintPositions = new Map<string, THREE.Vector3>();
    const hintOrientations = new Map<string, THREE.Quaternion>();
    this.availableChoices.forEach(({ arrow, end }) => {
      const model = this.models.get(arrow.definition.id);
      if (!model) return;
      hintPositions.set(arrow.definition.id, model.getHeadWorldPosition(new THREE.Vector3(), end));
      hintOrientations.set(arrow.definition.id, model.getHeadWorldQuaternion(new THREE.Quaternion(), end));
    });
    this.skillEffects.root.visible = this.currentMode === 'skill' && !this.openingActive;
    this.skillPresentation.root.visible = (this.currentMode === 'skill' || this.skillEvidenceVisible) && !this.openingActive;
    this.skillEffects.syncPersistent(
      state,
      cablePositions,
      cableOrientations,
      availablePositions,
      hintPositions,
      hintOrientations,
    );
    const bubbleShieldTargets = this.arrows
      .filter((arrow) => arrow.state !== 'removed')
      .map((arrow) => this.models.get(arrow.definition.id)?.root)
      .filter((root): root is THREE.Group => Boolean(root?.visible));
    this.bubbleShield.sync(
      this.currentMode === 'skill'
        && !this.openingActive
        && !buffVisualsBlocked
        && state.buff?.id === 'iridescent-bubble',
      bubbleShieldTargets,
    );
    this.soundWaveShield.sync(
      this.currentMode === 'skill'
        && !this.openingActive
        && !buffVisualsBlocked
        && state.buff?.id === 'soothing-record',
      bubbleShieldTargets,
    );
    const dehumidifier = this.appliances.targets.find((target) => (
      target.kind === 'dehumidifier' && target.root.visible
    ));
    this.dehumidifierDryShield.sync(
      this.currentMode === 'skill'
        && !this.openingActive
        && !buffVisualsBlocked
        && state.buff?.id === 'dry-shield',
      state.buff?.id === 'dry-shield' ? state.buff.turnsRemaining : null,
      bubbleShieldTargets,
      dehumidifier?.root.getWorldPosition(new THREE.Vector3()),
      this.pendingDryShieldAbsorb,
    );
    this.pendingDryShieldAbsorb = false;
    this.portableSpeakerSpacing.sync(
      this.currentMode === 'skill'
        && !this.openingActive
        && !buffVisualsBlocked
        && state.buff?.id === 'bass-spacing',
      this.getPortableSpeakerSpacingTargets(),
    );
    this.petals.setCanopyFlow(this.dehumidifierDryShield.petalFlow);
    this.skillPresentation.syncRiceStatus(state.debuff?.id ?? null);
    const microwaveTurns = state.debuff?.id === 'overheated-plug'
      ? state.debuff.turnsRemaining ?? 2
      : 2;
    const overheatedCableIds = new Set(
      state.debuff?.id === 'overheated-plug' ? state.debuff.targetCableIds : [],
    );
    for (const [id, model] of this.models) {
      model.setFakeTailPlug(fakeIds.has(id));
      model.setOverheated(overheatedCableIds.has(id), microwaveTurns);
      model.setInductionReveal(!buffVisualsBlocked && inductionCableIds.has(id) && !overheatedCableIds.has(id));
      if (state.debuff?.id === 'coffee-lock') {
        model.setSkillTint(null);
      }
      else {
        model.clearCoffeeStain();
        if (state.debuff?.id === 'rice-thick-cable') model.setSkillTint(0xf6e3a1, 0.28);
        else model.setSkillTint(null);
      }

      const colorShufflePreview = this.skillColorShufflePreview.get(id);
      if (colorShufflePreview) {
        model.setSkillTint(
          colorShufflePreview.color,
          colorShufflePreview.strength,
          colorShufflePreview.emissionScale,
        );
      }

      model.setSkillGlow(
        overheatedCableIds.has(id)
          ? 0.42
          : glowHighlighted.has(id)
            ? 0.86
            : inductionCableIds.has(id)
              ? 0.18
            : 0,
      );
      const lampGuideEnd = state.lampHintCableId === id
        && state.popcornHintCableId !== id
        && !overheatedCableIds.has(id)
        ? this.availableChoices.find(({ arrow }) => arrow.definition.id === id)?.end ?? 'head'
        : null;
      model.setLampGuide(lampGuideEnd);
    }
    this.syncRadioRouteGuide();
  }

  private clearSkillBuffVisuals(): void {
    const visibleTargets: THREE.Object3D[] = [];
    this.bubbleShield.sync(false, visibleTargets);
    this.soundWaveShield.sync(false, visibleTargets);
    this.dehumidifierDryShield.sync(false, null, visibleTargets, undefined, false);
    this.portableSpeakerSpacing.sync(false, []);
    for (const model of this.models.values()) model.setInductionReveal(false);
  }

  private beginDesktopComputerFeedback(hadBuff: boolean, livesAfter: number): void {
    this.desktopComputerFeedback = {
      startedAt: performance.now(),
      hadBuff,
      livesAfter,
      committed: false,
    };
    this.skillTransientScreenEffect = 'blue-screen';
    document.documentElement.dataset.desktopComputerFeedback = 'pending';
    this.pipeline.setSkillEffect('blue-screen', true);
    this.pipeline.setSkillEffectProgress(0);
    this.publishDiagnostics();
  }

  private updateDesktopComputerFeedback(): void {
    const feedback = this.desktopComputerFeedback;
    if (!feedback) return;
    const evidenceTime = window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__;
    const timelineTime = Number.isFinite(evidenceTime) && evidenceTime! > 0
      ? evidenceTime!
      : Math.max(0, (performance.now() - feedback.startedAt) / 1_000);
    this.pipeline.setSkillEffect('blue-screen');
    this.pipeline.setSkillEffectProgress(timelineTime / POWERED_ACTIVE_DURATION);
    if (feedback.committed || timelineTime < 3.72) return;
    feedback.committed = true;
    if (feedback.hadBuff) {
      document.documentElement.dataset.desktopComputerFeedback = 'buff-deleted';
      this.skillUi.showComputerBuffDeleted();
      this.skillUi.setCuePhase('commit', 'BUFF 已删除');
      this.hud.flash('蓝屏崩溃：BUFF 已删除', true);
    } else {
      document.documentElement.dataset.desktopComputerFeedback = 'life-lost';
      this.hud.showComputerLifeLost(feedback.livesAfter);
      this.skillUi.setCuePhase('commit', '生命 -1');
    }
    this.syncSkillState();
    this.publishDiagnostics();
  }

  private syncRadioRouteGuide(): void {
    const availableIds = new Set(this.availableChoices.map(({ arrow }) => arrow.definition.id));
    const state = this.skillEngine?.state;
    const higherPriorityHintIds = new Set<string>([
      ...(state?.lampHintCableId ? [state.lampHintCableId] : []),
      ...(state?.popcornHintCableId ? [state.popcornHintCableId] : []),
      ...(state?.debuff?.id === 'overheated-plug' ? state.debuff.targetCableIds : []),
    ]);
    this.radioRouteCableIds = this.radioRouteCableIds.filter((id) => {
      const arrow = this.arrows.find((candidate) => candidate.definition.id === id);
      return arrow?.state === 'idle'
        && availableIds.has(id)
        && this.models.get(id)?.root.visible === true;
    });
    const targets = this.radioRouteCableIds
      .filter((id) => !higherPriorityHintIds.has(id))
      .map((id): SkillPresentationTarget | null => {
        const model = this.models.get(id);
        const arrow = this.arrows.find((candidate) => candidate.definition.id === id);
        if (!model || !arrow) return null;
        return {
          cableId: id,
          position: model.getHeadWorldPosition(new THREE.Vector3()),
          direction: DIRECTION_VECTORS[cableEndDirection(arrow.definition, 'head')].clone(),
        };
      })
      .filter((target): target is SkillPresentationTarget => target !== null);
    this.skillPresentation.syncRadioGuide(targets);
  }

  private handleHover(clientX: number, clientY: number): void {
    if (
      this.openingActive
      || this.openingTransitioning
      || this.animations.some((animation) => animation.kind === 'bump')
      || this.randomGameOver
      || (this.currentMode === 'rush' && this.rushRound?.phase !== 'running')
      || this.doubleEndedUi.briefingVisible
      || (this.currentMode === 'skill'
        && this.skillInputLocked
        && this.skillEngine?.state.phase !== 'select-recycle-target')
    ) {
      this.setHovered(null);
      return;
    }
    this.setHovered(this.pickArrow(clientX, clientY));
  }

  private pickArrow(clientX: number, clientY: number): { id: string; end: CableEnd } | null {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const targets: THREE.Mesh[] = [];
    const recycleSelectionActive = this.currentMode === 'skill'
      && this.skillEngine?.state.phase === 'select-recycle-target';
    for (const arrow of this.arrows) {
      if (
        arrow.state !== 'idle'
        || (!recycleSelectionActive
          && this.currentMode !== 'rush'
          && !this.appliances.canHandleColor(arrow.definition.color))
      ) continue;
      const model = this.models.get(arrow.definition.id);
      if (model) targets.push(...model.pickMeshes);
    }
    const hit = this.raycaster.intersectObjects(targets, false)[0];
    return typeof hit?.object.userData.arrowId === 'string'
      ? {
          id: hit.object.userData.arrowId,
          end: hit.object.userData.cableEnd === 'tail' ? 'tail' : 'head',
        }
      : null;
  }

  private setHovered(picked: { id: string; end: CableEnd } | null, force = false): void {
    if (!force && this.hoveredId === picked?.id && this.hoveredEnd === picked?.end) return;
    const recycleSelectionActive = this.currentMode === 'skill'
      && this.skillEngine?.state.phase === 'select-recycle-target';
    if (this.hoveredId) {
      const previousModel = this.models.get(this.hoveredId);
      previousModel?.setHovered(false);
      if (recycleSelectionActive) previousModel?.setRecycleSelectionState('none');
    }
    this.hoveredId = picked?.id ?? null;
    this.hoveredEnd = picked?.end ?? null;
    if (picked) {
      const model = this.models.get(picked.id);
      model?.setHovered(true, picked.end, this.theme.snapshot.progress);
      if (recycleSelectionActive) model?.setRecycleSelectionState('hover');
    }
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    if (diagnostics) {
      diagnostics.hoveredArrow = this.hoveredId;
      diagnostics.hoveredCableEnd = this.hoveredEnd;
      if (diagnostics.skill) {
        for (const effect of diagnostics.skill.cableEffects) {
          const model = this.models.get(effect.id);
          if (model) Object.assign(effect, model.skillVisualState);
        }
      }
    }
  }

  private update(delta: number, elapsed: number): void {
    const openingWallDelta = this.lastOpeningFrameElapsed > 0
      ? Math.min(5, Math.max(delta, elapsed - this.lastOpeningFrameElapsed))
      : delta;
    this.lastOpeningFrameElapsed = elapsed;
    this.theme.update(delta);
    const themeSnapshot = this.theme.snapshot;
    this.season.update(delta, themeSnapshot.progress);
    const seasonSnapshot = this.season.snapshot;
    const seasonEnvironment = this.season.resolveEnvironment(themeSnapshot.progress);
    this.pipeline.setThemeProgress(themeSnapshot.progress);
    this.nightEnvironment.setThemeProgress(themeSnapshot.progress);
    this.nightEnvironment.setSeasonEnvironment(seasonEnvironment);
    this.sky.setSeasonWeights(seasonSnapshot.weights);
    this.petals.setSeasonState(seasonSnapshot.weights, themeSnapshot.progress);
    this.openingScene.setSeasonState(seasonSnapshot.weights, themeSnapshot.progress);
    this.nightEnvironment.setReducedMotion(themeSnapshot.reducedMotion);
    if (this.hoveredId && this.hoveredEnd) {
      this.models.get(this.hoveredId)?.setHovered(true, this.hoveredEnd, themeSnapshot.progress);
    }
    if (themeSnapshot.progress > 0.5) this.adaptiveQuality.update(delta);
    this.nightEnvironment.update(delta, elapsed, {
      opening: this.openingActive,
      galleryOpen: this.applianceGallery?.visible ?? false,
      openingFocus: this.openingActive
        ? this.openingScene.getBundleWorldPosition(this.openingLanternFocus)
        : undefined,
    });
    const lantern = this.nightEnvironment.lantern;
    this.lanternScreenPosition.set(lantern.position[0], lantern.position[1]);
    this.pipeline.setLantern(this.lanternScreenPosition, lantern.intensity);
    if (this.applianceGallery?.visible) return;
    this.audio.update(themeSnapshot.progress, this.appliances.targets, this.camera);
    this.frame += 1;
    this.orbit.update(delta);
    this.appliances.setOrbitState(this.orbit.getState());
    this.sky.update(this.camera.position, this.camera.quaternion, elapsed);
    this.openingScene.update(delta, elapsed, this.camera, openingWallDelta);
    this.updateOpeningCameraTransition(openingWallDelta);
    this.skillEffects.update(delta, elapsed);
    this.bubbleShield.update(delta, elapsed, this.orbit.getState());
    this.soundWaveShield.update(delta, elapsed);
    this.dehumidifierDryShield.update(delta, elapsed);
    if (this.portableSpeakerSpacing.phase === 'idle') {
      this.portableSpeakerSpacing.update(delta);
    } else {
      this.portableSpeakerSpacing.update(delta, this.getPortableSpeakerSpacingTargets());
    }
    this.petals.setCanopyFlow(this.dehumidifierDryShield.petalFlow);
    this.petals.update(delta);
    this.televisionReconstruction.update(this.camera);
    this.toasterHeatSwap.update();
    this.kettleThaw.update();
    this.washerSpin.update(delta);
    this.refrigeratorFreeze.syncStatus(
      this.skillEngine?.state.debuff?.id === 'frozen-plug'
        ? this.skillEngine.state.debuff.targetCableIds
        : [],
    );
    this.refrigeratorFreeze.update(delta);
    this.refrigeratorScreenIce.setThemeProgress(themeSnapshot.progress);
    this.refrigeratorScreenIce.setProgress(
      this.refrigeratorFreeze.visible
        ? this.refrigeratorFreeze.environmentAmount
        : 0,
    );
    this.petals.setColdProgress(
      this.refrigeratorFreeze.visible
        ? this.refrigeratorFreeze.environmentAmount
        : 0,
    );
    for (const [id, model] of this.models) {
      model.updateRecycleSelection(elapsed);
      model.updateOverheat(delta, elapsed);
      const frozen = this.refrigeratorFreeze.hasTarget(id);
      // The formal skill can run on large boards, so build the heavier ice
      // shell only for its actual targets.
      model.setRefrigeratorIceGeometryEnabled(frozen);
      model.setFrozen(
        frozen ? this.refrigeratorFreeze.cableAmount : 0,
        frozen ? this.refrigeratorFreeze.cableProgress : 0,
      );
    }
    this.updateCoffeeStain(delta, elapsed);
    const toasterHeatSwap = this.toasterHeatSwap.diagnostics;
    if (toasterHeatSwap.active) this.pipeline.setSkillEffect('toaster-heat');
    if (toasterHeatSwap.active) {
      this.pipeline.setSkillEffectProgress(toasterHeatSwap.screenProgress);
    }
    const kettleThaw = this.kettleThaw.diagnostics;
    if (kettleThaw.phase !== 'idle') {
      this.pipeline.setSkillEffect('kettle-thaw-heat');
      this.pipeline.setSkillEffectProgress(kettleThaw.progress);
    }
    this.syncRadioRouteGuide();
    this.skillPresentation.update(elapsed);
    if (this.openingActive) return;
    if (this.activeHint) {
      for (const model of this.models.values()) model.updateAvailableHints(delta, elapsed);
    }
    // ApplianceScene normally keeps every appliance at a stable screen-space
    // position. During the pull-back, preserve its prepared world transform
    // first, then ease it into the HUD-safe screen anchor only near the end.
    // This makes the appliances enter from outside the close-up without a
    // last-frame snap into place.
    if (this.openingTransitioning) {
      const pullProgress = this.openingCameraPhase === 'pull'
        ? THREE.MathUtils.clamp(this.openingCameraElapsed / this.openingCameraPullDuration, 0, 1)
        : 0;
      const anchorBlend = THREE.MathUtils.smoothstep(pullProgress, 0.55, 1);
      this.appliances.updateOpeningCameraTransition(delta, elapsed, anchorBlend);
    } else {
      this.appliances.endOpeningCameraTransition();
      this.appliances.update(delta, elapsed);
    }
    this.sensory.register(this.appliances.targets);
    this.performances.update(delta, elapsed, this.camera, this.appliances.targets, this.petals);
    this.updateDesktopComputerFeedback();
    this.sensory.update(
      this.appliances.targets,
      themeSnapshot.progress,
      elapsed,
      this.explorationMode ? 1 : 0,
    );
    for (const target of this.appliances.targets) {
      if (target.dropLanded && !this.landedTargets.has(target)) {
        this.landedTargets.add(target);
        this.audio.playInteraction('appliance-land');
      } else if (!target.dropLanded) {
        this.landedTargets.delete(target);
      }
    }
    if (this.currentMode === 'rush' && this.rushRound?.phase === 'running') {
      const phase = this.rushRound.update(elapsed);
      this.rushUi.setTimer(this.rushRound.remainingSeconds);
      if (phase === 'failed') {
        this.finishRushFailure();
        return;
      }
    }
    this.updateAnimations(delta, elapsed);
    this.connections.update(delta, this.camera);
    this.flushPendingApplianceConnections();
    if (this.applianceRoutingRevision !== this.appliances.routingRevision) {
      this.applianceRoutingRevision = this.appliances.routingRevision;
      this.refreshAvailability(false);
    }
  }

  private updateAnimations(delta: number, elapsed: number): void {
    for (let index = this.animations.length - 1; index >= 0; index -= 1) {
      const animation = this.animations[index];
      animation.elapsed = animation.wallClockStartedAtSeconds === null
        ? animation.elapsed + delta
        : Math.max(animation.elapsed, elapsed - animation.wallClockStartedAtSeconds);
      const progress = Math.min(1, animation.elapsed / animation.duration);

      if (animation.kind === 'exit') {
        const travelDistance = animation.model.pathLength + 0.85;
        const prepare = progress < 0.14 ? Math.sin((progress / 0.14) * Math.PI) : 0;
        animation.model.setPrepare(prepare, animation.end);
        animation.model.setMotionDistance(easeOutCubic(progress) * travelDistance, animation.end);
      } else if (animation.kind === 'skill-fling') {
        const travelProgress = progress * (0.62 + progress * 0.38);
        const travel = travelProgress * 36;
        animation.model.root.position.copy(animation.originPosition ?? new THREE.Vector3())
          .addScaledVector(animation.direction, travel);
        animation.model.root.quaternion.copy(animation.originQuaternion ?? new THREE.Quaternion());
        animation.model.root.scale.copy(animation.originScale ?? new THREE.Vector3(1, 1, 1));
        // Each cable tumbles with its own three-axis angular velocity while
        // its center of mass continues on the outward flight path.
        const flightAngularVelocity = animation.flightAngularVelocity;
        if (flightAngularVelocity) {
          this.washerFlightEuler.set(
            flightAngularVelocity.x * animation.elapsed,
            flightAngularVelocity.y * animation.elapsed,
            flightAngularVelocity.z * animation.elapsed,
            'XYZ',
          );
          this.washerFlightQuaternion.setFromEuler(this.washerFlightEuler);
          animation.model.root.quaternion.multiply(this.washerFlightQuaternion);
        }
        const worldPosition = animation.model.root.getWorldPosition(this.washerFlightWorldPosition);
        const flightDistance = worldPosition.distanceTo(animation.originPosition ?? worldPosition);
        const projected = this.washerFlightProjectedPosition.copy(worldPosition).project(this.camera);
        animation.maxScreenRadius = Math.max(
          animation.maxScreenRadius ?? 0,
          Math.abs(projected.x),
          Math.abs(projected.y),
        );
        animation.distanceMonotonic = (animation.distanceMonotonic ?? true)
          && flightDistance + 0.0001 >= (animation.previousFlightDistance ?? 0);
        animation.previousFlightDistance = flightDistance;
      } else {
        const pulse = Math.sin(progress * Math.PI);
        animation.model.setMotionDistance(pulse * 0.16, animation.end);
        animation.model.setBlockedFlash(pulse, animation.end);
      }

      if (progress < 1) continue;
      this.animations.splice(index, 1);

      if (animation.kind === 'exit' || animation.kind === 'skill-fling') {
        const start = (animation.end === 'head'
          ? animation.arrow.samplePoints[animation.arrow.samplePoints.length - 1]
          : animation.arrow.samplePoints[0])
          .clone()
          .addScaledVector(animation.direction, 1.9);
        animation.model.root.visible = false;
        if (animation.kind === 'skill-fling') {
          this.washerFlingHistory.push({
            id: animation.arrow.definition.id,
            maxScreenRadius: animation.maxScreenRadius ?? 0,
            distanceMonotonic: animation.distanceMonotonic ?? true,
          });
        }
        if (animation.autoCommitted) {
          if (animation.kind === 'skill-fling') {
            // Keep the visual flight completion frame lightweight. Rule state,
            // HUD, audio, routing, and availability are committed as one batch
            // only after the drum has finished regrouping.
            this.pendingWasherFlingRemovals.push(animation.arrow);
            this.skillAutoRemovalEnds.delete(animation.arrow.definition.id);
            continue;
          }
          this.completeRemoval(animation.arrow, false);
           this.skillEngine?.notifyAutoRemoved(
             animation.arrow.definition.id,
             this.arrows.length - this.removedCount > 0,
           );
          this.skillAutoRemovalEnds.delete(animation.arrow.definition.id);
          continue;
        }
        const target = animation.target;
        if (this.currentMode === 'rush') {
          this.completeRemoval(animation.arrow);
          continue;
        }
        if (animation.queueAfterExit) {
          this.pendingApplianceConnections.push({
            arrow: animation.arrow,
            color: animation.arrow.definition.color,
            start,
            direction: animation.direction,
          });
          this.refreshAvailability(false);
          continue;
        }
        if (!target) {
          animation.arrow.state = 'idle';
          animation.model.root.visible = true;
          animation.model.resetPose();
          this.refreshAvailability(false);
          continue;
        }
        this.completeRemoval(animation.arrow);
        this.connections.begin(
          start,
          animation.direction,
          target,
          animation.arrow.definition.color,
          this.appliances.getPlugStyleForColor(animation.arrow.definition.color),
          this.camera,
          () => this.completeConnection(target, animation.arrow),
        );
      } else {
        animation.model.setMotionDistance(0, animation.end);
        animation.model.resetMaterial();
        animation.arrow.state = 'idle';
      }
    }
  }

  private completeRemoval(
    arrow: ArrowRuntime,
    manualSkillRemoval = true,
  ): void {
    arrow.state = 'removed';
    this.removedCount += 1;
    const remaining = this.arrows.length - this.removedCount;
    this.hud.updateProgress(remaining, this.arrows.length);
    this.hud.showRemoved(remaining);
    this.audio.playInteraction('cable-success');
    this.syncRequiredColors();
    if (this.currentMode === 'rush') {
      this.rushRound?.recordRemoval();
      if (remaining === 0) this.finishRushSuccess();
    }
    if (this.currentMode === 'skill' && manualSkillRemoval) {
      const triggerPrinterCopy = this.skillEngine?.commitManualRemoval(
        arrow.definition.id,
        remaining > 0,
      ) ?? false;
      if (triggerPrinterCopy) {
        this.syncSkillState();
        this.triggerPrinterCopyAutoRemoval();
      }
    }
    this.refreshAvailability(false);
  }

  private commitPendingWasherFlingRemovals(): void {
    if (this.pendingWasherFlingRemovals.length === 0) return;
    const pending = this.pendingWasherFlingRemovals.splice(0);
    let committed = 0;
    for (const arrow of pending) {
      if (arrow.state === 'removed') continue;
      arrow.state = 'removed';
      this.removedCount += 1;
      committed += 1;
      this.skillEngine?.notifyAutoRemoved(
        arrow.definition.id,
        this.arrows.length - this.removedCount > 0,
      );
    }
    if (committed === 0) return;
    const remaining = this.arrows.length - this.removedCount;
    this.hud.updateProgress(remaining, this.arrows.length);
    this.hud.showRemoved(remaining);
    this.audio.playInteraction('cable-success');
  }

  private syncRequiredColors(): void {
    this.appliances.setRequiredColors(
      this.currentMode === 'rush'
        ? []
        : this.arrows
          .filter((candidate) => candidate.state !== 'removed')
          .map((candidate) => candidate.definition.color),
    );
  }

  private finishRushSuccess(): void {
    if (this.currentMode !== 'rush' || this.rushRound?.phase !== 'running') return;
    this.rushRound.succeed();
    this.setHovered(null);
    this.rushUi.showResult(
      'success',
      this.rushFlow === 'sequence' && this.currentRushChallenge
        && getNextRushChallenge(this.currentRushChallenge)
        ? 'next-level'
        : 'random-pool',
    );
    this.audio.playInteraction('complete');
    this.publishDiagnostics();
  }

  private finishRushFailure(): void {
    if (this.currentMode !== 'rush' || this.rushRound?.phase !== 'failed') return;
    this.setHovered(null);
    for (const animation of this.animations) {
      animation.arrow.state = 'idle';
      animation.model.resetPose();
    }
    this.animations.length = 0;
    this.pendingApplianceConnections.length = 0;
    this.rushUi.showResult('failure');
    this.audio.playInteraction('failed');
    this.refreshAvailability(false);
    this.publishDiagnostics();
  }

  private completeConnection(target: ApplianceTarget, arrow: ArrowRuntime): void {
    this.petals.burst(
      target.getConnectionWorldPosition(),
      new THREE.Vector3(0, 0.75, 0.25),
      16,
    );
    const remaining = this.arrows.length - this.removedCount;
    this.hud.showConnected(remaining, target.label);
    this.audio.playInteraction('confirm');
    if (this.currentMode === 'skill') {
      this.resolveSkillConnection(target, arrow);
      return;
    }
    this.refreshAvailability(false);
    if (remaining !== 0) return;
    window.setTimeout(() => {
      if (this.arrows.length - this.removedCount === 0 && this.connections.activeCount === 0) {
        this.hud.showComplete();
        this.audio.playInteraction('complete');
      }
    }, 0);
  }

  private flushPendingApplianceConnections(): void {
    for (let index = 0; index < this.pendingApplianceConnections.length;) {
      const pending = this.pendingApplianceConnections[index];
      const target = this.appliances.reserveAssignment(
        pending.arrow.definition.id,
        pending.color,
      );
      if (!target) {
        index += 1;
        continue;
      }
      this.pendingApplianceConnections.splice(index, 1);
      this.completeRemoval(pending.arrow);
      this.connections.begin(
        pending.start,
        pending.direction,
        target,
        pending.color,
        this.appliances.getPlugStyleForColor(pending.color),
        this.camera,
        () => this.completeConnection(target, pending.arrow),
      );
    }
  }

  private render(): void {
    if (this.applianceGallery?.visible || this.contextUnavailable) return;
    this.pipeline.render();
    this.skillPresentation.render();
    if (this.frame % DIAGNOSTICS_PUBLISH_INTERVAL_FRAMES === 0) {
      this.publishDiagnostics();
    } else {
      this.publishLiveDiagnostics();
    }
  }

  private profileRenderBreakdown(): RenderCostProfile {
    const directChildren = [...this.scene.children];
    const originalVisibility = directChildren.map((object) => ({ object, visible: object.visible }));
    const originalVisibilityByObject = new Map(originalVisibility.map(({ object, visible }) => [object, visible]));
    const previousTarget = this.renderer.getRenderTarget();
    const profileEntries: RenderCostProfileEntry[] = [];
    const liveRenderer = {
      calls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
    };
    const labels = new Map<THREE.Object3D, string>([
      [this.arrowRoot, 'arrows'],
      [this.appliances.root, 'appliances'],
      [this.connections.root, 'connections'],
      [this.petals.mesh, 'season-petals'],
      [this.openingScene.root, 'opening-scene'],
      [this.performances.root, 'appliance-performance-effects'],
      [this.sensory.root, 'appliance-sensory'],
      [this.skillEffects.root, 'skill-effect-models'],
      [this.bubbleShield.root, 'bubble-shield'],
      [this.soundWaveShield.root, 'sound-wave-shield'],
      [this.dehumidifierDryShield.root, 'dehumidifier-dry-shield'],
      [this.sky.dome, 'sky-dome'],
      [this.sky.stars, 'sky-stars'],
      [this.sky.explorationEyes, 'sky-exploration-eyes'],
      [this.sky.clouds, 'sky-clouds'],
    ]);
    const geometryTriangles = (object: THREE.Mesh): number => {
      const geometry = object.geometry;
      const sourceCount = geometry.index?.count ?? geometry.getAttribute('position')?.count ?? 0;
      const drawStart = geometry.drawRange.start ?? 0;
      const drawCount = geometry.drawRange.count === Infinity
        ? sourceCount - drawStart
        : Math.min(geometry.drawRange.count, sourceCount - drawStart);
      const instanceCount = object instanceof THREE.InstancedMesh ? object.count : 1;
      return Math.max(0, Math.floor(drawCount / 3)) * instanceCount;
    };
    const describe = (object: THREE.Object3D): Omit<RenderCostProfileEntry, 'calls'> => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      let objects = 0;
      let renderables = 0;
      let visibleRenderables = 0;
      let meshes = 0;
      let lines = 0;
      let points = 0;
      let lights = 0;
      let triangles = 0;
      let potentialTriangles = 0;
      object.traverse((child) => {
        objects += 1;
        if (child instanceof THREE.Light) lights += 1;
        if (
          child instanceof THREE.Mesh
          || child instanceof THREE.Line
          || child instanceof THREE.LineLoop
          || child instanceof THREE.LineSegments
          || child instanceof THREE.Points
        ) {
          renderables += 1;
          const renderable = child as THREE.Mesh;
          let effectivelyVisible = true;
          let cursor: THREE.Object3D | null = child;
          while (cursor) {
            if (!cursor.visible) {
              effectivelyVisible = false;
              break;
            }
            if (cursor === object) break;
            cursor = cursor.parent;
          }
          if (effectivelyVisible) visibleRenderables += 1;
          if (child instanceof THREE.Mesh) meshes += 1;
          else if (child instanceof THREE.Points) points += 1;
          else lines += 1;
          if (renderable.geometry) {
            geometries.add(renderable.geometry);
            if (child instanceof THREE.Mesh) {
              const meshTriangles = geometryTriangles(child);
              potentialTriangles += meshTriangles;
              if (effectivelyVisible) triangles += meshTriangles;
            }
          }
          const material = renderable.material;
          if (Array.isArray(material)) material.forEach((entry) => materials.add(entry));
          else if (material) materials.add(material);
        }
      });
      return {
        name: labels.get(object) ?? (object.name || object.type),
        type: object.type,
        visible: object.visible,
        objects,
        renderables,
        visibleRenderables,
        meshes,
        lines,
        points,
        lights,
        materials: materials.size,
        geometries: geometries.size,
        triangles,
        potentialTriangles,
      };
    };
    const renderEntry = (object: THREE.Object3D): number => {
      directChildren.forEach((child) => {
        child.visible = child instanceof THREE.Light
          || (child === object && originalVisibilityByObject.get(child) === true);
      });
      this.renderer.info.reset();
      this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      return this.renderer.info.render.calls;
    };
    try {
      directChildren.forEach((child) => { child.visible = child instanceof THREE.Light || child.visible; });
      this.renderer.info.reset();
      this.renderer.setRenderTarget(this.applianceGeometryWarmupTarget);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      const sceneRenderer = {
        calls: this.renderer.info.render.calls,
        triangles: this.renderer.info.render.triangles,
        geometries: this.renderer.info.memory.geometries,
        textures: this.renderer.info.memory.textures,
      };
      for (const object of directChildren) {
        profileEntries.push({ ...describe(object), calls: renderEntry(object) });
      }
      return {
        capturedAt: new Date().toISOString(),
        liveRenderer,
        sceneRenderer,
        estimatedPostProcessCalls: Math.max(0, liveRenderer.calls - sceneRenderer.calls),
        entries: profileEntries,
      };
    } finally {
      originalVisibility.forEach(({ object, visible }) => { object.visible = visible; });
      this.renderer.setRenderTarget(previousTarget);
    }
  }

  private resize(): void {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.pipeline?.setSize(width, height);
    if (this.pipeline) setOutlineResolution(this.pipeline.size.x, this.pipeline.size.y);
    this.skillPresentation?.resize(width, height);
  }

  private refreshAvailability(orientForFirstMove: boolean): void {
    const runtimeById = new Map(this.arrows.map((arrow) => [arrow.definition.id, arrow]));
    const allChoices: CableChoice[] = this.arrows.flatMap((arrow) =>
      arrow.state === 'idle' &&
      (this.currentMode === 'rush' || this.appliances.canHandleColor(arrow.definition.color))
        ? cableEndsFor(arrow.definition).map((end) => ({ arrow, end }))
        : [],
    );
    const availableKeys = new Set(availableCableEnds(this.arrows).map(({ id, end }) => `${id}:${end}`));
    let frozenIds = new Set(this.currentMode === 'skill' ? this.skillEngine?.getFrozenCableIds() ?? [] : []);
    const fakeIds = new Set(this.currentMode === 'skill' ? this.skillEngine?.getFakePlugCableIds() ?? [] : []);
    const baseAvailable = allChoices.filter(({ arrow, end }) =>
      runtimeById.has(arrow.definition.id)
      && !(end === 'tail' && fakeIds.has(arrow.definition.id))
      && availableKeys.has(`${arrow.definition.id}:${end}`),
    );
    if (
      this.currentMode === 'skill'
      && baseAvailable.length > 0
      && frozenStatusBlocksEveryAvailableCable(
        [...new Set(baseAvailable.map(({ arrow }) => arrow.definition.id))],
        frozenIds,
      )
      && this.skillEngine?.clearFrozenDeadlock()
    ) {
      frozenIds = new Set();
      this.skillUi.render(this.skillEngine.state);
      this.refrigeratorFreeze.beginThaw(0.9);
      this.hud.flash('所有出口被冻结，已自动解除急冻', true);
      this.skillUi.showCue('急冻自动解除', 'commit', '避免出现无可抽线路。', '安全兜底');
    }
    const available = baseAvailable.filter(({ arrow }) => !frozenIds.has(arrow.definition.id));
    this.availableChoices = available;
    if (
      this.activeHint
      && !availableKeys.has(`${this.activeHint.id}:${this.activeHint.end}`)
    ) {
      this.activeHint = null;
    }
    this.applyActiveHint(false);
    this.availableCount = available.length;
    const collectVisibleTargets = Number.isFinite(window.__APPLIANCE_PERFORMANCE_TIME_OVERRIDE__);
    this.availableClickTargets = collectVisibleTargets
      ? this.findVisibleClickTargets(available)
      : [];
    this.clickTarget = this.availableClickTargets[0] ?? this.findVisibleClickTarget(available);
    if (orientForFirstMove && !this.clickTarget && !this.isDoubleEndedChallenge()) {
      const views = [
        [0.72, 0.42],
        [1.5, 0.34],
        [2.3, 0.5],
        [3.1, 0.28],
        [3.9, 0.52],
        [4.7, 0.36],
        [5.5, 0.46],
        [0.2, 0.75],
      ] as const;
      for (const [yaw, pitch] of views) {
        this.orbit.setAngles(yaw, pitch);
        this.availableClickTargets = collectVisibleTargets
          ? this.findVisibleClickTargets(available)
          : [];
        this.clickTarget = this.availableClickTargets[0] ?? this.findVisibleClickTarget(available);
        if (this.clickTarget) break;
      }
    }
    const blocked = allChoices.filter(({ arrow, end }) =>
      !availableKeys.has(`${arrow.definition.id}:${end}`),
    );
    this.blockedClickTarget = this.findVisibleClickTarget(blocked);
    this.hud.setHintEnabled(this.canRevealHint() && available.length > 0);
    if (this.currentMode === 'skill') this.syncSkillPresentation();
  }

  private applyActiveHint(replayReveal: boolean): void {
    for (const model of this.models.values()) model.setAvailableEnds([]);
    if (!this.activeHint) return;
    this.models.get(this.activeHint.id)?.setAvailableEnds([this.activeHint.end], replayReveal);
  }

  private clearActiveHint(): void {
    this.activeHint = null;
    for (const model of this.models.values()) model.setAvailableEnds([]);
  }

  private canRevealHint(): boolean {
    return !this.openingActive
      && !this.openingTransitioning
      && !this.randomGameOver
      && this.currentMode !== 'rush'
      && this.hintUsesRemaining > 0
      && !this.doubleEndedUi.briefingVisible;
  }

  private findVisibleClickTarget(
    available: readonly CableChoice[],
  ): CableScreenTarget | null {
    return this.findVisibleClickTargets(available, 1)[0] ?? null;
  }

  private findVisibleClickTargets(
    available: readonly CableChoice[],
    limit = Number.POSITIVE_INFINITY,
  ): CableScreenTarget[] {
    this.camera.updateMatrixWorld(true);
    this.scene.updateMatrixWorld(true);
    const allTargets: THREE.Mesh[] = [];
    for (const arrow of this.arrows) {
      if (arrow.state !== 'idle') continue;
      const model = this.models.get(arrow.definition.id);
      if (model) allTargets.push(...model.pickMeshes);
    }

    const rect = this.canvas.getBoundingClientRect();
    const results: CableScreenTarget[] = [];
    for (const { arrow, end } of available) {
      const samples = arrow.definition.doubleEnded
        ? [end === 'head' ? arrow.samplePoints[arrow.samplePoints.length - 1] : arrow.samplePoints[0]]
        : arrow.samplePoints;
      for (const sample of samples) {
        const projected = sample.clone().project(this.camera);
        if (Math.abs(projected.x) > 0.96 || Math.abs(projected.y) > 0.96 || projected.z > 1) continue;
        if (this.appliances.isScreenPointBlockedByAppliance(projected.x, projected.y)) continue;
        this.raycaster.setFromCamera(new THREE.Vector2(projected.x, projected.y), this.camera);
        const hit = this.raycaster.intersectObjects(allTargets, false)[0];
        if (
          hit?.object.userData.arrowId !== arrow.definition.id ||
          (arrow.definition.doubleEnded && hit.object.userData.cableEnd !== end)
        ) continue;
        results.push({
          id: arrow.definition.id,
          end,
          color: arrow.definition.color,
          x: rect.left + ((projected.x + 1) * 0.5) * rect.width,
          y: rect.top + ((1 - projected.y) * 0.5) * rect.height,
        });
        break;
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  private publishLiveDiagnostics(): void {
    const diagnostics = window.__THREE_GAME_DIAGNOSTICS__;
    if (!diagnostics) {
      this.publishDiagnostics();
      return;
    }
    diagnostics.frame = this.frame;
    diagnostics.activeAnimations = this.animations.length
      + this.pendingApplianceConnections.length
      + this.connections.activeCount;
    diagnostics.activeConnections = this.connections.activeCount;
    diagnostics.activeBurstPetals = this.petals.activeBurstCount;
    diagnostics.queuedConnections = this.pendingApplianceConnections.length;
    diagnostics.remainingArrows = this.arrows.length - this.removedCount;
    diagnostics.appliances = this.appliances.getStateSummary();
    if (diagnostics.skill && this.skillEngine) {
      diagnostics.skill.phase = this.skillEngine.state.phase;
      diagnostics.skill.inputLocked = this.skillInputLocked;
      diagnostics.skill.presentation = this.skillPresentation.diagnostics;
      diagnostics.skill.washerSpin = this.washerSpin.diagnostics;
      diagnostics.skill.screenEffect = this.pipeline.skillEffectState;
      if (
        this.skillRecycleSelectionTimer !== 0
        || this.skillEngine.state.buff?.id === 'induction-reveal'
        || this.skillEngine.state.debuff?.id === 'overheated-plug'
        || this.skillPresentation.diagnostics.skillId === 'color-shuffle'
      ) {
        for (const effect of diagnostics.skill.cableEffects) {
          const model = this.models.get(effect.id);
          if (model) Object.assign(effect, model.skillVisualState);
        }
      }
    }
  }

  private publishDiagnostics(): void {
    const info = this.renderer.info;
    const activeAnimation = this.animations[0];
    const activeFlingMotions = this.animations
      .filter((animation) => animation.kind === 'skill-fling')
      .map((animation) => {
        const worldPosition = animation.model.root.getWorldPosition(new THREE.Vector3());
        const projected = worldPosition.clone().project(this.camera);
        return {
          id: animation.arrow.definition.id,
          progress: Math.min(1, animation.elapsed / animation.duration),
          worldPosition: worldPosition.toArray(),
          worldDistanceFromLaunch: worldPosition.distanceTo(
            animation.originPosition ?? worldPosition,
          ),
          distanceFromBundleCenter: worldPosition.distanceTo(
            animation.bundleCenterWorld ?? worldPosition,
          ),
          angularVelocity: animation.flightAngularVelocity?.toArray() ?? [],
          direction: animation.direction.toArray(),
          screenX: projected.x,
          screenY: projected.y,
          detachedFromCableRoot: animation.model.root.parent !== this.arrowRoot,
        };
      });
    const lengthMix = this.arrows.reduce(
      (mix, arrow) => {
        mix[arrow.definition.lengthClass] += 1;
        return mix;
      },
      { short: 0, medium: 0, long: 0 },
    );
    window.__THREE_GAME_DIAGNOSTICS__ = {
      frame: this.frame,
      seed: this.puzzle?.seed ?? 0,
      puzzleRevision: this.puzzleRevision,
      layoutSignature: this.puzzle?.arrows.map((arrow) =>
        `${arrow.path.map((point) => point.join(',')).join(';')}>${arrow.exitDirection}`,
      ).join('|') ?? '',
      mode: this.currentMode,
      exploration: {
        active: this.explorationMode,
        environmentScale: this.explorationMode ? 0.015 : 1,
        lanternPreserved: true,
      },
      challengeKind: this.puzzle?.challengeKind ?? this.currentLevel?.challengeKind ?? null,
      locale: getLocale(),
      randomLives: this.randomLives,
      randomGameOver: this.randomGameOver,
      skill: this.skillEngine
        ? {
            testId: null,
            invulnerable: false,
            registrySize: APPLIANCE_SKILL_REGISTRY.size,
            phase: this.skillEngine.state.phase,
            inputLocked: this.skillInputLocked,
            lives: this.skillEngine.state.currentLives,
            maxLives: this.skillEngine.state.maxLives,
            buff: this.skillEngine.state.buff?.id ?? null,
            buffTurnsRemaining: this.skillEngine.state.buff?.turnsRemaining ?? null,
            debuff: this.skillEngine.state.debuff?.id ?? null,
            debuffTurnsRemaining: this.skillEngine.state.debuff?.turnsRemaining ?? null,
            remainingCableIds: this.arrows.filter((arrow) => arrow.state !== 'removed').map((arrow) => arrow.definition.id),
            lampHintCableId: this.skillEngine.state.lampHintCableId,
            popcornHintCableId: this.skillEngine.state.popcornHintCableId,
            cableEffects: [...this.models].map(([id, model]) => ({
              id,
              ...model.skillVisualState,
            })),
            effectAssets: this.skillEffects.activeAssetIds,
            popcornTransientCount: this.skillEffects.popcornTransientCount,
            microwaveMarkers: this.skillEffects.microwaveMarkerDiagnostics,
            popcornMarkers: this.skillEffects.popcornMarkerDiagnostics,
            bubbleShield: this.bubbleShield.diagnostics,
            soundWaveShield: this.soundWaveShield.diagnostics,
            dehumidifierDryShield: this.dehumidifierDryShield.diagnostics,
            portableSpeakerSpacing: this.portableSpeakerSpacing.diagnostics,
            dehumidifierCanopyPetals: this.petals.canopyFlowState,
            steamReveal: this.pipeline.steamRevealState,
            steamClear: this.pipeline.steamClearState,
            printerCopyReady: this.skillEngine.state.printerCopyReady,
            cardCount: this.skillEngine.cards.length,
            presentation: this.skillPresentation.diagnostics,
            televisionReconstruction: this.televisionReconstruction.diagnostics,
            toasterHeatSwap: this.toasterHeatSwap.diagnostics,
            refrigeratorFreeze: this.refrigeratorFreeze.diagnostics,
            kettleThaw: this.kettleThaw.diagnostics,
            washerSpin: this.washerSpin.diagnostics,
            refrigeratorScreenIce: this.refrigeratorScreenIce.diagnostics,
            coldParticles: this.petals.coldState,
            screenEffect: this.pipeline.skillEffectState,
          }
        : null,
      rush: this.currentRushChallenge && this.rushRound
        ? {
            challengeId: this.currentRushChallenge.id,
            flow: this.rushFlow,
            phase: this.rushRound.phase,
            timeLimitSeconds: this.rushRound.timeLimitSeconds,
            remainingSeconds: this.rushRound.remainingSeconds,
            removals: this.rushRound.removalCount,
            mistakes: this.rushRound.mistakeCount,
          }
        : null,
      doubleEndedHints: {
        briefingVisible: this.doubleEndedUi.briefingVisible,
        visibleEnds: [...this.models.values()].reduce(
          (count, model) => count + model.availableEndCount,
          0,
        ),
        visibleClickTargets: this.availableClickTargets.length,
      },
      hint: {
        enabled: !this.hud.hintButton.disabled,
        target: this.activeHint,
        remaining: this.hintUsesRemaining,
        maximum: MAX_HINT_USES,
        visibleEnds: [...this.models.values()].reduce(
          (count, model) => count + model.availableEndCount,
          0,
        ),
        scale: [...this.models.values()].reduce(
          (maximum, model) => Math.max(maximum, model.availableHintScale),
          0,
        ),
      },
      levelId: this.currentLevel?.id ?? null,
      shape: this.currentLevel?.shape ?? null,
      totalArrows: this.arrows.length,
      doubleEndedCables: this.arrows.filter((arrow) => arrow.definition.doubleEnded).length,
      remainingArrows: this.arrows.length - this.removedCount,
      initiallyFree: this.puzzle?.initiallyFree ?? 0,
      lengthMix,
      availableArrows: this.availableCount,
      clickTarget: this.clickTarget,
      availableClickTargets: this.availableClickTargets,
      blockedClickTarget: this.blockedClickTarget,
      activeAnimations: this.animations.length
        + this.pendingApplianceConnections.length
        + this.connections.activeCount,
      queuedConnections: this.pendingApplianceConnections.length,
      activeConnections: this.connections.activeCount,
      activeFlingMotions,
      completedFlingMotions: this.washerFlingHistory.map((entry) => ({ ...entry })),
      activeMotion: activeAnimation
        ? {
            id: activeAnimation.arrow.definition.id,
            end: activeAnimation.end,
            kind: activeAnimation.kind,
            color: activeAnimation.arrow.definition.color,
            targetId: activeAnimation.target?.id ?? null,
            targetAccent: activeAnimation.target?.accent ?? null,
            pathDistance: activeAnimation.model.motionDistance,
            rootOffset: activeAnimation.model.root.position.length(),
          }
        : null,
      hoveredArrow: this.hoveredId,
      hoveredCableEnd: this.hoveredEnd,
      activeBurstPetals: this.petals.activeBurstCount,
      performances: this.performances.getStateSummary(),
      sensory: this.sensory.getDiagnostics(),
      theme: {
        season: this.season.snapshot,
        seasonParticles: this.petals.seasonState,
        ...this.theme.snapshot,
        stars: this.sky.stars.geometry.drawRange.count,
        explorationEyes: {
          pairs: this.sky.explorationEyes.geometry.drawRange.count,
          progress: Number((this.sky.explorationEyes.material as THREE.ShaderMaterial).uniforms.uProgress.value),
        },
        lantern: this.nightEnvironment.lantern,
        quality: this.adaptiveQuality.getDiagnostics(),
      },
      audio: this.audio.getDiagnostics(),
      opening: {
        active: this.openingActive,
        ready: this.puzzle !== null && !this.initialPuzzlePreparing,
        progress: this.startScreen.progress,
        transitioning: this.openingTransitioning,
        cameraPhase: this.openingCameraPhase,
        ...this.openingScene.getStateSummary(),
      },
      sceneVisibility: {
        arrows: this.arrowRoot.visible,
        appliances: this.appliances.root.visible,
        connections: this.connections.root.visible,
        opening: this.openingScene.root.visible,
      },
      appliances: this.appliances.getStateSummary(),
      applianceReplacement: this.appliances.getReplacementDiagnostics(),
      routing: this.appliances.getRoutingSummary(),
      context: {
        losses: this.contextLosses,
        restores: this.contextRestores,
        lossAtMs: this.contextLossAtMs,
      },
      timings: {
        generationMs: this.generationMs,
        modelBuildMs: this.modelBuildMs,
        preloadMaxSliceMs: this.preloadMaxSliceMs,
      },
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      canvas: {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
      },
      orbit: this.orbit.getState(),
    };
  }

  private isDoubleEndedChallenge(): boolean {
    return this.currentMode === 'random'
      && (this.puzzle?.challengeKind ?? this.currentLevel?.challengeKind) === 'double-ended';
  }
}
