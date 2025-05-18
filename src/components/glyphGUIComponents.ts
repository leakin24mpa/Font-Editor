import { Font } from "../font/font.js";
import { GlyphPoint, SimpleGlyph } from "../font/fontReader.js";
import { Draggable } from "../lib/draggable.js";
import { FESVGPath, FESVGCircle, SVGFElement, GROUP, PATH, FESVGGroup, FESVGLine, LINE } from "../lib/svgtools.js";
import { Transform2d } from "../lib/transformtools.js";

export class SVGGlyphContour extends FESVGPath{
  indicies: number[];
  constructor(points: GlyphPoint[], indicies: number[]){
    super("");
    this.indicies = indicies;
    console.log(this.indicies);
    this.update(points);
  }
  update(points: GlyphPoint[]){
    this.setData(this.toSvgPathData(points));
  }
  pointAtIndex(points: GlyphPoint[], index: number){
    return points[this.indicies[index % this.indicies.length]];
  }
  toSvgPathData(points: GlyphPoint[]): string{
    let b = points[this.indicies[0]];
    let contourStartCoordinates = {x: b.px, y: b.py};
    let data = `M ${b.px} ${b.py}`
    for(let i = 1; i < this.indicies.length; i++){
      let p = points[this.indicies[i]];
      let pl = {x: p.px, y: p.py};
      if(b.isOnCurve && p.isOnCurve){
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
      }
      b = p;
    }
    
    return data;
  }
}
export class DraggableGlyphPoint extends FESVGCircle implements Draggable, GlyphPoint{
    x: number;
    y: number;
    px: number;
    py: number;
    selected: boolean;
    isOnCurve: boolean;
    isImplied: boolean;
    isEndpoint: boolean;
    contourIndex: number;
    index: number;
    constructor(x: number,y: number,isOnCurve: boolean, isImplied: boolean, isEndpoint: boolean, contourIndex: number, index: number){
        super(x,y,15);
        this.selected = false;
        this.isImplied = isImplied;
        this.isOnCurve = isOnCurve;
        this.isEndpoint = isEndpoint;
        this.contourIndex = contourIndex;
        this.index = index;
        this.px = x;
        this.py = y;
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
        this.visualUpdate();
    }
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.confirmPosition(this.x + mouseDeltaX, this.y + mouseDeltaY);
    }
    visualUpdate(){
        this.setPosition(this.px, this.py);
    }
    confirmPosition(x: number, y: number){
        this.x = x;
        this.y = y;
        this.px = x;
        this.py = y;
        this.setPosition(x, y);
    }
}
export function GlyphToSvgPathData(points: GlyphPoint[]){
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
export class DraggableGlyph extends FESVGGroup implements Draggable{
    x: number;
    y: number;
    px: number;
    py: number;
    selected: boolean;
    transform: Transform2d;
    index: number;
    private updateTransformData(){
        this.transform.e = this.px;
        this.transform.f = this.py;
        this.withAttributes({transform: this.transform.toSvgString()});
    }
    constructor(font: Font, glyphindex: number, transform: Transform2d){
        super(createSVGforGlyph(font, glyphindex));
        this.index = glyphindex;
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
class GuideLine extends FESVGLine{
    point: DraggableGlyphPoint;
    p1: DraggableGlyphPoint;
    p2: DraggableGlyphPoint;

    p1p: number;

    protected isEnabled: boolean;

    constructor(){
        super(0,0,0,0);
        this.withClass("guideline").withAttributes({visibility: "hidden"});
        this.isEnabled = false;
    }
}
export class OffCurvePointGuideLine extends GuideLine{
    visualUpdate(){
        this.setP1(this.point.px, this.point.py);
        this.setP2(this.p2.px, this.p2.py);
    }
    enable(point: DraggableGlyphPoint, p1: DraggableGlyphPoint, p2: DraggableGlyphPoint){
        let v1 = {x: p1.px - p2.px, y: p1.py - p2.py};
        let v2 = {x: point.px - p2.px, y: point.py - p2.py};
        let d = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
        let n = {x: v2.x / d, y: v2.y / d};
        if(d == 0){
            n = {x: 1, y: 0};
        }
        let distance = v1.x * -n.y + v1.y * n.x;
        if(Math.abs(distance) > 10){ 
            this.disable();
            return;
        }
        this.isEnabled = true;
        this.p1p = (d == 0)? 0: (v1.x * n.x + v1.y * n.y) / d;
        this.withAttributes({visibility: "visible"});
        this.point = point;
        this.p1 = p1;
        this.p2 = p2; 
        this.visualUpdate();
    }
    update(){
        if(this.isEnabled){
            this.p1.px = this.p2.px + this.p1p * (this.point.px - this.p2.px);
            this.p1.py = this.p2.py + this.p1p * (this.point.py - this.p2.py);
            this.visualUpdate();
            this.p1.visualUpdate();
        }
    }
    disable(){
        if(this.isEnabled){
            this.p1.confirmPosition(this.p1.px, this.p1.py);
            this.withAttributes({visibility: "hidden"});
            this.isEnabled = false;
        }
    }
}

export class OnCurvePointGuideLine extends GuideLine{
    visualUpdate(){
        this.setP1(this.p1.px, this.p1.py);
        this.setP2(this.p2.px, this.p2.py);
    }
    enable(point: DraggableGlyphPoint, p1: DraggableGlyphPoint, p2: DraggableGlyphPoint){
        let v1 = {x: p1.px - p2.px, y: p1.py - p2.py};
        let v2 = {x: point.px - p2.px, y: point.py - p2.py};
        let d = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        let n = {x: v1.x / d, y: v1.y / d};
        if(d == 0){
            n = {x: 1, y: 0};
        }
        let distance = v2.x * -n.y + v2.y * n.x;
        if(Math.abs(distance) > 10){ 
            this.disable();
            return;
        }
        this.isEnabled = true;
        this.p1p = (d == 0)? 0: (v1.x * n.x + v1.y * n.y) / d;
        this.withAttributes({visibility: "visible"});
        this.point = point;
        this.p1 = p1;
        this.p2 = p2; 
        this.visualUpdate();
    }
    update(){
        if(!this.isEnabled){
            return;
        }
        let v1 = {x: this.p1.px - this.p2.px, y: this.p1.py - this.p2.py};
        let v2 = {x: this.point.px - this.p2.px, y: this.point.py - this.p2.py};
        let d = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        let n = {x: v1.x / d, y: v1.y / d};
        if(d == 0){
            n = {x: 1, y: 0};
        }
        let distance = v2.x * n.x + v2.y * n.y;
        distance = Math.min(Math.max(distance, 0), d);
        this.point.px = this.p2.px + n.x * distance;
        this.point.py = this.p2.py + n.y * distance;
        this.point.visualUpdate();
        this.visualUpdate();
    }
    disable(){
        if(this.isEnabled){
            this.withAttributes({visibility: "hidden"});
            this.isEnabled = false;
        }
    }
}