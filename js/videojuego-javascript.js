// nos marca los pulsos del juego
window.msRequestAnimationFrame = undefined;
window.oRequestAnimationFrame = undefined;
window.mozRequestAnimationFrame = undefined;
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
        evilSpeed = 2,
        totalEvils = 7,
        playerLife = 1, // vidas que tiene el bueno al principio
        shotSpeed = 5,
        playerSpeed = 5,
        evilCounter = 0,
        youLoose = false,
        congratulations = false,
        minHorizontalOffset = 100,
        maxHorizontalOffset = 400,
        evilShots = 10,   // disparos que tiene el malo al principio
        evilLife = 3,    // vidas que tiene el malo al principio (se van incrementando)
        finalBossShots = 30,
        finalBossLife = 12,
        totalBestScoresToShow = 6 -1, // las mejores puntuaciones que se mostraran
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
            fire: 32,     // tecla espacio
            R: 82,       // tecla R
            up: 38, //tecla arriba
            down: 40, //tecla abajo
            suicide: 77 //tecla M
        },
        nextPlayerShot = 0,
        //todo variable para modificar el delay de balas, para powerup (en ms tal vez) 250
        playerShotDelay = 250,
        now = 0;

    //otras variables para con estrellitas y mas uso
    var stars = [],
        FPS = 500,
        initiated = true,//al comenzar el juego con el menu
        starinit = 80,//cuantas estrellas se dibujan al principio para que se vean dibujadas en toda la pantalla al comenzar
        colorBottom = "#000043",
        colorMiddle = "#000000",
        colorTop = "#3f1051",
        ciclos = 0,
        ciclosMax = 130, //esto maso es cada segundo
        GameInitiated = true,
        GameInitiatedStars = true;

    //variables para dibujar texto después de matar enemigos
    var posXTexto = 0,
        posYTexto = 0,
        printTexto = false,
        scoreObtenido = 0,
        transparenciaTexto = 1,
        evilhit = false, //para que el malo se ponga de color rojo cuando le disparen
        ciclosHit = 0,
        puttingText = false; //por si tengo esto activado no responder ante teclas

    //variales para control del menu y otras cosillas
    var ShowMenu = true,
        resetedGame = false,
        chrome,
        firefox,
        opera,
        edge,
        brave,
        safari,
        img1,
        img2,
        logo,
        buttons,
        customFont,
        space,
        izq,
        der,
        musicplaying ,
        audioID,
        changeMusic = false,
        gameBegins = false;

    // Imágenes en la parte inferior izquierda y derecha del menu

    //variables del SFX
    var hit1,
        shoot1,
        gameOver1,
        gameOver2,
        enemyDead,
        asteroidExplosion1,
        asteroidExplosion2,
        onlyonce = 1;


    function loop() {
        update();
        draw();
    }

    function preloadImages () {
        for (var i = 1; i <= 8; i++) {
            var evilImage = new Image();
            evilImage.src = 'images/malo' + i + '.png';
            evilImages.animation[i - 1] = evilImage;
            var bossImage = new Image();
            bossImage.src = 'images/jefe' + i + '.png';
            bossImages.animation[i - 1] = bossImage;
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

        //llamo imagenes de los navegadores
        chrome = new Image();
        firefox = new Image();
        opera = new Image();
        edge = new Image();
        brave = new Image();
        safari = new Image();
        chrome.src = "images/browsers/chrome.png";
        firefox.src = "images/browsers/firefox.png";
        opera.src = "images/browsers/opera.png";
        edge.src = "images/browsers/edge.png";
        brave.src = "images/browsers/brave.png";
        safari.src = "images/browsers/safari.png";

        img2 = new Image();
        img2.src = "images/empresaLogo.png";
        img1 = new Image();
        img1.src = "images/autentia.png"
        logo = new Image();
        logo.src = "images/logo.png";

        //llamo imagenes
        space = new Image();
        izq = new Image();
        der = new Image();
        space.src = "images/space.gif";
        izq.src = "images/izquierda.png";
        der.src = "images/derecha.png";

        //precarga del SFX
        hit1 = new Audio("sfx/hit.mp3");
        shoot1 = new Audio("sfx/shoot.mp3");
        enemyDead = new Audio("sfx/enemy_dead.mp3");
        gameOver1 = new Audio("sfx/game_over1.mp3");
        gameOver2 = new Audio("sfx/game_over2.mp3");

    }



    function init() {

        //mostrar canvas negro con un circulo para que se estabilicen los fps

        canvas = document.getElementById('canvas');
        ctx = canvas.getContext("2d");
        audioContext = new AudioContext();

        preloadImages();

        buffer = document.createElement('canvas');
        buffer.width = canvas.width;
        buffer.height = canvas.height;
        bufferctx = buffer.getContext('2d');

        initMenu();
        //fixme aqui se añade el jugador y empieza el juego
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
        bufferctx.fillStyle="rgb(255,255,255)";
        bufferctx.font="bold 16px Arial";
        bufferctx.fillText("Puntos: " + player.score, canvas.width - 100, 40);
        //bufferctx.fillText("Vidas: " + player.life, canvas.width - 100,40);
        //imprimir vidas en imagenes de corazon
        for (var i = 0; i < player.life; i++) {
            var heart = new Image();
            heart.src = 'images/heart.png';
            bufferctx.drawImage(heart, canvas.width - 100 + (i * 25), 60, 16, 16);
        }
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
                if (playerShotDelay >150){
                    shoot1.play();}
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
            if(!puttingText)
                if(keyPressed.R && youLoose)
                    resetGame();
            if (keyPressed.up)
                console.log("up");
                player.posY -= player.speed;
            if (keyPressed.down)
                console.log("down")
                player.posY += player.speed;
            if (keyPressed.suicide && !puttingText)
                player.killPlayer()
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
                youLoose = true;
                if (isBestScore()){
                    showModalForText().then(function(name) {
                        saveFinalScore(name);
                        puttingText = false;
                    });
                }

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
            if (this.isOutOfScreen() || youLoose){
                printTexto = false;
            }else{
                printTexto = true;
            }
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

            if (evilhit){
                ciclosHit+=1;
                bufferctx.globalCompositeOperation = "exclusion";
                bufferctx.drawImage(this.image, this.posX, this.posY);
                bufferctx.globalCompositeOperation = "source-over";
                if (ciclosHit>=15){
                    evilhit = false;
                    ciclosHit = 0;
                }
            }else{
                   bufferctx.drawImage(this.image, this.posX, this.posY);

            }

            // Dibujar al enemigo
            //todo esto es para matarlo rapidito
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
        if (totalEvils != 0) {
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

    //verificar si la bala golpea al enemigo
    function checkCollisions(shot) {
        if (shot.isHittingEvil()) {
            if (evil.life > 1) {
                evilhit = true
                evil.life--;
                hit1.play();
            } else {
                evil.kill();
                scoreObtenido = evil.pointsToKill;
                player.score += evil.pointsToKill;
                enemyDead.play();
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

        if (puttingText){
            return;
        }
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

        if (onlyonce>0){
            musicplaying.pause();
            gameOver1.play();
            onlyonce--;
        }

        bufferctx.fillStyle="rgb(255,0,0)";
        bufferctx.font="bold 35px Arial";
        bufferctx.fillText("GAME OVER", canvas.width / 2 , canvas.height / 2);
        bufferctx.fillText("PUNTUACION TOTAL: " + getTotalScore(), canvas.width / 2 , canvas.height / 2 + 60);
        //texto de presiona R para reiniciar pequeño
        bufferctx.fillStyle="rgb(255,255,255)";
        bufferctx.font="bold 20px Arial";
        bufferctx.fillText("Presiona R para reiniciar", canvas.width / 2 , canvas.height / 2 + 100);
        //boton de restart debajo de PUNTUAION TOTAL con el texto "REINICIAR" y centrado
        button(canvas.width / 2 - 100, canvas.height / 2 + 130, 200, 50, "255,0,0", "255,0,0", 1, "Volver al Menu", "255,255,255", 20, "Arial", "restart", 13);


    }

    function button(posX, posY, width, height, hexColor, hexColorToggle, transparency, text, textcolor, textsize, textfont, action, key){
        // color con transparencia
        bufferctx.fillStyle = "rgba(" + hexColor + "," + transparency + ")";
        // dibujar el rectángulo
        bufferctx.fillRect(posX, posY, width, height);
        //texto centrado
        bufferctx.fillStyle = "rgb(" + textcolor + ")";
        bufferctx.font = textsize + "px " + textfont;
        bufferctx.fillText(text, posX + width / 2  , posY + height / 2 + 5);

        canvas.addEventListener("click", function(event) {
            // verificar si las coordenadas del clic están dentro del área del botón
            if (event.clientX >= posX && event.clientX <= posX + width &&
                event.clientY >= posY && event.clientY <= posY + height && !puttingText) {
                // ejecutar la acción correspondiente
                //clear
                bufferctx.fillStyle = "rgba(" + hexColorToggle + "," + transparency + ")";
                bufferctx.fillRect(posX, posY, width, height);
                changeMusic = true;
                audioID = "MainMenu"
                ShowMenu = true;
                openedScores = false;
                openedControls = false;
                openedCredits = false;
                resetGame();
            }
        });
    }

    function resetGame(){
        //reiniciar parametros del juego
        player.life = 3;
        player.score = 0;
        evilCounter = 0;
        evilLife = 0;
        evilShots = 1;
        totalEvils = 10;
        evilhit = false;
        congratulations = false;
        youLoose = false;
        onlyonce = 1;

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


    function update() {

        drawBackground();
        playerAction();


        if (changeMusic){
            changeMusic = false
            musicplaying.currentTime = 0;
            musicplaying.pause();
            musicplaying = document.getElementById(audioID);
            musicplaying.loop=true;
            musicplaying.play();
        }

        if (resetedGame ) {
            resetGame();
            resetedGame = false;
        }

        if (ShowMenu) {
            ciclos++;
            drawMenu();
        }else{
            if (gameBegins){
                gameBegins = false;
                audioID = "level1"
                changeMusic = true;
            }

            if (youLoose) {
                showGameOver();
            }else if(congratulations){
                showCongratulations();
            }else{
                if (printTexto){
                    bufferctx.fillStyle="rgba(255,255,255,"+transparenciaTexto+")";
                    bufferctx.font="bold 15px Arial";

                    //mover texto hacia arriba
                    posYTexto -= 1;
                    transparenciaTexto -= 0.02;
                    bufferctx.fillText("+"+ scoreObtenido, posXTexto, posYTexto);
                    if (transparenciaTexto <= 0){
                        printTexto = false;
                        transparenciaTexto = 1;
                    }
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
                    if (youLoose){
                        evil.kill();
                    }
                } else {
                    for (var i = 0; i < evilShotsBuffer.length; i++) {
                        var evilShot = evilShotsBuffer[i];
                        updateEvilShot(evilShot, i);
                    }
                }

                showLifeAndScore();

            }


        }
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

        //todas las variables en 0 para saber si es error
        /*this.speed=1;
        this.size=3;
        this.opacity=1;
        this.blur=0;*/

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
            //quitar blur

            // dibujamos la estrella
            bufferctx.fillStyle = 'rgba(255, 255, 255, ' + stars[i].opacity + ')';
            bufferctx.fillRect(stars[i].x, stars[i].y, stars[i].size, stars[i].size);

        }
        bufferctx.shadowBlur = 0;

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

    function showModalForText(x, y, width, height) {
        // Crear un cuadro de fondo para el cuadro de texto
        bufferctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        bufferctx.fillRect(x, y, width, height);
        puttingText = true;

        // Crear un formulario para que el usuario pueda ingresar su nombre
        var form = document.createElement("form");
        form.style.position = "absolute";
        form.style.left = x + "px";
        form.style.top = y + "px";
        form.style.width = "100%";
        form.style.height = height + "px";
        form.style.fontSize = "20px";
        form.style.padding = "10px";
        form.style.border = "none";
        form.style.background = "transparent";
        form.style.color = "white";
        form.style.fontFamily = "Arial";
        form.style.textAlign = "center";

        // Crear un campo de texto para que el usuario ingrese su nombre en la mitad inferior
        var input = document.createElement("input");
        input.type = "text";
        input.name = "name";
        input.placeholder = "Ingrese su nombre (si deja vacio sera default)";
        input.style.width = "30%";
        input.style.height = "40px";
        input.style.marginBottom = "10px";
        form.appendChild(input);


        // Crear un botón para enviar el formulario
        var button = document.createElement("button");
        button.type = "submit";
        button.textContent = "Aceptar";
        button.style.width = "25%";
        button.style.height = "40px";
        form.appendChild(button);

        // Agregar el formulario al documento y enfocar el campo de texto
        document.body.appendChild(form);
        input.focus();



        // Retornar el texto ingresado por el usuario cuando se envíe el formulario
        return new Promise(function(resolve, reject) {
            form.addEventListener("submit", function(e) {
                e.preventDefault();
                var formData = new FormData(form);
                var name = formData.get("name");
                resolve(name);
                form.remove();

            });
        });


    }


    /******************************* MEJORES PUNTUACIONES (LOCALSTORAGE) *******************************/
    function saveFinalScore(namesito) {

        //recortar a 10 caracteres
        if (namesito.length > 10){
            namesito = namesito.substring(0,10);
        }
        //quitar espacios en blanco
        namesito = namesito.replace(/\s/g, '');

        if (namesito == "" ){
            namesito = "default";
        }
        let scoreRecord ={
            name: namesito,
            score: getTotalScore(),
            dateStyle: getFinalScoreDate()
        }
        let scoreRecords = JSON.parse(localStorage.getItem("scoreRecords"));
        scoreRecords.push(scoreRecord);
        localStorage.setItem("scoreRecords", JSON.stringify(scoreRecords));
        removeNoBestScores();
    }

    //funcion para saer si el score es mejor que alguno de los guardados
    function isBestScore() {
        let scoreRecords = JSON.parse(localStorage.getItem("scoreRecords"));
        let bestScore = false;
        scoreRecords.sort((a, b) => (a.score < b.score) ? 1 : -1);
        if (scoreRecords.length < totalBestScoresToShow){
            bestScore = true;
        }else{
            if (getTotalScore() > scoreRecords[scoreRecords.length-1].score){
                bestScore = true;
            }
        }
        return bestScore;
    }

//funcion para mantener siempre 6 puntuaciones y ordenarlas, si sorepasan las 6 se borran las peores
    function removeNoBestScores() {
        let scoreRecords = JSON.parse(localStorage.getItem("scoreRecords"));
        let scoreErase = [];
        scoreRecords.sort((a, b) => (a.score < b.score) ? 1 : -1);
        if (scoreRecords.length > totalBestScoresToShow){
            for (let i = totalBestScoresToShow; i < scoreRecords.length; i++) {
                scoreErase.push(i);
            }
            for (let i = 0; i < scoreErase.length; i++) {
                scoreRecords.splice(scoreErase[i],1);
            }
        }
        localStorage.setItem("scoreRecords", JSON.stringify(scoreRecords));
    }

    //funcion OK
    function getFinalScoreDate() {
        var date = new Date();
        return fillZero(date.getDay()+1)+'/'+
            fillZero(date.getMonth()+1)+'/'+
            date.getFullYear()+' '+
            fillZero(date.getHours())+':'+
            fillZero(date.getMinutes())+':'+
            fillZero(date.getSeconds());
    }

    //Funcion Ok usada en fechas
    function fillZero(number) {
        if (number < 10) {
            return '0' + number;
        }
        return number;
    }


    function getAllScores() {
        const puntuacionesJSON = localStorage.getItem("scoreRecords");
        const puntuaciones = JSON.parse(puntuacionesJSON);

        //lista para guardar las puntuaciones en un array donde 0 es el nombre, 1 es la puntuacion y 2 es la fecha
        let listaPuntuaciones = [];
        for (let i = 0; i < puntuaciones.length; i++) {
            listaPuntuaciones[i] = []; // Inicializar cada elemento del array con otro array vacío
            console.log(puntuaciones[i].name);
            listaPuntuaciones[i][0] = puntuaciones[i].name;
            listaPuntuaciones[i][1] = puntuaciones[i].score;
            listaPuntuaciones[i][2] = puntuaciones[i].dateStyle;
        }
        return listaPuntuaciones;

    }


    /******************************* FIN MEJORES PUNTUACIONES *******************************/



    /************************************************* MENU DE INICIO ********************************************************************/


    var ciclos = 0;
// Imagen del logo

    var openedControls = false;
    var openedCredits = false;
    var movimientoLogo=20;
    var logobajando = true;
    var openedScores = false;



// Escala de las imágenes
    var scaleFactor = 0.5;

    var colorNamejuego = "white";




// Botones del menú


// Dibujar el menú
    function drawMenu() {
        //logo
        //mover hacia arriba y abajo el logo de forma suave

        if (logobajando){
            movimientoLogo+=0.2;
            if (movimientoLogo>=20){
                logobajando=false;
            }
        }else{
            movimientoLogo-=0.2;
            if (movimientoLogo<=0){
                logobajando=true;
            }
        }

        bufferctx.drawImage(logo, canvas.width / 2 - logo.width / 2, 50- movimientoLogo, logo.width, logo.height);

        //original
        //ctx.drawImage(logo, canvas.width/2 - logo.width/2, 50);
        //texto del nombre del juego en fuente pixelada
        //a different color random generated
        //cambiar el color cada 5 ciclos
        if (ciclos % 10 == 0) {
            colorNamejuego = "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")";
        }
        bufferctx.fillStyle = colorNamejuego;
        //add the text UDES-Fender and Galaxy with a border black
        bufferctx.strokeStyle = "black";
        bufferctx.lineWidth = 10;
        bufferctx.font = "50px 'Press Start 2P'";
        bufferctx.textAlign = "center";
        bufferctx.strokeText("UDES-Fender", canvas.width / 2, logo.height-60);
        bufferctx.strokeText("Galaxy", canvas.width / 2, logo.height);
        bufferctx.fillText("UDES-Fender", canvas.width / 2, logo.height-60);
        bufferctx.fillText("Galaxy", canvas.width / 2, logo.height);

        // Botones
        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            if (ciclos >= 20 && button.pressed) {
                buttons[i].color = "blue";
                ciclos = 0;
                buttons[i].pressed = false;
            }

            bufferctx.fillStyle = button.color;
            bufferctx.fillRect(button.x, button.y, button.width, button.height);
            bufferctx.fillStyle = "white";
            bufferctx.font = "20px Arial";
            //text in the middle of the button
            bufferctx.textAlign = "center";
            bufferctx.fillText(button.text, button.x + button.width/2, button.y + button.height/2 + 5);

        }



        // Imágenes
        bufferctx.drawImage(img1, 20, (canvas.height - img1.height*scaleFactor)-20, img1.width*scaleFactor, img1.height*scaleFactor);
        bufferctx.drawImage(img2,canvas.width - img2.width*scaleFactor - 20, (canvas.height - img2.height*scaleFactor)-20, img2.width*scaleFactor, img2.height*scaleFactor);

        if (openedControls) {
            drawControlsPopup();
        }
        if (openedCredits) {
            drawCreditsPopup();
        }
        if (openedScores){
            drawBestScores();
        }


        canvas.addEventListener("click", function(event) {
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;
            for (var i = 0; i < buttons.length; i++) {
                var button = buttons[i];
                button.pressed = true;

                if (x > button.x && x < button.x + button.width && y > button.y && y < button.y + button.height && !openedControls && !openedCredits) {
                    // Cambiar el color del botón al hacer clic
                    button.color = "red";
                    // Aquí puedes agregar la lógica para cada botón
                    if (button.text === "Jugar") {
                        ShowMenu = false;
                        gameBegins = true;
                        // Lógica para el botón Jugar
                    } else if (button.text === "Modo infinito") {
                        console.log("Modo infinito");
                        // Lógica para el botón Modo infinito
                    } else if (button.text === "Controles") {
                        openedControls = true;
                    } else if (button.text === "Créditos") {
                        openedCredits = true;
                    }else if(button.text === "Tabla de puntuaciones"){
                        openedScores = true;
                    }


                }
            }
        });


    }

    // Manejador de eventos para los botones

    function drawCreditsPopup(){
        createModal(canvas, canvas.width / 2 - 200, canvas.height / 2 - 200, 500, 500, "Créditos", 40);
        bufferctx.fillStyle = "white";
        bufferctx.font = "20px Arial";
        bufferctx.textAlign = "center";
        bufferctx.fillText("Desarrollado con ❤️:", canvas.width / 2 + 40, canvas.height / 2 - 200 + 125);
        bufferctx.fillText("Jair Andrés González Ruiz", canvas.width / 2 + 40, canvas.height / 2 - 200 + 50 + 125);
        // Probado en
        bufferctx.fillText("Probado en:", canvas.width / 2 + 40, canvas.height / 2 - 200 + 50 + 125 + 75);

        //navegadores
        bufferctx.drawImage(chrome, canvas.width / 2 - 200 + 50+20, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 40);
        bufferctx.drawImage(firefox, (canvas.width / 2 - 200 + 50 + 50)+20+15, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 40);
        bufferctx.drawImage(opera, (canvas.width / 2 - 200 + 50 + 100)+20+30, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 40);
        bufferctx.drawImage(edge, (canvas.width / 2 - 200 + 50 + 150)+20+45, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 40);
        bufferctx.drawImage(brave, (canvas.width / 2 - 200 + 50 + 200)+20+60, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 45);
        bufferctx.drawImage(safari, (canvas.width / 2 - 200 + 50 + 250)+20+75, canvas.height / 2 - 200 + 50 + 225 + 20, 40, 40);

        //2023
        bufferctx.fillText("2023 Ⓒ", canvas.width / 2 + 40, canvas.height / 2 + 250);
    }

    function drawBestScores(){
        let margensuperior = 75;
        let posXCentrado = canvas.width / 2 - 200 + 100;

        createModal(canvas, canvas.width / 2 - 200, canvas.height / 2 - 200, 600, 500, "Tabla de puntuaciones", 40);
        let scores = getAllScores();
        bufferctx.fillStyle = "white";
        bufferctx.font = "20px Arial";
        bufferctx.textAlign = "center";
        bufferctx.fillText("Nombre", posXCentrado, canvas.height / 2 - 200 + 50 + margensuperior);
        bufferctx.fillText("Puntuación", posXCentrado + 150, canvas.height / 2 - 200 + 50 + margensuperior);
        bufferctx.fillText("Fecha", posXCentrado + 350, canvas.height / 2 - 200 + 50 + margensuperior);
        bufferctx.fillText("__________________________________________________", posXCentrado+200, canvas.height / 2 - 200 + 50 + margensuperior + 15);
        for (let i = 0; i < scores.length; i++) {
            bufferctx.fillText(scores[i][0], posXCentrado, canvas.height / 2 - 200 + 50 + margensuperior + 50 + (i * 50));
            bufferctx.fillText(scores[i][1], posXCentrado + 150, canvas.height / 2 - 200 + 50 + margensuperior + 50 + (i * 50));
            bufferctx.fillText(scores[i][2], posXCentrado + 350, canvas.height / 2 - 200 + 50 + margensuperior + 50 + (i * 50));
        }

    }

    function drawControlsPopup() {
        createModal(canvas, canvas.width/2 - 200, canvas.height/2 - 200, 500, 500, "Controles", 40);

        let margensuperior = 50;
        //poner imagenes en el modal de controles y a su lado el texto
        bufferctx.drawImage(space, canvas.width / 2 - 200 + 50, canvas.height / 2 - 200 + 50 + margensuperior, 75, 40);
        bufferctx.drawImage(izq, canvas.width / 2 - 200 + 50, canvas.height / 2 - 200 + 50 + 70 + margensuperior, 50, 50);
        bufferctx.drawImage(der, canvas.width / 2 - 200 + 50, canvas.height / 2 - 200 + 50 + 150 + margensuperior, 50, 50);

        bufferctx.fillStyle = "white";
        bufferctx.font = "20px Arial";
        bufferctx.textAlign = "left";

        bufferctx.fillText("Disparar", canvas.width / 2 - 200 + 50 + 75 + 20, canvas.height / 2 - 200 + 50 + 30 + margensuperior);
        bufferctx.fillText("Moverse a la izquierda", canvas.width / 2 - 200 + 50 + 75 + 20, canvas.height / 2 - 200 + 50 + 70 + 30 + margensuperior);
        bufferctx.fillText("Moverse a la derecha", canvas.width / 2 - 200 + 50 + 75 + 20, canvas.height / 2 - 200 + 50 + 150 + 30 + margensuperior);
    }

    function createModal(canvas, x, y, width, height, titulo, textSize) {
        // Dibujar el cuadro de fondo del cuadro emergente
        bufferctx.globalCompositeOperation = "source-over";
        bufferctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        //dibujarlo en el centro
        bufferctx.fillRect(x, y, width, height);

        // Dibujar el texto del modal
        bufferctx.fillStyle = "white";
        bufferctx.font = textSize + "px Arial";
        //titulo del modal centrado en la parte superior
        bufferctx.textAlign = "center";
        bufferctx.fillText(titulo, x + width/2, y + textSize + 20);

        // Dibujar el botón de "X" con fondo cuadrado
        bufferctx.fillStyle = "red";
        bufferctx.fillRect(x + width - 25, y, 25, 25);
        bufferctx.fillStyle = "white";
        bufferctx.font = "20px Arial";
        bufferctx.textAlign = "center";
        bufferctx.fillText("X", x + width - 12.5, y + 20);

        // Agregar event listener para cerrar el modal al hacer clic en "X"
        canvas.addEventListener("click", function(event) {
            var mouseX = event.pageX - canvas.offsetLeft;
            var mouseY = event.pageY - canvas.offsetTop;
            if (mouseX > x + width - 25 && mouseX < x + width && mouseY > y && mouseY < y + 25) {
                openedControls = false;
                openedCredits = false;
                openedScores = false;
            }
        });
    }


    function initMenu(){
        // botones del menu de inicio
        //inicio el localStorage de los records si no existe
        if (localStorage.getItem("scoreRecords") === null) {
            localStorage.setItem("scoreRecords", JSON.stringify([]));
        }

        audioID = "MainMenu"
        musicplaying = document.getElementById(audioID);
        playAudioWithInteraction(musicplaying);

        buttons = [
            {
                //botones del menu
                //texto centrado en el boton
                text: "Jugar",
                x: canvas.width / 2 - 125,
                y: canvas.height / 2 - 50 + 50,
                width: 240,
                height: 50,
                color: "blue",
                pressed: false
            },
            {
                text: "Modo infinito",
                x: canvas.width / 2 - 125,
                y: canvas.height / 2 + 75,
                width: 240,
                height: 50,
                color: "blue",
                pressed: false
            }, {
                text: "Tabla de puntuaciones",
                x: canvas.width / 2 - 125,
                y: canvas.height / 2 + 75 + 75,
                width: 240,
                height: 50,
                color: "blue",
                pressed: false
            }, {
                text: "Controles",
                x: canvas.width / 2 - 125,
                y: canvas.height / 2 + 75 + 75 + 75,
                width: 240,
                height: 50,
                color: "blue",
                pressed: false
            },
            {
                text: "Créditos",
                x: canvas.width / 2 - 125,
                y: canvas.height / 2 + 75 + 75 + 75 + 75,
                width: 240,
                height: 50,
                color: "blue",
                pressed: false
            }
        ]


        //fuente personalizada
         customFont = new FontFace('Press Start 2P', 'url(css/PressStart2P-Regular.ttf)');
// Esperar a que se cargue la fuente
        customFont.load().then(function(font) {
            // Establecer la fuente como la fuente actual del contexto del canvas
            document.fonts.add(font);
            ctx.font = "30px 'Press Start 2P', Press Start 2P"; // Ejemplo de cómo utilizar la fuente personalizada
        });


    }

    /**************************** CONTROLADORES DE MUSICA *********************************************/
    function playAudioWithInteraction(audio) {
        // Comprobar si el usuario ha interactuado con la página
        var hasInteracted = false;
        musicplaying = audio
        function checkInteraction() {
            hasInteracted = true;
        }
        document.addEventListener('mousedown', checkInteraction);
        document.addEventListener('touchstart', checkInteraction);

        // Reproducir el audio cuando el usuario haya interactuado con la página
        function playAudio() {
            if (hasInteracted) {
                musicplaying.loop=true;
                musicplaying.play();
            } else {
                setTimeout(playAudio, 100);
            }
        }
        playAudio();
    }


    return {
        init: init
    }
})();

