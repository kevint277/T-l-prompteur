/* ═══════════════════════════════════════════════════════════════
   TÉLÉPROMPTEUR STUDIO — script.js
   Version 2.0 — Refonte complète
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ═══ TEXTE D'EXEMPLE ═══════════════════════════════════════ */
const SAMPLE_SCRIPT = `Bonsoir. Je suis [Votre Nom] et voici le bulletin de nouvelles du soir.

En manchette ce soir : une journée historique sur les marchés financiers mondiaux alors que les indices boursiers atteignent des sommets sans précédent. Les analystes attribuent cette hausse à une série de données économiques encourageantes publiées plus tôt aujourd'hui.

Du côté de la météo, les Québécois peuvent s'attendre à un redoux significatif en fin de semaine. Les températures devraient grimper de plusieurs degrés, offrant un répit bien mérité après plusieurs semaines de grand froid.

Sur la scène internationale, les dirigeants du G7 se réunissent à Rome pour un sommet de deux jours consacré aux enjeux climatiques. Notre correspondante est sur place et nous en donne les dernières nouvelles.

En culture, le Festival du nouveau cinéma ouvre ses portes ce soir à Montréal. Plus d'une centaine de films en provenance de quarante pays seront présentés au cours des dix prochains jours.

Enfin, en sports, le Canadien de Montréal a remporté un match serré hier soir au Centre Bell, devant une foule en délire. La victoire de trois à deux en prolongation propulse l'équipe au quatrième rang de la division.

Nous serons de retour après ces messages pour la suite de nos nouvelles du soir. Restez avec nous.

[Pause publicité]

Bienvenue de retour. Voici maintenant le détail de nos manchettes.

Les autorités sanitaires ont annoncé aujourd'hui la mise en place d'un nouveau programme de vaccination ciblant les populations les plus vulnérables. Le ministre de la Santé a précisé que les rendez-vous seront disponibles dès la semaine prochaine dans l'ensemble des centres de santé de la province.

Nous vous remercions de votre fidélité. Bonne soirée.`;

/* ═══ ÉTAT DE L'APPLICATION ═════════════════════════════════ */
const state = {
  // Réglages de lecture
  speed:          60,      // px/s
  fontSize:       52,      // px
  lineHeight:     1.6,
  columnWidth:    80,      // %
  align:          'left',
  mirrorH:        false,
  mirrorV:        false,

  // Réglages tactiles
  boostEnabled:   true,
  boostPercent:   20,       // %
  doubleTapEnabled: true,
  autoCloseSec:   4,        // 0 = manuel

  // État de lecture
  isPlaying:      false,
  scrollPos:      0,
  pixelBuffer:    0.0,
  rafId:          null,
  lastTs:         null,

  // Minuterie
  timerSec:       0,
  timerInt:       null,

  // Interface
  controlsHidden: false,
  isFullscreen:   false,

  // Tactile
  isBoosting:     false,
  touchStartTime: 0,
  touchStartY:    0,
  touchMoved:     false,
  holdTimer:      null,
  lastTapTime:    0,
  doubleTapTimer: null,    // Timer de fermeture automatique du menu

  // Menu rapide
  quickMenuOpen:  false,
};

