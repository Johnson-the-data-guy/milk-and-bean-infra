// Scroll-driven 3D objects, one docked near each major section:
//   hero    -> pink glazed doughnut (the signature object)
//   menu    -> steaming coffee cup
//   about   -> coffee bean cluster
//   reserve -> chocolate glazed doughnut
//
// The hero object is the one the spec requires a fallback for, so it keeps
// its CSS ring (.donut-fallback) for reduced-motion / small-viewport / no-WebGL.
// The other three are pure enhancement: they're CSS-hidden below 1000px
// (see .float-object rules in style.css) and simply don't get a WebGL
// context down there — nothing to fall back to, nothing wasted on mobile.

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroSmallViewport = window.matchMedia("(max-width: 640px)").matches;
const extraObjectsViewportOK = window.matchMedia("(min-width: 1000px)").matches;

function supportsWebGL() {
  try {
    const test = document.createElement("canvas");
    return !!(window.WebGLRenderingContext &&
      (test.getContext("webgl") || test.getContext("experimental-webgl")));
  } catch (e) {
    return false;
  }
}

const instances = [];
let idle = 0;
let running = true;

function localProgress(el) {
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const total = rect.height + vh;
  const traveled = vh - rect.top;
  return Math.min(1, Math.max(0, traveled / total));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Big on reveal (progress ~0, section just arriving), smaller as the
// section scrolls past (progress -> 1). Shared by every object below.
function scaleForProgress(progress) {
  return lerp(1.4, 0.6, progress);
}

if (supportsWebGL() && !prefersReducedMotion) {
  init();
}

async function init() {
  const THREE = await import("https://unpkg.com/three@0.160.0/build/three.module.js");

  const builders = {
    "donut-pink": (scene) => buildDoughnut(scene, THREE, 0xf6a6c1, true),
    "donut-choc": (scene) => buildDoughnut(scene, THREE, 0x6b4226, false),
    cup: (scene) => buildCoffeeCup(scene, THREE),
    beans: (scene) => buildBeanCluster(scene, THREE),
  };
  const animators = {
    "donut-pink": animateDoughnut,
    "donut-choc": animateDoughnut,
    cup: animateCup,
    beans: animateBeans,
  };

  document.querySelectorAll("[data-object]").forEach((wrapEl) => {
    const kind = wrapEl.dataset.object;
    const sectionEl = document.getElementById(wrapEl.dataset.section);
    const canvas = wrapEl.querySelector("canvas");
    const builder = builders[kind];
    if (!sectionEl || !canvas || !builder) return;

    if (kind === "donut-pink" && heroSmallViewport) return;
    if (kind !== "donut-pink" && !extraObjectsViewportOK) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    addLights(scene, THREE);
    const built = builder(scene);

    function resize() {
      const rect = wrapEl.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height, 1);
      renderer.setSize(size, size, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    wrapEl.classList.add("js-3d-active");
    instances.push({ renderer, scene, camera, section: sectionEl, built, animate: animators[kind] });
  });

  if (!instances.length) return;

  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState === "visible";
    if (running) requestAnimationFrame(tick);
  });

  tick();
}

function tick() {
  if (!running) return;
  requestAnimationFrame(tick);
  idle += 0.012;

  for (const inst of instances) {
    const progress = localProgress(inst.section);
    inst.animate(inst.built, progress, idle);
    inst.renderer.render(inst.scene, inst.camera);
  }
}

function addLights(scene, THREE) {
  scene.add(new THREE.AmbientLight(0xfff1e0, 0.65));
  const key = new THREE.DirectionalLight(0xffd9a0, 1.2);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0xff9fc4, 0.8, 12);
  rim.position.set(-2.5, -1, 2.5);
  scene.add(rim);
}

// ---------- Doughnut (pink + sprinkles, or bare chocolate glaze) ----------

function buildDoughnut(scene, THREE, glazeColor, withSprinkles) {
  const group = new THREE.Group();
  scene.add(group);

  const glazeMaterial = new THREE.MeshPhysicalMaterial({
    color: glazeColor,
    roughness: 0.32,
    clearcoat: 1,
    clearcoatRoughness: 0.18,
    metalness: 0.04,
  });
  const torus = new THREE.Mesh(new THREE.TorusGeometry(1, 0.42, 24, 90), glazeMaterial);
  group.add(torus);

  if (withSprinkles) {
    const sprinkleColors = [0xff6fa8, 0x6fcf97, 0xffd166, 0x5b8def, 0xff8c42];
    const sprinkleGeo = new THREE.CapsuleGeometry(0.035, 0.1, 2, 6);
    for (let i = 0; i < 30; i++) {
      const material = new THREE.MeshStandardMaterial({
        color: sprinkleColors[i % sprinkleColors.length],
        roughness: 0.5,
      });
      const sprinkle = new THREE.Mesh(sprinkleGeo, material);
      const u = Math.random() * Math.PI * 2;
      const v = (Math.random() - 0.5) * 1.3;
      const R = 1;
      const r = 0.42 * 1.05;
      sprinkle.position.set(
        (R + r * Math.cos(v)) * Math.cos(u),
        (R + r * Math.cos(v)) * Math.sin(u),
        r * Math.sin(v)
      );
      sprinkle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      group.add(sprinkle);
    }
  }

  return { group };
}

