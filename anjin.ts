/// <reference path="./lib/phaser.d.ts"/>
/// <reference path="typings/easystarjs/easystarjs.d.ts" />

class ObjectEntity {
    height: number;
    name: string;
    properties: any;
    rectange: boolean;
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
}

module AnjinModule {
    export class anjinStar {
        static currX: number = null;
        static currY: number = null;
        static destX: number = null;
        static destY: number = null;
        static nextMove: string = "STOP";
        static easyStar: easystar.js;
    }
    export interface ActorInterface {
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
        sprite: Phaser.Sprite;
    }
    export class Keys {
        up: Phaser.Key;
        down: Phaser.Key;
        left: Phaser.Key;
        right: Phaser.Key;
    }
    class Actor implements ActorInterface {
        private _name: string;
        private _x: number;
        private _y: number;
        private _width: number = 64;
        private _height: number = 64;
        private _sprite: Phaser.Sprite;

        get name():string {
            return this._name;
        }

        set name(value:string) {
            this._name = value;
        }

        get x():number {
            return this._x;
        }

        set x(value:number) {
            this._x = value;
        }

        get y():number {
            return this._y;
        }

        set y(value:number) {
            this._y = value;
        }

        get width():number {
            return this._width;
        }

        set width(value:number) {
            this._width = value;
        }

        get height():number {
            return this._height;
        }

        set height(value:number) {
            this._height = value;
        }
        get sprite(): Phaser.Sprite {
            return this._sprite;
        }
        set sprite(newSprite: Phaser.Sprite) {
            this._sprite = newSprite;
        }
    }

    export class PlayerActor extends Actor implements ActorInterface {

    }
    export class NonPlayerActor extends Actor implements ActorInterface {

    }
}




class Anjin {

    constructor() {
        this.game = new Phaser.Game(800, 800, Phaser.AUTO, '', { preload: this.preload, create: this.create, update: this.update });
    }

    game: Phaser.Game;
    map: Phaser.Tilemap;
    collisionLayer: Phaser.TilemapLayer;
    cursors: Phaser.CursorKeys;
    keys: AnjinModule.Keys;
    player: AnjinModule.PlayerActor;

