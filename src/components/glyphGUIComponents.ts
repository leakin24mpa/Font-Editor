import { Font } from "../font/font.js";
import { GlyphPoint, SimpleGlyph } from "../font/fontReader.js";
import { Draggable } from "../lib/draggable.js";
import { FESVGPath, FESVGCircle, SVGFElement, GROUP, PATH, FESVGGroup } from "../lib/svgtools.js";
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