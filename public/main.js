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

let currentLight = "hemispheric";

function setLight(light) {
	let tempLight = lights[light];
	if (tempLight) {
		lights[currentLight].setEnabled(false);
		tempLight.setEnabled(true);
		currentLight = light;
	}
	else {
		console.log("invalid light");
	}
}
function setLightIntensity(intensity) {
	intensity = clamp(intensity, 0, 100) / 100;
	lights[currentLight].intensity = intensity;
}
function setLightDiffuseColor(col) {
	lights[currentLight].diffuse = rgb2color3(col);
}
function setLightSpecularColor(col) {
	lights[currentLight].specular = rgb2color3(col);
}
function setLightGroundColor(col) {
	if (currentLight === "hemispheric") {
		lights[currentLight].groundColor = rgb2color3(col);
	}
	else {
		console.log("ground color only works with hemispheric light");
	}
}

class Flower {
	static flowerCount = 0;

	static createWithStem(x = randVal(-50, 50), y = randVal(-50, 50), z = randVal(-50, 50), centerDiffuseColor = color(255, 255, 0),
				petalDiffuseColor = color(255, 0, 0), petalCount, petalsInRow, rowHeight, petalRandomness, petalFoldMag) {
		let flower = new Flower(centerDiffuseColor);
		flower.initValues(petalCount, petalsInRow, rowHeight, petalRandomness, petalFoldMag);
		flower.initPetal(petalDiffuseColor);
		flower.updatePetal();
		flower.initStem();
		flower.updateStem();
		flower.setPosition(x, y, z);

		return flower;
	}
	static createWithPlatform() {

	}

	constructor(centerDiffuseColor) { // use the color(r, g, b) function
		++Flower.flowerCount;
		this.flowerCenter = BABYLON.MeshBuilder.CreateCylinder("flowerCenter", { height: 1, diameter: 1 }, scene);
		this.flowerCenter.material = new BABYLON.StandardMaterial("material", scene);
		this.flowerCenter.material.diffuseColor = rgb2color3(centerDiffuseColor);

		this.petals = [];

		// this.initValues();

		// this.initPetal(petalDiffuseColor);
		// this.updatePetal();
		
		// this.initStem();
		// this.updateStem();
	}
}
Flower.prototype.initValues = function (petalCount = 40, petalsInRow = 4, rowHeight = 0.3, petalRandomness = 0, petalFoldMag = 0.6) {
	this.petalCount = petalCount;
	this.petalsInRow = petalsInRow;
	this.rowHeight = rowHeight;
	this.petalRandomness = petalRandomness;
	this.petalFoldMag = petalFoldMag;
}
Flower.prototype.initPetal = function (color) {
	this.petalMesh = petalMesh.clone();
	this.petalMesh.material = new BABYLON.StandardMaterial("petalMaterial" + Flower.flowerCount, scene);
	this.petalMesh.material.diffuseColor = rgb2color3(color);
	this.petalMesh.isVisible = false;
}
Flower.prototype.updatePetal = function () {
	if (!this.petalMesh) {
		return;
	}

	for (let petal of this.petals) { // remove old instances on update
		petal.dispose();
	}
	this.petals = [];

	// lowering center cylinder
	let flowerCenterHeight = Math.ceil(this.petalCount / this.petalsInRow) * this.rowHeight;
	this.flowerCenter.scaling.y = flowerCenterHeight;
	this.flowerCenter.position.y = -flowerCenterHeight / 2 + 0.75;

	let dtheta = (2 * Math.PI) / this.petalsInRow;
	let theta = 0;
	let row = 0;

	for (let i = 0; i < this.petalCount; ++i) {
		let petal = this.petalMesh.createInstance("petal" + i);
		petal.rotationQuaternion = null; // disable quaternion rotation so that euler angles may be used later
		this.petals.push(petal);

		if (i % this.petalsInRow === 0) {
			++row;
			theta += dtheta / 2;
			theta += (Math.random() - 0.5) * this.petalRandomness;
		}
		theta += dtheta;

		let cot = new BABYLON.TransformNode("cot" + i); // center of transformation for each petal
		// move center of transformation to edge of cylinder (radius = 0.5)
		cot.position.y = (1 - row) * this.rowHeight;
		cot.position.x = 0.5 * Math.cos(theta);
		cot.position.z = 0.5 * Math.sin(theta);

		petal.parent = cot;
		petal.theta = theta;
	}

	this.updatePetalFold(this.petalFoldMag);
};
Flower.prototype.updatePetalFold = function (mag) {
	this.petalFoldMag = mag;
	for (let petal of this.petals) {
		let cot = petal.parent;

		// transform petals away from cylinder so center of transformation may act as a pivot for folding 
		petal.position.x = (1.5 + this.petalFoldMag) * Math.cos(petal.theta); // 1.5 is a number that works well.
		petal.position.z = (1.5 + this.petalFoldMag) * Math.sin(petal.theta);

		// angle petal towards center of transformation and the cylinder center
		let angle = Math.atan2(cot.position.x, cot.position.z);
		let toRotate = angle + Math.PI; // shifts values that go from -pi to pi, to 0 to 2*pi
		petal.rotation.y = toRotate;

		// fold along axis according to rotation
		cot.rotation.x = Math.cos(toRotate) * this.petalFoldMag;
		cot.rotation.z = -Math.sin(toRotate) * this.petalFoldMag;
	}
}
Flower.prototype.initStem = function () {
	this.stemMesh = stemMesh.clone();
	this.stemMesh.getChildMeshes().forEach((mesh) => {mesh.isVisible = true;});
}
Flower.prototype.updateStem = function () {
	this.stemMesh.position.y = -this.rowHeight * (Math.ceil(this.petalCount / this.petalsInRow)) - 16.75;
}
Flower.prototype.setPosition = function (x, y, z) {
	let translate = new BABYLON.Vector3(x, y, z);

	this.flowerCenter.position.addInPlace(translate);
	this.petals.forEach( petal => petal.parent.position.addInPlace(translate) );
	this.stemMesh.position.addInPlace(translate);
}
Flower.prototype.setPetalDiffuseColor = function (color) {
	this.petalMesh.material.diffuseColor = rgb2color3(color);
}
Flower.prototype.setCenterDiffuseColor = function (color) {
	this.flowerCenter.material.diffuseColor = rgb2color3(color);
}
Flower.prototype.dispose = function () {
	this.flowerCenter.dispose();
	this.petals.forEach( petal => petal.dispose() );
	this.stemMesh.dispose();
}

