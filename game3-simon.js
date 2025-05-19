// Game 3: Simon Says - Rewritten to match Python version
let simonGame = null;
let simonAnimationFrame = null;

function initializeSimonGame() {
  simonGame = {
    // Game states
    SHOWING_SEQUENCE: 0,
    WAITING_FOR_PLAYER: 1,
    SHOWING_RESULT: 2,

    // Current state and data
    state: 0, // Start with showing sequence
    sequence: [], // List of sequence items (key and whether player should press)
    playerKeys: [], // Keys the player has pressed
    expectedPlayerKeys: [], // Keys the player SHOULD press (only "Computer says" ones)
    sequenceIndex: 0,
    nextItemTime: 0,
    sequenceDelay: 0.8, // Seconds between keys in sequence
    level: 1,
    score: 0,

    // For timeout after player input
    lastKeyTime: 0,
    playerTimeout: 3.0, // Seconds to wait after last key press
    isTimeoutActive: false,

    // Animation frame tracking
    currentFrame: 10000, // Starting frame index (10000)
    totalFrames: 11381, // Ending frame index (11381)
    frameRange: 1381, // Total number of frames in animation sequence (11381-10000)
    targetFrame: 10000, // Target frame to animate towards
    animationSpeed: 300, // Speed of frame transition (lower = faster)
    lastFrameTime: 0, // Last time the frame was updated,

    // Instructions
    correctPrefix: "Computer says press",
    wrongPrefix: "Press",
    currentInstruction: "",

    // Result messaging
    resultMessage: "",
    resultDisplayTime: 0,
    resultDuration: 1.5, // How long to show result message

    // Decay adjustment amounts
    correctDecayBonus: 5.0,
    wrongDecayPenalty: -5.0,

    // Map decay level to animation frame
    // 100% decay = frame 10000 (start of animation)
    // 0% decay = frame 11381 (end of animation)
    decayToFrame: function (decayLevel) {
      return Math.floor(10000 + (1 - decayLevel / 100) * this.frameRange);
    },
  };

  // Available keys for Simon Says
  simonGame.keys = [
    {
      key: "w",
      keyCode: 87,
      name: "W",
      color: "#FF0000",
      isLit: false,
      litTime: 0,
      litDuration: 0.5,
    },
    {
      key: "a",
      keyCode: 65,
      name: "A",
      color: "#00FF00",
      isLit: false,
      litTime: 0,
      litDuration: 0.5,
    },
    {
      key: "s",
      keyCode: 83,
      name: "S",
      color: "#0000FF",
      isLit: false,
      litTime: 0,
      litDuration: 0.5,
    },
    {
      key: "d",
      keyCode: 68,
      name: "D",
      color: "#FFFF00",
      isLit: false,
      litTime: 0,
      litDuration: 0.5,
    },
  ];

  // Create mapping of key codes to indices
  simonGame.keyMap = {};
  simonGame.keys.forEach((key, index) => {
    simonGame.keyMap[key.keyCode] = index;
    simonGame.keyMap[key.key] = index;
  });

  // Set up back button event listeners properly
  const backButton = document.querySelector("#game3 .back-button");
  if (backButton) {
    // Use multiple approaches to ensure it works
    // backButton.removeEventListener("click", handleBackButton);
    backButton.removeEventListener("click", goToMain);

    backButton.addEventListener("click", function (e) {
      console.log("Simon Says Back button clicked");
      cleanupSimonGame();
      goToMain();
    });

    // Also set the direct onclick property
    backButton.onclick = function (e) {
      console.log("Simon Says back button clicked (from onclick)");
      cleanupSimonGame();
      goToMain();
      return false;
    };

    // Ensure it has the correct HTML attributes
    backButton.setAttribute(
      "onclick",
      "cleanupSimonGame(); goToMain(); return false;"
    );
  }

  // Initialize animation with current decay level
  simonGame.targetFrame = simonGame.decayToFrame(window.decayLevel);
  simonGame.currentFrame = simonGame.targetFrame;
  simonGame.lastFrameTime = Date.now();

  // Start new level
  startNewLevel();
  updateSimonAnimation();
}

