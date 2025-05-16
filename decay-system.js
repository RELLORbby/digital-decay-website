// Decay system management
window.decayLevel = 100; // Global decay level
window.decayTimer = null;

function startDecayTimer() {
  stopDecayTimer();
  console.log("Starting decay timer with decay level:", window.decayLevel);
  window.decayTimer = setInterval(() => {
    window.decayLevel = Math.max(0, window.decayLevel - 100 / 1050); // 100% over 105 seconds (1050 intervals of 100ms)
    updateDecayUI();

    if (window.decayLevel <= 0) {
      console.log("Decay reached 0, showing end screen");
      showScreen("endScreen");
    }
  }, 100);
}

function stopDecayTimer() {
  if (window.decayTimer) {
    clearInterval(window.decayTimer);
    window.decayTimer = null;
  }
}

function getDecayBarColor(decayPercent) {
  // Define three distinct stages with colors from the decay grid
  if (decayPercent > 66.67) {
    // Stage 1 (100% - 66.67%) - Use fresh green from stage 1
    return "#b8d3a7"; // Fresh green color from early stage
  } else if (decayPercent > 33.33) {
    // Stage 2 (66.67% - 33.33%) - Use intermediate color from stage 3
    return "#8fb889"; // Mid-decay green-brown color
  } else {
    // Stage 3 (33.33% - 0%) - Use heavily decayed color from final stage
    return "#5a8c7b"; // Late stage blue-green decay color
  }
}

function updateDecayUI() {
  const screens = ["", "1", "2", "3"];
  const currentColor = getDecayBarColor(window.decayLevel);

  screens.forEach((suffix) => {
    const progressElement = document.getElementById("decayProgress" + suffix);
    const percentElement = document.getElementById("decayPercent" + suffix);
    if (progressElement && percentElement) {
      progressElement.style.width = window.decayLevel + "%";
      progressElement.style.background = currentColor; // Set solid color instead of gradient
      percentElement.textContent = Math.round(window.decayLevel) + "%";
    }
  });
}

function adjustDecay(amount) {
  window.decayLevel = Math.max(0, Math.min(100, window.decayLevel + amount));
  updateDecayUI();
}

// Get color for current decay level
function getColorForDecay(row, col, decayPercent) {
  const stageIndex = Math.floor((1 - decayPercent / 100) * 5);
  const clampedStage = Math.max(0, Math.min(5, stageIndex));
  return decayData.stages[clampedStage].grid[row][col];
}
