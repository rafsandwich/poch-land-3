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
      gsap.to(portfolioPage, {opacity: 1, duration: 1, ease: 'power2.inOut' });
      gsap.to('#heading, .border', { 
        opacity: 0,
        x: '100%', 
        duration: 0.5,
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

// Add event listeners for option clicks
const options = document.querySelectorAll('.option');
let selectedOption = null;

options.forEach((option) => {
  option.addEventListener('click', () => {
    // Deselect previous option
    if (selectedOption) {
      selectedOption.classList.remove('selected');
    }

    // Select the clicked option
    option.classList.add('selected');
    selectedOption = option;

    // Get page ID from data attribute in HTML
    const pageId = option.getAttribute('data-page');
    navigateToPage(pageId);
  });
});

// navbar
const navItems = document.querySelectorAll('.nav-item');
const navBorder = document.getElementById('nav-border');
const pages = document.querySelectorAll('.page');
const portfolioPage = document.getElementById('portfolio-page');

let activeIndex = 0;

function updateBorderPosition(index) {
  const activeItem = navItems[index];
  const rect = activeItem.getBoundingClientRect();
  const navRect = activeItem.parentNode.getBoundingClientRect();
  navBorder.style.width = `${rect.width + 20}px`;
  navBorder.style.height = `${rect.height + 5}px`;
  navBorder.style.transform = `translate(${rect.left - navRect.left - 15}px, -5px)`;
}

const pageColours = {
  "page-development": "#d5b99d",
  "page-messagetomountains": "#82c1db",
  "page-cabaret": "#868ed6",
};

// For using the navbar to toggle between pages
function navbarToPage(pageId) {

  // Hide all pages
  pages.forEach((page) => {
    page.style.display = 'none';
    page.classList.remove('active');
  });

  const portfolioPageContent = document.getElementById('portfolio-page')
  portfolioPageContent.style.display= 'none';

  // Show the selected page
  const selectedPage = document.getElementById(pageId);
  if (selectedPage) {
    selectedPage.style.display = 'block';
    selectedPage.classList.add('active');
    selectedPage.style.opacity = 1;

    // Change navbar background colour based on the page
    const navbar = document.querySelector('nav');
    navbar.style.backgroundColor = pageColours[pageId] || "#FFFFFF"; // default colour
  } else {
    console.error(`Page with ID "${pageId}" not found.`);
  }
}


// Initial navigate to page from options screen
function navigateToPage(pageId) {
  const portfolioPageContent = document.getElementById('portfolio-page').children; // children so not background, goal to swipe text elements up
  const selectedPage = document.getElementById(pageId);
  const navbar = document.querySelector('nav');

  if (!selectedPage) {
    console.error(`Page with ID "${pageId}" not found.`);
    return;
  }

  // Swipe the portfolio page content up, not the background
  gsap.to(portfolioPageContent, {
    y: '-200%',
    opacity: 0,
    duration: 0.8,
    ease: 'power2.inOut',
    onComplete: () => {
      if (selectedPage) {
        selectedPage.style.display = 'block';

        // Fade in the selected page
        gsap.to(selectedPage, { opacity: 1, duration: 0, ease: 'power2.out' });

         // Change navbar background colour
         navbar.style.backgroundColor = pageColours[pageId] || "#FFFFFF";
      } else {
        console.error(`Page with ID "${pageId}" not found.`);
      }

      // Ensure the navbar is visible and fade it in
      navbar.style.visibility = 'visible';
      navbar.style.display = 'flex';
      gsap.to(navbar, { opacity: 1, duration: 0, ease: 'power2.out' });

      // Update navbar based on selection
      navItems.forEach((item, index) => {
        if (item.getAttribute('data-page') === pageId) {
          navItems[activeIndex].classList.remove('active');
          item.classList.add('active');
          activeIndex = index;
          updateBorderPosition(index);
        }
      });

      portfolioPage.classList.remove('active');
    },
  });
}

// Add events for each navbar item
navItems.forEach((item, index) => {
  item.addEventListener('mouseover', () => {
      updateBorderPosition(index);
  });
  item.addEventListener('mouseout', () => {
      updateBorderPosition(activeIndex);
  });
  item.addEventListener('click', () => {
      navItems[activeIndex].classList.remove('active');
      item.classList.add('active');
      activeIndex = index;
      updateBorderPosition(index);

      const pageId = item.getAttribute('data-page');
      navbarToPage(pageId);
  });
});

// Initialise the border position
updateBorderPosition(activeIndex);

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

// Begin render loop
animate();