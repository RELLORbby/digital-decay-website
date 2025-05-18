// Game 3: Simon Says
let simonGame = null;
let simonAnimationFrame = null;

function initializeSimonGame() {
  simonGame = {
    // Game states
    SHOWING_SEQUENCE: "showing",
    WAITING_FOR_PLAYER: "waiting",
    SHOWING_RESULT: "result",

    // Current state and data
    sequences: [
      ["w", "a", "s"],
      ["q", "e", "r"],
      ["a", "s", "d", "f"],
      ["z", "x", "c"],
      ["w", "w", "s", "s"],
      ["a", "d", "a", "d"],
    ],
    currentSequence: [],
    currentSequenceWithInstructions: [], // Store if each item is "Computer says" or not
    userInput: [],
    expectedUserInput: [], // Keys the user SHOULD press (only "Computer says" ones)
    stage: "showing", // Current game state
    currentInstructionIndex: 0,
    instructionTimer: null,
    level: 1,
    score: 0,

    // Animation frame tracking
    animationFrame: 10000, // Fixed animation frame based on decay level
  };

  // Set up back button event listener
  const backButton = document.querySelector("#game3 .back-button");
  if (backButton) {
    backButton.addEventListener("click", handleBackButton);
  }

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

  // Reset game state
  simonGame.userInput = [];
  simonGame.expectedUserInput = [];
  simonGame.currentSequenceWithInstructions = [];
  simonGame.stage = simonGame.SHOWING_SEQUENCE;
  simonGame.currentInstructionIndex = 0;

  // Set fixed animation frame based on decay level (but don't change it during the round)
  simonGame.animationFrame =
    10000 + Math.floor((1 - window.decayLevel / 100) * 1381);

  // Clear previous displays
  document.getElementById("simonSequence").innerHTML = "";
  document.getElementById("simonStatus").textContent = "";

  console.log("Starting new Simon Says round");
  console.log("Current sequence:", simonGame.currentSequence);

  // For each key in the sequence, decide if it's "Computer says" or not
  for (let i = 0; i < simonGame.currentSequence.length; i++) {
    // 70% chance of "Computer says" (player should follow)
    const isComputerSays = Math.random() < 0.7;
    simonGame.currentSequenceWithInstructions.push({
      key: simonGame.currentSequence[i],
      isComputerSays: isComputerSays,
    });

    // If it's "Computer says", add to expected inputs
    if (isComputerSays) {
      simonGame.expectedUserInput.push(simonGame.currentSequence[i]);
    }
  }

  // Make sure there's at least one key to press if all were "Press" by chance
  if (
    simonGame.expectedUserInput.length === 0 &&
    simonGame.currentSequence.length > 0
  ) {
    // Convert the first item to "Computer says"
    simonGame.currentSequenceWithInstructions[0].isComputerSays = true;
    simonGame.expectedUserInput.push(simonGame.currentSequence[0]);
  }

  console.log(
    "Sequence with instructions:",
    simonGame.currentSequenceWithInstructions
  );
  console.log("Expected user input:", simonGame.expectedUserInput);

  // Start showing instructions one by one
  showNextInstruction();
}

