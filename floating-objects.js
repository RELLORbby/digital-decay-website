// 3D Floating Objects System
let floatingScene, floatingCamera, floatingRenderer;
let floating3DObjects = [];
let floatingModels = []; // Store loaded models
let floatingTimer = null;
let modelsLoaded = 0;
let totalModels = 7;

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

  // Load all OBJ models
  loadFloatingModels();

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

          // Scale and prepare the model - Made bigger (1.5 instead of 0.5)
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
      geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Made bigger
      break;
    case 1:
      geometry = new THREE.SphereGeometry(0.9, 8, 8); // Made bigger
      break;
    case 2:
      geometry = new THREE.ConeGeometry(0.9, 1.5, 8); // Made bigger
      break;
    default:
      geometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 8); // Made bigger
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
  }
}

function getDecayStage(decayPercent) {
  const stageIndex = Math.floor((1 - decayPercent / 100) * 5);
  return Math.max(1, Math.min(6, stageIndex + 1));
}

function createTextSprite(text, color = "#ffffff") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = 512;
  canvas.height = 192; // Taller canvas for 3 lines

  // Set consistent font size and family - use JetBrains Mono
  context.font = 'Bold 24px "JetBrains Mono", "Courier New", monospace';
  context.fillStyle = color;
  context.textAlign = "left"; // Left align text

  // Draw multi-line text with left alignment
  const lines = text.split("\n");
  const lineHeight = 40;
  const startY = 40; // Start from top with some padding
  const leftPadding = 20; // Left padding for text

  lines.forEach((line, index) => {
    context.fillText(line, leftPadding, startY + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);

  // Fixed size for all text sprites regardless of object size
  sprite.scale.set(3, 1.1, 1);

  return sprite;
}

function createDashedLine(start, end) {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineDashedMaterial({
    color: 0xffffff,
    linewidth: 2,
    scale: 1,
    dashSize: 0.1,
    gapSize: 0.05,
  });
  const line = new THREE.Line(geometry, material);
  line.computeLineDistances();
  return line;
}

function create3DFloatingObject() {
  if (floatingModels.length === 0) {
    console.log("No models available yet, waiting...");
    return;
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

  // Position off-screen right
  model.position.set(
    8, // Start off-screen right
    (Math.random() - 0.5) * 6, // Random Y position
    (Math.random() - 0.5) * 2 // Random Z depth
  );

  // Random rotation
  model.rotation.x = Math.random() * Math.PI * 2;
  model.rotation.y = Math.random() * Math.PI * 2;
  model.rotation.z = Math.random() * Math.PI * 2;

  // Create text showing grid position, color, and decay stage
  const infoText = `Row: ${row + 1} Col: ${
    col + 1
  }\nColour: ${currentColor}\nDecay Stage: ${decayStage}`;
  const textSprite = createTextSprite(infoText, "#ffffff");

  // Position text consistently regardless of object size
  const textOffset = new THREE.Vector3(2.5, 1.5, 0.5);
  textSprite.position.copy(textOffset);

  // Create simple dashed line from bottom-left of text with fixed angle and length
  const lineLength = 1.0; // Reduced from 1.5 to make the line shorter
  const angle = Math.PI / 4; // 45 degree angle downward

  // Calculate start point (bottom-left of text) - adjusted to be closer
  const lineStart = new THREE.Vector3(
    textOffset.x - 1.4, // Left edge of text (slightly closer to center)
    textOffset.y - 0.45, // Bottom edge of text (slightly higher)
    textOffset.z
  );

  // Calculate end point with fixed angle and length
  const lineEnd = new THREE.Vector3(
    lineStart.x - lineLength * Math.cos(angle), // Move left and down
    lineStart.y - lineLength * Math.sin(angle), // Move down
    lineStart.z
  );

  const dashedLine = createDashedLine(lineStart, lineEnd);

  // Create a group to hold the model, text, and line
  const objectGroup = new THREE.Group();
  objectGroup.add(model);
  objectGroup.add(textSprite);
  objectGroup.add(dashedLine);

  // Position the entire group
  objectGroup.position.copy(model.position);
  model.position.set(0, 0, 0); // Reset model position relative to group

  // Add to scene
  floatingScene.add(objectGroup);

  // Store with movement properties and fixed color/position data
  floating3DObjects.push({
    group: objectGroup,
    model: model,
    textSprite: textSprite,
    dashedLine: dashedLine,
    row: row,
    col: col,
    color: currentColor,
    decayStage: decayStage,
    textOffset: textOffset,
    speedX: -0.02 - Math.random() * 0.03, // Move left
    rotationSpeed: {
      x: (Math.random() - 0.5) * 0.02,
      y: (Math.random() - 0.5) * 0.02,
      z: (Math.random() - 0.5) * 0.02,
    },
  });
}

function animate3DFloatingObjects() {
  requestAnimationFrame(animate3DFloatingObjects);

  if (currentScreen !== "mainScreen" || !floatingRenderer) return;

  // Update floating objects
  for (let i = floating3DObjects.length - 1; i >= 0; i--) {
    const obj = floating3DObjects[i];

    // Move left
    obj.group.position.x += obj.speedX;

    // Rotate only the model, not the text
    obj.model.rotation.x += obj.rotationSpeed.x;
    obj.model.rotation.y += obj.rotationSpeed.y;
    obj.model.rotation.z += obj.rotationSpeed.z;

    // Keep text facing camera
    obj.textSprite.lookAt(floatingCamera.position);

    // Update the text if decay level changes
    const newColor = getColorForDecay(obj.row, obj.col, window.decayLevel);
    const newDecayStage = getDecayStage(window.decayLevel);

    if (newColor !== obj.color || newDecayStage !== obj.decayStage) {
      obj.color = newColor;
      obj.decayStage = newDecayStage;
      const newText = `Row: ${obj.row + 1} Col: ${
        obj.col + 1
      }\nColour: ${newColor}\nDecay Stage: ${newDecayStage}`;

      // Update text sprite with consistent formatting and font
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = 512;
      canvas.height = 192;

      context.font = 'Bold 24px "JetBrains Mono", "Courier New", monospace'; // Updated font
      context.fillStyle = "#ffffff";
      context.textAlign = "left"; // Left align text

      // Draw multi-line text with left alignment
      const lines = newText.split("\n");
      const lineHeight = 40;
      const startY = 40;
      const leftPadding = 20;

      lines.forEach((line, index) => {
        context.fillText(line, leftPadding, startY + index * lineHeight);
      });

      obj.textSprite.material.map.dispose();
      obj.textSprite.material.map = new THREE.CanvasTexture(canvas);
      obj.textSprite.material.needsUpdate = true;
    }

    // Remove if off-screen left
    if (obj.group.position.x < -8) {
      floatingScene.remove(obj.group);

      // Clean up textures
      obj.textSprite.material.map.dispose();
      obj.textSprite.material.dispose();
      obj.dashedLine.material.dispose();
      obj.dashedLine.geometry.dispose();

      floating3DObjects.splice(i, 1);
    }
  }

  // Render
  floatingRenderer.render(floatingScene, floatingCamera);
}

// Updated main floating objects function
function startFloatingObjects() {
  console.log("Starting floating objects...");

  // Initialize 3D system if not already done
  if (!floatingRenderer) {
    init3DFloatingObjects();
  }

  // Create floating objects periodically
  floatingTimer = setInterval(() => {
    if (currentScreen === "mainScreen") {
      create3DFloatingObject();
    }
  }, 2000);

  // Create first one immediately (with delay to allow models to load)
  setTimeout(() => create3DFloatingObject(), 3000);
}

function stopFloatingObjects() {
  if (floatingTimer) {
    clearInterval(floatingTimer);
    floatingTimer = null;
  }

  // Clear existing 3D objects
  if (floatingScene) {
    floating3DObjects.forEach((obj) => {
      floatingScene.remove(obj.group);

      // Clean up textures and materials
      obj.textSprite.material.map.dispose();
      obj.textSprite.material.dispose();
      obj.dashedLine.material.dispose();
      obj.dashedLine.geometry.dispose();
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