/* ═══ RÉFÉRENCES DOM ════════════════════════════════════════ */
const D = {
  // Script
  scriptInput:       document.getElementById('scriptInput'),
  sampleBtn:         document.getElementById('sampleBtn'),
  clearBtn:          document.getElementById('clearBtn'),

  // Lecture
  startBtn:          document.getElementById('startBtn'),
  pauseBtn:          document.getElementById('pauseBtn'),
  resetBtn:          document.getElementById('resetBtn'),
  hideControlsBtn:   document.getElementById('hideControlsBtn'),
  revealControlsBtn: document.getElementById('revealControlsBtn'),
  fullscreenBtn:     document.getElementById('fullscreenBtn'),
  fsExitBtn:         document.getElementById('fsExitBtn'),

  // Sliders
  speedRange:        document.getElementById('speedRange'),
  speedValue:        document.getElementById('speedValue'),
  fontSizeRange:     document.getElementById('fontSizeRange'),
  fontSizeValue:     document.getElementById('fontSizeValue'),
  lineHeightRange:   document.getElementById('lineHeightRange'),
  lineHeightValue:   document.getElementById('lineHeightValue'),
  widthRange:        document.getElementById('widthRange'),
  widthValue:        document.getElementById('widthValue'),
  alignSelect:       document.getElementById('alignSelect'),

  // Affichage
  mirrorHorizontal:  document.getElementById('mirrorHorizontal'),
  mirrorVertical:    document.getElementById('mirrorVertical'),

  // Tactile
  boostEnabled:      document.getElementById('boostEnabled'),
  boostRange:        document.getElementById('boostRange'),
  boostValue:        document.getElementById('boostValue'),
  boostRow:          document.getElementById('boostRow'),
  doubleTapEnabled:  document.getElementById('doubleTapEnabled'),
  autoCloseRange:    document.getElementById('autoCloseRange'),
  autoCloseValue:    document.getElementById('autoCloseValue'),
  autoCloseRow:      document.getElementById('autoCloseRow'),

  // Status
  statusPill:        document.getElementById('statusPill'),
  statusLabel:       document.getElementById('statusLabel'),
  statusText:        document.getElementById('statusText'),
  timerDisplay:      document.getElementById('timerDisplay'),
  progressFill:      document.getElementById('progressFill'),
  progressBar:       document.getElementById('progressBar'),

  // Viewer
  promptViewport:    document.getElementById('promptViewport'),
  promptContent:     document.getElementById('promptContent'),
  promptText:        document.getElementById('promptText'),
  mainLayout:        document.getElementById('mainLayout'),
  teleprompterFrame: document.getElementById('teleprompterFrame'),
  fsHint:            document.getElementById('fsHint'),
  boostIndicator:    document.getElementById('boostIndicator'),

  // Quick Menu
  quickMenu:         document.getElementById('quickMenu'),
  qmPlayPause:       document.getElementById('qmPlayPause'),
  qmReset:           document.getElementById('qmReset'),
  qmSpeedDown:       document.getElementById('qmSpeedDown'),
  qmSpeedUp:         document.getElementById('qmSpeedUp'),
  qmSpeedVal:        document.getElementById('qmSpeedVal'),
  qmClose:           document.getElementById('qmClose'),
};

/* ═══ STOCKAGE LOCAL ════════════════════════════════════════ */
const SK_TEXT = 'tps_text_v2';
const SK_CFG  = 'tps_config_v2';

function loadStorage() {
  try {
    const savedText = localStorage.getItem(SK_TEXT);
    D.scriptInput.value = savedText !== null ? savedText : SAMPLE_SCRIPT;

    const cfg = JSON.parse(localStorage.getItem(SK_CFG) || '{}');
    if (cfg.speed        !== undefined) state.speed        = cfg.speed;
    if (cfg.fontSize     !== undefined) state.fontSize     = cfg.fontSize;
    if (cfg.lineHeight   !== undefined) state.lineHeight   = cfg.lineHeight;
    if (cfg.columnWidth  !== undefined) state.columnWidth  = cfg.columnWidth;
    if (cfg.align        !== undefined) state.align        = cfg.align;
    if (cfg.mirrorH      !== undefined) state.mirrorH      = cfg.mirrorH;
    if (cfg.mirrorV      !== undefined) state.mirrorV      = cfg.mirrorV;
    if (cfg.boostEnabled     !== undefined) state.boostEnabled     = cfg.boostEnabled;
    if (cfg.boostPercent     !== undefined) state.boostPercent     = cfg.boostPercent;
    if (cfg.doubleTapEnabled !== undefined) state.doubleTapEnabled = cfg.doubleTapEnabled;
    if (cfg.autoCloseSec     !== undefined) state.autoCloseSec     = cfg.autoCloseSec;
  } catch (e) {
    D.scriptInput.value = SAMPLE_SCRIPT;
  }
}

function saveStorage() {
  try {
    localStorage.setItem(SK_TEXT, D.scriptInput.value);
    localStorage.setItem(SK_CFG, JSON.stringify({
      speed:           state.speed,
      fontSize:        state.fontSize,
      lineHeight:      state.lineHeight,
      columnWidth:     state.columnWidth,
      align:           state.align,
      mirrorH:         state.mirrorH,
      mirrorV:         state.mirrorV,
      boostEnabled:    state.boostEnabled,
      boostPercent:    state.boostPercent,
      doubleTapEnabled: state.doubleTapEnabled,
      autoCloseSec:    state.autoCloseSec,
    }));
  } catch (e) { /* Stockage indisponible */ }
}

let saveTimer = null;
const debounceSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveStorage, 600);
};

