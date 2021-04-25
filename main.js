var canvas;
var ctx;
var lastTime;
var keysDown = new Set();
var images = {};
var audio = {};
const SURFACE = 500;
const MAXX = 12000;
const MINX = -8000;
var frameNo = 0;
var startTime = 0;

var sceneState = {
	
	camera: {
		x: 0,
		y: 0,
		dx: 0,
		dy: 0,
		zoom: 0.5,
		targetZoom: 0.5
	},
	attemptStart: 0,
	bubbles: [],
	gems: []
}

var upgrades = {
	"gas": {cost: 50, name: "Refuel", text: "Refill your fuel tank to the brim", effect: function() {sceneState.sub.fuel = sceneState.sub.maxFuel}, available: function() {return true}},
	"fueltank1": {cost: 100, name: "New fuel tank", text: "Bigger fuel tank", effect: function() {sceneState.sub.maxFuel = sceneState.sub.fuel = 20000;}, available: function() {return !this.obtained}},
	"fueltank2": {cost: 500, name: "Another fuel tank", text: "Even bigger fuel tank", effect: function() {sceneState.sub.maxFuel = sceneState.sub.fuel = 40000}, available: function() {return !this.obtained && upgrades.fueltank1.obtained}},
	"oxygen1": {cost: 500, name: "New oxygen tank", text: "With more oxygen, you will last underwater longer", effect: function() {sceneState.sub.maxOxygen = 200}, available: function() {return !this.obtained}},
	"oxygen2": {cost: 2000, name: "More oxygen tanks", text: "More oxygen!", effect: function() {sceneState.sub.maxOxygen = 400}, available: function() {return !this.obtained && upgrades.oxygen1.obtained}},
	"motor1": {cost: 500, name: "Electric turbine", text: "Be faster!", effect: function() {sceneState.sub.powerX = 1}, available: function() {return !this.obtained}},
	"motor2": {cost: 4000, name: "More flaps", text: "Even more speed!", effect: function() {sceneState.sub.powerX = 1.7}, available: function() {return !this.obtained && upgrades.motor1.obtained}},
	"motor3": {cost: 6000, name: "Nuclear turbines", text: "Top speed, but with extreme fuel consumption", effect: function() {sceneState.sub.powerX = 3}, available: function() {return !this.obtained && upgrades.motor2.obtained}},
	"cargo1": {cost: 200, name: "Wooden box", text: "Stores a bit more cargo than your hands", effect: function() {sceneState.sub.cargoSpace = 10; sceneState.sub.saleFreq = 40}, available: function() {return !this.obtained}},
	"cargo2": {cost: 500, name: "A drawer", text: "Additional storage space", effect: function() {sceneState.sub.cargoSpace = 10; sceneState.sub.saleFreq = 25}, available: function() {return !this.obtained && upgrades.cargo1.obtained}},
	"cargo3": {cost: 1000, name: "Shipping container", text: "Substantial additional cargo space", effect: function() {sceneState.sub.cargoSpace = 30; sceneState.sub.saleFreq = 15}, available: function() {return !this.obtained && upgrades.cargo2.obtained}},
	"cargo4": {cost: 5000, name: "Black hole", text: "Somehow, you can store a lot of cargo in it", effect: function() {sceneState.sub.cargoSpace = 100; sceneState.sub.saleFreq = 5; sceneState.sub.magnetPow = 40}, available: function() {return !this.obtained && upgrades.cargo3.obtained && upgrades.magnet2.obtained}},
	"vert1": {cost: 500, name: "Better ballast tanks", text: "Faster submerging and sufracing", effect: function() {sceneState.sub.powerY = 1.2;}, available: function() {return !this.obtained && upgrades.motor1.obtained}},
	"vert2": {cost: 5000, name: "Arrows", text: "Further increase vertical speed", effect: function() {sceneState.sub.powerY = 1.5;}, available: function() {return !this.obtained && upgrades.vert1.obtained}},
	"vert3": {cost: 15000, name: "Quantum lift", text: "Use physics to submerge faster", effect: function() {sceneState.sub.powerY = 2.7;}, available: function() {return !this.obtained && upgrades.vert2.obtained && upgrades.motor3.obtained}},
	"magnet1": {cost: 300, name: "Magnet", text: "Pull items closer", effect: function() {sceneState.sub.magnetPow = 10;}, available: function() {return !this.obtained && upgrades.cargo1.obtained}},
	"magnet2": {cost: 1000, name: "Electromagnet", text: "Get much more magnet power", effect: function() {sceneState.sub.magnetPow = 20;}, available: function() {return !this.obtained && upgrades.magnet1.obtained}},
}

