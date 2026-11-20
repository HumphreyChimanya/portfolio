// Portfolio interactions. Content stays fully visible without JS:
// animation states only apply once the `js` class is on <html>.
(() => {
    const root = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.add('js');
    if (reduceMotion) root.classList.add('reduce-motion');

    /* ---------- Mobile navigation ---------- */
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const setMenu = (open) => {
        navMenu.classList.toggle('open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.textContent = open ? 'Close' : 'Menu';
    };
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => setMenu(!navMenu.classList.contains('open')));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('open')) { setMenu(false); navToggle.focus(); }
        });
    }

    /* ---------- Scroll progress + nav that tucks away on scroll down ---------- */
    const nav = document.querySelector('.site-nav');
    const progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        const menuOpen = navMenu && navMenu.classList.contains('open');
        if (nav && !menuOpen) nav.classList.toggle('nav-hidden', y > lastY && y > 160);
        lastY = y;
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    // Show the nav again when keyboard focus moves into it.
    if (nav) nav.addEventListener('focusin', () => nav.classList.remove('nav-hidden'));
    onScroll();

    /* ---------- Headline: words rise in one by one ---------- */
    document.querySelectorAll('.split').forEach((el) => {
        const text = el.textContent.trim();
        el.setAttribute('aria-label', text);
        el.innerHTML = text.split(/\s+/).map((word, i) =>
            `<span class="word" aria-hidden="true"><span style="--w:${i}">${word}</span></span>`
        ).join(' ');
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-in')));
    });

    /* ---------- Count-up numbers ---------- */
    const countUp = (el) => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) { el.textContent = target + suffix; return; }
        const start = performance.now();
        const duration = 1400;
        const step = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    /* ---------- Reveal on scroll ---------- */
    const revealables = document.querySelectorAll('[data-reveal], [data-count]');
    if ('IntersectionObserver' in window && !reduceMotion) {
        // Fully clipped elements (the "wipe" headings) never report as intersecting,
        // so those are observed through their parent instead.
        const targetFor = new Map();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const els = targetFor.get(entry.target) || [];
                els.forEach((el) => {
                    el.classList.add('is-visible');
                    if (el.dataset.count) countUp(el);
                    el.querySelectorAll('[data-count]').forEach(countUp);
                });
                io.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
        revealables.forEach((el) => {
            if (el.dataset.count && el.closest('[data-reveal]')) return; // parent handles it
            const watch = el.dataset.reveal === 'wipe' ? el.parentElement : el;
            if (!targetFor.has(watch)) { targetFor.set(watch, []); io.observe(watch); }
            targetFor.get(watch).push(el);
        });
    } else {
        revealables.forEach((el) => el.classList.add('is-visible'));
    }

    /* ---------- Project filters ---------- */
    const filterButtons = document.querySelectorAll('[data-filter]');
    const projects = document.querySelectorAll('.project[data-cat]');
    const status = document.getElementById('filter-status');
    filterButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.filter;
            filterButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            let shown = 0;
            projects.forEach((p) => {
                const match = cat === 'all' || p.dataset.cat === cat;
                p.hidden = !match;
                if (match) {
                    shown += 1;
                    p.classList.remove('is-visible', 'pop');
                    void p.offsetWidth; // restart the entrance animation
                    p.classList.add('is-visible', 'pop');
                }
            });
            if (status) status.textContent = `Showing ${shown} project${shown === 1 ? '' : 's'}.`;
        });
    });

    /* ---------- Hero dot field: a grid of points that ripples away from the cursor ---------- */
    const canvas = document.querySelector('.field');
    if (canvas && canvas.getContext) {
        const ctx = canvas.getContext('2d');
        const stage = canvas.parentElement;
        const GAP = 28;
        let w = 0, h = 0, dpr = 1, dots = [], running = false, frame = 0;
        const pointer = { x: -9999, y: -9999, active: false };

        const build = () => {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = stage.clientWidth; h = stage.clientHeight;
            canvas.width = w * dpr; canvas.height = h * dpr;
            canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dots = [];
            for (let y = GAP / 2; y < h; y += GAP) {
                for (let x = GAP / 2; x < w; x += GAP) dots.push({ x, y });
            }
            if (!running) draw(0);
        };

        const draw = (time) => {
            ctx.clearRect(0, 0, w, h);
            const t = time / 1000;
            for (const d of dots) {
                // Slow idle wave across the grid.
                const wave = reduceMotion ? 0 : Math.sin(d.x * 0.012 + d.y * 0.008 + t * 0.9);
                let x = d.x, y = d.y;
                let glow = 0.14 + wave * 0.05;
                let r = 1;
                if (pointer.active) {
                    const dx = d.x - pointer.x, dy = d.y - pointer.y;
                    const dist = Math.hypot(dx, dy);
                    const reach = 160;
                    if (dist < reach) {
                        const f = 1 - dist / reach;
                        const push = f * f * 18;
                        x += (dx / (dist || 1)) * push;
                        y += (dy / (dist || 1)) * push;
                        glow += f * 0.75;
                        r += f * 1.3;
                    }
                }
                // Fade dots out toward the bottom so the field blends into the page.
                glow *= Math.min(1, (h - d.y) / 160);
                ctx.fillStyle = `rgba(255,255,255,${Math.max(glow, 0).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const loop = (time) => { draw(time); frame = requestAnimationFrame(loop); };
        const start = () => { if (!running && !reduceMotion) { running = true; frame = requestAnimationFrame(loop); } };
        const stop = () => { running = false; cancelAnimationFrame(frame); };

        stage.addEventListener('pointermove', (e) => {
            const rect = canvas.getBoundingClientRect();
            pointer.x = e.clientX - rect.left; pointer.y = e.clientY - rect.top; pointer.active = true;
            if (reduceMotion) draw(0);
        });
        stage.addEventListener('pointerleave', () => { pointer.active = false; if (reduceMotion) draw(0); });

        // Only animate while the hero is on screen and the tab is visible.
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop())).observe(stage);
        } else { start(); }
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

        let resizeTimer;
        window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 150); });
        build();
    }
})();
