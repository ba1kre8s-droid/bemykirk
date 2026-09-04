(() => {
  const stage = document.getElementById('stage');
  const controls = document.getElementById('controls');
  const noBtn = document.getElementById('noBtn');
  const yesBtn = document.getElementById('yesBtn');
  const hint = document.getElementById('hint');
  const reactionFlash = document.getElementById('reactionFlash');
  const reveal = document.getElementById('reveal');
  const music = document.getElementById('music');
  const boom = document.getElementById('boom');

  let noAttempted = false;
  let revealStarted = false;
  let dodgeLock = false;
  let lastDodgeAt = 0;

  // Keeps the NO button inside the control zone while forcing it away from the pointer.
  function moveNoAway(clientX, clientY) {
    if (dodgeLock || revealStarted) return;

    const now = performance.now();
    if (now - lastDodgeAt < 90) return;
    lastDodgeAt = now;

    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const area = mobile
      ? { left: 8, top: 8, width: window.innerWidth - 16, height: window.innerHeight - 16 }
      : controls.getBoundingClientRect();
    const btn = noBtn.getBoundingClientRect();

    const bw = btn.width;
    const bh = btn.height;
    const maxX = Math.max(0, area.width - bw);
    const maxY = Math.max(0, area.height - bh);

    const px = clientX - area.left;
    const py = clientY - area.top;

    let best = null;
    let bestScore = -Infinity;

    // A few deterministic/random candidates: far corners + random positions.
    const candidates = [
      [0, 0],
      [maxX, 0],
      [0, maxY],
      [maxX, maxY],
      [maxX * 0.5, 0],
      [maxX * 0.5, maxY],
      [Math.random() * maxX, Math.random() * maxY],
      [Math.random() * maxX, Math.random() * maxY],
      [Math.random() * maxX, Math.random() * maxY]
    ];

    for (const [x, y] of candidates) {
      const cx = x + bw / 2;
      const cy = y + bh / 2;
      const dist = Math.hypot(cx - px, cy - py);

      // Keep a little distance from the YES button when possible.
      const yesRect = yesBtn.getBoundingClientRect();
      const yesCx = yesRect.left - area.left + yesRect.width / 2;
      const yesCy = yesRect.top - area.top + yesRect.height / 2;
      const yesDist = Math.hypot(cx - yesCx, cy - yesCy);

      const score = dist + Math.min(yesDist, 160) * 0.5;

      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }

    if (!best) return;

    if (mobile) {
      noBtn.style.position = 'fixed';
      noBtn.style.left = `${area.left + best.x}px`;
      noBtn.style.top = `${area.top + best.y}px`;
      noBtn.style.transform = 'none';
      noBtn.style.zIndex = '30';
    } else {
      noBtn.style.left = `${best.x}px`;
      noBtn.style.top = `${best.y}px`;
    }

    dodgeLock = true;
    setTimeout(() => {
      dodgeLock = false;
    }, 115);
  }

  function unlockYes() {
    if (noAttempted) return;
    noAttempted = true;
    yesBtn.classList.remove('is-locked');
    yesBtn.setAttribute('aria-disabled', 'false');
    hint.textContent = 'Fine... YES is unlocked 😭';
  }

  function triggerReactionFlash() {
    reactionFlash.classList.remove('is-playing');
    void reactionFlash.offsetWidth;
    reactionFlash.classList.add('is-playing');

    try {
      boom.currentTime = 0;
      boom.play();
    } catch (_) {}
  }

  function handleNoAttempt(clientX, clientY) {
    unlockYes();
    triggerReactionFlash();
    moveNoAway(clientX, clientY);
  }

  // Desktop: dodge before the pointer ever reaches the button.
  controls.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || revealStarted) return;

    const noRect = noBtn.getBoundingClientRect();
    const cx = noRect.left + noRect.width / 2;
    const cy = noRect.top + noRect.height / 2;
    const distance = Math.hypot(event.clientX - cx, event.clientY - cy);

    if (distance < 105) {
      handleNoAttempt(event.clientX, event.clientY);
    }
  }, { passive: true });

  // Direct pointer entry fallback.
  noBtn.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') {
      handleNoAttempt(event.clientX, event.clientY);
    }
  });

  // Touch/mobile: first tap attempt unlocks YES and moves NO before click can complete.
  noBtn.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    handleNoAttempt(event.clientX, event.clientY);
  }, { passive: false });

  noBtn.addEventListener('click', (event) => {
    event.preventDefault();
    handleNoAttempt(event.clientX || innerWidth / 2, event.clientY || innerHeight / 2);
  });

  yesBtn.addEventListener('click', async () => {
    if (!noAttempted || revealStarted) return;

    revealStarted = true;
    hint.style.opacity = '0';

    try {
      music.currentTime = 0;
      music.loop = true;
      await music.play();
    } catch (_) {
      // If a browser delays audio despite the click gesture, one more tap will resume it.
      const resume = () => music.play().catch(() => {});
      window.addEventListener('pointerdown', resume, { once: true });
    }

    reveal.setAttribute('aria-hidden', 'false');
    reveal.classList.add('is-visible');

    setTimeout(() => {
      stage.classList.add('is-hidden');
    }, 250);
  });

  // Warm the audio buffers without autoplaying.
  music.load();
  boom.load();
})();
