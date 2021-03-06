var Loop = Object.create(Behavior);
Loop.start = function () {
  this.time = 0;
  this.position = {x: this.entity.x, y: this.entity.y};
}
Loop.update = function (dt) {
  if (this.time < this.duration) {
    this.time += dt;
    this.entity.x = this.position.x + this.offset(true);
    this.entity.y = this.position.y + this.offset(false);
  }
}
Loop.offset = function (x) {
  if (x)
    return this.radius - this.radius * Math.cos(this.time / (this.duration / (2 * Math.PI)));
  else
    return this.radius * Math.sin(this.time / (this.duration / (2 * Math.PI)));
}

var Bounce = Object.create(Behavior);
Bounce.start = function () {
  this.time = 0;
  this.position = {x: this.entity.x, y: this.entity.y};
}
Bounce.update = function(dt) {
  if (this.time < this.duration) {
    this.time += dt;
    this.entity.y = this.position.y + this.offset();
  }
}
Bounce.offset = function () {
  return (this.max / (1 + this.time)) * Math.sin(Math.PI * 2 * this.time);
}


var Flare = Object.create(Entity);
Flare.init = function (x, y, angle, duration) {
  this.x = x, this.y = y, this.duration = duration, this.angle = angle, this.radius = 1, this.time = 0;
  return this;
}
Flare.draw = function (ctx) {
  ctx.globalAlpha = this.opacity;
  ctx.beginPath();
  ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, true);
  ctx.fillStyle = Math.floor(this.time) % 2 == 0 ? "red" : "black";
  ctx.fill();
  ctx.globalAlpha = 1;
}
Flare.update = function (dt) {
  this.time += dt;
  if (this.time > this.duration) this.alive = false;
  this.opacity = 1 - this.time / this.duration;
  this.radius += dt * 20;
  this.x += Math.cos(this.angle) * SPEED.ship * dt / 4;
  this.y += Math.sin(this.angle) * SPEED.ship * dt / 4;
}
var Beacon = Object.create(Behavior);
Beacon.start = function () {
  if (this.target) {
    var theta = Math.atan2((this.target.y - this.entity.y), (this.target.x - this.entity.x));
    console.log("mhm", theta, this.target);
    var flare = Object.create(Flare).init(this.entity.x, this.entity.y, theta, 10);
    this.entity.layer.add(flare);
  }
}

// uses: target
var Home = Object.create(Behavior);
Home.update = function (dt) {
  this.entity.angle = angle(this.entity.x, this.entity.y, this.target.x, this.target.y);
  var d = distance(this.entity.x,this.entity.y,this.target.x,this.target.y);
  var dx = this.target.x - this.entity.x, dy = this.target.y - this.entity.y;
  this.entity.velocity = {x: 0.6 * SPEED.ship * dx / d, y: 0.6 * SPEED.ship * dy / d};
}
var Warning = Object.create(Behavior);
Warning.update = function (dt) {
  if (distance(this.entity.x, this.entity.y, this.target.x, this.target.y) < this.margin) {
    this.entity.alive = false;
    this.entity.layer.add(Object.create(Flare).init(this.entity.x, this.entity.y, 0, 2));
  }
}


var WarningShot = Object.create(Behavior);
WarningShot.start = function () {
  var missile = Object.create(Sprite).init(this.entity.x, this.entity.y, Resources.projectile);
  missile.addBehavior(Velocity);
  missile.addBehavior(Home, {target: this.target});
  missile.addBehavior(Warning, {target: this.target, margin: 100});
  missile.setCollision(Polygon);
  missile.collision.onHandle = function (object, other) {
    object.alive = false;
    object.layer.add(Object.create(Flare).init(object.x, object.y, 0, 2));
  }
  missile.family = "enemy";
  this.entity.layer.add(missile);
}

// requires target

var Goal = {
  init: function (state) {
    this.state = state;
    return this;
  },
  state: function () {
    return 0;
  },
  regress: function (n) {
    return 1 / (1 + Math.exp(-n));
  },
  scale: function (n, min, max) {
    return 4 * 2 * (n - (min + max) / 2) / (max - min);
  }
}

var Motivation = {
  init: function (behavior, initial) {
    this.memory = [initial],
    this.behavior = behavior;
    return this;
  },
  add: function (n) {
    this.memory.push(n);
  },
  apply: function () {
    this.behavior.start();
    return this.behavior.duration || 2;
  },
  success: function () {
    return this.memory.reduce( function (a, b) { return a + b; }, 0) / (this.memory.length);
  }
}

