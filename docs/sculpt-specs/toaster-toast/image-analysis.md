# Toaster toast performance prop — image analysis

## Suitability

Conditional pass. The 238 × 239 reference is sufficient for the identity silhouette and two-zone colour break, but not for reading pores or the hidden rear face. The runtime prop therefore targets a stylised Sakura/Three.js toast slice, not photogrammetric bread.

## Observed form

- Macro silhouette: a slightly tapered rectangular lower body, two rounded upper shoulders, and a shallow central crown notch. The bottom corners are rounded rather than square.
- Meso structure: a continuous baked crust shell surrounds a visibly inset crumb field. The crust remains thickest around the crown and side perimeter.
- Volume: the reference reads as a thick slice, so the performance prop must preserve front face, rear face, edge band and bevel during a full aerial flip.
- Colour zones: warm caramel/brown perimeter; pale cream/yellow crumb. The centre must not inherit the crust colour.
- Shading: the reference uses a soft top-left highlight, darker lower/right crust edge and contact-like occlusion at the crumb/crust boundary.

## Runtime hierarchy and motion contract

- `toast-performance-root`: pooled ballistic body and rotation pivot.
- `toast-crust-volume`: full-depth outer profile, toon-lit, with an inverted-hull outline.
- `toast-crumb-front` and `toast-crumb-back`: shallow inset profiles on both faces so the slice remains correct while flipping.
- Launch anchor: `toaster-external-toast-launch-socket` in the appliance rig.
- Flight: launch toward screen centre, reach the upper browser safe margin, rotate through the air, and remain alive until its projected bounds have left the bottom of the viewport.

## Hidden-view assumptions

- Rear crumb inset mirrors the front because no rear reference is supplied.
- Edge thickness and bevel radius are inferred for legibility at game scale.
- Fine pores are omitted: at runtime scale they would alias and are not supported by the low-resolution reference.

## Quality contract

The prop fails review if it reads as a flat card, a single-colour extrusion, a generic rounded rectangle, or disappears while still inside the viewport. It passes only when the crown notch, double shoulders, crust/crumb colour boundary, thickness, toon shading, outline and full ballistic lifecycle are simultaneously visible.
