// boilerplate stuff
canvas = document.createElement("canvas");
canvas.style.width = "100%";
canvas.style.height = "100%";
document.body.appendChild(canvas);

const engine = new BABYLON.Engine(canvas);
const scene = new BABYLON.Scene(engine);
scene.maxSimultaneousLights = 1; // so that lights do not overlap (can be canged from console)
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

let settings = { // defaults
	light: "hemispheric",

	petalCount: 40, // total petal count
	petalsInRow: 4, // petals in each row
	flowerRowHeight: 0.3, // distance between rows
	flowerRandomness: 0,
	petalFoldMag: 0.6 // magnitude of petal fold looks good between -1 to 1
}

// a cylinder for the center, will replace with a model later
const flowerCenter = BABYLON.MeshBuilder.CreateCylinder("flowerCenter", { height: 1, diameter: 1}, scene);
const material = new BABYLON.StandardMaterial("material", scene);
flowerCenter.material = material;

// loading petal model
let petalMesh;
let petalInstances = [];
BABYLON.SceneLoader.ImportMesh("", "./assets/", "Petal.gltf", scene, (meshes) => {
	petalMesh = meshes[1]; // index 0 has the root node, and index 1 has the mesh. use root when there are multiple meshes grouped.
	petalMesh.material = material;
	petalMesh.isVisible = false;
	petalMesh.scaling.scaleInPlace(500);
	updatePetals();
});

// loading stem model
let stemMesh;
BABYLON.SceneLoader.ImportMesh("", "./assets/", "pottedstem.gltf", scene, (meshes) => {
	stemMesh = meshes[0];

	stemMesh.scaling.scaleInPlace(1300);
	// stemMesh.position.y = -15.75;
	updateStem();
});

function updatePetals() {
	if (!petalMesh) {
		return;
	}

	for (let instance of petalInstances) { // remove old instances on update
		instance.dispose();
	}
	petalInstances = [];

	// lowering center cylinder and stem
	let flowerCenterHeight = Math.ceil(settings.petalCount/settings.petalsInRow) * settings.flowerRowHeight;
	flowerCenter.scaling.y = flowerCenterHeight;
	flowerCenter.position.y = -flowerCenterHeight/2 + 0.75;
	
	let dtheta = (2 * Math.PI)/settings.petalsInRow;
	let theta = 0;
	let row = 0;

	for (let i = 0; i < settings.petalCount; ++i) {
		let petal = petalMesh.createInstance("petal" + i); // using instances for efficiency, you can also use mesh.clone() for more control.
		petalInstances.push(petal);
		let cot = new BABYLON.TransformNode("cot" + i); // center of transformation for each petal
		petal.rotationQuaternion = null; // disable quaternion rotation so that euler angles may be used later

		if (i % settings.petalsInRow === 0) {
			++row;
			theta += dtheta/2;
			theta += (Math.random() - 0.5) * settings.flowerRandomness;
		}
		theta += dtheta;

		// move center of transformation to edge of cylinder (radius = 0.5)
		cot.position.y = -(row - 1) * settings.flowerRowHeight;
		cot.position.x = 0.5 * Math.cos(theta);
		cot.position.z = 0.5 * Math.sin(theta);
		
		petal.parent = cot;
		
		petal.theta = theta;
	}

	updatePetalFold(settings.petalFoldMag);
	updateStem();
};
function updatePetalFold(mag){
	settings.petalFoldMag = mag;
	for (let petal of petalInstances) {
		let cot = petal.parent;

		// transform petals away from cylinder so center of transformation may act as a pivot for floding 
		petal.position.x = (1.5 + settings.petalFoldMag) * Math.cos(petal.theta);
		petal.position.z = (1.5 + settings.petalFoldMag) * Math.sin(petal.theta);

		// angle petal towards center of transformation and the cylinder center
		let angle = Math.atan2(cot.position.x, cot.position.z);
		let toRotate = angle + Math.PI
		petal.rotation.y = toRotate;

		// fold along axis according to rotation
		cot.rotation.x = Math.cos(toRotate) * settings.petalFoldMag;
		cot.rotation.z = -Math.sin(toRotate) * settings.petalFoldMag;
	}
}
function updateStem() {
	if (stemMesh) {
		stemMesh.position.y = -settings.flowerRowHeight * Math.ceil(settings.petalCount/settings.petalsInRow) - 16.75;
	}
}

//wind stuff
//wind streaks are essentially cylinders, so keep that in mind
let wind = {
	count: 10,
	minSpeed: 3,
	maxSpeed: 7,
	minSize: 5,
	maxSize: 15,
	minWidth: 0.1,
	maxWidth: 0.1,
	minAlpha: 0.1,
	maxAlpha: 0.3,
	streaks: [],
	boundSize: new BABYLON.Vector3(100, 100, 100), // wind streaks exist within this rectangle centered at (0, 0, 0)
};

wind.rootMesh = new BABYLON.MeshBuilder.CreateCylinder("wind", { height: 1, diameter: wind.width}, scene);
wind.rootMesh.rotation.z = Math.PI/2;
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.alpha = 0.1;
wind.rootMesh.material = mat;
wind.rootMesh.isVisible = false;

for (let i = 0; i < wind.count; ++i) {
	let streak = wind.rootMesh.createInstance("streak" + i);
	streak.velocity = new BABYLON.Vector3(0, 0, 0);
	
	respawnStreak(streak);
	wind.streaks.push(streak);
}

function boundContainsStreak(streak) {
	let pos = streak.position;
	let size = wind.boundSize;
	return pos.x > -size.x/2 && pos.x < size.x/2 && pos.y > -size.y/2 && pos.y < size.y/2 && pos.z > -size.z/2 && pos.z < size.z/2;
}
function respawnStreak(streak) {
	let y = (Math.random() - 0.5) * wind.boundSize.y;
	let z = (Math.random() - 0.5) * wind.boundSize.z;
	streak.position.set(-wind.boundSize.x/2, y, z);

	streak.material.alpha = randVal(wind.minAlpha, wind.maxAlpha);
	streak.scaling.y = randVal(wind.minSize, wind.maxSize);
	streak.scaling.x = randVal(wind.minWidth, wind.maxWidth);
	streak.scaling.z = randVal(wind.minWidth, wind.maxWidth);
	streak.velocity.x = randVal(wind.minSpeed, wind.maxSpeed);
}
function updateWind() {
	for (let streak of wind.streaks){
		if (streak.position){
			streak.position.addInPlace(streak.velocity);
		}
		if (!boundContainsStreak(streak)) {
			respawnStreak(streak);
		}
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
scene.onBeforeRenderObservable.add(() => { // gets called each frame right before painting the screen
	if (petalFoldAnimation) {
		++f;
		setPetalFoldMag(Math.sin(f/100));
	}
	updateWind();
});
engine.runRenderLoop(function () { // gets called each frame
	scene.render();
});

window.addEventListener("resize", function () {
	engine.resize();
});

// helper functions
function clamp(v, a, b) {
	return Math.max(a, Math.min(b, v));
}
function rgb2color3(r, g, b) {
	r = clamp(r, 0, 255)/255;
	g = clamp(g, 0, 255)/255;
	b = clamp(b, 0, 255)/255;

	return new BABYLON.Color3(r, g, b);
}
function randVal(min, max) {
	return max ? Math.floor(Math.random() * (max - min + 1)) + min : Math.floor(Math.random() * (min + 1));
}
function map(v, a, b, c, d) {
	return (v - a) / (b - a) * (d - c) + c;
}