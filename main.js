//Assignment 3 stuff
var socket = io.connect("http://76.28.150.193:8888");
var onGenDataList = [];
var onLoadDataList = [];
var game;

socket.on("connect", function () {
    console.log("connected to the server");
})

socket.on("load", function (data) {
    onLoadDataList = [];
    onLoadDataList = data.data;
    //console.log(data.data);
    game.entities = [];
    loadListData(game, onLoadDataList);
    console.log("loaded");
});

var saveToServer = function (game) {
    onGenDataList = generateDataList(game);
    //console.log(onGenDataList);
    socket.emit("save", { studentname: "Andy Bleich", statename: "A3State", data: onGenDataList });
    console.log("saved");

}

var loadFromServer = function (game) {
    socket.emit("load", { studentname: "Andy Bleich", statename: "A3State" });
    //console.log(onLoadDataList);
}


// GameBoard code below

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// For the towers
function Tower(game, x, y) {

    this.game = game;
    this.radius = 20;
    this.visualRadius = 400;
    this.shootTimer = 0;
    this.shootCooldown = 1;
    this.hp = 10;
    this.color = "grey";
    this.difX = 0;
    this.difY = 0;
    this.isSuper = false;
    this.shootable = false;
    this.target = null;
    this.velocity = { x: 0, y: 0 };
    this.canShoot = true;
    this.shootCounter = 0;
    Entity.call(this, game, x, y, "tower");
}

Tower.prototype = new Entity();
Tower.prototype.constructor = Tower;

Tower.prototype.update = function () {
    Entity.prototype.update.call(this);
    if (this.hp <= 0) {
        this.removeFromWorld = true;
    }
    this.shootTimer += this.game.clockTick;
    if (this.shootTimer >= this.shootCooldown) {
        this.shootTimer = 0;
        this.canShoot = true;
    }
    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (this.target === null && ent.shootable) {
            this.target = ent; //be very careful to change no fields of ent
        }
        // area for collisions

        // area for shooting
        if (ent !== this && ent.shootable) {

            this.aim(ent);  
        }
    }
    if (this.canShoot && this.target != null) {
        dist = distance(this, this.target);
        this.difX = (this.target.x - this.x) / dist;
        this.difY = (this.target.y - this.y) / dist;
        var shot = new Shot(this.game, this.x, this.y, this.difX, this.difY, "shot");
        this.game.addEntity(shot);
        this.canShoot = false;
    }
    this.target = null;
}

Tower.prototype.draw = function (ctx) {

    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
}

Tower.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
}

Tower.prototype.designateSuper = function () {
    this.shootCooldown = .25;
    this.color = "blue";
    this.isSuper = true;
}

Tower.prototype.aim = function (ent) {
    // Ent here is the one being aimed at. 
    if (ent.shootable && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
        var dist = distance(this, ent);
        var distTar = distance(this, this.target);
        if (dist > this.radius + ent.radius && dist < distTar) {
            this.target = ent;
        }
    }
}

//Cannon, a specific kind of tower
function Cannon(game, x, y) {

    Entity.call(this, game, x, y);
}
Cannon.prototype = new Entity();
Cannon.prototype.constructor = Cannon;

Cannon.prototype.update = function () {
    Entity.prototype.call.update(this);
}

Cannon.prototype.draw = function (ctx) {

}

//Each tower fires a shot. 
function Shot(game, x, y, dx, dy, type) {
    this.type = null;
    this.shootable = false;
    this.dx = dx * 1000;
    this.dy = dy * 1000;
    if (type = "shot") {
        this.type = "shot";
        this.dmg = 1;
        this.radius = 5;
        this.velocity = { x: this.dx, y: this.dy };
    } 
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y + this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
    Entity.call(this, game, x, y, "shot");
}

Shot.prototype = new Entity();
Shot.prototype.constructor = Shot;

Shot.prototype.update = function () {
    Entity.prototype.update.call(this);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.removeFromWorld = true;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.removeFromWorld = true;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && ent.shootable && this.collide(ent)) {
            ent.removeFromWorld = true;
            this.removeFromWorld = true;
        }
    }
}

Shot.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = "White";
    if (this.type = "shot") {
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fill();
    } //Remnants of old code. Weird formatting
    ctx.closePath();

}

Shot.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Shot.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Shot.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Shot.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Shot.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

function Circle(game) {
    this.player = 1;
    this.radius = 20;
    this.shootable = true;
    this.visualRadius = 800;
    this.hp = 4;
    this.dmg = 1;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.color = 3;
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2), "circle");

    this.velocity = { x: Math.random() * 100, y: Math.random() * 100 };
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Circle.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Circle.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Circle.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
 //  console.log(this.velocity);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            if (ent.type === "circle") {
                var temp = { x: this.velocity.x, y: this.velocity.y };

                var dist = distance(this, ent);
                var delta = this.radius + ent.radius - dist;
                var difX = (this.x - ent.x) / dist;
                var difY = (this.y - ent.y) / dist;

                this.x += difX * delta / 2;
                this.y += difY * delta / 2;
                ent.x -= difX * delta / 2;
                ent.y -= difY * delta / 2;

                this.velocity.x = ent.velocity.x * friction;
                this.velocity.y = ent.velocity.y * friction;
                ent.velocity.x = temp.x * friction;
                ent.velocity.y = temp.y * friction;
                this.x += this.velocity.x * this.game.clockTick;
                this.y += this.velocity.y * this.game.clockTick;
                ent.x += ent.velocity.x * this.game.clockTick;
                ent.y += ent.velocity.y * this.game.clockTick;
            } else if (ent.type === "tower") {
                this.removeFromWorld = true;
                ent.hp -= 1;
            } else if (ent.type === "shot") {
                this.removeFromWorld = true;
            }
 /*           if (this.it) {
                this.setNotIt();
                ent.setIt();
            }
            else if (ent.it) {
                this.setIt();
                ent.setNotIt();
            } */
        }

        if (ent != this && ent.type === "tower" && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            if (dist > this.radius + ent.radius) {
                var difX = (ent.x - this.x)/dist;
                var difY = (ent.y - this.y)/dist;
                this.velocity.x += difX * acceleration / (dist * dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
        }
    }


    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

};


