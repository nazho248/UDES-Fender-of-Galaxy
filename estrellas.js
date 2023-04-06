function createStar() {
    var x = Math.random() * canvas.width;
    var y = canvas.height;
    var radius = Math.random() * 3;
    var star = {
        x: x,
        y: y,
        radius: radius
    };
    stars.push(star);
}

function drawStars() {
    for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
}

function moveStars() {
    for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        star.y -= 2;
        if (star.y < 0) {
            stars.splice(i, 1);
            i--;
        }
    }
}

setInterval(createStar, 100);
