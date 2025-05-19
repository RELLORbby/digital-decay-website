// screen-manager.js - Updated to preserve state between transitions

// Screen management system
let currentScreen = "startScreen";

function showScreen(screenId) {
  console.log("Switching from", currentScreen, "to", screenId);

  // Remember the previous screen to handle state preservation
  const previousScreen = currentScreen;

  // Cleanup when leaving Simon Says game
  if (currentScreen === "game3") {
    cleanupSimonGame();
  }

  // Save the state of the main screen floating objects when leaving
  if (currentScreen === "mainScreen" && screenId !== "mainScreen") {
    console.log("Saving floating objects state when leaving main screen");
    if (typeof saveFloatingObjectsState === "function") {
      saveFloatingObjectsState();
    }
  }

  // Hide all screens
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add("active");
    currentScreen = screenId;
  } else {
    console.error("Screen not found:", screenId);
    return;
  }

  // Stop countdown timer, but not necessarily the decay timer
  if (window.endCountdown) {
    clearInterval(window.endCountdown);
    window.endCountdown = null;
  }

  // Initialize screen-specific functionality
  if (screenId === "startScreen") {
    stopDecayTimer();
    stopFloatingObjects();

    // Clear any existing particles first
    const particleContainer = document.getElementById("startParticles");
    if (particleContainer) {
      particleContainer.innerHTML = "";
    }
    createStartParticles();
    createStartGlitchRectangles();
  } else if (screenId === "mainScreen") {
    // When returning to main menu, use the saved state
    startFloatingObjects();

    // Start decay timer if not already running
    if (!window.decayTimer) {
      startDecayTimer();
    }
  } else if (screenId === "game1") {
    initializeGridGame();
  } else if (screenId === "game2") {
    initializeButtonGame();
  } else if (screenId === "game3") {
    initializeSimonGame();
  } else if (screenId === "endScreen") {
    stopDecayTimer();
    stopFloatingObjects();
    createGlitchRectangles();
    startEndScreenCountdown();
  }
}

// Create glitchy rectangles for start screen
function createStartGlitchRectangles() {
  const container = document.getElementById("startGlitchRectangles");
  if (!container) return;

  // Clear any existing rectangles
  container.innerHTML = "";

  // Create multiple glitchy rectangles for start screen
  for (let i = 0; i < 8; i++) {
    const rect = document.createElement("div");
    rect.className = "start-glitch-rect";

    // Random size and position
    const width = 30 + Math.random() * 100;
    const height = 15 + Math.random() * 30;
    const x = Math.random() * (window.innerWidth - width);
    const y = Math.random() * window.innerHeight;

    rect.style.width = width + "px";
    rect.style.height = height + "px";
    rect.style.left = x + "px";
    rect.style.top = y + "px";
    rect.style.animationDelay = Math.random() * 3 + "s";
    rect.style.animationDuration = 1.5 + Math.random() * 1.5 + "s";

    container.appendChild(rect);
  }

  // Keep creating new rectangles periodically
  const startGlitchInterval = setInterval(() => {
    if (currentScreen === "startScreen") {
      // Remove old rectangles
      while (container.children.length > 12) {
        container.removeChild(container.firstChild);
      }

      // Add new rectangle
      const rect = document.createElement("div");
      rect.className = "start-glitch-rect";

      const width = 30 + Math.random() * 100;
      const height = 15 + Math.random() * 30;
      const x = Math.random() * (window.innerWidth - width);
      const y = Math.random() * window.innerHeight;

      rect.style.width = width + "px";
      rect.style.height = height + "px";
      rect.style.left = x + "px";
      rect.style.top = y + "px";
      rect.style.animationDelay = "0s";
      rect.style.animationDuration = 1.5 + Math.random() * 1.5 + "s";

      container.appendChild(rect);
    } else {
      clearInterval(startGlitchInterval);
    }
  }, 1000);
}

