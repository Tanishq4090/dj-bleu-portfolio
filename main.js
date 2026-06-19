/* ═══════════════════════════════════════════════════
   DJ BLEU — Portfolio SPA JavaScript
   ═══════════════════════════════════════════════════ */

// ── SECTION NAVIGATION ──────────────────────────────
const sections    = document.querySelectorAll('.section');
const navLinks    = document.querySelectorAll('.nav-link');
const mainNav     = document.getElementById('main-nav');

function showSection(id) {
  sections.forEach(s => { s.classList.remove('active'); s.style.display = 'none'; });
  navLinks.forEach(l => l.classList.remove('active'));

  const target = document.getElementById('section-' + id);
  if (target) {
    target.style.display = 'flex';
    void target.offsetWidth; // reflow for animation
    target.classList.add('active');
  }

  const activeLink = document.getElementById('nav-' + id);
  if (activeLink) activeLink.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'instant' });
  closeMobileMenu();

  // Nav style: transparent on home, solid on inner pages
  if (id === 'home') {
    mainNav.classList.remove('inner-page');
    mainNav.classList.remove('scrolled');
  } else {
    mainNav.classList.add('inner-page');
  }
}

// Delegate all [data-section] clicks
document.addEventListener('click', e => {
  const el = e.target.closest('[data-section]');
  if (el) {
    e.preventDefault();
    showSection(el.dataset.section);
  }
});

// ── SCROLL → AUTO-SWITCH TO EVENTS ─────────────────
// On HOME, when user scrolls past the bottom of the hero,
// automatically switch to the EVENTS section.
let scrollSwitchEnabled = true; // only trigger once per home visit

window.addEventListener('scroll', () => {
  const activeSection = document.querySelector('.section.active');
  if (!activeSection || activeSection.id !== 'section-home') return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  // Nav dark on scroll even on home
  if (window.scrollY > 40) {
    mainNav.classList.add('scrolled');
  } else {
    mainNav.classList.remove('scrolled');
  }

  // When hero fully scrolled past → go to events
  if (scrollSwitchEnabled && window.scrollY >= hero.offsetHeight - 10) {
    scrollSwitchEnabled = false;
    showSection('events');
  }
}, { passive: true });

// Reset scroll switch when returning to home
const originalShowSection = showSection;
function showSectionWrapped(id) {
  if (id === 'home') {
    scrollSwitchEnabled = true;
  }
  originalShowSection(id);
}
// Rebind click handler to use wrapped version
document.removeEventListener('click', null);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-section]');
  if (el) {
    e.preventDefault();
    if (el.dataset.section === 'home') scrollSwitchEnabled = true;
    showSection(el.dataset.section);
  }
});

// ── HAMBURGER / MOBILE MENU ─────────────────────────
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  mobileMenu.classList.remove('open');
}
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});

// ── CAROUSELS ───────────────────────────────────────
const carouselStates = {}; // carouselId → { index, total }

function initCarousels() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const id    = carousel.id.replace('carousel-', '');
    const track = document.getElementById('track-' + id);
    const slides = track ? track.querySelectorAll('.carousel-slide') : [];
    carouselStates[id] = { index: 0, total: slides.length };
  });
}

function goToSlide(carouselId, newIndex) {
  const state = carouselStates[carouselId];
  if (!state) return;

  // Clamp with wrapping
  state.index = ((newIndex % state.total) + state.total) % state.total;

  const track = document.getElementById('track-' + carouselId);
  if (track) {
    track.style.transform = `translateX(-${state.index * 100}%)`;
  }

  // Update dots
  const dotsContainer = document.getElementById('dots-' + carouselId);
  if (dotsContainer) {
    dotsContainer.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === state.index);
    });
  }
}

// Prev / Next buttons
document.addEventListener('click', e => {
  const prevBtn = e.target.closest('.carousel-prev');
  const nextBtn = e.target.closest('.carousel-next');

  if (prevBtn) {
    const id = prevBtn.dataset.carousel;
    goToSlide(id, carouselStates[id].index - 1);
  }
  if (nextBtn) {
    const id = nextBtn.dataset.carousel;
    goToSlide(id, carouselStates[id].index + 1);
  }

  // Dot clicks
  const dot = e.target.closest('.dot');
  if (dot) {
    const id  = dot.dataset.carousel;
    const idx = parseInt(dot.dataset.index, 10);
    goToSlide(id, idx);
  }
});

// Touch/swipe on carousels
document.querySelectorAll('.carousel').forEach(carousel => {
  let startX = 0;
  carousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    const id   = carousel.id.replace('carousel-', '');
    if (Math.abs(diff) > 40) {
      goToSlide(id, carouselStates[id].index + (diff > 0 ? 1 : -1));
    }
  }, { passive: true });
});

// ── RADIO PLAYER ────────────────────────────────────
let isPlaying    = false;
let progressTimer= null;
let progressVal  = 0;

const ctrlPlay     = document.getElementById('ctrl-play');
const progressFill = document.getElementById('progress-fill');
const timeCurrent  = document.getElementById('time-current');
const vinylEl      = document.querySelector('.player-art-inner');

