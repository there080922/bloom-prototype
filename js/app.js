// ==========================================
// BLOOM — YOUR LITTLE FOCUS CORNER
// app.js
// ==========================================

// ==============================
// DOM ELEMENTS
// ==============================

const pageContent = document.getElementById("pageContent");
const currentPageLabel = document.getElementById("currentPageLabel");
const todayDate = document.getElementById("todayDate");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");
const quickDrawer = document.getElementById("quickDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerTitle = document.getElementById("drawerTitle");
const drawerContent = document.getElementById("drawerContent");
const closeDrawerButton = document.getElementById("closeDrawer");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.getElementById("sidebar");

// ==============================
// APP STATE
// ==============================

let currentPage = "home";
let previousFocus = null;
let activeFilter = "all";
let editingTaskId = null;

const TASK_STORAGE_KEY = "bloomTasks";

const pageNames = {
  home: "Home",
  tasks: "My Tasks",
  focus: "Focus Room",
  music: "Music Corner",
  journal: "My Journal",
  progress: "My Progress",
};

// ==============================
// FOCUS ROOM TIMER
// ==============================

const DEFAULT_FOCUS_MODES = {
  focus: { label: "Focus Time", duration: 25 * 60 },
  short: { label: "Short Break", duration: 5 * 60 },
  long: { label: "Long Break", duration: 15 * 60 },
};

function loadFocusModes() {
  const savedModes = localStorage.getItem("bloomFocusModes");

  if (!savedModes) {
    return structuredClone(DEFAULT_FOCUS_MODES);
  }

  try {
    const parsedModes = JSON.parse(savedModes);

    return {
      focus: {
        ...DEFAULT_FOCUS_MODES.focus,
        duration:
          parsedModes.focus?.duration ?? DEFAULT_FOCUS_MODES.focus.duration,
      },
      short: {
        ...DEFAULT_FOCUS_MODES.short,
        duration:
          parsedModes.short?.duration ?? DEFAULT_FOCUS_MODES.short.duration,
      },
      long: {
        ...DEFAULT_FOCUS_MODES.long,
        duration:
          parsedModes.long?.duration ?? DEFAULT_FOCUS_MODES.long.duration,
      },
    };
  } catch {
    return structuredClone(DEFAULT_FOCUS_MODES);
  }
}

let FOCUS_MODES = loadFocusModes();

let focusMode = "focus";
let timerRemaining = FOCUS_MODES.focus.duration;
let timerRunning = false;
let timerInterval = null;
let timerEndTime = null;
let selectedFocusTask = "";
let focusSessionsCompleted = 0;

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function updateFocusTimerUI() {
  const timerDisplay = document.getElementById("focusTimerDisplay");
  const timerProgress = document.getElementById("focusTimerProgress");
  const timerRing = document.querySelector(".focus-ring-progress");
  const timerStatus = document.getElementById("focusTimerStatus");
  const startButton = document.getElementById("focusStartButton");
  const sessionCount = document.getElementById("focusSessionCount");

  if (!timerDisplay) return;

  timerDisplay.textContent = formatTimer(timerRemaining);
  timerDisplay.setAttribute("aria-label", formatTimer(timerRemaining));

  const totalDuration = FOCUS_MODES[focusMode].duration;

  const progress = totalDuration
    ? ((totalDuration - timerRemaining) / totalDuration) * 100
    : 0;

  if (timerProgress) {
    timerProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
  }

  if (timerRing) {
    const circumference = 2 * Math.PI * 96;

    timerRing.style.strokeDasharray = circumference;
    timerRing.style.strokeDashoffset = circumference * (1 - progress / 100);
  }

  if (timerStatus) {
    if (timerRunning) {
      timerStatus.textContent = "You're doing great. Keep going ✿";
    } else if (timerRemaining === 0) {
      timerStatus.textContent = "Session complete! Take a little breath.";
    } else {
      timerStatus.textContent = "Ready when you are.";
    }
  }

  if (startButton) {
    startButton.textContent = timerRunning ? "Pause" : "Start focus";
  }

  if (sessionCount) {
    sessionCount.textContent = String(focusSessionsCompleted);
  }

  document.title = timerRunning
    ? `${formatTimer(timerRemaining)} · Bloom`
    : "Bloom — Your little focus corner";
}

function selectFocusMode(mode) {
  if (!FOCUS_MODES[mode]) return;

  stopFocusTimer();

  focusMode = mode;
  timerRemaining = FOCUS_MODES[mode].duration;

  document.querySelectorAll("[data-focus-mode]").forEach((button) => {
    const active = button.dataset.focusMode === mode;

    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const modeLabel = document.getElementById("focusModeLabel");

  if (modeLabel) {
    modeLabel.textContent = FOCUS_MODES[mode].label;
  }

  updateFocusTimerUI();
}

function startFocusTimer() {
  if (timerRunning) {
    pauseFocusTimer();
    return;
  }

  if (timerRemaining <= 0) {
    timerRemaining = FOCUS_MODES[focusMode].duration;
  }

  timerRunning = true;
  timerEndTime = Date.now() + timerRemaining * 1000;

  timerInterval = setInterval(() => {
    const millisecondsLeft = timerEndTime - Date.now();

    timerRemaining = Math.max(0, Math.ceil(millisecondsLeft / 1000));

    if (timerRemaining <= 0) {
      timerRemaining = 0;
      stopFocusTimer();

      if (focusMode === "focus") {
        focusSessionsCompleted += 1;
        showToast("Focus session complete! Time for a little break ✿");
      } else {
        showToast("Break complete. Ready when you are ✿");
      }
    }

    updateFocusTimerUI();
  }, 250);

  updateFocusTimerUI();
}

function pauseFocusTimer() {
  if (!timerRunning) return;

  // Simpan sisa waktu sebelum timer dihentikan.
  timerRemaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));

  stopFocusTimer();
  updateFocusTimerUI();
}

function stopFocusTimer() {
  timerRunning = false;

  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerEndTime = null;
}

function resetFocusTimer() {
  stopFocusTimer();
  timerRemaining = FOCUS_MODES[focusMode].duration;
  updateFocusTimerUI();
}

// ==============================
// DATE & HELPER FUNCTIONS
// ==============================

function getTodayDate() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
    .format(new Date())
    .toUpperCase();
}

function updateDate() {
  if (todayDate) {
    todayDate.textContent = getTodayDate();
  }
}

function escapeHTML(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function formatDeadline(value) {
  if (!value) return "No deadline";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

// ==============================
// TOAST NOTIFICATION
// ==============================

function showToast(message) {
  let toast = document.getElementById("bloomToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "bloomToast";
    toast.setAttribute("role", "status");

    toast.style.cssText = [
      "position:fixed",
      "right:24px",
      "bottom:24px",
      "z-index:2000",
      "max-width:min(360px, calc(100vw - 32px))",
      "padding:14px 18px",
      "border-radius:14px",
      "background:var(--text, #343830)",
      "color:var(--surface, #fffdf8)",
      "box-shadow:0 8px 30px #0002",
      "font-size:14px",
    ].join(";");

    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.hidden = false;

  clearTimeout(showToast.timeout);

  showToast.timeout = setTimeout(() => {
    toast.hidden = true;
  }, 2800);
}

// ==============================
// TASK DATA & LOCAL STORAGE
// ==============================

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(TASK_STORAGE_KEY) || "[]");

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

let tasks = loadTasks();

function saveTasks() {
  try {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));

    return true;
  } catch {
    showToast("Couldn't save tasks. Check your browser storage settings.");

    return false;
  }
}

function taskCounts() {
  return {
    total: tasks.length,
    active: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
  };
}

// ==============================
// HOME PAGE
// ==============================

