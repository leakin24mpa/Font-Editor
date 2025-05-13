import { Font } from "../font/font.js";
import { CompoundGlyph, Glyph, GlyphPoint, SimpleGlyph } from "../font/fontReader.js";
import { FEdragRegion, SVGboxResizer, SVGboxSelect } from "../lib/domtools.js";
import { DragAction, Draggable } from "../lib/draggable.js";
import { DIV, FEdiv } from "../lib/htmltools.js";
import { FESVG, GROUP, PATH, FESVGCircle, SVGFElement, FESVGGroup, FESVGPath, RECT } from "../lib/svgtools.js";
import { Transform2d } from "../lib/transformtools.js";

type DraggableGlyphPoint = Draggable & GlyphPoint

class DraggablePoint extends FESVGCircle implements DraggableGlyphPoint{
    x: number;
    y: number;
    px: number;
    py: number;
    selected: boolean;
    isOnCurve: boolean;
    isImplied: boolean;
    isEndpoint: boolean;
    constructor(x,y,isOnCurve, isImplied, isEndpoint){
        super(x,y,15);
        this.selected = false;
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
export function createSVGforGlyph(font: Font, glyphIndex: number): SVGFElement{
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
class DraggableGlyph extends FESVGGroup implements Draggable{
    x: number;
    y: number;
    px: number;
    py: number;
    selected: boolean;
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
        this.selected = false;
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
export function createGlyphEditor(font: Font, index: number): FEglyphCanvas{
    let glyph = font.glyphs[index];

    let cnv = new FEglyphCanvas(font.head.unitsPerEm);
    if(glyph.isCompound){
        cnv.loadCompoundGlyph(font, glyph);  
    }
    else{
        cnv.loadSimpleGlyph(glyph as SimpleGlyph);
    }
    return cnv;
}
class FEglyphCanvas extends FEdragRegion(FESVG){
    cameraTransform: Transform2d;
    canvas: FESVGGroup;
    boxselect: SVGboxSelect;
    constructor(scale: number){
        let transform = Transform2d.scaleXY(1/scale, -1/scale).then(Transform2d.translation(0,1)); 
        let canvas = GROUP(
            
        ).withTransform(transform);
        let camera = GROUP(
            RECT(0,0,1,1).withClass("emsquare"),
            canvas
        );

        super(
            camera
        );
        this.cameraTransform = Transform2d.scale(0.8);
        this.canvas = canvas;
        camera.withTransform(this.cameraTransform);
        this.filterCoordinates = (x,y) => {
            return transform.then(this.cameraTransform).inverse().applyTo({x: x / this.element.clientWidth,y: y / this.element.clientHeight});
        };
        this.withClass("point-plot").withAttributes({viewBox: `0 0 1 1`});

        this.boxselect = new SVGboxSelect(this, canvas);
        
        this.emptyAction = this.boxselect;
    }
    loadSimpleGlyph(glyph: SimpleGlyph){
        let bezierPath = PATH("");
        let points = [];
        for(let i = 0; i < glyph.points.length; i++){
            let p = glyph.points[i];
            points.push(new DraggablePoint(p.px, p.py, p.isOnCurve, p.isImplied, p.isEndpoint));
        }
        let resizer = new SVGboxResizer(50, 50, 200, 200, 15);
        this.canvas.replaceContent(
            bezierPath.withClass("character-outline"),
            GROUP(...points),
        )
        this.addDraggableChildren(...points);
        this.controller.whileDragging.addResponse(() => {
            bezierPath.setData(GlyphToSvgPathData(points));
        });
        this.controller.whileDragging.fire();
        this.boxselect.onSelect.addResponse(() => {     
            this.controller.multiselect(...points.filter((p) => this.boxselect.contains(p.x, p.y)));
        });
        this.controller.onSelectionChange.addResponse(() => {
            resizer.selfDestruct();
            if(this.controller.selectedElements.length < 2){
                return;
            }
            let bounds = {minx: Infinity, miny: Infinity, maxx: -Infinity, maxy: -Infinity}
            for(let i = points.length - 1; i >= 0; i--){
                if(points[i].selected){
                    bounds.minx = Math.min(points[i].x, bounds.minx);
                    bounds.maxx = Math.max(points[i].x, bounds.maxx);
                    bounds.miny = Math.min(points[i].y, bounds.miny);
                    bounds.maxy = Math.max(points[i].y, bounds.maxy);
                }
            }
            this.canvas.addChildren(resizer);
            resizer.x = bounds.minx;
            resizer.y = bounds.miny;
            resizer.width = bounds.maxx - bounds.minx;
            resizer.height = bounds.maxy - bounds.miny;
            resizer.update();
        })
    }
    loadCompoundGlyph(font: Font, glyph: CompoundGlyph){
        let paths: DraggableGlyph[] = [];
        
        for(var i in glyph.components){
            let glyphindex = glyph.components[i].index;
            
            paths.push(new DraggableGlyph(font, glyphindex, glyph.components[i].transform).onEvent("contextmenu", (e) =>{
                e.preventDefault();
            }));
        }
        this.canvas.replaceContent(...paths);
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