var resInfo = {
	"can": {coords: [100, 200, 100, 100], val: 15, peak: 800, spread: 500, amt: 10},
	"boot": {coords: [150, 0, 100, 100], val: 20, peak: 1000, spread: 500, amt: 10},
	"fishsmall": {coords: [50, 0, 100, 50], val: 50, peak: 3000, spread: 1500, amt: 10},
	"bronze": {coords: [50, 100, 50, 50], val: 40, peak: 2000, spread: 800, amt: 10},
	"silver": {coords: [0, 100, 50, 50], val: 70, peak: 3000, spread: 2000, amt: 10},
	"gold": {coords: [0, 0, 50, 50], val: 100, peak: 4400, spread: 1500, amt: 10},
	"goldignot": {coords: [0, 50, 100, 50], val: 450, peak: 10000, spread: 1500, amt: 10},
	"pearl": {coords: [100, 50, 50, 50], val: 1000, peak: 15000, spread: 4500, amt: 5},
	"ruby": {coords: [200, 100, 100, 100], val: 800, peak: 15000, spread: 4500, amt: 15},
	"diamond": {coords: [100, 100, 100, 100], val: 2000, peak: 20000, spread: 3500, amt: 15},
	"deepfish": {coords: [200, 200, 150, 150], val: 1000, peak: 28000, spread: 5500, amt: 12},
	"fastfish": {coords: [0, 300, 200, 50], val: 200, peak: 3000, spread: 2500, amt: 12},
}
function Bubble(x, y, dx, scale) {
	this.x = x;
	this.y = y - 10 + Math.random() * 20;
	if (!this.scale) {
		this.scale = Math.random();
	}
	this.dx = -dx * 0.1;
	this.dy = 0;
	this.update = function() {
		this.x += this.dx;
		this.y += this.dy;
		this.dy -= 0.1;
		this.dx += -0.1 + Math.random() * 0.2;
	}
	this.draw = function() {
		var diff = MAXX - MINX;
		for (var i = -1; i < 2; ++i) {
			ctx.save();
			ctx.translate(this.x + diff * i, this.y);
			ctx.scale(this.scale, this.scale);
			ctx.globalAlpha = 0.5;
			ctx.drawImage(images.bubble, 0, 0);
			ctx.restore();
		}
	}
	this.dead = function() {
		return this.y < SURFACE;
	}
}
function SellText(gem, x, y) {
	this.x = x - 100 + Math.random() * 200;
	this.y = y - 100 + Math.random() * 200;
	this.dy = 0;
	this.gem = gem;
	this.age = 0;
	this.update = function() {
		this.y += this.dy;
		this.age += 1;
		if (this.age > 50) {
			this.dy -= 0.1;
		}
	}
	this.draw = function() {
		ctx.save();
		if (this.age > 50) {
			ctx.globalAlpha = 1 - (this.age - 50) / 50;
		}
		ctx.translate(this.x, this.y);
		drawResource(this.gem.type);
		ctx.fillText("$" + this.gem.val, 50, 50);
		ctx.restore();
	}
	this.dead = function() {
		return this.age > 100;
	}
}
function Gem(type, x, y) {
	this.type = type;
	this.fish = ["fishsmall", "deepfish", "fastfish"].includes(type);
	this.x = x;
	this.y = y;
	this.speed = {"fastfish": 15}[type] || 1;
	if (this.y < SURFACE) {
		this.y = SURFACE;
	}
	this.dx = 0;
	if (this.fish) {
		this.dx = Math.random() * 4 - 2;
	}
	this.dy = 0;
	this.val = resInfo[this.type].val;
	this.draw = function() {
		var diff = MAXX - MINX;
		for (var i = -1; i < 2; ++i) { 
			ctx.save();
			ctx.translate(this.x + i * diff, this.y);
			if (this.dx < 0) {
				ctx.scale(-1, 1);
			}
			drawResource(this.type);
			ctx.restore();
		}
	}
	this.update = function() {
		this.x += this.dx;
		this.y += this.dy;
		var maxSpeed = {fishsmall: 2}[this.type];
		//this.dx += Math.random() - 0.5;
		var maxSpeed = 8;
		this.dx = Math.min(maxSpeed, Math.max(-maxSpeed, this.dx));
		this.dy = Math.min(maxSpeed, Math.max(-maxSpeed, this.dy));
		if (this.y < SURFACE) {
			this.dy += 0.6;
		}
		this.dx *= 0.99;
		this.dy *= 0.99;
		
		if (this.fish && Math.random() < 0.01 && Math.sqrt(Math.pow(this.x - sceneState.sub.x, 2) + Math.pow(this.y - sceneState.sub.y, 2)) < 1200) {
			sceneState.bubbles.push(new Bubble(this.x, this.y, 0, 0.1 + Math.random() * 0.2));
		}
		
		var diff = MAXX - MINX
		if (this.x < MINX) {
			this.x += diff;
		}
		if (this.x > MAXX) {
			this.x -= diff;
		}
	}
}
function drawResource(type) {
	var coords = resInfo[type].coords;
	ctx.drawImage(images.resources, ...coords, -40, 0, coords[2], coords[3]);
}

