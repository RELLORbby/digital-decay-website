// Improved floating objects system
let floatingScene, floatingCamera, floatingRenderer;
let floating3DObjects = [];
let floatingModels = []; // Store loaded models
let floatingTimer = null;
let modelsLoaded = 0;
let totalModels = 7;

// Store floating objects state between screens
let savedObjectsState = null;

function init3DFloatingObjects() {
  const container = document.getElementById("floatingObjects");
  if (!container) {
    console.error("floatingObjects container not found");
    return;
  }

  // Clear any existing content
  container.innerHTML = "";

  // Scene setup
  floatingScene = new THREE.Scene();

  // Camera setup
  floatingCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  floatingCamera.position.z = 5;

  // Renderer setup
  floatingRenderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  floatingRenderer.setSize(window.innerWidth, window.innerHeight);
  floatingRenderer.setClearColor(0x000000, 0); // Transparent background
  container.appendChild(floatingRenderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  floatingScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 5, 5);
  floatingScene.add(directionalLight);

  // Add second light from opposite side for better illumination
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  directionalLight2.position.set(-5, -3, 10);
  floatingScene.add(directionalLight2);

  // Load all OBJ models
  if (savedObjectsState) {
    console.log("Restoring floating objects state");
    restoreFloatingObjectsState();
  } else {
    console.log("Loading new floating models");
    loadFloatingModels();
  }

  // Start animation loop
  animate3DFloatingObjects();
}

function loadFloatingModels() {
  console.log("Starting to load OBJ models...");

  for (let i = 1; i <= 7; i++) {
    const objPath = `assets/blender/objects/row${i}.obj`;
    const mtlPath = `assets/blender/objects/row${i}.mtl`;

    // Try to load MTL first, then OBJ
    const mtlLoader = new THREE.MTLLoader();

    // Function to load OBJ with or without materials
    const loadOBJ = (materials = null) => {
      const objLoader = new THREE.OBJLoader();
      if (materials) {
        objLoader.setMaterials(materials);
      }

      objLoader.load(
        objPath,
        function (object) {
          console.log(`Successfully loaded row${i}.obj`);

          // Scale and prepare the model
          const box = new THREE.Box3().setFromObject(object);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1.5 / maxDim; // Made objects bigger
          object.scale.setScalar(scale);

          // If no materials were loaded, apply default material
          if (!materials) {
            object.traverse(function (child) {
              if (child.isMesh) {
                child.material = new THREE.MeshLambertMaterial({
                  color: getColorForDecay(i - 1, 0, window.decayLevel),
                });
              }
            });
          }

          // Store the model with its row index
          const modelData = {
            model: object.clone(),
            row: i - 1,
          };
          floatingModels.push(modelData);
          modelsLoaded++;

          if (modelsLoaded === totalModels) {
            console.log("All models loaded successfully!");
            // Create initial objects
            createInitialFloatingObjects();
          }
        },
        function (progress) {
          console.log(
            `Loading row${i}.obj:`,
            (progress.loaded / progress.total) * 100 + "%"
          );
        },
        function (error) {
          console.error(`Error loading row${i}.obj:`, error);
          // Create fallback object if OBJ fails to load
          createFallbackModel(i);
        }
      );
    };

    // Try to load MTL file first
    mtlLoader.load(
      mtlPath,
      function (materials) {
        console.log(`Successfully loaded row${i}.mtl`);
        materials.preload();
        loadOBJ(materials);
      },
      function (progress) {
        // MTL loading progress
      },
      function (error) {
        console.warn(
          `MTL file not found for row${i}, loading OBJ without materials`
        );
        // Load OBJ without materials
        loadOBJ();
      }
    );
  }
}

function createFallbackModel(rowNumber) {
  console.log(`Creating fallback model for row${rowNumber}`);

  // Create different shapes for variety as fallback
  let geometry;
  switch (rowNumber % 4) {
    case 0:
      geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      break;
    case 1:
      geometry = new THREE.SphereGeometry(0.9, 8, 8);
      break;
    case 2:
      geometry = new THREE.ConeGeometry(0.9, 1.5, 8);
      break;
    default:
      geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8);
  }

  const material = new THREE.MeshLambertMaterial({
    color: getColorForDecay(rowNumber - 1, 0, window.decayLevel),
  });
  const mesh = new THREE.Mesh(geometry, material);

  const modelData = {
    model: mesh,
    row: rowNumber - 1,
  };
  floatingModels.push(modelData);
  modelsLoaded++;

  if (modelsLoaded === totalModels) {
    console.log("All models (including fallbacks) loaded!");
    // Create initial objects
    createInitialFloatingObjects();
  }
}

