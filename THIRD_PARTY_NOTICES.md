# Third-party notices

## Sakura Crossing

Arrow Cube adapts visual-system ideas and selected implementation patterns from
the parent repository, Sakura Crossing:

- cel-shaded gradient ramps
- cool violet shadow tint
- warm key / cool fill lighting
- depth-based ink pass
- split-tone color grade
- painted sky palette and UI language

Sakura Crossing is licensed under the MIT License.

Copyright (c) 2026 Kenton Wang

The full MIT license text is included in `LICENSE`.

## Runtime music

The release build includes the following background recordings. Interaction,
ambient, and appliance cues are generated with the Web Audio API and do not add
third-party recordings to the release package.

### Scott Buckley — “Reverie”

- Author: Scott Buckley
- Source: <https://www.scottbuckley.com.au/library/reverie/>
- File: `public/release/audio/music/reverie.mp3`
- License: CC BY 4.0, as recorded in the project's audio candidate notes
- Attribution: retain the author, title, source, and CC BY 4.0 notice in any
  public release that distributes this recording

### 甘茶の音楽工房 — “雨のプレリュード”

- Author and title are taken from the file's embedded metadata
- Source library recorded by the project: <https://amachamusic.chagasi.com/>
- File: `public/release/audio/music/amenoprelude.mp3`
- License: the repository currently has no copied license grant or attribution
  text for this recording; verify the author's current terms before public
  distribution and add the required attribution here

Unselected music, Kenney OGG samples, and audition pages are archived under
`references/audio-candidates/` and are excluded from the release build.
