/// <reference path="./lib/phaser.d.ts" />
/// <reference path="./node_modules/retyped-easystarjs-tsd-ambient/easystarjs.d.ts" />

import {Roles, Religion} from "./src/AnjinDataTypes";
import {AnjinGame} from "./src/AnjinGame";
import {AnjinCamera} from './src/AnjinCamera';
import {PlayerActor, NonPlayerActor} from './src/Actor/Actor';
import {Keys} from './src/Keys';
import EasyStar = require('easystarjs');

class ObjectEntity {
    height: number;
    name: string;
    properties: any;
    rotation: number;
    type: string;
    visible: boolean;
    width: number;
    x: number;
    y: number;
}


class Anjin {
    game: Phaser.Game;
    map: Phaser.Tilemap;
    collisionLayer: Phaser.TilemapLayer;
    cursors: Phaser.CursorKeys;
    keys: Keys;
    anjinCamera: AnjinCamera;
    player: PlayerActor;
    npc: Object = {};
    actorGroup: Phaser.Group;
    guiGroup: Phaser.Group;
    texts: Object = {};

    constructor() {
        console.log(this.player);
        this.game = new Phaser.Game(800, 600, Phaser.AUTO, '',
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
        this.anjinCamera = new AnjinCamera();

        // Set up NPCs.
        this.npc = {
            'naga': new NonPlayerActor('Naga')
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
        AnjinGame.easyStar = new EasyStar.js;

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
        AnjinGame.easyStar.setGrid(collisionMap);
        AnjinGame.easyStar.setIterationsPerCalculation(1000);
        AnjinGame.easyStar.setAcceptableTiles([0]);
        AnjinGame.easyStar.enableDiagonals();

        // Set up arrow + WASD control.
        this.cursors = this.game.input.keyboard.createCursorKeys();
        this.keys = new Keys();
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
        this.player = new PlayerActor('Blackthorne')
        console.log(this.player);
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
        this.npc['naga'].sprite = this.game.add.sprite(start.x+(start.width / 2), start.y + (start.height), 'naga');
        this.npc['naga'].sprite.anchor.set(0.5, 1);
        this.actorGroup.add(this.npc['naga'].sprite);

        this.npc['naga'].nav.currX = ((start.x / 64));
        this.npc['naga'].nav.currY = ((start.y / 64)) - 1;
        this.npc['naga'].nav.destX = ((dest.x / 64));
        this.npc['naga'].nav.destY = ((dest.y / 64));

        // Handle pathfinding for each NPC.
        for (var npcId in this.npc) {
            if (this.npc.hasOwnProperty(npcId)) {
                // This is an NPC. Initialize his "AnjinStar" data.
                setInterval(() => {
                    // Only find a path if the NPC is not moving
                    if (this.npc[npcId].nav.isMoving) {
                        return;
                    }
                    // They're not, so let's plan.
                    AnjinGame.easyStar.findPath(this.npc[npcId].nav.currX, this.npc[npcId].nav.currY,
                        this.npc[npcId].nav.destX, this.npc[npcId].nav.destY, (path) => {
                            if (path === null) {
                                console.log("The path to the destination point was not found.");
                            }
                            if (path && path[1]) {
                                var currX = this.npc[npcId].nav.currX;
                                var currY = this.npc[npcId].nav.currY;
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
                                this.npc[npcId].nav.nextMove = nextMove;
                            }
                        });
                    //console.log("Current tile: "+(this.npc[npcId].nav.currX+","+this.npc[npcId].nav.currY));
                    //console.log("Next move: "+this.npc[npcId].nav.nextMove);

                    // Do calculation.
                    AnjinGame.easyStar.calculate();
                }, 400);
            }
        }

        // Initialize GUI stuff.
        this.guiGroup = this.game.add.group();
        this.game.add.group(this.guiGroup, 'selections');
        var attackText = this.game.add.text(20, this.game.scale.height-100, 'No one to attack.', {
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
        if (!(AnjinGame.isPaused)) {
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
        if (!AnjinGame.isPaused) {
            // It was not paused. PAUSE.
            AnjinGame.isPaused = true;
            this.attackGui(true);
        }
        else {
            // It was paused. UNPAUSE.
            AnjinGame.isPaused = false;
            this.attackGui(false);
        }
    }

    attackGui(isActive: boolean) {
        this.guiGroup.visible = isActive;

        var selections = null;
        var text = null;
        // Find the "selections" subgroup
        this.guiGroup.forEach(function(guiItem) {
            if (guiItem.name == 'selections') {
                selections = guiItem;
            }
        }, this);
        /*for (var i=0; i < this.guiGroup.children.length; i++) {
            if (this.guiGroup.children[i].name == 'selections') {
                selections = this.guiGroup.children[i];
            }
        }*/

        if (isActive) {
            var squares = [];
            var group: Phaser.Group = this.actorGroup;
            group.forEach(function(actor) {
                //var actor: DisplayObject = this.actorGroup.children[delta];
                var padding = 20;
                var square = this.game.add.bitmapData(actor.width + padding, actor.height + padding);
                square.ctx.beginPath();
                square.ctx.strokeStyle = 'red';
                square.ctx.strokeRect(0, 0, square.width, square.height);
                this.game.add.sprite(actor.x-(square.width / 2), actor.y-square.height + (padding / 2), square, null, selections);
                if (this.texts['attackText']) {
                    this.texts['attackText'].setText("Attack "+actor.key);
                }
            }, this);

            /*
            for (var delta=1; delta < this.actorGroup.children.length; delta++) {
                var actor: DisplayObject = this.actorGroup.children[delta];
                var padding = 20;
                var square = this.game.add.bitmapData(actor.width + padding, actor.height + padding);
                square.ctx.beginPath();
                square.ctx.strokeStyle = 'red';
                square.ctx.strokeRect(0, 0, square.width, square.height);
                this.game.add.sprite(actor.x-(square.width / 2), actor.y-square.height + (padding / 2), square, null, selections);
                if (this.texts['attackText']) {
                    this.texts['attackText'].setText("Attack "+this.actorGroup.children[delta].key);
                }
            }*/
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
        for (var npcId in this.npc) {
            if (this.npc.hasOwnProperty(npcId)) {
                // We've got an NPC.
                var npcSprite = this.npc[npcId].sprite;
                var npcNav = this.npc[npcId].nav;

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
                    switch (this.npc[npcId].nav.nextMove) {
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

                    this.npc[npcId].nav.nextMove = "STOP";
                    //console.log("Current Tile: "+ (Math.round((npcSprite.x-npcSprite.offsetX) / 64));
                    this.npc[npcId].nav.currX = (Math.round((npcSprite.x-npcSprite.offsetX) / 64) );
                    this.npc[npcId].nav.currY = (Math.round(npcSprite.y / 64)) - 1;
                    //console.log("Current Tile: "+ this.npc[npcId].nav.currX+","+this.npc[npcId].nav.currY );
                }
            }
        }
    }
    render() {
    }
}

export = Anjin;

console.log("Starting Anjin.");
var anjinGame = new Anjin();