var generateDataList = function (game) {
    list = [];
    var towerList = [];
    var shotList = [];
    var circleList = [];
    for (var i = 0; i < game.entities.length; i++) {
        var ent = game.entities[i];
        if (ent.type === "tower") {
            var towerData = {
                x: ent.x, y: ent.y,
                type: "tower", isSuper: ent.isSuper
            };
            towerList.push(towerData);
        } else if (ent.type === "shot") {
            var shotData = {
                x: ent.x, y: ent.y,
                dx: ent.dx, dy: ent.dy,
                type: "shot" 
            };
            shotList.push(shotData);
        } else if (ent.type === "circle") {
            var circleData = {
                x: ent.x, y: ent.y,
                velocity: ent.velocity, type: "circle"
            };
            circleList.push(circleData);
        }
    }
    var spawnRates = {
        spawnRate: game.spawnRate, spawnCounter: game.spawnCounter, increment: game.incrementCounter, towerCount: game.towerCount,
        gameTime: game.timer.gameTime
    };
    list.push(towerList);
    list.push(shotList);
    list.push(circleList);
    list.push(spawnRates);
    return list;
}

var loadListData = function (game, list) {
    var towers = list[0];
    var shots = list[1];
    var circles = list[2];
    var spawnRates = list[3];
    game.spawnRate = spawnRates.spawnRate;
    game.spawnCounter = spawnRates.spawnCounter;
    game.incrementCounter = spawnRates.increment;
    game.towerCount = spawnRates.towerCount;
    game.timer.gameTime = spawnRates.gameTime;
    //console.log(game.spawnCounter);

    for (var i = 0; i < towers.length; i++) {
        var ent = towers[i];
        var newTower = new Tower(game, ent.x, ent.y);
        if (ent.isSuper === true) {
            newTower.designateSuper();
        }
        game.addEntity(newTower);
    }

    for (var i = 0; i < shots.length; i++) {
        var ent = shots[i];
        var newShot = new Shot(game, ent.x, ent.y, ent.dx, ent.dy, "shot");
        game.addEntity(newShot);
    } 
    for (var i = 0; i < circles.length; i++) {
        var ent = circles[i];
        var newCircle = new Circle(game);
        newCircle.x = ent.x;
        newCircle.y = ent.y;
        game.addEntity(newCircle);
    }

}


// the "main" code begins here
var friction = 1;
var acceleration = 1000000;
var maxSpeed = 200;

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
ASSET_MANAGER.queueDownload("./img/black.png");
ASSET_MANAGER.queueDownload("./img/white.png");

ASSET_MANAGER.downloadAll(function () {
    console.log("We in this boiiiiizzzz");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var gameEngine = new GameEngine();
    var tower1 = new Tower(gameEngine, 200, 400);
    var tower2 = new Tower(gameEngine, 400, 400);
    var tower3 = new Tower(gameEngine, 200, 600);
    var tower4 = new Tower(gameEngine, 400, 600);
    var tower5 = new Tower(gameEngine, 400, 500);
    var tower6 = new Tower(gameEngine, 200, 500);
    var superTower = new Tower(gameEngine, 300, 300);
    var superTower2 = new Tower(gameEngine, 300, 600);
    var superTower3 = new Tower(gameEngine, 300, 450);
    superTower.designateSuper();
    superTower2.designateSuper();
    superTower3.designateSuper();
    gameEngine.towerCount = 9;
    gameEngine.addEntity(tower1);
    gameEngine.addEntity(tower2);
    gameEngine.addEntity(tower3);
    gameEngine.addEntity(tower4);
    gameEngine.addEntity(tower5);
    gameEngine.addEntity(tower6);
    gameEngine.addEntity(superTower);
    gameEngine.addEntity(superTower2);
    gameEngine.addEntity(superTower3);
    var circle = new Circle(gameEngine);
    gameEngine.addEntity(circle);
    for (var i = 0; i < 12; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
        gameEngine.circleCount += 1;
    }
    
    gameEngine.init(ctx);
    gameEngine.start();
    game = gameEngine;
});

var restartGame = function (game) {
    game.entities = [];
    var tower1 = new Tower(game, 200, 400);
    var tower2 = new Tower(game, 400, 400);
    var tower3 = new Tower(game, 200, 600);
    var tower4 = new Tower(game, 400, 600);
    var tower5 = new Tower(game, 400, 500);
    var tower6 = new Tower(game, 200, 500);
    var superTower = new Tower(game, 300, 300);
    var superTower2 = new Tower(game, 300, 600);
    var superTower3 = new Tower(game, 300, 450);
    superTower.designateSuper();
    superTower2.designateSuper();
    superTower3.designateSuper();
    game.towerCount = 9;
    game.addEntity(tower1);
    game.addEntity(tower2);
    game.addEntity(tower3);
    game.addEntity(tower4);
    game.addEntity(tower5);
    game.addEntity(tower6);
    game.addEntity(superTower);
    game.addEntity(superTower2);
    game.addEntity(superTower3);
    var circle = new Circle(game);
    game.addEntity(circle);
    for (var i = 0; i < 12; i++) {
        circle = new Circle(game);
        game.addEntity(circle);
    }
    game.init(game.ctx);
}
