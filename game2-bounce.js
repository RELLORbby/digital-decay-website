// Game 2: Bounce Game
let bounceGame = null;

function initializeBounceGame() {
  const canvas = document.getElementById("bounceCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  bounceGame = {
    canvas: canvas,
    ctx: ctx,
    paddle: {
      x: canvas.width / 2 - 60,
      y: canvas.height - 80,
      width: 120,
      height: 20,
      speed: 8,
    },
    blocks: [],
    blockSpawnTimer: 0,
    blockSpawnRate: 60, // Reduced from 120 to make blocks spawn faster
    keys: {},
  };

  // Keyboard controls
  document.addEventListener("keydown", (e) => {
    if (bounceGame) bounceGame.keys[e.key] = true;
  });

  document.addEventListener("keyup", (e) => {
    if (bounceGame) bounceGame.keys[e.key] = false;
  });

  function createBlock() {
    const row = Math.floor(Math.random() * 7);
    const col = Math.floor(Math.random() * 13);

    // Blocks spawn from full width of screen
    const x = Math.random() * (bounceGame.canvas.width - 50);

    bounceGame.blocks.push({
      x: x,
      y: -40,
      width: 50,
      height: 30,
      row: row,
      col: col,
      speedY: 3 + Math.random() * 3, // Increased speed (was 2 + random * 2)
      color: getColorForDecay(row, col, window.decayLevel),
      isBouncing: false, // Track if block is bouncing up
    });
  }

  function updateBounceGame() {
    if (currentScreen !== "game2") return;

    // Clear canvas
    bounceGame.ctx.fillStyle = "#1a1a1a";
    bounceGame.ctx.fillRect(
      0,
      0,
      bounceGame.canvas.width,
      bounceGame.canvas.height
    );

    // Move paddle
    if (bounceGame.keys["ArrowLeft"] || bounceGame.keys["a"]) {
      bounceGame.paddle.x = Math.max(
        0,
        bounceGame.paddle.x - bounceGame.paddle.speed
      );
    }
    if (bounceGame.keys["ArrowRight"] || bounceGame.keys["d"]) {
      bounceGame.paddle.x = Math.min(
        bounceGame.canvas.width - bounceGame.paddle.width,
        bounceGame.paddle.x + bounceGame.paddle.speed
      );
    }

    // Draw paddle
    bounceGame.ctx.fillStyle = "#5a8c5a";
    bounceGame.ctx.fillRect(
      bounceGame.paddle.x,
      bounceGame.paddle.y,
      bounceGame.paddle.width,
      bounceGame.paddle.height
    );

    // Spawn blocks more frequently
    bounceGame.blockSpawnTimer++;
    if (bounceGame.blockSpawnTimer >= bounceGame.blockSpawnRate) {
      createBlock();
      bounceGame.blockSpawnTimer = 0;
    }

    // Update and draw blocks
    for (let i = bounceGame.blocks.length - 1; i >= 0; i--) {
      const block = bounceGame.blocks[i];

      // Update position
      block.y += block.speedY;

      // Update color based on current decay level
      block.color = getColorForDecay(block.row, block.col, window.decayLevel);

      // Check paddle collision (only when block is falling down)
      if (!block.isBouncing && block.speedY > 0) {
        if (
          block.y + block.height >= bounceGame.paddle.y &&
          block.x + block.width >= bounceGame.paddle.x &&
          block.x <= bounceGame.paddle.x + bounceGame.paddle.width &&
          block.y <= bounceGame.paddle.y + bounceGame.paddle.height
        ) {
          // Block hit paddle - bounce it back up
          block.isBouncing = true;
          block.speedY = -(3 + Math.random() * 3); // Bounce up with similar speed
          adjustDecay(0.5); // Reduced from 1 to 0.5
          continue;
        }
      }

      // Check if bouncing block reached top of screen
      if (block.isBouncing && block.y < -40) {
        bounceGame.blocks.splice(i, 1);
        continue;
      }

      // Check if falling block hit bottom of screen
      if (!block.isBouncing && block.y > bounceGame.canvas.height) {
        adjustDecay(-1.5); // Reduced from -3 to -1.5
        bounceGame.blocks.splice(i, 1);
        continue;
      }

      // Draw block
      bounceGame.ctx.fillStyle = block.color;
      bounceGame.ctx.fillRect(block.x, block.y, block.width, block.height);
      bounceGame.ctx.strokeStyle = "#333";
      bounceGame.ctx.strokeRect(block.x, block.y, block.width, block.height);
    }

    requestAnimationFrame(updateBounceGame);
  }

  updateBounceGame();
}

// Handle window resize for bounce game
window.addEventListener("resize", () => {
  if (bounceGame) {
    bounceGame.canvas.width = window.innerWidth;
    bounceGame.canvas.height = window.innerHeight;
    bounceGame.paddle.y = bounceGame.canvas.height - 80;
  }
});