function generateGems() {
	var resData = resInfo;
	sceneState.gems = [];
	var g = sceneState.gems;
	for (var resName of Object.keys(resData)) {
		var res = resData[resName];
		for (var i = 0; i < res.amt; ++i) {
			g.push(new Gem(resName, MINX + Math.random() * (MAXX - MINX), SURFACE + res.peak + bmRand() * res.spread));
		}
	}
	
}

function restart() {
	generateGems();
	sceneState.sub = {
		toRight: true,
		lastChange: 0,
		x: 6000,
		y: SURFACE,
		dx: 0,
		dy: 0,
		rotorPhase: 0,
		oxygen: 100,
		maxOxygen: 100,
		dOxygen: 0.1,
		fuel: 10000,
		maxFuel: 10000,
		powerX: 0.5,
		powerY: 1,
		grabDist: 100,
		magnetPow: 0,
		cargo: [],
		cargoSpace: 4,
		lastSale: 0,
		saleFreq: 60,
		money: 000,
		lastPlayed: 0
	};
	for (var b of Object.values(upgrades)) {
		b.obtained = false;
	}
	sceneState.attemptStart = Date.now();
	prepareButtons();
}

function main(){
	startTime = Date.now();
	canvas = document.getElementById("game");
	ctx = canvas.getContext("2d");
	var thingsLoaded = 0;
	function newLoad(e) {
		++thingsLoaded;
		var totThings = Object.values(images).length + Object.values(audio).length;
		console.log(thingsLoaded + "/" + totThings);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.font = "80px Arial";
		var progress = thingsLoaded / totThings;
		ctx.fillText("Loading... " + parseFloat(progress) * 100 + "%", 100, 100);
		ctx.fillStyle = "#000055"
		ctx.fillRect(100, 150, 500, 50);
		ctx.fillStyle = "#550000"
		ctx.fillRect(102, 152, 496 * progress, 46);
		
		if (thingsLoaded == totThings) {
			restart();
			update();
		}
	}
	for (var name of ["subbase", "rotor", "bubble", "bg", "sky", "fuel", "oxygen", "cargo", "money", "arrow", "dial", "dead", "resources", "rip", "win", "boltkeylogo", "upgrades", "button", "tooltip"]) {
		images[name] = new Image();
		images[name].src = "img/" + name + ".png";
		images[name].onload = newLoad;
	}
	for (var name of ["up", "coin1", "coin2", "coin3", "coin4", "can", "boot", "fishsmall", "fastfish", "bronze", "gold", "silver", "inhale", "nooxygen", "dead", "ruby", "diamond", "pearl", "deepfish", "goldignot"]) {
		audio[name] = new Audio("sound/" + name + ".wav");
		audio[name].addEventListener("loadeddata", newLoad);
	}
	audio.nooxygen.loop = true;
	
	document.addEventListener("keydown", function(e) {
		keysDown.add(e.key);
	});
	document.addEventListener("keyup", function(e) {
		keysDown.delete(e.key);
	});
	
	
	
	
	lastTime = Date.now();
	
	
	
};