function renderHome() {
  const counts = taskCounts();

  const percentage = counts.total
    ? Math.round((counts.completed / counts.total) * 100)
    : 0;

  const recentTasks = [...tasks]
    .sort((a, b) => Number(a.completed) - Number(b.completed))
    .slice(0, 4);

  return `
    <section class="page-header">
      <p class="eyebrow">A FRESH START, EVERY DAY ✿</p>

      <h1 class="page-title">
        Make room for<br>
        <em>what matters.</em>
      </h1>

      <p class="page-description">
        A little progress each day adds up to beautiful things.
        Let's make today count, gently.
      </p>
    </section>

    <section class="overview" aria-label="Ringkasan tugas">
      <article class="stat-card">
        <span class="stat-icon lavender">☷</span>
        <div>
          <p class="stat-label">Total tasks</p>
          <p class="stat-number">${counts.total}</p>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon pink">◷</span>
        <div>
          <p class="stat-label">In progress</p>
          <p class="stat-number">${counts.active}</p>
        </div>
      </article>

      <article class="stat-card">
        <span class="stat-icon sage">♡</span>
        <div>
          <p class="stat-label">Completed</p>
          <p class="stat-number">${counts.completed}</p>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="card card-muted">
        <div class="progress-heading">
          <div>
            <p class="section-kicker">YOUR LITTLE WINS</p>
            <h2 class="section-title">Daily progress</h2>
          </div>

          <span class="progress-percent">${percentage}%</span>
        </div>

        <div
          class="progress-track"
          role="progressbar"
          aria-label="Progress penyelesaian tugas"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${percentage}"
        >
          <div
            class="progress-fill"
            style="width:${percentage}%"
          ></div>
        </div>

        <p class="muted-text">
          ${
            counts.total
              ? `${counts.completed} of ${counts.total} tasks completed. Keep going at your own pace.`
              : "Your progress will bloom here once you start adding tasks."
          }
        </p>

        <button class="button-primary" data-action="quick-add">
          + Add your first task
        </button>
      </article>

      <article class="card">
        <div class="section-heading">
          <div>
            <p class="section-kicker">A GENTLE REMINDER</p>
            <h2 class="section-title">Today's focus</h2>
          </div>

          <span class="widget-icon">✿</span>
        </div>

        <p class="muted-text">
          You don't have to do everything at once.
          Pick one little thing and begin.
        </p>

        <button class="button-secondary" data-page="focus">
          Open Focus Room →
        </button>
      </article>
    </section>

    <section class="widget-row">
      <article class="card widget-card">
        <div class="widget-top">
          <span class="widget-icon">◷</span>
          <div>
            <h3 class="widget-title">Focus Timer</h3>
            <p class="widget-subtitle">
              Your next little focus session
            </p>
          </div>
        </div>

        <div class="timer-preview" aria-label="Durasi fokus">
          25:00
        </div>

        <button
          class="button-primary button-full"
          data-page="focus"
        >
          Enter Focus Room
        </button>
      </article>

      <article class="card widget-card">
        <div class="widget-top">
          <span class="widget-icon music">♫</span>
          <div>
            <h3 class="widget-title">Music Corner</h3>
            <p class="widget-subtitle">
              Find your focus soundtrack
            </p>
          </div>
        </div>

        <div class="preview-row">
          <span class="music-art">♪</span>
          <div class="preview-copy">
            <strong>Your focus playlist</strong>
            <span>A little music, a little peace.</span>
          </div>
        </div>

        <button
          class="button-secondary button-full"
          data-page="music"
        >
          Explore music →
        </button>
      </article>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">ONE STEP AT A TIME</p>
          <h2 class="section-title">Your tasks</h2>
        </div>

        <button class="text-button" data-page="tasks">
          View all →
        </button>
      </div>

      ${
        recentTasks.length
          ? `
            <div class="task-list">
              ${recentTasks.map((task) => taskRowHTML(task, true)).join("")}
            </div>
          `
          : `
            <div class="empty-state">
              <div class="empty-state-icon">✿</div>
              <h3>A blank canvas</h3>
              <p>
                Your little tasks will appear here.<br>
                Ready to make a fresh start?
              </p>

              <button class="button-primary" data-action="quick-add">
                + Add a task
              </button>
            </div>
          `
      }
    </section>
  `;
}

// ==============================
// TASK ITEM
// ==============================

function taskRowHTML(task, compact = false) {
  const categoryClass = String(task.category || "College").toLowerCase();

  const priorityClass = String(task.priority || "Medium").toLowerCase();

  return `
    <article
      class="task-row ${task.completed ? "task-completed" : ""}"
      data-task-id="${escapeHTML(task.id)}"
    >
      <label
        class="task-check-wrap"
        aria-label="${
          task.completed ? "Mark as active" : "Mark as completed"
        }: ${escapeHTML(task.title)}"
      >
        <input
          type="checkbox"
          data-task-toggle="${escapeHTML(task.id)}"
          ${task.completed ? "checked" : ""}
        >

        <span class="task-check"></span>
      </label>

      <div class="task-row-main">
        <h3 class="task-row-title">
          ${escapeHTML(task.title)}
        </h3>

        ${
          task.description && !compact
            ? `<p class="task-description">${escapeHTML(task.description)}</p>`
            : ""
        }

        <div class="task-meta">
          <span class="task-tag category-${categoryClass}">
            ${escapeHTML(task.category || "College")}
          </span>

          <span class="task-tag priority-${priorityClass}">
            ${escapeHTML(task.priority || "Medium")} priority
          </span>

          ${
            task.deadline
              ? `<span class="task-deadline">Due ${escapeHTML(formatDeadline(task.deadline))}</span>`
              : ""
          }
        </div>
      </div>

      <div class="task-actions">
        <button
          class="icon-button"
          type="button"
          data-edit-task="${escapeHTML(task.id)}"
          aria-label="Edit ${escapeHTML(task.title)}"
          title="Edit task"
        >✎</button>

        <button
          class="icon-button"
          type="button"
          data-delete-task="${escapeHTML(task.id)}"
          aria-label="Delete ${escapeHTML(task.title)}"
          title="Delete task"
        >×</button>
      </div>
    </article>
  `;
}

// ==============================
// MY TASKS PAGE
// ==============================

function renderTasks() {
  const visibleTasks = tasks.filter((task) => {
    if (activeFilter === "active") {
      return !task.completed;
    }

    if (activeFilter === "completed") {
      return task.completed;
    }

    return true;
  });

  const counts = taskCounts();

  return `
    <section class="page-header">
      <p class="eyebrow">MAKE SPACE FOR WHAT MATTERS ✿</p>

      <h1 class="page-title">
        Your tasks,<br>
        <em>your pace.</em>
      </h1>

      <p class="page-description">
        A little organization can make room for a little more peace.
      </p>
    </section>

    <section class="card tasks-panel">
      <div class="section-heading task-panel-heading">
        <div>
          <p class="section-kicker">YOUR LITTLE TO-DO LIST</p>
          <h2 class="section-title">
            Task space <span class="task-total">(${counts.total})</span>
          </h2>
        </div>

        <button class="button-primary" data-action="quick-add">
          + Add task
        </button>
      </div>

      <div class="task-filters" role="group" aria-label="Filter tasks">
        <button
          class="filter-button ${activeFilter === "all" ? "active" : ""}"
          data-filter="all"
        >
          All <span>${counts.total}</span>
        </button>

        <button
          class="filter-button ${activeFilter === "active" ? "active" : ""}"
          data-filter="active"
        >
          Active <span>${counts.active}</span>
        </button>

        <button
          class="filter-button ${activeFilter === "completed" ? "active" : ""}"
          data-filter="completed"
        >
          Completed <span>${counts.completed}</span>
        </button>
      </div>

      ${
        visibleTasks.length
          ? `
            <div class="task-list">
              ${visibleTasks.map((task) => taskRowHTML(task)).join("")}
            </div>
          `
          : `
            <div class="empty-state">
              <div class="empty-state-icon">✿</div>

              <h3>
                ${
                  activeFilter === "completed"
                    ? "No completed tasks yet"
                    : activeFilter === "active"
                      ? "You're all caught up"
                      : "A blank canvas"
                }
              </h3>

              <p>
                ${
                  activeFilter === "completed"
                    ? "Your finished tasks will bloom here."
                    : activeFilter === "active"
                      ? "Take a breath. You can add another task whenever you're ready."
                      : "Add your first little task and take it one step at a time."
                }
              </p>

              ${
                activeFilter !== "completed"
                  ? `
                    <button class="button-primary" data-action="quick-add">
                      + Add a task
                    </button>
                  `
                  : ""
              }
            </div>
          `
      }
    </section>
  `;
}