function startNewLevel(isReset = false) {
  // Reset level and score if needed
  if (isReset) {
    simonGame.level = 1;
    simonGame.score = 0;
  }

  // Generate sequence for this level
  simonGame.sequence = [];
  simonGame.expectedPlayerKeys = [];

  // Sequence length based on level (minimum 3 items)
  const sequenceLength = Math.max(3, simonGame.level + 2);

  for (let i = 0; i < sequenceLength; i++) {
    // Random key index
    const keyIdx = Math.floor(Math.random() * simonGame.keys.length);
    // 70% chance of "Computer says" (player should press)
    const shouldPress = Math.random() < 0.7;

    // Add to sequence
    simonGame.sequence.push({
      keyIdx: keyIdx,
      shouldPress: shouldPress,
    });

    // If this is a "Computer says" item, add to expected keys
    if (shouldPress) {
      simonGame.expectedPlayerKeys.push(keyIdx);
    }
  }

  // Ensure there's at least one key to press
  if (
    simonGame.expectedPlayerKeys.length === 0 &&
    simonGame.sequence.length > 0
  ) {
    // Convert the first item to "Computer says"
    simonGame.sequence[0].shouldPress = true;
    simonGame.expectedPlayerKeys.push(simonGame.sequence[0].keyIdx);
  }

  // Reset player keys and sequence index
  simonGame.playerKeys = [];
  simonGame.sequenceIndex = 0;

  // Set state to showing sequence
  simonGame.state = simonGame.SHOWING_SEQUENCE;
  simonGame.nextItemTime = Date.now() + 500; // Start after 0.5s delay

  // Clear instruction
  simonGame.currentInstruction = "Watch the sequence...";

  // Debug info
  console.log("New level " + simonGame.level + " sequence created:");
  simonGame.sequence.forEach((item, i) => {
    const prefix = item.shouldPress ? "Computer says" : "Press only";
    console.log(`  ${i + 1}: ${prefix} ${simonGame.keys[item.keyIdx].name}`);
  });
  console.log(
    "Expected player keys:",
    simonGame.expectedPlayerKeys.map((idx) => simonGame.keys[idx].name)
  );

  // Clear the sequence display
  const sequenceDisplay = document.getElementById("simonSequence");
  if (sequenceDisplay) {
    sequenceDisplay.innerHTML = "";
  }

  // Clear status
  document.getElementById("simonStatus").textContent = "";
}

