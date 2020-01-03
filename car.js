let c = document.querySelector("canvas");

c.width = 720;
c.height = 480;

let ctx = c.getContext("2d");

class F {
    static sin(angle) {
        return Math.sin(angle * Math.PI / 180);
    }

    static cos(angle) {
        return Math.cos(angle * Math.PI / 180);
    }

    static fixRotation(rotation) {
        rotation = rotation % 360;
        while (rotation < 0) rotation += 360;
        return rotation;
    }

    static int(bool) {
        if (bool) return 1;
        return 0;
    }

    static getLineEq(ln) {
        var x1 = ln[0][0];
        var y1 = ln[0][1];
        var x2 = ln[1][0];
        var y2 = ln[1][1];
        if (x1 > x2) {
            x1 = ln[1][0];
            y1 = ln[1][1];
            x2 = ln[0][0];
            y2 = ln[0][1];
        }
        if (x1 == x2) {} // ZERO CASE
        var m = (y2 - y1) / (x2 - x1);
        var b = y1 - x1 * m;
        return [m, b];
    }

    static getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
    }

    static closestLinePoint(ln, cr) {
        var x1 = ln[0][0];
        var y1 = ln[0][1];
        var x2 = ln[1][0];
        var y2 = ln[1][1];
        var x3 = cr[0];
        var y3 = cr[1];
        if (x2 == x1) {
            // Assure (x1, y1) is below (x2, y2)
            if (y1 > y2) {
                y1 = ln[1][1];
                y2 = ln[0][1];
            }
            var lineX3 = x1;
            var lineY3 = y3;
            if (lineY3 > y2) lineY3 = y2;
            if (lineY3 < y1) lineY3 = y1;
            return [lineX3, lineY3];
        }
        // Assure (x1, y1) is to the left of (x2, y2)
        if (x1 > x2) {
            x1 = ln[1][0];
            y1 = ln[1][1];
            x2 = ln[0][0];
            y2 = ln[0][1];
        }
        // Find constansts for linear equation the line falls onto (y = Mx + B)
        var m = F.getLineEq(ln)[0];
        var b = F.getLineEq(ln)[1];
        // Mirror the origin of the circle across the line
        var d = (x3 + (y3 - b)*m)/(1 + m**2);
        var mirrorX3 = 2*d - x3;
        var mirrorY3 = 2*d*m - y3 + 2*b;
        // And find the midpoint, which is the point on the line closest to the circle
        var lineX3 = (mirrorX3 + x3) / 2;
        var lineY3 = (mirrorY3 + y3) / 2;
        // Assure the point is actually on the line
        if (lineX3 < x1) {
            lineX3 = x1;
            lineY3 = y1;
        }
        if (lineX3 > x2) {
            lineX3 = x2;
            lineY3 = y2;
        }
        return [lineX3, lineY3];
    }

    static collidingWithEndpoint(ln, cr) {
        var closestPoint = F.closestLinePoint(ln, cr);
        var x1 = ln[0][0];
        var y1 = ln[0][1];
        var x2 = ln[1][0];
        var y2 = ln[1][1];
        var lineX3 = closestPoint[0];
        var lineY3 = closestPoint[1];
        if ((x1 == lineX3 && y1 == lineY3) || (x2 == lineX3 && y2 == lineY3)) return true;
        return false;
    }

    static circleIntersect(ln, cr) {
        var x3 = cr[0];
        var y3 = cr[1];
        var r = cr[2];
        var linePoint = F.closestLinePoint(ln, [x3, y3]);
        var lineX3 = linePoint[0];
        var lineY3 = linePoint[1];
        // Find the distance between the midpoint and the circle
        var shortestDistance = Math.sqrt((lineX3 - x3) ** 2 + ((lineY3 - y3) ** 2));
        if (shortestDistance < r && r - shortestDistance > 0.00001) return true;
        return false;
    }
    
    static ellipse(cx, cy, rx, ry){
        ctx.save(); // Save state
        ctx.beginPath();
        ctx.translate(cx - rx, cy - ry);
        ctx.scale(rx, ry);
        ctx.arc(1, 1, 1, 0, 2 * Math.PI, false);
        ctx.restore(); // Restore to original state
        ctx.fill();
    }
}

class Car {
    constructor(varHash) {
        this._x = varHash.x;
        this._y = varHash.y;
        this._r = varHash.r;
        this._size = varHash.size;
        this._maxspeed = varHash.maxspeed;
        this._acceleration = varHash.acceleration;
        this._turn = varHash.turn;
        this._friction = varHash.friction;
        this._terrain = varHash.terrain;
        for (var i = 0; i < this._terrain.length; i++) {
            for (var j = 0; j < this._terrain[i].length; j++) {
                for (var k = 0; k < this._terrain[i][j].length; k++) {
                    this._terrain[i][j][k] = this._terrain[i][j][k] * 2
                }
            }
        }
        this._weight = varHash.weight;
        this._drift = varHash.drift;
        this._velocity = {
            x: 0,
            y: 0
        };
    }

