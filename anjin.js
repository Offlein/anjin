/// <reference path="lib/phaser.d.ts"/>
var ObjectEntity = (function () {
    function ObjectEntity() {
    }
    return ObjectEntity;
})();
var Anjin = (function () {
    function Anjin() {
        this.game = new Phaser.Game(800, 800, Phaser.AUTO, '', { preload: this.preload, create: this.create, update: this.update });
    }
    Anjin.prototype.preload = function () {
        this.game.load.tilemap("AnjinMap", "assets/tilemaps/maps/anjin-tiles.json", null, Phaser.Tilemap.TILED_JSON);
        this.game.load.image("anjin-sky", "assets/tilemaps/tiles/anjin-sky.png");
        //this.game.load.image("anjin-biru", "assets/tilemaps/tiles/anjin-biru.png");
        this.game.load.image("anjin-grounds", "assets/tilemaps/tiles/anjin-grounds.png");
        this.game.load.image("naga", "assets/sprites/naga.png");
    };
    Anjin.prototype.create = function () {
        this.map = this.game.add.tilemap("AnjinMap", 64, 64, 25, 25);
        this.map.addTilesetImage("anjin-sky", "anjin-sky");
        this.map.addTilesetImage("anjin-grounds", "anjin-grounds");
        //this.map.addTilesetImage("anjin-biru","anjin-biru");
        this.map.createLayer('bg').resizeWorld();
        this.collisionLayer = this.map.createLayer('collision');
        //map.createLayer("Biru");
        this.map.setCollisionBetween(1, 2000, true, 'collision');
        this.cursors = this.game.input.keyboard.createCursorKeys();
        var start = this.map.objects['objects'][0];
        this.player = this.game.add.sprite(start.x, start.y, 'naga');
        this.player.anchor.set(0.5);
        this.game.physics.enable(this.player);
        this.game.camera.follow(this.player);
    };
    Anjin.prototype.update = function () {
        this.game.physics.arcade.collide(this.player, this.collisionLayer);
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        if (this.cursors.up.isDown) {
            this.player.body.velocity.y = -200;
        }
        else if (this.cursors.down.isDown) {
            this.player.body.velocity.y = 200;
        }
        if (this.cursors.left.isDown) {
            this.player.body.velocity.x = -200;
            this.player.scale.x = -1;
        }
        else if (this.cursors.right.isDown) {
            this.player.body.velocity.x = 200;
            this.player.scale.x = 1;
        }
    };
    return Anjin;
})();
window.onload = function () {
    var game = new Anjin();
};
//# sourceMappingURL=anjin.js.map