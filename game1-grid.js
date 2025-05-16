// Game 1: Grid Game
function initializeGridGame() {
  const grid = document.getElementById("gameGrid");
  grid.innerHTML = "";

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 13; col++) {
      const cell = document.createElement("div");
      cell.className = "grid-cell";
      cell.dataset.row = row;
      cell.dataset.col = col;

      // Start all cells at stage 1 (100% decay level)
      cell.dataset.stage = 1;

      // Random decay speed for each cell (how quickly it decays relative to main decay)
      cell.dataset.decaySpeed = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 multiplier

      cell.addEventListener("click", () => {
        // Rejuvenate cell to stage 1
        cell.dataset.stage = 1;
        adjustDecay(2); // Reverse decay by 2%
        updateGridCell(cell);
      });

      grid.appendChild(cell);
      updateGridCell(cell);
    }
  }

  // Update grid based on global decay level
  const gridUpdateTimer = setInterval(() => {
    if (currentScreen !== "game1") {
      clearInterval(gridUpdateTimer);
      return;
    }

    grid.querySelectorAll(".grid-cell").forEach((cell) => {
      updateGridCellBasedOnDecay(cell);
    });
  }, 100); // Update every 100ms
}

function updateGridCellBasedOnDecay(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const decaySpeed = parseFloat(cell.dataset.decaySpeed);

  // Calculate what stage this cell should be at based on global decay
  // At 100% decay: stage 1
  // At 0% decay: stage 6
  // Add randomness with decaySpeed multiplier
  let targetStage = 1 + (1 - window.decayLevel / 100) * 5 * decaySpeed;

  // Ensure stage stays within bounds
  targetStage = Math.max(1, Math.min(6, targetStage));

  // Only update if cell hasn't been manually reset recently
  const currentStage = parseFloat(cell.dataset.stage);

  // If current stage is lower than target, gradually move towards target
  if (currentStage < targetStage) {
    cell.dataset.stage = Math.min(targetStage, currentStage + 0.02);
  }

  updateGridCell(cell);
}

function updateGridCell(cell) {
  const row = parseInt(cell.dataset.row);
  const col = parseInt(cell.dataset.col);
  const stage = parseFloat(cell.dataset.stage);

  // Get color from decay data based on stage
  const stageIndex = Math.max(0, Math.min(5, Math.floor(stage) - 1));
  cell.style.backgroundColor = decayData.stages[stageIndex].grid[row][col];
}
