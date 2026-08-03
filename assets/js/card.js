/* ═══════════════════════════════════════════════════════════════════════════
   Three jobs: language switching, the AI-twin video, and the Save Contact sheet.
   No framework — the whole page is one screen of content, and a dependency
   would cost more than it saves.
   ═════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DUR = { en: '0:14', zh: '0:11' };   // real ffprobe durations: 13.56s / 11.24s

  var frame  = document.querySelector('.twin-frame');
  var video  = document.querySelector('.twin-video');
  var play   = document.querySelector('.twin-play');
  var sound  = document.querySelector('.twin-sound');
  var langBtns = Array.prototype.slice.call(document.querySelectorAll('.lang-btn'));

  var lang = 'en';
  var soundTimer = null;

  /* ── Language ─────────────────────────────────────────────────────────── */
  function applyLang(next) {
    lang = next;
    document.documentElement.lang = (next === 'zh') ? 'zh-CN' : 'en';

    document.querySelectorAll('[data-' + next + ']').forEach(function (el) {
      var v = el.getAttribute('data-' + next);
      if (v !== null) el.textContent = v;
    });
    // aria-label can't be set from textContent, so translated labels carry their
    // own attribute pair.
    document.querySelectorAll('[data-label-' + next + ']').forEach(function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + next));
    });

    langBtns.forEach(function (b) {
      var on = b.dataset.lang === next;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    // Swap the clip. Keep it stopped: switching language is not a request to
    // play, so this resets to the poster rather than autoplaying.
    if (video) {
      stop();
      video.src = video.getAttribute('data-src-' + next) || '';
    }

    try { localStorage.setItem('lang', next); } catch (e) {}

    var url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    history.replaceState(null, '', url);
  }

  langBtns.forEach(function (b) {
    b.addEventListener('click', function () { applyLang(b.dataset.lang); });
  });

  /* ── Video ────────────────────────────────────────────────────────────── */
  function stop() {
    if (!video) return;
    try { video.pause(); video.currentTime = 0; } catch (e) {}
    frame.classList.remove('is-playing');
    if (sound) sound.hidden = true;
    if (soundTimer) { clearTimeout(soundTimer); soundTimer = null; }
  }

  function start() {
    if (!video) return;
    // preload="none", so the src may not be attached until the first tap.
    if (!video.src) video.src = video.getAttribute('data-src-' + lang) || '';

    // Unmuted by default: her cloned voice is the point of the clip. If a
    // browser blocks unmuted playback, fall back to muted and say so, rather
    // than showing a control that silently does nothing.
    video.muted = false;
    frame.classList.add('is-playing');

    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        video.muted = true;
        video.play().catch(function () { stop(); });
      });
    }

    if (sound) {
      sound.hidden = false;
      soundTimer = setTimeout(function () { sound.hidden = true; }, 4200);
    }
  }

  if (play) {
    play.addEventListener('click', function () {
      if (frame.classList.contains('is-playing')) { stop(); } else { start(); }
    });
  }

  // Tapping the frame while playing stops it — the pill is hidden by then.
  if (frame) {
    frame.addEventListener('click', function (e) {
      if (e.target.closest('.twin-play')) return;
      if (frame.classList.contains('is-playing')) stop();
    });
  }

  if (video) {
    video.addEventListener('ended', stop);
    // A clip that fails to load should not leave the page showing a stuck
    // "playing" state over a blank box.
    video.addEventListener('error', stop);
  }

  /* ── Save Contact sheet ───────────────────────────────────────────────────
     `hidden` in the markup, so the state is right with JS off and before this
     runs — never a flash of an open dialog. Both Save Contact buttons open it. */
  var sheet = document.getElementById('sheet');
  var lastFocus = null;

  function openSheet() {
    if (!sheet) return;
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.body.style.overflow = 'hidden';
    var x = sheet.querySelector('.sheet-x');
    if (x) x.focus();
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = '';
    // Send focus back where it came from, or a keyboard user is stranded at the
    // top of the document.
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  document.querySelectorAll('.save-open').forEach(function (b) {
    b.addEventListener('click', openSheet);
  });

  if (sheet) {
    sheet.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', closeSheet);
    });
    // Downloading is the end of the task, so the sheet gets out of the way.
    var dl = sheet.querySelector('.sheet-dl');
    if (dl) dl.addEventListener('click', function () { setTimeout(closeSheet, 400); });
  }

  document.addEventListener('keydown', function (e) {
    if (!sheet || sheet.hidden) return;
    if (e.key === 'Escape') { closeSheet(); return; }
    // Keep Tab inside the open sheet: it is modal, and letting focus escape into
    // the page behind it is the usual way these break.
    if (e.key !== 'Tab') return;
    var f = sheet.querySelectorAll('a[href],button:not([disabled])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  var initial = 'en';
  var qs = new URLSearchParams(window.location.search).get('lang');
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}

  if (qs === 'zh' || qs === 'en') {
    initial = qs;
  } else if (saved === 'zh' || saved === 'en') {
    initial = saved;
  } else if (/^zh\b/i.test(navigator.language || '')) {
    // Shared in WeChat far more often than not, so a zh device gets zh first.
    initial = 'zh';
  }
  applyLang(initial);
})();
