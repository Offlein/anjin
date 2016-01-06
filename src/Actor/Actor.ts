module AnjinModule {
    // Actor Relationships are data attributes from the perspective of one actor toward another.
    class ActorRelationship {
        fear: number;
        disgust: number;
        respect: number;
        exotique: number;
    }

    // Actor Attributes are data attributes describing an actor.
    class ActorAttribs {
        strength: number = 5;
        respect: number = 1;
        safety: number = 1;
        charisma: number = 1;
        role: Roles = Roles["Peasant"];
        religion: Religion = Religion["Shinto"];
    }

    class Actor implements ActorInterface {
        private _name: string;
        private _x: number;
        private _y: number;
        private _width: number = 64;
        private _height: number = 64;
        private _sprite: Phaser.Sprite;

        attribs: ActorAttribs = new ActorAttribs();
        relationships: { [key:string]:ActorRelationship; } = {};

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