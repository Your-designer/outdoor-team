/* ═══════════════════════════════════════════════════
   R-PARK v2 - Clean start
   Locomotive Scroll v5 + GSAP ScrollTrigger
   ═══════════════════════════════════════════════════ */
(() => {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);

  // ── Always start from top on reload ──
  window.scrollTo(0, 0);
  history.scrollRestoration = 'manual';

  // ── Locomotive Scroll v5 (Lenis inside) - drives native window scroll,
  //    ScrollTrigger uses its default (window) scroller, no proxy needed.
  const locoScroll = new LocomotiveScroll({
    lenisOptions: {
      lerp: 0.1,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 2,
    },
    scrollCallback: () => ScrollTrigger.update(),
  });
  // Доступ к Locomotive из других скриптов (quote-модалка в index.html) для корректного lock/unlock скролла
  window.__locoScroll = locoScroll;

  // ── Theme Toggle ──
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  function syncThemedLogos(theme) {
    // Лого с двумя версиями (data-logo-light / data-logo-dark) - подменяем src
    // по теме. invert-filter не используем: он красит зелёный лист в magenta.
    document.querySelectorAll('img[data-logo-light][data-logo-dark]').forEach((img) => {
      const next = theme === 'dark' ? img.dataset.logoDark : img.dataset.logoLight;
      if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
    });
  }
  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('rpark-theme', theme);
    syncThemedLogos(theme);
  }
  // Sync once on load для текущей темы (savedTheme может быть null)
  syncThemedLogos(html.getAttribute('data-theme') || 'light');

  const savedTheme = localStorage.getItem('rpark-theme');
  if (savedTheme) setTheme(savedTheme);

  const themeToggleMenu = document.getElementById('themeToggleMenu');
  const toggleTheme = () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  };
  themeToggle?.addEventListener('click', toggleTheme);
  themeToggleMenu?.addEventListener('click', toggleTheme);

  // ══════════════════════════════════════════
  // Language switcher (RU / EN)
  // Аналог skyrider - словарь в i18n.js, ключи через data-i18n / data-i18n-html / data-i18n-attr-*.
  // ══════════════════════════════════════════
  const I18N = (window.RPARK_I18N || { ru: {}, en: {} });
  if (!I18N.ru) I18N.ru = {};
  const LANG_KEY = 'rpark-lang';
  const langToggle      = document.getElementById('langToggle');
  const langToggleMenu  = document.getElementById('langToggleMenu');
  const langLabel       = document.getElementById('langLabel');
  const langLabelMenu   = document.getElementById('langLabelMenu');
  const I18N_ATTRS = ['placeholder', 'alt', 'aria-label', 'title', 'content'];
  let i18nSnapshotted = false;

  // Снимем оригинальные RU-значения один раз - это страховка от того, что
  // ru словарь в i18n.js не заполнен (используем DOM как источник правды).
  function snapshotRu() {
    if (i18nSnapshotted) return;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const k = el.getAttribute('data-i18n');
      if (k && I18N.ru[k] === undefined) I18N.ru[k] = el.textContent;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const k = el.getAttribute('data-i18n-html');
      if (k && I18N.ru[k] === undefined) I18N.ru[k] = el.innerHTML;
    });
    I18N_ATTRS.forEach((attr) => {
      document.querySelectorAll(`[data-i18n-attr-${attr}]`).forEach((el) => {
        const k = el.getAttribute(`data-i18n-attr-${attr}`);
        if (k && I18N.ru[k] === undefined) I18N.ru[k] = el.getAttribute(attr) || '';
      });
    });
    i18nSnapshotted = true;
  }

  function applyLang(lang) {
    snapshotRu();
    const dict = I18N[lang] || {};
    const fallback = I18N.ru || {};
    const pick = (key) => {
      const v = dict[key];
      if (typeof v === 'string' && v.length) return v;
      const r = fallback[key];
      if (typeof r === 'string' && r.length) return r;
      return null;
    };
    // 1) text content
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = pick(el.getAttribute('data-i18n'));
      if (v !== null) el.textContent = v;
    });
    // 2) innerHTML (br/em-friendly)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = pick(el.getAttribute('data-i18n-html'));
      if (v !== null) el.innerHTML = v;
    });
    // 3) attributes
    I18N_ATTRS.forEach((attr) => {
      document.querySelectorAll(`[data-i18n-attr-${attr}]`).forEach((el) => {
        const v = pick(el.getAttribute(`data-i18n-attr-${attr}`));
        if (v !== null) el.setAttribute(attr, v);
      });
    });
    // 4) state on root
    html.setAttribute('lang', lang);
    document.body && document.body.setAttribute('data-lang', lang);
    const lbl = lang === 'ru' ? 'EN' : 'RU';
    if (langLabel)     langLabel.textContent     = lbl;
    if (langLabelMenu) langLabelMenu.textContent = lbl;
    localStorage.setItem(LANG_KEY, lang);
    // notify listeners (catalog, cases, finlab) so they can re-render
    document.dispatchEvent(new CustomEvent('rpark:langchange', { detail: { lang } }));
  }

  const savedLang = (localStorage.getItem(LANG_KEY) === 'en') ? 'en' : 'ru';
  applyLang(savedLang);

  function toggleLang() {
    const current = (document.body && document.body.getAttribute('data-lang')) || 'ru';
    applyLang(current === 'ru' ? 'en' : 'ru');
  }
  langToggle?.addEventListener('click', toggleLang);
  langToggleMenu?.addEventListener('click', toggleLang);

  // ── Navigation: Shrink on scroll ──
  const nav = document.getElementById('nav');
  ScrollTrigger.create({
    start: 80,
    end: 99999,
    onEnter: () => nav?.classList.add('nav--scrolled'),
    onLeaveBack: () => nav?.classList.remove('nav--scrolled'),
  });

  // ── Burger menu - mobile fullscreen overlay ──
  const navBurger = document.getElementById('navBurger');
  const navMenu   = document.getElementById('navMenu');
  function closeNavMenu() {
    navMenu?.classList.remove('is-open');
    navBurger?.classList.remove('is-open');
    navBurger?.setAttribute('aria-expanded', 'false');
    navMenu?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }
  function openNavMenu() {
    navMenu?.classList.add('is-open');
    navBurger?.classList.add('is-open');
    navBurger?.setAttribute('aria-expanded', 'true');
    navMenu?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    if (navMenu) navMenu.scrollTop = 0;
  }
  navBurger?.addEventListener('click', () => {
    if (navMenu?.classList.contains('is-open')) closeNavMenu(); else openNavMenu();
  });
  document.querySelectorAll('[data-nav-close]').forEach((el) => {
    el.addEventListener('click', () => closeNavMenu());
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu?.classList.contains('is-open')) closeNavMenu();
  });

  // ══════════════════════════════════════════
  // HERO: Frame-sequence scroll (Apple-style)
  // ══════════════════════════════════════════
  const heroCanvas = document.getElementById('heroCanvas');
  const heroVideoWrap = document.getElementById('heroVideoWrap');
  const heroProgressFill = document.getElementById('heroProgressFill');
  const heroHeadline = document.getElementById('heroHeadline');
  const heroBottombar = document.getElementById('heroBottombar');
  const heroCycle = heroBottombar ? heroBottombar.querySelector('.hero__cycle') : null;
  const heroCycleSteps = document.querySelectorAll('.hero__cycle-step');
  const heroCycleLineFill = document.getElementById('heroCycleLineFill');
  const chapters = document.querySelectorAll('.hero__chapter');
  const NUM_CHAPTERS = chapters.length;

  // Chapters animate from 12% → 88% of scroll progress (first 12% is headline)
  const CH_START = 0.12;
  const CH_END = 0.88;
  const CH_SPAN = CH_END - CH_START;

  const TOTAL_FRAMES = 241;
  const frames = [];
  let framesLoaded = 0;
  let currentFrame = -1;
  const ctx = heroCanvas ? heroCanvas.getContext('2d') : null;

  function preloadFrames() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      // НИЗКИЙ приоритет: кадры hero не должны вытеснять картинки контента из канала.
      // Браузер сначала грузит обычные <img> страницы, кадры — на свободной полосе.
      img.decoding = 'async';
      try { img.fetchPriority = 'low'; } catch (e) {}
      img.src = `media/frames/frame_${String(i).padStart(3, '0')}.jpg`;
      img.onload = () => {
        framesLoaded++;
        if (framesLoaded === 1 && heroCanvas) {
          heroCanvas.width = img.naturalWidth;
          heroCanvas.height = img.naturalHeight;
          ctx.drawImage(img, 0, 0);
        }
        if (framesLoaded === TOTAL_FRAMES) {
          window.__rpFramesReady = true;
          if (window.__rpOnFramesReady) window.__rpOnFramesReady();
        }
      };
      img.onerror = () => {
        window.__rpFramesError = true;                 // кадр не загрузился - кадровый режим небезопасен
        if (window.__rpOnFramesReady) window.__rpOnFramesReady();
      };
      frames.push(img);
    }
  }

  function drawFrame(index) {
    // Защита: applyHeroState может вызваться на onRefresh ДО загрузки кадров
    // (или с NaN-индексом при раннем refresh) - тогда frames[index] = undefined.
    if (!Number.isFinite(index)) return;
    if (index === currentFrame) return;
    if (index < 0 || index >= frames.length) return;
    const img = frames[index];
    if (!img || !img.complete || !ctx) return;
    currentFrame = index;
    ctx.drawImage(img, 0, 0);
  }

  // ── РАЗВИЛКА hero. Решение «кадры vs видео» принимается ОДИН раз в прелоадере.
  //    Кадры грузим только если хотим кадровый hero (десктоп+быстрый инет, флаг
  //    из <head>). После раскрытия страницы режим уже не меняется. ─────────────
  const heroVideo = document.getElementById('heroVideo');
  let heroST = null;          // ScrollTrigger hero (присвоим ниже)

  // Переход в кадровый режим — вызывается из прелоадера, ТОЛЬКО если все кадры догрузились.
  window.__rpEnterFrameMode = function () {
    document.documentElement.classList.remove('hero-video-mode');
    window.HERO_FALLBACK = false;
    if (heroVideo) { try { heroVideo.pause(); heroVideo.currentTime = 0; } catch (e) {} }
    if (heroVideoWrap) heroVideoWrap.style.removeProperty('--hero-wrap-s');
  };

  // Видео-режим: запустить hero-видео с начала (вызывается из прелоадера при раскрытии).
  // Дополнительно: нижняя полоса (01/02/03/04) заполняется как progress-bar ПО ХОДУ ВИДЕО
  // (по currentTime/duration), затем по 'ended' плавно исчезает. Логика перенесена из
  // index-fallback.html. Работает ТОЛЬКО в hero-video-mode (где реально играет видео);
  // в frame-scrub режиме полоса по-прежнему ведётся скроллом в applyHeroState — её не трогаем.
  let __rpHeroVidRaf = null;
  function __rpDriveHeroProgress() {
    if (!heroVideo || !document.documentElement.classList.contains('hero-video-mode')) return;
    const fill = heroCycleLineFill;
    const steps = heroCycleSteps;
    const N = steps.length || 4;
    let lastStep = -1;
    // Полоса должна тикать линейно вслед за видео, а не плавать на 0.6s ease из CSS.
    if (fill) fill.style.transition = 'width 0.12s linear';
    function tick() {
      if (!heroVideo.duration || isNaN(heroVideo.duration)) {
        __rpHeroVidRaf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.max(0, Math.min(1, heroVideo.currentTime / heroVideo.duration));
      if (fill) fill.style.width = (t * 100) + '%';
      const stepIdx = Math.min(N - 1, Math.floor(t * N + 0.0001));
      if (stepIdx !== lastStep) {
        steps.forEach((row, i) => row.classList.toggle('is-active', i <= stepIdx));
        lastStep = stepIdx;
      }
      if (heroVideo.paused || heroVideo.ended) return;
      __rpHeroVidRaf = requestAnimationFrame(tick);
    }
    heroVideo.addEventListener('ended', function () {
      try {
        if (fill) fill.style.width = '100%';
        steps.forEach((row) => row.classList.add('is-active'));
        // Полосу НЕ прячем по окончании видео - она остаётся заполненной (100%)
        // и угасает только вместе с заголовками/нижним баром при скролле
        // (heroBottombar.opacity ведётся скроллом в applyHeroState).
      } catch (e) {}
    }, { once: true });
    if (fill) fill.style.width = '0%';
    if (__rpHeroVidRaf) cancelAnimationFrame(__rpHeroVidRaf);
    __rpHeroVidRaf = requestAnimationFrame(tick);
  }

  window.__rpStartHeroVideo = function () {
    if (heroVideo && document.documentElement.classList.contains('hero-video-mode')) {
      try { heroVideo.currentTime = 0; var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
      __rpDriveHeroProgress();
    }
  };

  if (window.__rpWantFrames && heroCanvas && ctx) {
    preloadFrames();   // по достижении всех TOTAL_FRAMES выставит window.__rpFramesReady
  }

  // Hero scroll animation - works on both desktop and mobile. On mobile
  // CSS shortens the pin zone to 250vh so the frame-scrub still fires
  // but the empty scroll between sections is gone.
  const IS_MOBILE = window.matchMedia('(max-width: 900px)').matches;
  if (heroVideoWrap) {
    // Состояние hero вынесено в функцию, чтобы применять его и на onRefresh -
    // иначе при загрузке/обновлении ПОСЕРЕДИНЕ страницы (hero уже проскроллен)
    // финальное состояние не проставлялось и шаги цикла налезали друг на друга.
    const applyHeroState = (p) => {

        // Frame sequence (отключаем в HERO_FALLBACK режиме — там <video> играется сам)
        if (!window.HERO_FALLBACK) {
          const frameProgress = Math.min(p / 0.88, 1);
          const frameIndex = Math.round(frameProgress * (TOTAL_FRAMES - 1));
          drawFrame(frameIndex);
        }

        // Progress bar
        if (heroProgressFill) heroProgressFill.style.width = (p * 100) + '%';

        // Bottom bar + live counter fade out BEFORE the card shrinks,
        // so the shrunk tile never carries a leftover timeline ribbon.
        // В HERO_FALLBACK opacity полосы ведётся по видео (progress-bar + fade на 'ended'),
        // поэтому скролл-fade здесь применяем ТОЛЬКО в кадровом режиме.
        if (heroBottombar && !window.HERO_FALLBACK) {
          let fade = 1;
          if (p > 0.78 && p < 0.86) fade = 1 - (p - 0.78) / 0.08;
          else if (p >= 0.86) fade = 0;
          heroBottombar.style.opacity = fade;
          heroBottombar.style.transform = `translateY(${(1 - fade) * 18}px)`;
        }

        // Cycle timeline: highlight active step + drive progress line fill
        // В HERO_FALLBACK таймлайн ведётся по video.currentTime (см. index-fallback.html), не по скроллу.
        if (heroCycleSteps.length && !window.HERO_FALLBACK) {
          const pNorm = p < CH_START ? 0
            : p > CH_END ? 1
            : (p - CH_START) / CH_SPAN;
          const stepIdx = Math.min(NUM_CHAPTERS - 1, Math.floor(pNorm * NUM_CHAPTERS));
          heroCycleSteps.forEach((row, i) => row.classList.toggle('is-active', i <= stepIdx));
          if (heroCycleLineFill) {
            // Fill line proportionally (centered on active step)
            const fillPct = Math.max(4, Math.min(100, (stepIdx + 1) / NUM_CHAPTERS * 100 - 12));
            heroCycleLineFill.style.width = fillPct + '%';
          }
        }

        // Hero headline: fully visible 0 → 0.05, fades out 0.05 → 0.11, gone before chapters start
        if (heroHeadline) {
          let hp = 1;
          if (p > 0.05 && p < 0.11) hp = 1 - (p - 0.05) / 0.06;
          else if (p >= 0.11) hp = 0;
          heroHeadline.style.opacity = hp;
          heroHeadline.style.transform = `translateY(${(1 - hp) * -24}px)`;
        }

        // Chapters - mapped to 12-88% of scroll.
        // Fast fade-in (so the plate actually catches the eye) + long
        // visible hold + fast fade-out. No leading dead-zone.
        const chapterDuration = CH_SPAN / NUM_CHAPTERS;
        chapters.forEach((ch, i) => {
          const chStart   = CH_START + i * chapterDuration;
          const chFadeIn  = chStart;                                 // was +6%
          const chVisible = chStart + chapterDuration * 0.12;        // was +20%
          const chFadeOut = chStart + chapterDuration * 0.85;        // was +82%
          const chEnd     = chStart + chapterDuration;

          let opacity = 0;
          let y = 50;

          if (p >= chFadeIn && p <= chVisible) {
            const t = (p - chFadeIn) / Math.max(0.001, chVisible - chFadeIn);
            opacity = t;
            y = 50 * (1 - t);
          } else if (p > chVisible && p < chFadeOut) {
            opacity = 1;
            y = 0;
          } else if (p >= chFadeOut && p <= chEnd) {
            const t = (p - chFadeOut) / Math.max(0.001, chEnd - chFadeOut);
            opacity = 1 - t;
            y = -30 * t;
          }

          ch.style.opacity = opacity;
          ch.style.transform = `translateY(${y}px)`;
        });

        // Shrink to small card.
        // FALLBACK: при скролле весь hero-UI скейлится КАК ЕДИНОЕ ЦЕЛОЕ:
        //  - video-wrap уменьшается через inset (рамка)
        //  - .hero__headline (заголовок + USP-чипы) уменьшается через transform: scale
        //  - .hero__bottombar (cycle + live) уменьшается синхронно
        // Всё это происходит на первой половине scroll-зоны, без холостой прокрутки.
        // ORIGINAL: shrink в последних 12% длинной 900vh-зоны.
        if (window.HERO_FALLBACK) {
          // Плавный shrink: полный к ~85% скролла, последние 15% — pin'нутое состояние.
          const shrinkP = Math.min(p / 0.85, 1);
          const eased = 1 - Math.pow(1 - shrinkP, 3);

          // ── Шринк video-wrap через CSS-переменную ──
          // Видео+bottombar шринкаются как ЕДИНОЕ ФОТО (без flex-перевёрстки).
          // На ТЕЛЕФОНЕ уменьшаем МЕНЬШЕ: финал крупнее и шире (заполняет пустоту,
          // вокруг сполза́ют 2 картинки треугольником). Десктоп-фоллбэк — как был (0.18).
          const wrapScale = IS_MOBILE ? (1 - eased * 0.46)   // финал ~54% (крупнее/шире)
                                      : (1 - eased * 0.82);  // десктоп: финал ~18%
          heroVideoWrap.style.setProperty('--hero-wrap-s', wrapScale);
          // Прогресс скролла для мобильного треугольника картинок (0→1), читается из CSS.
          // ВАЖНО: ставим на <html>, а НЕ на heroVideoWrap — плитки .hero__mob-tiles
          // его соседи (не потомки), CSS-переменная вбок не наследуется.
          if (IS_MOBILE) document.documentElement.style.setProperty('--hero-mob-p', eased.toFixed(3));
          // Закругления растут с шринком: на маленьком кадре финал ~80px — soft pill-card
          heroVideoWrap.style.borderRadius = (eased * 80) + 'px';
          heroVideoWrap.style.inset = '0';

          // Headline (центральный заголовок) — fade
          const headScale = 1 - eased * 0.55;
          if (heroHeadline) {
            heroHeadline.style.transform = `scale(${headScale}) translateY(${-20 * eased}px)`;
            heroHeadline.style.transformOrigin = '50% 50%';
            heroHeadline.style.opacity = Math.max(0, 1 - eased * 3.2);
          }
          // USP-чипы — агрессивный fade (вылетают за край раньше всех)
          const usp = document.getElementById('heroUsp');
          if (usp) {
            usp.style.transform = `scale(${1 - eased * 0.65}) translateX(${eased * 40}px)`;
            usp.style.transformOrigin = '100% 50%';
            usp.style.opacity = Math.max(0, 1 - eased * 4.5);
          }
          // Bottombar (cycle-этапы + 4 парка) — ВНУТРИ wrap'a и шринкается вместе с ним.
          // Opacity полосы ВЕДЁТСЯ ПО ВИДЕО (progress-bar + fade на 'ended'), поэтому на
          // скролле НЕ перетираем её — иначе полоса гасла бы при первом же скролле.
          // Лишь как страховка (если 'ended' не сработал) — прячем на самом мелком кадре.
          if (heroBottombar) {
            heroBottombar.style.transform = '';
            // Весь бар (этапы + «4 парка в работе») гаснет ВМЕСТЕ с уменьшением
            // карточки — как только начинаем скроллить.
            heroBottombar.style.opacity = Math.max(0, 1 - eased * 2.4);
          }
        } else if (p > 0.88) {
          const shrinkP = (p - 0.88) / 0.12;
          const eased = 1 - Math.pow(1 - shrinkP, 3);
          const insetY = IS_MOBILE ? 22 : 38;
          const insetX = IS_MOBILE ? 8  : 40;
          heroVideoWrap.style.inset = `${eased * insetY}vh ${eased * insetX}vw`;
          heroVideoWrap.style.borderRadius = (eased * 16) + 'px';
        } else {
          heroVideoWrap.style.inset = '0';
          heroVideoWrap.style.borderRadius = '0';
        }
    };

    heroST = ScrollTrigger.create({
      trigger: '.hero',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => applyHeroState(self.progress),
      // onRefresh применяет состояние при пересчёте (в т.ч. на загрузке/обновлении
      // посередине страницы) - фиксит «сломанную» сжатую карточку при reload не с верха.
      onRefresh: (self) => applyHeroState(self.progress),
    });
  }

  // ══════════════════════════════════════════
  // INTRO: Waabi-style scattered cards + reveals
  // ══════════════════════════════════════════

  // Count-up animation
  function animateCountUp(el) {
    const target = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(target)) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        el.textContent = Math.round(obj.val);
      }
    });
  }

  // Parallax on scattered photo cards - subtle, not a rave
  document.querySelectorAll('.intro__card').forEach((card, i) => {
    const speed = parseFloat(card.getAttribute('data-scroll-speed') || 0);
    const direction = i % 2 === 0 ? -1 : 1;

    gsap.to(card, {
      y: () => speed * 90 * direction,
      ease: 'none',
      scrollTrigger: {
        trigger: '.intro',
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.2,
      }
    });

    // Fade in on enter
    gsap.from(card, {
      opacity: 0,
      scale: 0.85,
      duration: 0.8,
      ease: 'power3.out',
      delay: i * 0.08,
      scrollTrigger: {
        trigger: '.intro',
        start: 'top 80%',
        once: true,
      }
    });
  });

  // Center text reveal
  const introEyebrow = document.querySelector('.intro__eyebrow');
  const introTitle = document.querySelector('.intro__title');
  const introDesc = document.querySelector('.intro__desc');

  if (introEyebrow) {
    gsap.from(introEyebrow, {
      opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
      scrollTrigger: { trigger: introEyebrow, start: 'top 85%', once: true },
    });
  }

  if (introTitle) {
    gsap.from(introTitle, {
      opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: introTitle, start: 'top 85%', once: true },
      delay: 0.1,
    });
  }

  if (introDesc) {
    gsap.from(introDesc, {
      opacity: 0, y: 30, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: introDesc, start: 'top 85%', once: true },
      delay: 0.2,
    });
  }

  // ── Magnetic buttons - original CTAs (strong pull) ──
  document.querySelectorAll('[data-magnetic]').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.28, y: y * 0.28, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.35)' });
    });
  });

  // ── Magnetic pull for the broader interactive set (subtle 18%) ──
  // Same physics, gentler strength, applied to chips, arrows, nav buttons
  // and other small precise targets so they all feel "alive" near the cursor.
  const pullSel = '.hero__cta, .intro__about-btn, .about__cta, .pill, .forwhom__item-arrow, .catalog__arrow, .voices__nav, .lightbox__close, .lightbox__nav, .nav__cta, .nav__theme-btn, .calc__chip, .finlab__chip, .finlab__stress-opt';
  document.querySelectorAll(pullSel).forEach(btn => {
    if (btn.hasAttribute('data-magnetic')) return; // already bound above
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x * 0.18, y: y * 0.18, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.55, ease: 'elastic.out(1, 0.4)' });
    });
  });

  // ── Smooth anchor scrolling (through Locomotive Scroll) ──
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      locoScroll.scrollTo(target, { offset: -80 });
    });
  });



  // ══════════════════════════════════════════
  // INTRO STATS: count-up on scroll-in
  // ══════════════════════════════════════════
  document.querySelectorAll('.intro__stat-num[data-count]').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: () => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        const obj = { v: 0 };
        gsap.from(el.closest('.intro__stat'), {
          opacity: 0, y: 18, duration: 0.5, ease: 'power3.out', delay: i * 0.07,
        });
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out', delay: i * 0.07,
          onUpdate: () => { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });

  // ══════════════════════════════════════════
  // FOR WHOM: interactive segments
  // ══════════════════════════════════════════
  const forwhomItems = document.querySelectorAll('.forwhom__item');
  const forwhomImg = document.getElementById('forwhomImg');
  const forwhomMetric = document.getElementById('forwhomMetric');
  const forwhomMetricLabel = document.getElementById('forwhomMetricLabel');

  // Предзагружаем все картинки сегментов, чтобы при наведении они появлялись
  // мгновенно (раньше браузер скачивал webp на лету и был серый flash).
  forwhomItems.forEach((it) => {
    var u = it.dataset.image;
    if (u) { var p = new Image(); p.decoding = 'async'; p.src = u; }
  });

  function fwField(item, key) {
    const en = item.dataset[key + 'En'];
    if (((document.body && document.body.getAttribute('data-lang')) || 'ru') === 'en' && en) return en;
    return item.dataset[key];
  }

  function activateForwhom(item) {
    forwhomItems.forEach(i => i.classList.remove('is-active'));
    item.classList.add('is-active');
    const img = item.dataset.image;
    const metric = fwField(item, 'metric');
    const label = fwField(item, 'metricLabel');
    if (forwhomImg && img) {
      // Мгновенная смена без 320мс задержки. Класс is-swapping даёт лёгкий
      // 180мс fade, а сам src меняется в той же кадре - без серого экрана.
      forwhomImg.classList.add('is-swapping');
      forwhomImg.style.backgroundImage = `url('${img}')`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => forwhomImg.classList.remove('is-swapping'));
      });
    }
    if (forwhomMetric && metric) {
      gsap.fromTo(forwhomMetric, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
      forwhomMetric.textContent = metric;
    }
    if (forwhomMetricLabel && label) {
      gsap.fromTo(forwhomMetricLabel, { opacity: 0 }, { opacity: 1, duration: 0.6, delay: 0.15 });
      forwhomMetricLabel.textContent = label;
    }
  }
  forwhomItems.forEach(item => {
    item.addEventListener('mouseenter', () => activateForwhom(item));
    item.addEventListener('click', () => activateForwhom(item));
  });
  // При смене языка перезаливаем подписи активной карточки
  document.addEventListener('rpark:langchange', () => {
    const active = document.querySelector('.forwhom__item.is-active');
    if (active) activateForwhom(active);
  });

  // ══════════════════════════════════════════
  // CATALOG: real models by category + tabs
  // ══════════════════════════════════════════
  // 3D-модели трасс - сортированы из AI-рендеров в images/models/.
  // Pattern: картинки подбираются под тип из CATALOG_IMG карты ниже.
  const CATALOG_IMG = {
    'rope-support-01': 'images/models/rope-support-01.webp',
    'rope-support-02': 'images/models/rope-support-02.webp',
    'rope-tree-01':    'images/models/rope-tree-01.webp',
    'rope-tree-02':    'images/models/rope-tree-02.webp',
    'rope-tree-252':   'images/models/rope-tree-252.webp',
    'rope-tree-253':   'images/models/rope-tree-253.webp',
    'skyrider-01':     'images/models/skyrider-01.webp',
    'skyrider-02':     'images/models/skyrider-02.webp',
    'trolls-01':       'images/models/trolls-01.webp',
    'trolls-02':       'images/models/trolls-02.webp',
    'maze-01':         'images/models/maze-01.webp',
  };
  const CATALOG_DATA = {
    'rope-parks': [
      { title: '1 трасса, 8 этапов',     title_en: '1 route, 8 stages',     type: 'На деревьях',  type_en: 'Tree based',   area: 612,  stages: 8,  tracks: 1, income: '4 200 000',  img: CATALOG_IMG['rope-tree-252'],    url: 'https://rope-park.ru/catalog/rope-parks/252' },
      { title: '2 трассы, 20 этапов',    title_en: '2 routes, 20 stages',   type: 'На деревьях',  type_en: 'Tree based',   area: 2600, stages: 20, tracks: 2, income: '5 040 000',  img: CATALOG_IMG['rope-tree-253'],    url: 'https://rope-park.ru/catalog/rope-parks/253' },
      { title: '2 трассы, 16 этапов',    title_en: '2 routes, 16 stages',   type: 'На опорах',    type_en: 'On supports',  area: 170,  stages: 16, tracks: 2, income: '5 775 000',  img: CATALOG_IMG['rope-support-01'], url: 'https://rope-park.ru/catalog/rope-parks/245' },
      { title: '1 трасса, 16 этапов',    title_en: '1 route, 16 stages',    type: 'На опорах',    type_en: 'On supports',  area: 225,  stages: 16, tracks: 1, income: '4 375 000',  img: CATALOG_IMG['rope-support-02'], url: 'https://rope-park.ru/catalog/rope-parks/244' },
      { title: 'Парк-комплекс, 7 трасс', title_en: 'Park complex, 7 routes',type: 'В помещении',  type_en: 'Indoor',       area: 1378, stages: 72, tracks: 7, income: '20 425 000', img: CATALOG_IMG['rope-support-01'], url: 'https://rope-park.ru/catalog/rope-parks/259', featured: true },
      { title: '2 трассы, 12 этапов',    title_en: '2 routes, 12 stages',   type: 'Модульный',    type_en: 'Modular',      area: 124,  stages: 12, tracks: 2, income: '4 025 000',  img: CATALOG_IMG['rope-support-02'], url: 'https://rope-park.ru/catalog/rope-parks/267' },
      { title: '2 трассы, 16 этапов',    title_en: '2 routes, 16 stages',   type: 'Модульный',    type_en: 'Modular',      area: 170,  stages: 16, tracks: 2, income: '4 536 000',  img: CATALOG_IMG['rope-tree-02'],    url: 'https://rope-park.ru/catalog/rope-parks/236' },
      { title: 'Мини-парк 5,6×7,9м',     title_en: 'Mini park 5.6 × 7.9 m', type: 'Детский',      type_en: 'Kids',         area: 45,   stages: 10, tracks: 1, income: '3 150 000',  img: CATALOG_IMG['rope-support-02'], url: 'https://rope-park.ru/catalog/rope-parks/232' },
      { title: 'Мини-парк 5,6×11,8м',    title_en: 'Mini park 5.6 × 11.8 m',type: 'Детский',      type_en: 'Kids',         area: 66,   stages: 14, tracks: 1, income: '4 550 000',  img: CATALOG_IMG['rope-tree-01'],    url: 'https://rope-park.ru/catalog/rope-parks/231' },
    ],
    'trolls': [
      { title: 'Два троллея, 91/147 м',  title_en: 'Two zip lines, 91/147 m', type: 'Троллей',     type_en: 'Zip line',       area: null, stages: 2, tracks: 2, income: '10 500 000', img: CATALOG_IMG['trolls-02'], url: 'https://rope-park.ru/catalog/trolls/263', featured: true },
      { title: 'Мобильный троллей',      title_en: 'Mobile zip line',         type: 'Троллей 50 м',type_en: 'Zip line 50 m',  area: 297,  stages: 1, tracks: 2, income: '5 250 000',  img: CATALOG_IMG['trolls-01'], url: 'https://rope-park.ru/catalog/trolls/262' },
      { title: 'Стартовая башня',        title_en: 'Start tower',             type: 'Башня 12 м',  type_en: 'Tower 12 m',     area: 292,  stages: 1, tracks: 1, income: null,         img: CATALOG_IMG['trolls-02'], url: 'https://rope-park.ru/catalog/trolls/261' },
      { title: 'Финишная башня',         title_en: 'Finish tower',            type: 'Башня 6 м',   type_en: 'Tower 6 m',      area: 111,  stages: 1, tracks: 1, income: null,         img: CATALOG_IMG['trolls-01'], url: 'https://rope-park.ru/catalog/trolls/235' },
    ],
    'skyrider': [
      { title: 'SkyRider на деревьях',   title_en: 'SkyRider on trees',       type: 'На деревьях', type_en: 'Tree based',  area: 9408, stages: 43, tracks: 4, income: '14 175 000', img: CATALOG_IMG['skyrider-02'], url: 'https://rope-park.ru/catalog/skyrider/264', featured: true },
      { title: 'SkyRider на опорах',     title_en: 'SkyRider on supports',    type: 'На опорах',   type_en: 'On supports', area: 6072, stages: 1,  tracks: 1, income: '14 175 000', img: CATALOG_IMG['skyrider-01'], url: 'https://rope-park.ru/catalog/skyrider/265' },
      { title: 'SkyRider в помещении',   title_en: 'SkyRider indoor',         type: 'В помещении', type_en: 'Indoor',      area: 3900, stages: 1,  tracks: 1, income: '14 175 000', img: CATALOG_IMG['skyrider-02'], url: 'https://rope-park.ru/catalog/skyrider/266' },
    ],
    'mazes': [
      { title: 'Сетчатый парк на опорах',  title_en: 'Net park on supports', type: 'На опорах',   type_en: 'On supports', area: 352,  stages: 32, tracks: 1, income: '10 500 000', img: CATALOG_IMG['maze-01'], url: 'https://rope-park.ru/catalog/mesh-mazes/269', featured: true },
      { title: 'Сетчатый парк на деревьях',title_en: 'Net park on trees',    type: 'На деревьях', type_en: 'Tree based',  area: 1890, stages: 16, tracks: 1, income: '10 500 000', img: CATALOG_IMG['maze-01'], url: 'https://rope-park.ru/catalog/mesh-mazes/268' },
      { title: 'Сетчатый модульный',       title_en: 'Net modular',          type: 'Модульный',   type_en: 'Modular',     area: 153,  stages: 15, tracks: 2, income: '4 200 000',  img: CATALOG_IMG['maze-01'], url: 'https://rope-park.ru/catalog/mesh-mazes/260' },
      { title: 'Сетчатый в помещении',     title_en: 'Net indoor',           type: 'В помещении', type_en: 'Indoor',      area: 113,  stages: 17, tracks: 1, income: '4 200 000',  img: CATALOG_IMG['maze-01'], url: 'https://rope-park.ru/catalog/mesh-mazes/258' },
    ],
    'extra': [
      { title: 'Скалодром на башне',     title_en: 'Tower climbing wall',  type: 'Скалодром', type_en: 'Climbing wall', area: 20,  stages: 3, tracks: 6, income: null, img: CATALOG_IMG['trolls-01'],       url: 'https://rope-park.ru/catalog/additional-elements/386' },
      { title: 'Верёвочный мост 50 м',   title_en: 'Rope bridge 50 m',     type: 'Мост',      type_en: 'Bridge',        area: 150, stages: 1, tracks: 1, income: null, img: CATALOG_IMG['rope-tree-01'],    url: 'https://rope-park.ru/catalog/additional-elements/273' },
      { title: 'Лестница в небо',        title_en: 'Stairway to the sky',  type: 'Качели',    type_en: 'Swing',         area: 841, stages: 1, tracks: 1, income: null, img: CATALOG_IMG['rope-support-02'], url: 'https://rope-park.ru/catalog/additional-elements/272' },
      { title: 'Качели на опорах',       title_en: 'Swing on supports',    type: 'Качели',    type_en: 'Swing',         area: 560, stages: 1, tracks: 1, income: null, img: CATALOG_IMG['rope-support-01'], url: 'https://rope-park.ru/catalog/additional-elements/271' },
      { title: 'Гигантские качели',      title_en: 'Giant swing',          type: 'Качели',    type_en: 'Swing',         area: 561, stages: 4, tracks: 4, income: null, img: CATALOG_IMG['rope-tree-02'],    url: 'https://rope-park.ru/catalog/additional-elements/270' },
    ],
  };

  // Текущий язык (читается каждый раз - отражает актуальное состояние)
  const lang = () => (document.body && document.body.getAttribute('data-lang')) || 'ru';
  // Простой helper для коротких лейблов внутри JS-генерируемого DOM
  const CAT_TX = {
    area:           { ru: 'Площадка',                    en: 'Area' },
    stages:         { ru: 'Этапов',                      en: 'Stages' },
    tracks:         { ru: 'Трасс',                       en: 'Routes' },
    income:         { ru: 'расчётный доход в год',       en: 'estimated annual revenue' },
    incomeOnReq:    { ru: 'По запросу',                  en: 'On request' },
    incomeOnReqSub: { ru: 'индивидуальный расчёт',       en: 'tailored estimate' },
    badge3d:        { ru: '3D-модель',                   en: '3D model' },
    rub:            { ru: '₽',                           en: '₽' },
    sqm:            { ru: 'м²',                          en: 'm²' },
  };
  const tcat = (k) => (CAT_TX[k] && CAT_TX[k][lang()]) || (CAT_TX[k] && CAT_TX[k].ru) || '';

  // Override placeholder images with real catalog renders by ID (extracted from URL)
  // Renders live at images/models/catalog/{id}.webp (1200×1600 vertical, cream backdrop)
  Object.values(CATALOG_DATA).forEach(items => {
    items.forEach(m => {
      const idMatch = m.url && m.url.match(/\/(\d+)$/);
      if (idMatch) m.img = `images/models/catalog/${idMatch[1]}.webp`;
    });
  });

  const catalogWrapper = document.getElementById('catalogWrapper');
  const catalogTabs = document.querySelectorAll('.catalog__tab');
  let catalogSwiper = null;

  function buildSlideHTML(m, catKey, idx) {
    // Stable RP-code per category - makes every slide read as a product SKU
    const catPrefix = { 'rope-parks': 'RP', 'trolls': 'TZ', 'skyrider': 'SR', 'mazes': 'NM', 'extra': 'EX' }[catKey] || 'RP';
    const code = `${catPrefix}-${String(idx + 1).padStart(2, '0')}`;
    const isEn = lang() === 'en';
    const title = isEn && m.title_en ? m.title_en : m.title;
    const type  = isEn && m.type_en  ? m.type_en  : m.type;
    return `
      <div role="button" tabindex="0" class="swiper-slide catalog__card" data-cat-key="${catKey}" data-cat-idx="${idx}">
        <img class="catalog__card-photo" src="${m.img}" alt="${title}" loading="lazy" decoding="async">
        <div class="catalog__card-drag-layer"></div>
        <div class="catalog__card-grad"></div>
        <!-- Product-card markers - turn a photo into a SKU tile -->
        <span class="catalog__card-code">${code}</span>
        <span class="catalog__card-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          ${tcat('badge3d')}
        </span>
        <div class="catalog__card-content">
          <span class="catalog__card-type">${type}</span>
          <h3 class="catalog__card-title">${title}</h3>
          <div class="catalog__card-specs">
            ${m.area ? `<span>${tcat('area')} <b>${m.area} ${tcat('sqm')}</b></span>` : ''}
            <span>${tcat('stages')} <b>${m.stages}</b></span>
            <span>${tcat('tracks')} <b>${m.tracks}</b></span>
          </div>
          <div class="catalog__card-foot">
            ${m.income
              ? `<div class="catalog__card-income"><b>${m.income} ${tcat('rub')}</b><span>${tcat('income')}</span></div>`
              : `<div class="catalog__card-income"><b>${tcat('incomeOnReq')}</b><span>${tcat('incomeOnReqSub')}</span></div>`}
            <span class="catalog__card-more">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </div>
    `;
  }

  function renderCatalog(cat) {
    if (!catalogWrapper) return;
    const items = CATALOG_DATA[cat] || [];
    catalogTotal = items.length;
    const midIdx = Math.floor(Math.max(0, items.length - 1) / 2);

    // Full tear-down - guarantees prev/next rebind and fresh coverflow layout
    if (catalogSwiper) {
      catalogSwiper.destroy(true, true);
      catalogSwiper = null;
    }
    catalogWrapper.innerHTML = items.map((m, i) => buildSlideHTML(m, cat, i)).join('');

    // Give DOM one frame, then init at the middle slide
    requestAnimationFrame(() => {
      initCatalogSwiper(midIdx);
      setCounter(midIdx);
    });
    setCounter(midIdx);
  }

  const catalogCounter = document.getElementById('catalogCounter');
  let catalogTotal = 0;

  function setCounter(current) {
    if (!catalogCounter || !catalogTotal) return;
    const n = ((current % catalogTotal) + catalogTotal) % catalogTotal;
    catalogCounter.innerHTML = `<b>${String(n + 1).padStart(2,'0')}</b><em>/</em><span>${String(catalogTotal).padStart(2,'0')}</span>`;
  }

  function initCatalogSwiper(initialSlide = 0) {
    if (!window.Swiper) return;
    // Coverflow с лёгким масштабом соседей. slideToClickedSlide отключён,
    // иначе любой клик/свайп прыгает на ближайший слайд через всю ленту.
    catalogSwiper = new window.Swiper('#catalogSwiper', {
      effect: 'coverflow',
      slidesPerView: 'auto',
      centeredSlides: true,
      loop: false,
      spaceBetween: 40,
      initialSlide: initialSlide,
      grabCursor: true,
      speed: 600,
      keyboard: { enabled: true },
      watchOverflow: true,
      slideToClickedSlide: false,
      threshold: 6,
      touchStartPreventDefault: false,
      simulateTouch: true,
      coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 0,
        modifier: 1,
        scale: 0.92,
        slideShadows: false,
      },
      navigation: {
        nextEl: '#catalogNext',
        prevEl: '#catalogPrev',
      },
      on: {
        init: (sw)        => setCounter(sw.activeIndex),
        slideChange: (sw) => setCounter(sw.activeIndex),
      },
    });
  }

  // init once Swiper is ready
  if (window.Swiper) {
    initCatalogSwiper();
    renderCatalog('rope-parks');
  } else {
    const swiperTimer = setInterval(() => {
      if (window.Swiper) {
        clearInterval(swiperTimer);
        initCatalogSwiper();
        renderCatalog('rope-parks');
      }
    }, 120);
  }

  catalogTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      catalogTabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      renderCatalog(tab.dataset.cat);
    });
  });

  // Re-render каталога при смене языка - заголовки/типы/подписи внутри карточек
  document.addEventListener('rpark:langchange', () => {
    const active = document.querySelector('.catalog__tab.is-active');
    if (active) renderCatalog(active.dataset.cat);
  });

  // footer / nav category links
  document.querySelectorAll('[data-cat-link]').forEach(a => {
    a.addEventListener('click', () => {
      const cat = a.dataset.catLink;
      const tab = document.querySelector(`.catalog__tab[data-cat="${cat}"]`);
      if (tab) {
        catalogTabs.forEach(t => t.classList.remove('is-active'));
        tab.classList.add('is-active');
        renderCatalog(cat);
      }
    });
  });

  // ══════════════════════════════════════════
  // ECONOMY: Chart.js + picker + KPI count-up
  // ══════════════════════════════════════════
  const economyIncome = document.getElementById('economyIncome');
  const economyDesc = document.getElementById('economyDesc');
  const economyPicks = document.querySelectorAll('.economy__pick');

  function setEconomy(btn) {
    economyPicks.forEach(p => p.classList.remove('is-active'));
    btn.classList.add('is-active');
    const num = parseInt(btn.dataset.income, 10);
    const display = btn.dataset.incomeDisplay;
    const desc = btn.dataset.desc;

    if (economyIncome && !isNaN(num)) {
      const curr = parseInt(economyIncome.textContent.replace(/\s|₽/g, ''), 10) || 0;
      const obj = { v: curr };
      gsap.to(obj, {
        v: num, duration: 0.9, ease: 'power2.out',
        onUpdate: () => { economyIncome.textContent = Math.round(obj.v).toLocaleString('ru-RU').replace(/,/g, ' '); }
      });
    } else if (economyIncome && display) {
      economyIncome.textContent = display;
    }
    if (economyDesc && desc) {
      gsap.fromTo(economyDesc, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
      economyDesc.textContent = desc;
    }
  }
  economyPicks.forEach(btn => btn.addEventListener('click', () => setEconomy(btn)));

  // Count-up KPIs
  document.querySelectorAll('.economy__kpi-num[data-count]').forEach((el, i) => {
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => {
        const target = parseInt(el.getAttribute('data-count'), 10);
        if (isNaN(target)) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.6, ease: 'power2.out', delay: i * 0.08,
          onUpdate: () => { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });

  // Chart.js: payback comparison
  const economyChart = document.getElementById('economyChart');
  if (economyChart && window.Chart) {
    const ctx2 = economyChart.getContext('2d');
    const gradient = ctx2.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, 'rgba(153, 171, 71, 0.9)');
    gradient.addColorStop(1, 'rgba(153, 171, 71, 0.4)');

    const gradientDim = ctx2.createLinearGradient(0, 0, 0, 280);
    gradientDim.addColorStop(0, 'rgba(58, 125, 68, 0.5)');
    gradientDim.addColorStop(1, 'rgba(58, 125, 68, 0.15)');

    new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: ['Верёвочный парк', 'Батутный парк', 'Картинг', 'Аквапарк'],
        datasets: [
          {
            label: 'Срок окупаемости, мес.',
            data: [9, 15, 21, 42],
            backgroundColor: [gradient, gradientDim, gradientDim, gradientDim],
            borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            barThickness: 38,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1400, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,18,16,0.95)',
            titleColor: '#F5F3EF',
            bodyColor: '#99AB47',
            bodyFont: { family: 'Outfit', size: 14, weight: '600' },
            titleFont: { family: 'Outfit', size: 13, weight: '600' },
            padding: 12,
            cornerRadius: 10,
            displayColors: false,
            callbacks: { label: (c) => `${c.parsed.y} месяцев` }
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: 'rgba(245,243,239,0.65)',
              font: { family: 'Outfit', size: 13 },
            },
            border: { color: 'rgba(245,243,239,0.1)' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(245,243,239,0.06)', drawBorder: false },
            ticks: {
              color: 'rgba(245,243,239,0.45)',
              font: { family: 'Outfit', size: 13 },
              callback: (v) => v + ' мес',
              stepSize: 12,
            },
            border: { display: false },
          },
        },
      },
    });
  }

  // ══════════════════════════════════════════
  // PROCESS: vertical list, mark row "is-reached" as it enters viewport,
  //          inject left/right floating hover images
  // ══════════════════════════════════════════
  const processRows = document.querySelectorAll('.process__row');
  processRows.forEach((row, i) => {
    // Inject floating images from data-attributes
    const left = row.dataset.imgLeft;
    const right = row.dataset.imgRight;
    if (left) {
      const img = new Image();
      img.src = left;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'process__row-img process__row-img--left';
      row.appendChild(img);
    }
    if (right) {
      const img = new Image();
      img.src = right;
      img.alt = '';
      img.loading = 'lazy';
      img.className = 'process__row-img process__row-img--right';
      row.appendChild(img);
    }
    // Reveal in
    gsap.from(row, {
      opacity: 0, y: 30, duration: 0.7, ease: 'power3.out',
      delay: Math.min(i * 0.05, 0.3),
      scrollTrigger: { trigger: row, start: 'top 90%', once: true }
    });
    // Flip is-reached on/off as row crosses ~60% of viewport
    ScrollTrigger.create({
      trigger: row,
      start: 'top 70%',
      end: 'bottom 30%',
      onEnter: () => row.classList.add('is-reached'),
      onLeaveBack: () => row.classList.remove('is-reached'),
    });
  });

  // ══════════════════════════════════════════
  // CALCULATOR: month timeline
  // ══════════════════════════════════════════
  const calcArea = document.getElementById('calcArea');
  const calcAreaOut = document.getElementById('calcAreaOut');
  const calcDate = document.getElementById('calcDate');
  const calcResult = document.getElementById('calcResult');
  const calcChips = document.querySelectorAll('.calc__chip');

  // default date = +10 days from today
  if (calcDate) {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    calcDate.value = d.toISOString().split('T')[0];
  }

  if (calcArea && calcAreaOut) {
    const sync = () => { calcAreaOut.textContent = calcArea.value + ' м²'; };
    calcArea.addEventListener('input', () => { sync(); scheduleCalc(); });
    sync();
  }

  calcChips.forEach(chip => {
    chip.addEventListener('click', () => {
      calcChips.forEach(c => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      scheduleCalc();
    });
  });
  calcDate?.addEventListener('change', () => scheduleCalc());

  const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
  const calcSteps = [
    { label: 'Замер и выезд' },
    { label: 'Проект и договор' },
    { label: 'Производство' },
    { label: 'Монтаж' },
    { label: 'Обучение персонала' },
    { label: 'Тесты и запуск' },
    { label: 'Торжественное открытие' },
  ];
  const calcSkyriderSteps = [
    { label: 'Замер и выезд' },
    { label: 'Расчёт и проект' },
    { label: 'Производство' },
    { label: 'Монтаж' },
    { label: 'Испытания' },
    { label: 'Обучение' },
    { label: 'Открытие' },
  ];

  let calcTimer = null;
  function scheduleCalc() {
    clearTimeout(calcTimer);
    calcTimer = setTimeout(runCalc, 200);
  }

  function runCalc() {
    if (!calcResult) return;
    const activeChip = document.querySelector('.calc__chip.is-active');
    const total = activeChip ? parseInt(activeChip.dataset.total, 10) : 6;
    const format = activeChip ? activeChip.dataset.format : 'rope-park';
    const area = calcArea ? parseInt(calcArea.value, 10) : 300;
    const extraMonths = area > 500 ? 1 : 0;
    const totalMonths = total + extraMonths;

    const steps = format === 'skyrider' ? calcSkyriderSteps : calcSteps;
    const startDate = calcDate && calcDate.value ? new Date(calcDate.value) : new Date();

    const rows = [];
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      const monthName = MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
      const isFinal = i === totalMonths - 1;
      const stepLabel = steps[Math.min(i, steps.length - 1)]?.label || 'Работы по проекту';
      rows.push(`
        <div class="calc__month ${isFinal ? 'is-final' : ''}">
          <span class="calc__month-time">${monthName}</span>
          <span class="calc__month-text">${isFinal ? 'Открытие парка' : stepLabel}</span>
          <span class="calc__month-icon">${isFinal ? '★' : '·'}</span>
        </div>
      `);
    }

    calcResult.innerHTML = `
      <div class="calc__result-head">
        <h3>График проекта</h3>
        <span class="calc__result-total">~${totalMonths} мес.</span>
      </div>
      ${rows.join('')}
    `;

    // animate rows
    const nodes = calcResult.querySelectorAll('.calc__month');
    nodes.forEach((n, i) => {
      setTimeout(() => n.classList.add('is-in'), 40 * i);
    });
  }
  runCalc();

  // ══════════════════════════════════════════
  // CASES + YANDEX MAP
  // ══════════════════════════════════════════
  // coords: [lat, lon] - реальные кейсы из портфолио R-park
  const RP_IMG = {
    magnitogorsk:   'media/cases/portfolio/01-magnitogorsk.webp',
    samara:         'media/cases/portfolio/02-samara-tower.webp',
    balashikha:     'media/cases/portfolio/03-balashikha.webp',
    ufa_trees:      'media/cases/portfolio/04-ufa-trees.webp',
    sochi:          'media/cases/portfolio/06-sochi.webp',
    chelyabinsk:    'media/cases/portfolio/08-chelyabinsk.webp',
    moscow_olympic: 'media/cases/portfolio/09-moscow-olympic.webp',
    orenburg:       'media/cases/portfolio/10-orenburg.webp',
    nizhnevartovsk: 'media/cases/portfolio/11-nizhnevartovsk.webp',
  };
  const CASES_DATA = [
    { city: 'Магнитогорск',  city_en: 'Magnitogorsk',  place: '8 трасс на опорах',            place_en: '8 routes on supports',         year: 2023, format: '1200 м² · 88 этапов',  format_en: '1200 m² · 88 stages',  coords: [53.4072, 58.9794], big: true, img: RP_IMG.magnitogorsk },
    { city: 'Самара',        city_en: 'Samara',        place: '6 трасс с башней',             place_en: '6 routes with tower',          year: 2022, format: 'Модульный · 66 этапов', format_en: 'Modular · 66 stages',   coords: [53.1959, 50.1003], img: RP_IMG.samara },
    { city: 'Балашиха',      city_en: 'Balashikha',    place: '3 трассы + ZipLiner',          place_en: '3 routes + ZipLiner',          year: 2023, format: '15 000 м² · 55 этапов', format_en: '15 000 m² · 55 stages', coords: [55.8094, 37.9581], big: true, img: RP_IMG.balashikha },
    { city: 'Уфа',           city_en: 'Ufa',           place: '6 трасс на деревьях',          place_en: '6 routes on trees',            year: 2011, format: '5400 м² · 78 этапов',   format_en: '5400 m² · 78 stages',   coords: [54.7388, 55.9721], big: true, img: RP_IMG.ufa_trees },
    { city: 'Сочи',          city_en: 'Sochi',         place: '6 трасс на металл. опорах',    place_en: '6 routes on metal supports',   year: 2019, format: '1100 м² · 44 этапа',    format_en: '1100 m² · 44 stages',   coords: [43.6028, 39.7342], big: true, img: RP_IMG.sochi },
    { city: 'Челябинск',     city_en: 'Chelyabinsk',   place: 'Парк в Wow Park',              place_en: 'Park in Wow Park',             year: 2023, format: 'Indoor · 10 этапов',     format_en: 'Indoor · 10 stages',    coords: [55.1644, 61.4368], img: RP_IMG.chelyabinsk },
    { city: 'Москва',        city_en: 'Moscow',        place: 'Троллей в Олимпийской деревне', place_en: 'Zip line at Olympic Village',  year: 2020, format: 'Троллей 400 м · ТР ЕАЭС',  format_en: 'Zip line 400 m · TR EAEU',  coords: [55.6906, 37.5180], big: true, img: RP_IMG.moscow_olympic },
    { city: 'Оренбург',      city_en: 'Orenburg',      place: '6 трасс из клеёного бруса',    place_en: '6 routes from glulam',         year: 2018, format: '600 м² · 60 этапов',    format_en: '600 m² · 60 stages',    coords: [51.7727, 55.0988], img: RP_IMG.orenburg },
    { city: 'Нижневартовск', city_en: 'Nizhnevartovsk',place: 'Модульный парк 6 трасс',       place_en: 'Modular park, 6 routes',       year: 2021, format: '230 м² · 32 этапа',     format_en: '230 m² · 32 stages',    coords: [60.9344, 76.5531], img: RP_IMG.nizhnevartovsk },
  ];
  const caseField = (c, key) => (lang() === 'en' && c[key + '_en']) ? c[key + '_en'] : c[key];

  const casesList = document.getElementById('casesList');
  const casesSelect = document.getElementById('casesSelect');
  function renderCasesList() {
    if (!casesList) return;
    casesList.innerHTML = CASES_DATA.map((c, i) => `
      <button class="cases__item" data-idx="${i}">
        <span>
          <span class="cases__item-city">${caseField(c, 'city')}</span>
          <span class="cases__item-meta">${caseField(c, 'place')} · ${caseField(c, 'format')}</span>
        </span>
        <span class="cases__item-year">${c.year}</span>
      </button>
    `).join('');
    // re-bind hover/click - listeners are attached below to .cases__item nodes
    document.querySelectorAll('.cases__item').forEach(item => {
      item.addEventListener('mouseenter', () => highlightCase(item.dataset.idx, false));
      item.addEventListener('click',       () => highlightCase(item.dataset.idx, true));
      item.addEventListener('mouseleave',  () => hideCasePreview(260));
    });

    // ── ЗАДАЧА #18 — выпадающий список городов (тот же источник CASES_DATA).
    // При выборе срабатывает та же логика, что и клик по элементу списка/метке.
    if (casesSelect) {
      const placeholder = lang() === 'en' ? 'Pick a project - find it on the map' : 'Выберите проект - найдём на карте';
      casesSelect.innerHTML =
        `<option value="" disabled selected>${placeholder}</option>` +
        CASES_DATA.map((c, i) =>
          `<option value="${i}">${caseField(c, 'city')} · ${c.year} - ${caseField(c, 'place')}</option>`
        ).join('');
    }
  }
  renderCasesList();
  if (casesSelect) {
    casesSelect.addEventListener('change', () => {
      const idx = casesSelect.value;
      if (idx !== '') highlightCase(idx, true);
    });
  }

  let ymapInstance = null;
  let ymapMarkers = [];

  function initYandexMap() {
    if (!window.ymaps || !document.getElementById('yandexMap')) return;
    window.ymaps.ready(() => {
      ymapInstance = new ymaps.Map('yandexMap', {
        center: [62, 95],  // центр России
        zoom: 3,
        controls: ['zoomControl'],
        behaviors: ['default', 'scrollZoom'],
      }, {
        suppressMapOpenBlock: true,
      });

      // Мягкая тема: приглушаем цвета
      try {
        ymapInstance.panes.get('ground').getElement().style.filter = 'saturate(0.75) contrast(0.98)';
      } catch (e) {}

      // кастомный layout для меток
      const MarkerLayout = window.ymaps.templateLayoutFactory.createClass(
        `<div class="rpark-placemark $[properties.big|is-big|] $[properties.active|is-active|]"></div>
         <div class="rpark-placemark-label">$[properties.iconCaption]</div>`
      );

      ymapMarkers = CASES_DATA.map((c, i) => {
        const pm = new ymaps.Placemark(c.coords, {
          iconCaption: `${caseField(c, 'city')} · ${caseField(c, 'format')}`,
          big: c.big ? 'true' : '',
          active: '',
          idx: i,
        }, {
          iconLayout: MarkerLayout,
          iconShape: { type: 'Circle', coordinates: [0, 0], radius: 10 },
        });
        pm.events.add('mouseenter', () => highlightCase(i, false));
        pm.events.add('click', () => highlightCase(i, true));
        ymapInstance.geoObjects.add(pm);
        return pm;
      });

      // Yandex caches viewport size at creation. On mobile the container
      // shrinks AFTER init (CSS media queries kick in AFTER the map API
      // finishes loading), so tiles render at the old 680px size and leave
      // white patches. We force a recalc via fitToViewport + re-center on a
      // mobile-appropriate zoom. ResizeObserver catches ANY container-size
      // change (orientation, DevTools resize, keyboard open, etc.) - much
      // more reliable than a window `resize` listener under Lenis.
      const refitMap = () => {
        if (!ymapInstance) return;
        try { ymapInstance.container.fitToViewport(); } catch (e) {}
        // zoom:3 like v4 - do not override on mobile, it works fine
      };
      // Initial run + a delayed second run to catch post-layout shifts
      refitMap();
      setTimeout(refitMap, 200);
      setTimeout(refitMap, 600);
      const mapEl = document.getElementById('yandexMap');
      if (mapEl && 'ResizeObserver' in window) {
        let roTimer;
        const ro = new ResizeObserver(() => {
          clearTimeout(roTimer);
          roTimer = setTimeout(refitMap, 120);
        });
        ro.observe(mapEl);
      }
    });
  }

  const casesPreview    = document.getElementById('casesPreview');
  const casesPreviewImg  = document.getElementById('casesPreviewImg');
  const casesPreviewCity = document.getElementById('casesPreviewCity');
  const casesPreviewPlace= document.getElementById('casesPreviewPlace');
  let casesPreviewTimer = 0;

  function showCasePreview(idx) {
    if (!casesPreview || idx == null) return;
    const c = CASES_DATA[+idx];
    if (!c) return;
    if (casesPreviewImg && c.img) casesPreviewImg.style.backgroundImage = `url('${c.img}')`;
    if (casesPreviewCity)  casesPreviewCity.textContent  = caseField(c, 'city');
    if (casesPreviewPlace) casesPreviewPlace.textContent = `${caseField(c, 'place')} · ${caseField(c, 'format')}`;
    casesPreview.classList.add('is-visible');
    clearTimeout(casesPreviewTimer);
  }
  function hideCasePreview(delay) {
    if (!casesPreview) return;
    clearTimeout(casesPreviewTimer);
    casesPreviewTimer = setTimeout(() => casesPreview.classList.remove('is-visible'), delay || 0);
  }

  function highlightCase(idx, fly) {
    document.querySelectorAll('.cases__item').forEach(el => el.classList.toggle('is-active', +el.dataset.idx === +idx));
    // держим выпадающий список (#18) в синхроне с кликом по карте/списку
    if (casesSelect && String(casesSelect.value) !== String(idx)) casesSelect.value = String(idx);
    showCasePreview(idx);
    if (!ymapInstance || !ymapMarkers.length) return;
    ymapMarkers.forEach((pm, i) => {
      pm.properties.set('active', i === +idx ? 'true' : '');
    });
    if (fly) {
      ymapInstance.setCenter(CASES_DATA[idx].coords, 6, { duration: 700 });
    }
  }

  // Hook на смену языка: обновляем список кейсов и iconCaption на карте
  document.addEventListener('rpark:langchange', () => {
    renderCasesList();
    if (ymapMarkers && ymapMarkers.length) {
      ymapMarkers.forEach((pm, i) => {
        const c = CASES_DATA[i];
        if (c) pm.properties.set('iconCaption', `${caseField(c, 'city')} · ${caseField(c, 'format')}`);
      });
    }
  });

  // Yandex Map - deferred init. Because the cases section is wrapped in a
  // `.reveal-card` that uses `transform: scale`, Yandex Maps has to be created
  // ONLY after the card reaches its fully-expanded state (scale ≈ 1) - otherwise
  // tiles calculate the wrong viewport and the map renders blank.
  let ymapReady = false;
  let ymapViewportReady = false;
  function tryInitYandexMap() {
    if (ymapReady) return;
    if (!window.ymaps) return;
    if (!ymapViewportReady) return;
    ymapReady = true;
    initYandexMap();
  }
  const ymapsWaiter = setInterval(() => {
    if (window.ymaps) { clearInterval(ymapsWaiter); tryInitYandexMap(); }
  }, 150);
  // Fires once when the cases reveal-card is mostly unfolded
  ScrollTrigger.create({
    trigger: '#cases',
    start: 'top 45%',
    once: true,
    onEnter: () => { ymapViewportReady = true; tryInitYandexMap(); },
  });
  // If the card is ever re-scaled (scroll back + forward), nudge the map to
  // recompute its viewport size.
  ScrollTrigger.create({
    trigger: '#cases',
    start: 'top 20%',
    end:   'top 20%',
    onEnter:     () => ymapInstance && ymapInstance.container && ymapInstance.container.fitToViewport(),
    onEnterBack: () => ymapInstance && ymapInstance.container && ymapInstance.container.fitToViewport(),
  });

  // ══════════════════════════════════════════
  // TRUST + FAQ + Section headers: reveal
  // ══════════════════════════════════════════
  gsap.utils.toArray('.trust__card, .faq__item, .cases__map, .forwhom__canvas').forEach((el, i) => {
    gsap.from(el, {
      opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
      delay: (i % 4) * 0.07,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  gsap.utils.toArray('.big-title, .label-pill').forEach(el => {
    gsap.from(el, {
      opacity: 0, y: 26, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // ══════════════════════════════════════════
  // CERTIFICATES: 2-up Swiper slider (looped) + lightbox
  // ══════════════════════════════════════════
  const CERT_SRCS = Array.from(document.querySelectorAll('#trustSwiper .trust__slide img'))
    .map(img => img.getAttribute('src'));
  const trustCounter = document.getElementById('trustCounter');

  let trustSwiper = null;
  let certIdx = 0;

  function updateTrustCounter(i) {
    if (!trustCounter) return;
    const n = CERT_SRCS.length;
    const current = ((i % n) + n) % n;
    trustCounter.textContent = `${String(current + 1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
  }

  function initTrustSwiper() {
    if (!window.Swiper || !document.getElementById('trustSwiper')) return;
    trustSwiper = new window.Swiper('#trustSwiper', {
      slidesPerView: 1,
      spaceBetween: 14,
      loop: true,
      speed: 500,
      grabCursor: true,
      navigation: { nextEl: '#trustNext', prevEl: '#trustPrev' },
      breakpoints: {
        640:  { slidesPerView: 2, spaceBetween: 14 },
        1200: { slidesPerView: 2, spaceBetween: 18 },
      },
      on: {
        slideChange: (sw) => {
          certIdx = sw.realIndex;
          updateTrustCounter(certIdx);
        },
        init: () => updateTrustCounter(0),
      },
    });
  }

  if (window.Swiper) initTrustSwiper();
  else {
    const t = setInterval(() => {
      if (window.Swiper) { clearInterval(t); initTrustSwiper(); }
    }, 120);
  }

  // Click on a slide → open lightbox for that cert
  document.querySelectorAll('#trustSwiper .trust__slide').forEach((slide) => {
    slide.addEventListener('click', () => {
      const i = parseInt(slide.dataset.cert, 10) || 0;
      openCert(i);
    });
  });

  // ── Lightbox: fullscreen viewer ──
  const lightbox        = document.getElementById('certLightbox');
  const lightboxImg     = document.getElementById('lightboxImg');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxClose   = document.getElementById('lightboxClose');
  const lightboxPrev    = document.getElementById('lightboxPrev');
  const lightboxNext    = document.getElementById('lightboxNext');
  let lbIdx = 0;

  function openCert(idx) {
    if (!lightbox || !CERT_SRCS.length) return;
    lbIdx = (idx + CERT_SRCS.length) % CERT_SRCS.length;
    lightboxImg.src = CERT_SRCS[lbIdx];
    if (lightboxCounter) lightboxCounter.textContent = `${lbIdx + 1} / ${CERT_SRCS.length}`;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCert() {
    if (!lightbox) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function swapCertLB(delta) {
    if (!lightboxImg) return;
    lightboxImg.classList.add('is-swapping');
    setTimeout(() => {
      lbIdx = (lbIdx + delta + CERT_SRCS.length) % CERT_SRCS.length;
      lightboxImg.src = CERT_SRCS[lbIdx];
      if (lightboxCounter) lightboxCounter.textContent = `${lbIdx + 1} / ${CERT_SRCS.length}`;
      lightboxImg.classList.remove('is-swapping');
    }, 160);
  }
  lightboxClose?.addEventListener('click', closeCert);
  lightboxPrev?.addEventListener('click', () => swapCertLB(-1));
  lightboxNext?.addEventListener('click', () => swapCertLB(1));
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeCert();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeCert();
    if (e.key === 'ArrowLeft') swapCertLB(-1);
    if (e.key === 'ArrowRight') swapCertLB(1);
  });

  // ══════════════════════════════════════════
  // ABOUT MODAL - polaroid-style story
  // ══════════════════════════════════════════
  const aboutModal = document.getElementById('aboutModal');
  const aboutBtn   = document.getElementById('aboutBtn');
  const aboutClose = document.getElementById('aboutClose');

  const aboutSheet = document.querySelector('.about__sheet');
  const aboutPolaroids = document.querySelectorAll('.about__polaroid');
  const POLAROID_SPEEDS = [0.18, 0.32, 0.12, 0.28, 0.22, 0.38];

  function updatePolaroidParallax() {
    if (!aboutSheet) return;
    const y = aboutSheet.scrollTop;
    aboutPolaroids.forEach((el, i) => {
      const speed = POLAROID_SPEEDS[i] ?? 0.2;
      el.style.setProperty('--py', `${-y * speed}px`);
    });
  }

  // ── Smooth wheel → scrollTop (lerp via rAF) ──
  // Without this the native wheel delta (≈100 per tick) feels like the content
  // is "jumping". We interpolate to the target each frame.
  let aboutScrollTarget = 0;
  let aboutScrollCurrent = 0;
  let aboutScrollRaf = null;

  function aboutScrollTick() {
    if (!aboutSheet) { aboutScrollRaf = null; return; }
    const diff = aboutScrollTarget - aboutScrollCurrent;
    aboutScrollCurrent += diff * 0.18;
    aboutSheet.scrollTop = aboutScrollCurrent;
    updatePolaroidParallax();
    if (Math.abs(diff) > 0.4) {
      aboutScrollRaf = requestAnimationFrame(aboutScrollTick);
    } else {
      aboutScrollCurrent = aboutScrollTarget;
      aboutSheet.scrollTop = aboutScrollCurrent;
      aboutScrollRaf = null;
    }
  }

  function aboutWheelHandler(e) {
    if (!aboutSheet) return;
    e.preventDefault();
    e.stopPropagation();
    const maxScroll = Math.max(0, aboutSheet.scrollHeight - aboutSheet.clientHeight);
    aboutScrollTarget = Math.max(0, Math.min(maxScroll, aboutScrollTarget + e.deltaY));
    if (aboutScrollRaf == null) aboutScrollRaf = requestAnimationFrame(aboutScrollTick);
  }

  function openAbout() {
    if (!aboutModal) return;
    aboutModal.classList.add('is-open');
    aboutModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Force dark cursor + keep cursor visible over the cream-white modal sheet
    document.body.classList.add('is-modal-open');
    if (locoScroll && typeof locoScroll.stop === 'function') locoScroll.stop();
    aboutModal.addEventListener('wheel', aboutWheelHandler, { passive: false, capture: true });
    if (aboutSheet) {
      aboutSheet.scrollTop = 0;
      aboutScrollTarget = 0;
      aboutScrollCurrent = 0;
    }
    updatePolaroidParallax();
  }
  function closeAbout() {
    if (!aboutModal) return;
    aboutModal.classList.remove('is-open');
    aboutModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.body.classList.remove('is-modal-open');
    aboutModal.removeEventListener('wheel', aboutWheelHandler, { capture: true });
    if (aboutScrollRaf != null) {
      cancelAnimationFrame(aboutScrollRaf);
      aboutScrollRaf = null;
    }
    aboutPolaroids.forEach(el => el.style.setProperty('--py', '0px'));
    if (locoScroll && typeof locoScroll.start === 'function') locoScroll.start();
  }
  aboutBtn?.addEventListener('click', openAbout);
  aboutClose?.addEventListener('click', closeAbout);
  aboutModal?.addEventListener('click', (e) => {
    if (e.target === aboutModal) closeAbout();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal?.classList.contains('is-open')) closeAbout();
  });
  // "Оставить заявку" CTA inside the modal - close the sheet and let the anchor scroll
  document.querySelectorAll('[data-close-about]').forEach(el => {
    el.addEventListener('click', () => setTimeout(closeAbout, 60));
  });

  // ══════════════════════════════════════════
  // PLACES - scroll-driven sticky grid composition (obsidianassembly-style)
  //   sticky-container высотой 400vh; внутри grid 12×20 с position:sticky.
  //   На скролле растёт --progress 0→1 (с lerp-плавностью). Миниатюры
  //   разъезжаются через CSS calc(min(--progress*2,1)). Центральная
  //   картинка сменяется через is-active/is-leaving/is-entering классы.
  // ══════════════════════════════════════════
  const placesSection = document.querySelector('.places');
  const placesSticky  = document.querySelector('.places__sticky');
  const placesGrid    = document.getElementById('placesGrid');
  const placesFigures = Array.from(document.querySelectorAll('.places__seq-fig'));
  const placesMeta    = document.getElementById('placesMeta');
  const placesName    = document.getElementById('placesName');
  const placesDesc    = document.getElementById('placesDesc');
  const placesSpecs   = document.getElementById('placesSpecs');
  const placesCounter = document.getElementById('placesCounter');
  const placesPrev    = document.getElementById('placesPrev');
  const placesNext    = document.getElementById('placesNext');

  if (placesSection && placesSticky && placesGrid && placesFigures.length) {
    const TOTAL = placesFigures.length;
    let manualIdx = null;     // если null - индекс ведётся скроллом, иначе зафиксирован стрелкой
    let target = 0;
    let current = 0;
    let activeIdx = 0;
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;

    // Хелпер: выбираем поле с учётом текущего языка. data-meta-en > data-meta.
    function fieldByLang(fig, key) {
      var lang = (document.body && document.body.getAttribute('data-lang')) || 'ru';
      if (lang === 'en' && fig.dataset[key + 'En']) return fig.dataset[key + 'En'];
      return fig.dataset[key] || '';
    }

    // Обновление подписи + счётчика на смену активного слайда
    function applyCaption(idx) {
      const fig = placesFigures[idx];
      if (!fig) return;
      placesMeta.textContent = fieldByLang(fig, 'meta');
      placesName.textContent = fieldByLang(fig, 'name');
      if (placesDesc) placesDesc.textContent = fieldByLang(fig, 'desc')
        .replace(/(\d) (\d{3})(?!\d)/g, '$1 $2')
        .replace(/(\d) (м²|m²)/g, '$1 $2');
      try {
        const specs = JSON.parse(fieldByLang(fig, 'specs') || '[]');
        placesSpecs.innerHTML = specs.map(s => `<span><b>${s.v}</b><i>${s.l}</i></span>`).join('');
      } catch(e) { placesSpecs.innerHTML = ''; }
      placesCounter.textContent = `${String(idx + 1).padStart(2,'0')} / ${String(TOTAL).padStart(2,'0')}`;
    }

    // При смене языка обновляем активную карточку
    document.addEventListener('rpark:langchange', function () {
      applyCaption(activeIdx);
    });

    // Только is-active - без is-leaving/is-entering: они ломали порядок переходов
    // при скролле назад (entering выбирался как фигура справа в DOM, а не по направлению)
    function applyClasses(idx) {
      placesFigures.forEach((f, i) => {
        f.classList.toggle('is-active', i === idx);
      });
    }

    function setIndex(idx) {
      idx = Math.max(0, Math.min(TOTAL - 1, idx));
      if (idx === activeIdx) return;
      activeIdx = idx;
      applyClasses(idx);
      applyCaption(idx);
    }

    // Главный rAF-цикл: считаем target из позиции sticky-container, плавно лерпим current
    function tick() {
      if (!isDesktop()) {
        // На мобилке вся sticky-логика выключена - только синхронизуем подпись с активным
        requestAnimationFrame(tick);
        return;
      }
      const rect = placesSticky.getBoundingClientRect();
      const total = placesSticky.offsetHeight - window.innerHeight;
      target = Math.min(1, Math.max(0, -rect.top / Math.max(1, total)));

      current += (target - current) * 0.12;          // lerp плавность для CSS-трансформов
      placesSection.style.setProperty('--progress', current.toFixed(4));

      // СЛАЙДЫ БОЛЬШЕ НЕ ЛИСТАЮТСЯ ОТ СКРОЛЛА. Скролл двигает только миниатюры
      // (разъезжаются + тают) и scale центра. Смена slides только по стрелкам.
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);

    // Стрелки: ТОЛЬКО меняем слайд. Не трогаем скролл, не двигаем --progress.
    // Окно видимости (.places__stage) остаётся ровно в том же положении, в котором
    // юзер сейчас смотрит - переключается только содержимое (картинка через opacity).
    function gotoSlide(idx) {
      idx = ((idx % TOTAL) + TOTAL) % TOTAL;  // loop: -1 → последний, TOTAL → 0
      setIndex(idx);
    }

    if (placesPrev) placesPrev.addEventListener('click', (e) => { e.preventDefault(); gotoSlide(activeIdx - 1); });
    if (placesNext) placesNext.addEventListener('click', (e) => { e.preventDefault(); gotoSlide(activeIdx + 1); });

    // Стартовая инициализация
    applyClasses(0);
    applyCaption(0);
  }

  // ══════════════════════════════════════════
  // CATALOG MODEL MODAL - universal, finmodel is computed, not shipped
  // ══════════════════════════════════════════
  const modelModal      = document.getElementById('modelModal');
  const modelSheet      = document.getElementById('modelSheet');
  const modelClose      = document.getElementById('modelClose');
  const modelHeroImg    = document.getElementById('modelHeroImg');
  const modelKickerEl   = document.getElementById('modelKicker');
  const modelTitleEl    = document.getElementById('modelTitle');
  const modelSpecsEl    = document.getElementById('modelSpecs');
  const modelDescEl     = document.getElementById('modelDesc');
  const modelIncludesEl = document.getElementById('modelIncludes');
  const modelCharsEl    = document.getElementById('modelChars');
  const modelCharsSeg   = document.getElementById('modelCharsSeg');
  const modelChartEl    = document.getElementById('modelChart');
  const modelTableEl    = document.getElementById('modelTable');
  const modelTotalsEl   = document.getElementById('modelTotals');

  // Seasonality coefficients (Jan..Dec) - по методологии финмодели rope-park.ru
  // (зимой поток почти ноль, пик - конец лета / начало осени). Источник: их Excel по моделям.
  const SEASON = [0.15, 0.15, 0.2, 0.5, 1.0, 1.1, 0.9, 1.2, 1.3, 0.3, 0.1, 0.1];
  // Доля расходов от дохода по месяцам: зимой выше (низкая загрузка → меньше маржа),
  // летом ниже. Всегда < 1 → каждый месяц прибыльный (без минусов в таблице).
  const COST_SHARE = [0.55, 0.55, 0.50, 0.42, 0.32, 0.30, 0.34, 0.29, 0.28, 0.45, 0.58, 0.58];
  const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const MONTHS = MONTHS_RU; // legacy alias for places that read it directly
  const months = () => (lang() === 'en' ? MONTHS_EN : MONTHS_RU);

  // Финлаб / модальные тексты - динамические подписи, не уходят в HTML i18n
  const FL_TX = {
    rub:        { ru: '₽',          en: '$' },
    rubMo:      { ru: ' ₽/мес',     en: ' $/mo' },
    mln:        { ru: ' млн',       en: ' mln' },
    ths:        { ru: ' тыс',       en: ' k' },
    mo:         { ru: ' мес',       en: ' mo' },
    moDot:      { ru: ' мес.',      en: ' mo' },
    mlnRub:     { ru: ' млн ₽',     en: ' mln $' },
    months:     { ru: 'месяцев',    en: 'months' },
    sqm:        { ru: 'м²',         en: 'm²' },
    incomeYr:   { ru: 'расчётный доход/год', en: 'estimated revenue / year' },
    yearIncome: { ru: 'Выручка за год', en: 'Annual revenue' },
    yearCosts:  { ru: 'Расходы за год', en: 'Annual costs' },
    netProfit:  { ru: 'Чистая прибыль', en: 'Net profit' },
    legendInc:  { ru: 'Выручка',    en: 'Revenue' },
    legendPrf:  { ru: 'Прибыль',    en: 'Profit' },
    specsArea:  { ru: 'площадь',    en: 'area' },
    specsStg:   { ru: 'этапов',     en: 'stages' },
    specsTrk:   { ru: 'трасс',      en: 'routes' },
    payback:    { ru: 'Окупаемость',en: 'Payback' },
    paybackMo:  { ru: 'Срок окупаемости, мес.', en: 'Payback, months' },
  };
  const fl = (k) => (FL_TX[k] && FL_TX[k][lang()]) || (FL_TX[k] && FL_TX[k].ru) || '';

  const DESC_BY_TYPE = {
    'На деревьях': {
      ru: 'Классический формат на живых деревьях. Минимум земляных работ, идеально для лесопарков, баз отдыха и городских парковых зон.',
      en: 'Classic format on living trees. Minimal groundworks, ideal for forest parks, resorts and urban park zones.',
    },
    'На опорах': {
      ru: 'Конструкции на металлических или деревянных опорах со свайным фундаментом. Монтируется на любом ландшафте, не требует крупных деревьев.',
      en: 'Structures on metal or wooden supports with a pile foundation. Installs on any landscape, no large trees required.',
    },
    'Модульный': {
      ru: 'Быстрый монтаж и демонтаж. При необходимости парк можно разобрать и перевезти на другую площадку без потерь.',
      en: 'Fast install and uninstall. The park can be dismantled and moved to another site with no loss.',
    },
    'В помещении': {
      ru: 'Якорный объект для ТЦ, спорткомплексов и indoor-парков. Работает 365 дней в году, самый высокий расчётный доход в портфеле.',
      en: 'Anchor venue for malls, sport complexes and indoor parks. Operates 365 days a year, the highest estimated revenue in the portfolio.',
    },
    'Детский': {
      ru: 'Низкая высота, яркие элементы, двойная страховка. Для детей 3-7 лет и их родителей.',
      en: 'Low height, bright elements, double belay. For kids aged 3-7 and their parents.',
    },
    'Троллей': {
      ru: 'Линия полёта с автоматической тормозной системой Head Rush ZipStop + резервный пружинный тормоз. Адреналин с гарантией безопасности.',
      en: 'A flight line with the automatic Head Rush ZipStop brake plus a backup spring brake. Adrenaline with guaranteed safety.',
    },
    'Мобильный': {
      ru: 'Разборная конструкция. Монтаж за 1-2 дня. Идеально для фестивалей, сезонных площадок и гастролей.',
      en: 'A demountable build. Installs in 1-2 days. Ideal for festivals, seasonal venues and tours.',
    },
    'Башня': {
      ru: 'Отдельная башня с возможностью установки скалодрома, свободного падения и других подвесных конструкций.',
      en: 'A standalone tower that can host a climbing wall, free fall and other suspended structures.',
    },
    'Скалодром': {
      ru: 'Модуль на отдельной башне. 3 дорожки разной сложности, страховка GRIGRI.',
      en: 'A module on a standalone tower. 3 routes at different difficulties, GRIGRI belay.',
    },
    'Мост': {
      ru: 'Верёвочный переход с прочным настилом. Может быть как отдельным элементом, так и частью большого маршрута.',
      en: 'A rope crossing with a sturdy deck. Works as a standalone element or as part of a larger route.',
    },
    'Качели': {
      ru: 'Гигантские верёвочные качели или «лестница в небо» - аттрактор для соцсетей и фотоспотов.',
      en: 'A giant rope swing or a stairway to the sky, a magnet for social posts and photo spots.',
    },
  };

  const INCLUDES_BY_TYPE = {
    'default': {
      ru: [
        'Замер площадки + 3D-визуализация',
        'ТЗ и полный пакет документов по ГОСТ 56986-2023',
        'Производство в собственном цехе в Уфе',
        'Монтаж силами штатной бригады',
        'Обучение персонала (2 дня)',
        'Приёмно-сдаточные испытания',
        'Гарантия + сезонная профилактика',
      ],
      en: [
        'Site survey + 3D visualization',
        'Brief and full GOST 56986-2023 document pack',
        'Production at our own Ufa workshop',
        'Installation by our in house crew',
        'Staff training (2 days)',
        'Acceptance and delivery tests',
        'Warranty + seasonal prevention',
      ],
    },
    'В помещении': {
      ru: [
        'Проектирование с учётом несущих конструкций ТЦ',
        'Пакет документов для арендодателя',
        'ГОСТ 56986-2023 + акт испытаний',
        'Производство и монтаж под ключ',
        'Обучение смены инструкторов',
        'Маркетинг открытия',
        'Гарантия и сервис 24/7',
      ],
      en: [
        'Design that respects mall load bearing structures',
        'Document pack for the landlord',
        'GOST 56986-2023 + test report',
        'Turnkey production and installation',
        'Instructor team training',
        'Opening marketing',
        '24/7 warranty and service',
      ],
    },
    'Троллей': {
      ru: [
        'Геодезия и расчёт траектории полёта',
        'Тормозная система Head Rush ZipStop',
        'Стартовая + финишная башни',
        'Полный пакет безопасности по ГОСТ',
        'Монтаж за 7-10 дней',
        'Обучение оператора',
        'Гарантия 3 года на несущие конструкции',
      ],
      en: [
        'Survey and flight trajectory calculation',
        'Head Rush ZipStop brake system',
        'Start + finish towers',
        'Full GOST safety document pack',
        'Installation in 7-10 days',
        'Operator training',
        '3 year warranty on load bearing structures',
      ],
    },
  };
  // Уникальное описание под КАЖДУЮ модель (ключ - id из url), чтобы не дублировались по типу
  const DESC_BY_MODEL = {
    '252': { ru: 'Парк на живых деревьях - самый распространённый формат с минимумом вложений. Подходит для загородного дома, базы отдыха, лесопарка. 8 этапов, одна трасса на 612 м².', en: 'A park on living trees - the most common format with minimal investment. Fits a country house, a resort or a forest park. 8 stages, one route over 612 m².' },
    '253': { ru: 'Парк на деревьях с двумя трассами: нижняя на высоте 1 м для детей от 4 лет с сетчатой страховкой, верхняя на 3,3 м для посетителей от 6 лет. 20 этапов на 2600 м², пакеты на 2 трассы повышают средний чек.', en: 'A tree-based park with two routes: a lower one at 1 m for kids 4+ with net belay, an upper one at 3.3 m for guests 6+. 20 stages over 2600 m²; two-route packages raise the average check.' },
    '245': { ru: 'Парк на опорах подходит для любой территории - фундамент на винтовых или буронабивных сваях. Каркас из трубы D219 несёт две трассы: 1 м для детей от 4 лет и 3,3 м для гостей от 6 лет. 16 этапов на 170 м².', en: 'A park on supports suits any site - foundation on screw or bored piles. A D219 pipe frame carries two routes: 1 m for kids 4+ and 3.3 m for guests 6+. 16 stages over 170 m².' },
    '244': { ru: 'Парк на опорах с каркасом из трубы D219. Одна трасса на высоте 1 м для детей от 4 лет - несложные препятствия проходятся под присмотром родителей. 16 этапов на 225 м².', en: 'A park on supports with a D219 pipe frame. A single route at 1 m for kids 4+ - easy obstacles passed under parents\' supervision. 16 stages over 225 m².' },
    '259': { ru: 'Парк в помещении с максимумом трасс: задействованы колонны и подвесы к фермам крыши, опоры из клеёного бруса 10 м. Подъём по трёхэтажной башне, трассы на 1, 3,3, 5,6 и 9 м, реверсивный троллей и прыжок свободного падения Quick Fly. 7 трасс, 72 этапа на 1378 м².', en: 'An indoor park with the maximum number of routes: it uses columns and roof-truss suspensions plus 10 m glued-beam supports. Access via a three-storey tower; routes at 1, 3.3, 5.6 and 9 m, a reversible zip line and a Quick Fly free-fall jump. 7 routes, 72 stages over 1378 m².' },
    '267': { ru: 'Модульный парк - для помещений или поверхностей, где нельзя монтировать фундамент. Самонесущая конструкция из клеёного бруса, две трассы: 1 м для детей от 4 лет и 3,3 м для гостей от 6 лет. 12 этапов на 124 м².', en: 'A modular park - for indoors or surfaces where no foundation can be built. A self-supporting glued-beam structure, two routes: 1 m for kids 4+ and 3.3 m for guests 6+. 12 stages over 124 m².' },
    '236': { ru: 'Модульный парк для помещений или площадок без фундамента. Самонесущая конструкция из клеёного бруса, две трассы: 1 м для детей от 4 лет и 3,3 м для гостей от 6 лет. 16 этапов на 170 м².', en: 'A modular park for indoors or sites without a foundation. A self-supporting glued-beam structure, two routes: 1 m for kids 4+ and 3.3 m for guests 6+. 16 stages over 170 m².' },
    '232': { ru: 'Детский верёвочный парк без страховки - для дома, ресторана, как детская площадка и для коммерции там, где ограничены площадь и высота. Не нужны инструкторы - достаточно кассира-аниматора. Габарит 5,6×7,9 м, 10 этапов на 45 м².', en: 'A kids\' rope park without belay - for a home, a restaurant, a playground or commercial use where space and height are limited. No instructors needed - a cashier-animator is enough. 5.6×7.9 m, 10 stages over 45 m².' },
    '231': { ru: 'Детский верёвочный парк без страховки - для дома, ресторана, как детская площадка и для коммерции в компактных помещениях. Не требует инструкторов. Увеличенный габарит 5,6×11,8 м, 14 этапов на 66 м².', en: 'A kids\' rope park without belay - for a home, a restaurant, a playground or commercial use in compact spaces. No instructors required. A larger 5.6×11.8 m, 14 stages over 66 m².' },
    '263': { ru: 'Два троллея длиной 91 и 147 м. Башня - металлическая конструкция из опор труба 200×200 мм и сварных ферм. Парный спуск работает как главный аттрактор.', en: 'Two zip lines, 91 and 147 m. The tower is a steel structure of 200×200 mm pipe supports and welded trusses. The paired descent works as the headline attraction.' },
    '262': { ru: 'Мобильный троллей - устанавливается там, где нельзя заглубляться в грунт: в роли фундамента бетонные блоки. Длина 50 м, площадь 297 м².', en: 'A mobile zip line - installed where you can\'t dig into the ground: concrete blocks act as the foundation. 50 m long, 297 m².' },
    '261': { ru: 'Стартовая башня для троллея высотой 12 м - металлическая конструкция из опор труба 200×200 мм и сварных ферм. Точка старта линии полёта.', en: 'A 12 m start tower for a zip line - a steel structure of 200×200 mm pipe supports and welded trusses. The launch point of the flight line.' },
    '235': { ru: 'Финишная башня для троллея высотой 6 м - металлическая конструкция из опор труба 200×200 мм и сварных ферм. Приём и безопасное завершение линии полёта.', en: 'A 6 m finish tower for a zip line - a steel structure of 200×200 mm pipe supports and welded trusses. It receives and safely ends the flight line.' },
    '264': { ru: 'SkyRider - скоростной спуск по подвесному монорельсу с виражами, перепадами высот и скоростными пролётами. Здесь смонтирован на живых деревьях. 4 трассы, 43 этапа на 9408 м².', en: 'SkyRider - a high-speed ride along a suspended monorail with banking turns, height drops and fast straights. Here it\'s mounted on living trees. 4 routes, 43 stages over 9408 m².' },
    '265': { ru: 'SkyRider - скоростной спуск по подвесному монорельсу с виражами и перепадами высот. Вариант на металлических опорах - там, где нет крупных деревьев. Площадь 6072 м².', en: 'SkyRider - a high-speed ride along a suspended monorail with banking turns and height drops. The version on metal supports - where there are no large trees. 6072 m².' },
    '266': { ru: 'SkyRider - скоростной спуск по подвесному монорельсу с виражами и перепадами высот. Indoor-вариант работает круглый год и становится якорем для ТРЦ. Площадь 3900 м².', en: 'SkyRider - a high-speed ride along a suspended monorail with banking turns and height drops. The indoor version runs year-round and anchors a mall. 3900 m².' },
    '269': { ru: 'Сетчатый парк на опорах - для любой территории, фундамент на винтовых или буронабивных сваях. Каркас из трубы D219, трасса на высоте 3 м с сетчатой страховкой для детей от 4 лет; внизу можно сделать зону отдыха. 32 этапа на 352 м².', en: 'A net park on supports - for any site, foundation on screw or bored piles. A D219 pipe frame, a route at 3 m with net belay for kids 4+; a lounge zone can sit below. 32 stages over 352 m².' },
    '268': { ru: 'Сетчатый парк на деревьях максимально использует полезную площадь. Все этапы с сетчатой страховкой - ребёнок проходит трассы самостоятельно в любом направлении; можно добавить сетчатые элементы: куб, море, башни. 16 этапов на 1890 м².', en: 'A net park on trees makes the most of the available area. Every stage has net belay - a child passes the routes alone in any direction; net elements can be added: a cube, a sea, towers. 16 stages over 1890 m².' },
    '260': { ru: 'Сетчатый модульный парк - для помещений или площадок без фундамента. Самонесущая конструкция из клеёного бруса, две трассы: 1 м для детей от 4 лет и 3,3 м для гостей от 6 лет. 15 этапов на 153 м².', en: 'A modular net park - for indoors or sites without a foundation. A self-supporting glued-beam structure, two routes: 1 m for kids 4+ and 3.3 m for guests 6+. 15 stages over 153 m².' },
    '258': { ru: 'Сетчатый парк в помещении максимально использует инфраструктуру: опоры, подвесы к фермам, стены. Каркас из клеёного бруса на опорах ТЦ, трассы на 1 и 3,3 м для детей от 4 лет, все с сетчатой страховкой. 17 этапов на 113 м².', en: 'An indoor net park makes the most of the infrastructure: supports, truss suspensions, walls. A glued-beam frame on the mall\'s columns, routes at 1 and 3.3 m for kids 4+, all with net belay. 17 stages over 113 m².' },
    '386': { ru: 'Скалодром на башне высотой 12 м с основанием 4,8×4,8 м (возможно до 18 м на башне 6×6 м). На трассах автоматические страховки, а с башни можно сделать троллей или прыжок свободного падения.', en: 'A climbing wall on a 12 m tower with a 4.8×4.8 m base (up to 18 m on a 6×6 m tower). The routes use automatic belays, and the tower can host a zip line or a free-fall jump.' },
    '273': { ru: 'Верёвочный мост длиной 50 м - эффектный аттракцион для размещения над оврагами и перепадами рельефа. Самостоятельный элемент или связка между зонами маршрута.', en: 'A 50 m rope bridge - a striking attraction to span ravines and terrain drops. A standalone element or a link between route zones.' },
    '272': { ru: '«Лестница в небо» - аттракцион с автоматической страховкой TRUBLUE. Фотогеничный одиночный элемент, который притягивает посетителей и контент. Площадь 841 м².', en: 'A stairway to the sky - an attraction with the automatic TRUBLUE belay. A photogenic single element that draws guests and content. 841 m².' },
    '271': { ru: 'Качели на опорах или деревьях - новый захватывающий аттракцион. Высота 6, 10 или 12 м, исполнение в дереве или металле. Площадь 560 м².', en: 'A swing on supports or trees - a new thrilling attraction. Height 6, 10 or 12 m, built in wood or metal. 560 m².' },
    '270': { ru: 'Гигантские качели на 4 места - новый захватывающий аттракцион. Высота 6, 10 или 12 м, исполнение в дереве или металле. Катаются компанией - выше пропускная способность. Площадь 561 м².', en: 'A 4-seat giant swing - a new thrilling attraction. Height 6, 10 or 12 m, built in wood or metal. Groups ride together for higher throughput. 561 m².' },
  };
  const modelIdFromUrl = (m) => (String(m.url || '').match(/(\d+)\/?$/) || [])[1] || '';

  // Реальные характеристики (материалы) с rope-park.ru. Хвост общий, голова - по модели.
  const CHARS_TAIL = {
    ru: ['Переходные площадки: сухая строганная доска 36×145, финишная шлифовка р120','Несущие канаты: оцинкованный канат 7,6 мм грузолюдской, ГОСТ 2688','Канаты подвесов этапов: плетёный ПЭ-канат 16 мм','Металл и крепёж: оцинковка или порошковая окраска','Деревянные элементы: антисептик в 2 слоя'],
    en: ['Transition platforms: dry planed board 36×145, p120 finish sanding','Load-bearing ropes: galvanized 7.6 mm rated rope, GOST 2688','Stage suspension ropes: braided PE rope 16 mm','Metal and fasteners: galvanized or powder-coated','Wooden parts: antiseptic in 2 coats']
  };
  const _CH_WOOD = { ru:['Каркас: лиственницы, сосны, берёзы, дубы, клёны, липы'], en:['Frame: larch, pine, birch, oak, maple, linden'] };
  const _CH_BEAM = { ru:['Каркас: клеёный брус'], en:['Frame: glued beam'] };
  const _CH_D219 = { ru:['Каркас: труба D219','Фундамент: винтовые или буронабивные сваи'], en:['Frame: D219 pipe','Foundation: screw or bored piles'] };
  const _CH_200  = { ru:['Каркас: труба 200×200','Фундамент: винтовые или буронабивные сваи'], en:['Frame: 200×200 pipe','Foundation: screw or bored piles'] };
  const _CH_80   = { ru:['Каркас: труба 80×80','Фундамент: бетонные блоки'], en:['Frame: 80×80 pipe','Foundation: concrete blocks'] };
  const _CH_SR   = { ru:['Каркас SkyRider: металлическая труба'], en:['SkyRider frame: steel pipe'] };
  const CHARS_HEAD = {
    '252':_CH_WOOD,'253':_CH_WOOD,
    '245':_CH_D219,'244':_CH_D219,'269':_CH_D219,
    '259':_CH_BEAM,'267':_CH_BEAM,'236':_CH_BEAM,'232':_CH_BEAM,'231':_CH_BEAM,'268':_CH_BEAM,'260':_CH_BEAM,'258':_CH_BEAM,
    '263':_CH_200,'261':_CH_200,'235':_CH_200,
    '262':_CH_80,
    '264':_CH_SR,'265':_CH_SR,'266':_CH_SR,
  };
  const charsByModel = (m) => {
    const h = CHARS_HEAD[modelIdFromUrl(m)];
    if (!h) return null;
    const L = (lang() === 'en') ? 'en' : 'ru';
    return (h[L] || h.ru).concat(CHARS_TAIL[L] || CHARS_TAIL.ru);
  };


  const descByType  = (type) => (DESC_BY_TYPE[type] && DESC_BY_TYPE[type][lang()]) || (DESC_BY_TYPE[type] && DESC_BY_TYPE[type].ru) || (DESC_BY_TYPE['На деревьях'] && DESC_BY_TYPE['На деревьях'][lang()]) || '';
  const includesByType = (type) => {
    const obj = INCLUDES_BY_TYPE[type] || INCLUDES_BY_TYPE['default'];
    return (obj && obj[lang()]) || (obj && obj.ru) || [];
  };

  function parseIncome(str) {
    if (!str) return 0;
    return parseInt(String(str).replace(/\s|₽/g, ''), 10) || 0;
  }

  function buildFinmodel(m) {
    const annual = parseIncome(m.income) || 4000000;
    const seasonSum = SEASON.reduce((a, b) => a + b, 0);
    // Доход распределяем по сезонности
    const monthIncome = SEASON.map(c => Math.round((annual * c / seasonSum) / 1000) * 1000);
    // Расходы — сезонная ДОЛЯ дохода (зимой выше, летом ниже), но всегда меньше дохода,
    // поэтому каждый месяц в плюсе (никаких минусов в таблице). Нормируем так, чтобы
    // годовые расходы вышли ≈36% от выручки (как в их финмодели), итог по году не меняется.
    const shareW = SEASON.reduce((a, c, i) => a + c * COST_SHARE[i], 0) / seasonSum;
    const k = 0.36 / shareW;
    const monthCosts = monthIncome.map((mi, i) => Math.round(mi * COST_SHARE[i] * k / 1000) * 1000);
    const monthProfit = monthIncome.map((mi, i) => mi - monthCosts[i]);
    const totals = {
      income:  monthIncome.reduce((a, b) => a + b, 0),
      costs:   monthCosts.reduce((a, b) => a + b, 0),
      profit:  monthProfit.reduce((a, b) => a + b, 0),
    };
    return { monthIncome, monthCosts, monthProfit, totals };
  }

  // Курс ₽/$ - модель в рублях, но в EN-версии показываем доллары
  const USD_RATE = 90;
  const toUI = (n) => lang() === 'en' ? n / USD_RATE : n;

  const formatRub = (n) => {
    n = toUI(n);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + fl('mln');
    if (n >= 1_000)     return Math.round(n / 1_000) + fl('ths');
    return String(Math.round(n));
  };
  const formatFull = (n) => Math.round(toUI(n)).toLocaleString(lang() === 'en' ? 'en-US' : 'ru-RU').replace(/,/g, ' ');

  let modelChart = null;

  function renderModel(catKey, idx) {
    const items = CATALOG_DATA[catKey] || [];
    const m = items[+idx];
    if (!m) return;
    const fm = buildFinmodel(m);

    // RENDER - use orig (1:1.33, объект в центре, без дорисованной плашки снизу)
    if (modelHeroImg) {
      modelHeroImg.src = m.img.replace('/catalog/', '/catalog/orig/');
      // широкие технические рендеры (реальные с rope-park) выравниваем по верху
      const _topAlign = ['252', '253'].includes(modelIdFromUrl(m));
      if (modelHeroImg.parentElement) modelHeroImg.parentElement.classList.toggle('model__media-frame--top', _topAlign);
    }
    const isEn = lang() === 'en';
    if (modelKickerEl) modelKickerEl.textContent = (isEn && m.type_en)  ? m.type_en  : m.type;
    if (modelTitleEl)  modelTitleEl.textContent  = (isEn && m.title_en) ? m.title_en : m.title;

    // SPECS
    if (modelSpecsEl) {
      const specs = [];
      if (m.area)   specs.push(`<span><b>${m.area} ${fl('sqm')}</b><i>${fl('specsArea')}</i></span>`);
      if (m.stages) specs.push(`<span><b>${m.stages}</b><i>${fl('specsStg')}</i></span>`);
      if (m.tracks) specs.push(`<span><b>${m.tracks}</b><i>${fl('specsTrk')}</i></span>`);
      if (m.income) specs.push(`<span><b>${m.income} ${fl('rub')}</b><i>${fl('incomeYr')}</i></span>`);
      modelSpecsEl.innerHTML = specs.join('');
    }

    // DESCRIPTION - уникальная под модель, с fallback на тип
    if (modelDescEl) {
      const dm = DESC_BY_MODEL[modelIdFromUrl(m)];
      modelDescEl.textContent = dm
        ? ((lang() === 'en' && dm.en) ? dm.en : dm.ru)
        : descByType(m.type);
    }

    // INCLUDES
    if (modelIncludesEl) {
      const list = includesByType(m.type);
      modelIncludesEl.innerHTML = list.map(x => `<li>${x}</li>`).join('');
    }

    // CHARACTERISTICS (реальные материалы с rope-park, скрываем если нет)
    if (modelCharsEl && modelCharsSeg) {
      const ch = charsByModel(m);
      if (ch && ch.length) {
        modelCharsEl.innerHTML = ch.map(x => `<li>${x}</li>`).join('');
        modelCharsSeg.style.display = '';
      } else {
        modelCharsSeg.style.display = 'none';
      }
    }

    // TABLE
    if (modelTableEl) {
      const tb = modelTableEl.querySelector('tbody');
      const M = months();
      tb.innerHTML = M.map((mo, i) => `
        <tr>
          <td>${mo}</td>
          <td>${formatFull(fm.monthIncome[i])}</td>
          <td>${formatFull(fm.monthCosts[i])}</td>
          <td class="model__table-profit">${formatFull(fm.monthProfit[i])}</td>
        </tr>
      `).join('');
    }

    // TOTALS
    if (modelTotalsEl) {
      modelTotalsEl.innerHTML = `
        <div><span>${fl('yearIncome')}</span><b>${formatFull(fm.totals.income)} ${fl('rub')}</b></div>
        <div><span>${fl('yearCosts')}</span><b>${formatFull(fm.totals.costs)} ${fl('rub')}</b></div>
        <div class="model__totals-profit"><span>${fl('netProfit')}</span><b>${formatFull(fm.totals.profit)} ${fl('rub')}</b></div>
      `;
    }

    // CHART
    if (modelChart) { modelChart.destroy(); modelChart = null; }
    if (modelChartEl && window.Chart) {
      const ctx = modelChartEl.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      grad.addColorStop(0, 'rgba(58,125,68,0.55)');
      grad.addColorStop(1, 'rgba(58,125,68,0)');
      modelChart = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: months(),
          datasets: [
            { label: fl('legendInc'), data: fm.monthIncome, borderColor: '#3A7D44', backgroundColor: grad, fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#3A7D44' },
            { label: fl('legendPrf'), data: fm.monthProfit, borderColor: '#99AB47', backgroundColor: 'rgba(153,171,71,0)', fill: false, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#99AB47' },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700, easing: 'easeOutQuart' },
          plugins: {
            legend: { labels: { font: { family: 'Outfit', size: 13 }, color: 'rgba(26,31,22,0.75)', boxWidth: 10, boxHeight: 10, usePointStyle: true } },
            tooltip: {
              backgroundColor: '#1a1f16', titleColor: '#F5F3EF', bodyColor: '#99AB47',
              bodyFont: { family: 'Outfit', weight: '600' },
              padding: 10, cornerRadius: 8, displayColors: false,
              callbacks: { label: (c) => `${c.dataset.label}: ${formatFull(c.parsed.y)} ${fl('rub')}` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: 'rgba(26,31,22,0.55)', font: { family: 'Outfit', size: 12 } } },
            y: {
              beginAtZero: true,
              grid:   { color: 'rgba(26,31,22,0.06)', drawBorder: false },
              ticks:  { color: 'rgba(26,31,22,0.5)',  font: { family: 'Outfit', size: 13 }, callback: (v) => formatRub(v) },
              border: { display: false },
            },
          },
        },
      });
    }
  }

  // Smooth wheel scroll inside the modal (same pattern as About modal)
  let modelScrollTarget = 0;
  let modelScrollCurrent = 0;
  let modelScrollRaf = null;

  function modelScrollTick() {
    if (!modelSheet) { modelScrollRaf = null; return; }
    const diff = modelScrollTarget - modelScrollCurrent;
    modelScrollCurrent += diff * 0.18;
    modelSheet.scrollTop = modelScrollCurrent;
    if (Math.abs(diff) > 0.4) modelScrollRaf = requestAnimationFrame(modelScrollTick);
    else { modelScrollCurrent = modelScrollTarget; modelSheet.scrollTop = modelScrollCurrent; modelScrollRaf = null; }
  }
  function modelWheelHandler(e) {
    if (!modelSheet) return;
    e.preventDefault();
    e.stopPropagation();
    const max = Math.max(0, modelSheet.scrollHeight - modelSheet.clientHeight);
    modelScrollTarget = Math.max(0, Math.min(max, modelScrollTarget + e.deltaY));
    if (modelScrollRaf == null) modelScrollRaf = requestAnimationFrame(modelScrollTick);
  }

  function openModel(catKey, idx) {
    if (!modelModal) return;
    renderModel(catKey, idx);
    modelModal.classList.add('is-open');
    modelModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (locoScroll && typeof locoScroll.stop === 'function') locoScroll.stop();
    modelModal.addEventListener('wheel', modelWheelHandler, { passive: false, capture: true });
    if (modelSheet) { modelSheet.scrollTop = 0; modelScrollTarget = 0; modelScrollCurrent = 0; }
  }
  function closeModel() {
    if (!modelModal) return;
    modelModal.classList.remove('is-open');
    modelModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modelModal.removeEventListener('wheel', modelWheelHandler, { capture: true });
    if (modelScrollRaf != null) { cancelAnimationFrame(modelScrollRaf); modelScrollRaf = null; }
    // Не запускаем скролл, если поверх открыта quote-модалка - она сама стартует Locomotive при закрытии
    var qm = document.getElementById('quoteModal');
    var quoteOpen = qm && qm.classList.contains('is-open');
    if (!quoteOpen && locoScroll && typeof locoScroll.start === 'function') locoScroll.start();
  }

  // Click a catalog card → open model modal
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.catalog__card[data-cat-key]');
    if (!card) return;
    e.preventDefault();
    openModel(card.dataset.catKey, card.dataset.catIdx);
  });

  modelClose?.addEventListener('click', closeModel);
  modelModal?.addEventListener('click', (e) => { if (e.target === modelModal) closeModel(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modelModal?.classList.contains('is-open')) closeModel();
  });
  document.querySelectorAll('[data-close-model]').forEach(el => {
    el.addEventListener('click', () => setTimeout(closeModel, 60));
  });

  // ══════════════════════════════════════════
  // REVIEWS SWIPER + VIDEO MODAL
  // ══════════════════════════════════════════
  let reviewsSwiper = null;
  const reviewsCounter = document.getElementById('reviewsCounter');
  const reviewsSlides = document.querySelectorAll('#reviewsSwiper .swiper-slide');
  const reviewsTotal = reviewsSlides.length;

  function setReviewsCounter(i) {
    if (!reviewsCounter || !reviewsTotal) return;
    const n = ((i % reviewsTotal) + reviewsTotal) % reviewsTotal;
    reviewsCounter.textContent = `${String(n + 1).padStart(2,'0')} / ${String(reviewsTotal).padStart(2,'0')}`;
  }

  function initReviewsSwiper() {
    if (!window.Swiper || !document.getElementById('reviewsSwiper')) return;
    reviewsSwiper = new window.Swiper('#reviewsSwiper', {
      slidesPerView: 1,
      spaceBetween: 18,
      loop: true,
      grabCursor: true,
      speed: 700,
      navigation: { nextEl: '#reviewsNext', prevEl: '#reviewsPrev' },
      breakpoints: {
        700:  { slidesPerView: 2, spaceBetween: 20 },
        1300: { slidesPerView: 2, spaceBetween: 24 },
      },
      on: {
        init: () => setReviewsCounter(0),
        slideChange: (sw) => setReviewsCounter(sw.realIndex),
      },
    });
  }

  if (window.Swiper) initReviewsSwiper();
  else {
    const t = setInterval(() => {
      if (window.Swiper) { clearInterval(t); initReviewsSwiper(); }
    }, 120);
  }

  // Video modal
  const videoModal       = document.getElementById('videoModal');
  const videoModalPlayer = document.getElementById('videoModalPlayer');
  const videoModalClose  = document.getElementById('videoModalClose');

  function openVideo(src) {
    if (!videoModal || !videoModalPlayer) return;
    videoModalPlayer.src = src;
    videoModal.classList.add('is-open');
    videoModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    videoModalPlayer.muted = false;
    videoModalPlayer.play().catch(() => {
      // autoplay blocked → user can still press play in controls
    });
  }
  function closeVideo() {
    if (!videoModal || !videoModalPlayer) return;
    videoModalPlayer.pause();
    videoModalPlayer.removeAttribute('src');
    videoModalPlayer.load();
    videoModal.classList.remove('is-open');
    videoModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  // Видео-отзывы играют ПРЯМО в карточке (как в SkyRider), без модалки.
  // Делегирование: ловим клик на любом .review__video-wrap, включая клоны слайдов Swiper (loop:true).
  document.addEventListener('click', (e) => {
    const wrap = e.target.closest('.review__video-wrap');
    if (!wrap) return;
    const card = wrap.closest('.review--video');
    if (!card || card.classList.contains('is-playing')) return;
    const src = card.dataset.video;
    if (!src) return;
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.playsInline = true;
    v.autoplay = true;
    v.preload = 'auto';
    v.setAttribute('poster', card.dataset.poster || '');
    wrap.appendChild(v);
    card.classList.add('is-playing');
    v.play().catch(() => {});
    v.addEventListener('pause', () => {
      if (v.currentTime === 0 || v.ended) card.classList.remove('is-playing');
    });
  });
  videoModalClose?.addEventListener('click', closeVideo);
  videoModal?.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideo();
  });
  document.addEventListener('keydown', (e) => {
    if (!videoModal?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeVideo();
  });

  // ══════════════════════════════════════════
  // CONTACT FORM: save name to sessionStorage, redirect to thank-you
  // ══════════════════════════════════════════
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = contactForm.querySelector('input[name="name"]')?.value || '';
    const phone = contactForm.querySelector('input[name="phone"]')?.value || '';
    if (name) sessionStorage.setItem('rp-lead-name', name);
    if (phone) sessionStorage.setItem('rp-lead-phone', phone);
    const btn = contactForm.querySelector('button[type="submit"] span');
    if (btn) btn.textContent = 'Отправляем…';
    const topicEl = contactForm.querySelector('select[name="topic"]');
    const note = 'Что интересует: ' + (topicEl ? topicEl.value : '-') + ' | Источник: rparkgroup.ru (форма «Рассчитать парк»)';
    if (window.sendAmoLead) window.sendAmoLead({ name: name, phone: phone, note: note });
    setTimeout(() => { window.location.href = 'thank-you.html'; }, 900);
  });

  // ══════════════════════════════════════════
  // FINLAB - mega-calculator (v4 - R-Park FIN_MODEL)
  // ══════════════════════════════════════════
  (function initFinlab() {
    const finlab = document.getElementById('finlab');
    if (!finlab) return;

    // Lock Chart.js typography to a single family so the charts stop mixing
    // system fallback fonts in for the tiny tick labels.
    if (window.Chart) {
      window.Chart.defaults.font.family = "'Outfit', 'Inter', system-ui, sans-serif";
      window.Chart.defaults.font.size = 13;
      window.Chart.defaults.font.weight = '500';
    }

    // ─── REAL R-Park FIN_MODEL (Excel «Расчёт окупаемости 2025») ──
    // Сезонность: лето - пик, зима - провал. Не путать со старой ошибочной версией.
    const FL_SEASON = [0.3, 0.3, 0.3, 0.4, 1.2, 1.2, 1.1, 1.2, 0.6, 0.3, 0.3, 0.3];
    const FL_SEASON_SUM = FL_SEASON.reduce((a, b) => a + b, 0); // 7.5
    // FL_MONTHS becomes a getter - отражает текущий язык для всех графиков.
    const FL_MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const FL_MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const flMonths = () => (lang() === 'en' ? FL_MONTHS_EN : FL_MONTHS_RU);
    const FL_MONTHS = FL_MONTHS_RU; // legacy reference

    // 7 трасс R-Park (источник: Excel «Расчёт окупаемости 2025», лист «Финмодель», B6:C12).
    // Чек на трассу не задаётся индивидуально - в модели заказчика все посетители считаются
    // через единый «средний чек парка» (L6 = 2000 ₽). Slider «Средний чек» в UI заменяет L6.
    const ROUTES = [
      { name: 'Сетчатая',   time: 15, stages: 16 },
      { name: 'Нижняя',     time: 15, stages: 13 },
      { name: 'Средняя',    time: 15, stages: 14 },
      { name: 'Верхняя',    time: 15, stages: 13 },
      { name: 'Троллейная', time: 12, stages: 11 }, // в Excel B10=12, не 15 (в брифе была опечатка)
      { name: 'Zipliner',   time:  2, stages:  1 },
      { name: 'Батуты',     time: 15, stages:  3 },
    ];
    const SHIFT_HOURS    = 10;
    const DAYS_PER_MONTH = 30;

    // Групповая анимация (база) - скейлится сезонностью
    const GROUP_BASE_PER_MONTH = 50;
    const GROUP_PRICE          = 15000;

    // Расходы (₽/мес). seasonal=true → × коэф сезона × регион.
    const EXPENSES = {
      internet:   { value: 1500,   seasonal: false, label: 'Интернет' },
      utilities:  { value: 30000,  seasonal: false, label: 'Коммунальные услуги' },
      marketing:  { value: 100000, seasonal: false, label: 'Маркетинг' },
      cashier:    { value: 120000, seasonal: true,  label: 'Кассиры (2 чел., 2/2)' },
      instructor: { value: 550000, seasonal: true,  label: 'Инструкторы (10 чел., 2/2)' },
      manager:    { value: 100000, seasonal: true,  label: 'Управляющий (оклад)' },
    };
    const MANAGER_BONUS_PCT = 0.10; // 10% от операционной прибыли

    // Format labels for PDF / tooltips
    const FORMAT_LABEL = {
      'rope-support':  'Верёвочный · опоры',
      'rope-tree':     'Верёвочный · деревья',
      'rope-modular':  'Модульный',
      'rope-indoor':   'В помещении',
      'skyrider':      'SkyRider',
      'trolls':        'Троллей',
      'maze':          'Сетчатый лабиринт',
    };
    // Build-timeline steps per format (generic)
    const FL_BUILD_STEPS = {
      default: [
        'Замер площадки и ТЗ',
        'Проектирование и 3D-визуализация',
        'Производство в цехе (Уфа)',
        'Фундаменты и подготовка площадки',
        'Монтаж конструкций и снаряжения',
        'Испытания, обучение и открытие',
      ],
      'skyrider': [
        'Геодезия и привязка к рельефу',
        'Проект и пакет документации',
        'Производство кареток и несущих элементов',
        'Монтаж опор и тросовой системы',
        'Пуско-наладка приводов',
        'Испытания и запуск парка',
      ],
    };

    const fmtRub = (n) => {
      if (!isFinite(n)) return '-';
      n = toUI(n);
      const abs = Math.abs(n);
      const sign = n < 0 ? '−' : '';
      if (abs >= 1_000_000) {
        const v = abs / 1_000_000;
        return sign + (v >= 10 ? Math.round(v) : v.toFixed(1).replace('.0','')) + fl('mln');
      }
      if (abs >= 1_000) return sign + Math.round(abs / 1_000) + fl('ths');
      return sign + String(Math.round(abs));
    };
    const fmtFull = (n) => Math.round(toUI(n)).toLocaleString(lang() === 'en' ? 'en-US' : 'ru-RU').replace(/,/g, ' ');
    const clampN  = (v, min, max) => Math.max(min, Math.min(max, v));

    // ─── DOM ────────────────────────────────
    const scenarioA  = finlab.querySelector('.finlab__scenario--a');
    const stressOpts = finlab.querySelectorAll('.finlab__stress-opt');
    const outputs    = finlab.querySelector('#finlabOutputs');
    const kpiEls     = {
      yearlyIncome:  outputs.querySelector('[data-kpi="yearlyIncome"]'),
      payback:       outputs.querySelector('[data-kpi="payback"]'),
      margin:        outputs.querySelector('[data-kpi="margin"]'),
      yearlyProfit:  outputs.querySelector('[data-kpi="yearlyProfit"]'),
    };
    const incomeCanvas  = outputs.querySelector('#finlabChartIncome');
    const paybackCanvas = outputs.querySelector('#finlabChartPayback');
    const timelineEl    = outputs.querySelector('#finlabTimeline');
    const totalMonthsEl = outputs.querySelector('#finlabTotalMonths');
    const pdfBtn        = outputs.querySelector('#finlabPdfBtn');
    const requestBtn    = outputs.querySelector('#finlabRequestBtn');

    // Theme-aware palette for charts (read current <html data-theme>)
    function palette() {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      return dark
        ? {
            text:      'rgba(245,243,239,0.82)',
            textDim:   'rgba(245,243,239,0.55)',
            textFaint: 'rgba(245,243,239,0.35)',
            grid:      'rgba(245,243,239,0.08)',
            accent:    '#99AB47',
            accent2:   '#B5C65E',
            alt:       '#D29F6B',
            tooltipBg: '#1a1f16',
            tooltipFg: '#F5F3EF',
          }
        : {
            text:      'rgba(26,31,22,0.82)',
            textDim:   'rgba(26,31,22,0.55)',
            textFaint: 'rgba(26,31,22,0.4)',
            grid:      'rgba(26,31,22,0.06)',
            accent:    '#3A7D44',
            accent2:   '#99AB47',
            alt:       '#B37C4B',
            tooltipBg: '#1a1f16',
            tooltipFg: '#F5F3EF',
          };
    }

    // Set default dates if empty
    const today = new Date();
    const defaultStart = today.toISOString().split('T')[0];
    {
      const dateEl = scenarioA && scenarioA.querySelector('input[type="date"]');
      if (dateEl && !dateEl.value) dateEl.value = defaultStart;
    }

    // ─── theoretical capacity (people / month, без сезона, без util) ──
    // Формула из Excel:
    //   единовременная_загрузка = stages × 3
    //   посетителей_в_час       = (загрузка / время_прохождения) × 60
    //   за_смену_10ч            = посетителей_в_час × 10
    //   за_месяц                = смена × 30
    const ROUTE_CAPACITY = ROUTES.map(r => {
      const singleLoad = r.stages * 3;
      const perHour    = (singleLoad / r.time) * 60;
      const perShift   = perHour * SHIFT_HOURS;
      const perMonth   = perShift * DAYS_PER_MONTH;
      return { name: r.name, capacityMonth: perMonth };
    });
    const TOTAL_THEORETICAL_VISITORS_MONTH = ROUTE_CAPACITY.reduce((a, r) => a + r.capacityMonth, 0);
    // Расчёт выручки трасс = всего посетителей × средний чек парка (как в Excel: H17 × L6).
    // Чек берётся из slider'а (collectParams.check), референс L6 = 2000 ₽.

    // ─── collect params ──────────────────────
    function collectParams(scEl) {
      const activeChip = scEl.querySelector('.finlab__chip.is-active');
      const format = activeChip ? activeChip.dataset.v : 'rope-support';
      const capex  = parseInt  (scEl.querySelector('input[data-field="capex"]').value, 10)  || 12_000_000;
      const util   = parseFloat(scEl.querySelector('input[data-field="util"]').value)       || 1;    // %, 1-10
      const check  = parseInt  (scEl.querySelector('input[data-field="check"]').value, 10)  || 2000;
      const rent   = parseInt  (scEl.querySelector('input[data-field="rent"]').value, 10)   || 0;
      const region = parseFloat(scEl.querySelector('select[data-field="region"]').value)    || 1.0;
      const start  = scEl.querySelector('input[data-field="start"]').value || defaultStart;
      return { format, capex, util, check, rent, region, start };
    }

    // ─── calc ────────────────────────────────
    // Формула 1:1 из Excel заказчика (лист «Финмодель», без багов окт-дек):
    //   utilization        = util / 100
    //   visitorsMonthBase  = TOTAL_THEORETICAL_VISITORS_MONTH × utilization        (H17 × G4)
    //   visitorsMonth[m]   = visitorsMonthBase × seasonCoef[m]                     (B31 × C30..N30)
    //   monthRoutes[m]     = visitorsMonth[m] × averageCheck                       (C31 × C32, где C32=L6)
    //   monthGroup[m]      = GROUP_BASE_PER_MONTH × seasonCoef[m] × GROUP_PRICE    (C37 × B38)
    //   monthIncome[m]     = monthRoutes[m] + monthGroup[m]                        (C29)
    //
    //   fixedExpenses      = internet + utilities + marketing
    //   seasonalFOT        = cashier + instructor + manager
    //   monthExpenses[m]   = fixedExpenses + seasonalFOT × seasonCoef[m] × region + rent
    //   monthOperating[m]  = monthIncome[m] − monthExpenses[m]                     (C39)
    //   monthBonus[m]      = max(monthOperating[m], 0) × 0.10                      (C40)
    //   monthProfit[m]     = monthOperating[m] − monthBonus[m]                     (C41)
    function calc(p) {
      const utilization = clampN(p.util, 0, 100) / 100;
      const visitorsMonthBase = TOTAL_THEORETICAL_VISITORS_MONTH * utilization;

      // Фикс / ФОТ суммы (без сезона)
      const fixedMonthly  = Object.values(EXPENSES)
        .filter(e => !e.seasonal).reduce((a, e) => a + e.value, 0);
      const seasonalBase  = Object.values(EXPENSES)
        .filter(e =>  e.seasonal).reduce((a, e) => a + e.value, 0);

      const monthIncome   = new Array(12);
      const monthCosts    = new Array(12);
      const monthProfit   = new Array(12);
      const monthGroup    = new Array(12);
      const monthRoutes   = new Array(12);
      const monthBonus    = new Array(12);
      const monthOperating= new Array(12);

      for (let m = 0; m < 12; m++) {
        const sc = FL_SEASON[m];
        const visitors = visitorsMonthBase * sc;
        const routes = visitors * p.check;                       // средний чек парка из slider'а
        const group  = GROUP_BASE_PER_MONTH * sc * GROUP_PRICE;
        const income = routes + group;

        const seasonalCost = seasonalBase * sc * p.region;
        const cost = fixedMonthly + seasonalCost + p.rent;

        const operating = income - cost;
        const bonus = Math.max(0, operating) * MANAGER_BONUS_PCT;
        const profit = operating - bonus;

        monthRoutes[m]    = routes;
        monthGroup[m]     = group;
        monthIncome[m]    = income;
        monthCosts[m]     = cost;
        monthOperating[m] = operating;
        monthBonus[m]     = bonus;
        monthProfit[m]    = profit;
      }

      const yearlyIncome    = monthIncome.reduce((a, b) => a + b, 0);
      const yearlyCosts     = monthCosts.reduce ((a, b) => a + b, 0);
      const yearlyOperating = monthOperating.reduce((a, b) => a + b, 0);
      const yearlyBonus     = monthBonus.reduce((a, b) => a + b, 0);
      const yearlyProfit    = monthProfit.reduce((a, b) => a + b, 0);
      const marginPct = yearlyIncome > 0 ? (yearlyProfit / yearlyIncome) * 100 : 0;

      const investment = p.capex;
      const monthlyProfitAvg = yearlyProfit / 12;
      const paybackMonths = monthlyProfitAvg > 0 ? investment / monthlyProfitAvg : Infinity;

      // Visitor count (для стейтментов) - visitorsMonthBase уже посчитан выше
      const yearlyVisitors = FL_SEASON.reduce((a, sc) => a + visitorsMonthBase * sc, 0);

      return {
        yearlyIncome, yearlyCosts, yearlyOperating, yearlyBonus, yearlyProfit,
        marginPct, paybackMonths, investment,
        monthIncome, monthProfit, monthCosts, monthRoutes, monthGroup, monthOperating, monthBonus,
        yearlyVisitors,
        params: p,
      };
    }

    // ─── count-up ────────────────────────────
    function countUp(el, from, to, unit, ms = 700) {
      if (!el) return;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        const v = from + (to - from) * eased;
        el.textContent = formatKpi(v, unit);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = formatKpi(to, unit);
      };
      requestAnimationFrame(step);
    }
    function formatKpi(v, unit) {
      if (unit === 'rub-short') return fmtRub(v);
      if (unit === 'rub-full')  return fmtFull(v);
      if (unit === 'months')    return (v === Infinity ? '∞' : Math.round(v).toString());
      if (unit === 'pct')       return Math.round(v).toString();
      return String(Math.round(v));
    }

    // store last values for smooth animation
    const lastKpi = { yearlyIncome: 0, payback: 0, margin: 0, yearlyProfit: 0 };

    function renderKPIs(rA) {
      const yiTo = rA.yearlyIncome;
      const pbTo = isFinite(rA.paybackMonths) ? rA.paybackMonths : 0;
      const mTo  = rA.marginPct;
      const ypTo = rA.yearlyProfit;
      countUp(kpiEls.yearlyIncome, lastKpi.yearlyIncome, yiTo, 'rub-short');
      countUp(kpiEls.payback,      lastKpi.payback,      pbTo, 'months');
      countUp(kpiEls.margin,       lastKpi.margin,       mTo,  'pct');
      countUp(kpiEls.yearlyProfit, lastKpi.yearlyProfit, ypTo, 'rub-short');
      lastKpi.yearlyIncome = yiTo;
      lastKpi.payback      = pbTo;
      lastKpi.margin       = mTo;
      lastKpi.yearlyProfit = ypTo;
    }

    // ─── charts ──────────────────────────────
    let incomeChart = null;
    let paybackChart = null;

    function renderIncomeChart(rA) {
      if (!incomeCanvas || !window.Chart) return;
      const ctx = incomeCanvas.getContext('2d');
      const p = palette();
      const grad = ctx.createLinearGradient(0, 0, 0, 220);
      const rgb = p.accent === '#99AB47' ? '153,171,71' : '58,125,68';
      grad.addColorStop(0, `rgba(${rgb},0.5)`);
      grad.addColorStop(1, `rgba(${rgb},0)`);

      const isEn = lang() === 'en';
      const datasets = [{
        label: isEn ? 'Revenue' : 'Выручка',
        data: rA.monthIncome,
        borderColor: p.accent,
        backgroundColor: grad,
        fill: true, tension: 0.35, borderWidth: 2.5,
        pointRadius: 3, pointBackgroundColor: p.accent,
      }, {
        label: isEn ? 'Costs' : 'Расходы',
        data: rA.monthCosts,
        borderColor: p.alt, backgroundColor: 'rgba(0,0,0,0)',
        fill: false, tension: 0.35, borderWidth: 2,
        pointRadius: 2.5, pointBackgroundColor: p.alt,
        borderDash: [2, 2],
      }, {
        label: isEn ? 'Net profit' : 'Чистая прибыль',
        data: rA.monthProfit,
        borderColor: p.accent2, backgroundColor: 'rgba(0,0,0,0)',
        fill: false, tension: 0.35, borderWidth: 2,
        pointRadius: 2.5, pointBackgroundColor: p.accent2,
        borderDash: [4, 3],
      }];

      if (incomeChart) { incomeChart.destroy(); incomeChart = null; }
      incomeChart = new window.Chart(ctx, {
        type: 'line',
        data: { labels: flMonths(), datasets },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 700, easing: 'easeOutQuart' },
          plugins: {
            legend: { labels: { font: { family: 'Outfit', size: 13, weight: '600' }, color: p.text, usePointStyle: true, boxWidth: 10, boxHeight: 10, padding: 16 } },
            tooltip: {
              backgroundColor: p.tooltipBg, titleColor: p.tooltipFg, bodyColor: p.accent2,
              padding: 12, cornerRadius: 8, displayColors: false,
              titleFont: { family: 'Outfit', size: 13, weight: '600' },
              bodyFont: { family: 'Outfit', size: 13, weight: '600' },
              callbacks: { label: (c) => `${c.dataset.label}: ${fmtFull(c.parsed.y)} ${fl('rub')}` },
            },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: p.textDim, font: { family: 'Outfit', size: 12 } } },
            y: {
              beginAtZero: true,
              grid: { color: p.grid, drawBorder: false },
              ticks: { color: p.textFaint, font: { family: 'Outfit', size: 13 }, callback: (v) => fmtRub(v) },
              border: { display: false },
            },
          },
        },
      });
    }

    function renderPaybackChart(rA) {
      if (!paybackCanvas || !window.Chart) return;
      const ctx = paybackCanvas.getContext('2d');
      const p = palette();

      const yourMonths = isFinite(rA.paybackMonths) ? Math.round(rA.paybackMonths) : 60;

      // Benchmark bar color: soft accent tint
      const benchTint = p.accent === '#99AB47'
        ? 'rgba(245,243,239,0.18)'
        : 'rgba(26,31,22,0.14)';

      const isEnPB = lang() === 'en';
      const labels = isEnPB
        ? ['Your park', 'Trampoline park', 'Karting', 'Water park']
        : ['Ваш парк',  'Батут-парк',      'Картинг', 'Аквапарк'];
      const data   = [yourMonths, 24, 42, 60];
      const colors = [p.accent, benchTint, benchTint, benchTint];

      if (paybackChart) { paybackChart.destroy(); paybackChart = null; }
      paybackChart = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: fl('paybackMo'),
            data,
            backgroundColor: colors,
            borderRadius: 8,
            barThickness: 28,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          animation: { duration: 700, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: p.tooltipBg, titleColor: p.tooltipFg, bodyColor: p.accent2,
              padding: 12, cornerRadius: 8, displayColors: false,
              titleFont: { family: 'Outfit', size: 13, weight: '600' },
              bodyFont: { family: 'Outfit', size: 13, weight: '600' },
              callbacks: { label: (c) => `${c.parsed.x}${fl('moDot')}` },
            },
          },
          scales: {
            x: { beginAtZero: true, grid: { color: p.grid, drawBorder: false }, ticks: { color: p.textFaint, font: { family: 'Outfit', size: 12 } }, border: { display: false } },
            y: { grid: { display: false }, ticks: { color: p.text, font: { family: 'Outfit', size: 14, weight: '600' } } },
          },
        },
      });
    }

    // ─── timeline ────────────────────────────
    function renderTimeline(p) {
      if (!timelineEl) return;
      const steps = FL_BUILD_STEPS[p.format] || FL_BUILD_STEPS.default;
      const startDate = p.start ? new Date(p.start) : new Date();
      const isEn = lang() === 'en';
      const M = flMonths();

      const html = steps.map((label, i) => {
        const d = new Date(startDate);
        d.setMonth(d.getMonth() + i);
        const mName = M[d.getMonth()] + ' ' + (d.getFullYear() % 100);
        const isFinal = i === steps.length - 1;
        const finalPrefix = isEn ? 'Park opening · ' : 'Открытие парка · ';
        return `
          <div class="finlab__timeline-step ${isFinal ? 'is-final' : ''}">
            <span class="finlab__timeline-step-num">${String(i + 1).padStart(2, '0')}</span>
            <span class="finlab__timeline-time">${mName}</span>
            <span class="finlab__timeline-text">${isFinal ? finalPrefix + label : label}</span>
          </div>
        `;
      }).join('');
      timelineEl.innerHTML = html;
      if (totalMonthsEl) totalMonthsEl.textContent = '~' + steps.length + fl('mo');
    }

    // ─── output sync (range <output> labels) ─
    function syncRangeOutputs(scEl) {
      const sync = (field, format) => {
        const input  = scEl.querySelector(`input[data-field="${field}"]`);
        const output = scEl.querySelector(`output[data-out="${field}"]`);
        if (!input || !output) return;
        output.textContent = format(input.value);
      };
      const locale = () => (lang() === 'en' ? 'en-US' : 'ru-RU');
      sync('capex', v => {
        const n = parseInt(v, 10);
        if (n >= 1_000_000) {
          const m = n / 1_000_000;
          return (m % 1 === 0 ? m : m.toFixed(1).replace('.0','')) + fl('mlnRub');
        }
        return n.toLocaleString(locale()).replace(/,/g, ' ') + ' ' + fl('rub');
      });
      sync('util',  v => `${parseFloat(v).toFixed(1)}%`);
      sync('check', v => `${parseInt(v, 10).toLocaleString(locale()).replace(/,/g, ' ')} ${fl('rub')}`);
      sync('rent',  v => v > 0
        ? `${parseInt(v, 10).toLocaleString(locale()).replace(/,/g, ' ')}${fl('rubMo')}`
        : `0${fl('rubMo')}`);

      // Подсветка стресс-пресета: совпадает ли текущая утилизация с одним из пресетов
      const utilInput = scEl.querySelector('input[data-field="util"]');
      const currentUtil = utilInput ? parseFloat(utilInput.value) : NaN;
      stressOpts.forEach(opt => {
        const presetVal = parseFloat(opt.dataset.util);
        opt.classList.toggle('is-active', Math.abs(presetVal - currentUtil) < 0.01);
      });
      finlab.classList.toggle('is-stressed', currentUtil <= 2);
    }

    // ─── master recompute ────────────────────
    let recTimer = null;
    function scheduleRecompute() {
      clearTimeout(recTimer);
      recTimer = setTimeout(recompute, 120);
    }

    function recompute() {
      syncRangeOutputs(scenarioA);

      const pA = collectParams(scenarioA);
      const rA = calc(pA);

      renderKPIs(rA);
      renderIncomeChart(rA);
      renderPaybackChart(rA);
      renderTimeline(pA);
    }

    // На смену языка пересчитываем финлаб - пересоздадим графики с новыми
    // подписями и обновим текстовые блоки таймлайна / output'ов.
    document.addEventListener('rpark:langchange', () => scheduleRecompute());
    // Также - если открыта модалка модели - перерисовать её
    document.addEventListener('rpark:langchange', () => {
      const open = document.querySelector('.model.is-open[data-cat-key], .model.is-open');
      if (open && window.__rparkRenderActiveModel) window.__rparkRenderActiveModel();
    });

    // ─── listeners ───────────────────────────
    function bindScenario(scEl) {
      if (!scEl) return;
      // chips (формат)
      scEl.querySelectorAll('.finlab__chip').forEach(chip => {
        chip.addEventListener('click', () => {
          scEl.querySelectorAll('.finlab__chip').forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          scheduleRecompute();
        });
      });
      // inputs (range / date / select)
      scEl.querySelectorAll('input[type="range"], input[type="date"], select').forEach(el => {
        el.addEventListener('input',  scheduleRecompute);
        el.addEventListener('change', scheduleRecompute);
      });
    }
    bindScenario(scenarioA);

    // ─── stress-test presets - двигают slider утилизации ─
    stressOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        const utilInput = scenarioA.querySelector('input[data-field="util"]');
        if (!utilInput) return;
        const target = parseFloat(opt.dataset.util) || 1;
        utilInput.value = target;
        // Триггерим input - расчёт пройдёт через scheduleRecompute, который и подсветит активный пресет
        utilInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });

    // ─── PDF export ──────────────────────────
    pdfBtn?.addEventListener('click', async () => {
      if (!window.html2pdf) {
        alert('PDF-экспорт временно недоступен');
        return;
      }
      const original = pdfBtn.innerHTML;
      pdfBtn.innerHTML = '<span>Готовим PDF…</span>';
      pdfBtn.disabled = true;
      try {
        // build a clean snapshot from outputs + params summary
        const pA = collectParams(scenarioA);
        const rA = calc(pA);

        const wrap = document.createElement('div');
        wrap.style.cssText = [
          'position:fixed',
          'top:0',
          'left:0',
          'width:794px',                  // A4 width @ 96dpi
          'padding:40px',
          'box-sizing:border-box',
          'font-family: Inter, Arial, sans-serif',
          'color:#1a1f16',
          'background:#F5F3EF',
          'z-index:-1',
          'opacity:0',
          'pointer-events:none',
        ].join(';');
        wrap.innerHTML = `
          <h1 style="font-family:Outfit,sans-serif; font-size:28px; margin:0 0 6px;">Финансовая модель · Rope Park</h1>
          <p style="margin:0 0 24px; color:#6a6e60;">Сценарий: ${FORMAT_LABEL[pA.format] || pA.format} · стоимость объекта ${fmtRub(pA.capex)} ₽ · чек ${pA.check} ₽ · загрузка ${parseFloat(pA.util).toFixed(1)}% · регион ×${pA.region}${pA.rent > 0 ? ' · аренда ' + fmtFull(pA.rent) + ' ₽/мес' : ''}</p>
          <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
            <tr>
              <td style="padding:12px; background:#fff; border-radius:8px; width:25%;"><b style="font-family:Outfit,sans-serif; font-size:20px; display:block;">${fmtRub(rA.yearlyIncome)} ₽</b><span style="color:#6a6e60; font-size:12px;">Годовой доход</span></td>
              <td style="width:8px;"></td>
              <td style="padding:12px; background:#fff; border-radius:8px; width:25%;"><b style="font-family:Outfit,sans-serif; font-size:20px; display:block;">${isFinite(rA.paybackMonths) ? Math.round(rA.paybackMonths) : '∞'} мес</b><span style="color:#6a6e60; font-size:12px;">Окупаемость</span></td>
              <td style="width:8px;"></td>
              <td style="padding:12px; background:#fff; border-radius:8px; width:25%;"><b style="font-family:Outfit,sans-serif; font-size:20px; display:block;">${Math.round(rA.marginPct)} %</b><span style="color:#6a6e60; font-size:12px;">Маржа</span></td>
              <td style="width:8px;"></td>
              <td style="padding:12px; background:#3A7D44; color:#F5F3EF; border-radius:8px; width:25%;"><b style="font-family:Outfit,sans-serif; font-size:20px; display:block;">${fmtRub(rA.yearlyProfit)} ₽</b><span style="color:rgba(245,243,239,0.8); font-size:12px;">Чистая прибыль/год</span></td>
            </tr>
          </table>
          <h2 style="font-family:Outfit,sans-serif; font-size:18px; margin:0 0 10px;">Ежемесячная структура</h2>
          <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:20px;">
            <thead>
              <tr style="background:#e5e0d3;">
                <th style="padding:8px; text-align:left;">Месяц</th>
                <th style="padding:8px; text-align:right;">Выручка, ₽</th>
                <th style="padding:8px; text-align:right;">Расходы, ₽</th>
                <th style="padding:8px; text-align:right;">Прибыль, ₽</th>
              </tr>
            </thead>
            <tbody>
              ${FL_MONTHS.map((mo, i) => `
                <tr style="border-bottom:1px solid #e5e0d3;">
                  <td style="padding:6px 8px;">${mo}</td>
                  <td style="padding:6px 8px; text-align:right;">${fmtFull(rA.monthIncome[i])}</td>
                  <td style="padding:6px 8px; text-align:right;">${fmtFull(rA.monthCosts[i])}</td>
                  <td style="padding:6px 8px; text-align:right; color:#3A7D44; font-weight:600;">${fmtFull(rA.monthProfit[i])}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="margin:40px 0 0; color:#6a6e60; font-size:11px;">Модель - расчётная, основана на финансовой модели R-Park (Excel «Расчёт окупаемости 2025»). Финальные цифры зависят от локации, маркетинга и сезона. Rope Park · ${new Date().toLocaleDateString('ru-RU')}</p>
        `;
        document.body.appendChild(wrap);
        // Give the browser a tick to lay out before html2canvas snapshots.
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

        await window.html2pdf().set({
          margin:      [20, 20, 20, 20],
          filename:    `rope-park-finmodel-${Date.now()}.pdf`,
          image:       { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale:           2,
            backgroundColor: '#F5F3EF',
            useCORS:         true,
            logging:         false,
            windowWidth:     794,
            width:           794,
            // height left auto so html2canvas measures the actual wrap
          },
          jsPDF:       { unit: 'pt', format: 'a4', orientation: 'portrait' },
          pagebreak:   { mode: ['css', 'legacy'] },
        }).from(wrap).save();

        document.body.removeChild(wrap);
      } catch (err) {
        console.error('[finlab] PDF export failed:', err);
        alert('Не удалось сгенерировать PDF. Попробуйте ещё раз.');
      } finally {
        pdfBtn.innerHTML = original;
        pdfBtn.disabled = false;
      }
    });

    // Hero live counter - fixed list of active sites, no rotation

    // Watch for theme flip → re-render charts with new palette
    const themeObserver = new MutationObserver(() => scheduleRecompute());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // initial
    recompute();
  })();

  // ══════════════════════════════════════════
  // PRELOADER - fake progress → real load → panel exit
  // ══════════════════════════════════════════
  (function initPreloader() {
    const pre   = document.getElementById('preloader');
    if (!pre) return;
    document.documentElement.classList.add('is-loading');

    // ── Pre-stage hero for reveal animation
    const nav        = document.querySelector('.nav');
    const videoWrap  = document.querySelector('.hero__video-wrap');
    const curtain    = document.querySelector('.hero__curtain');
    const eyebrow    = document.querySelector('.hero__eyebrow');
    const words      = document.querySelectorAll('.hero__title-word');
    const subtitle   = document.querySelector('.hero__subtitle');
    const ctaRow     = document.querySelector('.hero__editorial-cta');
    const uspChips   = document.querySelectorAll('.hero__usp-chip');
    const bottombar  = document.querySelector('.hero__bottombar');
    if (nav)       gsap.set(nav,       { y: -36, opacity: 0 });
    if (videoWrap) gsap.set(videoWrap, { scale: 0.92, opacity: 0, borderRadius: 48 });
    if (curtain)   gsap.set(curtain,   { opacity: 1 });         // heavy black at start
    if (eyebrow)   gsap.set(eyebrow,   { y: 20, opacity: 0 });
    if (words.length) gsap.set(words,  { yPercent: 110, opacity: 0 });
    if (subtitle)  gsap.set(subtitle,  { y: 16, opacity: 0 });
    if (ctaRow)    gsap.set(ctaRow,    { y: 14, opacity: 0 });
    if (uspChips.length) gsap.set(uspChips, { x: 40, opacity: 0 });
    if (bottombar) gsap.set(bottombar, { y: 24, opacity: 0 });

    function animateHeroIntro() {
      // Intro timeline - curtain is NOT animated here; it stays fully dark until user scrolls.
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      if (videoWrap)       tl.to(videoWrap, { scale: 1, opacity: 1, borderRadius: 0, duration: 1.3, ease: 'expo.out' }, 0);
      if (nav)             tl.to(nav,       { y: 0, opacity: 1, duration: 0.8 }, 0.35);
      if (eyebrow)         tl.to(eyebrow,   { y: 0, opacity: 1, duration: 0.7 }, 0.6);
      if (words.length)    tl.to(words,     { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.09, ease: 'expo.out' }, 0.75);
      if (subtitle)        tl.to(subtitle,  { y: 0, opacity: 1, duration: 0.7 }, 1.15);
      if (ctaRow)          tl.to(ctaRow,    { y: 0, opacity: 1, duration: 0.6 }, 1.3);
      if (uspChips.length) tl.to(uspChips,  { x: 0, opacity: 1, duration: 0.7, stagger: 0.09 }, 1.0);
      if (bottombar)       tl.to(bottombar, { y: 0, opacity: 1, duration: 0.8 }, 1.5);
      return tl;
    }

    // ── Curtain fade driven by SCROLL, not time.
    // Holds at full dark until the user scrolls, then dissolves over ~400px of scroll.
    if (curtain) {
      const FADE_PX = 420;
      const updateCurtain = () => {
        const y = Math.max(0, window.scrollY);
        const op = Math.max(0, Math.min(1, 1 - y / FADE_PX));
        curtain.style.opacity = String(op);
      };
      window.addEventListener('scroll', updateCurtain, { passive: true });
      updateCurtain();
    }

    const fill  = document.getElementById('preloaderFill');
    const num   = document.getElementById('preloaderNum');
    const mask  = document.getElementById('preloaderLogoMask');

    let target = 0;
    let current = 0;
    let loaded = false;

    // tick progress toward `target`
    const tick = () => {
      current += (target - current) * 0.08;
      const pct = Math.min(100, Math.round(current));
      if (fill) fill.style.width = pct + '%';
      if (num)  num.textContent  = String(pct).padStart(2, '0');
      if (mask) mask.style.width = pct + '%';
      if (pct < 100 || !loaded) requestAnimationFrame(tick);
      else exit();
    };
    tick();

    // ramp up to 85% over ~1.4s
    const ramp = setInterval(() => {
      if (target < 85) target = Math.min(85, target + Math.random() * 9 + 3);
    }, 120);

    // ── Готовность прелоадера учитывает развилку hero ───────────────────────
    // Хотим кадровый hero (десктоп+быстро) - ждём загрузку ВСЕХ кадров, но не
    // дольше бюджета (~2.6с). Не успели / ошибка / мобила / медленно - идём на видео.
    let frameBudgetOver = false;
    function maybeFinish() {
      if (loaded) return;
      if (!window.__rpWantFrames || window.__rpFramesReady || window.__rpFramesError || frameBudgetOver) {
        clearInterval(ramp);
        loaded = true;
        target = 100;
      }
    }
    window.__rpOnFramesReady = maybeFinish;                 // дёргается, когда кадры готовы/ошибка
    setTimeout(() => { frameBudgetOver = true; maybeFinish(); }, 4000);

    window.addEventListener('load', () => { maybeFinish(); });

    // абсолютный предохранитель - прелоадер не висит дольше 4.2с
    setTimeout(() => { clearInterval(ramp); loaded = true; target = 100; }, 4200);

    function exit() {
      pre.classList.add('is-out');
      // РАЗВИЛКА (один раз, до раскрытия): все кадры догрузились → кадровый hero;
      // иначе остаёмся в видео-режиме (класс hero-video-mode уже стоит с <head>).
      if (window.__rpFramesReady && !window.__rpFramesError && window.__rpEnterFrameMode) {
        window.__rpEnterFrameMode();
      } else if (window.__rpStartHeroVideo) {
        window.__rpStartHeroVideo();   // видео-режим: видео играет с начала при раскрытии
      }
      // Panel cascade finishes ~1.15s in; reveal hero right as the preloader fades away
      setTimeout(() => {
        pre.classList.add('is-gone');
        document.documentElement.classList.remove('is-loading');
        animateHeroIntro();
        // Let ScrollTrigger recompute after layout settles
        setTimeout(() => ScrollTrigger.refresh(), 200);
      }, 1150);
    }
  })();

  // ══════════════════════════════════════════
  // INTERACTIVE BACKGROUND - dot grid that bends toward cursor
  // ══════════════════════════════════════════
  (function initBgCanvas() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let dots = [];
    const SPACING = 46;      // grid step in CSS px
    const INFLUENCE = 180;   // cursor influence radius
    const STRENGTH  = 22;    // max displacement (px)

    let mx = -9999, my = -9999;
    let targetMx = mx, targetMy = my;
    let t0 = performance.now();

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width  = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      canvas.style.width  = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildDots();
    }
    function buildDots() {
      dots = [];
      const cols = Math.ceil(W / SPACING) + 2;
      const rows = Math.ceil(H / SPACING) + 2;
      const offsetX = (W - (cols - 1) * SPACING) / 2;
      const offsetY = (H - (rows - 1) * SPACING) / 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          dots.push({
            bx: offsetX + x * SPACING,
            by: offsetY + y * SPACING,
            phase: (x * 13 + y * 7) % 360,
          });
        }
      }
    }
    function getAccent() {
      // Derive color from CSS accent var. Alpha is modest so it feels airy.
      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      if (theme === 'dark') return 'rgba(153, 171, 71, 0.42)';   // sage on dark
      return 'rgba(58, 125, 68, 0.22)';                          // deep green on light
    }

    function frame(now) {
      const dt = (now - t0) / 1000;
      // ease mouse (so fast movements look smooth, idle stays calm)
      mx += (targetMx - mx) * 0.12;
      my += (targetMy - my) * 0.12;

      ctx.clearRect(0, 0, W, H);
      const color = getAccent();
      ctx.fillStyle = color;

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        // subtle breathing motion
        const wobbleX = reducedMotion ? 0 : Math.sin(dt * 0.6 + d.phase * 0.017) * 1.2;
        const wobbleY = reducedMotion ? 0 : Math.cos(dt * 0.6 + d.phase * 0.013) * 1.2;

        // cursor push
        const dxm = d.bx - mx;
        const dym = d.by - my;
        const dist = Math.hypot(dxm, dym);
        let pushX = 0, pushY = 0, radius = 1.2;
        if (dist < INFLUENCE && dist > 0.01) {
          const t = 1 - dist / INFLUENCE;
          const force = t * t * STRENGTH;
          pushX = (dxm / dist) * force;
          pushY = (dym / dist) * force;
          radius = 1.2 + t * 2.2;
        }

        const x = d.bx + wobbleX + pushX;
        const y = d.by + wobbleY + pushY;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('mousemove', (e) => {
      targetMx = e.clientX;
      targetMy = e.clientY;
    });
    window.addEventListener('mouseleave', () => { targetMx = -9999; targetMy = -9999; });
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  })();

  // ══════════════════════════════════════════
  // REVEAL CARDS - scrub scale 0.88 → 1 on scroll
  // ══════════════════════════════════════════
  (function initRevealCards() {
    const cards = document.querySelectorAll('[data-reveal-card]');
    cards.forEach((card) => {
      const target = card.firstElementChild;
      if (!target) return;
      gsap.fromTo(card,
        {
          // На телефоне рост блока мягче (0.96→1), чтобы не «прыгал»; десктоп как был.
          '--rc-scale':        window.matchMedia('(max-width: 768px)').matches ? 0.96 : 0.88,
          '--rc-radius':       52,
          '--rc-shadow-alpha': 0.1,
        },
        {
          '--rc-scale':        1,
          '--rc-radius':       28,       // stay rounded at full width
          '--rc-shadow-alpha': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start:   'top 82%',
            end:     'top 18%',
            scrub:   0.6,
          },
        }
      );
    });
  })();

  // Refresh triggers after dynamic DOM
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // ══════════════════════════════════════════
  // GRASS ANCHOR — привязка декоративных «травинок» к КОНТЕНТНЫМ секциям.
  //   Позиция = offsetTop секции + фикс. смещение (px). offsetTop = чистая
  //   раскладка: не зависит от скролла, трансформов смус-скролла и от того,
  //   КОРОТКИЙ сайт (видео-режим) или ДЛИННЫЙ (frame-режим с пином hero) —
  //   секции двигаются вместе с высотой hero, и трава едет за ними.
  //   Якорим НЕ к hero (он пинится/нестабилен), а к контентным секциям.
  //   Смещения сняты с эталона 1920 (frame). Подвинуть ветку = одно число (off).
  // ══════════════════════════════════════════
  (function initGrassAnchor() {
    // off = смещение для разрешений «поменьше» (ноут ~1400); offBig = для Full HD (≥1900px).
    // Секционная привязка держит траву у её секции на всех режимах; off/offBig — точечная
    // докрутка, т.к. на узком контент переверстывается и идеальная точка чуть другая.
    const ANCHORS = {
      // Остались только 1, 2, 6 (3/4/5 удалены через display:none в CSS).
      // offVid — смещение для видео-режима, off/offBig — для frame (Full HD/ноут).
      'deco-branch--1': { sec: 'forwhom', off: 464 },
      'deco-branch--2': { sec: 'catalog', off: 497, offVid: -330 },
      'deco-branch--6': { sec: 'contact', off: 2740, offVid: 1979 },
    };
    const trees = document.querySelector('.deco-trees');
    if (!trees) return;
    const layoutTop = (el) => { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; };
    function place() {
      if (window.matchMedia('(max-width: 640px)').matches) return; // на мобиле трава выключена
      const big = window.innerWidth >= 1900;
      const vid = document.documentElement.classList.contains('hero-video-mode');
      const treesTop = layoutTop(trees);
      for (const cls in ANCHORS) {
        const a = ANCHORS[cls];
        const br = document.querySelector('.' + cls);
        const sec = document.getElementById(a.sec);
        if (!br || !sec) continue;
        const off = (vid && a.offVid != null) ? a.offVid
                  : (big && a.offBig != null) ? a.offBig
                  : a.off;
        br.style.setProperty('top', (layoutTop(sec) + off - treesTop) + 'px', 'important');
      }
    }
    let t;
    const replace = () => { clearTimeout(t); t = setTimeout(place, 120); };
    if (typeof ScrollTrigger !== 'undefined' && ScrollTrigger.addEventListener) {
      ScrollTrigger.addEventListener('refresh', place);
    }
    window.addEventListener('resize', replace);
    window.addEventListener('load', () => setTimeout(place, 300));
    // Пересчёт на ЛЮБОЕ изменение высоты страницы (ленивые картинки/шрифты/пин hero
    // догружаются и сдвигают секции) → позиция травы устаканивается детерминированно.
    if (window.ResizeObserver) {
      try { new ResizeObserver(replace).observe(document.body); } catch (e) {}
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(replace);
    setTimeout(place, 600);
    setTimeout(place, 2000);
  })();

  // ══════════════════════════════════════════
  // DECO TREES - параллакс на скролле
  //   На каждом img.deco-tree атрибут data-parallax="0.1 .. 0.25" - это коэф.
  //   скорости относительно скролла. translateY(-scrollY * speed) делает дерево
  //   как-будто отстающим от скролла - даёт эффект глубины слоёв.
  // ══════════════════════════════════════════
  (function initTreeParallax() {
    // Все элементы декора с data-parallax - деревья + доски + что добавится позже
    const trees = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!trees.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const data = trees.map(el => ({
      el,
      speed: parseFloat(el.dataset.parallax) || 0.18,
      current: 0,
      target: 0,
    }));

    let raf = null;
    function tick() {
      const y = window.scrollY || window.pageYOffset || 0;
      let needsMore = false;
      for (const t of data) {
        t.target = -y * t.speed;
        const diff = t.target - t.current;
        if (Math.abs(diff) > 0.1) {
          t.current += diff * 0.12;
          // Пишем в --py чтобы CSS мог скомбинировать с rotate/scale на конкретных элементах
          t.el.style.setProperty('--py', t.current.toFixed(2) + 'px');
          needsMore = true;
        }
      }
      raf = needsMore ? requestAnimationFrame(tick) : null;
    }
    function schedule() {
      if (raf === null) raf = requestAnimationFrame(tick);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
  })();

})();




/* ═════════════════════════════════════════════════════════════
   FINLAB v3 - safe additive layer (each section in its own try)
   ═════════════════════════════════════════════════════════════ */
(function flv3Safe(){
  const root = document.querySelector('.fl-v3');
  if (!root) return;

  const FORMATS_META = {
    'rope-support': { name:'Парк на стальных опорах', eyebrow:'Верёвочный · опоры', meta:'Универсальный формат, стальные опоры с сертифицированным оборудованием. Подходит для городских парков, ТРЦ, баз отдыха.' },
    'rope-tree':    { name:'Парк на деревьях', eyebrow:'Верёвочный · деревья', meta:'Природный формат среди живых деревьев. Минимум бетона, максимум атмосферы. Лесопарки, базы отдыха, частные территории.' },
    'rope-modular': { name:'Модульный парк', eyebrow:'Модульный', meta:'Сборно-разборная конструкция. Подходит для аренды, временных площадок, сезонных проектов и кемпингов.' },
    'rope-indoor':  { name:'Парк в помещении', eyebrow:'Indoor', meta:'Круглогодичный, для ТРЦ, спорткомплексов, развлекательных центров. Никакой сезонности, поток 7 / 365.' },
    'skyrider':     { name:'SkyRider · аттракцион', eyebrow:'SkyRider', meta:'Аттракцион нового поколения. Скоростные трассы, взрослая аудитория, премиум-чек, высокая выручка с м².' },
    'trolls':       { name:'Зиплайн / троллей', eyebrow:'Троллей', meta:'Скоростные спуски на тросах. Адреналин, природа, отлично работает на курортах и базах отдыха.' },
    'maze':         { name:'Сетчатый лабиринт', eyebrow:'Сетчатый лабиринт', meta:'Многоуровневый лабиринт из сеток для детей и семей. Безопасно, ярко, фотогенично.' },
  };

  function getFormat(){
    try {
      const a = root.querySelector('[data-field="format"].is-active');
      return a ? a.dataset.v : 'rope-support';
    } catch(_) { return 'rope-support'; }
  }

  // ── HERO image swap + format meta ──
  function swapHero(){
    try {
      const fmt = getFormat();
      const meta = FORMATS_META[fmt] || FORMATS_META['rope-support'];
      root.querySelectorAll('.fl3__hero img[data-format]').forEach(img => {
        img.classList.toggle('is-active', img.dataset.format === fmt);
      });
      const e = root.querySelector('[data-format-eyebrow]'); if (e) e.textContent = meta.eyebrow;
      const n = root.querySelector('[data-format-name]'); if (n) n.textContent = meta.name;
      const m = root.querySelector('[data-format-meta]'); if (m) m.textContent = meta.meta;
    } catch(e) { console.warn('swapHero', e); }
  }

  // ── COST BREAKDOWN compute (local) ──
  const FL_SEASON = [0.3,0.3,0.3,0.4,1.2,1.2,1.1,1.2,0.6,0.3,0.3,0.3];
  const ROUTES = [[15,16],[15,13],[15,14],[15,13],[12,11],[2,1],[15,3]];
  const TOTAL_VIS = ROUTES.reduce((s,[t,st])=>s + (st*3/t)*60*10*30, 0);
  const FIXED_M = 1500 + 30000 + 100000;
  const SEAS_M  = 120000 + 550000 + 100000;
  const BONUS = 0.10, MAINT = 0.04;
  const GROUP_BASE = 50, GROUP_PRICE = 15000;

  function readParams(){
    try {
      const $ = sel => root.querySelector(sel);
      return {
        capex:  +($('input[data-field="capex"]')?.value ?? 12000000),
        util:   +($('input[data-field="util"]')?.value ?? 1),
        check:  +($('input[data-field="check"]')?.value ?? 2000),
        rent:   +($('input[data-field="rent"]')?.value ?? 0),
        region: +($('select[data-field="region"]')?.value ?? 1.0),
      };
    } catch(_) { return { capex:12000000, util:1, check:2000, rent:0, region:1.0 }; }
  }

  function fmtMlnExact(n){
    if (!isFinite(n)) return '0';
    const v = n/1_000_000, a = Math.abs(v), s = v<0?'−':'';
    if (a >= 10) return s + Math.round(a);
    if (a >= 1)  return s + a.toFixed(1).replace('.', ',').replace(',0','');
    if (a > 0)   return s + a.toFixed(2).replace('.', ',').replace(/,?0+$/,'');
    return '0';
  }
  function setKpi(n, v){ root.querySelectorAll(`[data-kpi="${n}"]`).forEach(el => el.textContent = v); }

  function updateCosts(){
    try {
      const p = readParams();
      const visBase = TOTAL_VIS * (p.util/100);
      let yBonus = 0, yFOTseas = 0;
      for (let m=0;m<12;m++){
        const sc = FL_SEASON[m];
        const inc = (visBase*sc*p.check) + (GROUP_BASE*sc*GROUP_PRICE);
        const seas = SEAS_M * sc * p.region;
        const cost = FIXED_M + seas + p.rent;
        const op = inc - cost;
        yBonus += Math.max(0, op) * BONUS;
        yFOTseas += seas;
      }
      const yMaint = p.capex * MAINT;
      const yFix = FIXED_M * 12;
      const yRent = p.rent * 12;
      const yFOT = yFOTseas + yBonus;
      const yTotal = yFOT + yFix + yRent + yMaint;
      setKpi('yearlyCosts', fmtMlnExact(yTotal));
      setKpi('cost-fot', fmtMlnExact(yFOT));
      setKpi('cost-fix', fmtMlnExact(yFix));
      setKpi('cost-rent', fmtMlnExact(yRent));
      setKpi('cost-maint', fmtMlnExact(yMaint));
      if (yTotal > 0) {
        setKpi('cost-fot-pct', Math.round(yFOT/yTotal*100));
        setKpi('cost-fix-pct', Math.round(yFix/yTotal*100));
        setKpi('cost-rent-pct', Math.round(yRent/yTotal*100));
        setKpi('cost-maint-pct', Math.round(yMaint/yTotal*100));
      }
    } catch(e) { console.warn('updateCosts', e); }
  }

  // ── TIMELINE: inject 3D icons + strip "Открытие парка · " prefix ──
  const ICONS = {
    ruler:    'images/finlab/icons/ruler.webp',
    cube:     'images/finlab/icons/3d.webp',
    factory:  'images/finlab/icons/factory.webp',
    foundation:'images/finlab/icons/foundation.webp',
    wrench:   'images/finlab/icons/wrench.webp',
    flag:     'images/finlab/icons/flag.webp',
  };
  const ICON_SEQ = ['ruler','cube','factory','foundation','wrench','flag'];

  function enhanceTimeline(){
    try {
      const list = root.querySelector('#finlabTimeline');
      if (!list) return;
      const steps = list.querySelectorAll('.finlab__timeline-step');
      if (steps.length) list.style.gridTemplateColumns = `repeat(${steps.length}, 1fr)`;
      steps.forEach((step, i) => {
        const txt = step.querySelector('.finlab__timeline-text');
        if (txt) {
          txt.textContent = txt.textContent
            .replace(/^Открытие\s*парка\s*·\s*/i, '')
            .replace(/^Park\s+opening\s*·\s*/i, '')
            .replace(/^Открытие\s*·\s*/i, '');
        }
        if (!step.querySelector('.fl3__timeline-icon')) {
          const isFinal = i === steps.length - 1;
          const iconKey = isFinal ? 'flag' : (ICON_SEQ[Math.min(i, ICON_SEQ.length - 2)] || 'cube');
          const wrap = document.createElement('span');
          wrap.className = 'fl3__timeline-icon' + (isFinal ? ' is-final' : '');
          wrap.innerHTML = `<img src="${ICONS[iconKey]}" alt="">`;
          step.insertBefore(wrap, step.firstChild);
        }
      });
    } catch(e) { console.warn('enhanceTimeline', e); }
  }

  // ── CHART: convert legacy line→bar, drop "Расходы" dataset ──
  function rebarChart(){
    try {
      const cv = document.getElementById('finlabChartIncome');
      if (!cv || !window.Chart) return;
      const chart = Chart.getChart(cv);
      if (!chart) return;
      const ctx = cv.getContext('2d');
      chart.config.type = 'bar';
      chart.data.datasets = chart.data.datasets.filter(ds => {
        const l = (ds.label || '').toLowerCase();
        return !/расход|cost/.test(l);
      });
      const h = cv.clientHeight || 280;
      const gA = ctx.createLinearGradient(0,0,0,h); gA.addColorStop(0,'#3A7D44'); gA.addColorStop(1,'#1F5028');
      const gB = ctx.createLinearGradient(0,0,0,h); gB.addColorStop(0,'#B7C95F'); gB.addColorStop(1,'#99AB47');
      // Тоньше столбики на узких экранах - на мобиле 12 месяцев * 2 dataset
      // выглядят слишком толсто (перекрывают друг друга). Адаптивно подбираем
      // barPercentage/categoryPercentage. Чем меньше viewport - тем тоньше.
      const vw = window.innerWidth || document.documentElement.clientWidth || 1200;
      const isNarrow = vw <= 450;
      const isMobile = vw <= 640;
      const isTablet = vw <= 900 && vw > 640;
      // categoryPercentage - сколько группа из 2 баров занимает в slot месяца (остальное gap)
      // barPercentage - какую долю в bar-слоте занимает сам бар (остальное gap между парой)
      let catPct, barPct;
      if (isNarrow)      { catPct = 0.5;  barPct = 0.32; }   // самый узкий phone - тонюсенькие
      else if (isMobile) { catPct = 0.55; barPct = 0.35; }   // mobile - в 2 раза тоньше
      else if (isTablet) { catPct = 0.75; barPct = 0.50; }
      else               { catPct = 0.90; barPct = 0.45; }
      chart.data.datasets.forEach((ds, i) => {
        ds.type = 'bar';
        ds.backgroundColor = i === 0 ? gA : gB;
        ds.borderColor = 'transparent';
        ds.borderWidth = 0;
        ds.borderDash = [];
        ds.borderRadius = isMobile ? 1 : 6;
        delete ds.barThickness;
        ds.maxBarThickness = isNarrow ? 3 : (isMobile ? 5 : 24);  // hard cap on phone - в 2 раза тоньше
        ds.categoryPercentage = catPct;
        ds.barPercentage = barPct;
        ds.fill = false;
        ds.tension = 0;
        ds.pointRadius = 0;
        ds.order = i;
        ds.hidden = false;
      });
      if (chart.options?.plugins?.legend) chart.options.plugins.legend.display = false;
      if (chart.options?.scales?.y) {
        chart.options.scales.y.beginAtZero = true;
        chart.options.scales.y.stacked = false;
      }
      if (chart.options?.scales?.x) {
        chart.options.scales.x.stacked = false;
      }
      chart.update('none');
    } catch(e) { console.warn('rebarChart', e); }
  }

  // ── DATE plate display ──
  function updateDatePlate(){
    try {
      const inp = root.querySelector('input.fl3__date-input');
      if (!inp) return;
      if (!inp.value) inp.value = new Date().toISOString().split('T')[0];
      const d = new Date(inp.value);
      if (isNaN(d.getTime())) return;
      const RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
      const FU = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
      const day = root.querySelector('#fl3-date-day'); if (day) day.textContent = String(d.getDate()).padStart(2,'0');
      const mon = root.querySelector('#fl3-date-mon'); if (mon) mon.textContent = RU[d.getMonth()];
      const full = root.querySelector('#fl3-date-full'); if (full) full.textContent = `${d.getDate()} ${FU[d.getMonth()]} ${d.getFullYear()}`;
    } catch(e) { console.warn('updateDatePlate', e); }
  }

  // Wire date plate click → showPicker
  try {
    const datePlate = root.querySelector('#fl3-date-plate');
    const dateInp = root.querySelector('input.fl3__date-input');
    if (datePlate && dateInp) {
      datePlate.style.cursor = 'pointer';
      datePlate.addEventListener('click', () => {
        try {
          if (typeof dateInp.showPicker === 'function') dateInp.showPicker();
          else dateInp.focus();
        } catch(_) { dateInp.focus(); }
      });
      dateInp.addEventListener('change', updateDatePlate);
    }
  } catch(e) { console.warn('date plate wire', e); }

  // ── Master update ──
  function update(){
    swapHero();
    updateCosts();
    enhanceTimeline();
    rebarChart();
    updateDatePlate();
  }
  function deferred(){
    // legacy chart полностью перерисовывается после change. Делаем 3 ретрая
    // чтобы наши тонкие настройки точно были применены ПОСЛЕ legacy create.
    setTimeout(update, 80);
    setTimeout(rebarChart, 250);
    setTimeout(rebarChart, 600);
  }

  // Hook all controls
  try {
    root.querySelectorAll('[data-field="format"]').forEach(b => b.addEventListener('click', deferred));
    root.querySelectorAll('.finlab__stress-opt').forEach(b => b.addEventListener('click', deferred));
    root.querySelectorAll('input[data-field], select[data-field]').forEach(el => {
      el.addEventListener('input', deferred);
      el.addEventListener('change', deferred);
    });
  } catch(e) { console.warn('hook controls', e); }

  // Initial + several retries (legacy chart renders async)
  setTimeout(update, 100);
  setTimeout(update, 500);
  setTimeout(update, 1200);
  setTimeout(rebarChart, 1800);
  setTimeout(rebarChart, 2500);

  // MutationObserver to enhance timeline whenever legacy script re-renders it
  try {
    const tlEl = root.querySelector('#finlabTimeline');
    if (tlEl) {
      const obs = new MutationObserver(() => { enhanceTimeline(); rebarChart(); });
      obs.observe(tlEl, { childList:true });
    }
  } catch(e) { console.warn('mutation obs', e); }

  // Поллер - каждые 1.2 секунды проверяет, не сбросил ли legacy chart мои bar settings.
  // На мобиле, если barPercentage > 0.4, считаем что legacy перерисовал - применяем заново.
  setInterval(() => {
    try {
      const cv = document.getElementById('finlabChartIncome');
      if (!cv || !window.Chart) return;
      const chart = window.Chart.getChart(cv);
      if (!chart) return;
      const vw = window.innerWidth || 1200;
      if (vw > 640) return;  // только на мобиле
      const ds0 = chart.data.datasets && chart.data.datasets[0];
      if (!ds0) return;
      // если barPercentage не наш или type не bar - перепатчиваем
      if (ds0.type !== 'bar' || (ds0.barPercentage && ds0.barPercentage > 0.4) || !ds0.maxBarThickness || ds0.maxBarThickness > 6) {
        rebarChart();
      }
    } catch(_) {}
  }, 1200);

  // На ресайзе пересчитываем barPercentage/categoryPercentage чтобы столбцы
  // были тоньше на мобиле и шире на десктопе. Throttle 200ms.
  let rzT;
  window.addEventListener('resize', () => {
    clearTimeout(rzT);
    rzT = setTimeout(rebarChart, 200);
  }, { passive: true });
})();


/* ═════════ FL3 sliders --p + sticky inputs unlock ═════════ */
(function flv3Polish(){
  try {
    const root = document.querySelector('.fl-v3');
    if (!root) return;

    // 1) Update CSS var --p for each slider (filled portion of track)
    function paint(el){
      try {
        const min=+el.min, max=+el.max, val=+el.value;
        if (!isFinite(min)||!isFinite(max)||max===min) return;
        const p = ((val-min)/(max-min))*100;
        el.style.setProperty('--p', p + '%');
      } catch(_){}
    }
    root.querySelectorAll('input[type="range"]').forEach(el => {
      paint(el);
      el.addEventListener('input', () => paint(el));
      el.addEventListener('change', () => paint(el));
    });
    // also when stress preset buttons change util
    root.querySelectorAll('.finlab__stress-opt').forEach(b => {
      b.addEventListener('click', () => setTimeout(() => {
        root.querySelectorAll('input[type="range"]').forEach(paint);
      }, 50));
    });

    // 2) Strip GSAP transform on FinLab reveal-card after a short delay so position:sticky on inputs works.
    //    Re-strip via MutationObserver in case GSAP writes it again.
    const section = document.querySelector('.reveal-card > section.finlab.fl-v3');
    if (section) {
      function strip(){
        if (section.style.transform && section.style.transform !== 'none') {
          section.style.transform = 'none';
        }
      }
      // First strip after initial animation (~1s)
      setTimeout(strip, 1200);
      setTimeout(strip, 2400);
      // Watcher
      try {
        const obs = new MutationObserver(strip);
        obs.observe(section, { attributes:true, attributeFilter:['style'] });
      } catch(_){}
    }
  } catch(e) { console.warn('flv3Polish', e); }
})();


/* ═════════ FL3 dynamic timeline render per format ═════════ */
(function flv3Timeline(){
  try {
    const root = document.querySelector('.fl-v3');
    if (!root) return;
    const list = root.querySelector('#finlabTimeline');
    const total = root.querySelector('#finlabTotalMonths');
    if (!list) return;

    const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
    const I = {
      ruler:    'images/finlab/icons/ruler.webp',
      cube:     'images/finlab/icons/3d.webp',
      factory:  'images/finlab/icons/factory.webp',
      foundation:'images/finlab/icons/foundation.webp',
      wrench:   'images/finlab/icons/wrench.webp',
      flag:     'images/finlab/icons/flag.webp',
      contract: 'images/finlab/icons/contract.webp'
    };

    const STEPS = {
      'rope-support': [
        { icon: I.ruler,      label:'Замер площадки и ТЗ' },
        { icon: I.cube,       label:'Проектирование и 3D' },
        { icon: I.factory,    label:'Производство в цехе (Уфа)' },
        { icon: I.foundation, label:'Фундаменты и подготовка' },
        { icon: I.wrench,     label:'Монтаж конструкций' },
        { icon: I.flag,       label:'Испытания и открытие' },
      ],
      'rope-tree': [
        { icon: I.ruler,      label:'Осмотр деревьев и ТЗ' },
        { icon: I.cube,       label:'Проектирование' },
        { icon: I.factory,    label:'Производство' },
        { icon: I.wrench,     label:'Монтаж на деревьях' },
        { icon: I.foundation, label:'Тесты безопасности' },
        { icon: I.flag,       label:'Открытие парка' },
      ],
      'rope-modular': [
        { icon: I.contract,   label:'Договор и заказ' },
        { icon: I.factory,    label:'Сборка модулей' },
        { icon: I.foundation, label:'Доставка на площадку' },
        { icon: I.wrench,     label:'Быстрый монтаж' },
        { icon: I.flag,       label:'Запуск парка' },
      ],
      'rope-indoor': [
        { icon: I.contract,   label:'Договор с ТРЦ' },
        { icon: I.ruler,      label:'Замер атриума' },
        { icon: I.cube,       label:'Проект и согласования' },
        { icon: I.factory,    label:'Производство' },
        { icon: I.wrench,     label:'Монтаж в помещении' },
        { icon: I.foundation, label:'Пуско-наладка' },
        { icon: I.flag,       label:'Открытие' },
      ],
      'skyrider': [
        { icon: I.ruler,      label:'Геодезия и привязка' },
        { icon: I.cube,       label:'Проект и документация' },
        { icon: I.factory,    label:'Производство кареток' },
        { icon: I.foundation, label:'Монтаж опор и тросов' },
        { icon: I.wrench,     label:'Пуско-наладка приводов' },
        { icon: I.flag,       label:'Испытания и запуск' },
      ],
      'trolls': [
        { icon: I.ruler,      label:'Геодезия маршрута' },
        { icon: I.cube,       label:'Проект тросовой системы' },
        { icon: I.factory,    label:'Производство тросов' },
        { icon: I.wrench,     label:'Монтаж' },
        { icon: I.flag,       label:'Открытие' },
      ],
      'maze': [
        { icon: I.contract,   label:'Договор' },
        { icon: I.factory,    label:'Производство сеток' },
        { icon: I.foundation, label:'Каркас и опоры' },
        { icon: I.wrench,     label:'Монтаж сеток' },
        { icon: I.flag,       label:'Открытие' },
      ],
    };

    function getFormat(){
      const a = root.querySelector('[data-field="format"].is-active');
      return a ? a.dataset.v : 'rope-support';
    }
    function getStartDate(){
      const inp = root.querySelector('input[type="date"][data-field="start"]');
      const v = inp?.value;
      if (v) {
        const d = new Date(v);
        if (!isNaN(d.getTime())) return d;
      }
      return new Date();
    }

    function render(){
      try {
        const fmt = getFormat();
        const steps = STEPS[fmt] || STEPS['rope-support'];
        const startDate = getStartDate();
        list.style.gridTemplateColumns = `repeat(${steps.length}, 1fr)`;
        list.innerHTML = steps.map((s, i) => {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i);
          const month = MONTHS_RU[d.getMonth()] + ' ' + (d.getFullYear() % 100);
          const isFinal = i === steps.length - 1;
          return `
            <div class="finlab__timeline-step ${isFinal?'is-final':''}">
              <span class="fl3__timeline-icon ${isFinal?'is-final':''}"><img src="${s.icon}" alt=""></span>
              <span class="finlab__timeline-step-num">${String(i+1).padStart(2,'0')}</span>
              <span class="finlab__timeline-time">${month}</span>
              <span class="finlab__timeline-text">${s.label}</span>
            </div>
          `;
        }).join('');
        if (total) total.textContent = '~' + steps.length;
      } catch(e) { console.warn('FL3 timeline render', e); }
    }

    // Hook on format changes and date change
    root.querySelectorAll('[data-field="format"]').forEach(b => b.addEventListener('click', () => setTimeout(render, 30)));
    root.querySelectorAll('input[type="date"][data-field="start"]').forEach(el => el.addEventListener('change', () => setTimeout(render, 30)));

    // Initial render - overrides legacy. Delays needed because legacy renders later.
    setTimeout(render, 200);
    setTimeout(render, 800);

    // Re-apply after legacy writes (MutationObserver doesn't loop because we use same markup)
    let lastFmt = '';
    setInterval(() => {
      const fmt = getFormat();
      const steps = STEPS[fmt] || STEPS['rope-support'];
      // If legacy script rewrote with different step count or icons missing - rerender
      const currentSteps = list.querySelectorAll('.finlab__timeline-step');
      if (currentSteps.length !== steps.length || !list.querySelector('.fl3__timeline-icon') || lastFmt !== fmt) {
        lastFmt = fmt;
        render();
      }
    }, 600);
  } catch(e) { console.warn('flv3Timeline', e); }
})();


/* ═════════ FL date plate - mobile picker fix ═════════
   На мобиле input через CSS становится оверлеем поверх плашки и сам ловит тап
   (нативный date picker открывается естественным образом). На десктопе - доп.
   click handler на плашке вызывает showPicker(). */
(function flDatePlateWire(){
  function wire(){
    const plate = document.getElementById('fl-date-plate');
    const input = document.querySelector('input.fl__date-input');
    if (!plate || !input || plate.dataset.wired === '1') return;
    plate.dataset.wired = '1';
    plate.style.cursor = 'pointer';
    plate.addEventListener('click', (e) => {
      // на mobile input сам сверху - не дублируем
      if (e.target === input || e.target.closest('input.fl__date-input')) return;
      try {
        if (typeof input.showPicker === 'function') input.showPicker();
        else { input.focus(); input.click(); }
      } catch(_) { input.focus(); }
    });
  }
  setTimeout(wire, 200);
  setTimeout(wire, 800);
  setTimeout(wire, 1600);
  document.addEventListener('DOMContentLoaded', wire);
})();