var SalvageAI = Object.create(Behavior);
SalvageAI.start = function () {
  this.debug = document.createElement('div');
  this.debug.style.height = "100px";
  this.debug.style.width = "100%";
  this.debug.style.border = "1px solid black";
  document.body.appendChild(this.debug);

  this.time = 0;
  this.delay = 1;
  this.error = 0.01;

  this.loop = this.entity.addBehavior(Loop, {duration: 2, radius: 40});
  this.bounce = this.entity.addBehavior(Bounce, {duration: 4, max: 40});
  this.beacon = this.entity.addBehavior(Beacon, {target: this.target});
  this.warning = this.entity.addBehavior(WarningShot, {target: this.target});

  this.motivations = [
    Object.create(Motivation).init(this.loop, 1),
    Object.create(Motivation).init(this.bounce, 0.6),
    Object.create(Motivation).init(this.beacon, 0.5),
    Object.create(Motivation).init(this.warning, 0.5)    
  ];

  console.log(this.beacon);
}
SalvageAI.getCurrentMotivation = function () {
  var max = 0;
  var choice = 0;
  for (var i = 0; i < this.motivations.length; i++) {
    var success = this.motivations[i].success();
    if (success > max) {
      max = success;
      choice = i;
    }
  }
  return this.motivations[choice];
}
SalvageAI.doDebug = function () {
  var output = "<h3>" + (this.goal ? this.goal.text : "no goal") + "</h3>";
  for (var i = 0; i < this.motivations.length; i++) {
    output += "<b>" + i + ":</b> " + this.motivations[i].success() + ",<i>" + this.motivations[i].memory.length + "</i><br>"
  }
  this.debug.innerHTML = output;
}
SalvageAI.createGoal = function (state) {
  if (!this.goal) this.goal = Object.create(Goal).init(state);
}
SalvageAI.update = function (dt) {
  if (!this.loop) this.start();
  
  if (!onscreen(this.entity.x, this.entity.y, -100)) {
    // This works pretty well...
    console.log(1);
    this.goal = null;
    if (this.entity.pathfind.target != this.player) {
      this.entity.pathfind.new(this.player);
    }
  } 
  /*else if (this.player.beam) { // works ok in isolation
    
    var dd = distance(this.entity.x, this.entity.y, this.player.x, this.player.y);

    var theta = modulo(angle(this.player.x, this.player.y, this.entity.x, this.entity.y), PI2) - modulo(this.player.angle, PI2);
    if (Math.abs(theta) < PI / 3 || dd < 100) {
      this.entity.pathfind.stop();
      this.goal = null;
      console.log(2.4);
      dd = Math.max(dd, 200);
      var direction = theta > 0 ? 1 : -1;
      var goalTheta = this.player.angle + direction * PI / 3;
      var dx = this.player.x + dd * Math.cos(goalTheta), dy = this.player.y + dd * Math.sin(goalTheta);

      if (this.goal && this.goal.text == "Avoid Beam") {
        return;
      } else {
        this.createGoal( function () {
          return Goal.regress(Goal.scale(theta, 0, PI / 3))
        });
        this.goal.text = "Avoid Beam"
      }
      
      this.entity.velocity.x =  (dx - this.entity.x);
      this.entity.velocity.y =  (dy - this.entity.y);
    }*/
/*  } else if (this.node && !onscreen(this.node.x, this.node.y)) { // lead to node - good!

    //var p = this.player, n = this.node;
    if (this.entity.pathfind.target != this.node) {
      this.entity.pathfind.new(this.node);
    }
  }*/ else if (this.node && this.node.health >= this.node.maxHealth) {

    var t = this;
    this.createGoal(function () {
      return Goal.regress(Goal.scale(t.node.health >= t.node.maxHealth ? -1 : 1, -1, 1));
    });
    this.goal.text = "Attack Node"
  } else if (this.node && this.node.health > 0) {
    var t = this;
    this.createGoal(function () {
      this.lastHealth = this.lastHealth || t.node.health;
      var newHealth = t.node.health;
      var dh = this.lastHealth - newHealth;
      this.lastHealth = newHealth;
      return Goal.regress(Goal.scale(dh, -t.node.maxHealth, t.node.maxHealth));
    });
    this.goal.text = "Destroy Node";
  } else {
    this.goal = null;
  }

  this.doDebug();
  this.time += dt;
  if (this.time > this.delay) {
    this.time = 0;
    //if (!this.goal);// this.createGoal(function () {});

    if (this.goal) {
      var state = this.goal.state();
      
      if (state > 0.5) this.debug.style.color = "green";
      else this.debug.style.color = "red";

      if (state === null);
      else {
        this.getCurrentMotivation().add(state);
        if (state >= (1 - this.error)) {
          // done!
          this.goal = undefined;
        } else {
          this.delay = this.getCurrentMotivation().apply();
        }
      }
    }
  }
}