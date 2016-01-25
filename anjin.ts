/// <reference path="./lib/phaser.d.ts" />
/// <reference path="./typings/easystarjs/easystarjs.d.ts" />

import {Roles, Religion} from "./src/AnjinDataTypes";
import {AnjinGame} from "./src/AnjinGame";
import {AnjinCamera} from './src/AnjinCamera';
import {coords, coordsType} from './src/AnjinStar';
import {PlayerActor, NonPlayerActor} from './src/Actor/Actor';
import {Keys} from './src/Keys';
import Sprite = Phaser.Sprite;

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


export class Anjin {
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
    isPaused: boolean = false;

    constructor() {
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
        AnjinGame.easyStar = new EasyStar.js();
        AnjinGame.easyStar.disableCornerCutting();

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
        this.player.sprite = this.actorGroup.create(1300, 800, 'blackthorne');
        this.player.sprite.anchor.set(0.5, 1);

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

        // Set up physics..
        this.game.physics.enable([this.player.sprite, this.npc['naga'].sprite], Phaser.Physics.ARCADE);
        this.player.sprite.body.setSize(64, 64, 0, 0);
        this.npc['naga'].sprite.body.setSize(64, 64, 0, 0);

        // More Naga setup.
        this.actorGroup.add(this.npc['naga'].sprite);
        this.npc['naga'].nav.curr = new coords(start.x, start.y, coordsType['Pixels']).convertToGrid();
        this.npc['naga'].nav.dest = new coords(dest.x, dest.y, coordsType['Pixels']).convertToGrid();
        //console.log("CURR:",this.npc['naga'].nav.curr);
        //console.log("DEST:",this.npc['naga'].nav.dest);

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
                    var currentPx = new coords(this.npc[npcId].sprite.x, this.npc[npcId].sprite.y, coordsType['Pixels']);
                    var currentGrid = currentPx.convertToGrid();
                    currentGrid.y = currentGrid.y - 1;
                    AnjinGame.easyStar.findPath(currentGrid.x, currentGrid.y,
                        this.npc[npcId].nav.dest.x, this.npc[npcId].nav.dest.y, (path) => {
                            if (path === null) {
                                console.log("The path to the destination point was not found.");
                            }
                            if (path && path[1]) {
                                this.npc[npcId].nav.path = path;
                            }
                            else {
                                this.npc[npcId].nav.nextMove = "STOP";
                            }
                        });

                    // Do calculation.
                    AnjinGame.easyStar.calculate();
                }, 100);
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
        if (!(this.isPaused)) {
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
            // Stop all NPCs.
            // Handle NPC motion.
            for (var npcId in this.npc) {
                if (!this.npc.hasOwnProperty(npcId)) {
                    continue;
                }
                this.npc[npcId].sprite.body.velocity.x = 0;
                this.npc[npcId].sprite.body.velocity.y = 0;
            }
        }
    }

    togglePause() {
        if (!this.isPaused) {
            // It was not paused. PAUSE.
            this.isPaused = true;
            this.attackGui(true);
        }
        else {
            // It was paused. UNPAUSE.
            this.isPaused = false;
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
        this.game.physics.arcade.collide([this.player.sprite,this.npc['naga'].sprite], this.collisionLayer);
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
            var dest = new coords(this.anjinCamera.x*this.game.width, this.anjinCamera.y*this.game.height);

            var t = this.game.add.tween(this.game.camera).to({x:dest.x, y:dest.y}, 600);
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
                var currentPx = new coords(npcSprite.x, npcSprite.y, coordsType['Pixels']);
                var currentGrid = currentPx.convertToGrid();

                // Handle pause stuff, if we're paused.
                if (AnjinGame.isPaused) {
                    npcSprite.body.velocity.x = 0;
                    npcSprite.body.velocity.y = 0;
                    console.log("Stopping ",npcId);
                }
                else {
                    currentGrid.y = currentGrid.y - 1;
                    //console.log("PX Sprite", this.npc[npcId].sprite.x, this.npc[npcId].sprite.y);
                    //console.log("Sprite GRID: ", currentGrid);

                    // Speed in pixels per second.
                    var speed = 200;
                    if (npcNav.path.length > 1) {
                        var nextMove = null;

                        // Update path to see if we've reached any point in it.
                        for (var i=1; i < npcNav.path.length; i++) {
                            if (currentGrid.x == npcNav.path[i].x && currentGrid.y == npcNav.path[i].y) {
                                // We're at this point in the path; clear everything up to it.
                                npcNav.path.splice(0, i);
                                nextMove = npcNav.path[i+1];
                            }
                            else {
                                // This isn't in the current Path; assume we're at the beginning.
                                nextMove = npcNav.path[i];
                                break;
                            }
                        }
                        //console.log("Next move: ",nextMove);
                        var npcSprite = this.npc[npcId].sprite;
                        if (!nextMove) {
                            npcSprite.body.velocity.x = 0;
                            npcSprite.body.velocity.y = 0;
                        }
                        else {
                            var next = new coords(nextMove.x, nextMove.y, coordsType['Grid']);
                            var nextPx = next.convertToPixels();

                            // Fuzzy math for being within a margin of the point slows the speed down.
                            var margin = 4;
                            if ((nextPx.x != npcSprite.x) && (((nextPx.x - margin) <= npcSprite.x) && ((nextPx.x + margin) >= npcSprite.x))) {
                                this.game.add.tween(npcSprite).to({x: nextPx.x}, margin);
                            }
                            if ((nextPx.y != npcSprite.y) && (((nextPx.y - margin) <= npcSprite.y) && ((nextPx.y + margin) >= npcSprite.y))) {
                                this.game.add.tween(npcSprite).to({y: nextPx.y}, margin);
                            }
                            if (npcSprite.x != nextPx.x || npcSprite.y != nextPx.y) {
                                this.game.physics.arcade.moveToObject(this.npc[npcId].sprite, nextPx, speed);
                            }
                            else {
                                npcSprite.body.velocity.x = 0;
                                npcSprite.body.velocity.y = 0;
                            }
                        }


                    }
                    else if (npcNav.path[0]) {
                        nextMove = npcNav.path[0];
                        var next = new coords(nextMove.x, nextMove.y, coordsType['Grid']);
                        var nextPx = next.convertToPixels();
                        this.game.add.tween(npcSprite).to({x: nextPx.x, y: nextPx.y}, speed);
                    }
                }

            }
        }
    }
    render() {
    }
}

console.log("Starting Anjin.");
var anjinGame = new Anjin();
