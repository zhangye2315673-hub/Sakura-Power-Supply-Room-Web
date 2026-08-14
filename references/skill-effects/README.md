# Skill effect asset intake

These references were generated through the Comfly OpenAI-compatible Image API with
`gpt-image-2`, then split into isolated intake images for the procedural Three.js pipeline.
The API key is not stored in this repository.

## Quality contract

- Target: real-time browser effect prop, readable around the central cable cluster.
- Style: Sakura appliance puzzle palette, chunky bevels, dark hull outline, cel shading.
- Geometry: stable named parts with reusable geometry/materials; no baked gameplay state.
- Rigging: every asset exposes a root, an attachment socket, and a pulse/cue/flip pivot.
- Runtime: transient cue instances are pooled by the shared model kit; persistent plug
  attachments are rebuilt only when their authoritative state signature changes.
- Performance: no texture sampling at runtime, no per-asset render scenes, and no effect
  model may affect collision, routing, removal order, or skill settlement.
- Evidence: every `intake/*/reference.png` passes the img2threejs reference admission
  check. The five generated boards remain supplementary multi-view/style evidence.

## Runtime mapping

The implementation is in `src/skill/SkillEffectModelKit.ts`. It covers:

- lamp spotlight crown; humidifier glass wiper; fan airflow ribbon;
- dehumidifier shield segments and droplets; refrigerator ice shell; hair-dryer heat ribbon;
- bubble shell, wave and membrane; radio sequence markers; kettle steam ribbon;
- blender energy shards; gacha card/frame; record note orb/rings; alarm time ring;
- popcorn heart/crown; stand-mixer status token; controller continue token and impact star;
- microwave double heat ring; induction heat ring; portable-speaker bass arcs.

`induction-pulse-disk` and `skill-selection-badge` are admitted supporting variants used as
shape evidence for `induction-heat-ring` and `gacha-card-frame`; they intentionally do not add
separate runtime factories.

Each intake directory also contains forge-generated `pre-spec-assessment.json` and
`object-sculpt-spec.json`. Runtime nodes expose `userData.sculptRuntime`, named components,
the source reference path, animation pivots, and an attachment socket.

The HUD status icons do not use generated images or the img2threejs pipeline. They follow the
same production method as the life and hint controls: one semantic text mark, a CSS polygon
silhouette, two flat color faces, a dark outline shadow, and a small state counter. The five BUFF
and six DEBUFF themes live in `src/styles.css`; `SkillChallengeUi.ts` supplies only the mark and
accessible text. The pending printer copy uses the same CSS-only construction.

Browser evidence lives under `review/`: each runtime factory has front, left, and right frames,
plus stable desktop and 390px-mobile HUD captures. `scripts/capture-skill-effect-review.mjs`
recreates these frames without changing production state or gameplay rules.

## Prompt set

The exact prompt batch used for the five boards is preserved in
`tmp/imagegen/skill-effect-assets.jsonl`. The microwave ring received one targeted regeneration
to turn the two concentric rings into a single coherent prop with four bridge clips after the
automatic admission gate correctly rejected the original disconnected composition.
