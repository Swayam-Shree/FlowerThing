canvas = document.createElement("canvas");
canvas.style.width = "100%";
canvas.style.height = "100%";
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);
scene.maxSimultaneousLights = 1;
scene.ambientColor = new BABYLON.Color3(1, 1, 1);

const camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 10, new BABYLON.Vector3(0, 0, 0), scene);
camera.attachControl(canvas, true);

let lights = {
	"point": new BABYLON.PointLight("pointLight", new BABYLON.Vector3(0, 10, 0), scene),
	"directional": new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(0, -1, 0), scene),
	"hemispheric": new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene)
}
lights["directional"].setEnabled(false);
lights["point"].setEnabled(false);

let settings = {
	light: "hemispheric",

	petalCount: 40,
	petalsInRow: 4,
	flowerRowHeight: 0.3,
	flowerRandomness: 0,
	petalFoldMag: 0.6
}

const flowerCenter = BABYLON.MeshBuilder.CreateCylinder("flowerCenter", { height: 1, diameter: 1}, scene);
const material = new BABYLON.StandardMaterial("material", scene);
flowerCenter.material = material;

let petalMesh;
let petalInstances = [];
BABYLON.SceneLoader.ImportMesh("", "./assets/", "Petal.gltf", scene, (meshes) => {
	petalMesh = meshes[1];
	petalMesh.material = material;
	petalMesh.isVisible = false;
	updatePetals();
});

function updatePetals() {
	if (!petalMesh) {
		return;
	}

	for (let instance of petalInstances) {
		instance.dispose();
	}
	petalInstances = [];

	let flowerCenterHeight = Math.ceil(settings.petalCount/settings.petalsInRow) * settings.flowerRowHeight;
	flowerCenter.scaling.y = flowerCenterHeight;
	flowerCenter.position.y = -flowerCenterHeight/2 + 0.75;
	
	let dtheta = (2 * Math.PI)/settings.petalsInRow;
	let theta = 0;
	let row = 0;

	for (let i = 0; i < settings.petalCount; ++i) {
		let petal = petalMesh.createInstance("petal" + i);
		petalInstances.push(petal);
		let cot = new BABYLON.TransformNode("cot" + i);
		petal.scaling.scaleInPlace(500);
		petal.rotationQuaternion = null;

		if (i % settings.petalsInRow === 0) {
			++row;
			theta += dtheta/2;
			theta += (Math.random() - 0.5) * settings.flowerRandomness;
		}
		theta += dtheta;

		cot.position.y = -(row - 1) * settings.flowerRowHeight;
		cot.position.x = 0.5 * Math.cos(theta);
		cot.position.z = 0.5 * Math.sin(theta);
		
		petal.parent = cot;
		
		petal.theta = theta;
	}

	updatePetalFold(settings.petalFoldMag);
};
function updatePetalFold(mag){
	settings.petalFoldMag = mag;
	for (let petal of petalInstances) {
		let cot = petal.parent;

		petal.position.x = (1.5 + settings.petalFoldMag) * Math.cos(petal.theta);
		petal.position.z = (1.5 + settings.petalFoldMag) * Math.sin(petal.theta);

		let angle = Math.atan2(cot.position.x, cot.position.z);
		let toRotate = angle + Math.PI
		petal.rotation.y = toRotate;

		cot.rotation.x = Math.cos(toRotate) * settings.petalFoldMag;
		cot.rotation.z = -Math.sin(toRotate) * settings.petalFoldMag;
	}
}

function setLight(light) {
	let tempLight = lights[light];
	if (tempLight){
		lights[settings.light].setEnabled(false);
		tempLight.setEnabled(true);
		settings.light = light;
	}
	else {
		console.log("invalid light");
	}
}
function setLightIntensity(intensity) {
	intensity = clamp(intensity, 0, 100)/100;
	lights[settings.light].intensity = intensity;
}
function setLightDiffuseColor(r, g, b) {
	lights[settings.light].diffuse = rgb2color3(r, g, b);
}
function setLightSpecularColor(r, g, b) {
	lights[settings.light].specular = rgb2color3(r, g, b);
}
function setLightGroundColor(r, g, b) {
	if (settings.light === "hemispheric") {
		lights[settings.light].groundColor = rgb2color3(r, g, b);
	}
	else{
		console.log("ground color only works with hemispheric light");
	}
}

function setMaterialDiffuseColor(r, g, b) {
	material.diffuseColor = rgb2color3(r, g, b);
}
function setMaterialSpecularColor(r, g, b) {
	material.specularColor = rgb2color3(r, g, b);
}
function setMaterialEmissiveColor(r, g, b) {
	material.emissiveColor = rgb2color3(r, g, b);
}
function setMaterialAmbientColor(r, g, b) {
	material.ambientColor = rgb2color3(r, g, b);
}
function setMatrialAlpha(alpha) {
	alpha = clamp(alpha, 0, 255)/255;
	material.alpha = alpha;
}

function setPetalCount(count) {
	settings.petalCount = count;
	updatePetals();
}
function setPetalsInRow(count) {
	settings.petalsInRow = count;
	updatePetals();
}
function setFlowerRowHeight(height) {
	settings.flowerRowHeight = height;
	updatePetals();
}
function setFlowerRandomness(value) {
	settings.flowerRandomness = value;
	updatePetals();
}
function setPetalFoldMag(value) {
	updatePetalFold(value);
}

let f = 0;
let petalFoldAnimation = true;
scene.onBeforeRenderObservable.add(() => {
	if (petalFoldAnimation) {
		++f;
		setPetalFoldMag(Math.sin(f/100));
	}
});
engine.runRenderLoop(function () {
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});

function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function rgb2color3(r, g, b) {
	r = clamp(r, 0, 255)/255;
	g = clamp(g, 0, 255)/255;
	b = clamp(b, 0, 255)/255;

	return new BABYLON.Color3(r, g, b);
}