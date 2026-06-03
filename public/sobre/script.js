/* =========================================================
   MADRI PERFUMARIA — script.js  (redesign v2)
   ========================================================= */
(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '5518991146622',
    waMessage: 'Olá! Vim pela MADRI Perfumaria e gostaria de uma indicação personalizada.',
    instagram: 'https://instagram.com/madriperfumaria'
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer  = window.matchMedia('(pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ===== Links dinâmicos ===== */
  function wireLinks() {
    const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(CONFIG.waMessage)}`;
    $$('[data-wa]').forEach(el => {
      if (el.id === 'qrWa') return; // quiz result tem link próprio
      el.setAttribute('href', wa);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
    $$('[data-ig]').forEach(el => {
      el.setAttribute('href', CONFIG.instagram);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /* ===== Ano no rodapé ===== */
  function setYear() {
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ===== Header ao rolar ===== */
  function headerScroll() {
    const header = $('#header');
    if (!header) return;
    const update = () => header.classList.toggle('scrolled', window.scrollY > 40);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ===== Menu mobile ===== */
  function mobileNav() {
    const toggle = $('#navToggle');
    const menu   = $('#mobileNav');
    if (!toggle || !menu) return;

    const getFocusable = () =>
      Array.from(menu.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])'));

    const setState = open => {
      toggle.classList.toggle('open', open);
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        const f = getFocusable();
        if (f.length) setTimeout(() => f[0].focus(), 80);
      } else {
        toggle.focus();
      }
    };

    toggle.addEventListener('click', () => setState(!menu.classList.contains('open')));
    $$('.mobile-nav__link, .mobile-nav__cta', menu).forEach(a =>
      a.addEventListener('click', () => setState(false))
    );
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('open')) return;
      if (e.key === 'Escape') { setState(false); return; }
      if (e.key === 'Tab') {
        const f = getFocusable();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length-1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length-1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ===== Scroll reveal ===== */
  function scrollReveal() {
    const items = $$('.reveal');
    if (prefersReduced || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in-view'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in-view'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach(el => io.observe(el));
  }

  /* ===== Cursor glow + card glow ===== */
  function cursorGlow() {
    if (!isFinePointer || prefersReduced) return;
    const glow = $('.cursor-glow');
    let raf = null, x = 0, y = 0;
    window.addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      if (glow) glow.style.opacity = '1';
      if (!raf) raf = requestAnimationFrame(() => {
        if (glow) glow.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
        raf = null;
      });
    }, { passive: true });
    document.addEventListener('mouseleave', () => { if (glow) glow.style.opacity = '0'; });
  }

  /* ===== Parallax ===== */
  function parallax() {
    if (prefersReduced) return;
    const els = $$('[data-parallax]');
    if (!els.length) return;
    let raf = null;
    const update = () => {
      const vh = window.innerHeight;
      els.forEach(el => {
        const r = el.getBoundingClientRect();
        const off = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax || '0.1');
        el.style.transform = `translate3d(0,${off.toFixed(1)}px,0)`;
      });
      raf = null;
    };
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ===== Hero background parallax — Chanel-style ===== */
  function heroParallax() {
    if (prefersReduced) return;
    const img = $('.hero__bg');
    if (!img) return;
    let raf = null;
    const update = () => {
      img.style.transform = `translate3d(0,${(window.scrollY * 0.35).toFixed(1)}px,0)`;
      raf = null;
    };
    window.addEventListener('scroll', () => {
      if (!raf) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* ===== Partículas douradas (canvas) ===== */
  function particles() {
    const canvas = $('#particles');
    if (!canvas || prefersReduced) return;
    const ctx = canvas.getContext('2d');
    let w, h, parts = [], raf;
    const COUNT = Math.min(52, Math.floor(window.innerWidth / 24));
    const rnd = (a, b) => a + Math.random() * (b - a);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width  = canvas.offsetWidth  * dpr;
      h = canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const make = () => ({
      x: rnd(0, canvas.offsetWidth), y: rnd(0, canvas.offsetHeight),
      r: rnd(.5, 2.2), s: rnd(.1, .48), a: rnd(.15, .7),
      tw: rnd(.004, .018), dir: Math.random() < .5 ? 1 : -1, drift: rnd(.04, .22)
    });

    const init = () => { resize(); parts = Array.from({ length: COUNT }, make); };
    const tick = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      parts.forEach(p => {
        p.y -= p.s;
        p.x += Math.sin(p.y * .012) * p.drift * p.dir;
        p.a += p.tw * p.dir;
        if (p.a > .75 || p.a < .12) p.dir *= -1;
        if (p.y < -6) { p.y = canvas.offsetHeight + 6; p.x = rnd(0, canvas.offsetWidth); }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `rgba(244,227,161,${p.a})`);
        g.addColorStop(1, 'rgba(214,180,93,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };

    init(); tick();
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(init, 200); });
    new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) { if (!raf) tick(); }
        else { cancelAnimationFrame(raf); raf = null; }
      });
    }, { threshold: 0 }).observe(canvas);
  }

  /* ===== Constelação de fragrâncias ===== */
  function constellation() {
    const wrap    = $('#constellation');
    if (!wrap) return;
    const nameEl  = $('#coreName');
    const sensEl  = $('#coreSensacao');
    const quanEl  = $('#coreQuando');
    const combEl  = $('#coreNotas');
    const perfEl  = $('#corePerfil');
    const lines   = $$('.constellation__lines line');
    const fams    = $$('.fam', wrap);

    const activate = (fam, i) => {
      wrap.classList.add('active');
      if (nameEl) nameEl.textContent = fam.dataset.title  || '';
      if (sensEl) sensEl.textContent = fam.dataset.sensacao || '';
      if (quanEl) quanEl.textContent = fam.dataset.quando  || '';
      if (combEl) combEl.textContent = fam.dataset.notas    || '';
      if (perfEl) perfEl.textContent = fam.dataset.perfil  || '';
      lines.forEach((l, j) => {
        l.style.opacity     = j === i ? '1'   : '0.15';
        l.style.strokeWidth = j === i ? '1.8' : '1';
      });
    };
    const reset = () => {
      wrap.classList.remove('active');
      lines.forEach(l => { l.style.opacity = ''; l.style.strokeWidth = ''; });
    };

    fams.forEach((fam, i) => {
      fam.addEventListener('mouseenter', () => activate(fam, i));
      fam.addEventListener('focus',      () => activate(fam, i));
      fam.addEventListener('mouseleave', reset);
      fam.addEventListener('blur',       reset);
      fam.addEventListener('click', () => {
        // toggle on mobile tap
        if (wrap.classList.contains('active') && lines[i]?.style.strokeWidth === '1.8') {
          reset();
        } else {
          activate(fam, i);
        }
      });
    });
  }

  /* ===== Mobile accordion (famílias) ===== */
  function buildAccordion() {
    const fams      = $$('.fam');
    const accordion = $('#famAccordion');
    if (!accordion || !fams.length) return;

    fams.forEach(fam => {
      const item = document.createElement('div');
      item.className = 'fam-acc__item';

      const trigger = document.createElement('button');
      trigger.className = 'fam-acc__trigger';
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = `
        <span class="fam-acc__icon">${fam.querySelector('.fam__icon')?.innerHTML || ''}</span>
        <span class="fam-acc__name">${fam.dataset.title || ''}</span>
        <span class="fam-acc__arrow" aria-hidden="true">↓</span>
      `;

      const body = document.createElement('div');
      body.className = 'fam-acc__body';
      body.innerHTML = `
        <div class="fam-acc__fields">
          <div class="fam-acc__field">
            <span class="fam-acc__key">Sensação</span>
            <span class="fam-acc__val">${fam.dataset.sensacao || ''}</span>
          </div>
          <div class="fam-acc__field">
            <span class="fam-acc__key">Quando usar</span>
            <span class="fam-acc__val">${fam.dataset.quando || ''}</span>
          </div>
          <div class="fam-acc__field">
            <span class="fam-acc__key">Notas típicas</span>
            <span class="fam-acc__val">${fam.dataset.notas || ''}</span>
          </div>
          <div class="fam-acc__field">
            <span class="fam-acc__key">Perfil ideal</span>
            <span class="fam-acc__val">${fam.dataset.perfil || ''}</span>
          </div>
        </div>
      `;

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';
        // Fechar todos
        accordion.querySelectorAll('.fam-acc__trigger').forEach(t => {
          t.setAttribute('aria-expanded', 'false');
          t.nextElementSibling.classList.remove('open');
        });
        if (!isOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          body.classList.add('open');
        }
      });

      item.appendChild(trigger);
      item.appendChild(body);
      accordion.appendChild(item);
    });
  }

  /* ===== Pirâmide olfativa ===== */
  function pyramid() {
    const segs   = $$('.pyr-seg');
    const levels = $$('.level');
    if (!segs.length) return;

    const link = (level, on) => {
      segs.forEach(s => s.classList.toggle('lit', on && s.dataset.level === level));
      levels.forEach(l => {
        l.style.borderLeftColor = (on && l.dataset.level === level) ? 'var(--gold)' : '';
      });
    };

    levels.forEach(l => {
      l.addEventListener('mouseenter', () => link(l.dataset.level, true));
      l.addEventListener('mouseleave', () => link(l.dataset.level, false));
      l.addEventListener('focus',      () => link(l.dataset.level, true));
      l.addEventListener('blur',       () => link(l.dataset.level, false));
    });
    segs.forEach(s => {
      s.addEventListener('mouseenter', () => link(s.dataset.level, true));
      s.addEventListener('mouseleave', () => link(s.dataset.level, false));
    });

    const pyr = $('#pyramid');
    if (pyr && !prefersReduced && 'IntersectionObserver' in window) {
      new IntersectionObserver((es, obs) => {
        es.forEach(e => {
          if (!e.isIntersecting) return;
          ['top', 'heart', 'base'].forEach((lv, i) => {
            setTimeout(() => {
              const s = segs.find(x => x.dataset.level === lv);
              if (s) { s.classList.add('lit'); setTimeout(() => s.classList.remove('lit'), 700); }
            }, i * 330);
          });
          obs.disconnect();
        });
      }, { threshold: 0.5 }).observe(pyr);
    }
  }

  /* ===== Quiz ===== */
  const QUIZ = {
    families: {
      amadeirado: {
        name: 'Amadeirado',
        desc: 'Quente, sofisticado e marcante. Notas como sândalo, cedro e patchouli criam presença duradoura e elegante — ideal para quem quer ser reconhecido antes mesmo de falar.'
      },
      doce: {
        name: 'Doce / Gourmand',
        desc: 'Envolvente e sedutor. Notas cremosas de baunilha, caramelo e âmbar que transmitem calor, proximidade e personalidade vibrante.'
      },
      citrico: {
        name: 'Cítrico',
        desc: 'Fresco, vibrante e energizante. Bergamota, limão e laranja para quem prefere leveza, energia e uma presença discreta mas inconfundível.'
      },
      floral: {
        name: 'Floral',
        desc: 'Delicado e versátil. Rosa, jasmim e peônia — elegância que transita entre o casual e o sofisticado, sempre com leveza refinada.'
      },
      ambar: {
        name: 'Âmbar / Oriental',
        desc: 'Intenso, misterioso e sensual. Âmbar, incenso e especiarias que criam uma memória olfativa inesquecível — para quem quer deixar rastro.'
      },
      aromatico: {
        name: 'Aromático / Fresco',
        desc: 'Limpo, moderno e confortável. Lavanda, menta e notas herbáceas para o uso diário sem esforço — sofisticado sem ser excessivo.'
      }
    },

    /* Momento × Sensação → família */
    matrix: {
      dia: { elegancia: 'floral',     frescor: 'citrico',    sensualidade: 'doce',      presenca: 'aromatico' },
      trabalho: { elegancia: 'amadeirado', frescor: 'aromatico', sensualidade: 'floral',     presenca: 'amadeirado' },
      encontro: { elegancia: 'floral',     frescor: 'citrico',    sensualidade: 'ambar',      presenca: 'doce' },
      evento:   { elegancia: 'amadeirado', frescor: 'citrico',    sensualidade: 'ambar',      presenca: 'amadeirado' }
    },

    intensityNote: {
      leve:        'Prefira concentrações mais suaves (EDT ou Colônia). Ideal para climas quentes e uso cotidiano.',
      equilibrada: 'Uma concentração EDP é perfeita para você: versátil, com boa fixação sem ser excessivo.',
      marcante:    'Aposte em EDP ou Parfum. Maior concentração, fixação longa — ideal para noites e ambientes especiais.'
    },

    pairings: {
      amadeirado: 'Especiado · Âmbar',
      doce:       'Floral · Baunilha',
      citrico:    'Aromático · Musk',
      floral:     'Musk · Sândalo',
      ambar:      'Amadeirado · Especiado',
      aromatico:  'Cítrico · Amadeirado'
    }
  };

  function quiz() {
    const wrap     = $('#quizWrap');
    if (!wrap) return;

    const fill     = $('#quizFill');
    const label    = $('#quizLabel');
    const stepsEl  = $('#quizSteps');
    const resultEl = $('#quizResult');
    const qrFamily = $('#qrFamily');
    const qrDesc   = $('#qrDesc');
    const qrWa     = $('#qrWa');
    const restart  = $('#quizRestart');

    const answers  = { step1: null, step2: null, step3: null };
    let currentStep = 1;

    const setProgress = step => {
      const pct = ((step - 1) / 3) * 100;
      if (fill)  fill.style.width  = `${pct}%`;
      if (label) label.textContent = step <= 3 ? `Passo ${step} de 3` : 'Resultado';
    };

    const showStep = step => {
      $$('.quiz-step', stepsEl).forEach(s => {
        s.classList.remove('active');
        s.style.display = '';
      });
      const el = stepsEl.querySelector(`[data-step="${step}"]`);
      if (el) el.classList.add('active');
      setProgress(step);
      currentStep = step;
    };

    const showResult = () => {
      const moment    = answers.step1;
      const sensacao  = answers.step2;
      const intensity = answers.step3;

      const familyKey = QUIZ.matrix[moment]?.[sensacao] || 'amadeirado';
      const family    = QUIZ.families[familyKey];
      const iNote     = QUIZ.intensityNote[intensity] || '';

      if (qrFamily) qrFamily.textContent = family.name;
      if (qrDesc)   qrDesc.textContent   = `${family.desc} ${iNote}`;

      const pairingEl   = $('#qrPairing');
      const pairingChip = $('#qrPairingChip');
      const pairing     = QUIZ.pairings[familyKey];
      if (pairingEl && pairingChip && pairing) {
        pairingChip.textContent = pairing;
        pairingEl.hidden = false;
      }

      const momentoLabel   = { dia: 'dia a dia', trabalho: 'trabalho', encontro: 'encontro', evento: 'evento especial' };
      const sensacaoLabel  = { elegancia: 'elegância', frescor: 'frescor', sensualidade: 'sensualidade', presenca: 'marcância' };
      const intensidadeLabel = { leve: 'leve', equilibrada: 'equilibrada', marcante: 'marcante' };
      const waMsgResult = `Olá! Fiz o quiz da MADRI. Meu resultado foi ${family.name}. Quero uma indicação para ${momentoLabel[moment] || moment}, com sensação de ${sensacaoLabel[sensacao] || sensacao} e intensidade ${intensidadeLabel[intensity] || intensity}.`;
      if (qrWa) {
        qrWa.setAttribute('href', `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(waMsgResult)}`);
        qrWa.setAttribute('target', '_blank');
        qrWa.setAttribute('rel', 'noopener');
      }

      stepsEl.style.display = 'none';
      if (fill)  fill.style.width  = '100%';
      if (label) label.textContent = 'Resultado';
      resultEl.hidden = false;
    };

    const resetQuiz = () => {
      answers.step1 = null; answers.step2 = null; answers.step3 = null;
      resultEl.hidden = true;
      stepsEl.style.display = '';
      $$('.qopt', stepsEl).forEach(o => o.classList.remove('selected'));
      showStep(1);
    };

    // Option click handlers
    $$('.qopt', stepsEl).forEach(opt => {
      opt.addEventListener('click', () => {
        const step    = parseInt(opt.closest('.quiz-step')?.dataset.step);
        const val     = opt.dataset.val;
        const siblings = $$('.qopt', opt.closest('.quiz-step'));

        // Mark selected — visual + ARIA
        siblings.forEach(o => {
          o.classList.remove('selected');
          o.setAttribute('aria-pressed', 'false');
        });
        opt.classList.add('selected');
        opt.setAttribute('aria-pressed', 'true');

        if (step === 1) answers.step1 = val;
        if (step === 2) answers.step2 = val;
        if (step === 3) {
          answers.step3 = val;
          setTimeout(showResult, 420);
          return;
        }

        setTimeout(() => showStep(step + 1), 380);
      });
    });

    if (restart) restart.addEventListener('click', resetQuiz);

    showStep(1);
  }

  /* ===== Pausa floaty quando hero sai de viewport ===== */
  function pauseFloaty() {
    const bottle = $('.hero__bottle');
    if (!bottle || prefersReduced) return;
    const hero = bottle.closest('.hero');
    if (!hero) return;
    new IntersectionObserver(entries => {
      entries.forEach(e => {
        bottle.style.animationPlayState = e.isIntersecting ? 'running' : 'paused';
      });
    }, { threshold: 0 }).observe(hero);
  }

  /* ===== Fixed WA button ===== */
  function fixedWa() {
    const btn = $('#waFixed');
    if (!btn) return;
    const onScroll = () => {
      const show = window.scrollY > 300;
      btn.classList.toggle('visible', show);
      btn.setAttribute('tabindex', show ? '0' : '-1');
      btn.setAttribute('aria-hidden', show ? 'false' : 'true');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ===== Init ===== */
  function init() {
    wireLinks();
    setYear();
    headerScroll();
    mobileNav();
    scrollReveal();
    cursorGlow();
    parallax();
    heroParallax();
    particles();
    constellation();
    buildAccordion();
    pyramid();
    quiz();
    fixedWa();
    pauseFloaty();
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
