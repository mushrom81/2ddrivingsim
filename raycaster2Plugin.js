class R {
    static intersect(ln1, ln2) {
        var x1 = ln1[0][0];
        var y1 = ln1[0][1];
        var x2 = ln1[1][0];
        var y2 = ln1[1][1];
        var x3 = ln2[0][0];
        var y3 = ln2[0][1];
        var x4 = ln2[1][0];
        var y4 = ln2[1][1];
        if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
            return false;
        }
        var denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
        if (denominator === 0) {
            return false;
        }
        var ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
        var ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;
        if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
            return false;
        }
        var x = x1 + ua * (x2 - x1);
        var y = y1 + ua * (y2 - y1);
        return [x, y];
    }

    static sin(angle) {
        return Math.sin(angle * Math.PI / 180);
    }

    static cos(angle) {
        return Math.cos(angle * Math.PI / 180);
    }

    static min(array) {
        return Math.min.apply(Math, array);
    };

    static drawWall(distance, degrees, color) { // Renders a vertical line, used for displaying walls
        const HALFHEIGHT = c.height / 2;
        ctx.beginPath();
        distance = distance / 32;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.moveTo(c.width * (degrees) / 90, HALFHEIGHT + HALFHEIGHT / (distance / 1.7));
        ctx.lineTo(c.width * (degrees) / 90, HALFHEIGHT + HALFHEIGHT / (distance / 2));
        ctx.stroke();

    }

    static fixRotation(rotation) {
        rotation = rotation % 360;
        while (rotation < 0) rotation += 360;
        return rotation;
    }

    static unDistort(distance, rotationRelativeToPlayersCenter) {
        return Math.abs(distance * R.cos(rotationRelativeToPlayersCenter));
    }

    static renderWalls(playerX, playerY, playerR, fieldLines, color = "black") {
        playerR = Math.atan2(F.cos(playerR), F.sin(playerR)) * (180 / Math.PI); // Account for stupidity
        const SIGHT = 10000;
        var distanceArray = [];
        for (var i = 0; i <= 90; i += 1/8) {
            var rotationRelativeToPlayersCenter = R.fixRotation(i - 45);
            rotationRelativeToPlayersCenter = -rotationRelativeToPlayersCenter; // Account for stupidity
            var rotationRelativeToZero = R.fixRotation(rotationRelativeToPlayersCenter + playerR);
            var sightLine = [[playerX, playerY],[playerX + R.sin(rotationRelativeToZero) * SIGHT, playerY + R.cos(rotationRelativeToZero) * SIGHT]];
            var intersections = [];
            for (var j = 0; j < fieldLines.length; j++) {
                if (R.intersect(fieldLines[j], sightLine) !== false) {
                    intersections.push(R.intersect(fieldLines[j], sightLine));
                }
            }
            var intersectionDistances = intersections.map(x => Math.sqrt((x[0] - playerX) ** 2 + (x[1] - playerY) ** 2));
            for (var j = 0; j < intersectionDistances.length; j++) {
                //R.drawWall(R.unDistort(intersectionDistances[j], rotationRelativeToPlayersCenter), i, color);
                distanceArray.push([R.unDistort(intersectionDistances[j], rotationRelativeToPlayersCenter), i, color]);
            }
        }
        for (var i = 0; i < distanceArray.length; i++) {
            if (distanceArray[i][0] > 110) R.drawWall(distanceArray[i][0], distanceArray[i][1], distanceArray[i][2]);
        }
        player.render3Dplayer();
        for (var i = 0; i < distanceArray.length; i++) {
            if (distanceArray[i][0] <= 110) R.drawWall(distanceArray[i][0], distanceArray[i][1], distanceArray[i][2]);
        }
    }
}