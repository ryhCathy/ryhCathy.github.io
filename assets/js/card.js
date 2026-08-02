/* Language switching + the avatar video interaction.
   No build step, no framework — this is a single static page on GitHub Pages. */
(function () {
  'use strict';

  var video     = document.getElementById('clip');
  var figure    = document.getElementById('avatar');
  var playBtn   = document.getElementById('play');
  var soundHint = document.getElementById('soundHint');

  /* ── Language ─────────────────────────────────────────────────────────
     Every translatable node carries data-en and data-zh. Swapping means
     rewriting textContent, plus pointing the video at the matching clip. */
  var STORE = 'cathy-lang';

  var LABEL = {
    en: { title: 'Cathy Huang — Exploring Personal AI',  play: 'Play introduction' },
    zh: { title: 'Cathy Huang — 探索 Personal AI 的未来', play: '播放自我介绍' }
  };

  /* The poster is a hand-picked still (eyes open, mouth closed) rather than
     frame 0, which for the English clip lands mid-syllable. Playback still
     starts at 0 so the introduction is never clipped; .playing cross-fades the
     video in so that jump from poster to frame 0 isn't a hard cut. */

  function applyLang(lang) {
    if (lang !== 'zh') { lang = 'en'; }

    document.documentElement.lang = (lang === 'zh') ? 'zh-CN' : 'en';
    document.documentElement.setAttribute('data-lang', lang);
    document.title = LABEL[lang].title;

    var nodes = document.querySelectorAll('[data-' + lang + ']');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = nodes[i].getAttribute('data-' + lang);
    }

    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].setAttribute('aria-pressed',
        String(buttons[j].getAttribute('data-set-lang') === lang));
    }

    playBtn.setAttribute('aria-label', LABEL[lang].play);
    swapClip(lang);

    try { localStorage.setItem(STORE, lang); } catch (e) { /* private mode */ }
  }

  /* The zh page plays the zh clip, the en page the en one. Reload the source
     only when it actually changes, so switching mid-playback isn't jarring. */
  function swapClip(lang) {
    var next   = video.getAttribute('data-src-' + lang);
    var poster = 'assets/img/avatar_' + lang + '.jpg';
    if (!next || video.getAttribute('src') === next) { return; }

    var wasPlaying = !video.paused && !video.ended;
    video.pause();
    video.removeAttribute('src');
    // A leftover <source> child would win over the src attribute below.
    while (video.firstChild) { video.removeChild(video.firstChild); }
    video.setAttribute('src', next);
    video.poster = poster;
    video.load();

    if (wasPlaying) {
      start();
    } else {
      stop();
    }
  }

  /* Initial language: ?lang= wins, then a previous choice, then the browser. */
  function initialLang() {
    var q = /[?&]lang=(zh|en)/.exec(location.search);
    if (q) { return q[1]; }
    try {
      var saved = localStorage.getItem(STORE);
      if (saved === 'zh' || saved === 'en') { return saved; }
    } catch (e) { /* ignore */ }
    return /^zh\b/i.test(navigator.language || '') ? 'zh' : 'en';
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('[data-set-lang]') : null;
    if (btn) { applyLang(btn.getAttribute('data-set-lang')); }
  });

  /* ── Playback ─────────────────────────────────────────────────────────
     Poster frame is frame 0 of the clip, so play looks like the still coming
     alive. Audio is the whole point of the introduction, so this never
     autoplays and never starts muted — it needs a real click. */
  function start() {
    figure.classList.add('starting');     // fade down before the frame swap
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {               // blocked; leave the poster up
        figure.classList.remove('starting');
        stop();
      });
    }
  }

  function stop() {
    figure.classList.remove('playing', 'starting');
    soundHint.classList.remove('show');
  }

  playBtn.addEventListener('click', function () {
    if (video.paused || video.ended) { start(); } else { video.pause(); }
  });

  // Clicking the frame while it plays pauses it, which is what people expect.
  video.addEventListener('click', function () {
    if (!video.paused && !video.ended) { video.pause(); }
  });

  video.addEventListener('play', function () {
    video.muted = false;                 // the introduction is the audio
    figure.classList.add('playing');
    // Frames are flowing now, so bring it back up.
    requestAnimationFrame(function () { figure.classList.remove('starting'); });
    // Remind about sound only once playback is really under way, then let the
    // reminder retire so it doesn't sit on top of her face for the whole clip.
    soundHint.classList.add('show');
    setTimeout(function () { soundHint.classList.remove('show'); }, 4200);
  });

  video.addEventListener('pause', stop);

  /* Reload rather than seeking to 0: that restores the chosen poster still
     instead of leaving frame 0 (mid-syllable in English) on screen. */
  video.addEventListener('ended', function () {
    stop();
    video.load();
  });

  /* ── Reveal on scroll ───────────────────────────────────────────────── */
  var targets = document.querySelectorAll(
    '.explore, .build-grid, .cred-block, .contact');

  if ('IntersectionObserver' in window) {
    for (var k = 0; k < targets.length; k++) { targets[k].classList.add('reveal'); }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    for (var m = 0; m < targets.length; m++) { io.observe(targets[m]); }
  }

  document.getElementById('year').textContent = new Date().getFullYear();
  applyLang(initialLang());
})();
