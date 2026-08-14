# SAKURA Rice Cooker v2 image analysis

## Intake

- Source: `references/intake-v2/rice-cooker/rice-cooker-turnsheet-v2.png`
- Provider route: OpenAI-compatible Comfly Image API
- Model: `gpt-image-2`, high quality, 2048x2048 PNG
- Views: orthographic front, right side, back, and matching three-quarter
- Suitability: pass. The object is isolated, non-planar, consistent across four views, and has no text, cable, motion effects, or scene props.

## Observed hierarchy

- Macro: squat rounded-rectangular body, thick domed lid, lower plinth, four feet.
- Meso: front vertical control island, front lid release, top steam cap, rear hinge barrel, rear U latch, rear power plate, side control.
- Micro: paired lamps, rocker bezel, lid crown stack, inlet holes, seam rails, outline hierarchy.

## Identity and form

- The width and height are nearly equal, but the broad body shoulder and low lid make the appliance read as squat rather than tall.
- Body and lid use broad 10-12 sided planar facets with restrained stepped chamfers.
- The fixed cream lid seat forms a strong horizontal belt between the pink lid and cream body.
- The front control island is centered and vertically elongated; the two lamps sit above one large rocker switch.
- The rear latch is a thick U loop mounted around the existing hinge barrel.

## Materials and lighting

- Warm cream molded shell, Sakura pink lid/control pieces, mint and coral indicator accents.
- Cool lavender shadow planes and dark plum-gray seams, inlet, feet, and ink.
- Runtime remains procedural Toon shading with no image textures or realistic PBR wear.
- Main/structure/detail outline targets are 0.0048/0.0041/0.0033 with stable object-space variation of 0.18.

## Frozen runtime contract

- Keep `rice-cooker-body-pivot`, `rice-cooker-lid-hinge-pivot`, `rice-cooker-inner-pot-pivot`, `rice-cooker-cook-switch-pivot`, `rice-cooker-rear-latch-pivot`, and `rice-cooker-airborne-rice-rig` unchanged.
- Keep lid hinge, release button, steam, switch, latch, and power sockets unchanged.
- Keep 30 bed kernels, 28 airborne kernels, eight volumetric steam pivots, and their existing animation metadata unchanged.
- New geometry must stay within the archived v1 envelope and preserve ground Y.

## Inference limits

- The hidden heater, wiring, lid seal, insulation, and underside fasteners are omitted.
- The reference shows a closed cooker; inner-pot clearance is constrained by the existing tested lid animation rather than inferred from the image.
- The four turnsheet cells are visual form evidence, not authority to move animation or connection anchors.
