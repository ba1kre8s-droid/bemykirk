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

  // NO can move around the whole screen, but never overlap the YES button.
  function moveNoAway(clientX, clientY) {
    if (dodgeLock || revealStarted) return;

    const now = performance.now();
    if (now - lastDodgeAt < 90) return;
    lastDodgeAt = now;

    const btn = noBtn.getBoundingClientRect();
    const yesRect = yesBtn.getBoundingClientRect();

    const margin = 14;
    const bw = btn.width;
    const bh = btn.height;
    const maxX = Math.max(margin, window.innerWidth - bw - margin);
    const maxY = Math.max(margin, window.innerHeight - bh - margin);

    const safeGap = 36;
    const yesSafe = {
      left: yesRect.left - safeGap,
      right: yesRect.right + safeGap,
      top: yesRect.top - safeGap,
      bottom: yesRect.bottom + safeGap
    };

    function overlapsYes(x, y) {
      const left = x;
      const right = x + bw;
      const top = y;
      const bottom = y + bh;

      return !(
        right < yesSafe.left ||
        left > yesSafe.right ||
        bottom < yesSafe.top ||
        top > yesSafe.bottom
      );
    }

    let best = null;
    let bestScore = -Infinity;

    for (let i = 0; i < 50; i++) {
      const x = margin + Math.random() * Math.max(0, maxX - margin);
      const y = margin + Math.random() * Math.max(0, maxY - margin);

      if (overlapsYes(x, y)) continue;

      const cx = x + bw / 2;
      const cy = y + bh / 2;
      const distanceFromPointer = Math.hypot(cx - clientX, cy - clientY);

      if (distanceFromPointer > bestScore) {
        bestScore = distanceFromPointer;
        best = { x, y };
      }
    }

    if (!best) return;

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
