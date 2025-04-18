import { CompoundGlyph, FontReader, Glyph } from "../font/fontReader.js";
import { FEdragRegion, multiElement } from "../lib/domtools.js";
import { Draggable } from "../lib/draggable.js";
import { DIV, FEdiv } from "../lib/htmltools.js";
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
    isEndpoint: boolean;
    constructor(x,y,isOnPath, isImplied, isEndpoint){
        super(x,y,3);
        this.isImplied = isImplied;
        this.isOnPath = isOnPath;
        this.isEndpoint = isEndpoint;
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
export function createGlyphEditor(data: Glyph | CompoundGlyph): FEglyphEditor | FEdiv{
    if(data.isCompound){
        return DIV().withClass("compound-glyph").says("Compound Glyph Editor: Coming Soon!")
    }
    else{
        return new FEglyphEditor(data as Glyph);
    }
}
export class FEglyphEditor extends FEdragRegion(FESVG){
    endpoints: number[];
    constructor(data: Glyph){
        let bezierPath = PATH("M 100 100 Q 200 200 300 100");
        console.log(data);
        let scale = Math.max((data.bounds.max.x - data.bounds.min.x), (data.bounds.max.y - data.bounds.min.y));
        let mapx = (x) => ((x - data.bounds.min.x) / scale) * 300 + 50;
        let mapy = (y) => ((y - data.bounds.min.y) / scale) * -300 + 350;
        let points = [];
        for(let i = 0; i < data.points.length; i++){
            let p = data.points[i];
            points.push(new DraggablePoint(mapx(p.x), mapy(p.y), p.isOnCurve, p.isImplied, p.isEndpoint));
        }
        super(
            bezierPath.withClass("character-outline"),
            GROUP(...points)
        )
        this.addDraggableChildren(...points)
        this.withClass("point-plot").withAttributes({viewBox: "0 0 400 400"});
        this.whileDragging = () => {
            let isStartPoint = true;
            let contourStartCoordinates = {x: 0, y: 0};
            let data = ''
            let i = 0;
            while(i < points.length){
                let b = (i > 0)? points[i - 1]: null;
                let p = points[i];
                if(isStartPoint){
                    contourStartCoordinates = {x: p.visualx, y: p.visualy};
                    data += ` M ${p.visualx} ${p.visualy}`
                    isStartPoint = false;
                }
                else if(b.isOnPath && p.isOnPath){
                    data += ` L ${p.visualx} ${p.visualy}`
                }
                else if(!b.isOnPath && p.isOnPath){
                    data += ` ${p.visualx} ${p.visualy}`
                }
                else if(!p.isOnPath){
                    data += ` Q ${p.visualx} ${p.visualy}`
                }

                if(p.isEndpoint){
                    if(b.isOnPath && !p.isOnPath){
                        data += ` ${contourStartCoordinates.x} ${contourStartCoordinates.y}`
                    }
                    data += ` Z`;

                    isStartPoint = true;
                }

                i++;
            }
            bezierPath.setData(data);
        }
        this.whileDragging();
        this.withClass("point-plot-container");
    }
}