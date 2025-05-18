// Store SVGs to manage disappearance/reappearance
const svgs = {
  decaySvg: { element: null, visible: true },
  blockSvg: { element: null, visible: true },
  gridSvg: { element: null, visible: true },
  timerSvg: { element: null, visible: true },
};

// SVG to screen mapping
const svgScreenMap = {
  decaySvg: "gameScreen",
  blockSvg: "modelScreen",
  gridSvg: "gridScreen",
  timerSvg: "timerScreen",
};

// Initialize all 3D model viewers
let modelViewers = [];

document.addEventListener("DOMContentLoaded", function () {
  // Store element references
  Object.keys(svgs).forEach((id) => {
    svgs[id].element = document.getElementById(id);
  });

  // Set up draggable SVGs
  setupDraggableElements();

  // Set up back buttons - Fixed to target all back buttons
  setupBackButtons();

  // Initialize grid leaflet content
  initializeGridLeaflet();

  // Initialize 3D models display
  initialize3DModels();
});

// New function to set up all back buttons
function setupBackButtons() {
  // Get all elements with the class "back-button"
  const backButtons = document.querySelectorAll(".back-button");

  // Add event listener to each back button
  backButtons.forEach((button) => {
    button.addEventListener("click", goBack);
  });
}

function setupDraggableElements() {
  const draggables = document.querySelectorAll(".draggable");
  const saveZone = document.getElementById("saveZone");
  const deleteZone = document.getElementById("deleteZone");

  draggables.forEach((draggable) => {
    draggable.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", draggable.id);
    });
  });

  // Drop zone event listeners
  [saveZone, deleteZone].forEach((zone) => {
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (zone === saveZone) {
        zone.classList.add("highlight");
      } else {
        zone.classList.add("delete-highlight");
      }
    });

    zone.addEventListener("dragleave", () => {
      zone.classList.remove("highlight");
      zone.classList.remove("delete-highlight");
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("highlight");
      zone.classList.remove("delete-highlight");

      const id = e.dataTransfer.getData("text/plain");
      if (zone === saveZone) {
        openScreen(id);
      } else {
        deleteSvg(id);
      }
    });
  });
}

function openScreen(svgId) {
  // Hide all screens first
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => {
    screen.style.display = "none";
  });

  // Show the specific screen
  const screenId = svgScreenMap[svgId];
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.style.display = "flex";

    // Show all back buttons in the current screen
    const backButtons = screen.querySelectorAll(".back-button");
    backButtons.forEach((button) => {
      button.style.display = "block";
    });

    // Handle specific screen initializations
    if (screenId === "modelScreen") {
      // Start all 3D model rotations and update sizes
      modelViewers.forEach((viewer) => {
        if (viewer.startRotation) viewer.startRotation();
        if (viewer.updateSize) {
          // Wait a moment for the screen to be fully visible
          setTimeout(() => viewer.updateSize(), 100);
        }
      });
    }
  }
}

function deleteSvg(svgId) {
  const svg = svgs[svgId];
  if (svg && svg.visible) {
    svg.visible = false;
    svg.element.classList.add("disappearing");

    // Check if all SVGs are now invisible
    setTimeout(() => {
      svg.element.style.display = "none";

      if (Object.values(svgs).every((svg) => !svg.visible)) {
        // All SVGs are deleted, wait a moment then bring them all back
        setTimeout(bringBackAllSvgs, 1000);
      }
    }, 500);
  }
}

function bringBackAllSvgs() {
  Object.values(svgs).forEach((svg) => {
    svg.visible = true;
    svg.element.style.display = "";
    svg.element.classList.remove("disappearing");
    svg.element.classList.add("appearing");

    setTimeout(() => {
      svg.element.classList.remove("appearing");
    }, 500);
  });
}

function goBack() {
  // Hide all screens
  const screens = document.querySelectorAll(".screen");
  screens.forEach((screen) => {
    screen.style.display = "none";
  });

  // Hide all back buttons
  const backButtons = document.querySelectorAll(".back-button");
  backButtons.forEach((button) => {
    button.style.display = "none";
  });

  // Stop all 3D model rotations
  modelViewers.forEach((viewer) => {
    if (viewer.stopRotation) viewer.stopRotation();
  });
}

