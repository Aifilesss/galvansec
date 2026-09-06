(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motion = document.getElementById('motion');
  let paused = reduced.matches;
  function applyMotion() {
    document.body.classList.toggle('motion-paused', paused);
    motion.setAttribute('aria-pressed', String(paused));
    motion.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    motion.querySelector('.motion-label').textContent = paused ? 'Play' : 'Pause';
    window.dispatchEvent(new CustomEvent('portfolio-motion', { detail: { paused } }));
  }
  motion.addEventListener('click', () => { paused = !paused; applyMotion(); });
  reduced.addEventListener('change', e => { paused = e.matches; applyMotion(); });
  applyMotion();
  const progress = document.querySelector('.reading-progress');
  let queued = false;
  function updateProgress() {
    const available = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (available > 0 ? scrollY / available * 100 : 0) + '%';
    queued = false;
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  addEventListener('resize', updateProgress);
  updateProgress();
  const navLinks = document.querySelectorAll('.navbar nav a');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      navLinks.forEach(link => {
        const active = link.hash === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('main section').forEach(section => observer.observe(section));
  document.getElementById('year').textContent = new Date().getFullYear();
  const output = document.getElementById('philosophy');
  const replay = document.getElementById('replay');
  const phrase = output.textContent;
  let typing;
  replay.addEventListener('click', () => {
    clearInterval(typing);
    if (paused || reduced.matches) { output.textContent = phrase; return; }
    let i = 0;
    output.textContent = '';
    replay.disabled = true;
    typing = setInterval(() => {
      output.textContent = phrase.slice(0, ++i);
      if (i >= phrase.length || paused) {
        clearInterval(typing); output.textContent = phrase; replay.disabled = false;
      }
    }, 25);
  });
})();
