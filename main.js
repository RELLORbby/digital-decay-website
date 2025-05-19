// Main game initialization and event handlers

// Global key event handler that runs as soon as the script loads
(function setupKeyHandlers() {
  console.log("Setting up global key handlers immediately");

  // Create a more robust key handler function
  function handleKeyPress(e) {
    console.log(
      "Key pressed:",
      e.key,
      "KeyCode:",
      e.keyCode,
      "Current screen:",
      currentScreen
    );

    // Handle start screen
    if (
      currentScreen === "startScreen" &&
      (e.key === "Enter" || e.keyCode === 13)
    ) {
      console.log("Enter key detected on start screen! Moving to main screen");
      showScreen("mainScreen");
      return;
    }

    // Handle end screen
    if (
      currentScreen === "endScreen" &&
      (e.key === "Enter" || e.keyCode === 13)
    ) {
      console.log("Enter key detected on end screen! Restarting game");
      resetGame();
      return;
    }
  }

  // Add the event listener to both document and window
  document.addEventListener("keydown", handleKeyPress);
  window.addEventListener("keydown", handleKeyPress);

  // Also handle keypress which might be more reliable in some browsers
  document.addEventListener("keypress", handleKeyPress);
  window.addEventListener("keypress", handleKeyPress);
})();

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
  countdownElement.textContent = countdown;

  window.endCountdown = setInterval(() => {
    countdown--;
    countdownElement.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(window.endCountdown);
      window.endCountdown = null;
      resetGame();
    }
  }, 1000);
}

// Main screen click handler
document.addEventListener("DOMContentLoaded", function () {
  // Wait for DOM to be ready before adding event listeners
  const mainScreen = document.getElementById("mainScreen");
  if (mainScreen) {
    mainScreen.addEventListener("click", () => {
      console.log("Main screen clicked, starting random game");
      startRandomGame();
    });
  }

  // Add click handlers for start and end screens
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.addEventListener("click", function () {
      if (currentScreen === "startScreen") {
        console.log("Start screen clicked - moving to main");
        showScreen("mainScreen");
      }
    });
  }

  const endScreen = document.getElementById("endScreen");
  if (endScreen) {
    endScreen.addEventListener("click", function () {
      if (currentScreen === "endScreen") {
        console.log("End screen clicked - restarting game");
        resetGame();
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