function prepareButtons() {
	document.getElementById("upgrade-wrap").innerHTML = "";
	for (var upName of Object.keys(upgrades)) {
		var u = upgrades[upName];
		if (u.available()) {
			var button = document.createElement("div");
			var inner = document.createElement("div");
			if (sceneState.sub.money < u.cost) {
				button.classList.add("no-money");
			}
			inner.classList.add("up-image")
			button.appendChild(inner);
			button.classList.add(upName);
			button.classList.add("upgrade");
			var costDiv = document.createElement("div");
			costDiv.innerHTML = "$" + u.cost;
			costDiv.classList.add("up-cost");
			button.appendChild(costDiv);
			var a = function(t) {
				var u = t;
				button.addEventListener("click", function() {
					console.log("click", u);
					if (sceneState.sub.money < u.cost || sceneState.sub.y > SURFACE + 200) {
						return;
					}
					audio.up.play();
					u.effect();
					u.obtained = true;
					sceneState.sub.money -= u.cost;
					prepareButtons();
					});
				button.addEventListener("mouseover", function() {
					document.getElementById("up-tooltip").innerHTML = u.text;
					document.getElementById("up-name").innerHTML = u.name;
					});
				button.addEventListener("mouseout", function() {
					document.getElementById("up-tooltip").innerHTML = "";
					document.getElementById("up-name").innerHTML = "";
					});
			};
			a(u);
			document.getElementById("upgrade-wrap").appendChild(button);
		}
	}
	var tooltip = document.createElement("div");
	tooltip.id = "tooltip-wrap";
	var toolHead = document.createElement("div");
	toolHead.id = "up-name";
	tooltip.appendChild(toolHead);
	var toolText = document.createElement("div");
	toolText.id = "up-tooltip";
	tooltip.appendChild(toolText);
	document.getElementById("upgrade-wrap").appendChild(tooltip);
}

function sellNext() {
	var toSell = sceneState.sub.cargo.splice(0, 1)[0];
	if (!toSell) {
		return;
	}
	sceneState.sub.money += toSell.val;
	sceneState.bubbles.push(new SellText(toSell, sceneState.sub.x, sceneState.sub.y));
	audio["coin" + (Math.floor(Math.random() * 4) + 1)].play();
	prepareButtons();
}


function die() {
	if (!sceneState.sub.dead) {
		sceneState.sub.dead = true;
		audio.nooxygen.pause();
		audio.dead.play();
	}
}

function win() {
	if (!sceneState.won) {
		sceneState.finalTime = Date.now() - sceneState.attemptStart;
		sceneState.creditsStart = Date.now();
		sceneState.won = true;
	}
}

