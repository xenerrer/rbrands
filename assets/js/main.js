/* Case R.Brands · scroll da apresentação
   Técnica: Lenis (scroll suave) + GSAP ScrollTrigger (scrub), hero fixo (sticky) e
   sequência de frames em <canvas>. Sem frames, o hero usa o recorte do tênis como still. */
(() => {
  document.documentElement.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.gsap || !window.ScrollTrigger) { document.documentElement.classList.remove('js'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* scroll suave */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -10 }); }
    }));
  }

  /* barra de progresso */
  const prog = document.querySelector('.bar__progress i');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: s => prog && (prog.style.transform = `scaleX(${s.progress})`) });

  /* sequência de frames (opcional): coloque frames em /frames/frame-00001.webp ... e ajuste data-count */
  const canvas = document.querySelector('.hero__canvas');
  const still = document.querySelector('.hero__still');
  const frames = { n: 0, imgs: [], cur: -1, ready: false };
  async function initFrames() {
    // só tenta carregar quando houver frames: ajuste data-count no <canvas> (ex.: 76) depois de exportar os frames
    const n = Number(canvas.dataset.count) || 0;
    if (n < 2) return;
    const base = canvas.dataset.frames.replace(/^public\//, '');
    frames.n = n;
    const ctx = canvas.getContext('2d');
    let loaded = 0;
    for (let i = 0; i < n; i++) {
      const im = new Image(); im.src = `${base}${String(i + 1).padStart(5, '0')}.webp`;
      im.onload = () => { if (++loaded === 1) { canvas.width = im.naturalWidth; canvas.height = im.naturalHeight; canvas.hidden = false; still.style.opacity = 0; draw(0); } };
      frames.imgs.push(im);
    }
    frames.ready = true;
    function draw(i) { const im = frames.imgs[i]; if (im && im.complete) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(im, 0, 0); frames.cur = i; } }
    frames.draw = draw;
  }
  if (canvas) initFrames();

  /* hero */
  const hero = document.querySelector('[data-hero]');
  if (hero && !reduce) {
    const shoe = hero.querySelector('[data-hero-shoe]');
    const title = hero.querySelector('[data-hero-title]');
    const a = hero.querySelector('[data-hero-a]');
    const tech = hero.querySelectorAll('[data-hero-tech] li');
    const scrollHint = hero.querySelector('[data-hero-scroll]');
    const paths = hero.querySelectorAll('[data-draw]');
    paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: s => { if (frames.ready && frames.draw) frames.draw(Math.min(frames.n - 1, Math.floor(s.progress * frames.n))); }
      }
    });
    tl.fromTo(shoe, { xPercent: 7, yPercent: 24, rotate: -2, scale: 1 }, { xPercent: 10, yPercent: 18, rotate: 0, scale: 1.04, duration: 1 }, 0)
      .to(paths, { strokeDashoffset: 0, stagger: 0.12, duration: 1.4 }, 0)
      .to(scrollHint, { opacity: 0, duration: 0.2 }, 0)
      .fromTo(a, { opacity: 1 }, { opacity: 0, y: -30, duration: 0.5 }, 0.9)
      .to(title, { yPercent: -18, opacity: 0.12, duration: 1.4 }, 1)
      .to(shoe, { xPercent: 26, yPercent: 12, rotate: 4, scale: 1.2, duration: 1.6 }, 1.2);
    tech.forEach((li, i) => tl.fromTo(li, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.4 }, 1.6 + i * 0.35));
    tl.to(tech, { opacity: 0, duration: 0.4, stagger: 0.04 }, 3.6)
      .to(shoe, { xPercent: 90, yPercent: 4, rotate: 8, duration: 1.2 }, 3.5)
      .to(title, { opacity: 0, duration: 0.6 }, 3.6);
  }

  /* reveal */
  gsap.utils.toArray('.reveal').forEach(el => {
    if (reduce) return;
    gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });

  /* produto: troca de silo conforme o scroll */
  const stage = document.querySelector('[data-pin-stage]');
  if (stage) {
    const imgs = stage.querySelectorAll('[data-silo]');
    const steps = stage.querySelectorAll('[data-step]');
    const set = i => { imgs.forEach((im, k) => im.classList.toggle('is-on', k === i)); steps.forEach((s, k) => s.classList.toggle('is-on', k === i)); };
    set(0);
    ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: s => set(Math.min(imgs.length - 1, Math.floor(s.progress * imgs.length))) });
  }

  /* carrossel horizontal preso */
  const rail = document.querySelector('[data-rail]');
  if (rail && !reduce && matchMedia('(min-width: 821px)').matches) {
    const track = rail.querySelector('[data-rail-track]');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 40);
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: rail, start: 'top 64px', end: () => '+=' + (dist() * 1.25), scrub: 0.6, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
    tl.to({}, { duration: 0.2 }).to(track, { x: () => -dist(), duration: 1 });
  } else if (rail) {
    rail.querySelector('[data-rail-track]').style.cssText = 'overflow-x:auto;width:auto;scroll-snap-type:x mandatory';
  }

  /* fechamento: o tênis atravessa para o lado conforme a seção entra */
  const cs = document.querySelector('[data-closing-shoe]');
  if (cs && !reduce) gsap.fromTo(cs, { xPercent: 18, yPercent: 6 }, { xPercent: -4, yPercent: 0, ease: 'none', scrollTrigger: { trigger: '[data-closing]', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });

  /* recalcula quando imagens e fontes terminam de carregar (muda a altura da página e a largura da faixa) */
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener('load', refresh);
  document.querySelectorAll('img').forEach(im => { if (!im.complete) im.addEventListener('load', () => { clearTimeout(refresh.t); refresh.t = setTimeout(refresh, 120); }, { once: true }); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if ('ResizeObserver' in window) { let h = document.body.scrollHeight; new ResizeObserver(() => { if (Math.abs(document.body.scrollHeight - h) > 4) { h = document.body.scrollHeight; clearTimeout(refresh.r); refresh.r = setTimeout(refresh, 150); } }).observe(document.body); }
})();
