// Game 2: Button Challenge Game
let buttonGame = null;
let buttonAnimationFrame = null;
let particles = [];

function initializeButtonGame() {
  const canvas = document.getElementById("bounceCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Calculate button dimensions based on viewport
  const buttonSize = Math.min(canvas.width, canvas.height) * 0.25; // 25% of the smaller dimension

  buttonGame = {
    canvas: canvas,
    ctx: ctx,
    button: {
      x: canvas.width / 2 - buttonSize / 2,
      y: canvas.height / 2 - buttonSize / 2,
      width: buttonSize,
      height: buttonSize,
      currentColorStage: 1, // Start at stage 1 (valid range 1-6)
      currentRow: 0,
      currentCol: 0,
      totalColors: 6 * 7 * 13, // Total number of colors (546)
      totalPositionsPerStage: 7 * 13, // 91 positions per stage
      colorPositionIndex: 0, // This will be calculated based on global decay
      reverseSpeed: 0, // Current reverse speed (increases with rapid clicks)
      maxReverseSpeed: 3.0, // Maximum reverse speed
      lastClickTime: 0, // Timestamp of last click
      clickCount: 0, // Track rapid clicking
    },
    keys: {},
    frames: 0, // Frame counter for animations
  };

  // Initialize the color position based on current decay level
  updateColorPositionFromDecay();

  // Mouse/touch click handler
  canvas.addEventListener("click", handleButtonClick);

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !buttonGame.keys[e.code]) {
      handleSpaceBar();
    }
    buttonGame.keys[e.code] = true;
  });

  document.addEventListener("keyup", (e) => {
    buttonGame.keys[e.code] = false;
  });

  // Start animation loop
  updateButtonGame();
}

// This function updates the color position based on the current decay level
function updateColorPositionFromDecay() {
  if (!buttonGame || !buttonGame.button) return;

  // Map the global decay level (0-100) to the total color space
  // At 100% decay (start) we're at the beginning of colors
  // At 0% decay (end) we're at the end of colors

  // Calculate total positions across all stages (6 stages × 91 positions per stage)
  const totalPositions = 6 * buttonGame.button.totalPositionsPerStage;

  // Map decay level (100-0) to color position (0 to totalPositions-1)
  // Reverse the decay level (100 is start, 0 is end) for mapping
  const inverseDecay = 100 - window.decayLevel;
  const mappedPosition = Math.floor((inverseDecay / 100) * totalPositions);

  // Ensure the position is within valid bounds
  buttonGame.button.colorPositionIndex = Math.max(
    0,
    Math.min(totalPositions - 1, mappedPosition)
  );

  // Calculate the current stage, row, and column from colorPositionIndex
  buttonGame.button.currentColorStage =
    Math.floor(
      buttonGame.button.colorPositionIndex /
        buttonGame.button.totalPositionsPerStage
    ) + 1;
  const positionInStage =
    buttonGame.button.colorPositionIndex %
    buttonGame.button.totalPositionsPerStage;
  buttonGame.button.currentRow = Math.floor(positionInStage / 13);
  buttonGame.button.currentCol = positionInStage % 13;
}

function handleSpaceBar() {
  // Only respond if we're in the button game screen
  if (currentScreen !== "game2") return;

  const now = Date.now();
  const timeSinceLastClick = now - buttonGame.button.lastClickTime;
  buttonGame.button.lastClickTime = now;

  // If clicked fast enough, increase reverse speed
  if (timeSinceLastClick < 300) {
    // Less than 300ms between clicks
    buttonGame.button.clickCount++;

    // Calculate reverse speed based on consecutive rapid clicks
    // The more rapid clicks in succession, the more reverse effect
    buttonGame.button.reverseSpeed = Math.min(
      buttonGame.button.maxReverseSpeed,
      buttonGame.button.reverseSpeed + 0.35
    );

    // Create particles based on current button color
    createParticles(25); // Create more particles for rapid clicks

    // Adjust global decay (small amount for each click)
    adjustDecay(0.2);

    // Update the button color to match the new decay level
    updateColorPositionFromDecay();
  } else {
    // Reset click count for slow clicks
    buttonGame.button.clickCount = 1;
    buttonGame.button.reverseSpeed = 0.15; // Minimal reverse on single click

    // Create fewer particles for single clicks
    createParticles(10);

    // Very small decay adjustment for single clicks
    adjustDecay(0.05);

    // Update the button color to match the new decay level
    updateColorPositionFromDecay();
  }
}

function handleButtonClick(e) {
  // Only respond if we're in the button game screen
  if (currentScreen !== "game2") return;

  // Calculate mouse position relative to canvas
  const rect = buttonGame.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Check if click is inside button
  const button = buttonGame.button;
  if (
    mouseX >= button.x &&
    mouseX <= button.x + button.width &&
    mouseY >= button.y &&
    mouseY <= button.y + button.height
  ) {
    // Simulate spacebar press
    handleSpaceBar();
  }
}

