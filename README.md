# ryhcathy.github.io

An AI-era digital identity card. One static page, no build step, no Jekyll —
GitHub Pages serves `index.html` directly.

## Deploy

The redesign sits on top of the previous history as an ordinary commit, so
nothing was force-pushed and the old site stays in the log. It's also kept on
the `old-jekyll-site` branch and the `pre-redesign` tag.

```bash
git push origin main
```

Pages redeploys in about a minute. `.nojekyll` stops GitHub from trying to build
it as a Jekyll project — without it, Pages would look for `_config.yml` and the
theme that used to be here.

To roll back:

```bash
git revert <redesign-commit>       # or: git reset --hard pre-redesign && git push --force
```

Carried over from the Jekyll site: `CNAME` (currently empty — no custom
domain), `LICENSE`, `assets/files/curriculum_vitae.pdf`, the favicons, and the
old `assets/img/avatar.jpg`. The Jekyll machinery (`_config.yml`, `_sass/`,
`_layouts/`, `_data/`, `Gemfile`, theme READMEs) was removed.

To preview locally first:

```bash
python3 -m http.server 8901   # then open http://127.0.0.1:8901/
```

## What's here

```
index.html            the whole page; every translatable node carries data-en + data-zh
assets/css/card.css   dark by default, light via prefers-color-scheme
assets/js/card.js     language switch + avatar playback
assets/img/avatar_{zh,en}.jpg   poster stills
assets/video/cathy_{zh,en}.mp4  the avatar clips
```

## Language

Both languages live in one document. `applyLang()` rewrites `textContent` for
every `[data-en]` / `[data-zh]` node and points the video at the matching clip,
so the Chinese page plays the Chinese introduction and the English page the
English one. The choice persists in `localStorage`; `?lang=zh` or `?lang=en`
forces it, otherwise it follows the browser.

Adding copy means adding **both** attributes — a node with only one will go
blank in the other language. To check:

```bash
grep -o '<[^>]*data-\(en\|zh\)="[^"]*"[^>]*>' index.html |
  grep -v 'data-en=.*data-zh=\|data-zh=.*data-en='
```

## The avatar

The clips come from the pipeline in `../zk-avatar` (`./make_video.sh`), which
records the recipe in `RECIPE.md`. Source files are
`outputs/cathy-card/v3_{zh,en}_raw.mp4`, re-encoded here with `-movflags
+faststart` so playback can begin before the file finishes buffering.

Two details worth knowing before regenerating them:

**The poster is not frame 0.** For the English clip frame 0 lands mid-syllable —
eyes shut, mouth open. The posters are hand-picked stills (eyes open, mouth
closed): zh at 3.20s, en at 7.20s. Playback still starts at 0 so the
introduction isn't clipped, and `.starting` cross-fades the handover so the
jump from poster to frame 0 doesn't read as a glitch.

To reselect after regenerating, sample the clip and score frames on eye
contrast over mouth contrast — a closed mouth is smooth, open eyes give dark
pupils against sclera:

```bash
ffmpeg -i v3_en_raw.mp4 -vf "fps=5,scale=224:384" /tmp/cand/en_%03d.png
# then pick the frame maximising eye_std / mouth_std, and cut it at (N-1)/5 s
ffmpeg -ss 7.20 -i v3_en_raw.mp4 -vframes 1 -q:v 2 assets/img/avatar_en.jpg
```

**Audio is the point, so it never autoplays.** Browsers only allow unmuted
playback after a real gesture, and a muted digital avatar is pointless — the
whole thing is her cloned voice. So it waits for a click, plays unmuted, and
shows the sound reminder for ~4s before retiring it so the badge doesn't sit on
her face for the whole clip.

The play button keeps its label in a separate `<span class="play-label">`
because the language switch writes `textContent` — putting the label on the
button itself would delete the SVG icon.
