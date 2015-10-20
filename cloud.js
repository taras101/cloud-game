var game = new Phaser.Game(1280, 480, Phaser.CANVAS, 'game');
var text;
var PhaserGame = function () {
    this.bg = null;
    this.mountain = null;

    this.player = null;

    this.stationary = null;
    this.clouds = null;

    this.facing = 'left';
    this.jumpTimer = 0;
    this.cursors;
    this.locked = false;
    this.lockedTo = null;
    this.wasLocked = false;
    this.willJump = false;

};

PhaserGame.prototype = {

    init: function () {

        this.game.renderer.renderSession.roundPixels = true;

        this.world.resize(640*4, 480);

        this.physics.startSystem(Phaser.Physics.ARCADE);

        this.physics.arcade.gravity.y = 600;

    },

    preload: function () {

        //  We need this because the assets are on Amazon S3
        //  Remove the next 2 lines if running locally
        this.load.image('pizza', 'assets/pizza1.svg');
        this.load.image('mountain', 'assets/mountain3.svg');
        this.load.image('mountain1', 'assets/mountain2.svg');
        this.load.image('background', 'assets/sky1.svg');
        this.load.image('platform', 'assets/flat2.svg');
        this.load.image('float', 'assets/float.svg');
        this.load.image('float1', 'assets/float1.svg');
        this.load.spritesheet('egg', 'assets/egg.png', 32, 48);

        this.load.audio('burp', 'assets/burp.m4a');
        this.load.audio('jump', 'assets/jump.wav');
        this.load.audio('goal', 'assets/goal.wav');
        this.load.audio('death', 'assets/death.wav');
        this.load.audio('move', 'assets/move.wav');


    },

    create: function () {
    var timeStamp;
    text = game.add.text(game.world.centerX, game.world.centerY, "- phaser -\nclick to remove", { font: "65px Arial", fill: "#ff0044", align: "center" });
    text.anchor.setTo(0.5, 0.5);

    game.input.onDown.addOnce(removeText, this);
        this.background = this.add.tileSprite(0, 0, 1280, 480, 'background');
        this.background.fixedToCamera = true;
        this.mountain1 = this.add.tileSprite(0, 364, 1280, 116, 'mountain1');
        this.mountain1.fixedToCamera = true;
        this.mountain = this.add.tileSprite(0, 364, 1280, 116, 'mountain');
        this.mountain.fixedToCamera = true;
        
        // pizza
        this.pizza = this.add.physicsGroup();
        this.pizza.create(2460, 30, 'pizza');
        this.pizza.setAll('body.allowGravity', false);
        this.pizza.setAll('body.immovable', true);
        emitter = game.add.emitter(2460, 30, 500);

        emitter.makeParticles('pizza');
        emitter.gravity = 200;

        //  Platforms that don't move
        this.stationary = this.add.physicsGroup();

        this.stationary.create(40, 396, 'platform');
        this.stationary.create(600, 120, 'platform');
        this.stationary.create(1100, 330, 'platform');
        this.stationary.create(1540, 250, 'platform');
        this.stationary.create(1900, 140, 'platform');
        this.stationary.create(1900, 350, 'platform');
        this.stationary.create(2208, 216, 'platform');
        this.stationary.create(2380, 144, 'platform');

        this.stationary.setAll('body.allowGravity', false);
        this.stationary.setAll('body.immovable', true);
        this.stationary.setAll('body.friction.x', 30);
        console.log(this.stationary);
        
        //  Platforms that move
        this.clouds = this.add.physicsGroup();

        var cloud1 = new CloudPlatform(this.game, 300, 450, 'float1', this.clouds);

        cloud1.addMotionPath([
            { x: "+200", xSpeed: 2000, xEase: "Linear", y: "-200", ySpeed: 2000, yEase: "Sine.easeIn" },
            { x: "-200", xSpeed: 2000, xEase: "Linear", y: "-200", ySpeed: 2000, yEase: "Linear" },
            { x: "-200", xSpeed: 2000, xEase: "Linear", y: "+200", ySpeed: 2000, yEase: "Sine.easeIn" },
            { x: "+200", xSpeed: 2000, xEase: "Linear", y: "+200", ySpeed: 2000, yEase: "Sine.easeOut" }
        ]);

        var cloud2 = new CloudPlatform(this.game, 800, 96, 'float1', this.clouds);

        cloud2.addMotionPath([
            { x: "+0", xSpeed: 2000, xEase: "Linear", y: "+300", ySpeed: 2000, yEase: "Sine.easeIn" },
            { x: "-0", xSpeed: 1000, xEase: "Linear", y: "-300", ySpeed: 1000, yEase: "Linear" }
        ]);

        var cloud3 = new CloudPlatform(this.game, 1300, 290, 'float1', this.clouds);

        cloud3.addMotionPath([
            { x: "+470", xSpeed: 4000, xEase: "Linear", y: "-220", ySpeed: 3000, yEase: "Linear" },
            { x: "-470", xSpeed: 4000, xEase: "Expo.easeOut", y: "+220", ySpeed: 3000, yEase: "Linear" }
        ]);

        //  The Player
        this.player = this.add.sprite(60, 0, 'egg');

        this.physics.arcade.enable(this.player);

        this.player.body.collideWorldBounds = true;
        this.player.body.setSize(20, 32, 5, 16);

        this.player.animations.add('left', [0, 1, 2, 3], 10, true);
        this.player.animations.add('turn', [4], 20, true);
        this.player.animations.add('right', [5, 6, 7, 8], 10, true);

        this.camera.follow(this.player);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.clouds.callAll('start');
        fx = this.add.audio('burp');
        death = this.add.audio('death');
        jump = this.add.audio('jump');
        goal = this.add.audio('goal');
        move = this.add.audio('move');
        console.log(this.player.body);
        text = this.add.text(10,10, "Find the slice of pizza", { font: "35px Arial", fill: "#ff0044", align: "center" });
        

        this.input.onDown.addOnce(removeText, this);
    },

    customSep: function (player, platform) {

        if (!this.locked && player.body.velocity.y > 0)
        {
            this.locked = true;
            this.lockedTo = platform;
            platform.playerLocked = true;

            player.body.velocity.y = 0;
        }

    },

    checkLock: function () {

        this.player.body.velocity.y = 0;

        //  If the player has walked off either side of the platform then they're no longer locked to it
        if (this.player.body.right < this.lockedTo.body.x || this.player.body.x > this.lockedTo.body.right)
        {
            this.cancelLock();
        }

    },

    cancelLock: function () {

        this.wasLocked = true;
        this.locked = false;

    },

    preRender: function () {

        if (this.game.paused)
        {
            //  Because preRender still runs even if your game pauses!
            return;
        }

        if (this.locked || this.wasLocked)
        {
            this.player.x += this.lockedTo.deltaX;
            this.player.y = this.lockedTo.y - 48;

            if (this.player.body.velocity.x !== 0)
            {
                this.player.body.velocity.y = 0;
            }
        }

        if (this.willJump)
        {
            this.willJump = false;

            if (this.lockedTo && this.lockedTo.deltaY < 0 && this.wasLocked)
            {
                //  If the platform is moving up we add its velocity to the players jump
                this.player.body.velocity.y = -300 + (this.lockedTo.deltaY * 10);
            }
            else
            {
                this.player.body.velocity.y = -300;
            }

            this.jumpTimer = this.time.time + 750;
        }

        if (this.wasLocked)
        {
            this.wasLocked = false;
            this.lockedTo.playerLocked = false;
            this.lockedTo = null;
        }

    },

    update: function () {

        this.background.tilePosition.x = -(this.camera.x * 0.7);
        this.mountain.tilePosition.x = -(this.camera.x * 0.9);

        this.physics.arcade.collide(this.player, this.stationary);
        this.physics.arcade.collide(this.player, this.clouds, this.customSep, null, this);
        this.physics.arcade.overlap(this.player, this.pizza, hitpizza, null, this);
        //  Do this AFTER the collide check, or we won't have blocked/touching set
        var standing = this.player.body.blocked.down || this.player.body.touching.down || this.locked;
       
        this.player.body.velocity.x = 0;
        if (this.player.body.onFloor()){
          var timeStamp = game.time.now;
          deadGuy(this.player,timeStamp);
        }

        if (this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -220;
            move.play('',0,0.4,false,false);

            if (this.facing !== 'left')
            {
                this.player.play('left');
                this.facing = 'left';
            }
        }
        else if (this.cursors.right.isDown)
        {
            this.player.body.velocity.x = 220;
            move.play('',0,0.4,false,false);

            if (this.facing !== 'right')
            {
                this.player.play('right');
                this.facing = 'right';
            }
        }
        else
        {
            if (this.facing !== 'idle')
            {
                this.player.animations.stop();

                if (this.facing === 'left')
                {
                    this.player.frame = 0;
                }
                else
                {
                    this.player.frame = 5;
                }

                this.facing = 'idle';
            }
        }
        
        if (standing && this.cursors.up.isDown && this.time.time > this.jumpTimer)
        {
            if (this.locked)
            {
                this.cancelLock();
            }

            this.willJump = true;
            jump.play('',0,0.5,false,false);
        }

        if (this.locked)
        {
            this.checkLock();
        }

        // if(!this.player.inWorld){
        //   this.player.kill();
        // }
      function hitpizza (player, pizza) {
        // Removes the pizza from the screen

        pizza.kill();
        goal.play();
        player.body.velocity = 0;
        cursors = game.input.keyboard.disable = true;

        game.time.events.add(200, function(){
          fx.play();
          // player.body.bounce.y=1;
          // player.body.angle=320;
        })

        game.time.events.add(300, function(){
          emitter.start(true, 2000, null, 10);
          game.time.events.add(700, function(){
            var text = "Congrats!!!\n you found the pizza";
            var style = { font: "45px Arial", fill: "#ff0044", align: "center" };
            var t = game.add.text(1950,0, text, style);
          })
        })
        game.time.events.add(5000, function(){
          game.state.start('Game', PhaserGame, true);
        })
      }  
    },



};
function deadGuy(player,timeStamp){
  death.play('',0,0.5,false,false);
  player.kill();       
  game.time.events.add(700, function(){
    player.reset(50,0);
  })
          

}

