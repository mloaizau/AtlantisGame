
var AMOUNT_DIAMONDS = 20;
GamePlayManager = {
    init: function() {
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.pageAlignHorizontally = true;
        game.scale.pageAlignVertically = true;

        this.flagFirstMouseDown = false; // se crea este flag para que el caballo no se mueva al iniciar 
        this.amountDiamondsCaught = 0;
        this.endGame = false;
    },
    preload: function() {
        game.load.image("background", 'assets/images/background.png'); //imagen normal
        game.load.image("explosion", 'assets/images/explosion.png');
        // el sprite consta de tres variables, ancho, alto y cantidad de imagenes
        game.load.spritesheet('horse', 'assets/images/horse.png', 84, 156, 2); 
        game.load.spritesheet('diamonds', 'assets/images/diamonds.png', 81, 84, 4);

    },
    create: function() {
        game.add.sprite(0, 0, 'background'); //añade una imagen en una coordenada especifica
        this.horse = game.add.sprite(0, 0, 'horse'); //añade un sprite
        this.horse.frame = 0; // del sprite queremos la imagen 1 o 2
        this.horse.x = game.width/2; //centra el sprite 
        this.horse.y = game.height/2;
        this.horse.anchor.setTo(0.5); //0.5 or 0.5, 0.5 ------- punto de rotacion
        // this.horse.angle = 0; // rota la imagen en grados, 90 grados
        // this.horse.scale.setTo(1) //cambia el tamaño del sprite
        // this.horse.alpha = 0.5;  // opacidad, 0 es para invisible y 1 para visible

        game.input.onDown.add(this.onTap, this); //capturar un clic en pantalla

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
    },
    increaseScore: function(){
        this.currentScore += 100;
        this.scoreText.text = this.currentScore;

        this.amountDiamondsCaught += 1;
        if (this.amountDiamondsCaught >= AMOUNT_DIAMONDS) {
            this.endGame = true;
            this.showFinalMessage('CONGRATULATIONS');
        }
    },
    showFinalMessage: function(msg){
        var bgAlpha = game.add.bitmapData(game.width, game.height);
        bgAlpha.ctx.fillStyle = '#000000';
        bgAlpha.ctx.fillRect(0, 0, game.width, game.height);

        var bg = game.add.sprite(0, 0, bgAlpha);
        bg.alpha = 0.5;

        var style = {
            font: 'bold 60pt Arial',
            fill: '#FFFFFF',
            align: 'center'
        }

        this.textFieldFinalMsg = game.add.text(game.width/2, game.height/2, msg, style);
        this.textFieldFinalMsg.anchor.setTo(0.5);
    },
    onTap: function(){
        this.flagFirstMouseDown = true;
        this.horse.frame = 1;
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