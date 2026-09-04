(() => {
  'use strict';

  const yesBtn = document.getElementById('yesBtn');
  const noBtn = document.getElementById('noBtn');
  const flashOverlay = document.getElementById('flashOverlay');
  const proposal = document.getElementById('proposal');
  const yesScreen = document.getElementById('yesScreen');
  const boomAudio = document.getElementById('boomAudio');
  const yesMusic = document.getElementById('yesMusic');

  let noClicks = 0;
  let yesUnlocked = false;
  let flashTimer = null;
  let shapeIndex = 0;

  const shapes = [
    { w: 116, h: 50, radius: '999px', clip: 'none', rotate: -8 },
    { w: 62,  h: 62, radius: '50%', clip: 'none', rotate: 8 },
    { w: 145, h: 44, radius: '20px 999px 20px 999px', clip: 'none', rotate: -12 },
    { w: 86,  h: 70, radius: '18px', clip: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)', rotate: 10 },
    { w: 150, h: 42, radius: '50% 16% 50% 16%', clip: 'none', rotate: 5 },
    { w: 82,  h: 82, radius: '28% 72% 35% 65% / 55% 35% 65% 45%', clip: 'none', rotate: -6 },
    { w: 132, h: 48, radius: '8px', clip: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)', rotate: 7 }
  ];

  function stopAndResetAudio(audio) {
    audio.pause();
    try { audio.currentTime = 0; } catch (_) {}
  }

  function resetApp() {
    noClicks = 0;
    yesUnlocked = false;
    shapeIndex = 0;
    clearTimeout(flashTimer);

    stopAndResetAudio(boomAudio);
    stopAndResetAudio(yesMusic);

    flashOverlay.classList.remove('show');
    yesScreen.classList.remove('show');
    yesScreen.setAttribute('aria-hidden', 'true');
    proposal.hidden = false;

    yesBtn.classList.remove('is-grown');

    noBtn.className = 'choice no';
    noBtn.removeAttribute('style');
    noBtn.textContent = 'NO';
  }

  function playBoom() {
    try {
      boomAudio.pause();
      boomAudio.currentTime = 0;
      const p = boomAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  }

  function flashReaction() {
    clearTimeout(flashTimer);
    flashOverlay.classList.remove('show');
    // Force reflow so the animation restarts on every click.
    void flashOverlay.offsetWidth;
    flashOverlay.classList.add('show');

    flashTimer = setTimeout(() => {
      flashOverlay.classList.remove('show');
    }, 560);
  }

  function overlaps(a, b, padding = 22) {
    return !(
      a.right + padding < b.left ||
      a.left - padding > b.right ||
      a.bottom + padding < b.top ||
      a.top - padding > b.bottom
    );
  }

  function findSafePosition(width, height) {
    const edge = 10;
    const maxX = Math.max(edge, window.innerWidth - width - edge);
    const maxY = Math.max(edge, window.innerHeight - height - edge);
    const yesRect = yesBtn.getBoundingClientRect();

    let fallback = { x: edge, y: edge };

    for (let i = 0; i < 40; i++) {
      const x = edge + Math.random() * Math.max(0, maxX - edge);
      const y = edge + Math.random() * Math.max(0, maxY - edge);
      const candidate = { left: x, top: y, right: x + width, bottom: y + height };
      fallback = { x, y };
      if (!overlaps(candidate, yesRect, 26)) return { x, y };
    }

    return fallback;
  }

  function morphNoButton() {
    const shape = shapes[shapeIndex % shapes.length];
    shapeIndex += 1;

    noBtn.style.width = `${shape.w}px`;
    noBtn.style.height = `${shape.h}px`;
    noBtn.style.minWidth = '0';
    noBtn.style.minHeight = '0';
    noBtn.style.padding = '0 12px';
    noBtn.style.borderRadius = shape.radius;
    noBtn.style.clipPath = shape.clip;

    return shape;
  }

  function dodgeNoButton(shape) {
    const next = findSafePosition(shape.w, shape.h);

    if (!noBtn.classList.contains('is-floating')) {
      const start = noBtn.getBoundingClientRect();
      noBtn.classList.add('is-floating');
      noBtn.style.left = `${start.left}px`;
      noBtn.style.top = `${start.top}px`;
      // Force layout before transitioning to the random position.
      void noBtn.offsetWidth;
    }

    noBtn.classList.remove('dodge-jolt');
    void noBtn.offsetWidth;
    noBtn.classList.add('dodge-jolt');

    noBtn.style.left = `${next.x}px`;
    noBtn.style.top = `${next.y}px`;
    noBtn.style.rotate = `${shape.rotate}deg`;
  }

  noBtn.addEventListener('click', (event) => {
    event.preventDefault();

    noClicks += 1;
    yesUnlocked = true;

    // All three effects start from the same click event.
    playBoom();
    flashReaction();
    const shape = morphNoButton();
    dodgeNoButton(shape);

    if (noClicks === 10) {
      yesBtn.classList.add('is-grown');
    }
  });

  yesBtn.addEventListener('click', () => {
    if (!yesUnlocked) return;

    clearTimeout(flashTimer);
    flashOverlay.classList.remove('show');
    stopAndResetAudio(boomAudio);

    proposal.hidden = true;
    yesScreen.classList.add('show');
    yesScreen.setAttribute('aria-hidden', 'false');

    try {
      yesMusic.currentTime = 0;
      const p = yesMusic.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
  });

  window.addEventListener('pageshow', (event) => {
    // Also resets when the browser restores the page from back/forward cache.
    if (event.persisted) resetApp();
  });

  window.addEventListener('resize', () => {
    if (!noBtn.classList.contains('is-floating')) return;
    const rect = noBtn.getBoundingClientRect();
    const width = rect.width || 116;
    const height = rect.height || 50;
    const next = findSafePosition(width, height);
    noBtn.style.left = `${next.x}px`;
    noBtn.style.top = `${next.y}px`;
  });

  resetApp();
})();
