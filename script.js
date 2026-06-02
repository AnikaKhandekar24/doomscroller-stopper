const storageKeys = {
  settings: "doomscrollerStopperSettings",
  stats: "doomscrollerStopperStats"
};

const defaultSettings = {
  intensity: "medium",
  volume: 45,
  countdown: 10,
  theme: "light",
  funnyMessages: true
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const blankStats = () => ({
  date: todayKey(),
  totalOpens: 0,
  appOpens: {},
  interventions: 0,
  takeBacks: 0,
  openAnyway: 0,
  longestStreak: 0,
  focusCompletions: 0
});

let settings = loadSettings();
let stats = loadStats();
let session = {
  active: false,
  selectedMinutes: 25,
  remainingSeconds: 0,
  attempts: 0,
  currentStreak: 0,
  timerId: null
};
let intervention = {
  appName: "",
  remaining: settings.countdown,
  timerId: null,
  countdownDone: false
};
let lastFocusEscapeAt = 0;

const messages = {
  soft: [
    "Tiny pause. Big win.",
    "Your future self is quietly applauding this moment.",
    "Notice the urge. You do not have to obey it."
  ],
  medium: [
    "Do you actually want to scroll, or are you avoiding something?",
    "One tab of chaos has entered the chat.",
    "Your focus called. It sounded mildly betrayed."
  ],
  dramatic: [
    "Emergency meeting: your attention span has filed a complaint.",
    "This is not a drill. The scroll portal has reopened.",
    "You were seconds away from losing a heroic amount of time."
  ]
};

const els = {
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll("[data-view]"),
  startSession: document.querySelector("#start-session-btn"),
  durationButtons: document.querySelectorAll(".duration-button"),
  durationLabel: document.querySelector("#duration-label"),
  timerDisplay: document.querySelector("#timer-display"),
  sessionStatus: document.querySelector("#session-status"),
  motivation: document.querySelector("#motivation"),
  attemptCount: document.querySelector("#attempt-count"),
  currentStreak: document.querySelector("#current-streak"),
  streakPill: document.querySelector("#streak-pill"),
  focusLiveDot: document.querySelector("#focus-live-dot"),
  appButtons: document.querySelectorAll(".app-button"),
  intervention: document.querySelector("#intervention"),
  openedMessage: document.querySelector("#opened-message"),
  warningMessage: document.querySelector("#warning-message"),
  countdownNumber: document.querySelector("#countdown-number"),
  reflectionInput: document.querySelector("#reflection-input"),
  reflectionHint: document.querySelector("#reflection-hint"),
  takeBack: document.querySelector("#take-back-btn"),
  openAnyway: document.querySelector("#open-anyway-btn"),
  focus25: document.querySelector("#focus-25-btn"),
  resetStats: document.querySelector("#reset-stats-btn"),
  intensity: document.querySelector("#intensity-setting"),
  volume: document.querySelector("#volume-setting"),
  countdown: document.querySelector("#countdown-setting"),
  theme: document.querySelector("#theme-setting"),
  funny: document.querySelector("#funny-setting")
};

function loadSettings() {
  const saved = JSON.parse(localStorage.getItem(storageKeys.settings) || "null");
  return { ...defaultSettings, ...saved };
}

function loadStats() {
  const saved = JSON.parse(localStorage.getItem(storageKeys.stats) || "null");
  if (!saved || saved.date !== todayKey()) return blankStats();
  return { ...blankStats(), ...saved };
}

function saveSettings() {
  localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
}

function saveStats() {
  localStorage.setItem(storageKeys.stats, JSON.stringify(stats));
}

function showView(viewName) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === `${viewName}-view`));
  els.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewName));
  if (viewName === "stats") renderStats();
}

function startSession(minutes = session.selectedMinutes) {
  clearInterval(session.timerId);
  session.active = true;
  session.selectedMinutes = minutes;
  session.remainingSeconds = minutes * 60;
  session.attempts = 0;
  session.currentStreak = 0;
  session.timerId = setInterval(tickSession, 1000);
  updateSessionUI();
  showView("home");
}

