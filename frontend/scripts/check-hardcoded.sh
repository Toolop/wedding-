#!/usr/bin/env bash
# Fails when colours or image paths are hard-coded outside their single source.
#   colours -> src/app/globals.css @theme (+ components/invitation/theme.ts)
#   images  -> src/components/invitation/assets.ts
# Illustration/map art keeps its own drawing colours (allowlisted below).
cd "$(dirname "$0")/../src" || exit 1
ALLOW='WatercolorArt.tsx|InteractiveMap.tsx|CrayonDoodles.tsx|Flowers.tsx'
fail=0

hex=$(grep -rnE '#[0-9A-Fa-f]{6}\b' components/invitation app/page.tsx --include=*.tsx --include=*.ts \
  | grep -vE "$ALLOW")
if [ -n "$hex" ]; then echo "Hard-coded hex (add a token in globals.css @theme):"; echo "$hex"; fail=1; fi

img=$(grep -rnE '"/images/' components app --include=*.tsx --include=*.ts | grep -v 'invitation/assets.ts')
if [ -n "$img" ]; then echo "Image path literal (add it to assets.ts):"; echo "$img"; fail=1; fi

[ $fail -eq 0 ] && echo "ok: no hard-coded colours or image paths"
exit $fail
