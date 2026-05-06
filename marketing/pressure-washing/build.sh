#!/usr/bin/env bash
# Bridgepointe Pressure Washing — v2 graphics build
#
# Generates v2 of the six FB graphics PLUS 9:16 Story/Reel vertical covers.
# Brand convention:
#   - Top-left: full white-knockout BRIDGEPOINTE logo (emblem + wordmark)
#     from /marketing/brand/logo-white/bridgepointe-logo-white-512.png
#   - Top-right: small gold service tag "PRESSURE WASHING" + gold rule
#   - Charcoal background, accent color varies per graphic
#
# Usage: bash build.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT"
BRAND_DIR="$ROOT/../brand/logo-white"
LOGO="$BRAND_DIR/bridgepointe-logo-white-1024.png"   # full white logo (emblem + wordmark)

# ----- Brand tokens ----------------------------------------------------------
CHARCOAL="#0f0f0f"
WARM_WHITE="#f5f1e8"
GOLD="#b8956a"
RED="#f87171"
YELLOW="#fbbf24"
GREEN_COMM="#34d399"
MUTE="#6b6b6b"

# ----- Fonts -----------------------------------------------------------------
FONT_BOLD="/System/Library/Fonts/HelveticaNeue.ttc"
FONT_REG="/System/Library/Fonts/HelveticaNeue.ttc"

# ----- Helpers ---------------------------------------------------------------
# brand_bar <output_file> <canvas_W> <logo_w_px> <pad> <tag_pt>
# Writes the standard top-left logo + top-right service tag + gold rule.
brand_bar() {
  local img="$1" W="$2" logo_w="$3" pad="$4" tag_pt="$5"
  # Logo top-left
  magick "$img" \
    \( "$LOGO" -resize "${logo_w}x" \) \
    -gravity northwest -geometry "+${pad}+${pad}" -composite \
    "$img"
  # Top-right service tag (kerned uppercase) + gold rule below it
  local tag_y_px=$((pad + 18))
  local rule_w=$((tag_pt * 8))
  local rule_y=$((tag_y_px + tag_pt + 14))
  magick "$img" \
    -gravity northeast \
    -font "$FONT_BOLD" -pointsize "$tag_pt" \
    -fill "$GOLD" -kerning 5 \
    -annotate "+${pad}+${tag_y_px}" "PRESSURE WASHING" \
    -fill "$GOLD" \
    -draw "rectangle $((W - pad - rule_w)),$rule_y $((W - pad)),$((rule_y + 3))" \
    "$img"
}

# ----- 01 LAUNCH 1080x1080 ---------------------------------------------------
echo "Building 01-launch.png (1080x1080)…"
F="$OUT/01-launch.png"
W=1080 H=1080
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 200 50 22

magick "$F" \
  -gravity center \
  -font "$FONT_BOLD" -pointsize 130 -fill "$RED" -kerning 4 \
  -annotate "+0-40" "HOT WATER" \
  -font "$FONT_BOLD" -pointsize 92 -fill "$WARM_WHITE" -kerning 6 \
  -annotate "+0+70" "PRESSURE WASHING" \
  -font "$FONT_REG" -pointsize 30 -fill "$MUTE" -kerning 2 \
  -annotate "+0+200" "now booking · metro atlanta" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GOLD" -kerning 2 \
  -annotate "+0+120" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 22 -fill "$MUTE" -kerning 5 \
  -annotate "+0+80" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 01 LAUNCH 9:16 1080x1920 ---------------------------------------------
echo "Building 01-launch-9x16.png (1080x1920)…"
F="$OUT/01-launch-9x16.png"
W=1080 H=1920
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 240 60 26
# vertical gold accent rule
magick "$F" -fill "$GOLD" \
  -draw "rectangle $((W - 30)),420 $((W - 27)),$((H - 250))" "$F"

