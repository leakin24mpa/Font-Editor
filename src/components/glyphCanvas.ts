import { Font } from "../font/font.js";
import { CompoundGlyph, Glyph, GlyphPoint, SimpleGlyph } from "../font/fontReader.js";
import { FEdragRegion } from "../lib/domtools.js";
import { Draggable } from "../lib/draggable.js";
import { FESVG, GROUP, PATH, SVGCircle, SVGElement, SVGGroup, SVGPath } from "../lib/svgtools.js";
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
        super(x,y,15);
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
function GlyphToSvgPathData(points: GlyphPoint[]): string{
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
export function createSVGforGlyph(font: Font, glyphIndex: number): SVGElement{
    let glyph = font.glyphs[glyphIndex];
    if(glyph.isCompound){
        let children = [];
        for(let i = 0; i < glyph.components.length; i++){
            children.push(
                createSVGforGlyph(font, glyph.components[i].index)
                .withAttributes({transform: glyph.components[i].transform.toSvgString()})
            );
        }
        return GROUP(
            ...children
        )
    }
    else{
        return PATH(GlyphToSvgPathData((glyph as SimpleGlyph).points)).withAttributes({pathLength: 100});
    }
}
class DraggableGlyph extends SVGGroup implements Draggable{
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
    constructor(font: Font, glyphindex: number, transform: Transform2d){
        super(createSVGforGlyph(font, glyphindex));
        this.withClass("glyph");

        this.transform = transform.copy();
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
export function createGlyphEditor(font: Font, index: number): FEsimpleGlyphEditor | FEcompoundGlyphEditor{
    let glyph = font.glyphs[index];
    if(glyph.isCompound){
        return new FEcompoundGlyphEditor(font, glyph);
    }
    else{
        return new FEsimpleGlyphEditor(font, glyph as SimpleGlyph);
    }
}
export class FEsimpleGlyphEditor extends FEdragRegion(FESVG){
    endpoints: number[];
    constructor(font: Font, data: SimpleGlyph){
        let bezierPath = PATH("M 100 100 Q 200 200 300 100");
        
        let points = [];
        for(let i = 0; i < data.points.length; i++){
            let p = data.points[i];
            points.push(new DraggablePoint(p.px, p.py, p.isOnCurve, p.isImplied, p.isEndpoint));
        }
        let scale = font.head.unitsPerEm;
        let transform = Transform2d.scaleXY(1/scale, -1/scale).then(Transform2d.translation(0,1)); 
        super(
            PATH(`M 0 0 L 0 1 L 1 1 L 1 0 Z`).withClass("emsquare"),
            GROUP(
                bezierPath.withClass("character-outline"),
                GROUP(...points)
            ).withAttributes({transform: transform.toSvgString()})
            
        )
        this.filterCoordinates = (x,y) => {
            return transform.inverse().applyTo({x: x / this.element.clientWidth,y: y / this.element.clientHeight});
        };
        this.filterCoordinates(0, 0);
        this.addDraggableChildren(...points)
        this.withClass("point-plot").withAttributes({viewBox: `-0.1 -0.1 1.2 1.2`});
        this.whileDragging = () => {
            bezierPath.setData(GlyphToSvgPathData(points));
        }
        this.whileDragging();
    }
}
export class FEcompoundGlyphEditor extends FEdragRegion(FESVG){
    constructor(font: Font, data: CompoundGlyph){
        let paths: DraggableGlyph[] = [];
        for(var i in data.components){
            let glyphindex = data.components[i].index;
            
            paths.push(new DraggableGlyph(font, glyphindex, data.components[i].transform));
        }
        let scale = font.head.unitsPerEm;
        let transform = Transform2d.scaleXY(1/scale, -1/scale).then(Transform2d.translation(0,1));
        super(
            PATH(`M 0 0 L 0 1 L 1 1 L 1 0 Z`).withClass("emsquare"),
            GROUP(
                ...paths
            ).withAttributes({transform: transform.toSvgString()})
        )

        this.filterCoordinates = (x,y) => {
            return transform.inverse().applyTo({x: x / 400,y: y / 400});
        };
        this.withClass("point-plot").withAttributes({width: 600, height: 600, viewBox: "-0.1 -0.1 1.2 1.2"});
        this.addDraggableChildren(...paths);

    }
}

export class FEglyphDisplay extends FESVG{
    constructor(font: Font, index: number){
        let glyph = font.glyphs[index];
        let scale = font.hhea.ascent - font.hhea.descent;
        let shift = scale/2 - (glyph.bounds.max.x + glyph.bounds.min.x )/2
        let transform = Transform2d.translation(shift, -font.hhea.descent).then(Transform2d.scaleXY(1/scale, -1/scale)).then(Transform2d.translation(0,1));
        super(
            GROUP(
                createSVGforGlyph(font, index)
            ).withAttributes({transform: transform.toSvgString()})
        );
        
        this.withAttributes({width: 100, height:100, viewBox: "0 0 1 1"})
    }
}