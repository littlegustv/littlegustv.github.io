var Entity = {
	velocity: {x: 0, y: 0},
	opacity: 1,
	angle: 0,
	alive: true,
	behaviors: [],
	init: function (x, y, w, h) {
		this.behaviors = [];
		this.x = x, this.y = y;
		this.h = h || 4, this.w = w || 4;
		return this;
	},
	getX: function () { return this.x },
	getY: function () { return this.y },
  getBoundX: function () { return Math.floor(this.x - this.w/2); },
  getBoundY: function () { return Math.floor(this.y - this.h/2); },
	draw: function (ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		ctx.translate(-this.x, -this.y);
		ctx.globalAlpha = this.opacity;

		for (var i = 0; i < this.behaviors.length; i++) {
			this.behaviors[i].draw(ctx);
		}
		ctx.fillStyle = this.color || "black";
		ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
		ctx.globalAlpha = 1;
		ctx.restore();
	},
	setVertices: function (vertices) {
		if (vertices) {
			this.vertices = vertices.map( function (v) {
				var _d = GLOBALS.scale * Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
				var _theta = Math.atan2(v.y, v.x);
				return {d: _d, theta: _theta}
			});
		} else {
			var d = Math.sqrt(Math.pow(this.w, 2) + Math.pow(this.h, 2)) / 2;
			var th = Math.acos(0.5 * this.w / d);
			this.vertices = [
				{d: d, theta: th},
				{d: d, theta: Math.PI - th},
				{d: d, theta: Math.PI + th},
				{d: d, theta: 2 * Math.PI - th}
			];
		}
	},
	setCollision: function (collision) {
		this.collision = Object.create(collision);
		this.collision.onStart(this);
	},
	addBehavior: function (name, config) {
		var b = Object.create(name).init(this, config);
		this.behaviors.push(b);
		return b;
	},
	removeBehavior: function (obj) {
		var i = this.behaviors.indexOf(obj);
		this.behaviors.splice(i, 1);
	},
	start: function () {
		for (var i = 0; i < this.behaviors.length; i++) {
			this.behaviors[i].start();
		}
	},
	end: function () {
		for (var i = 0; i < this.behaviors.length; i++) {
			this.behaviors[i].end();
		}
	},
//	checkCollision: function (obj) { return false },
	checkCollisions: function (start, entities) { 
		if (!this.collision) return;
		for (var i = start; i < entities.length; i++) {
			if (this == entities[i]) {}
			else {
				if (this.collision.onCheck(this, entities[i])) {
					this.collision.onHandle(this, entities[i]);
					entities[i].collision.onHandle(entities[i], this);
				}
			}
		}
	},
//	handleCollision: function ( other ) {
//	},
	update: function (dt) {
		for (var i = 0; i < this.behaviors.length; i++) {
			this.behaviors[i].update(dt);
		}
//		this.x += dt * this.velocity.x;
//		this.y += dt * this.velocity.y;
	}
};