magick "$F" \
  -gravity center \
  -font "$FONT_BOLD" -pointsize 200 -fill "$RED" -kerning 6 \
  -annotate "+0-200" "HOT" \
  -font "$FONT_BOLD" -pointsize 200 -fill "$RED" -kerning 6 \
  -annotate "+0+10" "WATER" \
  -font "$FONT_BOLD" -pointsize 90 -fill "$WARM_WHITE" -kerning 6 \
  -annotate "+0+230" "PRESSURE" \
  -font "$FONT_BOLD" -pointsize 90 -fill "$WARM_WHITE" -kerning 6 \
  -annotate "+0+340" "WASHING" \
  -font "$FONT_REG" -pointsize 36 -fill "$MUTE" -kerning 3 \
  -annotate "+0+470" "now booking · metro atlanta" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 50 -fill "$GOLD" -kerning 3 \
  -annotate "+0+260" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" -kerning 5 \
  -annotate "+0+220" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 02 WHY HOT WATER 1080x1350 -------------------------------------------
echo "Building 02-why-hot-water.png (1080x1350)…"
F="$OUT/02-why-hot-water.png"
W=1080 H=1350
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 200 50 22

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 80 -fill "$WARM_WHITE" -kerning 1 \
  -annotate "+0+260" "Why Hot Water" \
  -font "$FONT_BOLD" -pointsize 80 -fill "$GOLD" -kerning 1 \
  -annotate "+0+360" "Matters." \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" \
  -annotate "+0+490" "Most Atlanta pressure washers use cold water." \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" \
  -annotate "+0+530" "This is what cold water costs you." \
  "$F"

draw_card() {
  local img="$1" y="$2" num="$3" title="$4" body1="$5" body2="$6"
  magick "$img" \
    -fill "#1a1a1a" -draw "roundrectangle 70,$y 1010,$((y + 175)) 12,12" \
    -gravity northwest \
    -font "$FONT_BOLD" -pointsize 56 -fill "$RED" \
    -annotate "+110+$((y + 50))" "$num" \
    -font "$FONT_BOLD" -pointsize 32 -fill "$WARM_WHITE" \
    -annotate "+220+$((y + 45))" "$title" \
    -font "$FONT_REG" -pointsize 22 -fill "$MUTE" \
    -annotate "+220+$((y + 95))" "$body1" \
    -font "$FONT_REG" -pointsize 22 -fill "$MUTE" \
    -annotate "+220+$((y + 130))" "$body2" \
    "$img"
}
draw_card "$F" 600  "01" "Kills mold + algae at the root" \
  "Cold water just rinses the surface. Hot water at" \
  "200 degrees stops regrowth for 12+ months."
draw_card "$F" 800  "02" "Dissolves grease + oil on contact" \
  "The only way to actually clean dumpster pads," \
  "exhaust hoods, gas station forecourts."
draw_card "$F" 1000 "03" "Cuts cleaning time roughly in half" \
  "Less time on your driveway means less surface" \
  "wear and a deeper clean per pass."

magick "$F" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 32 -fill "$GOLD" -kerning 2 \
  -annotate "+0+70" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 20 -fill "$MUTE" -kerning 5 \
  -annotate "+0+38" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 02 WHY HOT WATER 9:16 1080x1920 --------------------------------------
echo "Building 02-why-hot-water-9x16.png (1080x1920)…"
F="$OUT/02-why-hot-water-9x16.png"
W=1080 H=1920
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 240 60 26
magick "$F" -fill "$GOLD" \
  -draw "rectangle 30,420 33,$((H - 260))" "$F"

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 110 -fill "$WARM_WHITE" -kerning 1 \
  -annotate "+0+360" "Why Hot Water" \
  -font "$FONT_BOLD" -pointsize 110 -fill "$GOLD" -kerning 1 \
  -annotate "+0+490" "Matters." \
  -font "$FONT_REG" -pointsize 34 -fill "$MUTE" \
  -annotate "+0+660" "Most Atlanta crews use cold water." \
  -font "$FONT_REG" -pointsize 34 -fill "$MUTE" \
  -annotate "+0+710" "Here's what that costs you." \
  "$F"