function showNextInstruction() {
  if (
    simonGame.currentInstructionIndex >=
    simonGame.currentSequenceWithInstructions.length
  ) {
    // All instructions shown, now ask for space press
    const instruction = document.getElementById("simonInstruction");
    instruction.textContent =
      "Press SPACE when you have remembered the sequence";
    instruction.style.color = "#b8d3a7";
    simonGame.stage = "waitingForSpace";
    return;
  }

  const currentItem =
    simonGame.currentSequenceWithInstructions[
      simonGame.currentInstructionIndex
    ];
  const currentKey = currentItem.key;
  const isComputerSays = currentItem.isComputerSays;

  const instruction = document.getElementById("simonInstruction");

  if (isComputerSays) {
    instruction.textContent = `Computer says press "${currentKey.toUpperCase()}"`;
    instruction.style.color = "#8fb889"; // Green for "Computer says"
  } else {
    instruction.textContent = `Press "${currentKey.toUpperCase()}"`;
    instruction.style.color = "#ff8888"; // Red for regular "Press" (to be ignored)
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
  // This matches the Python version where animation frame is synced to decay level
  // but doesn't change during the round
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
  simonGame.stage = simonGame.WAITING_FOR_PLAYER;

  // Update UI text
  document.getElementById("simonInstruction").textContent =
    "Now type the sequence you remember!";
  document.getElementById("simonInstruction").style.color = "#b8d3a7";

  document.getElementById("simonStatus").textContent =
    "Waiting for your input...";
  document.getElementById("simonStatus").style.color = "#b8d3a7";

  // Reset input tracking
  simonGame.userInput = [];

  // Add note about expected keys for debugging
  console.log(
    "Starting input phase. Expected keys:",
    simonGame.expectedUserInput
  );

  // Add instruction about space key
  if (simonGame.expectedUserInput.length > 0) {
    document.getElementById("simonStatus").textContent +=
      " Press SPACE when done.";
  } else {
    document.getElementById("simonStatus").textContent +=
      " (Hint: Were there any 'Computer says' instructions?)";
  }
}

function checkSimonAnswer() {
  // Clear any remaining timers
  if (simonGame.instructionTimer) {
    clearTimeout(simonGame.instructionTimer);
    simonGame.instructionTimer = null;
  }

  console.log("Checking Simon answer...");
  console.log("User input:", simonGame.userInput);
  console.log("Expected input:", simonGame.expectedUserInput);

  // Case 1: No keys expected (no "Computer says" instructions)
  if (simonGame.expectedUserInput.length === 0) {
    if (simonGame.userInput.length === 0) {
      // Correct - user didn't press any keys when none were expected
      document.getElementById("simonStatus").textContent =
        "Correct! You didn't follow the wrong instructions!";
      document.getElementById("simonStatus").style.color = "#44ff44";
      adjustDecay(5); // Significant bonus for correct answer
      showNextLevelMessage();
    } else {
      // Wrong - user pressed keys when they should have ignored all instructions
      document.getElementById("simonStatus").textContent =
        "Wrong! Computer didn't say to do that!";
      document.getElementById("simonStatus").style.color = "#ff4444";
      adjustDecay(-5); // Significant penalty
      showTryAgainMessage();
    }
    return;
  }

  // Case 2: Compare user input with expected input
  let isCorrect = true;

  // Check if user entered the correct number of keys
  if (simonGame.userInput.length !== simonGame.expectedUserInput.length) {
    isCorrect = false;
  } else {
    // Check if each key matches
    for (let i = 0; i < simonGame.userInput.length; i++) {
      if (simonGame.userInput[i] !== simonGame.expectedUserInput[i]) {
        isCorrect = false;
        break;
      }
    }
  }

  if (isCorrect) {
    // Correct sequence
    document.getElementById("simonStatus").textContent = "Correct! Well done!";
    document.getElementById("simonStatus").style.color = "#44ff44";
    adjustDecay(5); // Significant bonus
    showNextLevelMessage();
  } else {
    // Wrong sequence
    let message;
    if (simonGame.userInput.length < simonGame.expectedUserInput.length) {
      message = "Wrong! You missed some keys.";
    } else if (
      simonGame.userInput.length > simonGame.expectedUserInput.length
    ) {
      message = "Wrong! You pressed too many keys.";
    } else {
      message = "Wrong sequence! Try again!";
    }

    document.getElementById("simonStatus").textContent = message;
    document.getElementById("simonStatus").style.color = "#ff4444";
    adjustDecay(-5); // Significant penalty
    showTryAgainMessage();
  }
}

function showNextLevelMessage() {
  document.getElementById("simonInstruction").textContent =
    "Level complete! Next level starting soon...";
  document.getElementById("simonInstruction").style.color = "#44ff44";

  // Start new round after delay
  simonGame.stage = simonGame.SHOWING_RESULT;

  // Update level for next round
  simonGame.level += 1;

  setTimeout(() => {
    startSimonRound();
  }, 2500);
}

function showTryAgainMessage() {
  document.getElementById("simonInstruction").textContent =
    "Incorrect. Try again with a new sequence...";
  document.getElementById("simonInstruction").style.color = "#ff4444";

  // Reset to level 1 after failure
  simonGame.stage = simonGame.SHOWING_RESULT;
  simonGame.level = 1;

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

// Handle back button click - go back to main menu
function handleBackButton() {
  cleanupSimonGame();
  goToMain();
}

// Process keyboard input for Simon Says
document.addEventListener("keydown", (e) => {
  if (currentScreen !== "game3" || !simonGame) return;

  // Handle space key for starting input phase
  if (e.key === " " && simonGame.stage === "waitingForSpace") {
    e.preventDefault();
    startInputPhase();
    return;
  }

  // Handle space key for submitting answer
  if (e.key === " " && simonGame.stage === simonGame.WAITING_FOR_PLAYER) {
    e.preventDefault();
    checkSimonAnswer();
    return;
  }

  // Handle letter keys during input phase
  if (simonGame.stage === simonGame.WAITING_FOR_PLAYER) {
    if (e.key.match(/[a-z]/i)) {
      const key = e.key.toLowerCase();

      // Add key to user input
      simonGame.userInput.push(key);

      // Update status to show what they've typed
      const typedKeys = simonGame.userInput
        .map((k) => k.toUpperCase())
        .join(" ");

      document.getElementById(
        "simonStatus"
      ).textContent = `You typed: ${typedKeys}`;

      // If they've typed enough keys, auto-check the answer
      if (
        simonGame.userInput.length === simonGame.expectedUserInput.length &&
        simonGame.expectedUserInput.length > 0
      ) {
        setTimeout(() => {
          checkSimonAnswer();
        }, 500);
      }

      // If they typed something when there are no expected keys,
      // it's an immediate fail
      if (simonGame.expectedUserInput.length === 0) {
        setTimeout(() => {
          checkSimonAnswer();
        }, 500);
      }
    }
  }
});
