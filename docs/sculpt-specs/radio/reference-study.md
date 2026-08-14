# Radio reference study

## Search record

- Query: `telescopic radio antenna motion`
  - Google search: https://www.google.com/search?q=telescopic%20radio%20antenna%20motion
  - Wikimedia Commons API: https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=telescopic%20radio%20antenna&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*
- Query: `stylized 3D sound wave radio speaker wave`
  - Google search: https://www.google.com/search?q=stylized%203D%20sound%20wave%20radio%20speaker%20wave
  - Three.js TubeGeometry reference: https://threejs.org/docs/#api/en/geometries/TubeGeometry
  - Three.js MeshPhysicalMaterial reference: https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial

## Observations used

- A portable radio telescopic antenna is a nested metal assembly: the thicker base tube remains at the hinge while smaller tubes translate outward along the same local axis. The joints retain visible overlap and collars; scaling one long cylinder would not read as telescoping.
- The vintage Channel Master 6512 and Zenith RF42 Commons photographs show the antenna mounted at a small rear/top hinge, folded obliquely while stored and close to vertical when used:
  - https://commons.wikimedia.org/wiki/File:Vintage_Channel_Master_Transistor_Radio_With_Telescopic_Antenna,_Model_6512,_2-Bands_(AM_%26_SW),_8_Transistors,_Detachable_Telescopic_Antenna,_Made_By_Sanyo_In_Japan,_Circa_1959_(49019088122).jpg
  - https://commons.wikimedia.org/wiki/File:Vintage_Zenith_Transistor_Radio,_Model_RF42,_AM-FM_Bands,_AC_%26_Battery_Operation,_Telescopic_Antenna,_Made_In_Taiwan,_Circa_1974_(49020569596).jpg
- A readable stylized sound field still needs a volumetric cross-section. The implementation therefore uses closed TubeGeometry curves with radial and depth undulation, not Line, Plane, Sprite, or a regular Torus.
- The wave normal follows the speaker socket's local +Z axis. The emitter begins in front of the grille and every velocity points farther outward, which establishes a no-body-crossing invariant.

## Stylization boundary

This is a SAKURA / low-poly interpretation, not an acoustic simulation. The expanding loops visualize rhythm and volume; their irregularity, tube volume, PBR highlight and staggered deformation are authored visual language rather than measured pressure values.