function createParticles(count) {
  // Make sure buttonGame exists before proceeding
  if (!buttonGame || !buttonGame.button) {
    console.warn("buttonGame not initialized in createParticles");
    return;
  }

  // Get the current stage, row, and col
  const stageIndex = Math.max(
    0,
    Math.min(5, buttonGame.button.currentColorStage - 1)
  );

  // For particle effects, use colors from the current stage to create a varied visual effect
  const button = buttonGame.button;

  for (let i = 0; i < count; i++) {
    // Two particle types:
    // 1. Same color as button (current color)
    // 2. Random colors from current stage

    let color;

    if (Math.random() < 0.6) {
      // 60% chance for current color
      color =
        decayData.stages[stageIndex].grid[button.currentRow][button.currentCol];
    } else {
      // 40% chance for random color from current stage
      const randomRow = Math.floor(Math.random() * 7); // 0-6
      const randomCol = Math.floor(Math.random() * 13); // 0-12

      try {
        color = decayData.stages[stageIndex].grid[randomRow][randomCol];
      } catch (e) {
        // Fallback if there's any issue with accessing the grid
        color = "#7ab2ad";
      }
    }

    // Create particles that emanate from behind the button
    const angle = Math.random() * Math.PI * 2; // Random angle
    const speed = 1 + Math.random() * 4; // Random speed

    // Calculate starting position just behind the button
    // Randomly position at button edges
    let startX, startY;
    const rand = Math.random();
    if (rand < 0.25) {
      // Top edge
      startX = button.x + Math.random() * button.width;
      startY = button.y;
    } else if (rand < 0.5) {
      // Right edge
      startX = button.x + button.width;
      startY = button.y + Math.random() * button.height;
    } else if (rand < 0.75) {
      // Bottom edge
      startX = button.x + Math.random() * button.width;
      startY = button.y + button.height;
    } else {
      // Left edge
      startX = button.x;
      startY = button.y + Math.random() * button.height;
    }

    particles.push({
      x: startX,
      y: startY,
      size: 2 + Math.random() * 6, // Random size
      color: color, // Use color based on our selection
      speedX: Math.cos(angle) * speed,
      speedY: Math.sin(angle) * speed,
      life: 50 + Math.random() * 50, // Random lifetime
      opacity: 0.8 + Math.random() * 0.2, // Start slightly transparent
    });
  }
}

function updateParticles() {
  // Update and draw all particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Update position
    p.x += p.speedX;
    p.y += p.speedY;

    // Reduce lifetime and opacity
    p.life -= 1;
    p.opacity = p.life / 100;

    // Remove dead particles
    if (p.life <= 0 || p.opacity <= 0) {
      particles.splice(i, 1);
      continue;
    }

    // Draw particle
    buttonGame.ctx.beginPath();
    buttonGame.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    buttonGame.ctx.fillStyle = `${p.color}${Math.floor(p.opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    buttonGame.ctx.fill();
  }
}

function updateButtonGame() {
  if (currentScreen !== "game2") {
    if (buttonAnimationFrame) {
      cancelAnimationFrame(buttonAnimationFrame);
      buttonAnimationFrame = null;
    }
    return;
  }

  buttonAnimationFrame = requestAnimationFrame(updateButtonGame);
  buttonGame.frames++;

  // Clear canvas
  const ctx = buttonGame.ctx;
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, buttonGame.canvas.width, buttonGame.canvas.height);

  // Check if global decay level has changed
  if (buttonGame.frames % 5 === 0) {
    // Only check every 5 frames to avoid excessive updates
    // Update button color position based on current decay level
    updateColorPositionFromDecay();
  }

  // Calculate color index for display
  const stageIndex = Math.max(
    0,
    Math.min(5, buttonGame.button.currentColorStage - 1)
  );
  const currentColor =
    decayData.stages[stageIndex].grid[buttonGame.button.currentRow][
      buttonGame.button.currentCol
    ];

  // Draw particles behind button
  updateParticles();

  // Draw button with 3D effect
  // Draw shadow first
  ctx.fillStyle = "#000000";
  ctx.fillRect(
    buttonGame.button.x + 8,
    buttonGame.button.y + 8,
    buttonGame.button.width,
    buttonGame.button.height
  );

  // Draw main button
  ctx.fillStyle = currentColor;
  ctx.fillRect(
    buttonGame.button.x,
    buttonGame.button.y,
    buttonGame.button.width,
    buttonGame.button.height
  );

  // Draw button border
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    buttonGame.button.x,
    buttonGame.button.y,
    buttonGame.button.width,
    buttonGame.button.height
  );

  // Draw instructions
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    "Press SPACEBAR rapidly to reverse decay!",
    buttonGame.canvas.width / 2,
    buttonGame.canvas.height - 80
  );
}

// Handle window resize for button game
window.addEventListener("resize", () => {
  if (buttonGame) {
    buttonGame.canvas.width = window.innerWidth;
    buttonGame.canvas.height = window.innerHeight;

    // Recalculate button size and position
    const buttonSize =
      Math.min(buttonGame.canvas.width, buttonGame.canvas.height) * 0.25;
    buttonGame.button.x = buttonGame.canvas.width / 2 - buttonSize / 2;
    buttonGame.button.y = buttonGame.canvas.height / 2 - buttonSize / 2;
    buttonGame.button.width = buttonSize;
    buttonGame.button.height = buttonSize;
  }
});