function initializeGridLeaflet() {
  const decayData = {
    stages: [
      {
        stage: 1,
        description: "Initial state (least decayed)",
        grid: [
          [
            "#cbc6a1",
            "#cbc994",
            "#d3d09d",
            "#d0cd96",
            "#c9c78b",
            "#bdb57a",
            "#cbbf9f",
            "#d0c683",
            "#e1dca3",
            "#e1dba0",
            "#dfd89c",
            "#e6dfa3",
            "#ebe1a2",
          ],
          // Rest of the grid data...
          // Truncated for brevity
        ],
      },
      {
        stage: 6,
        description: "Final decay state (most decayed)",
        grid: [
          [
            "#7ab2ad",
            "#67a39b",
            "#639a91",
            "#5e968d",
            "#4d877d",
            "#68958d",
            "#799f96",
            "#538679",
            "#4e8070",
            "#5b887b",
            "#5a8c7b",
            "#548b76",
            "#90b1a6",
          ],
          // Rest of the grid data...
          // Truncated for brevity
        ],
      },
    ],
  };

  const gridsDiv = document.getElementById("decayGrids");

  decayData.stages.forEach((stage) => {
    const stageDiv = document.createElement("div");
    stageDiv.className = "decay-grid";
    stageDiv.innerHTML = `<h3 style="margin-top: 20px; margin-bottom: 10px;">Stage ${stage.stage}: ${stage.description}</h3>`;

    const gridDiv = document.createElement("div");
    stage.grid.forEach((row) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "grid-row";
      rowDiv.style.display = "block";
      rowDiv.style.height = "32px";

      row.forEach((color) => {
        const cellDiv = document.createElement("div");
        cellDiv.className = "grid-cell";
        cellDiv.style.width = "30px";
        cellDiv.style.height = "30px";
        cellDiv.style.display = "inline-block";
        cellDiv.style.margin = "1px";
        cellDiv.style.backgroundColor = color;
        rowDiv.appendChild(cellDiv);
      });

      gridDiv.appendChild(rowDiv);
    });

    stageDiv.appendChild(gridDiv);
    gridsDiv.appendChild(stageDiv);
  });
}

function initialize3DModels() {
  const container = document.getElementById("modelContainer");

  // Clear container first (in case this gets called multiple times)
  container.innerHTML = "";

  // Reset model viewers array
  modelViewers = [];

  console.log("Initializing 3D Models...");

  // Create 7 model viewers for each row
  for (let i = 1; i <= 7; i++) {
    const modelDiv = document.createElement("div");
    modelDiv.className = "model-item";
    modelDiv.id = `model-item-${i}`;
    modelDiv.style.position = "relative";

    // Add loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.className = "model-loading";
    loadingDiv.textContent = `Loading Model ${i}...`;
    modelDiv.appendChild(loadingDiv);

    container.appendChild(modelDiv);

    // Create and initialize Three.js viewer for this model
    const viewer = createModelViewer(modelDiv, i);
    modelViewers.push(viewer);
  }

  // Force a layout recalculation
  container.offsetHeight;

  console.log(`Initialized ${modelViewers.length} model viewers`);
}