// ==============================
// FOCUS ROOM PAGE
// ==============================

function renderFocusRoom() {
  const activeTasks = tasks.filter((task) => !task.completed);

  const selectedTaskStillExists = activeTasks.some(
    (task) => task.id === selectedFocusTask,
  );

  if (!selectedTaskStillExists) {
    selectedFocusTask = "";
  }

  const totalDuration = FOCUS_MODES[focusMode].duration;

  const progress = totalDuration
    ? ((totalDuration - timerRemaining) / totalDuration) * 100
    : 0;

  return `
    <section class="page-header">
      <p class="eyebrow">SLOW DOWN TO FOCUS ✿</p>

      <h1 class="page-title">
        Find your<br>
        <em>flow.</em>
      </h1>

      <p class="page-description">
        One task, one session, one little win at a time.
      </p>
    </section>

    <section class="focus-layout">
      <article class="card focus-main-card">
        <p class="section-kicker">YOUR LITTLE FOCUS SPACE</p>

        <div class="focus-mode-tabs" role="group" aria-label="Timer mode">
          <button
            type="button"
            class="focus-mode-button ${focusMode === "focus" ? "active" : ""}"
            data-focus-mode="focus"
            aria-pressed="${focusMode === "focus"}"
          >
            Focus
          </button>

          <button
            type="button"
            class="focus-mode-button ${focusMode === "short" ? "active" : ""}"
            data-focus-mode="short"
            aria-pressed="${focusMode === "short"}"
          >
            Short break
          </button>

          <button
            type="button"
            class="focus-mode-button ${focusMode === "long" ? "active" : ""}"
            data-focus-mode="long"
            aria-pressed="${focusMode === "long"}"
          >
            Long break
          </button>
        </div>

        <p id="focusModeLabel" class="focus-mode-label">
          ${FOCUS_MODES[focusMode].label}
        </p>

        <div class="focus-timer-wrap">
          <div class="focus-timer-ring">
            <svg
              class="focus-timer-svg"
              viewBox="0 0 220 220"
              aria-hidden="true"
            >
              <circle
                class="focus-ring-background"
                cx="110"
                cy="110"
                r="96"
              />

              <circle
                class="focus-ring-progress"
                cx="110"
                cy="110"
                r="96"
                style="
                  stroke-dasharray:603.19;
                  stroke-dashoffset:${603.19 * (1 - progress / 100)};
                "
              />
            </svg>

            <div class="focus-timer-center">
              <span class="focus-timer-flower">✿</span>

              <strong id="focusTimerDisplay" aria-live="off">
                ${formatTimer(timerRemaining)}
              </strong>

              <span id="focusTimerStatus" class="focus-timer-status">
                ${
                  timerRunning
                    ? "You're doing great. Keep going ✿"
                    : timerRemaining === 0
                      ? "Session complete! Take a little breath."
                      : "Ready when you are."
                }
              </span>
            </div>
          </div>
        </div>

        <div class="focus-progress-track">
          <div
            id="focusTimerProgress"
            class="focus-progress-fill"
            style="width:${progress}%"
          ></div>
        </div>

        <div class="focus-controls">
          <button
            id="focusResetButton"
            class="button-secondary"
            type="button"
          >
            ↺ Reset
          </button>

          <button
            id="focusStartButton"
            class="button-primary focus-start-button"
            type="button"
          >
            ${timerRunning ? "Pause" : "Start focus"}
          </button>
        </div>

                <p class="focus-encouragement">
          Remember to breathe. You're doing enough. ♡
        </p>
      </article>

      <!-- CUSTOMIZE TIMER: BAGIAN BARU -->
      <article class="card focus-settings">
        <div class="focus-settings-header">
          <div>
            <h2 class="section-title">Customize Timer</h2>
            <p class="muted-text">
              Make your focus time feel right for you.
            </p>
          </div>
          <span>⚙️</span>
        </div>

        <div class="focus-settings-grid">
          <label>
            <span>Focus Time (minutes)</span>
            <input
              type="number"
              id="customFocusMinutes"
              min="1"
              max="90"
              value="${FOCUS_MODES.focus.duration / 60}"
            />
          </label>

          <label>
            <span>Short Break (minutes)</span>
            <input
              type="number"
              id="customShortMinutes"
              min="1"
              max="30"
              value="${FOCUS_MODES.short.duration / 60}"
            />
          </label>

          <label>
            <span>Long Break (minutes)</span>
            <input
              type="number"
              id="customLongMinutes"
              min="1"
              max="60"
              value="${FOCUS_MODES.long.duration / 60}"
            />
          </label>
        </div>

        <button
          type="button"
          id="saveFocusSettingsButton"
          class="button-primary"
        >
          Save Settings
        </button>

        <p
          class="muted-text focus-settings-note"
          id="focusSettingsMessage"
        >
          Customize your session, then save your settings.
        </p>
      </article>
      <!-- AKHIR CUSTOMIZE TIMER -->

      <aside class="focus-side-column"> 
    </section>
  `;
}

function saveFocusSettings() {
  const focusInput = document.getElementById("customFocusMinutes");
  const shortInput = document.getElementById("customShortMinutes");
  const longInput = document.getElementById("customLongMinutes");
  const message = document.getElementById("focusSettingsMessage");

  if (!focusInput || !shortInput || !longInput || !message) return;

  const focusMinutes = Number(focusInput.value);
  const shortMinutes = Number(shortInput.value);
  const longMinutes = Number(longInput.value);

  if (
    !Number.isInteger(focusMinutes) ||
    !Number.isInteger(shortMinutes) ||
    !Number.isInteger(longMinutes) ||
    focusMinutes < 1 ||
    focusMinutes > 90 ||
    shortMinutes < 1 ||
    shortMinutes > 30 ||
    longMinutes < 1 ||
    longMinutes > 60
  ) {
    message.textContent =
      "Please enter valid whole minutes within the allowed ranges.";
    return;
  }

  FOCUS_MODES.focus.duration = focusMinutes * 60;
  FOCUS_MODES.short.duration = shortMinutes * 60;
  FOCUS_MODES.long.duration = longMinutes * 60;

  localStorage.setItem("bloomFocusModes", JSON.stringify(FOCUS_MODES));

  message.textContent =
    "Settings saved! Your new durations will apply to the next timer session.";
}

/* ==============================
   BLOOM MUSIC CORNER
============================== */

const MUSIC_TRACKS = {
  focus: {
    title: "DINOSAUR",
    artist: "AKMU",
    description: "A little adventure for your day.",
    file: "assets/music/dinosaur.mp3",
    icon: "🦕",
  },

  relax: {
    title: "How Can I Love the Heartbreak",
    artist: "AKMU",
    description: "어떻게 이별까지 사랑하겠어 널 사랑하는 거지",
    file: "assets/music/how-can-i-love-the-heartbreak.mp3",
    icon: "🌷",
  },

  rainy: {
    title: "Don't Know What To Do",
    artist: "BLACKPINK",
    description: "A song for your little moments.",
    file: "assets/music/dont-know-what-to-do.mp3",
    icon: "🌧️",
  },
};