/* ═══ SYNCHRONISATION DE L'INTERFACE ═══════════════════════ */
function syncUI() {
  // Sliders → affichage
  D.speedRange.value       = state.speed;
  D.speedValue.textContent = state.speed + ' px/s';

  D.fontSizeRange.value       = state.fontSize;
  D.fontSizeValue.textContent = state.fontSize + 'px';

  D.lineHeightRange.value       = state.lineHeight;
  D.lineHeightValue.textContent = state.lineHeight.toFixed(2);

  D.widthRange.value       = state.columnWidth;
  D.widthValue.textContent = state.columnWidth + '%';

  D.alignSelect.value = state.align;

  // Checkboxes
  D.mirrorHorizontal.checked = state.mirrorH;
  D.mirrorVertical.checked   = state.mirrorV;
  D.boostEnabled.checked     = state.boostEnabled;
  D.doubleTapEnabled.checked = state.doubleTapEnabled;

  // Sliders tactile
  D.boostRange.value       = state.boostPercent;
  D.boostValue.textContent = '+' + state.boostPercent + '%';

  D.autoCloseRange.value       = state.autoCloseSec;
  D.autoCloseValue.textContent = state.autoCloseSec === 0 ? 'Manuel' : state.autoCloseSec + ' s';

  // Visibilité des rangées conditionnelles
  D.boostRow.style.opacity      = state.boostEnabled ? '1' : '0.4';
  D.boostRow.style.pointerEvents = state.boostEnabled ? '' : 'none';
  D.autoCloseRow.style.opacity   = state.doubleTapEnabled ? '1' : '0.4';
  D.autoCloseRow.style.pointerEvents = state.doubleTapEnabled ? '' : 'none';

  // Quick menu speed display
  D.qmSpeedVal.textContent = state.speed + ' px/s';
}

/* ═══ APPLICATION DES STYLES DE LECTURE ═════════════════════ */
function applyStyles() {
  D.promptText.style.fontSize   = state.fontSize   + 'px';
  D.promptText.style.lineHeight = state.lineHeight;
  D.promptText.style.textAlign  = state.align;
  D.promptContent.style.width   = state.columnWidth + '%';

  D.promptContent.classList.toggle('mirror-h', state.mirrorH);
  D.promptContent.classList.toggle('mirror-v', state.mirrorV);
}

/* ═══ CONVERSION TEXTE → HTML ═══════════════════════════════ */
function textToHtml(rawText) {
  return rawText.trim()
    .split(/\n{2,}/)
    .filter(para => para.trim())
    .map(para => {
      const escaped = para.trim()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
      return '<p>' + escaped + '</p>';
    })
    .join('');
}

/* ═══ STATUT ════════════════════════════════════════════════ */
function setStatus(label, text, playing) {
  D.statusLabel.textContent = label;
  D.statusText.textContent  = text;
  D.statusPill.classList.toggle('playing', !!playing);
  D.progressBar.setAttribute('aria-live', playing ? 'polite' : 'off');
}

/* ═══ MINUTERIE ═════════════════════════════════════════════ */
function startTimer() {
  if (state.timerInt) return;
  state.timerInt = setInterval(() => {
    state.timerSec++;
    const m = String(Math.floor(state.timerSec / 60)).padStart(2, '0');
    const s = String(state.timerSec % 60).padStart(2, '0');
    D.timerDisplay.textContent = m + ':' + s;
  }, 1000);
}

function stopTimer()  { clearInterval(state.timerInt); state.timerInt = null; }
function resetTimer() {
  stopTimer();
  state.timerSec = 0;
  D.timerDisplay.textContent = '00:00';
}

/* ═══ BARRE DE PROGRESSION ══════════════════════════════════ */
function updateProgress() {
  const vp  = D.promptViewport;
  const max = vp.scrollHeight - vp.clientHeight;
  const pct = max > 0 ? (vp.scrollTop / max) * 100 : 0;
  const val = Math.min(100, pct).toFixed(2);
  D.progressFill.style.width = val + '%';
  D.progressBar.setAttribute('aria-valuenow', Math.round(pct));
}

/* ═══ VITESSE EFFECTIVE (avec boost) ════════════════════════ */
function getEffectiveSpeed() {
  if (state.isBoosting && state.boostEnabled) {
    return state.speed * (1 + state.boostPercent / 100);
  }
  return state.speed;
}

