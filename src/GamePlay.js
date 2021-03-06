
var AMOUNT_DIAMONDS = 30;
var AMOUNT_BOOBLES = 30;
GamePlayManager = {
    init: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        this.flagFirstMouseDown = false; // se crea este flag para que el caballo no se mueva al iniciar 
        this.amountDiamondsCaught = 0;
        this.endGame = false;
        this.countSmile = -1;
    },
    preload: function() {
        //imagenes normales
        game.load.image("background", 'assets/images/background.png'); 
        game.load.image("explosion", 'assets/images/explosion.png');
        game.load.image("shark", 'assets/images/shark.png');
        game.load.image("fishes", 'assets/images/fishes.png');
        game.load.image("mollusk", 'assets/images/mollusk.png');
        game.load.image("booble1", 'assets/images/booble1.png');
        game.load.image("booble2", 'assets/images/booble2.png');

        //botones
        game.load.image("play", 'assets/images/play.png');
        game.load.image("replay", 'assets/images/replay.png');

        // el sprite consta de tres variables, ancho, alto y cantidad de imagenes
        game.load.spritesheet('horse', 'assets/images/horse.png', 84, 156, 2); 
        game.load.spritesheet('diamonds', 'assets/images/diamonds.png', 81, 84, 4);

        //agregando sonidos
        game.load.audio('musicLoop', 'assets/sounds/musicLoop.mp3');
        game.load.audio('sfxPop', 'assets/sounds/sfxPop.mp3');

    },
    create: function() {
        game.add.sprite(0, 0, 'background'); //añade una imagen en una coordenada especifica
        this.musicLoop = game.add.audio('musicLoop');
        this.sfxPop = game.add.audio('sfxPop');

        this.boobleArray = [];
        for(var i = 0; i < AMOUNT_BOOBLES; i++){
            var xBooble = game.rnd.integerInRange(1, 1140);
            var yBooble = game.rnd.integerInRange(600, 950);

            //Aleatoriamente agrega el booble1 o el booble2
            var booble = game.add.sprite(xBooble, yBooble, 'booble' + game.rnd.integerInRange(1,2));
            booble.vel = 0.2 + game.rnd.frac() * 2; //velocidad
            booble.alpha = 0.9;
            booble.scale.setTo(0.2 + game.rnd.frac());
            this.boobleArray[i] = booble;
        }

        this.mollusk = game.add.sprite(500,150,'mollusk');
        this.shark = game.add.sprite(500,20,'shark'); //el orden en el que se agregan los sprites importan
        this.fishes = game.add.sprite(100,550,'fishes');

        this.horse = game.add.sprite(0, 0, 'horse'); //añade un sprite
        this.horse.frame = 0; // del sprite queremos la imagen 1 o 2
        this.horse.x = game.width/2; //centra el sprite 
        this.horse.y = game.height/2;
        this.horse.anchor.setTo(0.5); //0.5 or 0.5, 0.5 ------- punto de rotacion
        // this.horse.angle = 0; // rota la imagen en grados, 90 grados
        // this.horse.scale.setTo(1) //cambia el tamaño del sprite
        // this.horse.alpha = 0.5;  // opacidad, 0 es para invisible y 1 para visible
        //game.input.onDown.add(this.onTap, this); //capturar un clic en pantalla

        this.diamonds = [];
        for(var i = 0; i < AMOUNT_DIAMONDS; i++){
            var diamond = game.add.sprite(100,100,'diamonds');
            diamond.frame = game.rnd.integerInRange(0,3); //coloca un sprite aleatorio de los 4 que existen
            diamond.scale.setTo(0.30 + game.rnd.frac()); // es el tamaño del sprite de forma aleatoria
            diamond.anchor.setTo(0.5);
            diamond.x = game.rnd.integerInRange(50, 1050); //coloca el sprite en una posicion aleatoria
            diamond.y = game.rnd.integerInRange(50, 600);

            this.diamonds[i] = diamond;

            //tomamos el rectangulo que acabamos de crear
            var rectCurrentDiamond = this.getBoundsDiamond(diamond);
            var rectHorse = this.getBoundsDiamond(this.horse);
            //preguntamos si el diamante colisiona con otro, y mientras colisione se ira cambiando de posicion
            while(this.isOverlappingOtherDiamond(i, rectCurrentDiamond) || this.isRectanglesOverlapping(rectHorse, rectCurrentDiamond)){
                diamond.x = game.rnd.integerInRange(50, 1050);
                diamond.y = game.rnd.integerInRange(50, 600);
                rectCurrentDiamond = this.getBoundsDiamond(diamond);
            };
        }

        this.explosionGroup = game.add.group();
        // var ex1 = this.explosionGroup.create(200, 200, 'explosion');
        // var ex2 = this.explosionGroup.create(400, 200, 'explosion');
        // this.explosionGroup.scale.setTo(0.5);
        // this.explosionGroup.x = 300;
        // ex2.kill();
        // var newExplosion = this.explosionGroup.getFirstDead();
        for(var i = 0; i < 10; i++){
            //se estan creando 10 explosiones con proppiedades para utilizar
            this.explosion = this.explosionGroup.create(100,100,'explosion');
            this.explosion.tweenScale = game.add.tween(this.explosion.scale).to({
                x: [0.4, 0.8, 0.4],
                y: [0.4, 0.8, 0.4] //empieza en 0.4 va al 0.8 y vuelve al 0.4
            }, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false); //tiempo, aceleracion, autostart, delay, veces de repeticion, si queremos que vaya y vuelva constantemente
    
            this.explosion.tweenAlpha = game.add.tween(this.explosion.scale).to({
                alpha: [1, 0.6, 0]
            }, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false);
    
            this.explosion.anchor.setTo(0.5);
            this.explosion.kill(); //mata una explosion dejandola disponible
            // this.explosion.visible = false;
            //var tween = game.add.tween(this.explosion);
            //tween.to({x:500, y:100}, 1500, Phaser.Easing.Exponential.Out); //coordenadas, tiempo de animacion, y aceleracion de movimiento
            //tween.start(); //inicia el tween
        }

        this.currentScore = 0;

        var style = {
            font: 'bold 30pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }

        this.scoreText = game.add.text(game.width/2, 40, '0', style);
        this.scoreText.anchor.setTo(0.5);

        this.totalTime = 15;
        this.timerText = game.add.text(1000, 40, this.totalTime, style);
        this.timerText.anchor.setTo(0.5);

        //crea un timer que avanza cada segundo
        this.timerGameOver = game.time.events.loop(Phaser.Timer.SECOND, function(){
            if (this.flagFirstMouseDown) {
                this.totalTime--;
                this.timerText.text = this.totalTime+'';
                if (this.totalTime <= 0) {
                    game.time.events.remove(this.timerGameOver);
                    this.endGame = true;
                    this.showFinalMessage("GAME OVER");
                }
            }
        }, this);
        this.showInitMessage();
    },
    increaseScore: function(){
        this.countSmile = 0;
        this.horse.frame = 1;

        this.currentScore += 100;
        this.scoreText.text = this.currentScore;

        this.amountDiamondsCaught += 1;
        if (this.amountDiamondsCaught >= AMOUNT_DIAMONDS) {
            game.time.events.remove(this.timerGameOver);
            this.endGame = true;
            this.showFinalMessage('CONGRATULATIONS');
        }
    },
    showInitMessage: function(){
        bgAlpha = game.add.bitmapData(game.width, game.height);
        bgAlpha.ctx.fillStyle = '#000000';
        bgAlpha.ctx.fillRect(0, 0, game.width, game.height);
        this.bg = game.add.sprite(0, 0, bgAlpha);
        this.bg.alpha = 0.5;

        this.play = game.add.sprite(game.width/2, game.height/2, 'play');
        this.play.anchor.setTo(0.5);
        this.play.inputEnabled = true;
        this.play.events.onInputDown.add(this.onPlay, this);

        var style = {
            font: 'bold 60pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }
        this.textFieldInitMsg = game.add.text(game.width/2, game.height/1.5, "PLAY", style);
        this.textFieldInitMsg.anchor.setTo(0.5);
    },
    showFinalMessage: function(msg){
        this.tweenMollusk.stop();
        this.musicLoop.stop();
        var bgBeta = game.add.bitmapData(game.width, game.height);
        bgBeta.ctx.fillStyle = '#000000';
        bgBeta.ctx.fillRect(0, 0, game.width, game.height);
        var bg = game.add.sprite(0, 0, bgBeta);
        bg.alpha = 0.5;

        this.replay = game.add.sprite(game.width/2, game.height/1.5, 'replay');
        this.replay.anchor.setTo(0.5);
        this.replay.inputEnabled = true;
        this.replay.events.onInputDown.add(this.onRestart, this);


        var style = {
            font: 'bold 60pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }

        this.textFieldFinalMsg = game.add.text(game.width/2, game.height/2, msg, style);
        this.textFieldFinalMsg.anchor.setTo(0.5);
    },
    onPlay: function(){
        this.bg.kill();
        this.play.kill();
        this.textFieldInitMsg.kill();
        this.onTap();
    },
    onRestart: function(){
        console.log("restart");
        game.state.start("gameplay");
    },
    onTap: function(){
        if (!this.flagFirstMouseDown) {
            this.musicLoop.play('', 0, 0.2, true);//marcador de audio, donde inicia, volumen, ciclo
            this.tweenMollusk = game.add.tween(this.mollusk.position).to({y:-0.001},
                5800, Phaser.Easing.Cubic.InOut, true, 0, 1000, true).loop(true);
        }
        this.flagFirstMouseDown = true;
    },
    getBoundsDiamond: function(currentDiamond){
        //decuelve un rectangulo con las coordenadas que esta utilizando el sprite (diamante)
        return new Phaser.Rectangle(currentDiamond.left, currentDiamond.top, currentDiamond.width, currentDiamond.height);
    },
    isRectanglesOverlapping: function(rect1, rect2){
        if(rect1.x > rect2.x + rect2.width || rect2.x > rect1.x + rect1.width){
            return false;
        }
        if(rect1.y > rect2.y + rect2.height || rect2.y > rect1.y + rect1.height){
            return false;
        }
        //devuelve un true si es que ambos sprites estan superpuestos
        return true;
    },
    isOverlappingOtherDiamond: function(index, rect2){
        //verifica si la nueva posicion del sprite colisiona conn algun otro creado
        for(var i = 0; i < index; i++){
            var rect1 = this.getBoundsDiamond(this.diamonds[i]);
            if(this.isRectanglesOverlapping(rect1, rect2)){
                return true;
            }
        }

        return false;
    },
    getBoundsHorse: function(){
        var x0 = this.horse.x - Math.abs(this.horse.width)/4;
        var width = Math.abs(this.horse.width)/2;
        var y0 = this.horse.y - this.horse.height/2;
        var height = this.horse.height;

        return new Phaser.Rectangle(x0, y0, width, height);
    },
    render: function(){
        //marca un rectangulo verde en pantalla para poder ver el espacio que ocupa nuestro sprite
        //game.debug.spriteBounds(this.horse);
        for (i = 0; i < AMOUNT_DIAMONDS; i++) {
            //game.debug.spriteBounds(this.diamonds[i]);
        }
    },
    update: function() {
        if(this.flagFirstMouseDown && !this.endGame){

            //movimiento de burbujas
            for(var i=0; i < AMOUNT_BOOBLES; i++){
                var booble = this.boobleArray[i];
                booble.y -= booble.vel;
                if (booble.y < -50) {
                    booble.y = 700;
                    booble.x = game.rnd.integerInRange(1,1140);
                }
            }

            //movimiento del tiburon
            this.shark.x--;
            if (this.shark.x < -300) {
                this.shark.x = 1300;
            }

            //movimiento de los peces
            this.fishes.x += 0.3;
            if (this.fishes > 1300) {
                this.fishes.x = -300;
            }

            //cambiando el sprite del caballo
            if(this.countSmile >= 0){
                this.countSmile++;
                if (this.countSmile > 50) {
                    this.countSmile = -1;
                    this.horse.frame = 0;
                }
            }

            // this.horse.angle += 1; // animacion, suma un angulo dando la sensacion de rotacion
            var pointerX = game.input.x;
            var pointerY = game.input.y;

            //con esto podemos saber las coordernadas
            //console.log('x:'+pointerX);
            //console.log('y:'+pointerY);

            var distX = pointerX - this.horse.x; //distancia entre el caballo y el mouse
            var distY = pointerY - this.horse.y;

            //se valida direccion, si es mayor a 0 es a la derecha, si no se invierte a la izquierda
            if(distX > 0){
                this.horse.scale.setTo(1,1);
            } else{
                this.horse.scale.setTo(-1,1);
            }

            //movimiento para el caballo, para aumentar velocidad se cambian los parametros, ejemplo 0.12
            this.horse.x += distX * 0.02;
            this.horse.y += distY * 0.02;

            for(var i = 0; i < AMOUNT_DIAMONDS; i++){
                var rectHorse = this.getBoundsHorse();
                var rectDiamond = this.getBoundsDiamond(this.diamonds[i]);
                if(this.diamonds[i].visible && this.isRectanglesOverlapping(rectHorse, rectDiamond)){
                    this.increaseScore();
                    this.sfxPop.play('', 0, 1, false);//marcador de audio, donde inicia, volumen, ciclo
                    this.diamonds[i].visible = false;
                    var explosion = this.explosionGroup.getFirstDead();
                    if(explosion != null){
                        // this.explosion.visible = true;
                        explosion.reset(this.diamonds[i].x, this.diamonds[i].y);
                        // this.explosion.x = this.diamonds[i].x;
                        // this.explosion.y = this.diamonds[i].y;
                        explosion.tweenScale.start();
                        explosion.tweenAlpha.start();

                        explosion.tweenAlpha.onComplete.add(function(){
                            explosion.kill();
                        }, this);
                    }
                }
            }
        }

    }
}

var game = new Phaser.Game(1136, 640, Phaser.CANVAS);
    
game.state.add("gameplay", GamePlayManager);
game.state.start("gameplay");