let selectedMusicMood = "focus";
let musicVolume = 0.7;

function formatMusicTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function renderMusicCorner() {
  const track = MUSIC_TRACKS[selectedMusicMood];

  return `
    <section class="page-header">
      <p class="eyebrow">A LITTLE MUSIC BREAK ✿</p>
      <h1 class="page-title">Find your<br><em>rhythm.</em></h1>
      <p class="page-description">
        A soft soundtrack for wherever your day takes you.
      </p>
    </section>

    <section class="music-layout">
      <article class="card music-player-card">
        <div class="music-artwork">
          <span class="music-artwork-main" id="musicArtworkIcon">
            ${track.icon}
          </span>
          <span class="music-artwork-decoration">✿</span>
        </div>

        <p class="section-kicker">NOW PLAYING</p>

        <h2 class="music-track-title" id="musicTrackTitle">
  ${track.title}
</h2>

<p class="music-track-artist" id="musicTrackArtist">
  ${track.artist}
</p>

        <p class="muted-text" id="musicTrackDescription">
          ${track.description}
        </p>

        <audio
          id="musicAudio"
          preload="metadata"
          src="${track.file}"
        ></audio>

        <div class="music-progress-section">
          <input
            type="range"
            id="musicProgress"
            class="music-range"
            min="0"
            max="100"
            step="0.1"
            value="0"
            aria-label="Music progress"
          />

          <div class="music-time-row">
            <span id="musicCurrentTime">0:00</span>
            <span id="musicDuration">0:00</span>
          </div>
        </div>

        <div class="music-controls">
          <button
            type="button"
            id="musicPlayButton"
            class="button-primary music-play-button"
          >
            ▶ Play
          </button>
        </div>

        <div class="music-volume">
          <label for="musicVolume">Volume</label>

          <input
            type="range"
            id="musicVolume"
            class="music-range"
            min="0"
            max="1"
            step="0.05"
            value="${musicVolume}"
          />

          <span id="musicVolumeValue">
            ${Math.round(musicVolume * 100)}%
          </span>
        </div>

        <p
          class="muted-text music-message"
          id="musicMessage"
          aria-live="polite"
        >
          Choose a mood and press play when you're ready.
        </p>
      </article>

      <aside class="music-moods-column">
        <article class="card">
          <p class="section-kicker">SET THE MOOD</p>
          <h2 class="section-title">What feels right?</h2>

          <div class="music-mood-list">
            ${Object.entries(MUSIC_TRACKS)
              .map(
                ([key, item]) => `
              <button
                type="button"
                class="music-mood-button ${
                  selectedMusicMood === key ? "active" : ""
                }"
                data-music-mood="${key}"
                aria-pressed="${selectedMusicMood === key}"
              >
                <span class="music-mood-icon">${item.icon}</span>

                <span class="music-mood-text">
                  <strong>${item.title}</strong>
                  <small>${item.description}</small>
                </span>

                <span class="music-mood-arrow">↗</span>
              </button>
            `,
              )
              .join("")}
          </div>
        </article>

        <article class="card card-muted music-tip-card">
          <span class="focus-side-icon">♡</span>
          <h3>A gentle reminder</h3>
          <p>
            You don't have to be productive every minute.
            It's okay to pause, listen, and simply be.
          </p>
        </article>
      </aside>
    </section>
  `;
}

function bindMusicAudioEvents() {
  const audio = document.getElementById("musicAudio");

  if (!audio || audio.dataset.eventsBound === "true") return;

  audio.dataset.eventsBound = "true";
  audio.volume = musicVolume;

  audio.addEventListener("timeupdate", updateMusicPlayerUI);
  audio.addEventListener("loadedmetadata", updateMusicPlayerUI);
  audio.addEventListener("durationchange", updateMusicPlayerUI);

  audio.addEventListener("play", () => {
    updateMusicPlayerUI();

    const message = document.getElementById("musicMessage");
    if (message) {
      message.textContent = "Enjoy your little music break. ♡";
    }
  });

  audio.addEventListener("pause", updateMusicPlayerUI);

  audio.addEventListener("ended", () => {
    updateMusicPlayerUI();

    const message = document.getElementById("musicMessage");
    if (message) {
      message.textContent = "Track complete. Take a little breath. ♡";
    }
  });

  audio.addEventListener("error", () => {
    const message = document.getElementById("musicMessage");

    if (message) {
      message.textContent =
        "Audio couldn't be loaded. Check the file name and folder.";
    }
  });

  updateMusicPlayerUI();
}

function updateMusicPlayerUI() {
  const audio = document.getElementById("musicAudio");
  if (!audio) return;

  const progress = document.getElementById("musicProgress");
  const currentTime = document.getElementById("musicCurrentTime");
  const duration = document.getElementById("musicDuration");
  const playButton = document.getElementById("musicPlayButton");

  if (progress) {
    progress.value = audio.duration
      ? (audio.currentTime / audio.duration) * 100
      : 0;
  }

  if (currentTime) {
    currentTime.textContent = formatMusicTime(audio.currentTime);
  }

  if (duration) {
    duration.textContent = formatMusicTime(audio.duration);
  }

  if (playButton) {
    playButton.textContent = audio.paused ? "▶ Play" : "Ⅱ Pause";
  }
}

async function toggleMusicPlayback() {
  const audio = document.getElementById("musicAudio");
  const message = document.getElementById("musicMessage");

  if (!audio) return;

  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      if (message) {
        message.textContent =
          "Couldn't play the audio. Check that the music file exists.";
      }
    }
  } else {
    audio.pause();

    if (message) {
      message.textContent = "Paused. Take your time. ♡";
    }
  }

  updateMusicPlayerUI();
}

function selectMusicMood(mood) {
  if (!MUSIC_TRACKS[mood]) return;

  const oldAudio = document.getElementById("musicAudio");
  const wasPlaying = oldAudio && !oldAudio.paused;

  if (oldAudio) oldAudio.pause();

  selectedMusicMood = mood;
  renderPage("music");

  const newAudio = document.getElementById("musicAudio");
  if (!newAudio) return;

  newAudio.volume = musicVolume;

  if (wasPlaying) {
    newAudio.play().catch(() => {
      const message = document.getElementById("musicMessage");

      if (message) {
        message.textContent = "Press Play to start this track.";
      }
    });
  }
}

function seekMusic(value) {
  const audio = document.getElementById("musicAudio");

  if (!audio || !Number.isFinite(audio.duration)) return;

  audio.currentTime = (Number(value) / 100) * audio.duration;
}

function changeMusicVolume(value) {
  musicVolume = Math.min(1, Math.max(0, Number(value)));

  const audio = document.getElementById("musicAudio");
  const volumeValue = document.getElementById("musicVolumeValue");

  if (audio) audio.volume = musicVolume;

  if (volumeValue) {
    volumeValue.textContent = `${Math.round(musicVolume * 100)}%`;
  }
}

