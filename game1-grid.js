// Game 1: Grid Game with Improved Decay Mechanics
let gridUpdateTimer = null;
let lastUpdateTime = 0;

function initializeGridGame() {
  const grid = document.getElementById("gameGrid");
  grid.innerHTML = "";
  lastUpdateTime = Date.now();

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 13; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Initial decay is influenced by global decay level
      // Convert global decay (100% to 0%) to cell decay (0 to 6)
      const globalDecayInfluence = 1 - window.decayLevel / 100;

      // Add randomness to initial cell decay but cap it
      const randomFactor = 0.6 + Math.random() * 0.6; // 0.6 to 1.2 range
      let initialDecay = Math.max(0.1, globalDecayInfluence * randomFactor);
      initialDecay = Math.min(0.85, initialDecay); // Cap at 0.85 for longer gameplay

      // Store decay as a float value (0.0 to 1.0)
      cell.dataset.decayValue = initialDecay;

      // Stage is a discrete value (1-6) based on decay value
      cell.dataset.stage = Math.max(
        1,
        Math.min(6, Math.floor(initialDecay * 6) + 1)
      );

      // Individual decay speed (slower than Python version for better gameplay)
      cell.dataset.decaySpeed = (0.02 + Math.random() * 0.04).toFixed(4); // 0.02 to 0.06

      // Store last click time
      cell.dataset.lastClickTime = 0;

      cell.addEventListener("click", () => {
        // Save old decay for calculating bonus
        const oldDecay = parseFloat(cell.dataset.decayValue);

        // Rejuvenate cell
        cell.dataset.decayValue = 0;
        cell.dataset.stage = 1;
        cell.dataset.lastClickTime = Date.now();

        // Calculate bonus rejuvenation for global health
        const rejuvenationBonus = 0.2; // Added bonus
        const fractionOfGrid = 1.0 / (7 * 13); // Total grid size
        const bonusHealth =
          (oldDecay + rejuvenationBonus) * fractionOfGrid * 100.0;
        adjustDecay(bonusHealth);

        // Update grid cell visually
        updateGridCell(cell);

        // Synchronize global decay with grid
        syncDecayWithGrid();
      });

      grid.appendChild(cell);
      updateGridCell(cell);
    }
  }

  // Clear any existing timer
  if (gridUpdateTimer) {
    clearInterval(gridUpdateTimer);
  }

  // Update grid more frequently for smoother decay
  gridUpdateTimer = setInterval(() => {
    if (currentScreen !== "game1") {
      clearInterval(gridUpdateTimer);
      gridUpdateTimer = null;
      return;
    }

    // Calculate delta time in seconds
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;

    // Global decay factor based on current decay level
    const globalDecayFactor = 1.4 - window.decayLevel / 150.0;
    const clampedFactor = Math.max(0.5, Math.min(1.3, globalDecayFactor));

    // Update all cells with their individual decay rates
    let stagesChanged = false;
    grid.querySelectorAll(".grid-cell").forEach((cell) => {
      if (updateGridCellWithDelta(cell, deltaTime, clampedFactor)) {
        stagesChanged = true;
      }
    });

    // If any stages changed, sync with global decay
    if (stagesChanged) {
      syncDecayWithGrid();
    }
  }, 50); // Update every 50ms for smoother appearance
}

function updateGridCellWithDelta(cell, deltaTime, globalDecayFactor) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const decaySpeed = parseFloat(cell.dataset.decaySpeed);

  // Get current values
  const oldStage = parseInt(cell.dataset.stage);
  let decayValue = parseFloat(cell.dataset.decayValue);

  // Apply individual decay progression with time factor
  const slowdownFactor = 0.3; // Slower decay for longer gameplay
  decayValue += decaySpeed * deltaTime * globalDecayFactor * slowdownFactor;
  decayValue = Math.max(0, Math.min(1, decayValue));

  // Store updated decay value
  cell.dataset.decayValue = decayValue;

  // Calculate stage based on decay value (1-6)
  const newStage = Math.max(1, Math.min(6, Math.floor(decayValue * 6) + 1));
  cell.dataset.stage = newStage;

  // Apply visual update if needed
  if (newStage !== oldStage) {
    updateGridCell(cell);
    return true; // Stage changed
  }

  return false; // No change
}

function updateGridCell(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const stage = parseInt(cell.dataset.stage);

  // Get color from decay data based on stage (adjust for 0-based index)
  const stageIndex = Math.max(0, Math.min(5, stage - 1));
  cell.style.backgroundColor = decayData.stages[stageIndex].grid[row][col];

  // Add highlight effect if recently clicked
  const currentTime = Date.now();
  const lastClickTime = parseInt(cell.dataset.lastClickTime || 0);

  if (currentTime - lastClickTime < 500) {
    // 500ms highlight effect
    const highlightAlpha =
      255 - Math.floor((255 * (currentTime - lastClickTime)) / 500);
    cell.style.boxShadow = `0 0 10px rgba(255, 255, 255, ${
      highlightAlpha / 255
    })`;
  } else {
    cell.style.boxShadow = "none";
  }
}

function calculateGridHealth() {
  const grid = document.getElementById("gameGrid");
  if (!grid) return 100; // Default to healthy if no grid

  const cells = grid.querySelectorAll(".grid-cell");
  if (cells.length === 0) return 100;

  // Calculate average decay across all cells
  let totalDecay = 0;
  cells.forEach((cell) => {
    totalDecay += parseFloat(cell.dataset.decayValue || 0);
  });

  const avgDecay = totalDecay / cells.length;

  // Convert to health percentage (0% decay = 100% health)
  return (1.0 - avgDecay) * 100.0;
}

function syncDecayWithGrid(force = false) {
  // Calculate grid health percentage
  const gridHealth = calculateGridHealth();
  const currentHealth = window.decayLevel;

  // Only update if there's a significant difference or forced
  if (force || Math.abs(gridHealth - currentHealth) > 1.0) {
    // Make the sync more gradual for smoother experience
    const changeAmount = (gridHealth - currentHealth) * 0.4;
    adjustDecay(changeAmount);
  }
}