function removeText() {

    text.destroy();

}

CloudPlatform = function (game, x, y, key, group) {

    if (typeof group === 'undefined') { group = game.world; }

    Phaser.Sprite.call(this, game, x, y, key);

    game.physics.arcade.enable(this);

    this.anchor.x = 0.5;

    this.body.customSeparateX = true;
    this.body.customSeparateY = true;
    this.body.allowGravity = false;
    this.body.immovable = true;

    this.playerLocked = false;

    group.add(this);

};

CloudPlatform.prototype = Object.create(Phaser.Sprite.prototype);
CloudPlatform.prototype.constructor = CloudPlatform;

CloudPlatform.prototype.addMotionPath = function (motionPath) {

    this.tweenX = this.game.add.tween(this.body);
    this.tweenY = this.game.add.tween(this.body);

    //  motionPath is an array containing objects with this structure
    //  [
    //   { x: "+200", xSpeed: 2000, xEase: "Linear", y: "-200", ySpeed: 2000, yEase: "Sine.easeIn" }
    //  ]

    for (var i = 0; i < motionPath.length; i++)
    {
        this.tweenX.to( { x: motionPath[i].x }, motionPath[i].xSpeed, motionPath[i].xEase);
        this.tweenY.to( { y: motionPath[i].y }, motionPath[i].ySpeed, motionPath[i].yEase);
    }

    this.tweenX.loop();
    this.tweenY.loop();

};

CloudPlatform.prototype.start = function () {

    this.tweenX.start();
    this.tweenY.start();

};

CloudPlatform.prototype.stop = function () {

    this.tweenX.stop();
    this.tweenY.stop();

};

game.state.add('Game', PhaserGame, true);