function renderProgress() {
  // Ambil data terbaru dari localStorage
  let savedTasks = [];

  try {
    const stored = JSON.parse(localStorage.getItem("bloomTasks") || "[]");

    savedTasks = Array.isArray(stored) ? stored : [];
  } catch {
    savedTasks = [];
  }

  const total = savedTasks.length;
  const completed = savedTasks.filter((task) => task.completed).length;
  const active = total - completed;

  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const categories = ["College", "Personal", "Projects"];

  const categoryStats = categories.map((category) => {
    const categoryTasks = savedTasks.filter(
      (task) => task.category === category,
    );

    const categoryCompleted = categoryTasks.filter(
      (task) => task.completed,
    ).length;

    return {
      name: category,
      total: categoryTasks.length,
      completed: categoryCompleted,
      percentage: categoryTasks.length
        ? Math.round((categoryCompleted / categoryTasks.length) * 100)
        : 0,
    };
  });

  return `
    <section class="page-header">
      <p class="eyebrow">CELEBRATE YOUR LITTLE WINS ✿</p>

      <h1 class="page-title">
        Look how far<br>
        <em>you've come.</em>
      </h1>

      <p class="page-description">
        Every little step counts. Take a moment to see
        how much you've accomplished.
      </p>
    </section>

    <section class="progress-stats-grid">

      <article class="card progress-stat-card">
        <span class="progress-stat-icon">☷</span>
        <p class="progress-stat-label">Total tasks</p>
        <h2>${total}</h2>
        <p class="muted-text">All your little plans</p>
      </article>

      <article class="card progress-stat-card">
        <span class="progress-stat-icon">♡</span>
        <p class="progress-stat-label">Completed</p>
        <h2>${completed}</h2>
        <p class="muted-text">Little wins achieved</p>
      </article>

      <article class="card progress-stat-card">
        <span class="progress-stat-icon">◷</span>
        <p class="progress-stat-label">In progress</p>
        <h2>${active}</h2>
        <p class="muted-text">Still on your list</p>
      </article>

    </section>

    <section class="card progress-overview-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">YOUR LITTLE WINS</p>
          <h2 class="section-title">Task completion</h2>
        </div>

        <span class="progress-percent">${percentage}%</span>
      </div>

      <div
        class="progress-track"
        role="progressbar"
        aria-label="Task completion"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${percentage}"
      >
        <div
          class="progress-fill"
          style="width: ${percentage}%"
        ></div>
      </div>

      <p class="muted-text progress-summary">
        ${
          total === 0
            ? "Your progress will bloom when you add your first task."
            : completed === total
              ? "Wonderful! You've completed every task on your list. ♡"
              : `You've completed ${completed} of ${total} tasks. Keep going at your own pace.`
        }
      </p>
    </section>

    <section class="card progress-category-card">
      <div class="section-heading">
        <div>
          <p class="section-kicker">ONE STEP AT A TIME</p>
          <h2 class="section-title">Progress by category</h2>
        </div>

        <span class="widget-icon">✿</span>
      </div>

      <div class="progress-category-list">
        ${categoryStats
          .map(
            (category) => `
          <div class="progress-category-item">
            <div class="progress-category-heading">
              <strong>${category.name}</strong>
              <span>
                ${category.completed}/${category.total} completed
              </span>
            </div>

            <div
              class="progress-track"
              role="progressbar"
              aria-label="${category.name} completion"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow="${category.percentage}"
            >
              <div
                class="progress-fill"
                style="width: ${category.percentage}%"
              ></div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>

      <button
        type="button"
        class="button-secondary"
        data-page="tasks"
      >
        View my tasks →
      </button>
    </section>
  `;
}

// ==============================
// PLACEHOLDER PAGES
// ==============================

const JOURNAL_STORAGE_KEY = "bloomJournalEntries";

let journalEntries = JSON.parse(
  localStorage.getItem(JOURNAL_STORAGE_KEY) || "[]",
);

let selectedJournalMood = "😊";
let selectedJournalType = "daily";
let editingJournalId = null;

const JOURNAL_MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😔", label: "Sad" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😴", label: "Tired" },
];

function saveJournalEntries() {
  localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries));
}

function formatJournalDate(dateString) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderJournal() {
  const today = new Date().toISOString().slice(0, 10);

  const todaysEntries = journalEntries.filter(
    (entry) => entry.date === today,
  ).length;

  const sortedEntries = [...journalEntries].sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );

  return `
    <section class="journal-page">
      <header class="journal-header">
        <div>
          <p class="journal-eyebrow">YOUR LITTLE CORNER</p>
          <h1 class="journal-heading">My Journal <span>♡</span></h1>
          <p class="journal-subtitle">
            A safe space for all the things you feel.
          </p>
        </div>

        <div class="journal-today-card">
          <span>✿</span>
          <p>${todaysEntries} ${todaysEntries === 1 ? "entry" : "entries"}</p>
          <small>written today</small>
        </div>
      </header>

      <div class="journal-layout">
        <section class="journal-editor-card">
          <div class="journal-card-heading">
            <div>
              <p class="journal-eyebrow">LET IT OUT</p>
              <h2 id="journalFormHeading">How are you feeling?</h2>
            </div>
            <span class="journal-flower">✿</span>
          </div>

          <div class="journal-type-tabs">
            <button
              type="button"
              class="journal-type-button ${selectedJournalType === "daily" ? "active" : ""}"
              data-journal-type="daily"
            >
              📖 Daily Journal
            </button>

            <button
              type="button"
              class="journal-type-button ${selectedJournalType === "brain" ? "active" : ""}"
              data-journal-type="brain"
            >
              ☁️ Brain Dump
            </button>
          </div>

          <form id="journalForm">
            <input
              type="hidden"
              id="journalEntryId"
              value="${editingJournalId || ""}"
            />

            <label class="journal-label" for="journalTitle">
              Give your thoughts a title
            </label>

            <input
              class="journal-input"
              id="journalTitle"
              type="text"
              maxlength="100"
              placeholder="A little note to myself..."
              required
            />

            <div class="journal-mood-section">
              <p class="journal-label">How do you feel today?</p>

              <div class="journal-mood-options">
                ${JOURNAL_MOODS.map(
                  (mood) => `
                  <button
                    type="button"
                    class="journal-mood-button ${selectedJournalMood === mood.emoji ? "active" : ""}"
                    data-journal-mood="${mood.emoji}"
                    title="${mood.label}"
                    aria-label="${mood.label}"
                    aria-pressed="${selectedJournalMood === mood.emoji}"
                  >
                    <span>${mood.emoji}</span>
                    <small>${mood.label}</small>
                  </button>
                `,
                ).join("")}
              </div>
            </div>

            <label class="journal-label" for="journalContent">
              ${
                selectedJournalType === "daily"
                  ? "What's on your heart?"
                  : "Let your thoughts flow freely..."
              }
            </label>

            <textarea
              class="journal-textarea"
              id="journalContent"
              rows="7"
              placeholder="${
                selectedJournalType === "daily"
                  ? "Today, I'm feeling..."
                  : "Everything on your mind, big or small. No judgment here..."
              }"
              required
            ></textarea>

            <p class="journal-gentle-note">
              ♡ You don't have to have it all figured out.
            </p>

            <div class="journal-form-actions">
              <button
                type="button"
                class="journal-cancel-button"
                id="journalCancelButton"
                ${editingJournalId === null ? "hidden" : ""}
              >
                Cancel
              </button>

              <button type="submit" class="journal-save-button">
                ${editingJournalId === null ? "♡ Save my thoughts" : "♡ Update entry"}
              </button>
            </div>
          </form>
        </section>

        <section class="journal-history-section">
          <div class="journal-history-heading">
            <div>
              <p class="journal-eyebrow">LITTLE MOMENTS</p>
              <h2>Your journal entries</h2>
            </div>
            <span>${journalEntries.length} total</span>
          </div>

          ${
            sortedEntries.length === 0
              ? `
                <div class="journal-empty-state">
                  <span>🌷</span>
                  <h3>Your story starts here</h3>
                  <p>
                    Your first entry doesn't need to be perfect.
                    Just start wherever you are.
                  </p>
                </div>
              `
              : `
                <div class="journal-entry-list">
                  ${sortedEntries
                    .map(
                      (entry) => `
                    <article class="journal-entry-card">
                      <div class="journal-entry-top">
                        <span class="journal-entry-mood">${entry.mood}</span>
                        <span class="journal-entry-date">
                          ${formatJournalDate(entry.date)}
                        </span>
                      </div>

                      <span class="journal-entry-type">
                        ${entry.type === "brain" ? "☁️ BRAIN DUMP" : "📖 DAILY JOURNAL"}
                      </span>

                      <h3>${escapeJournalText(entry.title)}</h3>

                      <p class="journal-entry-content">
                        ${escapeJournalText(entry.content)}
                      </p>

                      <div class="journal-entry-actions">
                        <button
                          type="button"
                          data-journal-edit="${entry.id}"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          data-journal-delete="${entry.id}"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  `,
                    )
                    .join("")}
                </div>
              `
          }
        </section>
      </div>

      <footer class="journal-footer">
        TAKE A BREATH. YOU'RE ALLOWED TO FEEL EVERYTHING ♡
      </footer>
    </section>
  `;
}

