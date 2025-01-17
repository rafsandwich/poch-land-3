import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000); // default colour when no models are on screen
renderer.setPixelRatio(window.devicePixelRatio);

// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap; // VSM for smoother shadows

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11); // camera starting point

// Allow camera to orbit around model
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 1;
controls.maxDistance = 30;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 7, 0);
controls.update();

// Plane for model to sit on top of
const groundGeometry = new THREE.PlaneGeometry(50, 20, 32, 32);
groundGeometry.rotateX(-Math.PI / 2); // rotate by 90 degrees so plane is flat, not vertical
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x333333, // dark grey for better contrast
  roughness: 0.6,
  metalness: 0.1,
});
const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.castShadow = false;
groundMesh.receiveShadow = true; // ground only needs to receive shadows
scene.add(groundMesh);

// Spotlight 1: Pink
const pinkSpotlight = new THREE.SpotLight(0xff0099, 200, 150, Math.PI / 4, 0.4, 1.2); // colour, intensity, distance, attenuation
pinkSpotlight.position.set(15, 25, 10);
pinkSpotlight.castShadow = true;
pinkSpotlight.shadow.mapSize.width = 2048;
pinkSpotlight.shadow.mapSize.height = 2048;
pinkSpotlight.shadow.bias = -0.0003; // Reduce shadow artifacts
scene.add(pinkSpotlight);

// Spotlight 2: Green
const greenSpotlight = new THREE.SpotLight(0x00ff99, 200, 150, Math.PI / 4, 0.4, 1.2);
greenSpotlight.position.set(-15, 25, -10);
greenSpotlight.castShadow = true;
greenSpotlight.shadow.mapSize.width = 2048;
greenSpotlight.shadow.mapSize.height = 2048;
greenSpotlight.shadow.bias = -0.0003;
scene.add(greenSpotlight);

// Ambient Light for subtle global illumination
const ambientLight = new THREE.AmbientLight(0x202020, 0.5); // change intensity
scene.add(ambientLight);

let computerMesh;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const loader = new GLTFLoader().setPath('public/computer/');

// Load model into scene
loader.load(
  'scene.gltf',
  (gltf) => {
    console.log('loading model...');
    computerMesh = gltf.scene; // assign the loaded mesh to computerMesh

    computerMesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true; // mesh's can cast and receive shadows
        child.receiveShadow = true;
      }
    });

    computerMesh.position.set(0, 2.05, -1);
    scene.add(computerMesh);

    document.getElementById('progress-container').style.display = 'none';
  },
  (xhr) => {
    console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
  },
  (error) => {
    console.error(error);
  }
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function zoomToTerminal() {
  if (!computerMesh) return; // ensure the model is loaded

  // Define the target camera position

  //const targetPosition = { x: 10, y: 2.8, z: -0.4 };
  //const targetPosition = { x: -5, y: 8.5, z: -6.5 }; 
  const targetPosition = { x: -5.2, y: 8.8, z: -6.3 }; 

  // const targetLookAt = new THREE.Vector3(0, 2.4, -1.3); // not working correctly
  //const targetLookAt = new THREE.Vector3(0, 2.4, -1.3); 

  // Disable OrbitControls during animation
  controls.enabled = false;

  // Show portfolio page
  const webglContainer = document.getElementById('webgl-container');
  const portfolioPage = document.getElementById('portfolio-page');

  // Animate camera position and lookAt
  gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration: 2,
    ease: 'power2.inOut',
    // onUpdate: () => {
    //   camera.lookAt(targetLookAt);
    //   //console.log(targetLookAt);
    // },
    onStart: () => {
      portfolioPage.style.display ='flex';
      gsap.to(portfolioPage, {opacity: 1, duration: 1.3, ease: 'power2.inOut' });
      gsap.to('#heading, .border', { 
        opacity: 0,
        x: '100%', 
        duration: 1.1,
        delay: 0.1,
      }); 
    },
    onComplete: () => {
      console.log("Zoom complete");
      stopRendering();

      // Fade out WebGL
      gsap.to(webglContainer, {
        opacity: 0,
        duration: 1,
        onComplete: () => {
          webglContainer.style.display = 'none'; // Stop rendering
        },
      });
    },
  });
}

function onClick(event) {
  if (!computerMesh) return;

  // Update mouse position
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Raycast from camera to mouse position
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(computerMesh, true);

  if (intersects.length > 0) {
    zoomToTerminal();
  }
}

renderer.domElement.addEventListener('click', onClick);

document.getElementById('back-to-scene').addEventListener('click', () => {
  const webglContainer = document.getElementById('webgl-container');
  const portfolioPage = document.getElementById('portfolio-page');
  resumeRendering();

  // Fade out portfolio
  gsap.to(portfolioPage, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      portfolioPage.style.display = 'none';
      webglContainer.style.display = 'block';

      // Fade in WebGL
      gsap.to(webglContainer, { opacity: 1, duration: 1 });
      controls.enabled = true; // Re-enable controls
    },
  });
});

let isRendering = true;

function animate() {
  if (!isRendering) return;
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

// Stop rendering when transitioning
function stopRendering() {
  isRendering = false;
}

// Resume rendering
function resumeRendering() {
  isRendering = true;
  animate();
}

// Begin render loop
animate();