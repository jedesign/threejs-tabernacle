import {
    Scene,
    AxesHelper,
    PerspectiveCamera,
    WebGLRenderer,
    Color,
    AmbientLight,
    PointLight,
    MeshStandardMaterial,
    Vector3, PlaneBufferGeometry
} from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {Fire} from "three/examples/jsm/objects/Fire";

let scene, camera, renderer, loader, ambientLight, pointLight1, pointLight2, gold, wax, wick, controls,
    menorah,
    materials = {
        gold: {
            metalness: 0.4,
            roughness: 0.4,
        },
        wax: {
            metalness: 0,
            roughness: 1,
        }
    },
    settings = {
        ambientIntensity: 0.2,
    };

function addAxesHelper() {
    let axes = new AxesHelper(10);
    scene.add(axes);
}

function createScene() {
    scene = new Scene();
    scene.background = new Color(0x2b3134);
}

function createCamera() {
    camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
}

function createRenderer() {
    renderer = new WebGLRenderer({antialias: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function createLoader() {
    loader = new OBJLoader();
    loader.load(
        'assets/menorah.obj',
        function (object) {
            menorah = object;
            window.menorah = object;
            createMaterial();
            scene.add(object);
        }
    );

}

function createFlame(x = 0, y = 0) {
    let fire = new Fire(new PlaneBufferGeometry(5, 5), {
        debug: false
    });
    fire.clearSources();
    fire.addSource(0.5, 0.1, 0.1, 1.0, 0.0, 1.0);
    fire.color1.set(0xffffff);
    fire.color2.set(0xffa000);
    fire.color3.set(0x2b3134);
    fire.windVector.x = 0;
    fire.windVector.y = 0.5;
    fire.burnRate = 2;
    fire.colorBias = 0.5;
    fire.diffuse = 1.33;
    fire.expansion = 0.0;
    fire.swirl = 0;
    fire.drag = 0;
    fire.airSpeed = 8.0;
    fire.speed = 500.0;
    fire.massConservation = false;
    fire.position.x = x;
    fire.position.y = y;
    scene.add(fire);
}

function createLight() {
    ambientLight = new AmbientLight(0xffffff, settings.ambientIntensity);
    scene.add(ambientLight);

    pointLight1 = new PointLight(0xffffff, 0.5);
    pointLight1.position.z = 2500;
    pointLight1.position.x = -2500;
    pointLight1.position.y = 1000;
    scene.add(pointLight1);

    pointLight2 = new PointLight(0xffffff, 0.2);
    pointLight2.position.z = 2500;
    pointLight2.position.x = 2500;
    pointLight2.position.y = 1000;
    scene.add(pointLight2);

    createFlame(0, 69.2);
    createFlame(6.3, 69.2);
    createFlame(12.6, 69.2);
    createFlame(18.9, 69.2);
    createFlame(-6.3, 69.2);
    createFlame(-12.6, 69.2);
    createFlame(-18.9, 69.2);
}

function createMaterial() {
    gold = new MeshStandardMaterial();
    gold.color = new Color(0xffd100);
    gold.roughness = materials.gold.roughness;
    gold.metalness = materials.gold.metalness;

    wick = new MeshStandardMaterial();
    wick.color = new Color(0x000000);

    wax = new MeshStandardMaterial();
    wax.color = new Color(0xfff2cf);
    wax.roughness = materials.wax.roughness;
    wax.metalness = materials.wax.metalness;


    menorah.children.map(function (materialGroup) {
        if (materialGroup.name === 'stand') {
            materialGroup.material = gold;
        }
        if (materialGroup.name === 'candles') {
            materialGroup.material = wax;
        }
        if (materialGroup.name === 'wick') {
            materialGroup.material = wick;
        }
    });
}

function createOrbitControlls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.screenSpacePanning = true;
    controls.target = new Vector3(0, 32, 0);
}

function init() {
    createScene();
    createCamera();
    createLoader();
    createLight();
    createRenderer();
    createOrbitControlls();
    // addAxesHelper();

    camera.position.z = 50;
    camera.position.y = 32;
    controls.update();
}

function mainLoop() {
    controls.update();
    renderer.clear();
    renderer.render(scene, camera);
    requestAnimationFrame(mainLoop);
}

init();
mainLoop();