/*

"Tricks"

Directions: In this example, jumping will
result in going up RIGHT side, meaning LEFT side
is inaccessible unless you can change your direction.

       #
       #
       #

    * ->
###############

Folding Back: Jumping from current wall to itself will
CHANGE DIRECTION

          
        # <-*#
 * ->   #    #
##############

Odd Numbers: Similarly, making an 'odd' number of jumps

      ### -> # -> #
             #    #
 * ->  ^          #
###################

While 'even' retains the same orientation


Possibilities: 
 - Enter a whole sub-area just to change direction, then have to maintain it on the way out
 - Enemies vulnerable on one side
 - 

 */


this.onStart = function () {
  var s = this;
  //console.log(Resources.levels[current_room]);
  this.buffer = undefined;
  var bg = s.add(Object.create(Layer).init(game.w, game.h));
  //bg.bg = "red";

  var fg = s.add(Object.create(Layer).init(120 * GRIDSIZE, 120 * GRIDSIZE));
  var ui = s.add(Object.create(Layer).init(game.w, game.h));
  //fg.add(Object.create(Entity).init()).set({x: 0, y: 0, w: 100 * 16, h: 100 * 16, z: -1, color: "#eee"});
  
  game.colorize = bg.add(Object.create(Entity).init()).set({x: game.w / 2, y: game.h / 2, w: game.w, h: game.h, color: "pink"})
  game.direction_indicator = ui.add(Object.create(SpriteFont).init(Resources.font, DIRECTIONS[1])).set({x: game.w / 2, y: game.h - 9, spacing: -2, align: "center"});
  
  //console.log(Resources.a);

  //fg.add(Object.create(Entity).init()).set({x: 60*GRIDSIZE, y: 60* GRIDSIZE, w: 400 * GRIDSIZE, h: 400* GRIDSIZE, color: "white", z: -1});

  this.tilemaps = [];

  for (var i = 0; i < Resources.a.layers.length - 1; i++) { // not including object layer
    this.tilemaps.push(fg.add(Object.create(TiledMap).init(Resources.tiles, Resources.a.layers[i])).set({x: 25 * GRIDSIZE - GRIDSIZE / 2, y: 25 * GRIDSIZE - GRIDSIZE / 2, z: i * 0.5}));
  }

  for (var i = 0; i < Resources.ui.layers.length; i++) { // not including object layer
    ui.add(Object.create(TiledMap).init(Resources.tiles, Resources.ui.layers[i])).set({x: game.w / 2, y: game.h / 2, z: 0});
  }
  
  //this.score = ui.add(Object.create(SpriteFont).init(Resources.font)).set({x: game.w - 10, y: 16, align: "right", spacing: -2, text: "10"});
  /*this.message_bg = ui.add(Object.create(Entity).init()).set({x: game.w / 2, y: game.h / 4, w: game.w * 2, h: 24, color: "darksalmon", z: 3, opacity: 0, angle: PI / 72});
  this.message_bg_border = ui.add(Object.create(Entity).init()).set({x: game.w / 2, y: game.h / 4 + 4, w: game.w * 2, h: 24, color: "black", z: 2, opacity: 0, angle: 1.1 * PI / 72});
  this.message = ui.add(Object.create(SpriteFont).init(Resources.font)).set({x: game.w / 2, y: game.h / 4, align: "center", z: 4, spacing: -2, text: ""});*/
  this.message = ui.add(Object.create(SpriteFont).init(Resources.font)).set({x: game.w / 2, y: 12, align: "center", z: 4, spacing: -2, text: ""});
  game.keys_count = ui.add(Object.create(SpriteFont).init(Resources.font)).set({x: game.w / 2, y: 36, align: "center", z: 4, spacing: -2, text: "0 keys"});

  this.enemies = [];
  this.exits = [];

  this.switches = [];
  this.blocks = [];
  this.grid = [];

  for (var i = 0; i < Resources.a.layers[1].data.length; i++) { // solids currently inferred as being on layer[1]
    //var x = i % 50;
    //var y = Math.floor(i / 50);
    if (!this.grid[i % 50]) this.grid[i % 50] = [];
    if (Resources.a.layers[1].data[i] != 0) {
      this.grid[i % 50][Math.floor(i / 50)] = true; //fg.add(Object.create(Sprite).init(Resources.tile).set({opacity: 0, x: MIN.x + (i % 50) * GRIDSIZE, y: MIN.y + round(i / 50, 1) * GRIDSIZE, z: 4, solid: true}));
    } else {
      this.grid[i % 50][Math.floor(i / 50)] = false;
    }
  }
  
  //var enemyinfo = Resources.a.layers[3].objects.filter(function (o) { return o.name == "Enemy"; });
  var objects = Resources.a.layers[3].objects;

  for (var i = 0; i < objects.length; i++) {
    if (objects[i].name == "Enemy") {
      var key = objects[i].properties.crawl ? "ghost" : "spikes";
      var enemy = fg.add(Object.create(Sprite).init(Resources[key])).set({x: objects[i].x, y: objects[i].y, z: 3, team: 0});
      enemy.direction = {x: objects[i].properties.directionx, y: objects[i].properties.directiony};
      enemy.angle = objects[i].properties.angle * PI2 / 360;
      if (objects[i].properties.crawl) {   
        enemy.locked = 0;
        enemy.add(Crawl, {goal: {}, rate: 2, threshold: 2, grid: this.grid});
      }
      this.enemies.push(enemy);
      enemy.setCollision(Polygon);
      enemy.setVertices([{x: -5, y: -5}, {x: -5, y: 5}, {x: 5, y: 5}, {x: 5, y: -5}]);
    } else if (objects[i].name == "Player") {
      var player = fg.add(Object.create(Sprite).init(Resources.spider)).set({x: objects[i].x, y: objects[i].y, z: 3, keys: 0 });
      game.player = player;
      this.player = player;
      player.direction = {x: objects[i].properties.directionx, y: objects[i].properties.directiony};
      player.angle = round(objects[i].properties.angle * PI / 180, PI / 2);
      player.movement = player.add(Crawl, {goal: {}, rate: 5, threshold: 2, grid: this.grid});
      player.setCollision(Polygon);
      player.collision.onHandle = function (obj, other) {
        if (other.team === TEAMS.enemy) {
          console.log('restarting');
          game.setScene(0, true);          
        }
      }
      player.arrow = fg.add(Object.create(Sprite).init(Resources.arrow));
      player.arrow.add(Behavior, { target: player, update: function (dt) {
        if (!this.target.movement.jump && !this.target.movement.goal.angle) {
          this.entity.opacity = 1;
          this.entity.x = this.target.x + this.target.direction.x * GRIDSIZE;
          this.entity.y = this.target.y + this.target.direction.y * GRIDSIZE;
          this.entity.angle = Math.atan2(this.target.direction.y, this.target.direction.x);
        } else {
          this.entity.opacity = 0;
        }
      }});
      player.setVertices([{x: -5, y: -5}, {x: -5, y: 5}, {x: 5, y: 5}, {x: 5, y: -5}]);
    } else if (objects[i].name == "Door") {
      var door = fg.add(Object.create(Sprite).init(Resources.door)).set({locked: objects[i].properties.locked, x: objects[i].x, y: objects[i].y, z: 2, animation: objects[i].properties.locked ? 0 : 1, target: objects[i].properties.target});
      door.setCollision(Polygon);
      door.collision.onHandle = function (obj, other) {
        if (obj.locked && other.keys >= 1) {
          other.keys -= 1;
          game.keys_count.text = other.keys + " keys";
          obj.locked = false;
          obj.animaton = 1;
        } else if (!obj.locked) {
          // eventually this should move you to the OTHER door.
          game.setScene(0, true);
        } else {
          // nothing, locked

        }
      };
      this.switches.push(door);
    } else if (objects[i].name == "Key") {
      var key = fg.add(Object.create(Sprite).init(Resources.key)).set({x: objects[i].x, y: objects[i].y, z: 2 });
      key.setCollision(Polygon);
      key.collision.onHandle = function (obj, other) {
        obj.alive = false;
        other.keys += 1;
        game.keys_count.text = other.keys + " keys";
        s.switches.splice(s.switches.indexOf(obj), 1);
      };
      this.switches.push(key);
    } else if (objects[i].name == "Switch") {
      var lever = fg.add(Object.create(Sprite).init(Resources.tile)).set({x: objects[i].x, y: objects[i].y, z: 2, target: objects[i].properties.target});
      lever.setCollision(Polygon);
      lever.collision.onHandle = function (obj, other) {
        var targets = s.blocks.filter(function (b) { return b.team === obj.target});
        for (var i = 0; i < targets.length; i++) {
          targets[i].alive = false;
          var c = toGrid(targets[i].x, targets[i].y);
          if (s.grid[c.x]) s.grid[c.x][c.y] = true;
          if (s.tilemaps[1].data.data) s.tilemaps[1].data.data[c.x + 50 * c.y] = 1;
          // solids
          // change tileset
        }
      }
      this.switches.push(lever);
    } else if (objects[i].name == "Trapdoor") {
      var trapdoor = fg.add(Object.create(Sprite).init(Resources.trapdoor).set({x: objects[i].x, y: objects[i].y, z: 4, direction: {x: objects[i].properties.directionx, y: objects[i].properties.directiony}}));
      trapdoor.angle = objects[i].properties.angle * PI2 / 360;
      trapdoor.setCollision(Polygon);
      trapdoor.setVertices([
        {x: -8, y: -16},
        {x: 8, y: -16},
        {x: 8, y: 8},
        {x: -8, y: 8}
      ]);
      trapdoor.timeout = trapdoor.add(Behavior, {time: 0, update: function (dt) {
        if (this.time > 0) this.time -= dt;
      }});
      trapdoor.collision.onHandle = function (obj, other) {
        if (obj.timeout.time <= 0) {
          if (-1 * round(Math.cos(other.angle), 1) === obj.direction.x && -1 * round(Math.sin(other.angle), 1) === obj.direction.y ) {
            other.movement.trapdoor = true; 
            obj.timeout.time = 2;
          }
        }
      };
      this.switches.push(trapdoor);    
    } else if (objects[i].name == "Block") {
      var block = fg.add(Object.create(Entity).init()).set({x: objects[i].x, y: objects[i].y, w: GRIDSIZE, h: GRIDSIZE, z: 3, color: "red",opacity: 0.2, team: objects[i].properties.team});
      this.blocks.push(block);
    } else if (objects[i].name == "Message") {
      var message = fg.add(Object.create(Entity).init()).set({message: objects[i].properties.message, x: objects[i].x, y: objects[i].y, w: GRIDSIZE, h: GRIDSIZE, color: "orange", z: 10, opacity: 0 });
      message.setCollision(Polygon);
      this.switches.push(message);
      //console.log('creating message');
      message.collision.onHandle = function (obj, other) {
        obj.alive = false;
        s.switches.splice(s.switches.indexOf(obj), 1);
        //console.log('handling message');        
        s.message.text = obj.message;
        // fix me: add transitions here eventually...
        if (obj.message.length > 0) {
          //s.message_bg.opacity = 1;
          //s.message_bg_border.opacity = 1;
        } else {
          //s.message_bg.opacity = 0;
          //s.message_bg_border.opacity = 0;
        }
      }
    }
  }

  fg.camera.add(TiledLerpFollow, {target: player, tilesize: 128, offset: {x: -game.w / 2, y: -game.h / 2}, rate: 2});

  this.onKeyDown = function (e) {
    switch(e.keyCode) {
      case 38:
        player.movement.jump = true;
        player.movement.paused = true;
        break;
    }
  };
  this.onKeyUp = function (e) {
    switch(e.keyCode) {
      case 38:
        player.movement.paused = false;
        player.behaviors[0].paused = false;        
        break;
    }
  }
};
this.onUpdate = function (dt) {
  this.player.checkCollisions(0, this.enemies);
  this.player.checkCollisions(0, this.switches);
};