/* ═══ MOTEUR DE DÉFILEMENT (requestAnimationFrame) ══════════ */
function scrollStep(ts) {
  if (!state.isPlaying) return;

  // Initialisation du timestamp au premier frame
  if (state.lastTs === null) state.lastTs = ts;
  const elapsed = Math.min(ts - state.lastTs, 100); // Cap à 100ms pour éviter les sauts
  state.lastTs = ts;

  // Accumulation sub-pixel pour un défilement fluide
  state.pixelBuffer += (getEffectiveSpeed() / 1000) * elapsed;
  const wholePx = Math.floor(state.pixelBuffer);
  if (wholePx >= 1) {
    state.pixelBuffer -= wholePx;
    D.promptViewport.scrollTop += wholePx;
    state.scrollPos = D.promptViewport.scrollTop;
  }

  updateProgress();

  // Détection de fin de script
  const vp = D.promptViewport;
  if (vp.scrollHeight - vp.clientHeight > 0 &&
      vp.scrollTop >= vp.scrollHeight - vp.clientHeight - 2) {
    pause();
    setStatus('Terminé', 'Fin du script atteinte.', false);
    updateQuickMenuPlayIcon();
    return;
  }

  state.rafId = requestAnimationFrame(scrollStep);
}

/* ═══ CONTRÔLES DE LECTURE ══════════════════════════════════ */
function play() {
  if (state.isPlaying) return;

  // Chargement du texte si la zone de lecture est vide
  const text = D.scriptInput.value.trim();
  if (!D.promptText.textContent.trim()) {
    if (!text) {
      alert('Veuillez saisir votre script avant de lancer la lecture.');
      D.scriptInput.focus();
      return;
    }
    D.promptText.innerHTML = textToHtml(text);
    applyStyles();
    D.promptViewport.scrollTop = state.scrollPos;
  }

  state.isPlaying   = true;
  state.lastTs      = null;
  state.pixelBuffer = 0;
  state.rafId = requestAnimationFrame(scrollStep);

  startTimer();
  setStatus('En lecture', 'Espace pour pause · Double-tap pour le menu', true);
  D.startBtn.textContent = '▶ Reprendre';
  updateQuickMenuPlayIcon();
}

function pause() {
  if (!state.isPlaying) return;
  state.isPlaying = false;
  cancelAnimationFrame(state.rafId);
  state.rafId = null;
  stopTimer();
  setStatus('Pause', 'Appuie sur Lecture pour reprendre', false);
  updateQuickMenuPlayIcon();
}

function togglePlayPause() {
  state.isPlaying ? pause() : play();
}

function reset() {
  pause();
  D.promptViewport.scrollTop = 0;
  state.scrollPos   = 0;
  state.pixelBuffer = 0;
  resetTimer();
  updateProgress();

  // Recharger le texte depuis la zone d'édition
  const text = D.scriptInput.value.trim();
  if (text) {
    D.promptText.innerHTML = textToHtml(text);
    applyStyles();
  }

  setStatus('Prêt', 'Clique sur Lecture pour commencer', false);
  D.startBtn.textContent = '▶ Lecture';
  updateQuickMenuPlayIcon();
}

/* ═══ UTILITAIRES ═══════════════════════════════════════════ */
function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function changeSpeed(delta) {
  state.speed = clamp(state.speed + delta, 10, 250);
  D.speedRange.value       = state.speed;
  D.speedValue.textContent = state.speed + ' px/s';
  D.qmSpeedVal.textContent = state.speed + ' px/s';
  debounceSave();
}

function changeFontSize(delta) {
  state.fontSize = clamp(state.fontSize + delta, 24, 96);
  D.fontSizeRange.value       = state.fontSize;
  D.fontSizeValue.textContent = state.fontSize + 'px';
  D.promptText.style.fontSize = state.fontSize + 'px';
  debounceSave();
}

/* ═══ AFFICHAGE DES CONTRÔLES ═══════════════════════════════ */
function hideControls() {
  state.controlsHidden = true;
  D.mainLayout.classList.add('controls-hidden');
}

function showControls() {
  state.controlsHidden = false;
  D.mainLayout.classList.remove('controls-hidden');
}

