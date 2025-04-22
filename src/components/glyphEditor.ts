import { CompoundGlyph, FontReader, Glyph, GlyphPoint } from "../font/fontReader.js";
import { FEdragRegion } from "../lib/domtools.js";
import { Draggable } from "../lib/draggable.js";
import { FESVG, GROUP, PATH, SVGCircle, SVGPath } from "../lib/svgtools.js";
import { Transform2d } from "../lib/transformtools.js";

type DraggableGlyphPoint = Draggable & GlyphPoint

class DraggablePoint extends SVGCircle implements DraggableGlyphPoint{
    x: number;
    y: number;
    px: number;
    py: number;
    isOnCurve: boolean;
    isImplied: boolean;
    isEndpoint: boolean;
    constructor(x,y,isOnCurve, isImplied, isEndpoint){
        super(x,y,3);
        this.isImplied = isImplied;
        this.isOnCurve = isOnCurve;
        this.isEndpoint = isEndpoint;
        if(isOnCurve){
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
        this.px = x;
        this.py = y;
    }
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.px = mouseDeltaX + this.x;
        this.py = mouseDeltaY + this.y;
        this.setPosition(this.px, this.py);
    }
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.x += mouseDeltaX;
        this.y += mouseDeltaY;
        this.px = this.x;
        this.py = this.y;
        this.setPosition(this.x, this.y);
    }
}
function GlyphToSvgPathData(points: GlyphPoint[], transform: Transform2d): string{
    let isStartPoint = true;
    let contourStartCoordinates = {x: 0, y: 0};
    let data = ''
    let i = 0;
    while(i < points.length){

        let b: GlyphPoint;
        if(i > 0){
            b = points[i - 1];
        }
        let p = points[i];
        let pl = {x: p.px, y: p.py};
        if(isStartPoint){
            contourStartCoordinates = {x: pl.x, y: pl.y};
            data += ` M ${pl.x} ${pl.y}`
            isStartPoint = false;
        }
        else if(b.isOnCurve && p.isOnCurve){
            data += ` L ${pl.x} ${pl.y}`
        }
        else if(!b.isOnCurve && p.isOnCurve){
            data += ` ${pl.x} ${pl.y}`
        }
        else if(!p.isOnCurve){
            data += ` Q ${pl.x} ${pl.y}`
        }

        if(p.isEndpoint){
            if(b.isOnCurve && !p.isOnCurve){
                data += ` ${contourStartCoordinates.x} ${contourStartCoordinates.y}`
            }
            data += ` Z`;

            isStartPoint = true;
        }

        i++;
    }
    return data;
}
class DraggableGlyph extends SVGPath implements Draggable{
    x: number;
    y: number;
    px: number;
    py: number;
    transform: Transform2d;
    private updateTransformData(){
        this.transform.e = this.px;
        this.transform.f = this.py;
        this.withAttributes({transform: this.transform.toSvgString()});
    }
    constructor(glyph: Glyph, transform: Transform2d){
        super(GlyphToSvgPathData(glyph.points, transform));
        this.withClass("glyph");

        this.transform = transform;
        this.x = transform.e;
        this.y = transform.f;
        this.px = this.x;
        this.py = this.y;
        this.updateTransformData();
        
    }
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.px = mouseDeltaX + this.x;
        this.py = mouseDeltaY + this.y;
        this.updateTransformData();
    }
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.x += mouseDeltaX;
        this.y += mouseDeltaY;
        this.px = this.x;
        this.py = this.y;
        this.updateTransformData();
    }
    
}
export function createGlyphEditor(reader: FontReader, data: Glyph | CompoundGlyph): FEglyphEditor | FEcompoundGlyphEditor{
    if(data.isCompound){
        return new FEcompoundGlyphEditor(reader, data);
    }
    else{
        return new FEglyphEditor(reader, data as Glyph);
    }
}
export class FEglyphEditor extends FEdragRegion(FESVG){
    endpoints: number[];
    constructor(reader: FontReader, data: Glyph){
        let bezierPath = PATH("M 100 100 Q 200 200 300 100");
        console.log(data);
        
        let points = [];
        for(let i = 0; i < data.points.length; i++){
            let p = data.points[i];
            points.push(new DraggablePoint(p.px, p.py, p.isOnCurve, p.isImplied, p.isEndpoint));
        }
        let scale = reader.unitsPerEm; //Math.max(data.bounds.max.x - data.bounds.min.x, data.bounds.max.y - data.bounds.min.y);
        let transform = Transform2d.translation(-data.bounds.min.x, -data.bounds.min.y).then(Transform2d.scaleXY(1/scale, -1/scale)).then(Transform2d.translation(0,1));
        super(
            GROUP(
                bezierPath.withClass("character-outline"),
                GROUP(...points)
            ).withAttributes({transform: transform.toSvgString()})
            
        )
        this.filterCoordinates = (x,y) => {
            return transform.inverse().applyTo({x: x / 400,y: y / 400});
        };
        this.filterCoordinates(0, 0);
        this.addDraggableChildren(...points)
        this.withClass("point-plot").withAttributes({width: 400, height: 400, viewBox: `0 0 1 1`});
        this.whileDragging = () => {
            bezierPath.setData(GlyphToSvgPathData(points, transform));
        }
        this.whileDragging();
    }
}
export class FEcompoundGlyphEditor extends FEdragRegion(FESVG){
    constructor(reader: FontReader, data: CompoundGlyph){
        let paths: DraggableGlyph[] = [];
        for(var i in data.components){
            let glyph = reader.readGlyph(data.components[i].index);
            if(glyph.isCompound){
                throw "Recursive Compound Glyph!!! (not implemented yet)"
            }
            paths.push(new DraggableGlyph(glyph as Glyph, data.components[i].transform));
        }
        let scale = reader.unitsPerEm; //Math.max(data.bounds.max.x - data.bounds.min.x, data.bounds.max.y - data.bounds.min.y);
        let transform = Transform2d.translation(-data.bounds.min.x, -data.bounds.min.y).then(Transform2d.scaleXY(1/scale, -1/scale)).then(Transform2d.translation(0,1));
        super(
            GROUP(
                ...paths
            ).withAttributes({transform: transform.toSvgString()})
        )

        this.filterCoordinates = (x,y) => {
            return transform.inverse().applyTo({x: x / 400,y: y / 400});
        };
        this.withClass("point-plot").withAttributes({width: 400, height: 400, viewBox: "0 0 1 1"});
        this.addDraggableChildren(...paths);

    }
}