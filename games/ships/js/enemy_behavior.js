var Frigate = Object.create(Behavior);
Frigate.update = function (dt) {
  if (!this.entity.shoot) this.start();
  if (this.entity.cooldown <= 0) {
    this.entity.shoot();
    this.entity.cooldown = Math.random() * 3 + 3;
  }
  else {
    this.entity.cooldown -= dt;
  }
}
Frigate.start = function () {
  this.entity.shoot = defaultShoot;
  this.entity.cooldown = Math.random() * 3 + 3;
}

var Battleship = Object.create(Behavior);
Battleship.update = function (dt) {
  if (!this.entity.shoot) this.start();
  this.entity.shoot();
}
Battleship.start = function () {
  this.entity.shoot = doubleShoot;
  this.entity.addBehavior(Cooldown);
}
/*Battleship.drawAfter = function (ctx) {
  ctx.fillStyle = "white";
  ctx.fillText(Math.floor(this.entity.health * 100) / 100, this.entity.x, this.entity.y);
}*/


var Submarine = Object.create(Behavior);
Submarine.update = function (dt) {
  if (!this.time) this.start();
  this.time += dt;

  if (this.time > this.duration) {
    if (this.entity.velocity.x != 0)
      this.velX = this.entity.velocity.x;
    this.entity.velocity.x = 0;
    this.entity.offset.y = -1 * this.surface.y * Math.sin(PI * (this.time - this.duration) / (this.duration2 - this.duration));
    this.entity.no_collide = false;
  }
  if (this.time - this.duration > (this.duration2 - this.duration) / 2) {
    this.entity.shoot();
  }
  if (this.time > this.duration2) {
    this.entity.velocity.x = this.velX;
    this.entity.no_collide = true;
    this.time = 0;
  }
}
Submarine.start = function () {
  this.time = 0;
  this.surface = {x: 0, y: 24};
  this.entity.offset = {x: 0, y: 0};
  this.duration = this.duration || 5;
  this.duration2 = this.duration2 || 8;
  this.entity.no_collide = true;
  this.entity.shoot = homingShoot;
}

var Tender = Object.create(Behavior);
Tender.update = function (dt) {
  if (this.entity.health <= 0) return;
  var te = this.entity;
  var entities = this.entity.layer.entities.filter( function (e) {
    return e.family == te.family && distance(te.x, te.y, e.x, e.y) < 100 && te != e;
  });
  for (var i = 0; i < entities.length; i++) {
    if (entities[i].health > 0)
      entities[i].health = Math.min(entities[i].maxHealth, entities[i].health  + 5 * dt);
  }
}
Tender.drawAfter = function (ctx) {
  if (this.entity.health > 0) {
    ctx.beginPath();
    ctx.arc(this.entity.x, this.entity.y, 100, 0, Math.PI * 2, true);
    ctx.fillStyle = "green";
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

var Monster = Object.create(Behavior);
Monster.update = function (dt) {
  if (this.entity.offset.y > this.entity.h / 4) {
    //this.entity.opacity = 0.2;
    this.entity.no_collide = true;
  } else {
    //this.entity.opacity = 1;
    this.entity.no_collide = false;
  }
}

var MonsterDie = Object.create(Behavior);
MonsterDie.update = function (dt) {
  if (this.entity.health <= 0 && !this.started) {
    this.start();
  }
  if (this.entity.health <= 0) {
    var all_dead = true;
    for (var i = 0; i < this.entity.monster.length; i++) {
      if (this.entity.monster[i].health > 0) all_dead = false;
    }
    if (all_dead) {
      this.entity.velocity.x = 0;
      this.entity.removeBehavior(this);
      this.entity.addBehavior(FadeOut, {duration: 2});
    }
  }
}
MonsterDie.start = function () {
  this.started = true;
  if (this.entity.collision) {
    this.entity.collision.onCheck = function (a, b) { return false };
  }
  this.entity.animation = (this.entity.animation + 3);
}