function createModelViewer(container, rowNumber) {
  console.log(`Creating model viewer for row ${rowNumber}`);

  // Set explicit dimensions for the model container
  container.style.width = "280px";
  container.style.height = "250px";

  // Create a Three.js scene for this model
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000); // Changed to black background

  // Add a subtle grid to the scene
  const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
  gridHelper.position.y = -1.5;
  scene.add(gridHelper);

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    60, // Increased field of view
    1, // Default aspect ratio of 1 - will be updated
    0.1,
    1000
  );
  camera.position.z = 5;

  // Renderer setup - create with explicit dimensions
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(280, 250); // Set explicit size (matched to container)
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Better shadow quality
  container.appendChild(renderer.domElement);

  // Make sure the canvas has proper dimensions
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  // Add lighting - IMPROVED LIGHTING
  const ambientLight = new THREE.AmbientLight(0x404040, 0.8); // Slightly reduced ambient light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = true;
  // Improved shadow settings
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 20;
  scene.add(directionalLight);

  // Add additional lighting from different angles
  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight2.position.set(-5, 5, -5);
  scene.add(directionalLight2);

  // Add a spotlight from above
  const spotLight = new THREE.SpotLight(0xffffff, 0.8);
  spotLight.position.set(0, 8, 0);
  spotLight.angle = Math.PI / 4;
  spotLight.penumbra = 0.2;
  spotLight.castShadow = true;
  scene.add(spotLight);

  // Add subtle rim light for better definition
  const rimLight = new THREE.DirectionalLight(0x8888ff, 0.5);
  rimLight.position.set(0, 0, -10);
  scene.add(rimLight);

  // Placeholder if model isn't loaded
  let object = null;
  let rotationInterval = null;
  let isLoading = true;

  // Special positioning for models 5 and 6 that rotate outside their box
  // MODIFIED: Changed from negative (shifting left) to positive (shifting right)
  let offsetX = 0;
  if (rowNumber === 5 || rowNumber === 6) {
    offsetX = 0.5; // Changed from -0.5 to 0.5 to shift right instead of left
  }

  // Wait a short time to ensure DOM is fully rendered before loading models
  setTimeout(() => {
    // Load the model
    loadModel();

    // Force a resize event to ensure correct dimensions
    updateRendererSize();
  }, 100);

  function loadModel() {
    // Try to load model
    const objPath = `assets/blender/objects/row${rowNumber}.obj`;
    const mtlPath = `assets/blender/objects/row${rowNumber}.mtl`;

    console.log(
      `Attempting to load model: ${objPath} with materials: ${mtlPath}`
    );

    // Load materials first, then model
    const mtlLoader = new THREE.MTLLoader();
    mtlLoader.load(
      mtlPath,
      // Success callback
      (materials) => {
        console.log(`Successfully loaded materials for row${rowNumber}`);
        materials.preload();

        // Now load object with materials
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(
          objPath,
          // Success callback
          (loadedObject) => {
            console.log(`Successfully loaded model for row${rowNumber}`);
            // Remove placeholder if it exists
            if (object) scene.remove(object);

            // Add loaded object to scene
            object = loadedObject;

            // Center and scale model
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Scale to fit container
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim; // Increased scale from 2 to 2.5
            object.scale.setScalar(scale);

            // Center object with offset for models 5 and 6
            object.position.set(offsetX, 0, 0);
            object.position.sub(center.multiplyScalar(scale));

            // Apply offset to already centered object
            if (rowNumber === 5 || rowNumber === 6) {
              object.position.x += offsetX;
            }

            // Enable shadows for all meshes
            object.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                // Enhance materials if they exist
                if (child.material) {
                  child.material.shininess = 50; // Increased shininess
                }
              }
            });

            scene.add(object);
            isLoading = false;

            // Remove loading indicator
            const loadingDiv = container.querySelector(".model-loading");
            if (loadingDiv) loadingDiv.remove();

            // Start rotation automatically
            startRotation();
          },
          // Progress callback
          (xhr) => {
            if (xhr.lengthComputable) {
              console.log(
                `${rowNumber}: ${((xhr.loaded / xhr.total) * 100).toFixed(
                  2
                )}% loaded`
              );
              const loadingDiv = container.querySelector(".model-loading");
              if (loadingDiv) {
                loadingDiv.textContent = `Loading Model ${rowNumber}: ${(
                  (xhr.loaded / xhr.total) *
                  100
                ).toFixed(0)}%`;
                loadingDiv.style.color = "#ffffff"; // White text for black background
              }
            }
          },
          // Error callback
          (error) => {
            console.error(`Error loading model row${rowNumber}:`, error);
            createFallbackCube(scene, rowNumber);
            isLoading = false;
          }
        );
      },
      // MTL Progress callback
      (xhr) => {
        if (xhr.lengthComputable) {
          console.log(
            `Material ${rowNumber}: ${((xhr.loaded / xhr.total) * 100).toFixed(
              2
            )}% loaded`
          );
        }
      },
      // MTL Error callback
      (error) => {
        console.warn(`No MTL for row${rowNumber} or error loading it:`, error);
        console.log(`Attempting to load OBJ without materials`);

        // Load OBJ without materials
        const objLoader = new THREE.OBJLoader();
        objLoader.load(
          objPath,
          (loadedObject) => {
            if (object) scene.remove(object);
            object = loadedObject;

            // Apply default material
            object.traverse((child) => {
              if (child.isMesh) {
                // Create a more interesting material
                child.material = new THREE.MeshStandardMaterial({
                  color: 0x888888,
                  roughness: 0.5,
                  metalness: 0.7,
                  envMapIntensity: 1.0,
                });
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            // Scale and center
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim; // Increased scale
            object.scale.setScalar(scale);

            // Center object with offset for models 5 and 6
            object.position.set(offsetX, 0, 0);
            object.position.sub(center.multiplyScalar(scale));

            // Apply offset to already centered object
            if (rowNumber === 5 || rowNumber === 6) {
              object.position.x += offsetX;
            }

            scene.add(object);
            isLoading = false;

            // Remove loading indicator
            const loadingDiv = container.querySelector(".model-loading");
            if (loadingDiv) loadingDiv.remove();

            // Start rotation automatically
            startRotation();
          },
          null,
          (error) => {
            console.error(`Error loading OBJ for row${rowNumber}:`, error);
            createFallbackCube(scene, rowNumber);
            isLoading = false;
          }
        );
      }
    );
  }

  // Create fallback cube for placeholder
  function createFallbackCube(scene, rowNumber) {
    console.log(`Creating fallback cube for row${rowNumber}`);
    // Create a more interesting fallback geometry
    let geometry;

    // Different fallback shapes for variety
    switch (rowNumber % 4) {
      case 0:
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
      case 1:
        geometry = new THREE.SphereGeometry(1.2, 32, 32);
        break;
      case 2:
        geometry = new THREE.TorusKnotGeometry(1, 0.4, 64, 8);
        break;
      case 3:
        geometry = new THREE.OctahedronGeometry(1.5);
        break;
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.4,
      metalness: 0.8,
    });

    object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;

    // Apply position offset for models 5 and 6
    if (rowNumber === 5 || rowNumber === 6) {
      object.position.x = offsetX;
    }

    scene.add(object);

    // Update loading indicator
    const loadingDiv = container.querySelector(".model-loading");
    if (loadingDiv) {
      loadingDiv.textContent = `Model ${rowNumber} (Fallback)`;
      loadingDiv.style.color = "#ffffff"; // White text for black background
      loadingDiv.style.fontSize = "12px";
      loadingDiv.style.textAlign = "center";
    }

    isLoading = false;

    // Start rotation for fallback cube
    startRotation();
  }

  // Animation/render loop
  function animate() {
    requestAnimationFrame(animate);

    if (container.offsetParent !== null) {
      // Only render when visible
      renderer.render(scene, camera);
    }
  }

  // Start animation loop
  animate();

  // Function to update renderer size
  function updateRendererSize() {
    if (container.offsetParent !== null) {
      const width = container.clientWidth;
      const height = container.clientHeight;

      // Only update if dimensions are valid
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        console.log(
          `Updated renderer size for model ${rowNumber}: ${width}x${height}`
        );
      } else {
        console.warn(
          `Invalid dimensions for model ${rowNumber}: ${width}x${height}`
        );
      }
    }
  }

  // Handler to start/stop rotation
  function startRotation() {
    if (!rotationInterval && object) {
      rotationInterval = setInterval(() => {
        if (object) {
          // Different rotation speeds and directions for variety
          const speedMultiplier = 0.75 + (rowNumber % 3) * 0.5;
          object.rotation.y += 0.01 * speedMultiplier;

          // Add slight wobble for more interesting motion
          object.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;

          // Add slight z-axis rotation for models 5 and 6
          if (rowNumber === 5 || rowNumber === 6) {
            object.rotation.z = Math.sin(Date.now() * 0.0007) * 0.1;
          }
        }
      }, 16); // approx 60fps
    }
  }

  function stopRotation() {
    if (rotationInterval) {
      clearInterval(rotationInterval);
      rotationInterval = null;
    }
  }

  // Handle window resize
  window.addEventListener("resize", updateRendererSize);

  // Update each back button to trigger renderer size update
  document.querySelectorAll(".back-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Delay slightly to allow DOM to update
      setTimeout(updateRendererSize, 100);
    });
  });

  // Return the controls for this viewer
  return {
    startRotation,
    stopRotation,
    scene,
    object,
    updateSize: updateRendererSize,
  };
}