function update() {
	
	function _update() {
		++frameNo;
		var delta = Date.now() - lastTime;
		lastTime = Date.now();
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		sceneState.sub.lastChange += delta;
		
		ctx.fillText(delta, 50, 50);
		
		var s = sceneState.sub;
		s.oxygen -= s.dOxygen;
		var toSurf = s.y - SURFACE;
		if (s.oxygen < -30) {
			die();
			if (s.dead && keysDown.has("r")) {
				restart();
			}
			return;
		}
		
		s.lastSale += 1;
		if (toSurf < 100) {
			s.oxygen += (100 - toSurf) * s.maxOxygen / 10000;
			if (s.oxygen < 0) {
				audio.inhale.play();
			}
			if (s.lastSale > s.saleFreq) {
				sellNext();
				s.lastSale = 0;
			}
		}
		if (toSurf < 200) {
			document.getElementById("upgrade-wrap").classList.remove("hidden");
		}
		else {
			document.getElementById("upgrade-wrap").classList.add("hidden");
		}
		s.oxygen = Math.min(s.oxygen, s.maxOxygen);
		var weightModif = 50/(50 + s.cargo.length);
		var d = 0.16 * s.powerX * weightModif;
		if (s.fuel > 0) {
			if (keysDown.has("ArrowLeft") || keysDown.has("a")) {
				s.dx -= d;
				if (s.dx < 0) {
					s.toRight = false;
					s.fuel -= -s.dx
					if (s.dx + d >= 0) {
						s.lastChange = 0;
					}
				}
			}
			if (keysDown.has("ArrowRight") || keysDown.has("d")) {
				s.dx += d;
				if (s.dx > 0) {
					s.toRight = true;
					s.fuel -= s.dx;
					if (s.dx - d <= 0) {
						s.lastChange = 0;
					}
				}
			}
		}
		s.fuel = Math.max(s.fuel, 0)
		
		var d = delta / 100 * s.powerY * weightModif;
		if (keysDown.has("ArrowDown") || keysDown.has("s")) {
			s.dy += d;
		}
		if (keysDown.has("ArrowUp") || keysDown.has("w")) {
			s.dy -= d;
		}
		s.dy -= (s.y - SURFACE) / 100000;
		
		
		s.dx *= 0.99;
		s.dy *= 0.99;
		if (s.y < SURFACE) {
			s.dy += 0.6;
		}
		if (!s.dead) {
			s.x += s.dx;
			s.y += s.dy;
			if (s.y >= 41000) {
				win();
			}
		}
		var diff = MAXX - MINX
		if (s.x < MINX) {
			s.x += diff;
			sceneState.camera.x -= diff;
		}
		if (s.x > MAXX) {
			s.x -= diff;
			sceneState.camera.x += diff;
		}
		
		for (var i = 0; i < sceneState.gems.length; ++i) {
			var g = sceneState.gems[i];
			var dist = Math.sqrt(Math.pow(g.x - s.x, 2) + Math.pow(g.y - s.y, 2));
			if (g.fish) {
				var speed = g.speed || 1;
				if (dist < 500 && g.y >= SURFACE) {
					g.dx -= (s.x - g.x) * 0.001 * speed;
					g.dy -= (s.y - g.y) * 0.0002 * speed;
				}
			}
			if (s.cargo.length < s.cargoSpace) {
				if (dist < s.grabDist) {
					console.log("grabbed", g);
					var a;
					if (a = audio[g.type]) {
						a.play();
					}
					s.cargo.push(sceneState.gems.splice(i, 1)[0]);
				}
				var gravit = 1 / Math.pow(dist, 2) * 100;
				var magnetPow = gravit * s.magnetPow;
				
				if (!g.fish && magnetPow > 0.005) {
					g.x += (s.x - g.x) * magnetPow;
					g.y += (s.y - g.y) * magnetPow;
				}
			}
		}
		
		
		var targetX = -s.x + canvas.width / 2 / sceneState.camera.zoom - s.dx * 20;
		var targetY = -s.y + canvas.height / 2 / sceneState.camera.zoom - s.dy * 20;
		
		sceneState.camera.targetZoom = Math.max(0.08, 0.4 - Math.abs(s.dx) / 100 - Math.abs(s.dy) / 100);
		if (s.y < SURFACE + 200) {
			targetY += 300;
			sceneState.camera.targetZoom = 0.6;
		}
		//sceneState.camera.targetZoom = 0.05;
		sceneState.camera.x -= (sceneState.camera.x - targetX) * 0.1;
		sceneState.camera.y -= (sceneState.camera.y - targetY) * 0.1;
		
		s.rotorPhase += Math.abs(s.dx);
		if (Math.abs(s.dx) > Math.random() * 50 + 1) {
			sceneState.bubbles.push(new Bubble(s.x - 170 + (!s.toRight ? 320 : 0), s.y, s.dx));
		}
		for (var i = 0; i < sceneState.bubbles.length; ++i) {
			var b = sceneState.bubbles[i];
			b.update();
			if (b.dead()) {
				sceneState.bubbles.splice(i, 1);
			}
		}
		for (var g of sceneState.gems) {
			g.update();
		}
		
		sceneState.camera.zoom += (sceneState.camera.targetZoom - sceneState.camera.zoom) / 80;
	}
	while (frameNo * (1000 / 60) < Date.now() - startTime) {
		_update();
	}
	drawScene();
	requestAnimationFrame(update);
}

