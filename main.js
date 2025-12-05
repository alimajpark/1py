// --- 最终修正：解决了变量命名冲突的版本 ---

const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
const scene = new THREE.Scene();

// 这是3D场景的“眼睛”
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 150;

const PARTICLE_COUNT = 15000;
let particlesGeometry = new THREE.BufferGeometry();
let targetPositions = new Float32Array(PARTICLE_COUNT * 3);
let currentPositions = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
    currentPositions[i] = (Math.random() - 0.5) * 200;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
const particlesMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.8,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);
const gui = new lil.GUI();
const params = {
    model: '爱心',
    color: '#ffffff',
    fullscreen: () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
};
gui.add(params, 'model', ['爱心', '花朵', '土星', '佛像', '烟花']).name('选择模型').onChange(updateTargetModel);
gui.addColor(params, 'color').name('粒子颜色').onChange(value => {
    particlesMaterial.color.set(value);
});
gui.add(params, 'fullscreen').name('全屏/退出');
function updateTargetModel() {
    switch(params.model) {
        case '爱心': createHeart(); break;
        case '花朵': createFlower(); break;
        case '土星': createSaturn(); break;
        case '佛像': createFromModel(); break;
        case '烟花': createFireworks(); break;
    }
}
function createHeart() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const t = Math.random() * Math.PI * 2;
        const x = 16 * Math.pow(Math.sin(t), 3);
        const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        const z = (Math.random() - 0.5) * 5;
        targetPositions[i * 3] = x * 4;
        targetPositions[i * 3 + 1] = y * 4;
        targetPositions[i * 3 + 2] = z * 4;
    }
}
function createFlower() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = Math.sin(6 * theta) * 50 + (Math.random() - 0.5) * 10;
        const phi = (Math.random() - 0.5) * 0.2 * Math.PI;
        targetPositions[i * 3] = Math.cos(theta) * r * Math.cos(phi);
        targetPositions[i * 3 + 1] = Math.sin(theta) * r * Math.cos(phi);
        targetPositions[i * 3 + 2] = r * Math.sin(phi);
    }
}
function createSaturn() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (i < PARTICLE_COUNT * 0.6) {
            const phi = Math.acos(-1 + (2 * i) / (PARTICLE_COUNT * 0.6));
            const theta = Math.sqrt((PARTICLE_COUNT * 0.6) * Math.PI) * phi;
            targetPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * 50;
            targetPositions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 50;
            targetPositions[i * 3 + 2] = Math.cos(phi) * 50;
        } else {
            const angle = Math.random() * Math.PI * 2;
            const radius = 80 + (Math.random() - 0.5) * 25;
            targetPositions[i * 3] = Math.cos(angle) * radius;
            targetPositions[i * 3 + 1] = Math.sin(angle) * radius;
            targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
    }
}
function createFromModel() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
        const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
        targetPositions[i * 3] = Math.cos(theta) * Math.sin(phi) * 80;
        targetPositions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * 80;
        targetPositions[i * 3 + 2] = Math.cos(phi) * 80;
    }
}
function createFireworks() {
     for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 120;
        const phi = Math.random() * Math.PI * 2;
        targetPositions[i * 3] = Math.cos(angle) * radius * Math.sin(phi);
        targetPositions[i * 3 + 1] = Math.sin(angle) * radius * Math.sin(phi);
        targetPositions[i * 3 + 2] = Math.cos(phi) * radius;
    }
}
updateTargetModel();
const videoElement = document.querySelector('.input_video');
let handScale = 1.0;
const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
});
hands.onResults(onResults);

// 这是启动手机摄像头的“帮手”，我们把它改回了正确的名字 cameraHelper
const cameraHelper = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480,
});
cameraHelper.start();

function onResults(results) {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const p1 = landmarks[4];
        const p2 = landmarks[8];
        const distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        const targetScale = THREE.MathUtils.mapLinear(distance, 0.03, 0.25, 0.2, 2.0);
        handScale = THREE.MathUtils.clamp(targetScale, 0.2, 2.5);
    } else {
        handScale = 1.0;
    }
}
let currentScale = 1.0;
function animate() {
    requestAnimationFrame(animate);
    currentScale = THREE.MathUtils.lerp(currentScale, handScale, 0.1);
    const positions = particles.geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        positions[i3]     = THREE.MathUtils.lerp(positions[i3], targetPositions[i3] * currentScale, 0.07);
        positions[i3 + 1] = THREE.MathUtils.lerp(positions[i3 + 1], targetPositions[i3 + 1] * currentScale, 0.07);
        positions[i3 + 2] = THREE.MathUtils.lerp(positions[i3 + 2], targetPositions[i3 + 2] * currentScale, 0.07);
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.0005;
    particles.rotation.x += 0.0005;
    renderer.render(scene, camera);
}
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
animate();