function escapeJournalText(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character],
  );
}

function resetJournalForm() {
  editingJournalId = null;
  selectedJournalMood = "😊";
  selectedJournalType = "daily";
  renderPage("journal");
}

function handleJournalSubmit(event) {
  if (event.target.id !== "journalForm") return;

  event.preventDefault();

  const title = document.getElementById("journalTitle").value.trim();
  const content = document.getElementById("journalContent").value.trim();

  if (!title || !content) return;

  const now = Date.now();
  const existingEntry = journalEntries.find(
    (entry) => entry.id === editingJournalId,
  );

  if (existingEntry) {
    journalEntries = journalEntries.map((entry) =>
      entry.id === editingJournalId
        ? {
            ...entry,
            title,
            content,
            mood: selectedJournalMood,
            type: selectedJournalType,
            updatedAt: now,
          }
        : entry,
    );
  } else {
    journalEntries.unshift({
      id: String(now) + Math.random().toString(16).slice(2),
      title,
      content,
      mood: selectedJournalMood,
      type: selectedJournalType,
      date: new Date().toISOString().slice(0, 10),
      updatedAt: now,
    });
  }

  saveJournalEntries();
  resetJournalForm();
}

function refreshJournalPreservingDraft() {
  const title = document.getElementById("journalTitle")?.value || "";
  const content = document.getElementById("journalContent")?.value || "";

  renderPage("journal");

  document.getElementById("journalTitle").value = title;
  document.getElementById("journalContent").value = content;
}

function handleJournalClick(event) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const typeButton = target.closest("[data-journal-type]");

  if (typeButton) {
    selectedJournalType = typeButton.dataset.journalType;
    refreshJournalPreservingDraft();
    return;
  }

  const moodButton = target.closest("[data-journal-mood]");

  if (moodButton) {
    selectedJournalMood = moodButton.dataset.journalMood;
    refreshJournalPreservingDraft();
    return;
  }

  const editButton = target.closest("[data-journal-edit]");

  if (editButton) {
    const entry = journalEntries.find(
      (item) => item.id === editButton.dataset.journalEdit,
    );

    if (!entry) return;

    editingJournalId = entry.id;
    selectedJournalMood = entry.mood;
    selectedJournalType = entry.type;
    renderPage("journal");

    document.getElementById("journalTitle").value = entry.title;
    document.getElementById("journalContent").value = entry.content;

    document.getElementById("journalFormHeading").textContent =
      "Edit your thoughts";

    document.getElementById("journalForm").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    return;
  }

  const deleteButton = target.closest("[data-journal-delete]");

  if (deleteButton) {
    const entryId = deleteButton.dataset.journalDelete;

    if (!confirm("Are you sure you want to delete this journal entry?")) {
      return;
    }

    journalEntries = journalEntries.filter((entry) => entry.id !== entryId);

    saveJournalEntries();

    if (editingJournalId === entryId) {
      editingJournalId = null;
    }

    renderPage("journal");
    return;
  }

  if (target.closest("#journalCancelButton")) {
    resetJournalForm();
  }
}

document.addEventListener("submit", handleJournalSubmit);
document.addEventListener("click", handleJournalClick);

function renderPlaceholder(page) {
  const content = {
    music: {
      eyebrow: "SET THE MOOD",
      title: "Press play,",
      accent: "find peace.",
      description: "A little soundtrack for whatever today brings.",
      icon: "♫",
      heading: "Your Music Corner",
      body: "Your local audio tracks, playlist controls, and ambient sounds will be available here.",
    },

    journal: {
      eyebrow: "A SPACE JUST FOR YOU",
      title: "Let it out,",
      accent: "gently.",
      description:
        "A place for your thoughts, little moments, and everything in between.",
      icon: "▤",
      heading: "Your personal journal",
      body: "Daily reflections, mood check-ins, and brain dumps will live here.",
    },

    progress: {
      eyebrow: "CELEBRATE YOUR LITTLE WINS",
      title: "Look how far",
      accent: "you've come.",
      description: "Progress doesn't have to be perfect to be meaningful.",
      icon: "↗",
      heading: "Your progress",
      body: "Your completed tasks, focus sessions, and weekly activity will appear here.",
    },
  };

  const item = content[page];

  if (!item) return "";

  return `
    <section class="page-header">
      <p class="eyebrow">${item.eyebrow} ✿</p>

      <h1 class="page-title">
        ${item.title}<br>
        <em>${item.accent}</em>
      </h1>

      <p class="page-description">
        ${item.description}
      </p>
    </section>

    <section class="placeholder-grid">
      <article class="card placeholder-card">
        <span class="placeholder-icon">${item.icon}</span>
        <h3>${item.heading}</h3>
        <p>${item.body}</p>

        <button class="button-secondary" data-page="home">
          Back to Home
        </button>
      </article>

      <article class="card card-muted placeholder-card">
        <span class="placeholder-icon">✿</span>
        <h3>Growing, one step at a time</h3>
        <p>
          We're building this little space one feature at a time.
          Everything will come together soon.
        </p>
      </article>
    </section>
  `;
}

/* ==============================
   BLOOM SPOTIFY MUSIC CORNER
============================== */

const BLOOM_SPOTIFY_STORAGE = "bloomSpotifyPlaylist";

function getSavedSpotifyPlaylist() {
  try {
    return localStorage.getItem(BLOOM_SPOTIFY_STORAGE) || "";
  } catch {
    return "";
  }
}