    preload() {
        this.game.load.tilemap("AnjinMap", "assets/tilemaps/maps/anjin-tiles.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("anjin-sky", "assets/tilemaps/tiles/anjin-sky.png");
        //this.game.load.image("anjin-biru", "assets/tilemaps/tiles/anjin-biru.png");
        this.game.load.image("anjin-grounds", "assets/tilemaps/tiles/anjin-grounds.png");
        this.game.load.image("naga", "assets/sprites/naga.png");
    }

    create() {
        this.map = this.game.add.tilemap("AnjinMap", 64, 64, 25, 25);
        this.map.addTilesetImage("anjin-sky","anjin-sky");
        this.map.addTilesetImage("anjin-grounds","anjin-grounds");
        //this.map.addTilesetImage("anjin-biru","anjin-biru");


        this.map.createLayer('bg').resizeWorld();
        this.collisionLayer = this.map.createLayer('collision');

        //map.createLayer("Biru");

        this.map.setCollisionBetween(22, 39, true, 'collision');
        AnjinModule.anjinStar.easyStar = new EasyStar.js();

        // Map out the collision data
        var collisionMap = this.collisionLayer.layer.data.map(function(row, rowIndex, data) {
            return row.map(function(cell, cellIndex, rowData) {
                if (cell.index != -1) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
        });

        AnjinModule.anjinStar.easyStar.setGrid(collisionMap);
        AnjinModule.anjinStar.easyStar.setIterationsPerCalculation(1000);
        AnjinModule.anjinStar.easyStar.setAcceptableTiles([0]);
        AnjinModule.anjinStar.easyStar.enableDiagonals();

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.keys = new AnjinModule.Keys();
        this.keys.up    = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.keys.down  = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.keys.left  = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.keys.right = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

        var start = <ObjectEntity>this.map.objects['objects'][0];
        var dest  = <ObjectEntity>this.map.objects['objects'][1];

        this.player = new AnjinModule.PlayerActor();
        this.player.sprite = this.game.add.sprite(start.x+(start.width / 2), start.y + (start.height/2), 'naga');
        this.player.sprite.anchor.set(0.5);

        this.game.physics.enable(this.player.sprite);

        this.game.camera.follow(this.player.sprite);

        AnjinModule.anjinStar.currX = ((start.x / 64));
        AnjinModule.anjinStar.currY = ((start.y / 64));
        AnjinModule.anjinStar.destX = ((dest.x / 64));
        AnjinModule.anjinStar.destY = ((dest.y / 64));

        // Handle automotion
        setInterval(function() {
            AnjinModule.anjinStar.easyStar.findPath(AnjinModule.anjinStar.currX, AnjinModule.anjinStar.currY,
                AnjinModule.anjinStar.destX, AnjinModule.anjinStar.destY, function(path) {
                if (path === null) {
                    console.log("The path to the destination point was not found.");
                }
                if (path && path[1]) {
                    var currX = AnjinModule.anjinStar.currX;
                    var currY = AnjinModule.anjinStar.currY;
                    var nextX = path[1].x;
                    var nextY = path[1].y;

                    var nextMove = "";
                    if (nextY < currY) {
                        nextMove += "N";
                    }
                    else if (nextY > currY) {
                        nextMove += "S";
                    }
                    if (nextX > currX) {
                        nextMove += "E";
                    }
                    else if (nextX < currX) {
                        nextMove += "W";
                    }
                    if (nextMove === "") {
                        nextMove = "STOP";
                    }
                    AnjinModule.anjinStar.nextMove = nextMove;
                }
            });
            //console.log("Current tile: "+(AnjinModule.anjinStar.currX+","+AnjinModule.anjinStar.currY));
            //console.log("Next move: "+AnjinModule.anjinStar.nextMove);

            // Do calculation.
            AnjinModule.anjinStar.easyStar.calculate();
        }, 400);
    }

    update() {
        var playerSprite = this.player.sprite;

        this.game.physics.arcade.collide(this.player.sprite, this.collisionLayer);

        playerSprite.body.velocity.x = 0;
        playerSprite.body.velocity.y = 0;

        switch (AnjinModule.anjinStar.nextMove) {
            case "STOP":
                break;
            case "N":
                playerSprite.y = playerSprite.y - 64;
                break;
            case "NE":
                playerSprite.x = playerSprite.x + 64;
                playerSprite.y = playerSprite.y - 64;
                break;
            case "NW":
                playerSprite.x = playerSprite.x - 64;
                playerSprite.y = playerSprite.y - 64;
                break;
            case "W":
                playerSprite.x = playerSprite.x - 64;
                break;
            case "E":
                playerSprite.x = playerSprite.x + 64;
                break;
            case "S":
                playerSprite.y = playerSprite.y + 64;
                break;
            case "SE":
                playerSprite.x = playerSprite.x + 64;
                playerSprite.y = playerSprite.y + 64;
                break
            case "SW":
                playerSprite.x = playerSprite.x - 64;
                playerSprite.y = playerSprite.y + 64;
                break
        }
        AnjinModule.anjinStar.nextMove = "STOP";
        //console.log("Current Tile: "+ (Math.round((playerSprite.x-playerSprite.offsetX) / 64));
        AnjinModule.anjinStar.currX = (Math.round((playerSprite.x-playerSprite.offsetX) / 64) );
        AnjinModule.anjinStar.currY = (Math.round((playerSprite.y-playerSprite.offsetY) / 64) );
        //console.log("Current Tile: "+ AnjinModule.anjinStar.currX+","+AnjinModule.anjinStar.currY );


        if (this.cursors.up.isDown || this.keys.up.isDown)
        {
            playerSprite.body.velocity.y = -200;
        }
        else if (this.cursors.down.isDown || this.keys.down.isDown)
        {
            playerSprite.body.velocity.y = 200;
        }

        if (this.cursors.left.isDown || this.keys.left.isDown)
        {
            playerSprite.body.velocity.x = -200;
            playerSprite.scale.x = -1;
        }
        else if (this.cursors.right.isDown || this.keys.right.isDown)
        {
            playerSprite.body.velocity.x = 200;
            playerSprite.scale.x = 1;
        }
    }
}

window.onload = () => {

    var game = new Anjin();

};