// Create initial objects
function createInitialFloatingObjects() {
  // Start with just 2 objects to avoid performance issues
  for (let i = 0; i < 2; i++) {
    createFloatingObject();
  }
}

function getDecayStage(decayPercent) {
  const stageIndex = Math.floor((1 - decayPercent / 100) * 5);
  return Math.max(1, Math.min(6, stageIndex + 1));
}

function createDashedLine(start, end, numDashes = 10) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  direction.normalize();

  const dashLength = length / (numDashes * 2); // Each dash + gap

  const points = [];
  let currentPos = 0;
  let drawDash = true;

  while (currentPos < length) {
    if (drawDash) {
      const startPoint = new THREE.Vector3()
        .copy(start)
        .addScaledVector(direction, currentPos);
      const endPoint = new THREE.Vector3()
        .copy(start)
        .addScaledVector(direction, Math.min(currentPos + dashLength, length));

      points.push(startPoint, endPoint);
    }

    currentPos += dashLength;
    drawDash = !drawDash;
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xffffff });
  const line = new THREE.LineSegments(geometry, material);

  return line;
}

function createFloatingObject(positionOverride = null) {
  if (floatingModels.length === 0) {
    console.log("No models available yet, waiting...");
    return null;
  }

  // Choose random model
  const modelIndex = Math.floor(Math.random() * floatingModels.length);
  const modelData = floatingModels[modelIndex];
  const model = modelData.model.clone();
  const row = modelData.row;

  // Choose random column for this instance
  const col = Math.floor(Math.random() * 13);

  // Get the current color and decay stage for this row/col combination
  const currentColor = getColorForDecay(row, col, window.decayLevel);
  const decayStage = getDecayStage(window.decayLevel);

  // Position settings
  let x, y, z;

  if (positionOverride) {
    x = positionOverride.x || 20;
    y = positionOverride.y || (Math.random() - 0.5) * 6;
    z = positionOverride.z || (Math.random() - 0.5) * 2;
  } else {
    // Start off-screen to the right
    x = 20;
    // Random Y position (constrained to visible area)
    y = (Math.random() - 0.5) * 6;
    // Random Z depth
    z = (Math.random() - 0.5) * 2;
  }

  // Position model
  model.position.set(0, 0, 0);

  // Random rotation
  const rotation = {
    x: Math.random() * Math.PI * 2,
    y: Math.random() * Math.PI * 2,
    z: Math.random() * Math.PI * 2,
  };

  model.rotation.set(rotation.x, rotation.y, rotation.z);

  // Create technical info label without background
  const infoText = createTextSprite(
    `Row: ${row + 1} Col: ${
      col + 1
    }\nColour: ${currentColor}\nDecay Stage: ${decayStage}`,
    "#ffffff",
    null // No background
  );

  // Position label consistently
  const labelOffset = new THREE.Vector3(2.5, 1.5, 0.5);
  infoText.position.copy(labelOffset);

  // Adjust the line position to match text better
  // Move line start point closer to the text, accounting for no background padding
  const lineStart = new THREE.Vector3(
    labelOffset.x - 1.4, // Left side of text
    labelOffset.y - 0.25, // Raised position - 0.45 → 0.25 to match text without padding
    labelOffset.z
  );

  // Create line ending point
  const lineEnd = new THREE.Vector3(
    lineStart.x - 1.0 * Math.cos(Math.PI / 4),
    lineStart.y - 1.0 * Math.sin(Math.PI / 4),
    lineStart.z
  );

  // Create dashed line
  const dashedLine = createDashedLine(lineStart, lineEnd);

  // Create a group to hold model, label and line
  const objectGroup = new THREE.Group();
  objectGroup.add(model);
  objectGroup.add(infoText);
  objectGroup.add(dashedLine);

  // Position the group in 3D space
  objectGroup.position.set(x, y, z);

  // Add to scene
  floatingScene.add(objectGroup);

  // Create object data structure
  const floatingObject = {
    group: objectGroup,
    model: model,
    textSprite: infoText,
    dashedLine: dashedLine,
    row: row,
    col: col,
    color: currentColor,
    decayStage: decayStage,
    position: { x, y, z },
    rotation: rotation,
    // Use slower speed for smoother animation
    speed: { x: -0.06 - Math.random() * 0.03 }, // Slightly randomized speed
    rotationSpeed: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    },
    labelOffset: labelOffset,
    lineStart: lineStart, // Store for later updates
    lineEnd: lineEnd,
  };

  floating3DObjects.push(floatingObject);
  return floatingObject;
}