var Sprite = Object.create(Entity);
Sprite.acceleration = {x: 0, y: 0};
Sprite.init = function (x, y, sprite) {
	this.x = x, this.y = y;
	this.behaviors = [];
	//this.checkCollision = Collision.doPixelPerfect;
	if (sprite) {
		if (sprite.speed) this.addBehavior(Animate);
		// FIX ME: add multiple animations (see PLATFORMS code)
		this.sprite = sprite, this.sprite.w = this.sprite.image.width / this.sprite.frames;
		this.animations = sprite.animations, this.animation = 0, this.sprite.h = this.sprite.image.height / this.animations;
		this.h = this.sprite.h * GLOBALS.scale, this.w = this.sprite.image.width * GLOBALS.scale / this.sprite.frames;
		this.frame = 0, this.maxFrame = this.sprite.frames, this.frameDelay = this.sprite.speed, this.maxFrameDelay = this.sprite.speed;
		//this.imageData = this.getImageData(buf);
	}
	return this;
};
Sprite.draw = function (ctx) {
	ctx.save();
	ctx.translate(this.x, this.y);
	ctx.rotate(this.angle);
	ctx.translate(-this.x, -this.y);
	ctx.globalAlpha = this.opacity;
	for (var i = 0; i < this.behaviors.length; i++) {
		this.behaviors[i].draw(ctx);
	}
	ctx.drawImage(this.sprite.image, 
		this.frame * this.sprite.w, this.animation * this.sprite.h, 
		this.sprite.w, this.sprite.h, 
		Math.round(this.x - this.w / 2), this.y - Math.round(this.h / 2), this.w, this.h);
	ctx.restore();
	ctx.globalAlpha = 1;
	
	if (this.health && this.maxHealth) {
		ctx.fillStyle = "black";
		var size = this.w / this.maxHealth;
		for (var  i = 0; i < this.maxHealth; i++) {
			if (i < this.health) {
				ctx.fillStyle = "black";
			} else {
				ctx.fillStyle = "gray";
			}
			ctx.fillRect(this.x - this.w / 2 + i * size, this.y + this.h / 2, size - 1, size);
		}
	}

	if (CONFIG.debug) {
		ctx.strokeStyle = "red";
		if (this.getVertices) {
			var v = this.getVertices();
			ctx.beginPath();
			ctx.moveTo(v[0].x, v[0].y);
			for (var i = 1; i < v.length; i++) {
				ctx.lineTo(v[i].x, v[i].y);
			}
			ctx.closePath();
			ctx.stroke();

			var a = this.getAxes();
			ctx.strokeStyle = "green";
			ctx.beginPath();
			for (var i = 0; i < a.length; i++) {
				ctx.moveTo(this.x + a[i].x, this.y + a[i].y);
				ctx.lineTo(100 * a[i].x + this.x, 100 * a[i].y + this.y);
			}
			ctx.closePath();
			ctx.stroke();
		}
		ctx.fillStyle = "red";
		ctx.fillText(Math.floor(this.x) + ", " + Math.floor(this.y), this.x, this.y);
		//ctx.strokeRect(this.getBoundX(), this.getBoundY(), this.w, this.h);
		//ctx.strokeRect(this.x - 1, this.y - 1, 2, 2);
	}
};
Sprite.setFrame = function (frame) {
	if (frame == "random") {
		this.frame = Math.floor(Math.random() * this.maxFrame);
	} else {
		this.frame = frame;
	}
};

var TiledBackground = Object.create(Sprite);
TiledBackground.superInit = Sprite.init;
TiledBackground.init = function (x, y, w, h, sprite) {
	if (sprite) {
		// FIX ME: add multiple animations (see PLATFORMS code)
		this.sprite = sprite, this.sprite.h = this.sprite.image.height, this.sprite.w = this.sprite.image.width / this.sprite.frames;
		this.h = this.sprite.image.height * GLOBALS.scale, this.w = this.sprite.image.width * GLOBALS.scale / this.sprite.frames;
		this.frame = 0, this.maxFrame = this.sprite.frames, this.frameDelay = this.sprite.speed, this.maxFrameDelay = this.sprite.speed;
		//this.imageData = this.getImageData(buf);
	}
	this.x = x, this.y = y;
	this.w = w, this.h = h;
	this.behaviors = [];
	return this;
};
TiledBackground.draw = function (ctx) {
	ctx.globalAlpha = this.opacity;
	for (var i = 0; i < this.w; i += this.sprite.w * GLOBALS.scale) {
		for (var j = 0; j < this.h; j += this.sprite.h * GLOBALS.scale) {
			ctx.drawImage(this.sprite.image, 
				this.frame * this.sprite.w, 0, 
				this.sprite.w, this.sprite.h, 
				Math.round(this.x - this.w / 2) + i, this.y - Math.round(this.h / 2) + j, this.sprite.w * GLOBALS.scale, this.sprite.h * GLOBALS.scale);
		}
	}
	ctx.globalAlpha = 1;
	//ctx.strokeStyle = "red";
	//ctx.strokeRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
};

var Camera = Object.create(Entity);
Camera.to_s = "Camera";
Camera.draw = function (ctx) {
	ctx.translate(-this.x,-this.y);
};
Camera.shake = function (n) {
	if (n == 0) {
		this.x =  Math.floor(world.player.x - canvas.width/2), 
		this.y =  0;
		return;
	}
	var c = this;
	setTimeout(function () {
		c.x += Math.random() * 10 - 5;
		c.y += Math.random() * 10 - 5;
		c.shake(n - 1);
	}, 10)
};