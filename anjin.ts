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

        this.map.setCollisionBetween(1, 2000, true, 'collision');

        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.keys = new AnjinModule.Keys();
        this.keys.up    = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
        this.keys.down  = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
        this.keys.left  = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
        this.keys.right = this.game.input.keyboard.addKey(Phaser.Keyboard.D);

        var start = <ObjectEntity>this.map.objects['objects'][0];
        this.player = this.game.add.sprite(start.x, start.y, 'naga');
        this.player.anchor.set(0.5);

        this.game.physics.enable(this.player);

        this.game.camera.follow(this.player);
    }

    update() {
        this.game.physics.arcade.collide(this.player, this.collisionLayer);

        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;

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