function createTextSprite(text, color = "#ffffff", backgroundColor = null) {
  // Create a canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 192; // Taller for multiple lines

  // Clear canvas with transparent background
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Only draw background if requested (we'll set it to null by default)
  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Set text properties
  context.font = 'Bold 24px "JetBrains Mono", "Courier New", monospace';
  context.fillStyle = color;
  context.textAlign = "left";

  // Draw multi-line text
  const lines = text.split("\n");
  const lineHeight = 40;
  const startY = 40;
  const leftPadding = 20;

  lines.forEach((line, index) => {
    context.fillText(line, leftPadding, startY + index * lineHeight);
  });

  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  // Create sprite material with transparency
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);

  // Set consistent size
  sprite.scale.set(3, 1.1, 1);

  return sprite;
}

function animate3DFloatingObjects() {
  requestAnimationFrame(animate3DFloatingObjects);

  if (currentScreen !== "mainScreen" || !floatingRenderer) return;

  // Update floating objects
  for (let i = floating3DObjects.length - 1; i >= 0; i--) {
    const obj = floating3DObjects[i];

    // Move left based on speed
    obj.group.position.x += obj.speed.x;

    // Update position data for state saving
    obj.position.x = obj.group.position.x;

    // Rotate the model
    obj.model.rotation.x += obj.rotationSpeed.x;
    obj.model.rotation.y += obj.rotationSpeed.y;
    obj.model.rotation.z += obj.rotationSpeed.z;

    // Update rotation data for state saving
    obj.rotation.x = obj.model.rotation.x;
    obj.rotation.y = obj.model.rotation.y;
    obj.rotation.z = obj.model.rotation.z;

    // Keep text facing camera
    obj.textSprite.lookAt(floatingCamera.position);

    updateTextAndLine(obj);

    // Update the text if decay level changes
    /* const newColor = getColorForDecay(obj.row, obj.col, window.decayLevel);
    const newDecayStage = getDecayStage(window.decayLevel);

    if (newColor !== obj.color || newDecayStage !== obj.decayStage) {
      obj.color = newColor;
      obj.decayStage = newDecayStage;

      // Update text with new color/stage info
      const newText = `Row: ${obj.row + 1} Col: ${
        obj.col + 1
      }\nColour: ${newColor}\nDecay Stage: ${newDecayStage}`;

      // Create new text sprite
      const newTextSprite = createTextSprite(newText, "#ffffff");
      newTextSprite.position.copy(obj.labelOffset);
      newTextSprite.lookAt(floatingCamera.position);

      // Replace old sprite with new one
      obj.group.remove(obj.textSprite);
      obj.group.add(newTextSprite);

      // Clean up old sprite texture
      if (obj.textSprite.material.map) {
        obj.textSprite.material.map.dispose();
      }
      obj.textSprite.material.dispose();

      // Update reference
      obj.textSprite = newTextSprite;
    }*/

    // Remove if off-screen left
    if (obj.group.position.x < -8) {
      floatingScene.remove(obj.group);

      // Clean up textures and geometries
      if (obj.textSprite.material.map) {
        obj.textSprite.material.map.dispose();
      }
      obj.textSprite.material.dispose();

      if (obj.dashedLine.geometry) {
        obj.dashedLine.geometry.dispose();
      }
      if (obj.dashedLine.material) {
        obj.dashedLine.material.dispose();
      }

      floating3DObjects.splice(i, 1);

      // Random chance to create a new object to replace the removed one
      if (Math.random() < 0.7 && floating3DObjects.length < 6) {
        createFloatingObject();
      }
    }
  }

  // Occasionally spawn new objects (with a lower chance)
  if (Math.random() < 0.01 && floating3DObjects.length < 6) {
    createFloatingObject();
  }

  // Render
  floatingRenderer.render(floatingScene, floatingCamera);
}