function updateSimonAnimation() {
  if (currentScreen !== "game3") {
    if (simonAnimationFrame) {
      cancelAnimationFrame(simonAnimationFrame);
      simonAnimationFrame = null;
    }
    return;
  }

  // Continue the animation loop
  simonAnimationFrame = requestAnimationFrame(updateSimonAnimation);

  // Update all keys (check if any lit keys need to be turned off)
  const currentTime = Date.now();
  simonGame.keys.forEach((key) => {
    if (key.isLit && currentTime - key.litTime > key.litDuration * 1000) {
      key.isLit = false;
    }
  });

  // Handle game state updates
  if (simonGame.state === simonGame.SHOWING_SEQUENCE) {
    // Showing the sequence to the player
    if (currentTime >= simonGame.nextItemTime) {
      if (simonGame.sequenceIndex < simonGame.sequence.length) {
        // Show next item in sequence
        const sequenceItem = simonGame.sequence[simonGame.sequenceIndex];

        // Light up the key
        lightUpKey(sequenceItem.keyIdx);

        // Show instruction with appropriate prefix
        const prefix = sequenceItem.shouldPress
          ? simonGame.correctPrefix
          : simonGame.wrongPrefix;
        const keyName = simonGame.keys[sequenceItem.keyIdx].name;
        simonGame.currentInstruction = `${prefix} ${keyName}`;

        // Update instruction display
        document.getElementById("simonInstruction").textContent =
          simonGame.currentInstruction;
        document.getElementById("simonInstruction").style.color =
          sequenceItem.shouldPress ? "#8fb889" : "#ff8888";

        // Add key to sequence display
        const sequenceDisplay = document.getElementById("simonSequence");
        const keyElement = document.createElement("div");
        keyElement.className = "key-display";
        keyElement.textContent = keyName;
        keyElement.style.borderColor = sequenceItem.shouldPress
          ? "#8fb889"
          : "#ff8888";
        sequenceDisplay.appendChild(keyElement);

        // Highlight the key briefly
        setTimeout(() => {
          keyElement.style.backgroundColor = sequenceItem.shouldPress
            ? "#8fb889"
            : "#ff8888";
          keyElement.style.color = "#000";

          setTimeout(() => {
            keyElement.style.backgroundColor = "#333";
            keyElement.style.color = "#b8d3a7";
          }, 500);
        }, 300);

        // Move to next item
        simonGame.sequenceIndex++;
        simonGame.nextItemTime = currentTime + simonGame.sequenceDelay * 1000;
      } else {
        // Finished showing sequence
        simonGame.state = simonGame.WAITING_FOR_PLAYER;
        simonGame.currentInstruction =
          "Your turn! Press only the keys that had 'Computer says'";
        document.getElementById("simonInstruction").textContent =
          simonGame.currentInstruction;
        document.getElementById("simonInstruction").style.color = "#b8d3a7";
        simonGame.isTimeoutActive = false;

        // Add space instruction if there are expected keys
        if (simonGame.expectedPlayerKeys.length > 0) {
          document.getElementById("simonStatus").textContent =
            "Waiting for your input... Press SPACE when done.";
        } else {
          document.getElementById("simonStatus").textContent =
            "Waiting for your input... (Hint: Were there any 'Computer says' instructions?)";
        }
        document.getElementById("simonStatus").style.color = "#b8d3a7";

        // Clear the sequence display
        document.getElementById("simonSequence").innerHTML = "";
      }
    }
  } else if (simonGame.state === simonGame.WAITING_FOR_PLAYER) {
    // Check for timeout after last key press
    if (
      simonGame.isTimeoutActive &&
      currentTime >= simonGame.lastKeyTime + simonGame.playerTimeout * 1000
    ) {
      checkPlayerCompletion();
      simonGame.isTimeoutActive = false;
    }

    // If timeout is active, show progress bar
    if (simonGame.isTimeoutActive) {
      const elapsed = (currentTime - simonGame.lastKeyTime) / 1000;
      const remaining = Math.max(0, simonGame.playerTimeout - elapsed);
      const percentage = (remaining / simonGame.playerTimeout) * 100;

      // Update status text to show keys pressed
      const pressedKeys = simonGame.playerKeys
        .map((idx) => simonGame.keys[idx].name)
        .join(" ");
      document.getElementById(
        "simonStatus"
      ).textContent = `Keys pressed: ${pressedKeys} | Time left: ${remaining.toFixed(
        1
      )}s`;
    }
  } else if (simonGame.state === simonGame.SHOWING_RESULT) {
    // Showing result message
    if (
      currentTime >=
      simonGame.resultDisplayTime + simonGame.resultDuration * 1000
    ) {
      // Move to next level or restart
      if (simonGame.resultMessage.includes("Correct")) {
        // Start next level
        simonGame.level += 1;
        startNewLevel(false);
      } else {
        // Restart with level 1
        startNewLevel(true);
      }
    }
  }

  // Update target frame based on current decay level
  simonGame.targetFrame = simonGame.decayToFrame(window.decayLevel);

  const elapsed = currentTime - simonGame.lastFrameTime;

  // Only update animation frame at the specified interval
  if (elapsed > simonGame.animationSpeed) {
    simonGame.lastFrameTime = currentTime;

    // Smoothly animate towards target frame
    if (simonGame.currentFrame < simonGame.targetFrame) {
      // Moving forward in animation (increasing decay)
      simonGame.currentFrame = Math.min(
        simonGame.targetFrame,
        simonGame.currentFrame +
          Math.max(
            1,
            Math.floor((simonGame.targetFrame - simonGame.currentFrame) / 10)
          )
      );
    } else if (simonGame.currentFrame > simonGame.targetFrame) {
      // Moving backward in animation (decreasing decay)
      simonGame.currentFrame = Math.max(
        simonGame.targetFrame,
        simonGame.currentFrame -
          Math.max(
            1,
            Math.floor((simonGame.currentFrame - simonGame.targetFrame) / 10)
          )
      );
    }

    // Format frame number correctly
    const frameNum = Math.min(
      11381,
      Math.max(10000, Math.floor(simonGame.currentFrame))
    );
    const imagePath = `assets/blender/animation/rerender/DISSOLVE0001_${frameNum}.png`;

    // Update the animation display
    const animationDiv = document.getElementById("simonAnimation");
    if (animationDiv) {
      animationDiv.style.backgroundImage = `url(${imagePath})`;
      animationDiv.style.backgroundSize = "contain";
      animationDiv.style.backgroundRepeat = "no-repeat";
      animationDiv.style.backgroundPosition = "center";
    }

    // Adjust animation speed based on decay level change rate
    const decayChangeRate = Math.abs(
      simonGame.targetFrame - simonGame.currentFrame
    );
    if (decayChangeRate > 1000) {
      // Fast change - speed up animation
      simonGame.animationSpeed = 50; // Very fast
    } else if (decayChangeRate > 500) {
      simonGame.animationSpeed = 100; // Fast
    } else if (decayChangeRate > 100) {
      simonGame.animationSpeed = 150; // Medium
    } else {
      simonGame.animationSpeed = 300; // Normal speed
    }
  }
}