draw_card_v() {
  local img="$1" y="$2" num="$3" title="$4" body1="$5" body2="$6"
  magick "$img" \
    -fill "#1a1a1a" -draw "roundrectangle 80,$y 1000,$((y + 220)) 14,14" \
    -gravity northwest \
    -font "$FONT_BOLD" -pointsize 64 -fill "$RED" \
    -annotate "+120+$((y + 70))" "$num" \
    -font "$FONT_BOLD" -pointsize 38 -fill "$WARM_WHITE" \
    -annotate "+240+$((y + 65))" "$title" \
    -font "$FONT_REG" -pointsize 26 -fill "$MUTE" \
    -annotate "+240+$((y + 120))" "$body1" \
    -font "$FONT_REG" -pointsize 26 -fill "$MUTE" \
    -annotate "+240+$((y + 158))" "$body2" \
    "$img"
}
draw_card_v "$F" 880  "01" "Kills mold at the root" \
  "Hot water at 200°F stops regrowth" \
  "for 12+ months. Cold just rinses."
draw_card_v "$F" 1130 "02" "Dissolves grease on contact" \
  "The only way to actually clean dumpster" \
  "pads, exhaust hoods, forecourts."
draw_card_v "$F" 1380 "03" "Cuts cleaning time in half" \
  "Less time on your driveway = less surface" \
  "wear and a deeper clean per pass."

magick "$F" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 50 -fill "$GOLD" -kerning 3 \
  -annotate "+0+260" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" -kerning 5 \
  -annotate "+0+220" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 03 POLLEN 1080x1080 --------------------------------------------------
echo "Building 03-pollen.png (1080x1080)…"
F="$OUT/03-pollen.png"
W=1080 H=1080
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 200 50 22

magick "$F" \
  -gravity center \
  -font "$FONT_BOLD" -pointsize 32 -fill "$YELLOW" -kerning 6 \
  -annotate "+0-260" "ATLANTA · MAY 2026" \
  -font "$FONT_BOLD" -pointsize 100 -fill "$WARM_WHITE" -kerning 1 \
  -annotate "+0-90" "Pollen Season" \
  -font "$FONT_BOLD" -pointsize 100 -fill "$YELLOW" -kerning 1 \
  -annotate "+0+25" "Is Brutal." \
  -font "$FONT_REG" -pointsize 32 -fill "$MUTE" \
  -annotate "+0+170" "Hot-water wash your siding, deck," \
  -font "$FONT_REG" -pointsize 32 -fill "$MUTE" \
  -annotate "+0+215" "and driveway in one afternoon." \
  -font "$FONT_BOLD" -pointsize 36 -fill "$YELLOW" \
  -annotate "+0+310" "Whole-house wash from \$250" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GOLD" -kerning 2 \
  -annotate "+0+120" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 22 -fill "$MUTE" -kerning 5 \
  -annotate "+0+80" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 03 POLLEN 9:16 -------------------------------------------------------
echo "Building 03-pollen-9x16.png (1080x1920)…"
F="$OUT/03-pollen-9x16.png"
W=1080 H=1920
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 240 60 26
magick "$F" -fill "$YELLOW" \
  -draw "rectangle $((W - 30)),420 $((W - 27)),$((H - 260))" "$F"

magick "$F" \
  -gravity center \
  -font "$FONT_BOLD" -pointsize 38 -fill "$YELLOW" -kerning 8 \
  -annotate "+0-450" "ATLANTA · MAY 2026" \
  -font "$FONT_BOLD" -pointsize 150 -fill "$WARM_WHITE" -kerning 1 \
  -annotate "+0-200" "Pollen" \
  -font "$FONT_BOLD" -pointsize 150 -fill "$WARM_WHITE" -kerning 1 \
  -annotate "+0-40" "Season" \
  -font "$FONT_BOLD" -pointsize 150 -fill "$YELLOW" -kerning 1 \
  -annotate "+0+120" "Is Brutal." \
  -font "$FONT_REG" -pointsize 38 -fill "$MUTE" \
  -annotate "+0+300" "Hot-water wash siding, deck," \
  -font "$FONT_REG" -pointsize 38 -fill "$MUTE" \
  -annotate "+0+350" "and driveway in one afternoon." \
  -font "$FONT_BOLD" -pointsize 50 -fill "$YELLOW" \
  -annotate "+0+460" "Whole-house wash from \$250" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 50 -fill "$GOLD" -kerning 3 \
  -annotate "+0+260" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" -kerning 5 \
  -annotate "+0+220" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 04 PRICING 1080x1080 -------------------------------------------------