/* ═══ PLEIN ÉCRAN ═══════════════════════════════════════════ */
function enterFullscreen() {
  state.isFullscreen = true;
  document.body.classList.add('is-fullscreen');

  // Tentative via Fullscreen API (optionnelle, le CSS prend le relais)
  const el = D.teleprompterFrame;
  try {
    if      (el.requestFullscreen)        el.requestFullscreen();
    else if (el.webkitRequestFullscreen)  el.webkitRequestFullscreen();
  } catch (e) { /* CSS fallback actif */ }

  D.fullscreenBtn.textContent = '⛶ Quitter';

  // Affichage temporaire du hint
  showFsHint();
}

function exitFullscreen() {
  state.isFullscreen = false;
  document.body.classList.remove('is-fullscreen');

  try {
    if      (document.exitFullscreen        && document.fullscreenElement)        document.exitFullscreen();
    else if (document.webkitExitFullscreen  && document.webkitFullscreenElement)  document.webkitExitFullscreen();
  } catch (e) {}

  D.fullscreenBtn.textContent = '⛶ Plein écran';
  closeQuickMenu();
}

function toggleFullscreen() {
  state.isFullscreen ? exitFullscreen() : enterFullscreen();
}

// Synchronisation avec les événements natifs du navigateur
function onFullscreenChange() {
  const nativeFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!nativeFs && state.isFullscreen) {
    // L'utilisateur a quitté via Esc du navigateur
    state.isFullscreen = false;
    document.body.classList.remove('is-fullscreen');
    D.fullscreenBtn.textContent = '⛶ Plein écran';
    closeQuickMenu();
  }
}

/* ═══ HINT PLEIN ÉCRAN ══════════════════════════════════════ */
let fsHintTimer = null;

function showFsHint() {
  D.fsHint.classList.add('visible');
  clearTimeout(fsHintTimer);
  fsHintTimer = setTimeout(() => D.fsHint.classList.remove('visible'), 3500);
}

/* ═══ MENU RAPIDE (double-tap) ══════════════════════════════ */
function updateQuickMenuPlayIcon() {
  D.qmPlayPause.textContent = state.isPlaying ? '⏸' : '▶';
  D.qmPlayPause.title       = state.isPlaying ? 'Pause' : 'Lecture';
}

function openQuickMenu() {
  if (state.quickMenuOpen) return;
  state.quickMenuOpen = true;
  D.quickMenu.classList.remove('hidden');
  D.quickMenu.setAttribute('aria-hidden', 'false');
  updateQuickMenuPlayIcon();

  // Démarrage du timer de fermeture automatique
  if (state.autoCloseSec > 0) {
    clearTimeout(state.doubleTapTimer);
    state.doubleTapTimer = setTimeout(closeQuickMenu, state.autoCloseSec * 1000);
  }
}

function closeQuickMenu() {
  if (!state.quickMenuOpen) return;
  state.quickMenuOpen = false;
  D.quickMenu.classList.add('hidden');
  D.quickMenu.setAttribute('aria-hidden', 'true');
  clearTimeout(state.doubleTapTimer);
}

function resetAutoCloseTimer() {
  if (!state.quickMenuOpen || state.autoCloseSec === 0) return;
  clearTimeout(state.doubleTapTimer);
  state.doubleTapTimer = setTimeout(closeQuickMenu, state.autoCloseSec * 1000);
}

/* ═══ INTERACTIONS TACTILES ═════════════════════════════════ */

// Délai minimal pour distinguer tap et appui long (ms)
const HOLD_DELAY = 160;
// Distance maximale pour qu'un toucher soit considéré comme un tap (px)
const TAP_THRESHOLD = 12;
// Intervalle maximal entre deux taps pour un double-tap (ms)
const DOUBLE_TAP_INTERVAL = 300;

function onTouchStart(e) {
  // Ne pas interférer avec le menu rapide
  if (e.target.closest('.qm-inner')) return;

  const touch = e.touches[0];
  state.touchStartTime = Date.now();
  state.touchStartY    = touch.clientY;
  state.touchMoved     = false;

  // Démarrage du timer pour l'appui long (boost)
  clearTimeout(state.holdTimer);
  if (state.isPlaying && state.boostEnabled) {
    state.holdTimer = setTimeout(() => {
      if (!state.touchMoved) {
        state.isBoosting = true;
        D.boostIndicator.classList.add('visible');
      }
    }, HOLD_DELAY);
  }
}

