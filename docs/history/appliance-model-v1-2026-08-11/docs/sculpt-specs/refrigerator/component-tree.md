# Refrigerator component tree and runtime contract

```text
appliance-model-refrigerator
├─ refrigerator-cabinet-frame
│  ├─ rear inset shell
│  ├─ left/right load rails
│  ├─ top / freezer divider / bottom rails
│  └─ base plinth + feet + rear service assembly
├─ refrigerator-upper-interior-content
│  └─ freezer back / walls / ceiling / floor / shelf / light
├─ refrigerator-lower-interior-content
│  └─ main back / walls / ceiling / floor / two shelves / drawer / light
├─ refrigerator-upper-door-pivot
│  └─ door shell / liner / handle / upper door bin
├─ refrigerator-lower-door-pivot
│  └─ door shell / liner / handle / three lower door bins
└─ refrigerator-food-performance-root
   ├─ milk-carton pivot
   ├─ fish pivot
   ├─ steak pivot
   ├─ storage-box pivot
   ├─ fruit-basket pivot
   ├─ vegetables pivot
   └─ drink-bottle pivot
```

## Topology choices

- Cabinet, shelves, bins and package bodies: `assembled-solid`, rounded box or extruded rigid profile.
- Milk silhouette and steak silhouette: `continuous-sculpt` 2D profile extruded to real depth.
- Fish and fruit bodies: `continuous-sculpt`, faceted sphere/ellipsoid plus separately attached features.
- Bottle: `assembled-solid` lathe-like stacked cylinders with shoulder, cap and thick label plate.
- Carrot leaves and broccoli florets: small `assembled-solid` cone/icosahedron clusters, never plane cards.
- Door gasket and shelf lips: `surface-relief` represented as geometry because they change the gameplay-scale silhouette.

## Pivot and socket table

| Part | Pivot | Socket / home | Contact |
| --- | --- | --- | --- |
| Upper door | `refrigerator-upper-door-pivot` | `refrigerator-upper-door-socket` | right-edge hinge |
| Lower door | `refrigerator-lower-door-pivot` | `refrigerator-lower-door-socket` | right-edge hinge |
| Handles | `*-handle-pivot` | `*-handle-socket` | paired standoff overlap |
| Shelf props | `refrigerator-prop-*-pivot` | `refrigerator-home-*-socket` under root | shelf or drawer surface contact |
| Door drink | `refrigerator-prop-drink-bottle-pivot` | door-local `refrigerator-home-drink-bottle-socket` | lower door-bin base contact |
| Party path | root-owned prop pivots | four left/right front/rear waypoint sockets | collision-clear free motion |

The moving props are never reparented during animation. This keeps baseline restoration deterministic and lets both game and gallery sample exactly the same local-space path.