echo "Building 04-pricing.png (1080x1080)…"
F="$OUT/04-pricing.png"
W=1080 H=1080
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 200 50 22

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 64 -fill "$WARM_WHITE" \
  -annotate "+0+250" "Pressure Washing" \
  -font "$FONT_REG" -pointsize 28 -fill "$GOLD" -kerning 4 \
  -annotate "+0+340" "Atlanta · 2026 Pricing" \
  "$F"

draw_row() {
  local img="$1" y="$2" service="$3" price="$4" hilite="$5"
  local svc_color="$WARM_WHITE"
  local pr_color="$GOLD"
  if [ "$hilite" = "1" ]; then
    svc_color="$GOLD"; pr_color="$GOLD"
  fi
  magick "$img" \
    -gravity northwest \
    -fill "$svc_color" -font "$FONT_REG" -pointsize 30 \
    -annotate "+90+$y" "$service" \
    -gravity northeast \
    -fill "$pr_color" -font "$FONT_BOLD" -pointsize 30 \
    -annotate "+90+$y" "$price" \
    -gravity northwest \
    -fill "#252525" -draw "rectangle 90,$((y + 50)) 990,$((y + 51))" \
    "$img"
}

ROW_Y=440; ROW_DY=64
draw_row "$F" $ROW_Y                      "Whole-house soft wash"           "from \$250"      0
draw_row "$F" $((ROW_Y + ROW_DY))         "Driveway (1 or 2 car)"           "from \$125"      0
draw_row "$F" $((ROW_Y + ROW_DY * 2))     "Deck cleaning + brightener"      "from \$250"      0
draw_row "$F" $((ROW_Y + ROW_DY * 3))     "Roof soft wash"                  "from \$400"      0
draw_row "$F" $((ROW_Y + ROW_DY * 4))     "Concrete patio / pool deck"      "\$0.20 / sqft"   0
draw_row "$F" $((ROW_Y + ROW_DY * 5))     "Bundle: house + driveway"        "from \$325"      1
draw_row "$F" $((ROW_Y + ROW_DY * 6))     "Bundle: full exterior"           "from \$700"      1

magick "$F" \
  -gravity south \
  -font "$FONT_REG" -pointsize 22 -fill "$MUTE" \
  -annotate "+0+165" "Free on-site estimates  ·  Hot-water rig  ·  2-year guarantee" \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GOLD" -kerning 2 \
  -annotate "+0+110" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 22 -fill "$MUTE" -kerning 5 \
  -annotate "+0+70" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 04 PRICING 9:16 ------------------------------------------------------
echo "Building 04-pricing-9x16.png (1080x1920)…"
F="$OUT/04-pricing-9x16.png"
W=1080 H=1920
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 240 60 26
magick "$F" -fill "$GOLD" \
  -draw "rectangle $((W - 30)),420 $((W - 27)),$((H - 260))" "$F"

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 92 -fill "$WARM_WHITE" \
  -annotate "+0+360" "Pressure Washing" \
  -font "$FONT_REG" -pointsize 36 -fill "$GOLD" -kerning 5 \
  -annotate "+0+480" "Atlanta · 2026 Pricing" \
  "$F"

draw_row_v() {
  local img="$1" y="$2" service="$3" price="$4" hilite="$5"
  local svc_color="$WARM_WHITE"
  local pr_color="$GOLD"
  if [ "$hilite" = "1" ]; then
    svc_color="$GOLD"; pr_color="$GOLD"
  fi
  magick "$img" \
    -gravity northwest \
    -fill "$svc_color" -font "$FONT_REG" -pointsize 36 \
    -annotate "+80+$y" "$service" \
    -gravity northeast \
    -fill "$pr_color" -font "$FONT_BOLD" -pointsize 36 \
    -annotate "+80+$y" "$price" \
    -gravity northwest \
    -fill "#252525" -draw "rectangle 80,$((y + 60)) 1000,$((y + 61))" \
    "$img"
}