function onTouchMove(e) {
  if (e.target.closest('.qm-inner')) return;

  const touch = e.touches[0];
  const deltaY = Math.abs(touch.clientY - state.touchStartY);

  // Si déplacement significatif, c'est un scroll → annuler le boost
  if (deltaY > TAP_THRESHOLD) {
    state.touchMoved = true;
    clearTimeout(state.holdTimer);
    if (state.isBoosting) {
      state.isBoosting = false;
      D.boostIndicator.classList.remove('visible');
    }
  }
}

function onTouchEnd(e) {
  if (e.target.closest('.qm-inner')) return;

  // Annulation du timer d'appui long
  clearTimeout(state.holdTimer);

  // Fin du boost
  if (state.isBoosting) {
    state.isBoosting = false;
    D.boostIndicator.classList.remove('visible');
  }

  // Si le doigt n'a pas bougé → c'est un tap
  if (!state.touchMoved) {
    const touchDuration = Date.now() - state.touchStartTime;

    // Un appui long ne compte pas comme tap pour le double-tap
    if (touchDuration < HOLD_DELAY + 50) {
      const now      = Date.now();
      const timeSince = now - state.lastTapTime;

      if (timeSince < DOUBLE_TAP_INTERVAL && state.doubleTapEnabled) {
        // Double-tap détecté !
        e.preventDefault(); // Empêche le zoom
        state.lastTapTime = 0; // Réinitialisation pour éviter triple-tap

        if (state.quickMenuOpen) {
          closeQuickMenu();
        } else {
          openQuickMenu();
        }
      } else {
        state.lastTapTime = now;
      }
    }
  }
}

/* ═══ RACCOURCIS CLAVIER ════════════════════════════════════ */
function onKeydown(e) {
  // Ne pas intercepter quand on tape dans la textarea
  if (e.target === D.scriptInput) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  switch (e.key) {
    case ' ':
      e.preventDefault();
      togglePlayPause();
      break;
    case 'ArrowUp':
      e.preventDefault();
      changeSpeed(+10);
      break;
    case 'ArrowDown':
      e.preventDefault();
      changeSpeed(-10);
      break;
    case '+': case '=':
      e.preventDefault();
      changeFontSize(+2);
      break;
    case '-': case '_':
      e.preventDefault();
      changeFontSize(-2);
      break;
    case 'f': case 'F':
      e.preventDefault();
      toggleFullscreen();
      break;
    case 'r': case 'R':
      e.preventDefault();
      reset();
      break;
    case 'Escape':
      if (state.isFullscreen) {
        exitFullscreen();
      } else if (state.quickMenuOpen) {
        closeQuickMenu();
      } else if (state.controlsHidden) {
        showControls();
      }
      break;
  }
}