function tickSession() {
  session.remainingSeconds -= 1;
  if (session.remainingSeconds <= 0) {
    clearInterval(session.timerId);
    session.active = false;
    session.remainingSeconds = 0;
    session.currentStreak += 1;
    stats.focusCompletions += 1;
    stats.longestStreak = Math.max(stats.longestStreak, session.currentStreak);
    saveStats();
  }
  updateSessionUI();
}

function updateSessionUI() {
  els.timerDisplay.textContent = formatTime(session.remainingSeconds || session.selectedMinutes * 60);
  els.sessionStatus.textContent = session.active ? "Focus session running" : "Not started";
  els.attemptCount.textContent = session.attempts;
  els.currentStreak.textContent = session.currentStreak;
  els.streakPill.textContent = `Streak: ${session.currentStreak}`;
  els.durationLabel.textContent = `${session.selectedMinutes}m`;
  els.focusLiveDot.textContent = session.active ? "Live" : "Idle";
  els.focusLiveDot.classList.toggle("active", session.active);
  els.motivation.textContent = session.active
    ? pick(["Stay with the next tiny task.", "Breathe, continue, and let the urge pass.", "Focus is built one resisted tap at a time."])
    : "Choose a duration and protect your attention.";
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function handleAppOpen(appName) {
  triggerIntervention(appName);
}

function handleFocusEscape(reason) {
  if (!session.active || !els.intervention.classList.contains("hidden")) return;

  const now = Date.now();
  if (now - lastFocusEscapeAt < 1500) return;
  lastFocusEscapeAt = now;
  triggerIntervention(reason);
}

function triggerIntervention(appName) {
  session.attempts += 1;
  session.currentStreak = 0;
  stats.totalOpens += 1;
  stats.interventions += 1;
  stats.appOpens[appName] = (stats.appOpens[appName] || 0) + 1;
  saveStats();
  updateSessionUI();
  openIntervention(appName);
}

function openIntervention(appName) {
  intervention.appName = appName;
  intervention.remaining = Number(settings.countdown);
  intervention.countdownDone = false;
  els.openedMessage.textContent = `You opened ${appName} again.`;
  els.warningMessage.textContent = settings.funnyMessages
    ? pick(messages[settings.intensity])
    : "Do you actually want to scroll, or are you avoiding something?";
  els.countdownNumber.textContent = intervention.remaining;
  els.reflectionInput.value = "";
  els.reflectionHint.textContent = "Countdown and reflection required.";
  els.intervention.className = `intervention intensity-${settings.intensity}`;
  els.intervention.classList.toggle("shake", settings.intensity !== "soft");
  setActionButtons(false);
  playAlarm();
  clearInterval(intervention.timerId);
  intervention.timerId = setInterval(tickIntervention, 1000);
  els.reflectionInput.focus();
}

function tickIntervention() {
  intervention.remaining -= 1;
  els.countdownNumber.textContent = Math.max(0, intervention.remaining);
  if (intervention.remaining <= 0) {
    clearInterval(intervention.timerId);
    intervention.countdownDone = true;
    updateInterventionReadyState();
  }
}

function updateInterventionReadyState() {
  const enoughReflection = els.reflectionInput.value.trim().length >= 10;
  const ready = intervention.countdownDone && enoughReflection;
  setActionButtons(ready);
  els.reflectionHint.textContent = ready
    ? "Nice. Choose what happens next."
    : `${intervention.countdownDone ? "Reflection" : "Countdown and reflection"} required.`;
}

function setActionButtons(enabled) {
  els.takeBack.disabled = !enabled;
  els.openAnyway.disabled = !enabled;
}

function closeIntervention() {
  clearInterval(intervention.timerId);
  els.intervention.classList.add("hidden");
  els.intervention.classList.remove("shake");
}

function takeBack() {
  stats.takeBacks += 1;
  stats.longestStreak = Math.max(stats.longestStreak, session.currentStreak + 1);
  session.currentStreak += 1;
  saveStats();
  closeIntervention();
  updateSessionUI();
}

function openAnyway() {
  stats.openAnyway += 1;
  saveStats();
  closeIntervention();
  els.motivation.textContent = `${intervention.appName} opened anyway. Notice how that choice feels.`;
}

function playAlarm() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || settings.volume <= 0) return;

  const context = new AudioContext();
  const gain = context.createGain();
  const volume = Number(settings.volume) / 100;
  const duration = settings.intensity === "dramatic" ? 1.2 : settings.intensity === "medium" ? 0.8 : 0.45;
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.24), context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
  gain.connect(context.destination);

  [220, 330, 660, 440].forEach((frequency, index) => {
    const osc = context.createOscillator();
    osc.type = index % 2 ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(frequency, context.currentTime + index * 0.08);
    osc.frequency.exponentialRampToValueAtTime(frequency * 1.6, context.currentTime + index * 0.08 + 0.08);
    osc.connect(gain);
    osc.start(context.currentTime + index * 0.08);
    osc.stop(context.currentTime + duration);
  });

  setTimeout(() => context.close(), (duration + 0.2) * 1000);
}

