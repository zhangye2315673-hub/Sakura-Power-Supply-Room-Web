# Audio sources and licenses

## Runtime audio (release)

The release build currently ships two background tracks. Interaction, ambient, and appliance cues are synthesized at runtime with the Web Audio API; no third-party sound-effect recordings are shipped.

| File | Use | Source / author | License status |
| --- | --- | --- | --- |
| `public/release/audio/music/amenoprelude.mp3` | Main menu (`main`) | Embedded metadata identifies **甘茶の音楽工房** and the title `雨のプレリュード`; source library: <https://amachamusic.chagasi.com/> | The repository does not contain a license grant or attribution text for this recording. Confirm the author's current terms and any attribution requirement before public distribution. |
| `public/release/audio/music/reverie.mp3` | Gameplay (`gameplay`) | **Scott Buckley**, source page: <https://www.scottbuckley.com.au/library/reverie/> | The existing candidate notes identify this library as **CC BY 4.0**. Ship the required author/title/license attribution with the published game. |

The two files above are the only audio files copied by Vite into a release build. Keep this table in sync if a runtime track changes.

## Archived candidates (not shipped)

Unselected tracks, Kenney OGG samples, and audition pages are retained under `references/audio-candidates/` for provenance and future review. They are outside Vite's release `publicDir` and therefore are not copied to `dist/`.

### Kenney audio

The archived Kenney subset came from the locally supplied `E:\KenneyALLin1\Audio` collection. The supplied packs include `License.txt` files identifying the content as Creative Commons Zero (CC0). The archived filenames are under `references/audio-candidates/audio/kenney/`; source: <https://kenney.nl/assets>.

These files are not used by the runtime audio manager and are excluded from release builds.

### Scott Buckley candidates

`castles-in-the-sky.mp3` and `solace.mp3` remain archived under `references/audio-candidates/audio/music/`. Their audition pages recorded Scott Buckley's library URLs and CC BY 4.0 attribution requirement; they are not runtime assets.

### Other candidates

`shoukei.mp3` is retained under `references/audio-candidates/audio/japanese-candidates/`. Its provenance or license is not recorded in this repository, so it is excluded from release builds until verified.