const episodes = [
  { ep:'12', title:'TECH HOUSE SESSION VOL. 3',  meta:'May 2026 · Tech-House · 1:12:34',  total:'1:12:34', id:'ep-12', secs:4354 },
  { ep:'11', title:'JERSEY CLUB AFTERHOURS',      meta:'Apr 2026 · Jersey Club · 58:22',   total:'58:22',   id:'ep-11', secs:3502 },
  { ep:'10', title:'AMAPIANO SUNRISE',            meta:'Mar 2026 · Amapiano · 1:04:11',    total:'1:04:11', id:'ep-10', secs:3851 },
  { ep:'09', title:'AFRO HOUSE DEEP DIVE',        meta:'Feb 2026 · Afro House · 1:18:50',  total:'1:18:50', id:'ep-9',  secs:4730 },
  { ep:'08', title:'FRIDAY NIGHT GROOVES',        meta:'Jan 2026 · Mixed · 55:12',         total:'55:12',   id:'ep-8',  secs:3312 },
];
let currentEpIdx = 0;

function formatTime(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if (h>0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

function updatePlayerUI(idx) {
  const ep = episodes[idx];
  if (!ep) return;
  document.querySelector('.player-ep').textContent    = 'EPISODE ' + ep.ep;
  document.querySelector('.player-title').textContent = ep.title;
  document.querySelector('.player-meta').textContent  = 'Released ' + ep.meta;
  document.querySelectorAll('.player-time-labels span')[1].textContent = ep.total;
  document.querySelectorAll('.episode-row').forEach(r => r.classList.remove('active-ep'));
  const row = document.getElementById(ep.id);
  if (row) row.classList.add('active-ep');
  progressVal = 0;
  if (progressFill) progressFill.style.width = '0%';
  if (timeCurrent) timeCurrent.textContent = '0:00';
}

function stopPlayer() {
  clearInterval(progressTimer);
  isPlaying = false;
  if (ctrlPlay) ctrlPlay.innerHTML = '&#9654;';
  if (vinylEl) vinylEl.classList.remove('spinning');
}

function togglePlay() {
  isPlaying = !isPlaying;
  if (ctrlPlay) ctrlPlay.innerHTML = isPlaying ? '&#9646;&#9646;' : '&#9654;';
  if (vinylEl) vinylEl.classList.toggle('spinning', isPlaying);

  if (isPlaying) {
    const ep = episodes[currentEpIdx];
    progressTimer = setInterval(() => {
      progressVal = Math.min(progressVal + 0.04, 100);
      if (progressFill) progressFill.style.width = progressVal + '%';
      const fakeSecs = Math.floor(progressVal / 100 * ep.secs);
      if (timeCurrent) timeCurrent.textContent = formatTime(fakeSecs);
      if (progressVal >= 100) stopPlayer();
    }, 300);
  } else {
    clearInterval(progressTimer);
  }
}

if (ctrlPlay) ctrlPlay.addEventListener('click', togglePlay);

const ctrlPrev = document.getElementById('ctrl-prev');
const ctrlNext = document.getElementById('ctrl-next');

if (ctrlPrev) ctrlPrev.addEventListener('click', () => {
  stopPlayer();
  currentEpIdx = (currentEpIdx + 1) % episodes.length;
  updatePlayerUI(currentEpIdx);
});
if (ctrlNext) ctrlNext.addEventListener('click', () => {
  stopPlayer();
  currentEpIdx = (currentEpIdx - 1 + episodes.length) % episodes.length;
  updatePlayerUI(currentEpIdx);
});

document.querySelectorAll('.episode-row').forEach((row, i) => {
  row.addEventListener('click', () => {
    stopPlayer();
    currentEpIdx = i;
    updatePlayerUI(currentEpIdx);
  });
});

// ── INIT ─────────────────────────────────────────────
sections.forEach(s => {
  if (!s.classList.contains('active')) s.style.display = 'none';
});
initCarousels();

// ── BACKGROUND MUSIC ────────────────────────────────
const scWidgetIframe = document.getElementById('sc-widget');
if (scWidgetIframe) {
  const widget = SC.Widget(scWidgetIframe);
  const bgMusicBtn = document.getElementById('bg-music-toggle');
  const bgMusicWrapper = document.querySelector('.bg-music-wrapper');

  let isBgPlaying = false; 

  const updateUI = (playing) => {
    isBgPlaying = playing;
    if (playing) {
      if (bgMusicWrapper) bgMusicWrapper.classList.add('playing');
    } else {
      if (bgMusicWrapper) bgMusicWrapper.classList.remove('playing');
    }
  };

  if (bgMusicBtn) {
    bgMusicBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      widget.toggle();
      updateUI(!isBgPlaying);
    });
  }

  widget.bind(SC.Widget.Events.READY, () => {
    // If auto_play=true is blocked by the browser, wait for the first user interaction
    const startAudioFallback = () => {
      if (!isBgPlaying) widget.play();
      document.removeEventListener('click', startAudioFallback);
      document.removeEventListener('scroll', startAudioFallback);
      document.removeEventListener('keydown', startAudioFallback);
    };
    document.addEventListener('click', startAudioFallback);
    document.addEventListener('scroll', startAudioFallback, { once: true });
    document.addEventListener('keydown', startAudioFallback);

    widget.bind(SC.Widget.Events.PLAY, () => {
      updateUI(true);
    });

    widget.bind(SC.Widget.Events.PAUSE, () => {
      updateUI(false);
    });
  });
}