function renderStats() {
  const mostOpened = Object.entries(stats.appOpens).sort((a, b) => b[1] - a[1])[0];
  const score = Math.max(0, Math.min(100, 100 - stats.openAnyway * 12 - stats.totalOpens * 4 + stats.takeBacks * 5 + stats.focusCompletions * 10));
  document.querySelector("#stat-total").textContent = stats.totalOpens;
  document.querySelector("#stat-most").textContent = mostOpened ? `${mostOpened[0]} (${mostOpened[1]})` : "None";
  document.querySelector("#stat-interventions").textContent = stats.interventions;
  document.querySelector("#stat-backs").textContent = stats.takeBacks;
  document.querySelector("#stat-saved").textContent = `${stats.takeBacks * 7} min`;
  document.querySelector("#stat-longest").textContent = stats.longestStreak;
  document.querySelector("#stat-score").textContent = score;
}

function syncSettingsUI() {
  els.intensity.value = settings.intensity;
  els.volume.value = settings.volume;
  els.countdown.value = settings.countdown;
  els.theme.value = settings.theme;
  els.funny.checked = settings.funnyMessages;
  document.body.classList.remove("theme-light", "theme-dark", "theme-pastel");
  document.body.classList.add(`theme-${settings.theme}`);
}

function updateSetting(key, value) {
  settings[key] = value;
  saveSettings();
  syncSettingsUI();
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

els.navButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});

els.startSession.addEventListener("click", () => startSession());

els.durationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    session.selectedMinutes = Number(button.dataset.minutes);
    els.durationButtons.forEach((item) => item.classList.toggle("selected", item === button));
    if (!session.active) updateSessionUI();
  });
});

els.appButtons.forEach((button) => {
  button.addEventListener("click", () => handleAppOpen(button.dataset.app));
});

window.addEventListener("blur", () => handleFocusEscape("another tab or app"));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) handleFocusEscape("another tab or app");
});

els.reflectionInput.addEventListener("input", updateInterventionReadyState);
els.takeBack.addEventListener("click", takeBack);
els.openAnyway.addEventListener("click", openAnyway);
els.focus25.addEventListener("click", () => {
  closeIntervention();
  startSession(25);
});

els.resetStats.addEventListener("click", () => {
  stats = blankStats();
  saveStats();
  renderStats();
});

els.intensity.addEventListener("change", (event) => updateSetting("intensity", event.target.value));
els.volume.addEventListener("input", (event) => updateSetting("volume", Number(event.target.value)));
els.countdown.addEventListener("change", (event) => updateSetting("countdown", Number(event.target.value)));
els.theme.addEventListener("change", (event) => updateSetting("theme", event.target.value));
els.funny.addEventListener("change", (event) => updateSetting("funnyMessages", event.target.checked));

syncSettingsUI();
updateSessionUI();
renderStats();