function lightUpKey(keyIdx) {
  if (keyIdx >= 0 && keyIdx < simonGame.keys.length) {
    simonGame.keys[keyIdx].isLit = true;
    simonGame.keys[keyIdx].litTime = Date.now();

    // Display the key press visually in UI
    const keyElement = document.createElement("div");
    keyElement.className = "key-display";
    keyElement.textContent = simonGame.keys[keyIdx].name;
    keyElement.style.backgroundColor = simonGame.keys[keyIdx].color;
    keyElement.style.color = "#000";

    // Add flash effect
    setTimeout(() => {
      keyElement.style.backgroundColor = "#333";
      keyElement.style.color = "#b8d3a7";
    }, 300);
  }
}

function checkPlayerCompletion() {
  // If there are no expected keys
  if (simonGame.expectedPlayerKeys.length === 0) {
    if (simonGame.playerKeys.length === 0) {
      // Correct - player didn't press any keys
      simonGame.resultMessage = "Correct! You correctly didn't press any keys.";
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#44ff44";
      adjustDecay(simonGame.correctDecayBonus);
    } else {
      // Wrong - player pressed keys when they shouldn't have
      simonGame.resultMessage = "Wrong! You shouldn't have pressed any keys.";
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#ff4444";
      adjustDecay(simonGame.wrongDecayPenalty);
    }
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    return;
  }

  // If player pressed fewer keys than expected
  if (simonGame.playerKeys.length < simonGame.expectedPlayerKeys.length) {
    // Check if the keys they did press were correct
    let correctSoFar = true;
    for (let i = 0; i < simonGame.playerKeys.length; i++) {
      if (simonGame.playerKeys[i] !== simonGame.expectedPlayerKeys[i]) {
        correctSoFar = false;
        break;
      }
    }

    if (correctSoFar) {
      // They pressed the right keys, just not all of them
      const missedKeys =
        simonGame.expectedPlayerKeys.length - simonGame.playerKeys.length;
      simonGame.resultMessage = `Incorrect! You missed ${missedKeys} key(s).`;
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#ff4444";
      adjustDecay(simonGame.wrongDecayPenalty / 2); // Smaller penalty
    } else {
      // They pressed the wrong keys
      simonGame.resultMessage = "Wrong! You pressed the wrong keys.";
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#ff4444";
      adjustDecay(simonGame.wrongDecayPenalty);
    }
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    return;
  }

  // If player pressed exactly the right keys
  if (simonGame.playerKeys.length === simonGame.expectedPlayerKeys.length) {
    let allCorrect = true;
    for (let i = 0; i < simonGame.playerKeys.length; i++) {
      if (simonGame.playerKeys[i] !== simonGame.expectedPlayerKeys[i]) {
        allCorrect = false;
        break;
      }
    }

    if (allCorrect) {
      // Player got all keys correct
      simonGame.score += simonGame.expectedPlayerKeys.length * 10;
      simonGame.resultMessage = "Correct! Level complete!";
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#44ff44";
      adjustDecay(simonGame.correctDecayBonus);
    } else {
      // Player pressed wrong keys
      simonGame.resultMessage = "Wrong! You pressed the wrong keys.";
      document.getElementById("simonStatus").textContent =
        simonGame.resultMessage;
      document.getElementById("simonStatus").style.color = "#ff4444";
      adjustDecay(simonGame.wrongDecayPenalty);
    }
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    return;
  }

  // If player pressed too many keys
  if (simonGame.playerKeys.length > simonGame.expectedPlayerKeys.length) {
    simonGame.resultMessage = "Wrong! You pressed too many keys.";
    document.getElementById("simonStatus").textContent =
      simonGame.resultMessage;
    document.getElementById("simonStatus").style.color = "#ff4444";
    adjustDecay(simonGame.wrongDecayPenalty);
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
  }
}

