export enum coordsType {
    Grid,
    Pixels
}

export class coords {
    tileSize: number;
    x: number;
    y: number;
    state: coordsType;

    constructor(newX: number, newY: number, state: coordsType = coordsType['Pixels'], tileSize: number = 64) {
        this.state = state;
        this.tileSize = tileSize;
        this.x = newX;
        this.y = newY;
    }
    convertToGrid() {
        if (this.state == coordsType['Grid']) {
            return;
        }
        return new coords(Math.floor(this.x / this.tileSize), Math.ceil(this.y / this.tileSize), coordsType['Grid'], this.tileSize);
    }
    convertToPixels() {
        if (this.state == coordsType['Pixels']) {
            return;
        }
        var ret = new coords((this.x * this.tileSize) + (this.tileSize/3), ((this.y) * this.tileSize)+64, coordsType['Pixels'], this.tileSize);
        return ret;
    }
}


export class anjinStar {
    curr: coords;
    dest: coords;
    nextDest: coords;
    path: Array<Object> = [];
    nextMove:string = "STOP";
    isMoving:boolean = false;
    speed:number = 200; // # of MS to move one tile. Doesn't account for think time.
}