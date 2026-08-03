# ryhcathy.github.io

A digital business card. One static page, no build step, no Jekyll — GitHub
Pages serves `index.html` directly.

## Deploy

Each redesign sits on top of the previous history as an ordinary commit, so
nothing is force-pushed and every earlier version stays in the log. The Jekyll
site is also kept on the `old-jekyll-site` branch and the `pre-redesign` tag.

```bash
git push origin main
```

Pages redeploys in about a minute. `.nojekyll` stops GitHub from trying to build
it as a Jekyll project — without it, Pages would look for `_config.yml` and the
theme that used to be here.

To roll back:

```bash
git revert <commit>          # or: git reset --hard pre-redesign && git push --force
```

Carried over from the Jekyll site: `CNAME` (currently empty — no custom
domain), `LICENSE`, `assets/files/curriculum_vitae.pdf`, and the favicons.

To preview locally first:

```bash
python3 -m http.server 8901   # then open http://127.0.0.1:8901/
```

## What's here

```
index.html                       the whole page; every translatable node carries data-en + data-zh
assets/css/card.css              light, navy accent; mobile-first with breakpoints at 640 and 900
assets/js/card.js                language switch, twin playback, Save Contact sheet
assets/fonts/is-{400,700}.woff2  Instrument Sans, subset to Latin
assets/img/poster.jpg            the resting still (see below)
assets/img/share.jpg             og:image
assets/img/vcard-qr.svg          the code in the Save Contact sheet
assets/video/twin_{zh,en}.mp4    the twin clips
assets/files/cathy-huang.vcf     the contact file, offered as a download
```

Fonts are self-hosted rather than pulled from Google Fonts: this page gets
opened in WeChat's in-app browser in mainland China, where `fonts.googleapis.com`
is unreachable and would leave the page in a fallback face after a long timeout.

## Language

Both languages live in one document. `applyLang()` rewrites `textContent` for
every `[data-en]` / `[data-zh]` node and points the video at the matching clip,
so the Chinese page plays the Chinese introduction and the English page the
English one. Translated `aria-label`s use `data-label-en` / `data-label-zh`,
because an aria-label can't be set from `textContent`. The choice persists in
`localStorage`; `?lang=zh` or `?lang=en` forces it, otherwise it follows the
browser — defaulting to Chinese on a zh device, since the card is shared in
WeChat more often than not.

Adding copy means adding **both** attributes — a node with only one will go
blank in the other language. To check:

```bash
grep -o '<[^>]*data-\(en\|zh\)="[^"]*"[^>]*>' index.html |
  grep -v 'data-en=.*data-zh=\|data-zh=.*data-en='
```

## The twin

The clips come from the pipeline in `../zk-avatar` (`./make_video.sh`), which
records the recipe in `RECIPE.md`. They're re-encoded here with `-movflags
+faststart` so playback can begin before the file finishes buffering.

**The poster is not frame 0.** For the English clip frame 0 lands mid-syllable —
eyes shut, mouth open — so `poster.jpg` is a hand-picked still with the eyes
open. Playback still starts at 0 so the introduction isn't clipped.

**The poster and the video must share `object-position`.** Both layers are
`object-fit:cover` on the same box at `50% 14%`; if they diverge, her head
visibly jumps and grows the moment the clip starts. Changing the crop means
changing it in both places.

**Audio is the point, so it never autoplays.** Browsers only allow unmuted
playback after a real gesture, and a muted digital twin is pointless — the whole
thing is her cloned voice. So it waits for a click, plays unmuted (falling back
to muted if blocked), and shows the sound reminder for ~4s before retiring it so
the badge doesn't sit on her face for the whole clip.

The play button keeps its label in a separate `<span class="twin-label">`,
because the language switch writes `textContent` — putting the label on the
button itself would delete the SVG icon.

## Save Contact

The page's primary job, so both Save Contact buttons open a sheet rather than
downloading straight away: a bottom sheet on the phone, a centred dialog from
640px up. It offers two routes because neither works everywhere — the QR is for
someone holding a second phone, and for WeChat's in-app browser where file
downloads are blocked; the `.vcf` is for whoever is already on the device.

The QR encodes the vCard **without** its `NOTE:` field. With the note the symbol
goes from version 11 to 14, and a denser code is measurably harder to scan off a
200px area on a screen. Regenerate it after editing the vcf:

```bash
python3 - <<'EOF'
import segno
q = segno.make(open('assets/files/cathy-huang.vcf').read().split('NOTE:')[0] + 'END:VCARD\r\n',
               error='m')
q.save('assets/img/vcard-qr.svg', kind='svg', scale=1, border=2,
       dark='#0f2c56', light=None, svgclass=None, lineclass=None, omitsize=True)
EOF
```