    get rotation() { return this._r; }
    get speed() { return Math.sqrt(this._velocity.x ** 2 + this._velocity.y ** 2); }
    get maxspeed() { return this._maxspeed; }

    tick(leftRight, driftLeftRight, forewardBack) {
        // Apply friction
        this._velocity.x = this._velocity.x * this._friction;
        this._velocity.y = this._velocity.y * this._friction;
        // Update rotation and velocities
        this._r = F.fixRotation(this._r + leftRight * this._turn + driftLeftRight * this._turn * this._drift);
        this._velocity.x += F.cos(this._r) * this._acceleration * forewardBack * (1 / this._friction);
        this._velocity.y += F.sin(this._r) * this._acceleration * forewardBack * (1 / this._friction);
        var velocityTotal = Math.sqrt(this._velocity.x ** 2 + this._velocity.y ** 2);
        if (velocityTotal > this._maxspeed) {
            this._velocity.x = this._velocity.x - ((velocityTotal / this._maxspeed) - 1) * this._velocity.x;
            this._velocity.y = this._velocity.y - ((velocityTotal / this._maxspeed) - 1) * this._velocity.y;
        }
        // Update position and test for collisions
        this._x += this._velocity.x;
        this._y += this._velocity.y;
        while (this.bonk().length > 0) {
            var collisionLine = this.bonk()[0];
            var nearestPoint = F.closestLinePoint(collisionLine, this.hitbox());
            var distanceFromLine = F.getDistance(this._x, this._y, nearestPoint[0], nearestPoint[1]);
            var overlap = this._size - distanceFromLine;
            if (F.collidingWithEndpoint(collisionLine, this.hitbox())) {
                // Colliding with the end of the line
                var distance = Math.sqrt(this._velocity.x ** 2 + this._velocity.y ** 2);
                var absX = this._x - nearestPoint[0];
                var absY = this._y - nearestPoint[1];
                var angle = Math.atan2(absY, absX) * (180 / Math.PI);
                this._x += F.cos(angle) * overlap;
                this._y += F.sin(angle) * overlap;
                this._velocity.x = F.cos(angle) * distance * this._weight;
                this._velocity.y = F.sin(angle) * distance * this._weight;
                continue;
            }
            if (collisionLine[0][0] == collisionLine[1][0]) {
                // Vertical line case
                // Colliding with the middle of the line
                if (this._x > collisionLine[0][0]) { this._x += overlap; }
                else { this._x -= overlap; }
                this._velocity.x = -this._weight * this._velocity.x; 
                continue;
            }
            var m = F.getLineEq(collisionLine)[0];
            var b = F.getLineEq(collisionLine)[1];
            if (m == 0) {
                // Horizontal line
                // Colliding with the middle of the line
                if (b < this._y) { this._y += overlap; }
                else { this._y -= overlap; }
                this._velocity.y = -this._weight * this._velocity.y;
                continue;
            } 
            var inverseM = -1 / m;
            var inverseAngle = Math.atan2(inverseM, 1) * (180 / Math.PI);
            // Determine which way wall will push
            var direction = 1;
            if ((m * this._x + b > this._y) == (m > 0)) direction = -1;
            this._x -= F.cos(inverseAngle) * overlap * direction;
            this._y -= F.sin(inverseAngle) * overlap * direction;
            // Compute updated velocity
            var relativeVelocityX = this._velocity.x;
            var relativeVelocityY = b + this._velocity.y;
            var d = (relativeVelocityX + (relativeVelocityY - b)*m)/(1 + m**2);
            var mirrorRelativeVelocityX = 2*d - relativeVelocityX;
            var mirrorRelativeVelocityY = 2*d*m - relativeVelocityY + 2*b;
            this._velocity.x = mirrorRelativeVelocityX * this._weight;
            this._velocity.y = (mirrorRelativeVelocityY - b) * this._weight;
        }
    }

    bonk() {
        var hitbox = this.hitbox();
        var collisionLines = [];
        for (var i = 0; i < this._terrain.length; i++) {
            if (F.circleIntersect(this._terrain[i], hitbox)) {
                collisionLines.push(this._terrain[i]);
                driftLeftRight = 0;
            }
        }
        return collisionLines;
    }

    hitbox() {
        return [this._x, this._y, this._size];
    }

    render3Dplayer() {
        ctx.fillStyle = "red";
        F.ellipse(360, 345, 42, 9);
        F.ellipse(360, 380, 42, 14);
        ctx.fillRect(318, 345, 84, 35);
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(360, 345);
        ctx.lineTo(360 + driftLeftRight * 12 + (F.int(keys["d"]) - F.int(keys["a"])) * 10, 338);
        ctx.stroke();
    }

    draw3DMap() {
        var terrainWithPlayer = this._terrain.slice(0);
        R.renderWalls(this._x - F.cos(this._r) * 110, this._y - F.sin(this._r) * 110, this._r, terrainWithPlayer, "#9F9F10");
    }

