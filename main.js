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
    applyTheme(savedTheme || 'golden');

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

    // Autoplay is handled by `autoplay` and `muted` attributes in HTML.
    // We just need to handle unmuting on first interaction.
    const unmuteOnFirstInteraction = () => {
      if (bgAudio.muted) {
        bgAudio.muted = false;
        updateAudioUI(!bgAudio.paused);
      }
      // Remove this listener so it only runs once.
      document.removeEventListener('click', unmuteOnFirstInteraction);
      document.removeEventListener('scroll', unmuteOnFirstInteraction);
    };

    document.addEventListener('click', unmuteOnFirstInteraction);
    document.addEventListener('scroll', unmuteOnFirstInteraction);

    // Update UI based on initial (muted) playback state
    bgAudio.play().then(() => {
      updateAudioUI(true); // Show "Pause" initially, as it's playing (muted)
    }).catch(e => {
      console.warn("Autoplay was blocked.", e);
      updateAudioUI(false);
    });

    bgAudio.onplay = () => updateAudioUI(true);
    bgAudio.onpause = () => updateAudioUI(false);

    // Add click listener for manual control
    audioToggle.addEventListener('click', async () => {
      try {
        if (bgAudio.paused) {
          await bgAudio.play();
        } else {
          bgAudio.pause();
        }
        // Ensure sound is on if user manually plays
        bgAudio.muted = false;
      } catch (err) {
        console.warn('Audio playback failed.', err);
      }
    });
  }

  // --- Scroll Animations ---
  function handleScroll() {
    const scrollY = window.scrollY;
    const scrollDelta = scrollY - lastScrollY;
    const heroHeight = window.innerHeight;
    const quoteStopY = quoteStop ? quoteStop.offsetTop + quoteStop.offsetHeight / 2 : Infinity;
    const freezeLogo = scrollY + window.innerHeight / 2 >= quoteStopY;

    // Logo rotation
    if (!freezeLogo) {
      rotation += scrollDelta * 0.5;
      scrollLogo.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    }

    // Logo glow effect
    scrollLogo.classList.add('glowing');
    clearTimeout(glowTimeout);
    glowTimeout = setTimeout(() => scrollLogo.classList.remove('glowing'), 300);

    // Parallax for hero and section elements
    if (scrollY > heroHeight * 0.5) {
      if (heroTop) heroTop.style.transform = `translateX(-50%) translateY(-${scrollY * 0.3}px)`;
      if (heroBottom) heroBottom.style.transform = `translateX(-50%) translateY(${scrollY * 0.3}px)`;
      sections.forEach(section => {
        section.style.transform = `translateY(-${(scrollY - heroHeight * 0.5) * 0.2}px)`;
      });
    } else {
      if (heroTop) heroTop.style.transform = 'translateX(-50%) translateY(0)';
      if (heroBottom) heroBottom.style.transform = 'translateX(-50%) translateY(0)';
      sections.forEach(section => section.style.transform = 'translateY(0)');
    }

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

  // --- Initialization ---
  setupTheme();
  setupAudio();
  setupPopReveal();
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
