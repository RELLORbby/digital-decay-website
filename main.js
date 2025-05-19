// main.js - Simplified and focused on fixing the Enter key issue

// Main game initialization and event handlers
window.endCountdown = null;

// End screen countdown
function startEndScreenCountdown() {
  // Clear any existing countdown
  if (window.endCountdown) {
    clearInterval(window.endCountdown);
    window.endCountdown = null;
  }

  let countdown = 30;
  const countdownElement = document.getElementById("countdown");
  if (countdownElement) {
    countdownElement.textContent = countdown;
  }

  window.endCountdown = setInterval(() => {
    countdown--;
    if (countdownElement) {
      countdownElement.textContent = countdown;
    }

    if (countdown <= 0) {
      clearInterval(window.endCountdown);
      window.endCountdown = null;
      resetGame();
    }
  }, 1000);
}

// Event listeners for key presses
document.addEventListener("keydown", (e) => {
  console.log("Key pressed:", e.key, "Current screen:", currentScreen);

  // Handle start screen
  if (currentScreen === "startScreen" && e.key === "Enter") {
    console.log("Moving from start to main screen");
    showScreen("mainScreen");
    return;
  }

  // Handle end screen
  if (currentScreen === "endScreen" && e.key === "Enter") {
    console.log("Restarting game");
    resetGame();
    return;
  }

  // Note: Simon Says keyboard handling is in game3-simon.js
});

// Main screen click handler
document.addEventListener("DOMContentLoaded", function () {
  // Wait for DOM to be ready before adding event listeners
  const mainScreen = document.getElementById("mainScreen");
  if (mainScreen) {
    mainScreen.addEventListener("click", () => {
      // Only trigger if we're actually on the main screen
      if (currentScreen === "mainScreen") {
        console.log("Main screen clicked, starting random game");
        startRandomGame();
      }
    });
  }
});

// Initialize the game properly on page load
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM Content Loaded - Initializing game");

  // Stop any existing timers
  stopDecayTimer();
  stopFloatingObjects();
  if (window.endCountdown) {
    clearInterval(window.endCountdown);
    window.endCountdown = null;
  }

  // Reset everything to initial state
  currentScreen = "startScreen";
  window.decayLevel = 100;

  // Update the UI to show 100%
  updateDecayUI();

  // Make sure only start screen is visible
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });

  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.classList.add("active");
  }

  console.log(
    "Game initialized - Decay level:",
    window.decayLevel,
    "Current screen:",
    currentScreen
  );

  // Initialize particles for start screen
  createStartParticles();
});
