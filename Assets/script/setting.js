/* ==================== setting.js ==================== */

const MODE = { 
  words: 'Kata acak', quote: 'Kutipan', timer: 'Timer' 
};

/* ---------- Simpan & Muat Preferensi ---------- */
function savePreferences() {
  localStorage.setItem("typing_prefs", JSON.stringify({
    language: STATE.language,
    mode: STATE.mode,
    theme: document.body.classList.contains("theme-dark") ? "dark" : "light",
    audio: STATE.audio ? "on" : "off",
    setCount: STATE.setCount,
    font: STATE.font
  }));
}

function loadPreferences() {
  try {
    const preferences = JSON.parse(localStorage.getItem("typing_prefs"));
    if (!preferences) return;

    Object.assign(STATE, {
      language: preferences.language ?? STATE.language,
      mode: preferences.mode ?? STATE.mode,
      setCount: preferences.setCount ?? STATE.setCount,
      font: preferences.font ?? STATE.font
    });

    document.body.classList.toggle("theme-dark", preferences.theme === "dark");
    themeBtn.textContent = preferences.theme === "dark" ? "🌙" : "☀️";
    STATE.audio = preferences.audio === "on";
    audioBtn.textContent = STATE.audio ? "🔊" : "🔇";
    langBtn.textContent = STATE.language === "id" ? "🇮🇩 Bahasa" : "🇺🇸 English";

    if (modeSelect) modeSelect.value = STATE.mode;
    if (modeLabel) modeLabel.textContent = MODE[STATE.mode] || STATE.mode;
    if (fontSize) fontSize.value = STATE.font;
    toggleFontSize(STATE.font);
  } catch (error) { console.error("Gagal load prefs:", error); }
}

/* ---------- Audio ---------- */
const playSound = sound => STATE.audio && sound.cloneNode().play().catch(()=>{});
const playTypeSound = () => playSound(typeSound);
const playErrorSound = () => playSound(errorSound);
const playWinningSound = () => playSound(winningSound);

/* ---------- Update Jumlah Kata/Waktu ---------- */
function updateCountSelectOptions() {
  const isTimer = STATE.mode === 'timer', isQuote = STATE.mode === 'quote';
  const map = isTimer ? CONFIG.timerSecondsOptions : CONFIG.wordsCountOptions;
  
  if (!countSelect) return;
  countSelect.disabled = isQuote;
  countSelect.innerHTML = isQuote ? '<option disabled selected>N/A</option>' : '';

  if (isQuote) return;
  for (const [value, label] of Object.entries(map)) {
    const object = document.createElement('option');
    object.value = value; object.textContent = `${label} ${isTimer ? 'second' : 'words'}`;
    if (value === STATE.setCount) {
      object.selected = true;
      STATE.activeWordCount = CONFIG.wordsCountOptions[value] ?? CONFIG.wordsCount;
      STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[value] ?? CONFIG.timerSeconds;
    }
    countSelect.appendChild(object);
  }
}

/* ---------- Control ---------- */
function toggleTheme() {
  document.body.classList.toggle('theme-dark');
  themeBtn.textContent = document.body.classList.contains('theme-dark') ? '🌙' : '☀️';
  savePreferences();
};

function toggleLanguage() {
  STATE.language = STATE.language === 'id' ? 'en' : 'id';
  langBtn.textContent = STATE.language === 'id' ? '🇮🇩 Bahasa' : '🇺🇸 English';

  if (typeof restartTest === "function") restartTest();
  savePreferences();
};

function toggleModeSelect(e) {
  STATE.mode = e.target.value;
  modeLabel.textContent = MODE[STATE.mode] || STATE.mode;
  updateCountSelectOptions(); 
  if(typeof updateFooter === "function") updateFooter(); 
  if (typeof restartTest === "function") restartTest(); 
  savePreferences();
}

function toggleSound() {
  STATE.audio = !STATE.audio;
  audioBtn.textContent = STATE.audio ? "🔊" : "🔇";
  savePreferences();
};

function toggleCountSelect(e) {
  const v = e.target.value;
  STATE.setCount = v;
  STATE.activeWordCount = CONFIG.wordsCountOptions[v] ?? CONFIG.wordsCount;
  STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[v] ?? CONFIG.timerSeconds;
  if (typeof restartTest === "function") restartTest(); 
  savePreferences();
};

function toggleFontSize(size) {
  const font = size || STATE.font || "medium";
  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${font}`);
  savePreferences();
};

function toggleSetting(e) {
  e.stopPropagation();
  settingsPanel.classList.toggle("show");
}

function toggleHomeSettings() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    if (modal.classList.contains('hidden')) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.remove('hidden'), 10);
        modal.classList.add('show');
    } else {
        modal.classList.add('hidden');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 400);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const homeSettingsBtn = document.getElementById('settingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettings');

    if (homeSettingsBtn) {
        homeSettingsBtn.addEventListener('click', toggleHomeSettings);
    }
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', toggleHomeSettings);
    }
    loadPreferences();
});

document.addEventListener('DOMContentLoaded', () => {
  const restartBtnScore = document.getElementById('restartBtnScore');

  if (restartBtnScore) {
    restartBtnScore.onclick = () => {
    closeScorePopup();

    if (typeof init === 'function') {
      init();
    } else {
      window.location.reload();
    }
  };
  }
});

/* ---------- Events ---------- */
fontSize.addEventListener('change', e => {
  STATE.font = e.target.value;
  toggleFontSize(e.target.value); 
  savePreferences();
});

themeBtn.addEventListener('click', toggleTheme);
langBtn.addEventListener('click', toggleLanguage);
audioBtn.addEventListener('click', toggleSound);
countSelect.addEventListener('change',toggleCountSelect);
settingsBtn.addEventListener('click', toggleSetting);
modeSelect.addEventListener('change', toggleModeSelect);

/* ---------- Load Data & Init ---------- */
async function loadWordData() {
  try { WORD_DATA = await (await fetch("../Assets/Data/data.json")).json(); }
  catch (error) { console.error("Gagal memuat data:", error); }
}

window.addEventListener("DOMContentLoaded", async () => {
  loadPreferences();
  if (countSelect) countSelect.value = STATE.setCount;
  if (modeSelect) modeSelect.value = STATE.mode; 
  if (fontSize) fontSize.value = STATE.font;

  STATE.activeWordCount = CONFIG.wordsCountOptions[STATE.setCount] ?? CONFIG.wordsCount;
  STATE.activeTimerSeconds = CONFIG.timerSecondsOptions[STATE.setCount] ?? CONFIG.timerSeconds;

  if (closeBtn) closeBtn.onclick = closeScorePopup;

  await loadWordData();
  STATE.wordsList = generateWords();
  STATE.mode === "timer" ? renderWords(true) : renderWords();
  timeId.textContent = STATE.mode === "timer" ? STATE.activeTimerSeconds : 0;
  typingInput.focus();
  modeLabel.textContent = MODE?.[STATE.mode] || STATE.mode;
  langBtn.textContent = STATE.language === "id" ? "🇮🇩 Bahasa" : "🇺🇸 English";
  updateCountSelectOptions(); updateFooter();
});
