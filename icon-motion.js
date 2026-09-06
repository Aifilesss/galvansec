/* Victor.js supplies the 2D motion; SVG keeps the graphics sharp and accessible. */
(() => {
  if (typeof window.Victor !== 'function') return;
  const Victor = window.Victor;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const items = Array.from(document.querySelectorAll('[data-vector-host]'), host => ({
    host,
    icons: Array.from(host.querySelectorAll('[data-vector-icon]')),
    current: new Victor(0, 0), target: new Victor(0, 0)
  })).filter(item => item.icons.length);
  let paused = document.body.classList.contains('motion-paused');
  let frame = 0;
  let previous = 0;
  const allowed = () => !paused && !reduced.matches && fine.matches && !document.hidden;
  const zero = new Victor(0, 0);
  function paint(item) {
    for (const icon of item.icons) {
      icon.style.setProperty('--vector-x', item.current.x.toFixed(3) + 'px');
      icon.style.setProperty('--vector-y', item.current.y.toFixed(3) + 'px');
      icon.style.setProperty('--vector-angle', (item.current.x * .65).toFixed(3) + 'deg');
    }
  }
  function tick(now) {
    frame = 0;
    if (!allowed()) { resetAll(); return; }
    const delta = previous ? Math.min(now - previous, 50) : 16.7;
    previous = now;
    const blend = 1 - Math.exp(-delta / 70);
    let unsettled = false;
    for (const item of items) {
      if (item.current.distance(item.target) < .015) {
        item.current.copy(item.target);
      } else {
        item.current.mix(item.target, blend);
        unsettled = true;
      }
      paint(item);
    }
    if (unsettled) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function requestTick() {
    if (!frame && allowed()) frame = requestAnimationFrame(tick);
  }
  function resetAll() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
    for (const item of items) {
      item.current.copy(zero); item.target.copy(zero);
      item.host.classList.remove('vector-active'); paint(item);
    }
  }
  for (const item of items) {
    item.host.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !allowed()) return;
      const rect = item.host.getBoundingClientRect();
      const direction = new Victor(event.clientX, event.clientY)
        .subtract(new Victor(rect.left + rect.width / 2, rect.top + rect.height / 2));
      direction.divide(new Victor(Math.max(rect.width / 2, 1), Math.max(rect.height / 2, 1)));
      if (direction.length() > 1) direction.normalize();
      // Graphics move at most three CSS pixels; targets and text never move.
      item.target.copy(direction.multiply(new Victor(3, 3)));
      item.host.classList.add('vector-active'); requestTick();
    }, { passive: true });
    item.host.addEventListener('pointerleave', () => {
      item.target.copy(zero); item.host.classList.remove('vector-active'); requestTick();
    });
    item.host.addEventListener('focusin', () => {
      if (!allowed()) return;
      item.target.copy(new Victor(0, -1.5));
      item.host.classList.add('vector-active'); requestTick();
    });
    item.host.addEventListener('focusout', () => {
      item.target.copy(zero); item.host.classList.remove('vector-active'); requestTick();
    });
  }
  window.addEventListener('portfolio-motion', event => {
    paused = event.detail.paused;
    if (!allowed()) resetAll();
  });
  reduced.addEventListener('change', resetAll);
  fine.addEventListener('change', resetAll);
  document.addEventListener('visibilitychange', resetAll);
})();