// Create glitchy rectangles for end screen
function createGlitchRectangles() {
  const container = document.getElementById("glitchRectangles");
  if (!container) return;

  // Clear any existing rectangles
  container.innerHTML = "";

  // Create multiple glitchy rectangles
  for (let i = 0; i < 20; i++) {
    const rect = document.createElement("div");
    rect.className = "glitch-rect";

    // Random size and position
    const width = 50 + Math.random() * 150;
    const height = 20 + Math.random() * 40;
    const x = Math.random() * (window.innerWidth - width);
    const y = Math.random() * window.innerHeight;

    rect.style.width = width + "px";
    rect.style.height = height + "px";
    rect.style.left = x + "px";
    rect.style.top = y + "px";
    rect.style.animationDelay = Math.random() * 1 + "s";
    rect.style.animationDuration = 0.8 + Math.random() * 1.2 + "s";

    container.appendChild(rect);
  }

  // Keep creating new rectangles periodically - more frequent
  const glitchInterval = setInterval(() => {
    if (currentScreen === "endScreen") {
      // Remove old rectangles
      while (container.children.length > 25) {
        container.removeChild(container.firstChild);
      }

      // Add new rectangle
      const rect = document.createElement("div");
      rect.className = "glitch-rect";

      const width = 50 + Math.random() * 150;
      const height = 20 + Math.random() * 40;
      const x = Math.random() * (window.innerWidth - width);
      const y = Math.random() * window.innerHeight;

      rect.style.width = width + "px";
      rect.style.height = height + "px";
      rect.style.left = x + "px";
      rect.style.top = y + "px";
      rect.style.animationDelay = "0s";
      rect.style.animationDuration = 0.8 + Math.random() * 1.2 + "s";

      container.appendChild(rect);
    } else {
      clearInterval(glitchInterval);
    }
  }, 500); // Reduced from 800ms to 500ms for more glitchiness
}

// Matrix-style particles for start screen
function createStartParticles() {
  const container = document.getElementById("startParticles");
  if (!container) return;

  // Create matrix characters falling
  function createMatrixChar() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()";
    const char = document.createElement("div");
    char.className = "matrix-char";
    char.textContent = chars[Math.floor(Math.random() * chars.length)];
    char.style.left = Math.random() * 100 + "%";
    char.style.animationDelay = Math.random() * 4 + "s";
    char.style.animationDuration = 3 + Math.random() * 2 + "s";
    container.appendChild(char);

    setTimeout(() => {
      if (char.parentNode) {
        char.parentNode.removeChild(char);
      }
    }, 6000);
  }

  // Create dot particles
  function createDotParticle() {
    const dot = document.createElement("div");
    dot.className = "dot-particle";
    dot.style.left = Math.random() * 100 + "%";
    dot.style.top = Math.random() * 100 + "%";
    dot.style.animationDelay = Math.random() * 3 + "s";
    container.appendChild(dot);

    setTimeout(() => {
      if (dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
    }, 3000);
  }

  // Create initial particles
  for (let i = 0; i < 50; i++) {
    setTimeout(() => createDotParticle(), Math.random() * 1000);
  }

  // Keep creating matrix characters
  const matrixInterval = setInterval(() => {
    if (currentScreen === "startScreen") {
      createMatrixChar();
    } else {
      clearInterval(matrixInterval);
    }
  }, 150);

  // Keep creating dot particles
  const dotInterval = setInterval(() => {
    if (currentScreen === "startScreen") {
      createDotParticle();
    } else {
      clearInterval(dotInterval);
    }
  }, 300);
}

// Game navigation
function goToMain() {
  showScreen("mainScreen");
}

function startRandomGame() {
  const gameNumber = Math.floor(Math.random() * 3) + 1;
  showScreen("game" + gameNumber);
}

function resetGame() {
  window.decayLevel = 100;
  stopDecayTimer();
  stopFloatingObjects();

  // Clear the saved state when resetting the game
  if (typeof savedObjectsState !== "undefined") {
    savedObjectsState = null;
  }

  if (window.endCountdown) {
    clearInterval(window.endCountdown);
    window.endCountdown = null;
  }
  updateDecayUI();
  showScreen("startScreen");
}

// Return to main site function
function returnToMainSite() {
  if (window.opener) {
    window.close(); // Close the game window if opened as popup
  } else {
    window.location.href = "index.html"; // Navigate back to main site
  }
}