ROW_Y=620; ROW_DY=110
draw_row_v "$F" $ROW_Y                      "Whole-house soft wash"      "from \$250"      0
draw_row_v "$F" $((ROW_Y + ROW_DY))         "Driveway (1 or 2 car)"      "from \$125"      0
draw_row_v "$F" $((ROW_Y + ROW_DY * 2))     "Deck cleaning + brightener" "from \$250"      0
draw_row_v "$F" $((ROW_Y + ROW_DY * 3))     "Roof soft wash"             "from \$400"      0
draw_row_v "$F" $((ROW_Y + ROW_DY * 4))     "Concrete / pool deck"       "\$0.20 / sqft"   0
draw_row_v "$F" $((ROW_Y + ROW_DY * 5))     "Bundle: house + driveway"   "from \$325"      1
draw_row_v "$F" $((ROW_Y + ROW_DY * 6))     "Bundle: full exterior"      "from \$700"      1

magick "$F" \
  -gravity south \
  -font "$FONT_REG" -pointsize 26 -fill "$MUTE" \
  -annotate "+0+330" "Free estimates · Hot-water rig · 2-year guarantee" \
  -font "$FONT_BOLD" -pointsize 50 -fill "$GOLD" -kerning 3 \
  -annotate "+0+260" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" -kerning 5 \
  -annotate "+0+220" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 05 BEFORE/AFTER 1080x540 ---------------------------------------------
echo "Building 05-before-after-template.jpg (1080x540)…"
F="$OUT/05-before-after-template.jpg"
W=1080 H=540

# Find placeholder photos (preserves the v1 convention of demo pairs)
PHOTO_DIR="/Users/williambeltz/Documents/bridgepointe/Bridgepoint/public/images"
PHOTO1=""; PHOTO2=""
if [ -d "$PHOTO_DIR" ]; then
  # Use a temporary file to avoid SIGPIPE killing 'find' under set -e
  set +e
  find "$PHOTO_DIR" -maxdepth 4 -type f \( -iname "*.jpg" -o -iname "*.jpeg" \) ! -iname "logo*" 2>/dev/null > /tmp/ba-cands.txt
  set -e
  PHOTO1=$(sed -n '1p' /tmp/ba-cands.txt)
  PHOTO2=$(sed -n '2p' /tmp/ba-cands.txt)
fi

if [ -n "$PHOTO1" ] && [ -n "$PHOTO2" ] && [ -f "$PHOTO1" ] && [ -f "$PHOTO2" ]; then
  echo "Using photo placeholders: $PHOTO1 / $PHOTO2"
  magick \
    \( "$PHOTO1" -auto-orient -resize 540x470^ -gravity center -extent 540x470 \) \
    \( "$PHOTO2" -auto-orient -resize 540x470^ -gravity center -extent 540x470 \) \
    +append /tmp/ba-row.jpg
  magick \
    \( /tmp/ba-row.jpg \) \
    \( -size 1080x70 canvas:"$CHARCOAL" \) \
    -append "$F"
else
  echo "No photo placeholders found; rendering grey panels"
  magick \
    \( -size 540x470 canvas:"#3a3a3a" \) \
    \( -size 540x470 canvas:"#5a5a5a" \) \
    +append /tmp/ba-row.jpg
  magick /tmp/ba-row.jpg \( -size 1080x70 canvas:"$CHARCOAL" \) -append "$F"
fi

# BEFORE / AFTER pill labels (top corners over photos)
magick "$F" \
  -fill "$RED" -draw "roundrectangle 30,30 230,90 8,8" \
  -fill "$GREEN_COMM" -draw "roundrectangle $((W/2 + 30)),30 $((W/2 + 230)),90 8,8" \
  -font "$FONT_BOLD" -pointsize 28 -fill "$WARM_WHITE" -kerning 6 \
  -gravity northwest -annotate "+72+50" "BEFORE" \
  -gravity northwest -annotate "+$((W/2 + 80))+50" "AFTER" \
  "$F"

