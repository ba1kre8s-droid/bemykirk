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

  // Moves NO anywhere on screen, while keeping it away from YES.
  function moveNoAway(clientX, clientY) {
    if (dodgeLock || revealStarted) return;

    const now = performance.now();
    if (now - lastDodgeAt < 90) return;
    lastDodgeAt = now;

    const btn = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = btn.width;
    const bh = btn.height;

    const maxX = Math.max(margin, vw - bw - margin);
    const maxY = Math.max(margin, vh - bh - margin);

    // Expanded YES exclusion zone so NO never sits on top of / too close to YES.
    const safeGap = 34;
    const forbidden = {
      left: yesRect.left - safeGap,
      right: yesRect.right + safeGap,
      top: yesRect.top - safeGap,
      bottom: yesRect.bottom + safeGap
    };

    function overlapsYes(x, y) {
      const r = {
        left: x,
        right: x + bw,
        top: y,
        bottom: y + bh
      };
      return !(
        r.right < forbidden.left ||
        r.left > forbidden.right ||
        r.bottom < forbidden.top ||
        r.top > forbidden.bottom
      );
    }

    let best = null;
    let bestScore = -Infinity;

    // Try many positions around the whole viewport.
    for (let i = 0; i < 40; i++) {
      const x = margin + Math.random() * Math.max(0, maxX - margin);
      const y = margin + Math.random() * Math.max(0, maxY - margin);

      if (overlapsYes(x, y)) continue;

      const cx = x + bw / 2;
      const cy = y + bh / 2;
      const pointerDist = Math.hypot(cx - clientX, cy - clientY);

      // Prefer positions far from pointer and also not hugging YES.
      const yesCx = yesRect.left + yesRect.width / 2;
      const yesCy = yesRect.top + yesRect.height / 2;
      const yesDist = Math.hypot(cx - yesCx, cy - yesCy);

      const score = pointerDist + Math.min(yesDist, 320) * 0.4;

      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }

    // Fallback corners if random tries somehow fail.
    if (!best) {
      const fallback = [
        [margin, margin],
        [maxX, margin],
        [margin, maxY],
        [maxX, maxY]
      ].find(([x, y]) => !overlapsYes(x, y));

      best = fallback ? { x: fallback[0], y: fallback[1] } : { x: maxX, y: margin };
    }

    noBtn.style.position = 'fixed';
    noBtn.style.left = `${best.x}px`;
    noBtn.style.top = `${best.y}px`;
    noBtn.style.transform = 'none';
    noBtn.style.zIndex = '30';

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