// Save the current state of all floating objects
function saveFloatingObjectsState() {
  if (!floating3DObjects || floating3DObjects.length === 0) {
    console.log("No floating objects to save");
    return;
  }

  console.log(`Saving state of ${floating3DObjects.length} floating objects`);

  const state = floating3DObjects.map((obj) => ({
    position: { ...obj.position },
    rotation: { ...obj.rotation },
    row: obj.row,
    col: obj.col,
    speed: { ...obj.speed },
    rotationSpeed: { ...obj.rotationSpeed },
    labelOffset: {
      x: obj.labelOffset.x,
      y: obj.labelOffset.y,
      z: obj.labelOffset.z,
    },
  }));

  savedObjectsState = state;
}

// Restore floating objects from saved state
function restoreFloatingObjectsState() {
  if (
    !savedObjectsState ||
    savedObjectsState.length === 0 ||
    !floatingModels ||
    floatingModels.length === 0
  ) {
    console.log("No saved state or models to restore");
    createInitialFloatingObjects();
    return;
  }

  console.log(`Restoring ${savedObjectsState.length} floating objects`);

  savedObjectsState.forEach((objState) => {
    // Skip offscreen objects
    if (objState.position.x < -8) {
      return;
    }

    // Find matching model by row
    const matchingModelData = floatingModels.find(
      (m) => m.row === objState.row
    );
    if (!matchingModelData) {
      return;
    }

    // Clone the model
    const model = matchingModelData.model.clone();

    // Set model rotation
    model.rotation.set(
      objState.rotation.x,
      objState.rotation.y,
      objState.rotation.z
    );

    // Get color and stage
    const currentColor = getColorForDecay(
      objState.row,
      objState.col,
      window.decayLevel
    );
    const decayStage = getDecayStage(window.decayLevel);

    // Create text sprite
    const infoText = createTextSprite(
      `Row: ${objState.row + 1} Col: ${
        objState.col + 1
      }\nColour: ${currentColor}\nDecay Stage: ${decayStage}`,
      "#ffffff"
    );

    // Position label using saved offset
    const labelOffset = new THREE.Vector3(
      objState.labelOffset?.x || 2.5,
      objState.labelOffset?.y || 1.5,
      objState.labelOffset?.z || 0.5
    );
    infoText.position.copy(labelOffset);

    // Create dashed line
    const lineStart = new THREE.Vector3(
      labelOffset.x - 1.4,
      labelOffset.y - 0.45,
      labelOffset.z
    );

    const lineEnd = new THREE.Vector3(
      lineStart.x - 1.0 * Math.cos(Math.PI / 4),
      lineStart.y - 1.0 * Math.sin(Math.PI / 4),
      lineStart.z
    );

    const dashedLine = createDashedLine(lineStart, lineEnd);

    // Create group and add all elements
    const objectGroup = new THREE.Group();
    objectGroup.add(model);
    objectGroup.add(infoText);
    objectGroup.add(dashedLine);

    // Position the group
    objectGroup.position.set(
      objState.position.x,
      objState.position.y,
      objState.position.z
    );

    // Add to scene
    floatingScene.add(objectGroup);

    // Create object data structure
    const floatingObject = {
      group: objectGroup,
      model: model,
      textSprite: infoText,
      dashedLine: dashedLine,
      row: objState.row,
      col: objState.col,
      color: currentColor,
      decayStage: decayStage,
      position: { ...objState.position },
      rotation: { ...objState.rotation },
      speed: { ...objState.speed },
      rotationSpeed: { ...objState.rotationSpeed },
      labelOffset: labelOffset,
    };

    floating3DObjects.push(floatingObject);
  });

  // If no objects were restored (all were off-screen), create new ones
  if (floating3DObjects.length === 0) {
    createInitialFloatingObjects();
  }
}