    renderPlayer() {
        ctx.fillStyle = "blue";
        ctx.beginPath();
        ctx.arc(this._x, this._y, this._size, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(this._x, this._y);
        ctx.lineTo(this._x + F.cos(this._r) * this._size * 2, this._y + F.sin(this._r) * this._size * 2);
        ctx.moveTo(this._x, this._y);
        ctx.lineTo(this._x + this._velocity.x * 4, this._y + this._velocity.y * 4);
        ctx.stroke();
    }

    drawMap() {
        ctx.beginPath()
        for (var i = 0; i < this._terrain.length; i++) {
            ctx.moveTo(this._terrain[i][0][0], this._terrain[i][0][1]);
            ctx.lineTo(this._terrain[i][1][0], this._terrain[i][1][1]);
        }
        ctx.stroke();
    }

}

var player = new Car({
    x: 100,
    y: 200,
    r: 270,
    size: 10,
    maxspeed: 7.5,
    acceleration: 0.3,
    turn: 1.5,
    friction: 0.96,
    weight: 0.4,
    drift: 1.2,
    terrain: [[[44, 90], [100, 26]], [[100, 26], [255, 23]], [[255, 23], [362, 25]], [[362, 25], [414, 37]], [[414, 37], [475, 30]], [[475, 30], [558, 25]], [[558, 25], [642, 51]], [[642, 51], [681, 111]], [[681, 111], [689, 157]], [[689, 157], [689, 217]], [[689, 217], [679, 246]], [[679, 246], [661, 319]], [[661, 319], [586, 361]], [[586, 361], [559, 408]], [[559, 408], [522, 446]], [[522, 446], [466, 453]], [[466, 453], [438, 444]], [[438, 444], [408, 391]], [[408, 391], [381, 322]], [[381, 322], [341, 300]], [[341, 300], [306, 313]], [[306, 313], [263, 347]], [[263, 347], [219, 385]], [[219, 385], [176, 409]], [[176, 409], [96, 412]], [[96, 412], [64, 395]], [[64, 395], [40, 351]], [[40, 351], [27, 308]], [[27, 308], [19, 259]], [[19, 259], [16, 211]], [[16, 211], [27, 173]], [[27, 173], [44, 90]], [[133, 111], [216, 92]], [[216, 92], [278, 90]], [[278, 90], [321, 95]], [[321, 95], [352, 110]], [[352, 110], [372, 121]], [[372, 121], [409, 126]], [[409, 126], [424, 119]], [[424, 119], [451, 108]], [[451, 108], [525, 92]], [[525, 92], [570, 95]], [[570, 95], [599, 124]], [[599, 124], [611, 176]], [[611, 176], [608, 239]], [[608, 239], [587, 273]], [[587, 273], [554, 284]], [[554, 284], [532, 323]], [[532, 323], [514, 350]], [[514, 350], [485, 369]], [[485, 369], [475, 347]], [[475, 347], [460, 309]], [[460, 309], [441, 277]], [[441, 277], [417, 258]], [[417, 258], [383, 223]], [[383, 223], [364, 214]], [[364, 214], [346, 206]], [[346, 206], [320, 205]], [[320, 205], [304, 208]], [[304, 208], [248, 221]], [[248, 221], [183, 231]], [[183, 231], [136, 220]], [[136, 220], [116, 196]], [[116, 196], [114, 154]], [[114, 154], [133, 111]], [[113, 281], [131, 277]], [[131, 277], [154, 282]], [[154, 282], [169, 304]], [[169, 304], [169, 328]], [[169, 328], [154, 351]], [[154, 351], [128, 360]], [[128, 360], [96, 351]], [[96, 351], [69, 311]], [[69, 311], [79, 298]], [[79, 298], [97, 281]], [[97, 281], [113, 281]]]
});

var driftLeftRight = 0;

let keys = {};
onkeydown = onkeyup = function(e) { // Keypress handler
    e = e || window.event;
    if (e.key == "k" && e.type == "keydown" && !keys["k"] && (player.speed > 0.75 * player.maxspeed || player.speed == 0)) driftLeftRight = F.int(keys["d"]) - F.int(keys["a"]);
    keys[e.key] = (e.type == "keydown");
    if (!keys["k"]) driftLeftRight = 0;
}

function loop() {
    requestAnimationFrame(loop);
    var keyLeft = F.int(keys["a"]);
    var keyRight = F.int(keys["d"]);
    var keyForewards = F.int(keys["w"]);
    var keyBackwards = F.int(keys["s"]);
    player.tick(keyRight - keyLeft, driftLeftRight, keyForewards - keyBackwards);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#6878FF";
    ctx.fillRect(0, 0, c.width, c.height / 2);
    ctx.fillStyle = "#CFCF1F";
    ctx.fillRect(0, c.height / 2, c.width, c.height / 2);
    ctx.fillStyle = "yellow";
    F.ellipse(720 - player.rotation * 8, 80, 20, 20);
    player.draw3DMap();
}
loop();