/* ═══ LIAISON DES ÉVÉNEMENTS ════════════════════════════════ */
function bindEvents() {

  /* ── Lecture ── */
  D.startBtn.addEventListener('click', play);
  D.pauseBtn.addEventListener('click', pause);
  D.resetBtn.addEventListener('click', reset);

  /* ── Script ── */
  D.sampleBtn.addEventListener('click', () => {
    D.scriptInput.value = SAMPLE_SCRIPT;
    debounceSave();
  });

  D.clearBtn.addEventListener('click', () => {
    if (!D.scriptInput.value || confirm('Effacer tout le texte ?')) {
      D.scriptInput.value = '';
      debounceSave();
    }
  });

  D.scriptInput.addEventListener('input', debounceSave);

  /* ── Sliders ── */
  D.speedRange.addEventListener('input', () => {
    state.speed              = +D.speedRange.value;
    D.speedValue.textContent = state.speed + ' px/s';
    D.qmSpeedVal.textContent = state.speed + ' px/s';
    debounceSave();
  });

  D.fontSizeRange.addEventListener('input', () => {
    state.fontSize              = +D.fontSizeRange.value;
    D.fontSizeValue.textContent = state.fontSize + 'px';
    D.promptText.style.fontSize = state.fontSize + 'px';
    debounceSave();
  });

  D.lineHeightRange.addEventListener('input', () => {
    state.lineHeight                = +D.lineHeightRange.value;
    D.lineHeightValue.textContent   = state.lineHeight.toFixed(2);
    D.promptText.style.lineHeight   = state.lineHeight;
    debounceSave();
  });

  D.widthRange.addEventListener('input', () => {
    state.columnWidth              = +D.widthRange.value;
    D.widthValue.textContent       = state.columnWidth + '%';
    D.promptContent.style.width    = state.columnWidth + '%';
    debounceSave();
  });

  D.alignSelect.addEventListener('change', () => {
    state.align                   = D.alignSelect.value;
    D.promptText.style.textAlign  = state.align;
    debounceSave();
  });

  /* ── Affichage ── */
  D.mirrorHorizontal.addEventListener('change', () => {
    state.mirrorH = D.mirrorHorizontal.checked;
    applyStyles();
    debounceSave();
  });

  D.mirrorVertical.addEventListener('change', () => {
    state.mirrorV = D.mirrorVertical.checked;
    applyStyles();
    debounceSave();
  });

  /* ── Tactile settings ── */
  D.boostEnabled.addEventListener('change', () => {
    state.boostEnabled            = D.boostEnabled.checked;
    D.boostRow.style.opacity      = state.boostEnabled ? '1' : '0.4';
    D.boostRow.style.pointerEvents = state.boostEnabled ? '' : 'none';
    debounceSave();
  });

  D.boostRange.addEventListener('input', () => {
    state.boostPercent           = +D.boostRange.value;
    D.boostValue.textContent     = '+' + state.boostPercent + '%';
    debounceSave();
  });

  D.doubleTapEnabled.addEventListener('change', () => {
    state.doubleTapEnabled              = D.doubleTapEnabled.checked;
    D.autoCloseRow.style.opacity        = state.doubleTapEnabled ? '1' : '0.4';
    D.autoCloseRow.style.pointerEvents  = state.doubleTapEnabled ? '' : 'none';
    if (!state.doubleTapEnabled) closeQuickMenu();
    debounceSave();
  });

  D.autoCloseRange.addEventListener('input', () => {
    state.autoCloseSec              = +D.autoCloseRange.value;
    D.autoCloseValue.textContent    = state.autoCloseSec === 0 ? 'Manuel' : state.autoCloseSec + ' s';
    debounceSave();
  });

  /* ── Contrôles affichage sidebar ── */
  D.hideControlsBtn.addEventListener('click',   hideControls);
  D.revealControlsBtn.addEventListener('click', showControls);

  /* ── Plein écran ── */
  D.fullscreenBtn.addEventListener('click', toggleFullscreen);
  D.fsExitBtn.addEventListener('click',     exitFullscreen);
  document.addEventListener('fullscreenchange',       onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  /* ── Scroll manuel ── */
  D.promptViewport.addEventListener('scroll', () => {
    if (!state.isPlaying) {
      state.scrollPos = D.promptViewport.scrollTop;
      updateProgress();
    }
  });

  /* ── Clavier ── */
  document.addEventListener('keydown', onKeydown);

  /* ── Tactile sur le frame du téléprompteur ── */
  D.teleprompterFrame.addEventListener('touchstart', onTouchStart, { passive: true });
  D.teleprompterFrame.addEventListener('touchmove',  onTouchMove,  { passive: true });
  D.teleprompterFrame.addEventListener('touchend',   onTouchEnd,   { passive: false });

  /* ── Menu rapide ── */
  D.qmPlayPause.addEventListener('click', () => {
    togglePlayPause();
    updateQuickMenuPlayIcon();
    resetAutoCloseTimer();
  });

  D.qmReset.addEventListener('click', () => {
    reset();
    resetAutoCloseTimer();
  });

  D.qmSpeedDown.addEventListener('click', () => {
    changeSpeed(-10);
    resetAutoCloseTimer();
  });

  D.qmSpeedUp.addEventListener('click', () => {
    changeSpeed(+10);
    resetAutoCloseTimer();
  });

  D.qmClose.addEventListener('click', closeQuickMenu);

  // Empêcher les touches sur le menu de fermer ou interagir avec le viewport
  D.quickMenu.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
  D.quickMenu.addEventListener('touchend',   e => e.stopPropagation(), { passive: true });
}

/* ═══ INITIALISATION ════════════════════════════════════════ */
function init() {
  loadStorage();
  syncUI();
  applyStyles();
  setStatus('Prêt', 'Clique sur Lecture pour commencer', false);
  bindEvents();

  console.info(
    '%c TÉLÉPROMPTEUR STUDIO v2 %c prêt ',
    'background:#4da3ff;color:#000;font-weight:bold;padding:3px 8px;border-radius:4px 0 0 4px;',
    'background:#0f1a2e;color:#4da3ff;padding:3px 8px;border-radius:0 4px 4px 0;'
  );
}

// Démarrage propre selon l'état du DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
