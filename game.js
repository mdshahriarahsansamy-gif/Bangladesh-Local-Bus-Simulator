
"use strict";

// BANGLADESH LOCAL BUS SIMULATOR
// First playable 3D prototype

const container = document.getElementById("gameContainer");
const speedText = document.getElementById("speed");
const routeText = document.getElementById("routeName");
const passengerText = document.getElementById("passengers");
const message = document.getElementById("message");
const loading = document.getElementById("loading");

let scene, camera, renderer, bus;
let wheels = [];
let running = false;
let paused = false;
let speed = 0;
let distance = 0;
let passengers = 0;
let steering = 0;
let hornSound;

const keys = {};
const clock = new THREE.Clock();

function material(color, roughness = 0.85) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness
  });
}

function box(parent, x, y, z, w, h, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  return mesh;
}

function cylinder(parent, x, y, z, radius, height, color) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 12),
    material(color)
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  parent.add(mesh);

  return mesh;
}

function createTree(x, z) {
  const tree = new THREE.Group();

  cylinder(tree, 0, 1.2, 0, 0.18, 2.4, 0x76502d);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 10, 8),
    material(0x24743b)
  );

  leaves.position.y = 3;
  leaves.castShadow = true;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  scene.add(tree);
}

function createHouse(x, z) {
  const house = new THREE.Group();

  box(house, 0, 1.3, 0, 4, 2.6, 3.5, 0xd8c29a);
  box(house, 0, 2.9, 0, 4.4, 0.35, 3.9, 0x984c32);
  box(house, 0, 1.2, 1.78, 0.9, 1.5, 0x60402b);

  house.position.set(x, 0, z);
  scene.add(house);
}

function createRoad() {
  // Long highway
  box(scene, 0, -0.12, 0, 16, 0.2, 1200, 0x33383b);

  // Road edges
  box(scene, -8.4, -0.08, 0, 0.35, 0.25, 1200, 0xbab7a5);
  box(scene, 8.4, -0.08, 0, 0.35, 0.25, 1200, 0xbab7a5);

  // Center line markings
  for (let z = -590; z < 600; z += 18) {
    box(scene, 0, 0.01, z, 0.16, 0.03, 8, 0xf4e9bb);
  }

  // Roadside shoulders
  box(scene, -13, -0.16, 0, 10, 0.2, 1200, 0x8a7955);
  box(scene, 13, -0.16, 0, 10, 0.2, 1200, 0x8a7955);
}

function createBridge() {
  const bridge = new THREE.Group();

  box(bridge, 0, 0, -160, 20, 0.5, 65, 0x777c7d);

  for (let x of [-9, 9]) {
    box(bridge, x, 2, -160, 0.5, 4, 65, 0xc7c9c4);
  }

  for (let z = -190; z <= -130; z += 10) {
    for (let x of [-9, 9]) {
      box(bridge, x, 4, z, 0.4, 3, 0.4, 0xe0e0d8);
    }
  }

  scene.add(bridge);

  // River beneath the bridge
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    new THREE.MeshStandardMaterial({
      color: 0x348caa,
      roughness: 0.35,
      metalness: 0.1
    })
  );

  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -2, -160);
  scene.add(water);
}

function createEnvironment() {
  // Grass ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(150, 1250),
    material(0x57864b)
  );

  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.25, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  createRoad();
  createBridge();

  for (let z = -580; z < 600; z += 24) {
    if (z > -195 && z < -125) continue;

    createTree(-14 - Math.random() * 5, z);
    createTree(14 + Math.random() * 5, z + 8);

    if (Math.random() > 0.65) {
      createHouse(-27, z);
    }

    if (Math.random() > 0.65) {
      createHouse(27, z);
    }
  }

  // Small roadside shops
  for (let z = -80; z < 80; z += 40) {
    box(scene, -12, 1.3, z, 5, 2.6, 4, 0xc99b60);
    box(scene, -12, 2.8, z, 5.5, 0.3, 4.5, 0x9e4832);
  }
}

function createBus() {
  bus = new THREE.Group();

  // Main body
  box(bus, 0, 2.15, 0, 3.4, 3.6, 9, 0x168348);

  // Lower body
  box(bus, 0, 0.75, 0, 3.5, 0.7, 9, 0xd6e2d8);

  // Front glass
  box(bus, 0, 3.05, 4.52, 2.8, 1.3, 0x142c3b);

  // Rear glass
  box(bus, 0, 3.05, -4.52, 2.8, 1.3, 0x142c3b);

  // Side windows
  for (let z = -3.2; z <= 3.2; z += 1.5) {
    box(bus, -1.72, 3.05, z, 0.06, 1.15, 1.2, 0x173849);
    box(bus, 1.72, 3.05, z, 0.06, 1.15, 1.2, 0x173849);
  }

  // Headlights
  box(bus, -1.05, 1.15, 4.55, 0.45, 0.35, 0.1, 0xfff2b0);
  box(bus, 1.05, 1.15, 4.55, 0.45, 0.35, 0.1, 0xfff2b0);

  // Front bumper
  box(bus, 0, 0.55, 4.7, 3.5, 0.3, 0.25, 0x222222);

  // Wheels
  for (let side of [-1, 1]) {
    for (let z of [-3, 3]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.65, 0.65, 0.4, 20),
        material(0x151515)
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 1.8, 0.65, z);
      wheel.castShadow = true;

      bus.add(wheel);
      wheels.push(wheel);
    }
  }

  bus.position.set(0, 0, 0);
  scene.add(bus);
}

