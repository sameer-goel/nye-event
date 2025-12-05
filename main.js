document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const scrollLogo = document.getElementById('scrollLogo');
  const bgAudio = document.getElementById('bgAudio');
  const audioToggle = document.getElementById('audioToggle');
  const quoteStop = document.getElementById('quote-stop');
  const themePicker = document.getElementById('themePicker');
  const themeToggle = document.getElementById('themeToggle');
  const heroTop = document.querySelector('.hero-top');
  const heroBottom = document.querySelector('.hero-bottom');
  const sections = document.querySelectorAll('.section');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const popItems = document.querySelectorAll('.pop-on-scroll');
  const philosophyBlock = document.querySelector('.philosophy-reveal');
  const countdownEl = document.getElementById('ticketCountdown');
  const countdownStatus = document.getElementById('ticketCountdownStatus');

  // --- State Variables ---
  let rotation = 0;
  let lastScrollY = window.scrollY;
  let glowTimeout;

  // --- Theming ---
  const THEME_KEY = 'chaos-theme';
  const THEMES = ['golden', 'galactic', 'neon', 'mystical'];

  function applyTheme(theme) {
    const nextTheme = THEMES.includes(theme) ? theme : THEMES[0];
    document.body.setAttribute('data-theme', nextTheme);
    if (themePicker) {
      themePicker.classList.remove('active');
      themeToggle.setAttribute('aria-expanded', 'false');
    }
    try {
      localStorage.setItem(THEME_KEY, nextTheme);
    } catch (e) {
      console.warn('Could not save theme to localStorage.');
    }
  }

  function setupTheme() {
    const savedTheme = (() => {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (e) {
        return null;
      }
    })();
    applyTheme(savedTheme || 'neon');

    if (themePicker && themeToggle) {
      // Toggle the tray
      themeToggle.addEventListener('click', () => {
        const isActive = themePicker.classList.toggle('active');
        themeToggle.setAttribute('aria-expanded', String(isActive));
      });

      // Handle theme selection from options
      const themeOptions = themePicker.querySelectorAll('.theme-option');
      themeOptions.forEach(option => {
        option.addEventListener('click', () => {
          applyTheme(option.dataset.theme);
        });
      });

      // Close tray if clicking outside
      document.addEventListener('click', (e) => {
        if (!themePicker.contains(e.target)) {
          themePicker.classList.remove('active');
          themeToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // --- Audio Control ---
  function updateAudioUI(isPlaying) {
    if (!audioToggle) return;
    audioToggle.classList.toggle('paused', !isPlaying);
    audioToggle.setAttribute('aria-pressed', String(isPlaying));
    const label = audioToggle.querySelector('.label');
    if (label) label.textContent = isPlaying ? 'Pause Magic' : 'Play Magic';
  }

  function setupAudio() {
    if (!audioToggle || !bgAudio) return;
    audioToggle.classList.add('glow');

    bgAudio.onplay = () => updateAudioUI(true);
    bgAudio.onpause = () => updateAudioUI(false);

    // Add click listener for manual control
    audioToggle.addEventListener('click', async () => {
      try {
        if (bgAudio.paused) {
          bgAudio.muted = false;
          await bgAudio.play();
        } else {
          bgAudio.pause();
        }
      } catch (err) {
        console.warn('Audio playback failed.', err);
      }
    });

    // Start with explicit paused UI
    updateAudioUI(false);
  }

  // --- Scroll Animations ---
  function handleScroll() {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - lastScrollY;
    const heroHeight = window.innerHeight;
    const beyondHero = scrollY > heroHeight * 0.95;
    const nearBottom = window.innerHeight + scrollY >= document.body.scrollHeight - 20;
    const quoteStopY = quoteStop ? quoteStop.offsetTop + quoteStop.offsetHeight / 2 : Infinity;
    const freezeLogo = scrollY + window.innerHeight / 2 >= quoteStopY;

    // Logo rotation and scaling/opacity by scroll position
    if (!freezeLogo) {
      rotation += scrollDelta * 0.5;
    }
    if (scrollLogo) {
      let scale = 1;
      let opacity = 1;
      if (nearBottom) {
        scale = 2;
        opacity = 1;
      } else if (beyondHero) {
        scale = 0.5;
        opacity = 0.5;
      }
      scrollLogo.style.opacity = opacity;
      scrollLogo.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;
    }
    

    // Logo glow effect
    scrollLogo.classList.add('glowing');
    clearTimeout(glowTimeout);
    glowTimeout = setTimeout(() => scrollLogo.classList.remove('glowing'), 300);

    // Parallax disabled for hero/sections to avoid layout gaps
    sections.forEach(section => section.style.transform = 'translateY(0)');

    // Animate timeline items on scroll
    timelineItems.forEach((item, index) => {
      const content = item.querySelector('.timeline-content');
      const dot = item.querySelector('.timeline-dot');
      if (!content || !dot) return;

      const logoRect = scrollLogo.getBoundingClientRect();
      const dotRect = dot.getBoundingClientRect();
      const distance = Math.abs(dotRect.top + dotRect.height / 2 - logoRect.top - logoRect.height / 2);

      if (distance < 100 && !content.classList.contains('animate')) {
        setTimeout(() => content.classList.add('animate'), index * 180);
      }

      if (distance < 80 && dot.classList.contains('logo') && !dot.classList.contains('spin')) {
        dot.classList.add('spin');
        setTimeout(() => dot.classList.remove('spin'), 900);
      }
    });

    lastScrollY = scrollY;
  }

  function setupPopReveal() {
    if (!popItems.length) return;
    if (!('IntersectionObserver' in window)) {
      popItems.forEach(el => el.classList.add('visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    popItems.forEach(el => observer.observe(el));
  }

  // --- Ticket Countdown ---
  function setupCountdown() {
    if (!countdownEl) return;
    const cutoff = new Date('2025-12-20T23:59:59+01:00');
    const segments = {
      days: countdownEl.querySelector('[data-unit="days"]'),
      hours: countdownEl.querySelector('[data-unit="hours"]'),
      minutes: countdownEl.querySelector('[data-unit="minutes"]'),
      seconds: countdownEl.querySelector('[data-unit="seconds"]'),
    };

    const pad2 = (value) => String(value).padStart(2, '0');

    const render = () => {
      const now = new Date();
      const diff = cutoff - now;
      const isClosed = diff <= 0;
      const remaining = Math.max(0, diff);
      const totalSeconds = Math.floor(remaining / 1000);

      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (segments.days) segments.days.textContent = Math.max(days, 0);
      if (segments.hours) segments.hours.textContent = pad2(Math.max(hours, 0));
      if (segments.minutes) segments.minutes.textContent = pad2(Math.max(minutes, 0));
      if (segments.seconds) segments.seconds.textContent = pad2(Math.max(seconds, 0));

      countdownEl.classList.toggle('countdown-closed', isClosed);
      if (countdownStatus) {
        countdownStatus.textContent = isClosed
          ? 'The circle is now closed.'
          : 'Portal closes 20 Dec 2025 (23:59 CET).';
      }
    };

    render();
    setInterval(render, 1000);
  }

  // --- Initialization ---
  setupTheme();
  setupAudio();
  setupPopReveal();
  setupCountdown();
  if (philosophyBlock) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          philosophyBlock.classList.add('show');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    observer.observe(philosophyBlock);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
});
