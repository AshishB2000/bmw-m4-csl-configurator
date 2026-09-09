# Attribution

The source code is MIT licensed (see `LICENSE`). The bundled assets are not — they are
redistributed here under their own terms, listed in full below.

## 3D model

**"BMW M4 CSL 2023"** by [Black Snow](https://sketchfab.com/BlackSnow02) — licensed
[**CC BY 4.0**](https://creativecommons.org/licenses/by/4.0/).
Source: <https://sketchfab.com/3d-models/bmw-m4-csl-2023-26d05968e63b4fc28205cbb9abb0ea41>

Shipped as `public/models/car.glb`. Changes made: deduplicated, pruned, welded and
Meshopt-compressed with [gltf-transform](https://gltf-transform.dev) (19.7 MB → 3.5 MB);
textures resized to 2K; stray geometry above the roofline removed at load time; materials
re-authored at runtime (clearcoat paint, transmission glass, tread-mapped tyres).

CC BY 4.0 allows redistribution and modification, commercial use included, provided the
author is credited and changes are indicated. Both are done here and in the running app,
which shows the credit behind the "i" button in the parts rail.

## HDRI environments

From [Poly Haven](https://polyhaven.com/hdris) — licensed [**CC0**](https://creativecommons.org/publicdomain/zero/1.0/)
(public domain, no attribution required; credited anyway).

| File | Source |
| --- | --- |
| `studio_small_09` (2K) | <https://polyhaven.com/a/studio_small_09> |
| `venice_sunset` (2K) | <https://polyhaven.com/a/venice_sunset> |
| `dikhololo_night` (1K) | <https://polyhaven.com/a/dikhololo_night> |
| `potsdamer_platz` (1K) | <https://polyhaven.com/a/potsdamer_platz> |

## Textures

`public/tex/tread_normal.png` and `public/tex/flake_normal.png` are generated
procedurally by a short script; no third-party rights apply.

## Trademarks

BMW, M4 and CSL are trademarks of Bayerische Motoren Werke AG. This is an unofficial,
non-commercial technical demo and is **not affiliated with, endorsed by, or sponsored by
BMW**. Part specifications are compiled from published figures for reference only and are
not authoritative service data.
