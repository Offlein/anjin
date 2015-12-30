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
        static easyStar: easystarjs.js;
        static isPaused: boolean = false;
    }
    export class anjinStar {
        currX: number = null;
        currY: number = null;
        destX: number = null;
        destY: number = null;
        nextMove: string = "STOP";
        isMoving: boolean = false;
        speed: number = 200; // # of MS to move one tile. Doesn't account for think time.
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

    export class AnjinCamera {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.direction = '';
            this.isMoving = false;
        }
        x: number;
        y: number;
        direction: string;
        isMoving: boolean;
    }
}



class Anjin {

    constructor() {
        this.game = new Phaser.Game(1280, 900, Phaser.AUTO, '',
            {
                preload: this.preload,
                create: this.create,
                update: this.update,
                togglePause: this.togglePause,
                attackGui: this.attackGui,
                movePlayer: this.movePlayer,
                moveCamera: this.moveCamera,
                moveNPCs: this.moveNPCs,
                render: this.render
            });
    }

    static game: Phaser.Game;
    map: Phaser.Tilemap;
    collisionLayer: Phaser.TilemapLayer;
    cursors: Phaser.CursorKeys;
    keys: AnjinModule.Keys;
    anjinCamera: AnjinModule.AnjinCamera;
    player: AnjinModule.PlayerActor = new AnjinModule.PlayerActor('Blackthorne');
    npc: Object;
    actorGroup: Phaser.Group;
    guiGroup: Phaser.Group;
    texts: Object = {};