function animateDoughnut({ group }, progress, idleT) {
  group.rotation.x = progress * Math.PI * 2.2;
  group.rotation.y = 0.4 + progress * Math.PI * 1.4 + idleT * 0.3;
  group.rotation.z = Math.sin(progress * Math.PI * 1.3) * 0.5;

  group.position.x = lerp(0.3, -0.5, progress);
  group.position.y = Math.sin(progress * Math.PI * 1.6) * 0.35 - progress * 0.4;
  group.position.z = lerp(0, -1.4, progress);
  group.scale.setScalar(scaleForProgress(progress));
}

// ---------- Coffee cup: lathed mug body + handle + saucer + steam ----------

function buildCoffeeCup(scene, THREE) {
  const group = new THREE.Group();
  scene.add(group);

  const profile = [
    new THREE.Vector2(0.0, -0.65),
    new THREE.Vector2(0.55, -0.65),
    new THREE.Vector2(0.6, -0.55),
    new THREE.Vector2(0.62, 0.3),
    new THREE.Vector2(0.66, 0.55),
    new THREE.Vector2(0.6, 0.62),
    new THREE.Vector2(0.52, 0.55),
    new THREE.Vector2(0.5, -0.5),
  ];
  const mugMaterial = new THREE.MeshStandardMaterial({ color: 0xf8eedd, roughness: 0.45, metalness: 0.05 });
  const mug = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), mugMaterial);
  group.add(mug);

  const coffeeMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2412, roughness: 0.25 });
  const coffeeSurface = new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), coffeeMaterial);
  coffeeSurface.rotation.x = -Math.PI / 2;
  coffeeSurface.position.y = 0.56;
  group.add(coffeeSurface);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 12, 32, Math.PI * 1.4), mugMaterial);
  handle.position.set(0.62, 0, 0);
  handle.rotation.set(0, Math.PI / 2, Math.PI * 0.2);
  group.add(handle);

  const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1, 0.06, 40), mugMaterial);
  saucer.position.y = -0.68;
  group.add(saucer);

  const steamMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff8ef,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });
  const steams = [];
  for (let i = 0; i < 3; i++) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.5, 1, 8), steamMaterial.clone());
    mesh.position.set((i - 1) * 0.18, 0.9, 0);
    group.add(mesh);
    steams.push(mesh);
  }

  return { group, steams };
}

function animateCup({ group, steams }, progress, idleT) {
  group.rotation.y = progress * Math.PI * 1.6 - 0.4;
  group.rotation.z = Math.sin(progress * Math.PI) * 0.25;

  group.position.x = lerp(-0.4, 0.4, progress);
  group.position.y = Math.sin(progress * Math.PI * 1.4) * 0.3;
  group.position.z = lerp(-0.6, 0, progress);
  group.scale.setScalar(scaleForProgress(progress));

  steams.forEach((mesh, i) => {
    const t = (idleT * 0.6 + i * 0.6) % 2;
    mesh.position.y = 0.9 + t * 0.5;
    mesh.position.x = Math.sin(idleT * 2 + i) * 0.08 + (i - 1) * 0.18;
    mesh.material.opacity = 0.35 * (1 - t / 2);
  });
}

// ---------- Coffee bean cluster ----------

function buildBeanCluster(scene, THREE) {
  const group = new THREE.Group();
  scene.add(group);

  const beanMaterial = new THREE.MeshStandardMaterial({ color: 0x3b2412, roughness: 0.5 });
  const creaseMaterial = new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.6 });

  for (let i = 0; i < 7; i++) {
    const bean = new THREE.Group();

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), beanMaterial);
    body.scale.set(1, 0.72, 0.85);
    bean.add(body);

    const crease = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.42, 2, 6), creaseMaterial);
    crease.rotation.z = Math.PI / 2;
    crease.position.z = 0.14;
    bean.add(crease);

    const angle = (i / 7) * Math.PI * 2;
    const radius = 0.55 + (i % 2) * 0.25;
    bean.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, (Math.random() - 0.5) * 0.4);
    bean.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    group.add(bean);
  }

  return { group };
}

function animateBeans({ group }, progress, idleT) {
  group.rotation.y = idleT * 0.4 + progress * Math.PI;
  group.rotation.x = Math.sin(progress * Math.PI) * 0.4;

  group.position.y = Math.sin(progress * Math.PI * 1.5) * 0.3;
  group.position.z = lerp(-1, 0, progress);
  group.scale.setScalar(scaleForProgress(progress));

  group.children.forEach((bean, i) => {
    bean.rotation.y += 0.004 * ((i % 3) + 1);
  });
}