function handleKeyPress(keyCode, key) {
  // Only process key presses when waiting for player input
  if (simonGame.state !== simonGame.WAITING_FOR_PLAYER) {
    return;
  }

  // Special case for SPACE key: player indicates they're done
  if (keyCode === 32 || key === " ") {
    console.log("Player pressed SPACE to indicate completion");
    checkPlayerCompletion();
    return;
  }

  // Map key to our key index
  const keyIdx =
    simonGame.keyMap[keyCode] || simonGame.keyMap[key.toLowerCase()];
  if (keyIdx === undefined) {
    return; // Not one of our Simon keys
  }

  // Light up the key
  lightUpKey(keyIdx);

  // Add to player keys
  simonGame.playerKeys.push(keyIdx);

  // Update last key time and activate timeout
  simonGame.lastKeyTime = Date.now();
  simonGame.isTimeoutActive = true;

  // Display the key in the sequence UI
  const sequenceDisplay = document.getElementById("simonSequence");
  const keyElement = document.createElement("div");
  keyElement.className = "key-display";
  keyElement.textContent = simonGame.keys[keyIdx].name;
  keyElement.style.borderColor = "#ffffff";
  sequenceDisplay.appendChild(keyElement);

  // Highlight the key briefly
  keyElement.style.backgroundColor = "#ffffff";
  keyElement.style.color = "#000";
  setTimeout(() => {
    keyElement.style.backgroundColor = "#333";
    keyElement.style.color = "#b8d3a7";
  }, 300);

  // Log for debugging
  const currentKeyIndex = simonGame.playerKeys.length - 1;
  console.log(`Player pressed key: ${simonGame.keys[keyIdx].name}`);
  console.log(
    `Current index: ${currentKeyIndex}, Total expected: ${simonGame.expectedPlayerKeys.length}`
  );

  // Update keys pressed display
  const pressedKeys = simonGame.playerKeys
    .map((idx) => simonGame.keys[idx].name)
    .join(" ");
  document.getElementById(
    "simonStatus"
  ).textContent = `Keys pressed: ${pressedKeys}`;

  // Check if there are expected keys to press
  if (simonGame.expectedPlayerKeys.length === 0) {
    simonGame.resultMessage =
      "Wrong! There were no keys to press in this sequence.";
    document.getElementById("simonStatus").textContent =
      simonGame.resultMessage;
    document.getElementById("simonStatus").style.color = "#ff4444";
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    adjustDecay(simonGame.wrongDecayPenalty);
    return;
  }

  // Check if the player has pressed too many keys
  if (simonGame.playerKeys.length > simonGame.expectedPlayerKeys.length) {
    simonGame.resultMessage = "Wrong! You pressed too many keys.";
    document.getElementById("simonStatus").textContent =
      simonGame.resultMessage;
    document.getElementById("simonStatus").style.color = "#ff4444";
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    adjustDecay(simonGame.wrongDecayPenalty);
    return;
  }

  // Check if the current key is correct
  const currentExpectedKey = simonGame.expectedPlayerKeys[currentKeyIndex];
  if (keyIdx !== currentExpectedKey) {
    // Wrong key pressed
    console.log(
      `Wrong key! Expected ${simonGame.keys[currentExpectedKey].name} but got ${simonGame.keys[keyIdx].name}`
    );
    simonGame.resultMessage = `Wrong! You pressed ${simonGame.keys[keyIdx].name} instead of ${simonGame.keys[currentExpectedKey].name}.`;
    document.getElementById("simonStatus").textContent =
      simonGame.resultMessage;
    document.getElementById("simonStatus").style.color = "#ff4444";
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    adjustDecay(simonGame.wrongDecayPenalty);
    return;
  } else {
    console.log(`Correct key: ${simonGame.keys[keyIdx].name}`);
    // Give a small bonus for each correct key
    adjustDecay(1.0);
  }

  // If player has pressed all expected keys
  if (simonGame.playerKeys.length === simonGame.expectedPlayerKeys.length) {
    // Sequence completed correctly
    simonGame.score += simonGame.expectedPlayerKeys.length * 10;
    simonGame.resultMessage = "Correct! Level complete!";
    document.getElementById("simonStatus").textContent =
      simonGame.resultMessage;
    document.getElementById("simonStatus").style.color = "#44ff44";
    simonGame.resultDisplayTime = Date.now();
    simonGame.state = simonGame.SHOWING_RESULT;
    adjustDecay(simonGame.correctDecayBonus);
  }
}

// Cleanup function for when leaving Simon Says
function cleanupSimonGame() {
  console.log("Cleaning up Simon Says game");
  if (simonAnimationFrame) {
    cancelAnimationFrame(simonAnimationFrame);
    simonAnimationFrame = null;
  }
}

// Process keyboard input for Simon Says
document.addEventListener("keydown", (e) => {
  if (currentScreen !== "game3" || !simonGame) return;

  // Pass both keyCode and key to handle different browser implementations
  handleKeyPress(e.keyCode, e.key);
});
