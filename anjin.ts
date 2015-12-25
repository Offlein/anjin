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
    export class AnjinGame {

    }
    export class EasyStar {
        static easyStar: easystarjs.js;
    }
    export class anjinStar {
        currX: number = null;
        currY: number = null;
        destX: number = null;
        destY: number = null;
        nextMove: string = "STOP";
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

        constructor(ActorName: string) {
            this.name = ActorName;
        }
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
        nav: AnjinModule.anjinStar = new AnjinModule.anjinStar();
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
    static player: AnjinModule.PlayerActor;
    static npc: Object;

    preload() {
        this.game.load.tilemap("AnjinMap", "assets/tilemaps/maps/anjin-tiles.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("anjin-sky", "assets/tilemaps/tiles/anjin-sky.png");
        //this.game.load.image("anjin-biru", "assets/tilemaps/tiles/anjin-biru.png");
        this.game.load.image("anjin-grounds", "assets/tilemaps/tiles/anjin-grounds.png");
        this.game.load.image("naga", "assets/sprites/naga.png");
        this.game.load.image("blackthorne", "assets/sprites/blackthorne.png");
    }

    create() {
        Anjin.npc = {
            'naga': AnjinModule.NonPlayerActor = new AnjinModule.NonPlayerActor('Naga')
        };
        this.map = this.game.add.tilemap("AnjinMap", 64, 64, 25, 25);
        this.map.addTilesetImage("anjin-sky","anjin-sky");
        this.map.addTilesetImage("anjin-grounds","anjin-grounds");
        //this.map.addTilesetImage("anjin-biru","anjin-biru");


        this.map.createLayer('bg').resizeWorld();
        this.collisionLayer = this.map.createLayer('collision');

        //map.createLayer("Biru");

        this.map.setCollisionBetween(22, 39, true, 'collision');
        AnjinModule.easyStar = new EasyStar.js();

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

        // Initialize EasyStar configuration.
        AnjinModule.easyStar.setGrid(collisionMap);
        AnjinModule.easyStar.setIterationsPerCalculation(1000);
        AnjinModule.easyStar.setAcceptableTiles([0]);
        AnjinModule.easyStar.enableDiagonals();

        // Set up arrow + WASD control.
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.keys = new AnjinModule.Keys();
        this.keys.up    = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.keys.down  = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.keys.left  = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.keys.right = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

        // Load tile object layer objects (JUST DOIN' IT TEMPORARILY).
        var start = <ObjectEntity>this.map.objects['objects'][0];
        var dest  = <ObjectEntity>this.map.objects['objects'][1];

        // Insert Player sprite ("Blackthorne").
        this.player = new AnjinModule.PlayerActor('Blackthorne');
        this.player.sprite = this.game.add.sprite(192, 192, 'blackthorne');
        this.player.sprite.anchor.set(0.5);
        this.game.physics.enable(this.player.sprite);
        this.game.camera.follow(this.player.sprite);

        // Hardcode one NPC for now: Naga.
        Anjin.npc.naga.sprite = this.game.add.sprite(start.x+(start.width / 2), start.y + (start.height/2), 'naga');
        Anjin.npc.naga.sprite.anchor.set(0.5);

        Anjin.npc.naga.nav.currX = ((start.x / 64));
        Anjin.npc.naga.nav.currY = ((start.y / 64));
        Anjin.npc.naga.nav.destX = ((dest.x / 64));
        Anjin.npc.naga.nav.destY = ((dest.y / 64));

        // Handle pathfinding for each NPC.
        for (var npc in Anjin.npc) {
            if (Anjin.npc.hasOwnProperty(npc)) {
                // This is an NPC. Initialize his "AnjinStar" data.
                console.log("this: "+this.npc);
                console.log("class: "+Anjin.npc);
                setInterval(function() {
                    AnjinModule.easyStar.findPath(Anjin.npc.naga.nav.currX, Anjin.npc.naga.nav.currY,
                        Anjin.npc.naga.nav.destX, Anjin.npc.naga.nav.destY, function(path) {
                            if (path === null) {
                                console.log("The path to the destination point was not found.");
                            }
                            if (path && path[1]) {
                                var currX = Anjin.npc.naga.nav.currX;
                                var currY = Anjin.npc.naga.nav.currY;
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
                                Anjin.npc.naga.nav.nextMove = nextMove;
                            }
                        });
                    //console.log("Current tile: "+(Anjin.npc.naga.nav.currX+","+Anjin.npc.naga.nav.currY));
                    //console.log("Next move: "+Anjin.npc.naga.nav.nextMove);

                    // Do calculation.
                    AnjinModule.easyStar.calculate();
                }, 400);
            }
        }
    }

    update() {
        // Handle NPC motion.
        // Just hard-coding the one Naga NPC for now.
        var nagaSprite = Anjin.npc.naga.sprite;

        switch (Anjin.npc.naga.nav.nextMove) {
            case "STOP":
                break;
            case "N":
                nagaSprite.y = nagaSprite.y - 64;
                break;
            case "NE":
                nagaSprite.x = nagaSprite.x + 64;
                nagaSprite.y = nagaSprite.y - 64;
                break;
            case "NW":
                nagaSprite.x = nagaSprite.x - 64;
                nagaSprite.y = nagaSprite.y - 64;
                break;
            case "W":
                nagaSprite.x = nagaSprite.x - 64;
                break;
            case "E":
                nagaSprite.x = nagaSprite.x + 64;
                break;
            case "S":
                nagaSprite.y = nagaSprite.y + 64;
                break;
            case "SE":
                nagaSprite.x = nagaSprite.x + 64;
                nagaSprite.y = nagaSprite.y + 64;
                break
            case "SW":
                nagaSprite.x = nagaSprite.x - 64;
                nagaSprite.y = nagaSprite.y + 64;
                break
        }
        Anjin.npc.naga.nav.nextMove = "STOP";
        //console.log("Current Tile: "+ (Math.round((nagaSprite.x-nagaSprite.offsetX) / 64));
        Anjin.npc.naga.nav.currX = (Math.round((nagaSprite.x-nagaSprite.offsetX) / 64) );
        Anjin.npc.naga.nav.currY = (Math.round((nagaSprite.y-nagaSprite.offsetY) / 64) );
        //console.log("Current Tile: "+ Anjin.npc.naga.nav.currX+","+Anjin.npc.naga.nav.currY );

        // Handle player motion.
        var playerSprite = this.player.sprite;
        playerSprite.body.velocity.x = 0;
        playerSprite.body.velocity.y = 0;
        this.game.physics.arcade.collide(this.player.sprite, this.collisionLayer);
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
    var anjinGame = new Anjin();
};