    preload() {
        this.game.load.tilemap("AnjinMap", "assets/tilemaps/maps/anjin-tiles.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("anjin-sky", "assets/tilemaps/tiles/anjin-sky.png");
        //this.game.load.image("anjin-biru", "assets/tilemaps/tiles/anjin-biru.png");
        this.game.load.image("anjin-grounds", "assets/tilemaps/tiles/anjin-grounds.png");
        this.game.load.image("naga", "assets/sprites/naga.png");
        this.game.load.image("blackthorne", "assets/sprites/blackthorne.png");
    }

    create() {
        // Set up Camera.
        this.anjinCamera = new AnjinModule.AnjinCamera();

        // Set up NPCs.
        Anjin.npc = {
            'naga': new AnjinModule.NonPlayerActor('Naga')
        };

        // Set up map.
        this.map = this.game.add.tilemap("AnjinMap", 64, 64, 25, 25);
        this.map.addTilesetImage("anjin-sky","anjin-sky");
        this.map.addTilesetImage("anjin-grounds","anjin-grounds");
        //this.map.addTilesetImage("anjin-biru","anjin-biru");
        this.map.createLayer('bg').resizeWorld();
        this.collisionLayer = this.map.createLayer('collision');
        this.map.setCollisionBetween(22, 39, true, 'collision');

        // Initialize EasyStar Pathfinding
        AnjinModule.AnjinGame.easyStar = new EasyStar.js();

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
        AnjinModule.AnjinGame.easyStar.setGrid(collisionMap);
        AnjinModule.AnjinGame.easyStar.setIterationsPerCalculation(1000);
        AnjinModule.AnjinGame.easyStar.setAcceptableTiles([0]);
        AnjinModule.AnjinGame.easyStar.enableDiagonals();

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

        // Character groups.
        this.actorGroup = this.game.add.group();

        // Insert Player sprite ("Blackthorne").
        this.player = new AnjinModule.PlayerActor();
        this.player.sprite = this.actorGroup.create(1024, 192, 'blackthorne');
        this.game.physics.enable(this.player.sprite, Phaser.Physics.ARCADE);
        this.player.sprite.anchor.set(0.5, 1);
        this.player.sprite.body.setSize(64, 64, 0, 0);

        // Focus camera
        this.game.camera.focusOn(this.player.sprite);

        // Adding pause button.
        var spaceKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        spaceKey.onDown.add(() => {
            this.togglePause();
        });

        // Hardcode one NPC for now: Naga.
        Anjin.npc['naga'].sprite = this.game.add.sprite(start.x+(start.width / 2), start.y + (start.height), 'naga');
        Anjin.npc['naga'].sprite.anchor.set(0.5, 1);
        this.actorGroup.add(Anjin.npc['naga'].sprite);

        Anjin.npc['naga'].nav.currX = ((start.x / 64));
        Anjin.npc['naga'].nav.currY = ((start.y / 64)) - 1;
        Anjin.npc['naga'].nav.destX = ((dest.x / 64));
        Anjin.npc['naga'].nav.destY = ((dest.y / 64));

        // Handle pathfinding for each NPC.
        for (var npcId in Anjin.npc) {
            if (Anjin.npc.hasOwnProperty(npcId)) {
                // This is an NPC. Initialize his "AnjinStar" data.
                setInterval(function() {
                    // Only find a path if the NPC is not moving
                    if (Anjin.npc[npcId].nav.isMoving) {
                        return;
                    }
                    // They're not, so let's plan.
                    AnjinModule.AnjinGame.easyStar.findPath(Anjin.npc[npcId].nav.currX, Anjin.npc[npcId].nav.currY,
                        Anjin.npc[npcId].nav.destX, Anjin.npc[npcId].nav.destY, function(path) {
                            if (path === null) {
                                console.log("The path to the destination point was not found.");
                            }
                            if (path && path[1]) {
                                var currX = Anjin.npc[npcId].nav.currX;
                                var currY = Anjin.npc[npcId].nav.currY;
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
                                Anjin.npc[npcId].nav.nextMove = nextMove;
                            }
                        });
                    //console.log("Current tile: "+(Anjin.npc[npcId].nav.currX+","+Anjin.npc[npcId].nav.currY));
                    //console.log("Next move: "+Anjin.npc[npcId].nav.nextMove);

                    // Do calculation.
                    AnjinModule.AnjinGame.easyStar.calculate();
                }, 400);
            }
        }

        // Initialize GUI stuff.
        this.guiGroup = this.game.add.group();
        this.game.add.group(this.guiGroup, 'selections');
        var attackText = this.game.add.text(20, this.game.scale.height-100, 'Attack whom? ', {
            'backgroundColor': '#FFFFFF',
            'fontSize': 32
        });
        this.texts = {};
        this.texts['attackText'] = attackText;
        attackText.fixedToCamera = true;
        attackText.fontSize = 72;
        this.guiGroup.add(attackText);
        this.guiGroup.visible = false;
    }

    update() {
        if (!(AnjinModule.AnjinGame.isPaused)) {
            // Move player
            this.movePlayer();
            // Move camera
            this.moveCamera();
            // Move NPCs
            this.moveNPCs();

            // Handle Z-index for sprites for proper overlapping.
            this.actorGroup.sort('y', Phaser.Group.SORT_ASCENDING);
        }
        else {
            // Stop Player.
            this.player.sprite.body.velocity.x = 0;
            this.player.sprite.body.velocity.y = 0;
        }
    }

    togglePause() {
        if (!AnjinModule.AnjinGame.isPaused) {
            // It was not paused. PAUSE.
            AnjinModule.AnjinGame.isPaused = true;
            this.attackGui(true);
        }
        else {
            // It was paused. UNPAUSE.
            AnjinModule.AnjinGame.isPaused = false;
            this.attackGui(false);
        }
    }

    attackGui(isActive: boolean) {
        this.guiGroup.visible = isActive;

        var selections = null;
        var text = null;
        // Find the "selections" subgroup.
        for (var i=0; i < this.guiGroup.children.length; i++) {
            if (this.guiGroup.children[i].name == 'selections') {
                selections = this.guiGroup.children[i];
            }
        }

        if (isActive) {
            var squares = [];
            for (var delta=1; delta < this.actorGroup.children.length; delta++) {
                var actor = this.actorGroup.children[delta];
                var padding = 20;
                var square = this.game.add.bitmapData(actor.width + padding, actor.height + padding);
                square.ctx.beginPath();
                square.ctx.strokeStyle = 'red';
                square.ctx.strokeRect(0, 0, square.width, square.height);
                this.game.add.sprite(actor.x-(square.width / 2), actor.y-square.height + (padding / 2), square, null, selections);
                if (this.texts['attackText']) {
                    this.texts['attackText'].setText("Attack "+this.actorGroup.children[delta].key);
                }
            }
        }
        else {
            // Remove all selections squares.
            for (var i=0; i < this.guiGroup.children.length; i++) {
                selections.removeAll();
            }
        }
    }

    movePlayer() {
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
        }
        else if (this.cursors.right.isDown || this.keys.right.isDown)
        {
            playerSprite.body.velocity.x = 200;
        }
    }