// Updated starting function
function startFloatingObjects() {
  console.log("Starting floating objects...");

  // Initialize 3D system if not already done
  if (!floatingRenderer) {
    init3DFloatingObjects();
  }

  // Timer to occasionally create new objects (more controlled frequency)
  if (floatingTimer === null) {
    floatingTimer = setInterval(() => {
      if (currentScreen === "mainScreen" && floating3DObjects.length < 6) {
        if (Math.random() < 0.3) {
          // Only 30% chance to create new object
          createFloatingObject();
        }
      }
    }, 3000); // Less frequent creation (every 3 seconds)
  }
}

function stopFloatingObjects() {
  // Save state before stopping
  if (floating3DObjects && floating3DObjects.length > 0) {
    saveFloatingObjectsState();
  }

  // Clear timer
  if (floatingTimer) {
    clearInterval(floatingTimer);
    floatingTimer = null;
  }

  // Clear existing 3D objects
  if (floatingScene) {
    floating3DObjects.forEach((obj) => {
      floatingScene.remove(obj.group);

      // Clean up textures and materials
      if (obj.textSprite.material.map) {
        obj.textSprite.material.map.dispose();
      }
      obj.textSprite.material.dispose();

      if (obj.dashedLine.geometry) {
        obj.dashedLine.geometry.dispose();
      }
      if (obj.dashedLine.material) {
        obj.dashedLine.material.dispose();
      }
    });
    floating3DObjects = [];
  }
}

// Handle window resize for 3D objects
window.addEventListener("resize", () => {
  if (floatingRenderer && floatingCamera) {
    floatingCamera.aspect = window.innerWidth / window.innerHeight;
    floatingCamera.updateProjectionMatrix();
    floatingRenderer.setSize(window.innerWidth, window.innerHeight);
  }
});

function updateTextSprite(obj, newText, color = "#ffffff") {
  // Create new text sprite without background
  const newTextSprite = createTextSprite(newText, color, null);
  newTextSprite.position.copy(obj.labelOffset);
  newTextSprite.lookAt(floatingCamera.position);

  // Replace old sprite with new one
  obj.group.remove(obj.textSprite);
  obj.group.add(newTextSprite);

  // Clean up old sprite texture
  if (obj.textSprite.material.map) {
    obj.textSprite.material.map.dispose();
  }
  obj.textSprite.material.dispose();

  // Update reference
  obj.textSprite = newTextSprite;
}

// This function should be integrated into the animate3DFloatingObjects function
// Update the section where text sprite is updated with new color/stage info
function updateTextAndLine(obj) {
  const newColor = getColorForDecay(obj.row, obj.col, window.decayLevel);
  const newDecayStage = getDecayStage(window.decayLevel);

  if (newColor !== obj.color || newDecayStage !== obj.decayStage) {
    obj.color = newColor;
    obj.decayStage = newDecayStage;

    // Update text with new color/stage info
    const newText = `Row: ${obj.row + 1} Col: ${
      obj.col + 1
    }\nColour: ${newColor}\nDecay Stage: ${newDecayStage}`;
    updateTextSprite(obj, newText, "#ffffff");

    // Update line position if needed
    if (obj.dashedLine) {
      // Remove old line
      obj.group.remove(obj.dashedLine);

      // Create a new line with updated positions
      const lineStart = new THREE.Vector3(
        obj.labelOffset.x - 1.4,
        obj.labelOffset.y - 0.25, // Adjusted higher position
        obj.labelOffset.z
      );

      const lineEnd = new THREE.Vector3(
        lineStart.x - 1.0 * Math.cos(Math.PI / 4),
        lineStart.y - 1.0 * Math.sin(Math.PI / 4),
        lineStart.z
      );

      // Create and add new dashed line
      const newDashedLine = createDashedLine(lineStart, lineEnd);
      obj.group.add(newDashedLine);

      // Clean up old line resources
      if (obj.dashedLine.geometry) {
        obj.dashedLine.geometry.dispose();
      }
      if (obj.dashedLine.material) {
        obj.dashedLine.material.dispose();
      }

      // Update reference
      obj.dashedLine = newDashedLine;
      obj.lineStart = lineStart;
      obj.lineEnd = lineEnd;
    }
  }
}