# Bottom brand bar (charcoal strip already built in)
magick "$F" \
  \( "$LOGO" -resize 130x \) -gravity southwest -geometry "+25+8" -composite \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 20 -fill "$WARM_WHITE" -kerning 4 \
  -annotate "+30+25" "HOT-WATER PRESSURE WASHING" \
  -gravity southeast \
  -font "$FONT_BOLD" -pointsize 22 -fill "$GOLD" -kerning 2 \
  -annotate "+30+24" "(862) 421-8973" \
  "$F"

# ----- 05 BEFORE/AFTER 9:16 1080x1920 (stacked vertically) ------------------
echo "Building 05-before-after-template-9x16.jpg (1080x1920)…"
F="$OUT/05-before-after-template-9x16.jpg"
W=1080 H=1920

# Layout: top header 320, BEFORE 720, AFTER 720, bottom safe zone 160 = 1920
HEADER_H=320
PHOTO_H=720
FOOTER_H=160

if [ -n "$PHOTO1" ] && [ -n "$PHOTO2" ] && [ -f "$PHOTO1" ] && [ -f "$PHOTO2" ]; then
  magick \
    \( -size 1080x${HEADER_H} canvas:"$CHARCOAL" \) \
    \( "$PHOTO1" -auto-orient -resize 1080x${PHOTO_H}^ -gravity center -extent 1080x${PHOTO_H} \) \
    \( "$PHOTO2" -auto-orient -resize 1080x${PHOTO_H}^ -gravity center -extent 1080x${PHOTO_H} \) \
    \( -size 1080x${FOOTER_H} canvas:"$CHARCOAL" \) \
    -append "$F"
else
  magick \
    \( -size 1080x${HEADER_H} canvas:"$CHARCOAL" \) \
    \( -size 1080x${PHOTO_H} canvas:"#3a3a3a" \) \
    \( -size 1080x${PHOTO_H} canvas:"#5a5a5a" \) \
    \( -size 1080x${FOOTER_H} canvas:"$CHARCOAL" \) \
    -append "$F"
fi

# Header overlay: brand_bar + headline
brand_bar "$F" $W 220 50 22
magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 36 -fill "$WARM_WHITE" -kerning 5 \
  -annotate "+0+230" "HOT-WATER TRANSFORMATION" \
  "$F"

# BEFORE pill on top photo (y starts at HEADER_H = 320, place pill near top of photo)
magick "$F" \
  -fill "$RED" -draw "roundrectangle 40,$((HEADER_H + 30)) 240,$((HEADER_H + 90)) 8,8" \
  -font "$FONT_BOLD" -pointsize 28 -fill "$WARM_WHITE" -kerning 6 \
  -gravity northwest -annotate "+82+$((HEADER_H + 50))" "BEFORE" \
  "$F"

# AFTER pill on bottom photo
AFTER_Y=$((HEADER_H + PHOTO_H + 30))
magick "$F" \
  -fill "$GREEN_COMM" -draw "roundrectangle 40,$AFTER_Y 240,$((AFTER_Y + 60)) 8,8" \
  -font "$FONT_BOLD" -pointsize 28 -fill "$WARM_WHITE" -kerning 6 \
  -gravity northwest -annotate "+88+$((AFTER_Y + 20))" "AFTER" \
  "$F"

# Footer
magick "$F" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 40 -fill "$GOLD" -kerning 3 \
  -annotate "+0+90" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 24 -fill "$MUTE" -kerning 5 \
  -annotate "+0+50" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 06 COMMERCIAL 1080x1080 ----------------------------------------------
echo "Building 06-commercial.png (1080x1080)…"
F="$OUT/06-commercial.png"
W=1080 H=1080
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 200 50 22

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 28 -fill "$GREEN_COMM" -kerning 6 \
  -annotate "+0+240" "FOR COMMERCIAL ACCOUNTS" \
  -font "$FONT_BOLD" -pointsize 84 -fill "$WARM_WHITE" \
  -annotate "+0+320" "Hot Water +" \
  -font "$FONT_BOLD" -pointsize 84 -fill "$GREEN_COMM" \
  -annotate "+0+420" "Degreaser." \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" \
  -annotate "+0+540" "The only thing that actually cleans:" \
  "$F"