let petalMesh;
let stemMesh;

let flowers = [];

(async function main () {
	let petalModelData = await BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "Petal.gltf", scene);
	petalMesh = petalModelData.meshes[1]; // index 1 is the petal mesh, index 0 has the root node
	petalMesh.isVisible = false;
	petalMesh.scaling.scaleInPlace(500);

	let stemModelData = await BABYLON.SceneLoader.ImportMeshAsync("", "./assets/", "pottedstem.gltf", scene);
	stemMesh = stemModelData.meshes[0];
	stemMesh.scaling.scaleInPlace(1300);
	stemModelData.meshes.forEach((mesh) => {mesh.isVisible = false});

	flowers.push(Flower.createWithStem(0, 0, 0));

	for (let i = 0; i < 9; ++i) {
		flowers.push(Flower.createWithStem());
	}
})();

// //wind stuff
// //wind streaks are essentially cylinders, so keep that in mind
// let wind = {
// 	count: 10,
// 	minSpeed: 3,
// 	maxSpeed: 7,
// 	minSize: 5,
// 	maxSize: 15,
// 	minWidth: 0.1,
// 	maxWidth: 0.1,
// 	minAlpha: 0.1,
// 	maxAlpha: 0.3,
// 	streaks: [],
// 	boundSize: new BABYLON.Vector3(100, 100, 100), // wind streaks exist within this rectangle centered at (0, 0, 0)
// };

// wind.rootMesh = new BABYLON.MeshBuilder.CreateCylinder("wind", { height: 1, diameter: wind.width}, scene);
// wind.rootMesh.rotation.z = Math.PI/2;
// let mat = new BABYLON.StandardMaterial("mat", scene);
// mat.alpha = 0.1;
// wind.rootMesh.material = mat;
// wind.rootMesh.isVisible = false;

// for (let i = 0; i < wind.count; ++i) {
// 	let streak = wind.rootMesh.createInstance("streak" + i);
// 	streak.velocity = new BABYLON.Vector3(0, 0, 0);

// 	respawnStreak(streak);
// 	wind.streaks.push(streak);
// }

// function boundContainsStreak(streak) {
// 	let pos = streak.position;
// 	let size = wind.boundSize;
// 	return pos.x > -size.x/2 && pos.x < size.x/2 && pos.y > -size.y/2 && pos.y < size.y/2 && pos.z > -size.z/2 && pos.z < size.z/2;
// }
// function respawnStreak(streak) {
// 	let y = (Math.random() - 0.5) * wind.boundSize.y;
// 	let z = (Math.random() - 0.5) * wind.boundSize.z;
// 	streak.position.set(-wind.boundSize.x/2, y, z);

// 	streak.material.alpha = randVal(wind.minAlpha, wind.maxAlpha);
// 	streak.scaling.y = randVal(wind.minSize, wind.maxSize);
// 	streak.scaling.x = randVal(wind.minWidth, wind.maxWidth);
// 	streak.scaling.z = randVal(wind.minWidth, wind.maxWidth);
// 	streak.velocity.x = randVal(wind.minSpeed, wind.maxSpeed);
// }
// function updateWind() {
// 	for (let streak of wind.streaks){
// 		if (streak.position){
// 			streak.position.addInPlace(streak.velocity);
// 		}
// 		if (!boundContainsStreak(streak)) {
// 			respawnStreak(streak);
// 		}
// 	}
// }

// scene.onBeforeRenderObservable.add(() => { // gets called each frame right before painting the screen
// 	updateWind();
// });
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
function rgb2color3(color, g, b) {
	let _r, _g, _b;
	if (g) {
		_r = clamp(color, 0, 255) / 255;
		_g = clamp(g, 0, 255) / 255;
		_b = clamp(b, 0, 255) / 255;
	}
	else {
		_r = clamp(color.r, 0, 255) / 255;
		_g = clamp(color.g, 0, 255) / 255;
		_b = clamp(color.b, 0, 255) / 255;
	}

	return new BABYLON.Color3(_r, _g, _b);
}
function randVal(min, max) {
	return max ? Math.floor(Math.random() * (max - min + 1)) + min : Math.floor(Math.random() * (min + 1));
}
function color(r, g, b) {
	return { r, g, b }
}