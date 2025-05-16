// Game 3: Simon Says
let simonGame = null;
let simonAnimationFrame = null;

function initializeSimonGame() {
  simonGame = {
    sequences: [
      ["w", "a", "s"],
      ["q", "e", "r"],
      ["a", "s", "d", "f"],
      ["z", "x", "c"],
      ["w", "w", "s", "s"],
      ["a", "d", "a", "d"],
    ],
    currentSequence: [],
    userInput: [],
    stage: "waiting",
    currentInstructionIndex: 0,
    isComputerSays: false,
    keyListenerActive: false,
    instructionTimer: null,
    animationFrame: 10000, // Fixed animation frame
  };

  startSimonRound();
  updateSimonAnimation();
}

function startSimonRound() {
  // Clear any existing timers
  if (simonGame.instructionTimer) {
    clearTimeout(simonGame.instructionTimer);
    simonGame.instructionTimer = null;
  }

  // Choose random sequence
  simonGame.currentSequence =
    simonGame.sequences[Math.floor(Math.random() * simonGame.sequences.length)];
  simonGame.userInput = [];
  simonGame.isComputerSays = Math.random() < 0.7; // 70% chance of "computer says"
  simonGame.stage = "showing";
  simonGame.currentInstructionIndex = 0;
  simonGame.keyListenerActive = false;

  // Set fixed animation frame based on decay level (but don't change it during the round)
  simonGame.animationFrame =
    10000 + Math.floor((1 - window.decayLevel / 100) * 1381);

  // Clear previous displays
  document.getElementById("simonSequence").innerHTML = "";
  document.getElementById("simonStatus").textContent = "";

  // Start showing instructions one by one
  showNextInstruction();
}

function showNextInstruction() {
  if (simonGame.currentInstructionIndex >= simonGame.currentSequence.length) {
    // All instructions shown, now ask for space press
    const instruction = document.getElementById("simonInstruction");
    instruction.textContent =
      "Press SPACE when you have remembered the sequence";
    instruction.style.color = "#b8d3a7";
    simonGame.stage = "waitingForSpace";
    return;
  }

  const currentKey =
    simonGame.currentSequence[simonGame.currentInstructionIndex];
  const instruction = document.getElementById("simonInstruction");

  if (simonGame.isComputerSays) {
    instruction.textContent = `Computer says press "${currentKey.toUpperCase()}"`;
    instruction.style.color = "#8fb889";
  } else {
    instruction.textContent = `Press "${currentKey.toUpperCase()}"`;
    instruction.style.color = "#ff8888";
  }

  // Don't show any visual keys - only the spoken instruction

  simonGame.currentInstructionIndex++;

  // Show next instruction after 1.5 seconds
  simonGame.instructionTimer = setTimeout(() => {
    showNextInstruction();
  }, 1500);
}

function updateSimonAnimation() {
  if (currentScreen !== "game3") {
    if (simonAnimationFrame) {
      cancelAnimationFrame(simonAnimationFrame);
      simonAnimationFrame = null;
    }
    return;
  }

  // Use the fixed animation frame set at the start of the round
  const frameStr = simonGame.animationFrame.toString().padStart(5, "0");
  const imagePath = `assets/blender/animation/rerender/DISSOLVE0001_${frameStr}.png`;

  const animationDiv = document.getElementById("simonAnimation");
  if (animationDiv) {
    animationDiv.style.backgroundImage = `url(${imagePath})`;
    animationDiv.style.backgroundSize = "contain";
    animationDiv.style.backgroundRepeat = "no-repeat";
    animationDiv.style.backgroundPosition = "center";
  }

  // Continue animation loop but don't change frame during round
  simonAnimationFrame = requestAnimationFrame(updateSimonAnimation);
}

function startInputPhase() {
  simonGame.stage = "input";
  document.getElementById("simonInstruction").textContent =
    "Now type the sequence you remember!";
  document.getElementById("simonInstruction").style.color = "#b8d3a7";
  document.getElementById("simonStatus").textContent =
    "Waiting for your input...";
  document.getElementById("simonStatus").style.color = "#b8d3a7";
  simonGame.keyListenerActive = true;
  simonGame.userInput = [];
}

function checkSimonAnswer() {
  simonGame.keyListenerActive = false;

  // Clear any remaining timers
  if (simonGame.instructionTimer) {
    clearTimeout(simonGame.instructionTimer);
    simonGame.instructionTimer = null;
  }

  const correct = simonGame.userInput.every(
    (key, index) => key === simonGame.currentSequence[index]
  );

  let isValidAnswer = false;

  if (simonGame.isComputerSays && correct) {
    // Correct when computer says
    isValidAnswer = true;
    document.getElementById("simonStatus").textContent = "Correct! Well done!";
    document.getElementById("simonStatus").style.color = "#44ff44";
    adjustDecay(5);
  } else if (!simonGame.isComputerSays && simonGame.userInput.length === 0) {
    // Correct when computer doesn't say (should not press anything)
    isValidAnswer = true;
    document.getElementById("simonStatus").textContent =
      "Correct! You didn't follow the wrong instruction!";
    document.getElementById("simonStatus").style.color = "#44ff44";
    adjustDecay(5);
  } else if (!simonGame.isComputerSays && simonGame.userInput.length > 0) {
    // Wrong: followed instruction when computer didn't say
    document.getElementById("simonStatus").textContent =
      "Wrong! Computer didn't say to do that!";
    document.getElementById("simonStatus").style.color = "#ff4444";
    adjustDecay(-5);
  } else {
    // Wrong answer when computer said to do it
    document.getElementById("simonStatus").textContent =
      "Wrong sequence! Try again!";
    document.getElementById("simonStatus").style.color = "#ff4444";
    adjustDecay(-5);
  }

  // Start new round after delay
  setTimeout(() => {
    startSimonRound();
  }, 2500);
}

// Cleanup function for when leaving Simon Says
function cleanupSimonGame() {
  if (simonGame && simonGame.instructionTimer) {
    clearTimeout(simonGame.instructionTimer);
    simonGame.instructionTimer = null;
  }
  if (simonAnimationFrame) {
    cancelAnimationFrame(simonAnimationFrame);
    simonAnimationFrame = null;
  }
}

// Handle keyboard input for Simon Says
document.addEventListener("keydown", (e) => {
  if (currentScreen !== "game3" || !simonGame) return;

  // Handle space key for starting input phase
  if (e.key === " " && simonGame.stage === "waitingForSpace") {
    e.preventDefault();
    startInputPhase();
    return;
  }

  // Handle letter keys during input phase
  if (simonGame.stage === "input" && simonGame.keyListenerActive) {
    if (e.key.match(/[a-z]/i)) {
      const key = e.key.toLowerCase();
      simonGame.userInput.push(key);

      // Update status to show what they've typed
      const typedKeys = simonGame.userInput
        .map((k) => k.toUpperCase())
        .join(" ");
      document.getElementById(
        "simonStatus"
      ).textContent = `You typed: ${typedKeys}`;

      // Check if sequence is complete
      if (simonGame.userInput.length === simonGame.currentSequence.length) {
        setTimeout(() => checkSimonAnswer(), 500);
      }
    }
  }

  // Handle wrong situation - if computer didn't say, but they're typing
  if (
    simonGame.stage === "input" &&
    !simonGame.isComputerSays &&
    simonGame.keyListenerActive
  ) {
    if (e.key.match(/[a-z]/i)) {
      // They typed something when computer didn't say - immediate wrong
      setTimeout(() => checkSimonAnswer(), 100);
    }
  }
});