function createTraffic() {
  for (let i = 0; i < 12; i++) {
    const car = new THREE.Group();

    box(car, 0, 0.8, 0, 2, 1.4, 4, i % 2 ? 0xd64a32 : 0xe4c34c);
    box(car, 0, 1.55, -0.2, 1.6, 0.8, 2, 0x263b48);

    car.position.set(
      i % 2 ? 4.8 : -4.8,
      0,
      -500 + i * 85
    );

    scene.add(car);
  }
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x91c9df);
  scene.fog = new THREE.Fog(0x91c9df, 80, 320);

  camera = new THREE.PerspectiveCamera(
    65,
    container.clientWidth / container.clientHeight,
    0.1,
    1500
  );

  camera.position.set(0, 8, -15);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
  });

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  container.insertBefore(renderer.domElement, container.firstChild);

  const sunlight = new THREE.DirectionalLight(0xfff1cf, 2);
  sunlight.position.set(-40, 80, 50);
  sunlight.castShadow = true;
  scene.add(sunlight);

  scene.add(new THREE.HemisphereLight(0xd8efff, 0x526b39, 1.4));

  createEnvironment();
  createTraffic();
  createBus();
}

function updateCamera() {
  const target = new THREE.Vector3(
    bus.position.x * 0.7,
    3.5,
    bus.position.z - 15
  );

  camera.position.lerp(
    new THREE.Vector3(
      bus.position.x * 0.7,
      8,
      bus.position.z - 16
    ),
    0.08
  );

  camera.lookAt(target);
}

function updateGame(delta) {
  if (!running || paused) return;

  if (keys["w"] || keys["ArrowUp"]) {
    speed += 20 * delta;
  } else {
    speed -= 5 * delta;
  }

  if (keys["s"] || keys["ArrowDown"]) {
    speed -= 35 * delta;
  }

  speed = Math.max(0, Math.min(speed, 90));

  if (keys["a"] || keys["ArrowLeft"]) {
    steering = Math.max(steering - 2 * delta, -1);
  } else if (keys["d"] || keys["ArrowRight"]) {
    steering = Math.min(steering + 2 * delta, 1);
  } else {
    steering *= 0.9;
  }

  bus.position.x += steering * speed * delta * 0.035;
  bus.position.x = Math.max(-5.5, Math.min(5.5, bus.position.x));

  bus.position.z += speed * delta * 0.12;

  bus.rotation.y = -steering * 0.13;

  wheels.forEach(wheel => {
    wheel.rotation.x -= speed * delta * 0.06;
  });

  distance += speed * delta / 3600;

  speedText.textContent = Math.round(speed);
  routeText.textContent =
    bus.position.z < 250 ? "KANCHPUR" :
    bus.position.z < 450 ? "MOGRAPARA" : "SONARGAON";

  if (bus.position.z > 250 && passengers === 0) {
    speed = 0;
    passengers = 12;
    passengerText.textContent = passengers;
    message.textContent = "Mograpara Bus Stand: Passengers boarded!";
  }

  if (bus.position.z > 500) {
    speed = 0;
    running = false;
    message.textContent = "Mission Complete! Welcome to Sonargaon Museum!";
  }

  updateCamera();
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.04);

  updateGame(delta);
  renderer.render(scene, camera);
}

function startGame() {
  if (!running && bus.position.z > 500) {
    restartGame();
  }

  running = true;
  paused = false;
  message.textContent = "Drive carefully! Reach Mograpara Bus Stand.";
}

function pauseGame() {
  paused = !paused;
  message.textContent = paused ? "Game Paused" : "Drive safely!";
}

function restartGame() {
  bus.position.set(0, 0, 0);
  bus.rotation.set(0, 0, 0);

  speed = 0;
  distance = 0;
  passengers = 0;
  steering = 0;

  running = false;
  paused = false;

  speedText.textContent = "0";
  passengerText.textContent = "0";
  routeText.textContent = "KANCHPUR";
  message.textContent = "Press START to begin your journey";
}

function horn() {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    const audio = new AudioContextClass();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.value = 350;
    gain.gain.value = 0.07;

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    oscillator.stop(audio.currentTime + 0.35);
  } catch (error) {
    console.log("Horn unavailable");
  }
}

document.addEventListener("keydown", event => {
  keys[event.key] = true;

  if (event.key.toLowerCase() === "h") horn();

  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "]
      .includes(event.key)
  ) {
    event.preventDefault();
  }
});

document.addEventListener("keyup", event => {
  keys[event.key] = false;
});

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("pauseBtn").addEventListener("click", pauseGame);
document.getElementById("restartBtn").addEventListener("click", restartGame);

document.getElementById("fullscreenBtn").addEventListener("click", () => {
  if (!document.fullscreenElement) {
    container.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
});

// Mobile controls
function addTouchControl(id, key) {
  const button = document.createElement("button");

  button.textContent = id === "left" ? "◀" :
    id === "right" ? "▶" :
    id === "accelerator" ? "▲ GAS" : "▼ BRAKE";

  button.className = "touch-control " + id;
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    keys[key] = true;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(name => {
    button.addEventListener(name, () => {
      keys[key] = false;
    });
  });

  container.appendChild(button);
}

function init() {
  createScene();

  addTouchControl("left", "ArrowLeft");
  addTouchControl("right", "ArrowRight");
  addTouchControl("accelerator", "ArrowUp");
  addTouchControl("brake", "ArrowDown");

  loading.style.display = "none";

  animate();
}

window.addEventListener("resize", () => {
  if (!camera || !renderer) return;

  camera.aspect =
    container.clientWidth / container.clientHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );
});

init();