draw_bullet() {
  local img="$1" x="$2" y="$3" text="$4"
  magick "$img" \
    -gravity northwest \
    -fill "$GREEN_COMM" -draw "circle $x,$((y + 14)) $((x + 7)),$((y + 14))" \
    -font "$FONT_REG" -pointsize 26 -fill "$WARM_WHITE" \
    -annotate "+$((x + 30))+$y" "$text" \
    "$img"
}
BL_X=170; BL_Y=630; BL_DY=54
draw_bullet "$F" $BL_X $BL_Y                 "Restaurant dumpster pads + grease traps"
draw_bullet "$F" $BL_X $((BL_Y + BL_DY))     "Kitchen exhaust hood pads + drip lines"
draw_bullet "$F" $BL_X $((BL_Y + BL_DY * 2)) "Gas station forecourts + parking decks"
draw_bullet "$F" $BL_X $((BL_Y + BL_DY * 3)) "Fleet trailers, box trucks, equipment"

magick "$F" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 28 -fill "$GREEN_COMM" \
  -annotate "+0+170" "Monthly + quarterly contracts available" \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GOLD" -kerning 2 \
  -annotate "+0+110" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 22 -fill "$MUTE" -kerning 5 \
  -annotate "+0+70" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

# ----- 06 COMMERCIAL 9:16 ---------------------------------------------------
echo "Building 06-commercial-9x16.png (1080x1920)…"
F="$OUT/06-commercial-9x16.png"
W=1080 H=1920
magick -size ${W}x${H} canvas:"$CHARCOAL" "$F"
brand_bar "$F" $W 240 60 26
magick "$F" -fill "$GREEN_COMM" \
  -draw "rectangle 30,420 33,$((H - 260))" "$F"

magick "$F" \
  -gravity north \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GREEN_COMM" -kerning 8 \
  -annotate "+0+360" "FOR COMMERCIAL ACCOUNTS" \
  -font "$FONT_BOLD" -pointsize 130 -fill "$WARM_WHITE" \
  -annotate "+0+460" "Hot Water" \
  -font "$FONT_BOLD" -pointsize 130 -fill "$WARM_WHITE" \
  -annotate "+0+600" "+ Degreaser." \
  -font "$FONT_REG" -pointsize 36 -fill "$MUTE" \
  -annotate "+0+800" "The only thing that actually cleans:" \
  "$F"

draw_bullet_v() {
  local img="$1" x="$2" y="$3" text="$4"
  magick "$img" \
    -gravity northwest \
    -fill "$GREEN_COMM" -draw "circle $x,$((y + 18)) $((x + 9)),$((y + 18))" \
    -font "$FONT_REG" -pointsize 32 -fill "$WARM_WHITE" \
    -annotate "+$((x + 36))+$y" "$text" \
    "$img"
}
BL_X=120; BL_Y=940; BL_DY=80
draw_bullet_v "$F" $BL_X $BL_Y                 "Restaurant dumpster pads + grease"
draw_bullet_v "$F" $BL_X $((BL_Y + BL_DY))     "Kitchen exhaust hood pads"
draw_bullet_v "$F" $BL_X $((BL_Y + BL_DY * 2)) "Gas station forecourts + decks"
draw_bullet_v "$F" $BL_X $((BL_Y + BL_DY * 3)) "Fleet trailers, box trucks"

magick "$F" \
  -gravity south \
  -font "$FONT_BOLD" -pointsize 36 -fill "$GREEN_COMM" \
  -annotate "+0+340" "Monthly + quarterly contracts" \
  -font "$FONT_BOLD" -pointsize 50 -fill "$GOLD" -kerning 3 \
  -annotate "+0+260" "(862) 421-8973" \
  -font "$FONT_REG" -pointsize 28 -fill "$MUTE" -kerning 5 \
  -annotate "+0+220" "BRIDGEPOINTEPAINTING.COM" \
  "$F"

echo
echo "Done. File inventory:"
cd "$OUT"
for f in 0*.png 0*.jpg; do
  [ -f "$f" ] && magick identify -format "%f  %wx%h  %b\n" "$f"
done
