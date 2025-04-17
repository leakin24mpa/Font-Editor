import { FEdragRegion, multiElement } from "../lib/domtools.js";
import { Draggable } from "../lib/draggable.js";
import { FEdiv } from "../lib/htmltools.js";
import { CIRCLE, FESVG, GROUP, PATH, SVG, SVGCircle } from "../lib/svgtools.js";

function randomCoord(){
    return Math.random() * 100;
}


class DraggablePoint extends SVGCircle implements Draggable{
    x: number;
    y: number;
    visualx: number;
    visualy: number;
    isOnPath: boolean;
    isImplied: boolean;
    constructor(x,y,isOnPath, isImplied){
        super(x,y,5);
        this.isImplied = isImplied
        this.isOnPath = isOnPath;
        if(isOnPath){
            this.withClass("path-point");
        }
        else{
            this.withClass("control-point");
        }
        if(isImplied){
            this.withClass("implied-point");
        }
        this.x = x;
        this.y = y;
        this.visualx = x;
        this.visualy = y;
    }
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.visualx = mouseDeltaX + this.x;
        this.visualy = mouseDeltaY + this.y;
        this.setPosition(this.visualx, this.visualy);
    }
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.x += mouseDeltaX;
        this.y += mouseDeltaY;
        this.visualx = this.x;
        this.visualy = this.y;
        this.setPosition(this.x, this.y);
    }
}
export class FEglyphEditor extends FEdragRegion(FESVG){
    constructor(){
        let bezierPath = PATH("M 100 100 Q 200 200 300 100");
        let points = [
            new DraggablePoint(randomCoord(), randomCoord(), true, false),
            new DraggablePoint(randomCoord(), randomCoord(), true, true),
            new DraggablePoint(randomCoord(), randomCoord(), false, false),
            new DraggablePoint(randomCoord(), randomCoord(), true, false),

        ];
        super(
            bezierPath,
            GROUP(...points)
        )
        this.addDraggableChildren(...points)
        this.withClass("point-plot").withAttributes({viewBox: "0 0 400 400"});
        this.whileDragging = () => {
            let data = `M ${points[0].visualx} ${points[0].visualy}`
            let i = 1;
            while(i < points.length){
                let b = points[i - 1];
                let p = points[i];
                if(b.isOnPath && p.isOnPath){
                    data += ` L ${p.visualx} ${p.visualy}`
                }
                if(!b.isOnPath && p.isOnPath){
                    data += ` ${p.visualx} ${p.visualy}`
                }
                if(!p.isOnPath){
                    data += ` Q ${p.visualx} ${p.visualy}`
                }
                i++;
            }
            bezierPath.setData(data);
        }
        this.whileDragging();
        this.withClass("point-plot-container");
    }
}