function drawScene() {
	
	var fr = Math.floor(sceneState.sub.lastChange / 60) + 1;
	if (fr > 3) {
		fr = 0;
	}
	var right = sceneState.sub.toRight;
	if (fr > 0) {
		right = !right;
	}
	var s = sceneState.sub;
	var c = sceneState.camera;
	ctx.save();
	ctx.scale(c.zoom, c.zoom);
	ctx.translate(c.x, c.y);
	var r = 18000;
	for (var i = -5; i < 5; ++i) {
		ctx.drawImage(images.bg, i * r + s.x * 0.1, s.y * 0.1, r, 2.5 * r);
	}
	for (var y = -10; y <= 0; ++y) {
		for (var i = -20; i < 20; ++i) {
			ctx.drawImage(images.sky, i * 1200 + 500 * y, -600 + y * 1000);
		}
	}
	ctx.save();
	ctx.translate(s.x, s.y + 30);
	
	var rotorPhase = Math.floor(s.rotorPhase / 20) % 5;
	if (!right) {
		ctx.scale(-1, 1);
	}
	ctx.drawImage(images.subbase, 
	280 * fr, 0, 280, 200, 
	-170, -100, 280, 200);
	if (fr == 0) {
		ctx.drawImage(images.rotor, 
		80 * rotorPhase, 0, 80, 120, 
		-190, -45, 80, 120);
	}
	ctx.restore();
	
	for (var b of sceneState.bubbles) {
		b.draw();
	}
	
	for (var g of sceneState.gems) {
		g.draw();
	}
	
	
	ctx.restore();
	
	ctx.fillStyle = "#ffbb33";
	var r = s.fuel / s.maxFuel;
	ctx.fillRect(canvas.width - 82, 209, 74, -140 * r);
	ctx.drawImage(images.fuel, canvas.width - 100, 20, 100, 200);
	
	ctx.fillStyle = "white";
	var r = Math.max(0, s.oxygen / s.maxOxygen);
	ctx.fillRect(canvas.width - 80, 380, 59, -117 * r);
	ctx.drawImage(images.oxygen, canvas.width - 100, 200, 100, 200)
	
	
	ctx.fillStyle = "white";
	var r = s.cargo.length / s.cargoSpace;
	ctx.fillRect(canvas.width - 88, 580, 81, -180 * r);
	ctx.drawImage(images.cargo, canvas.width - 100, 390, 100, 200);
	
	ctx.drawImage(images.money, 20, 20, 100, 100);
	ctx.font = "50px Arial";
	ctx.fillStyle = "black";
	ctx.fillText(sceneState.sub.money, 133, 93);
	ctx.shadowBlur = 0;
	ctx.fillStyle = "yellow"
	ctx.fillText(sceneState.sub.money, 130, 90);
	
	ctx.save();
	ctx.translate(68, 185);
	var r = (sceneState.sub.y - SURFACE) / 5000;
	if (r > Math.PI * 2) {
		r = -Date.now() / 100 % (Math.PI * 2);
	}
	ctx.rotate(r);
	ctx.drawImage(images.arrow, -47, -51, 100, 100);
	ctx.restore();
	ctx.drawImage(images.dial, 20, 130, 100, 100);
	
	
	
	if (s.oxygen < 0 && s.y > SURFACE + 100) {
		ctx.save();
		ctx.globalAlpha = 0.3 + Math.max(0, Math.sin(s.oxygen / 2)) * 0.7;
		ctx.drawImage(images.dead, 0, 0, canvas.width, canvas.height);
		if (!sceneState.sub.dead) {
			audio.nooxygen.play();
		}
		ctx.restore();
	}
	else {
		audio.nooxygen.pause();
		audio.nooxygen.currentTime = 0;
	}
	
	if (s.dead) {
		ctx.drawImage(images.rip, 0, 0, canvas.width, canvas.height);
	}
	if (sceneState.won) {
		sceneState.sub.oxygen = 100;
		sceneState.sub.y = 1000;
		ctx.drawImage(images.win, 0, 0, canvas.width, canvas.height);
		// todo credits
		var time = (Date.now() - sceneState.creditsStart) / 10;
		ctx.save();
		ctx.fillStyle = "#ffcc12";
		ctx.textAlign = "center";
		ctx.globalAlpha = Math.min(1, Math.max(0, (time - 100) / 100));
		ctx.fillText("You reached the ocean floor in", canvas.width / 2, 100);
		ctx.fillText(msToTime(sceneState.finalTime), canvas.width / 2, 150);
		
		ctx.globalAlpha = Math.min(1, Math.max(0, (time - 300) / 100));
		ctx.fillText("Made by", canvas.width / 2, 370);
		ctx.drawImage(images.boltkeylogo, 350, 380, 119, 100);
		ctx.fillText("for Ludum Dare 48", canvas.width / 2, 520);
		ctx.globalAlpha = Math.min(1, Math.max(0, (time - 500) / 100));
		ctx.fillText("Thanks for playing!", canvas.width / 2, 570);
		ctx.fillText(msToTime(sceneState.finalTime), canvas.width / 2, 150);
		ctx.restore();
		if (s.dead && keysDown.has("r")) {
			restart();
		}
	}
}

onload = main;

//https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
function bmRand() {
    var u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

https://stackoverflow.com/questions/9763441/milliseconds-to-time-in-javascript
function msToTime(s) {

  // Pad to 2 or 3 digits, default is 2
  function pad(n, z) {
    z = z || 2;
    return ('00' + n).slice(-z);
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;

  return pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}