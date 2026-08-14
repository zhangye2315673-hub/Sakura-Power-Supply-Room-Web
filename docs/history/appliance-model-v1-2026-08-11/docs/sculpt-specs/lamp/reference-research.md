# Lamp reference research

Date: 2026-08-07

This pass is a stylized/low-poly procedural reconstruction, not an exact hidden-side recovery. The supplied project model already defines the SAKURA palette and desk-lamp silhouette; web references were used for physical light-cone structure and articulated-product readability.

## Search record

The following exact image-search queries were fetched successfully (HTTP 200) before implementation:

- [street lamp light cone](https://www.google.com/search?tbm=isch&q=street+lamp+light+cone)
- [stylized lamp light cone](https://www.google.com/search?tbm=isch&q=stylized+lamp+light+cone)
- [volumetric cone light](https://www.google.com/search?tbm=isch&q=volumetric+cone+light)

Accessible implementation and form references:

- [Three.js SpotLight documentation](https://threejs.org/docs/#api/en/lights/SpotLight): a spotlight expands from the light position toward a target, with `angle`, `penumbra`, `distance`, and physical decay as separate controls.
- [Three.js spotlight example](https://threejs.org/examples/webgl_lights_spotlight.html): the visible illuminated footprint is broader than the emitting source and the target owns direction.
- [Blender light object manual](https://docs.blender.org/manual/en/latest/render/lights/light_object.html): a spot is a cone whose size controls cone width and blend softens its edge.
- [Sketchfab stylized desk-lamp search](https://sketchfab.com/search?type=models&q=stylized%20desk%20lamp): readable stylized lamps retain a separate base, stem, hinge/yoke, hollow shade/rim, and emitter recess instead of merging them into a single primitive.

## Observations translated into the build

1. The emitter mouth is the narrow end. It must start inside the shade and match the visible diffuser radius; the previous implementation reversed `CylinderGeometry`'s top and bottom radii.
2. The far footprint is wider than the shade mouth. The executable contract fixes `farRadius / sourceRadius = 3.35` and derives the physical `SpotLight.angle` from `atan2(farRadius, length)`.
3. A visible beam is not the real light. The build uses both a true `SpotLight` and a translucent additive cone, plus a separate volumetric ground pool.
4. A believable emitting head needs depth. The model therefore includes an open inner reflector and a volumetric bulb behind the diffuser.
5. Character motion must preserve the mechanical hinge. Directional looks target one hinge pivot and the light socket remains its child, so model, beam, spotlight, and ground pool cannot diverge.

## Hidden/approximate regions

- The original project reference path is unavailable/garbled, so reflector depth and bulb shape are inferred.
- The exact photometric candela distribution is not recoverable from the available image; the result is a deliberately readable SAKURA-stylized cone.
- The ground pool remains circular rather than computing an oblique ellipse; this follows the user's explicit circular-pool requirement.