    moveCamera() {
        if (this.anjinCamera.isMoving) {
            return;
        }

        this.anjinCamera.isMoving = true;
        var mustMove = false;

        if (this.player.sprite.y > this.game.camera.y + this.game.height) {
            this.anjinCamera.y += 1;
            mustMove = true;
        }
        else if (this.player.sprite.y < this.game.camera.y) {
            this.anjinCamera.y -= 1;
            mustMove = true;
        }
        else if (this.player.sprite.x > this.game.camera.x + this.game.width) {
            this.anjinCamera.x = this.anjinCamera.x + 1;
            mustMove = true;
        }
        else if (this.player.sprite.x < this.game.camera.x) {
            this.anjinCamera.x = this.anjinCamera.x - 1;
            mustMove = true;
        }

        if (mustMove) {
            var destX = this.anjinCamera.x*this.game.width;
            var destY = this.anjinCamera.y*this.game.height;

            var t = this.game.add.tween(this.game.camera).to({x:destX, y:destY}, 600);
            t.start();
            t.onComplete.add(function(){this.anjinCamera.isMoving = false;}, this);
        }
        else {
            this.anjinCamera.isMoving = false;
        }
    }

    moveNPCs() {
        // Handle NPC motion.
        for (var npcId in Anjin.npc) {
            if (Anjin.npc.hasOwnProperty(npcId)) {
                // We've got an NPC.
                var npcSprite = Anjin.npc[npcId].sprite;
                var npcNav = Anjin.npc[npcId].nav;

                if (npcNav.isMoving) {
                    // Do nothing if it's currently moving!
                    return;
                }
                else {
                    // We're not moving - let's go!
                    var impulseDest = {
                        x: npcSprite.x,
                        y: npcSprite.y
                    };
                    npcNav.isMoving = true;
                    switch (Anjin.npc[npcId].nav.nextMove) {
                        case "STOP":
                            npcNav.isMoving = false;
                            break;
                        case "N":
                            impulseDest.y = npcSprite.y - 64;
                            break;
                        case "NE":
                            impulseDest.x = npcSprite.x + 64;
                            impulseDest.y = npcSprite.y - 64;
                            break;
                        case "NW":
                            impulseDest.x = npcSprite.x - 64;
                            impulseDest.y = npcSprite.y - 64;
                            break;
                        case "W":
                            impulseDest.x = npcSprite.x - 64;
                            break;
                        case "E":
                            impulseDest.x = npcSprite.x + 64;
                            break;
                        case "S":
                            impulseDest.y = npcSprite.y + 64;
                            break;
                        case "SE":
                            impulseDest.x = npcSprite.x + 64;
                            impulseDest.y = npcSprite.y + 64;
                            break;
                        case "SW":
                            impulseDest.x = npcSprite.x - 64;
                            impulseDest.y = npcSprite.y + 64;
                            break;
                    }
                    // Process impulse.
                    if (impulseDest.x != npcSprite.x || impulseDest.y != npcSprite.y) {
                        var t = this.game.add.tween(npcSprite).to({x:impulseDest.x, y:impulseDest.y}, npcNav.speed);
                        t.start();
                        t.onComplete.add(function(){
                            // Done animating NPC move.
                            npcNav.isMoving = false;
                        }, this);
                    }

                    Anjin.npc[npcId].nav.nextMove = "STOP";
                    //console.log("Current Tile: "+ (Math.round((npcSprite.x-npcSprite.offsetX) / 64));
                    Anjin.npc[npcId].nav.currX = (Math.round((npcSprite.x-npcSprite.offsetX) / 64) );
                    Anjin.npc[npcId].nav.currY = (Math.round(npcSprite.y / 64)) - 1;
                    //console.log("Current Tile: "+ Anjin.npc[npcId].nav.currX+","+Anjin.npc[npcId].nav.currY );
                }
            }
        }
    }
    render() {
    }
}

window.onload = () => {
    var anjinGame = new Anjin();
};