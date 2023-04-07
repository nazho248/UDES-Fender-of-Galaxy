// nos marca los pulsos del juego
window.requestAnimFrame = (function () {

    return  window.requestAnimationFrame        ||
        window.webkitRequestAnimationFrame  ||
        window.mozRequestAnimationFrame     ||
        window.oRequestAnimationFrame       ||
        window.msRequestAnimationFrame      ||
        function ( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / FPS);
        };
})();
arrayRemove = function (array, from) {
    var rest = array.slice((from) + 1 || array.length);
    array.length = from < 0 ? array.length + from : from;
    return array.push.apply(array, rest);
};

var game = (function () {

    // Variables globales a la aplicacion
    var canvas,
        ctx,
        buffer,
        bufferctx,
        player,
        evil,
        playerShot,
        bgMain,
        bgBoss,
        evilSpeed = 1,
        totalEvils = 7,
        playerLife = 3,
        shotSpeed = 5,
        playerSpeed = 5,
        evilCounter = 0,
        youLoose = false,
        congratulations = false,
        minHorizontalOffset = 100,
        maxHorizontalOffset = 400,
        evilShots = 5,   // disparos que tiene el malo al principio
        evilLife = 3,    // vidas que tiene el malo al principio (se van incrementando)
        finalBossShots = 30,
        finalBossLife = 12,
        totalBestScoresToShow = 5, // las mejores puntuaciones que se mostraran
        bgSpeed = 1, // Velocidad de desplazamiento del fondo fixme desplazamiento del fondo
    playerShotsBuffer = [],
        evilShotsBuffer = [],
        evilShotImage,
        playerShotImage,
        playerKilledImage,
        evilImages = {
            animation : [],
            killed : new Image()
        },
        bossImages = {
            animation : [],
            killed : new Image()
        },
        keyPressed = {},
        keyMap = {
            left: 37,
            right: 39,
            fire: 32     // tecla espacio
        },
        nextPlayerShot = 0,
        //todo variable para modificar el delay de balas, para powerup (en ms tal vez)
        playerShotDelay = 250,
        now = 0;

    //otras variables para con estrellitas y mas uso
    var stars = [],
        FPS = 120,
        initiated = true,//al comenzar el juego
        starinit = 80,//cuantas estrellas se dibujan al principio para que se vean dibujadas en toda la pantalla al comenzar
        colorBottom = "#000043",
        colorMiddle = "#000000",
        colorTop = "#3f1051",
        ciclos = 0,
        ciclosMax = 130, //esto maso es cada segundo
        GameInitiated = true,
        GameInitiatedStars = true;

    //variables para dibujar texto despues de matar enemigos
    var posXTexto = 0,
        posYTexto = 0,
        printTexto = false,
        scoreObtenido = 0,
        transparenciaTexto = 1;



    function loop() {
        update();

        draw();
    }

    function preloadImages () {
        for (var i = 1; i <= 8; i++) {
            var evilImage = new Image();
            evilImage.src = 'images/malo' + i + '.png';
            evilImages.animation[i-1] = evilImage;
            var bossImage = new Image();
            bossImage.src = 'images/jefe' + i + '.png';
            bossImages.animation[i-1] = bossImage;
        }
        evilImages.killed.src = 'images/malo_muerto.png';
        bossImages.killed.src = 'images/jefe_muerto.png';
        bgMain = new Image();
        bgMain.src = 'images/fondovertical.png';
        bgBoss = new Image();
        bgBoss.src = 'images/fondovertical_jefe.png';
        playerShotImage = new Image();
        playerShotImage.src = 'images/disparo_bueno.png';
        evilShotImage = new Image();
        evilShotImage.src = 'images/disparo_malo.png';
        playerKilledImage = new Image();
        playerKilledImage.src = 'images/bueno_muerto.png';

    }



    function init() {

        //mostrar canvas negro con un circulo para que se estabilicen los fps



        canvas = document.getElementById('canvas');
        ctx = canvas.getContext("2d");

        preloadImages();

        showBestScores();




        buffer = document.createElement('canvas');
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        bufferctx = buffer.getContext('2d');

        player = new Player(playerLife, 0);
        evilCounter = 5;
        createNewEvil();


        showLifeAndScore();

        addListener(document, 'keydown', keyDown);
        addListener(document, 'keyup', keyUp);

        function anim () {
            loop();
            requestAnimFrame(anim);
        }
        anim();
    }

    function showLifeAndScore () {
        bufferctx.fillStyle="rgb(59,59,59)";
        bufferctx.font="bold 16px Arial";
        bufferctx.fillText("Puntos: " + player.score, canvas.width - 100, 20);
        bufferctx.fillText("Vidas: " + player.life, canvas.width - 100,40);
    }

    function getRandomNumber(range) {
        return Math.floor(Math.random() * range);
    }

    function Player(life, score) {
        var settings = {
            marginBottom : 10,
            defaultHeight : 66
        };
        player = new Image();
        player.src = 'images/bueno.png';
        player.posX = (canvas.width / 2) - (player.width / 2);
        player.posY = canvas.height - (player.height == 0 ? settings.defaultHeight : player.height) - settings.marginBottom;
        player.life = life;
        player.score = score;
        player.dead = false;
        player.speed = playerSpeed;

        var shoot = function () {
            if (nextPlayerShot < now || now == 0) {
                playerShot = new PlayerShot(player.posX + (player.width / 2) - 5 , player.posY);
                playerShot.add();
                now += playerShotDelay;
                nextPlayerShot = now + playerShotDelay;
            } else {
                now = new Date().getTime();
            }
        };

        player.doAnything = function() {
            if (player.dead)
                return;
            if (keyPressed.left && player.posX > 5)
                player.posX -= player.speed;
            if (keyPressed.right && player.posX < (canvas.width - player.width - 5))
                player.posX += player.speed;
            if (keyPressed.fire)
                shoot();
        };

        player.killPlayer = function() {
            if (this.life > 0) {
                this.dead = true;
                evilShotsBuffer.splice(0, evilShotsBuffer.length);
                playerShotsBuffer.splice(0, playerShotsBuffer.length);
                this.src = playerKilledImage.src;
                createNewEvil();
                setTimeout(function () {
                    player = new Player(player.life - 1, player.score);
                }, 500);

            } else {
                saveFinalScore();
                youLoose = true;
            }
        };

        return player;
    }

    /******************************* DISPAROS *******************************/
    function Shot( x, y, array, img) {
        this.posX = x;
        this.posY = y;
        this.image = img;
        this.speed = shotSpeed;
        this.identifier = 0;
        this.add = function () {
            array.push(this);
        };
        this.deleteShot = function (idendificador) {
            arrayRemove(array, idendificador);
        };
    }

    function PlayerShot (x, y) {
        Object.getPrototypeOf(PlayerShot.prototype).constructor.call(this, x, y, playerShotsBuffer, playerShotImage);
        this.isHittingEvil = function() {
            return (!evil.dead && this.posX >= evil.posX && this.posX <= (evil.posX + evil.image.width) &&
                this.posY >= evil.posY && this.posY <= (evil.posY + evil.image.height));
        };
    }

    PlayerShot.prototype = Object.create(Shot.prototype);
    PlayerShot.prototype.constructor = PlayerShot;

    function EvilShot (x, y) {
        Object.getPrototypeOf(EvilShot.prototype).constructor.call(this, x, y, evilShotsBuffer, evilShotImage);
        this.isHittingPlayer = function() {
            return (this.posX >= player.posX && this.posX <= (player.posX + player.width)
                && this.posY >= player.posY && this.posY <= (player.posY + player.height));
        };
    }

    EvilShot.prototype = Object.create(Shot.prototype);
    EvilShot.prototype.constructor = EvilShot;
    /******************************* FIN DISPAROS ********************************/


    /******************************* ENEMIGOS *******************************/
    function Enemy(life, shots, enemyImages) {
        this.image = enemyImages.animation[0];
        this.imageNumber = 1;
        this.animation = 0;
        this.posX = getRandomNumber(canvas.width - this.image.width);
        this.posY = -50;
        this.life = life ? life : evilLife;
        this.speed = evilSpeed;
        this.shots = shots ? shots : evilShots;
        this.dead = false;
        this.lifeBarWidth = 1;
        this.NumberLifes =0;
        this.firstShot = true;

        var desplazamientoHorizontal = minHorizontalOffset +
            getRandomNumber(maxHorizontalOffset - minHorizontalOffset);
        this.minX = getRandomNumber(canvas.width - desplazamientoHorizontal);
        this.maxX = this.minX + desplazamientoHorizontal - 40;
        this.direction = 'D';


        this.kill = function() {
            this.dead = true;
            //globales para imprimir texto puntuación
            posXTexto = this.posX ;
            posYTexto = this.posY;
            printTexto = true;
            totalEvils --;
            this.image = enemyImages.killed;
            verifyToCreateNewEvil();
        };

        this.update = function () {
            if (this.firstShot){
                this.firstShot = false;
                this.NumberLifes = this.life;
            }
            this.posY += this.goDownSpeed;

            // Calcular la longitud de la barra de vida en función de la vida actual
            this.lifeBarWidth = this.life/this.NumberLifes;


            // Dibujar la barra de vida verde
            if (this.lifeBarWidth !== 1){
                bufferctx.fillStyle = 'green';
                bufferctx.fillRect(this.posX, this.posY - 10, this.image.width * this.lifeBarWidth, 5);

                // Dibujar la barra de vida roja
                bufferctx.fillStyle = 'red';
                bufferctx.fillRect(this.posX + (this.image.width * this.lifeBarWidth), this.posY - 10, this.image.width * (1 - this.lifeBarWidth), 5);
            }

            // Dibujar al enemigo
            bufferctx.drawImage(this.image, this.posX, this.posY);

            //mover el enemigo hacia la posicion del jugador
            if (this.posX < player.posX) {
                this.posX += this.speed;

            } else {
                this.posX -= this.speed;
            }


            // Mover al enemigo de izquierda a derecha
            /*
                        if (this.direction === 'D') {
                            if (this.posX <= this.maxX) {
                                this.posX += this.speed;
                            } else {
                                this.direction = 'I';
                                this.posX -= this.speed;
                            }
                        } else {
                            if (this.posX >= this.minX) {
                                this.posX -= this.speed;
                            } else {
                                this.direction = 'D';
                                this.posX += this.speed;
                            }
                        }
            */


            // Actualizar la animación del enemigo
            this.animation++;
            if (this.animation > 5) {
                this.animation = 0;
                this.imageNumber++;
                if (this.imageNumber > 8) {
                    this.imageNumber = 1;
                }
                this.image = enemyImages.animation[this.imageNumber - 1];
            }
        }
;

        this.isOutOfScreen = function() {
            return this.posY > (canvas.height + 15);
        };

        function shoot() {
            //fixme evil.shots>0 modificado para pruebas
            if (evil.shots > 20 && !evil.dead) {
                var disparo = new EvilShot(evil.posX + (evil.image.width / 2) - 5 , evil.posY + evil.image.height);
                disparo.add();
                evil.shots --;
                setTimeout(function() {
                    shoot();
                }, getRandomNumber(3000));
            }
        }
        setTimeout(function() {
            shoot();
        }, 1000 + getRandomNumber(2500));

        this.toString = function () {
            return 'Enemigo con vidas:' + this.life + 'shotss: ' + this.shots + ' puntos por matar: ' + this.pointsToKill;
        }

    }

    /*fin enemigos*/

    function Evil (vidas, disparos) {
        Object.getPrototypeOf(Evil.prototype).constructor.call(this, vidas, disparos, evilImages);
        this.goDownSpeed = evilSpeed;
        this.pointsToKill = 5 + evilCounter;
    }

    Evil.prototype = Object.create(Enemy.prototype);
    Evil.prototype.constructor = Evil;

    function FinalBoss () {
        Object.getPrototypeOf(FinalBoss.prototype).constructor.call(this, finalBossLife, finalBossShots, bossImages);
        this.goDownSpeed = evilSpeed/2;
        this.pointsToKill = 20;
    }

    FinalBoss.prototype = Object.create(Enemy.prototype);
    FinalBoss.prototype.constructor = FinalBoss;
    /******************************* FIN ENEMIGOS *******************************/

    function verifyToCreateNewEvil() {
        if (totalEvils > 0) {
            setTimeout(function() {
                createNewEvil();
                evilCounter ++;
            }, getRandomNumber(3000));

        } else {
            setTimeout(function() {
                saveFinalScore();
                congratulations = true;
            }, 2000);

        }
    }

    function createNewEvil() {
        if (totalEvils != 1) {
            evil = new Evil(evilLife + evilCounter - 1, evilShots + evilCounter - 1);
        } else {
            evil = new FinalBoss();
        }
    }

    function isEvilHittingPlayer() {
        return ( ( (evil.posY + evil.image.height) > player.posY && (player.posY + player.height) >= evil.posY ) &&
            ((player.posX >= evil.posX && player.posX <= (evil.posX + evil.image.width)) ||
                (player.posX + player.width >= evil.posX && (player.posX + player.width) <= (evil.posX + evil.image.width))));
    }

    function checkCollisions(shot) {
        if (shot.isHittingEvil()) {
            if (evil.life > 1) {
                evil.life--;
            } else {
                evil.kill();
                scoreObtenido = evil.pointsToKill;
                player.score += evil.pointsToKill;
            }
            shot.deleteShot(parseInt(shot.identifier));
            return false;
        }
        return true;
    }

    function playerAction() {
        player.doAnything();
    }

    function addListener(element, type, expression, bubbling) {
        bubbling = bubbling || false;

        if (window.addEventListener) { // Standard
            element.addEventListener(type, expression, bubbling);
        } else if (window.attachEvent) { // IE
            element.attachEvent('on' + type, expression);
        }
    }

    function keyDown(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = true;
            }
        }
    }

    function keyUp(e) {
        var key = (window.event ? e.keyCode : e.which);
        for (var inkey in keyMap) {
            if (key === keyMap[inkey]) {
                e.preventDefault();
                keyPressed[inkey] = false;
            }
        }
    }

    function draw() {
        ctx.drawImage(buffer, 0, 0);
    }

    function showGameOver() {
        bufferctx.fillStyle="rgb(255,0,0)";
        bufferctx.font="bold 35px Arial";
        bufferctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2);
    }

    function showCongratulations () {
        bufferctx.fillStyle="rgb(204,50,153)";
        bufferctx.font="bold 22px Arial";
        bufferctx.fillText("Enhorabuena, te has pasado el juego!", canvas.width / 2 - 200, canvas.height / 2 - 30);
        bufferctx.fillText("PUNTOS: " + player.score, canvas.width / 2 - 200, canvas.height / 2);
        bufferctx.fillText("VIDAS: " + player.life + " x 5", canvas.width / 2 - 200, canvas.height / 2 + 30);
        bufferctx.fillText("PUNTUACION TOTAL: " + getTotalScore(), canvas.width / 2 - 200, canvas.height / 2 + 60);
    }

    function getTotalScore() {
        return player.score + player.life * 5;
    }

    function logFps() {
        var fps = 0;
        var lastCalledTime;

        function updateFps() {
            if (!lastCalledTime) {
                lastCalledTime = performance.now();
                fps = 0;
                return;
            }
            var delta = (performance.now() - lastCalledTime) / 1000;
            lastCalledTime = performance.now();
            fps = Math.round(1 / delta);
        }

        function loop() {
            updateFps();
            console.log("FPS: " + fps);
            requestAnimationFrame(loop);
        }

        loop();
    }


    function update() {

        drawBackground();

        if (congratulations) {
            showCongratulations();
            return;
        }

        if (printTexto){
            //imprimir "hola mundo" en posXTexto e posYTexto

            //bufferctx.fillStyle=rgba(255,255,255,transparenciaTexto);
            //fillstyle with transparency
            bufferctx.fillStyle="rgba(255,255,255,"+transparenciaTexto+")";
            bufferctx.font="bold 15px Arial";

            //mover texto hacia arriba
            posYTexto -= 1;
            transparenciaTexto -= 0.05;
            bufferctx.fillText("+"+ scoreObtenido, posXTexto, posYTexto);
            if (transparenciaTexto <= 0){
                printTexto = false;
                transparenciaTexto = 1;
            }
        }

        if (youLoose) {
            showGameOver();
            return;
        }

        bufferctx.drawImage(player, player.posX, player.posY);
        bufferctx.drawImage(evil.image, evil.posX, evil.posY);

        updateEvil();

        for (var j = 0; j < playerShotsBuffer.length; j++) {
            var disparoBueno = playerShotsBuffer[j];
            updatePlayerShot(disparoBueno, j);
        }

        if (isEvilHittingPlayer()) {
            player.killPlayer();
        } else {
            for (var i = 0; i < evilShotsBuffer.length; i++) {
                var evilShot = evilShotsBuffer[i];
                updateEvilShot(evilShot, i);
            }
        }

        showLifeAndScore();

        playerAction();
    }

    function updatePlayerShot(playerShot, id) {
        if (playerShot) {
            playerShot.identifier = id;
            if (checkCollisions(playerShot)) {
                if (playerShot.posY > 0) {
                    playerShot.posY -= playerShot.speed;
                    bufferctx.drawImage(playerShot.image, playerShot.posX, playerShot.posY);
                } else {
                    playerShot.deleteShot(parseInt(playerShot.identifier));
                }
            }
        }
    }

    function updateEvilShot(evilShot, id) {
        if (evilShot) {
            evilShot.identifier = id;
            if (!evilShot.isHittingPlayer()) {
                if (evilShot.posY <= canvas.height) {
                    evilShot.posY += evilShot.speed;
                    bufferctx.drawImage(evilShot.image, evilShot.posX, evilShot.posY);
                } else {
                    evilShot.deleteShot(parseInt(evilShot.identifier));
                }
            } else {
                player.killPlayer();
            }
        }
    }


    function drawBackground() {
        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext('2d');

        if (GameInitiatedStars){
            //solo debe hacerse una vez
            createStars();
            GameInitiatedStars = false;
        }

        spaceBackground();
        drawStars();
        moveStars();




        /*        let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bufferctx.drawImage(bgMain, 0, 0, canvas.width, canvas.height);*/



    }

    /* ESTRELLAS NO MOLESTAR*/

    function Star() {


        this.x = Math.random() * canvas.width;
        if (initiated){
            this.y = canvas.height*Math.random();
        }else{
            this.y = -10;
        }

        //Math.random() * (max - min) + min
        this.speed = Math.random() * 2 + 0.5;
        //this.size = Math.random() * 10 + 5;
        this.size = Math.random() * (15 - 5) + 5
        this.opacity = Math.random() * 0.3 + 0.5; // opacidad aleatoria entre 0.5 y 1
        this.blur = Math.random(); //si es menor que 0.5 no tiene blur
    }

    function createStars() {
        for (var i = 0; i < 100; i++) {
            stars[i] = new Star();
            if (i>=starinit){
                initiated = false;
            }
        }
    }

    function drawStars() {

        // dibujamos cada estrella en el canvas
        for (var i = 0; i < stars.length; i++) {
            // definimos el estilo de sombra para cada estrella, solo en las estrellas
            bufferctx.shadowColor = '#ffffff';
            //generar random para generar blur o no
            if (stars[i].blur < 0.5){
                bufferctx.shadowBlur = 0;
            }else{
                bufferctx.shadowBlur = 25;
            }

            // dibujamos la estrella
            bufferctx.fillStyle = 'rgba(255, 255, 255, ' + stars[i].opacity + ')';
            bufferctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size);
        }
    }

    function moveStars() {
        for (var i = 0; i < stars.length; i++) {
            stars[i].y += stars[i].speed;
            if (stars[i].y > canvas.height) {
                stars[i] = new Star();
            }
        }
    }

    function spaceBackground(){
        //funcion para dibujar el fondo del espacio
        var grd = ctx.createLinearGradient(0, 0, 0, canvas.height);

        //ir oscureciendo el fondo del espacio para dar sensacion de profundidad
        if (GameInitiated){
            darkenColor();
        }
        grd.addColorStop(0.5, colorBottom);
        grd.addColorStop(0, colorMiddle);
        grd.addColorStop(1, colorTop);

        bufferctx.fillStyle = grd;
        bufferctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function darkenColor(){
        if (ciclos >= ciclosMax){
            //limitarlo a 16 para que no de error y de error :(
            if (parseInt(colorBottom.substring(5,7),16)>16 ){
                colorBottom = "#0000"+(parseInt(colorBottom.substring(5,7),16)-1).toString(16);
            }
            if (parseInt(colorTop.substring(5,7),16)>16 ){
                colorTop = "#3f10"+(parseInt(colorTop.substring(5,7),16)-1).toString(16);
            }
            ciclos = 0;

        }
        ciclos++;

    }

    /* ESTRELLAS NO MOLESTAR*/

    function updateEvil() {
        if (!evil.dead) {
            evil.update();
            if (evil.isOutOfScreen()) {
                evil.kill();
            }
        }
    }

    /******************************* MEJORES PUNTUACIONES (LOCALSTORAGE) *******************************/
    function saveFinalScore() {
        localStorage.setItem(getFinalScoreDate(), getTotalScore());
        showBestScores();
        removeNoBestScores();
    }

    function getFinalScoreDate() {
        var date = new Date();
        return fillZero(date.getDay()+1)+'/'+
            fillZero(date.getMonth()+1)+'/'+
            date.getFullYear()+' '+
            fillZero(date.getHours())+':'+
            fillZero(date.getMinutes())+':'+
            fillZero(date.getSeconds());
    }

    function fillZero(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }

    function getBestScoreKeys() {
        var bestScores = getAllScores();
        bestScores.sort(function (a, b) {return b - a;});
        bestScores = bestScores.slice(0, totalBestScoresToShow);
        var bestScoreKeys = [];
        for (var j = 0; j < bestScores.length; j++) {
            var score = bestScores[j];
            for (var i = 0; i < localStorage.length; i++) {
                var key = localStorage.key(i);
                if (parseInt(localStorage.getItem(key)) == score) {
                    bestScoreKeys.push(key);
                }
            }
        }
        return bestScoreKeys.slice(0, totalBestScoresToShow);
    }

    function getAllScores() {
        var all = [];
        for (var i=0; i < localStorage.length; i++) {
            all[i] = (localStorage.getItem(localStorage.key(i)));
        }
        return all;
    }

    function showBestScores() {
        var bestScores = getBestScoreKeys();
        var bestScoresList = document.getElementById('puntuaciones');
        if (bestScoresList) {
            clearList(bestScoresList);
            for (var i=0; i < bestScores.length; i++) {
                addListElement(bestScoresList, bestScores[i], i==0?'negrita':null);
                addListElement(bestScoresList, localStorage.getItem(bestScores[i]), i==0?'negrita':null);
            }
        }
    }

    function clearList(list) {
        list.innerHTML = '';
        addListElement(list, "Fecha");
        addListElement(list, "Puntos");
    }

    function addListElement(list, content, className) {
        var element = document.createElement('li');
        if (className) {
            element.setAttribute("class", className);
        }
        element.innerHTML = content;
        list.appendChild(element);
    }

    // extendemos el objeto array con un metodo "containsElement"
    Array.prototype.containsElement = function(element) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == element) {
                return true;
            }
        }
        return false;
    };

    function removeNoBestScores() {
        var scoresToRemove = [];
        var bestScoreKeys = getBestScoreKeys();
        for (var i=0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (!bestScoreKeys.containsElement(key)) {
                scoresToRemove.push(key);
            }
        }
        for (var j = 0; j < scoresToRemove.length; j++) {
            var scoreToRemoveKey = scoresToRemove[j];
            localStorage.removeItem(scoreToRemoveKey);
        }
    }
    /******************************* FIN MEJORES PUNTUACIONES *******************************/

    return {
        init: init
    }
})();