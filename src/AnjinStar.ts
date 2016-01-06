export class anjinStar {
    currX:number = null;
    currY:number = null;
    destX:number = null;
    destY:number = null;
    nextMove:string = "STOP";
    isMoving:boolean = false;
    speed:number = 200; // # of MS to move one tile. Doesn't account for think time.
}