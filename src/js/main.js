import {
    AmbientLight,
    AxesHelper,
    BackSide,
    Clock,
    Color,
    FrontSide,
    Math,
    Mesh,
    MeshPhysicalMaterial,
    MeshStandardMaterial,
    PerspectiveCamera,
    PointLight,
    Scene,
    ShaderMaterial,
    SphereBufferGeometry,
    WebGLRenderer,
    TextureLoader,
    CubeTextureLoader,
    Vector3, PlaneBufferGeometry, Texture, MeshBasicMaterial, CubeTexture
} from 'three';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {randFloat} from "three/src/math/MathUtils";

const clock = new Clock();
let scene, camera, renderer, env, envLoader, loader, textureCube, ambientLight, pointLight1, pointLight2, gold, wax, wick, controls,
    menorah,
    flameMaterials = [],
    time = 0,
    timeOffsets = [
        0,
        randFloat(0.5, 3),
        randFloat(0.5, 3),
        randFloat(0.5, 3),
        randFloat(0.5, 3),
        randFloat(0.5, 3),
        randFloat(0.5, 3),
    ],
    materials = {
        gold: {
            reflectivity: 0,
            roughness: 0.1,
            color: 0xFFDF34,
            clearcoat: 1,
            clearcoatRoughness: 1,
            ior: 1.8,
            metalness: 0.3,

        },
        wax: {
            metalness: 0,
            roughness: 1,
        }
    },
    settings = {
        ambientIntensity: 0.2,
    };

    envLoader = new CubeTextureLoader();
    envLoader.setPath( '/assets/envmap/')
    textureCube = envLoader.load( [
        'px.png', 'nx.png',
        'py.png', 'ny.png',
        'pz.png', 'nz.png'
    ] );
    

function addAxesHelper() {
    let axes = new AxesHelper(10);
    scene.add(axes);
}

function createScene() {
    scene = new Scene();
    scene.background = new Color(0x2b3134) //textureCube;
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

function getFlameMaterial(isFrontSide) {
    let side = isFrontSide ? FrontSide : BackSide;
    return new ShaderMaterial({
        uniforms: {
            time: {value: 0}
        },
        vertexShader: `
        uniform float time;
        varying vec2 vUv;
        varying float hValue;

        //https://thebookofshaders.com/11/
        // 2D Random
        float random (in vec2 st) {
            return fract(sin(dot(st.xy,
                                 vec2(12.9898,78.233)))
                         * 43758.5453123);
        }

        // 2D Noise based on Morgan McGuire @morgan3d
        // https://www.shadertoy.com/view/4dS3Wd
        float noise (in vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);

            // Four corners in 2D of a tile
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));

            // Smooth Interpolation

            // Cubic Hermine Curve.  Same as SmoothStep()
            vec2 u = f*f*(3.0-2.0*f);
            // u = smoothstep(0.,1.,f);

            // Mix 4 coorners percentages
            return mix(a, b, u.x) +
                    (c - a)* u.y * (1.0 - u.x) +
                    (d - b) * u.x * u.y;
        }

        void main() {
          vUv = uv;
          vec3 pos = position;

          pos *= vec3(0.8, 2, 0.725);
          hValue = position.y;
          //float sinT = sin(time * 2.) * 0.5 + 0.5;
          float posXZlen = length(position.xz);

          pos.y *= 1. + (cos((posXZlen + 0.25) * 3.1415926) * 0.25 + noise(vec2(0, time)) * 0.125 + noise(vec2(position.x + time, position.z + time)) * 0.5) * position.y; // flame height

          pos.x += noise(vec2(time * 2., (position.y - time) * 4.0)) * hValue * 0.0312; // flame trembling
          pos.z += noise(vec2((position.y - time) * 4.0, time * 2.)) * hValue * 0.0312; // flame trembling

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
        }
      `,
        fragmentShader: `
        varying float hValue;
        varying vec2 vUv;

        // honestly stolen from https://www.shadertoy.com/view/4dsSzr
        vec3 heatmapGradient(float t) {
          return clamp((pow(t, 1.5) * 0.8 + 0.2) * vec3(smoothstep(0.0, 0.35, t) + t * 0.5, smoothstep(0.5, 1.0, t), max(1.0 - t * 1.7, t * 7.0 - 6.0)), 0.0, 1.0);
        }

        void main() {
          float v = abs(smoothstep(0.0, 0.4, hValue) - 1.);
          float alpha = (1. - v) * 0.99; // bottom transparency
          alpha -= 1. - smoothstep(1.0, 0.97, hValue); // tip transparency
          gl_FragColor = vec4(heatmapGradient(smoothstep(0.0, 0.3, hValue)) * vec3(0.95,0.95,0.4), alpha) ;
          gl_FragColor.rgb = mix(vec3(0,0,1), gl_FragColor.rgb, smoothstep(0.0, 0.3, hValue)); // blueish for bottom
          gl_FragColor.rgb += vec3(1, 0.9, 0.5) * (1.25 - vUv.y); // make the midst brighter
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.66, 0.32, 0.03), smoothstep(0.95, 1., hValue)); // tip
        }
      `,
        transparent: true,
        side: side
    });
}

function flame(isFrontSide, x, y, z) {
    let flameGeo = new SphereBufferGeometry(0.5, 32, 32);
    flameGeo.translate(0, 0.5, 0);
    let flameMat = getFlameMaterial(true);
    flameMaterials.push(flameMat);
    let flame = new Mesh(flameGeo, flameMat);
    flame.position.set(x, y, z);
    flame.rotation.y = Math.degToRad(-45);
    scene.add(flame);
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

    // flame(false, 0, 66.6, 0);
    flame(true, 0, 66.6, 0);

    // flame(false, 6.3, 66.6, 0);
    flame(true, 6.3, 66.6, 0);

    // flame(false, 12.6, 66.6, 0);
    flame(true, 12.6, 66.6, 0);

    // flame(false, 18.9, 66.6, 0);
    flame(true, 18.9, 66.6, 0);

    // flame(false, -6.3, 66.6, 0);
    flame(true, -6.3, 66.6, 0);

    // flame(false, -12.6, 66.6, 0);
    flame(true, -12.6, 66.6, 0);

    // flame(false, -18.9, 66.6, 0);
    flame(true, -18.9, 66.6, 0);
}

function createMaterial() {
    gold = new MeshPhysicalMaterial();
    gold.color = new Color(materials.gold.color);
    gold.roughness = materials.gold.roughness;
    gold.reflectivity  = materials.gold.reflectivity;
    gold.metalness  = materials.gold.metalness;
    gold.clearcoat = materials.gold.clearcoat;
    gold.clearcoatRoughness = materials.gold.clearcoatRoughness;
    gold.normalMap = new TextureLoader().load( "/assets/blue_concrete_02_normal.png")
    gold.ior = materials.gold.ior;
    gold.envMap = textureCube

    wick = new MeshStandardMaterial();
    wick.color = new Color(0x000000);

    wax = new MeshStandardMaterial();
    wax.color = new Color(0xfff2cf);
    wax.roughness = materials.wax.roughness;
    wax.metalness = materials.wax.metalness;

    env = new MeshBasicMaterial();
    env.color = 0xffffff;
    env.envMap = textureCube;



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
    controls.target = new Vector3(0, 33, 0);
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
    time += clock.getDelta();
    for (let i = 0; i < 7; i++) {
        flameMaterials[i].uniforms.time.value = time + timeOffsets[i];
    }
    renderer.render(scene, camera);
    requestAnimationFrame(mainLoop);
}

init();
mainLoop();