function getSpotifyPlaylistEmbedUrl(link) {
  try {
    const url = new URL(link.trim());

    // Hanya menerima link playlist Spotify resmi
    if (
      url.hostname !== "open.spotify.com" ||
      !/^\/playlist\/[a-zA-Z0-9]+\/?$/.test(url.pathname)
    ) {
      return null;
    }

    const playlistId = url.pathname.split("/").filter(Boolean)[1];

    return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}

function renderSpotifyMusicCorner() {
  const savedPlaylist = getSavedSpotifyPlaylist();
  const embedUrl = savedPlaylist
    ? getSpotifyPlaylistEmbedUrl(savedPlaylist)
    : null;

  return `
    <section class="page-header">
      <p class="eyebrow">A LITTLE MUSIC BREAK ✿</p>

      <h1 class="page-title">
        Find your<br>
        <em>rhythm.</em>
      </h1>

      <p class="page-description">
        Your favorite songs, your playlist, your little moment.
      </p>
    </section>

    <section class="spotify-music-layout">

      <article class="card spotify-search-card">
        <p class="section-kicker">DISCOVER YOUR SOUND</p>
        <h2 class="section-title">Find a song ♫</h2>

        <p class="muted-text">
          Search for a song, artist, or album on Spotify.
        </p>

        <form id="bloomSpotifySearchForm" class="spotify-search-form">
          <input
            type="search"
            id="bloomSpotifySearchInput"
            placeholder="Try a song or artist..."
            aria-label="Search Spotify"
            required
          >

          <button type="submit" class="button-primary">
            Search Spotify
          </button>
        </form>

        <p class="muted-text spotify-helper">
          Your search results will open on Spotify.
        </p>
      </article>

      <article class="card spotify-playlist-card">
        <p class="section-kicker">YOUR PERSONAL SOUNDTRACK</p>
        <h2 class="section-title">My Spotify Playlist ♡</h2>

        <p class="muted-text">
          Add your own Spotify playlist and keep it in Bloom.
        </p>

        <form id="bloomSpotifyPlaylistForm" class="spotify-playlist-form">
          <label for="bloomSpotifyPlaylistInput">
            Spotify playlist link
          </label>

          <input
            type="url"
            id="bloomSpotifyPlaylistInput"
            placeholder="https://open.spotify.com/playlist/..."
            value="${savedPlaylist.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")}"
            required
          >

          <div class="spotify-playlist-actions">
            <button type="submit" class="button-primary">
              Save Playlist
            </button>

            <button
              type="button"
              id="bloomSpotifyRemoveButton"
              class="button-secondary"
              ${savedPlaylist ? "" : "disabled"}
            >
              Remove
            </button>
          </div>
        </form>

        <p
          id="bloomSpotifyMessage"
          class="muted-text spotify-helper"
          aria-live="polite"
        >
          ${
            embedUrl
              ? "Your playlist is ready. Enjoy your little music break. ♡"
              : "Paste your playlist link to get started. ✿"
          }
        </p>

        <div class="spotify-embed-container" id="bloomSpotifyEmbed">
          ${
            embedUrl
              ? `
                <iframe
                  src="${embedUrl}"
                  title="My Spotify Playlist"
                  width="100%"
                  height="352"
                  style="border: 0; border-radius: 12px;"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                ></iframe>
              `
              : `
                <div class="spotify-empty-state">
                  <span>♫</span>
                  <p>Your playlist will appear here.</p>
                </div>
              `
          }
        </div>

        <a
          class="spotify-open-link"
          href="${embedUrl ? savedPlaylist.replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "https://open.spotify.com/"}"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Spotify ↗
        </a>
      </article>

      <article class="card card-muted spotify-tip-card">
        <span class="focus-side-icon">♡</span>
        <h3>A gentle reminder</h3>
        <p>
          You don't have to be productive every minute.
          It's okay to pause, listen, and simply be.
        </p>
      </article>

    </section>
  `;
}

function bindSpotifyMusicEvents() {
  const searchForm = document.getElementById("bloomSpotifySearchForm");

  const searchInput = document.getElementById("bloomSpotifySearchInput");

  const playlistForm = document.getElementById("bloomSpotifyPlaylistForm");

  const playlistInput = document.getElementById("bloomSpotifyPlaylistInput");

  const removeButton = document.getElementById("bloomSpotifyRemoveButton");

  const message = document.getElementById("bloomSpotifyMessage");

  if (
    !searchForm ||
    !searchInput ||
    !playlistForm ||
    !playlistInput ||
    !removeButton
  ) {
    return;
  }

  // SEARCH SPOTIFY
  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = searchInput.value.trim();

    if (!query) return;

    const searchUrl =
      "https://open.spotify.com/search/" + encodeURIComponent(query);

    window.open(searchUrl, "_blank", "noopener,noreferrer");
  });

  // SAVE PLAYLIST
  playlistForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const link = playlistInput.value.trim();
    const embedUrl = getSpotifyPlaylistEmbedUrl(link);

    if (!embedUrl) {
      if (message) {
        message.textContent = "Please enter a valid Spotify playlist link.";
      }

      return;
    }

    try {
      localStorage.setItem(BLOOM_SPOTIFY_STORAGE, link);
      renderPage("music");
    } catch {
      if (message) {
        message.textContent = "Couldn't save the playlist in this browser.";
      }
    }
  });

  // REMOVE SAVED PLAYLIST
  removeButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(BLOOM_SPOTIFY_STORAGE);
      renderPage("music");
    } catch {
      if (message) {
        message.textContent = "Couldn't remove the saved playlist.";
      }
    }
  });
}

// ==============================
// PAGE NAVIGATION
// ==============================

function renderPage(page, options = {}) {
  if (!pageNames[page]) return;

  currentPage = page;

  if (page === "home") {
    pageContent.innerHTML = renderHome();
  } else if (page === "tasks") {
    pageContent.innerHTML = renderTasks();
  } else if (page === "focus") {
    pageContent.innerHTML = renderFocusRoom();
  } else if (page === "music") {
    pageContent.innerHTML = renderSpotifyMusicCorner();
    bindSpotifyMusicEvents();
  } else if (page === "journal") {
    pageContent.innerHTML = renderJournal();
  } else if (page === "progress") {
    pageContent.innerHTML = renderProgress();
  } else {
    pageContent.innerHTML = renderPlaceholder(page);
  }

  if (currentPageLabel) {
    currentPageLabel.textContent = pageNames[page];
  }

  document.querySelectorAll("[data-page].nav-item").forEach((button) => {
    const isActive = button.dataset.page === page;

    button.classList.toggle("active", isActive);

    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  closeMobileMenu();

  if (options.focusContent && pageContent) {
    pageContent.focus();
  }

  // Pastikan tampilan timer tetap sinkron setelah render.
  if (page === "focus") {
    updateFocusTimerUI();
  }
}

// ==============================
// DARK MODE
// ==============================

function setTheme(theme) {
  const isDark = theme === "dark";

  document.body.classList.toggle("dark-theme", isDark);

  if (themeIcon) {
    themeIcon.textContent = isDark ? "☀" : "☾";
  }

  if (themeLabel) {
    themeLabel.textContent = isDark
      ? "Switch to light mode"
      : "Switch to dark mode";
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode",
    );
  }

  const metaTheme = document.querySelector('meta[name="theme-color"]');

  if (metaTheme) {
    metaTheme.setAttribute("content", isDark ? "#222520" : "#f8f6f0");
  }

  try {
    localStorage.setItem("bloomTheme", theme);
  } catch {
    // Tema tetap aktif selama halaman terbuka.
  }
}

function loadTheme() {
  try {
    return localStorage.getItem("bloomTheme") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

// ==============================
// DRAWER & TASK FORM
// ==============================

function openDrawer(title, content, options = {}) {
  if (!quickDrawer || !drawerTitle || !drawerContent) return;

  previousFocus = document.activeElement;

  drawerTitle.textContent = title;
  drawerContent.replaceChildren();

  if (options.form) {
    drawerContent.innerHTML = taskFormHTML(options.task || null);

    const form = drawerContent.querySelector("#taskForm");

    if (form) {
      form.addEventListener("submit", handleTaskSubmit);
    }
  } else {
    const message = document.createElement("p");
    message.className = "muted-text";
    message.textContent = content;

    const action = document.createElement("button");
    action.type = "button";
    action.className = "button-primary button-full";
    action.textContent = "Explore Focus Room";

    action.addEventListener("click", () => {
      closeDrawer();
      renderPage("focus", { focusContent: true });
    });

    drawerContent.append(message, action);
  }

  quickDrawer.hidden = false;

  if (drawerBackdrop) {
    drawerBackdrop.hidden = false;
  }

  document.body.style.overflow = "hidden";

  const firstInput = drawerContent.querySelector(
    "input, textarea, select, button",
  );

  (firstInput || closeDrawerButton)?.focus();
}

function taskFormHTML(task) {
  const editing = Boolean(task);

  return `
    <form id="taskForm" class="task-form">
      <label class="form-field">
        <span>
          Task title <span class="required-mark">*</span>
        </span>

        <input
          name="title"
          type="text"
          maxlength="120"
          required
          placeholder="e.g. Finish assignment"
          value="${escapeHTML(task?.title || "")}"
        >
      </label>

      <label class="form-field">
        <span>
          Description <span class="optional-label">(optional)</span>
        </span>

        <textarea
          name="description"
          rows="3"
          maxlength="500"
          placeholder="Add a little detail..."
        >${escapeHTML(task?.description || "")}</textarea>
      </label>

      <div class="form-two-columns">
        <label class="form-field">
          <span>Category</span>

          <select name="category">
            ${["College", "Personal", "Projects"]
              .map(
                (value) => `
              <option
                value="${value}"
                ${task?.category === value ? "selected" : ""}
              >${value}</option>
            `,
              )
              .join("")}
          </select>
        </label>

        <label class="form-field">
          <span>Priority</span>

          <select name="priority">
            ${["Low", "Medium", "High"]
              .map(
                (value) => `
              <option
                value="${value}"
                ${task?.priority === value ? "selected" : ""}
              >${value}</option>
            `,
              )
              .join("")}
          </select>
        </label>
      </div>

      <label class="form-field">
        <span>
          Deadline <span class="optional-label">(optional)</span>
        </span>

        <input
          name="deadline"
          type="date"
          value="${escapeHTML(task?.deadline || "")}"
        >
      </label>

      <div class="form-actions">
        <button
          class="button-secondary"
          type="button"
          data-cancel-form
        >
          Cancel
        </button>

        <button class="button-primary" type="submit">
          ${editing ? "Save changes" : "Add task"}
        </button>
      </div>
    </form>
  `;
}

function openTaskForm(taskId = null) {
  editingTaskId = taskId;

  const task = taskId ? tasks.find((item) => item.id === taskId) : null;

  if (taskId && !task) return;

  openDrawer(task ? "Edit Task" : "Add a Little Task", "", {
    form: true,
    task,
  });
}

function handleTaskSubmit(event) {
  event.preventDefault();

  // Listener dipasang langsung pada form.
  const form = event.currentTarget;
  const formData = new FormData(form);

  const title = String(formData.get("title") || "").trim();

  if (!title) {
    showToast("Please give your task a title first.");
    form.elements.title.focus();
    return;
  }

  const values = {
    title,
    description: String(formData.get("description") || "").trim(),
    category: String(formData.get("category") || "College"),
    priority: String(formData.get("priority") || "Medium"),
    deadline: String(formData.get("deadline") || ""),
  };

  if (editingTaskId) {
    tasks = tasks.map((task) =>
      task.id === editingTaskId ? { ...task, ...values } : task,
    );

    showToast("Your task has been updated ✿");
  } else {
    const newTask = {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...values,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);

    showToast("A little task added. You've got this ✿");
    activeFilter = "all";
  }

  saveTasks();

  editingTaskId = null;
  closeDrawer();
  renderPage(currentPage);
}

function closeDrawer() {
  if (quickDrawer) {
    quickDrawer.hidden = true;
  }

  if (drawerBackdrop) {
    drawerBackdrop.hidden = true;
  }

  document.body.style.overflow = "";
  editingTaskId = null;

  if (previousFocus && typeof previousFocus.focus === "function") {
    previousFocus.focus();
  }
}

// ==============================
// MOBILE SIDEBAR
// ==============================

function closeMobileMenu() {
  if (sidebar) {
    sidebar.classList.remove("mobile-open");
  }

  if (mobileMenu) {
    mobileMenu.setAttribute("aria-expanded", "false");
  }
}

function toggleMobileMenu() {
  if (!sidebar || !mobileMenu) return;

  const isOpen = sidebar.classList.toggle("mobile-open");

  mobileMenu.setAttribute("aria-expanded", String(isOpen));
}

// ==============================
// TASK ACTIONS
// ==============================

function toggleTask(taskId, completed) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed } : task,
  );

  saveTasks();
  renderPage(currentPage);

  showToast(
    completed ? "Task completed. Proud of you ✿" : "Task moved back to active.",
  );
}

function deleteTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);

  if (!task) return;

  const confirmed = window.confirm(
    `Delete "${task.title}"? This can't be undone.`,
  );

  if (!confirmed) return;

  tasks = tasks.filter((task) => task.id !== taskId);

  // Kalau tugas yang sedang dipilih dihapus, kosongkan pilihan.
  if (selectedFocusTask === taskId) {
    selectedFocusTask = "";
  }

  saveTasks();
  renderPage(currentPage);

  showToast("Task deleted.");
}

// ==============================
// CLICK EVENTS
// ==============================

document.addEventListener("click", (event) => {
  // PENTING: target harus dibuat sebelum digunakan.
  const target = event.target;

  // Music Corner controls
  const moodButton = target.closest("[data-music-mood]");

  if (moodButton) {
    selectMusicMood(moodButton.dataset.musicMood);
    return;
  }

  if (target.closest("#musicPlayButton")) {
    toggleMusicPlayback();
    return;
  }

  if (target.closest("#saveFocusSettingsButton")) {
    saveFocusSettings();
    return;
  }

  // Focus Room: pilih mode timer.
  const modeButton = target.closest("[data-focus-mode]");

  if (modeButton) {
    selectFocusMode(modeButton.dataset.focusMode);
    return;
  }

  // Focus Room: Start / Pause.
  if (target.closest("#focusStartButton")) {
    startFocusTimer();
    return;
  }

  // Focus Room: Reset.
  if (target.closest("#focusResetButton")) {
    resetFocusTimer();
    return;
  }

  // Navigasi halaman.
  const pageButton = target.closest("[data-page]");

  if (pageButton) {
    event.preventDefault();

    renderPage(pageButton.dataset.page, {
      focusContent: true,
    });

    return;
  }

  // Tombol aksi.
  const actionButton = target.closest("[data-action]");

  if (actionButton) {
    const action = actionButton.dataset.action;

    if (action === "quick-add") {
      openTaskForm();
    }

    if (action === "quick-focus") {
      renderPage("focus", { focusContent: true });
    }

    return;
  }

  // Filter tugas.
  const filterButton = target.closest("[data-filter]");

  if (filterButton) {
    activeFilter = filterButton.dataset.filter;
    renderPage("tasks");
    return;
  }

  // Edit tugas.
  const editButton = target.closest("[data-edit-task]");

  if (editButton) {
    openTaskForm(editButton.dataset.editTask);
    return;
  }

  // Hapus tugas.
  const deleteButton = target.closest("[data-delete-task]");

  if (deleteButton) {
    deleteTask(deleteButton.dataset.deleteTask);
    return;
  }

  // Batalkan form.
  if (target.closest("[data-cancel-form]")) {
    closeDrawer();
  }
});

document.addEventListener("input", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLInputElement)) return;

  if (target.id === "musicProgress") {
    seekMusic(target.value);
  }

  if (target.id === "musicVolume") {
    changeMusicVolume(target.value);
  }
});

// ==============================
// CHANGE EVENTS
// ==============================

document.addEventListener("change", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  // Pilihan tugas untuk Focus Room.
  if (target instanceof HTMLSelectElement && target.id === "focusTaskSelect") {
    selectedFocusTask = target.value;
    return;
  }

  // Checkbox status tugas.
  const checkbox = target.closest("[data-task-toggle]");

  if (checkbox) {
    toggleTask(checkbox.dataset.taskToggle, checkbox.checked);
  }
});

// ==============================
// THEME & OTHER BUTTONS
// ==============================

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("dark-theme")
      ? "light"
      : "dark";

    setTheme(nextTheme);
  });
}

if (mobileMenu) {
  mobileMenu.addEventListener("click", toggleMobileMenu);
}

if (closeDrawerButton) {
  closeDrawerButton.addEventListener("click", closeDrawer);
}

if (drawerBackdrop) {
  drawerBackdrop.addEventListener("click", closeDrawer);
}

// ==============================
// KEYBOARD ACCESSIBILITY
// ==============================

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (quickDrawer && !quickDrawer.hidden) {
      closeDrawer();
    }

    closeMobileMenu();
  }

  if (event.key === "Tab" && quickDrawer && !quickDrawer.hidden) {
    const focusable = quickDrawer.querySelectorAll(
      "button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled)",
    );

    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

// ==============================
// INITIALIZATION
// ==============================

updateDate();
setTheme(loadTheme());
renderPage("home");
