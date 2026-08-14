# SAKURA Robot Vacuum v2 image analysis

- Source: `references/intake-v2/robot-vacuum/robot-vacuum-turnsheet-v2.png`
- Intended use: procedural Three.js game appliance with an existing animation rig.
- Suitability: pass after splitting. The four-panel sheet is not one connected foreground, but all four independent view crops pass technical and semantic admission.

## Macro form

- Low, broad disc with a roughly 3.3:1 diameter-to-body-height ratio.
- Twelve-sided cream chassis, recessed dark lower skirt, stepped cream shoulder and broad Sakura-pink top plate.
- Independent front semicircle bumper occupies the dominant front arc without changing the circular collision envelope.

## Meso structure

- Rear-biased raised LiDAR turret has a recessed seat, cream tower, dark optical window and pink cap.
- Two top buttons form a small vertical cluster between the front and LiDAR.
- Front sensor band is a thick dark annular sector integrated into the bumper.
- Underside retains two drive wheels, front caster, central roller bay, paired contacts, battery cover and two separate three-arm edge brushes.

## Micro details and material response

- Visible planar facets use two or three Toon bands instead of smooth PBR gradients.
- Warm cream and Sakura pink carry the main volumes; cool lavender shadows and dark plum-black rubber/sensors prevent a one-note palette.
- Main silhouette, structural seams and small hardware use three stable outline tiers at 0.0048, 0.0041 and 0.0033 with object-space variation of 0.18.

## Frozen runtime evidence

- Existing motion, chassis, bumper, LiDAR, main brush, left/right side brush and left/right drive wheel pivots remain authoritative.
- Existing sockets and local transforms are not inferred from the generated sheet and must remain exact.
- The generated front view shows both side brushes more prominently than the runtime camera; their model positions remain frozen to the existing underside contract.

## Hidden or inferred

- Internal dust bin, fan, motor, gearbox, suspension, battery cells, wiring and LiDAR optics are omitted.
- Exact underside fastener depth and cliff-sensor internals remain simplified procedural volumes.
