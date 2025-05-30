import { Font } from "../font/font.js";
import { CompoundGlyph, SimpleGlyph } from "../font/fontReader.js";
import { FEdragRegion, SVGboxResizer, SVGboxSelect } from "../lib/domtools.js";
import { FESVG, GROUP, PATH, SVGFElement, FESVGGroup, RECT, LINE } from "../lib/svgtools.js";
import { Transform2d, transformBounds } from "../lib/transformtools.js";
import { DraggableGlyphPoint, GlyphToSvgPathData, DraggableGlyph, createSVGforGlyph, SVGGlyphContour, OffCurvePointGuideLine, OnCurvePointGuideLine } from "./glyphGUIComponents.js";


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
    resizer: SVGboxResizer;
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
        this.controller.whileDragging.addResponse((x,y) => {
            this.resizer.updateShifted(x,y);
        });
        this.withClass("point-plot").withAttributes({viewBox: `0 0 1 1`});

        this.boxselect = new SVGboxSelect(this, canvas);
        
        this.emptyAction = this.boxselect;
        this.resizer = new SVGboxResizer(50, 50, 200, 200, 15);
    }
    loadSimpleGlyph(glyph: SimpleGlyph){
        let bezierPath = PATH("");
        let points = [];
        let contours = [];
        let currentContour = [];
        for(let i = 0; i < glyph.points.length; i++){
            let p = glyph.points[i];
            points.push(new DraggableGlyphPoint(p.px, p.py, p.isOnCurve, p.isImplied, p.isEndpoint, contours.length, currentContour.length));
            currentContour.push(i);
            if(p.isEndpoint){
                contours.push(currentContour);
                currentContour = [];
            }
        }
        contours = contours.map((c) => new SVGGlyphContour(points, c).withClass("glyph-contour"));
        contours.map((c) => {
            c.onEvent("mousedown", (e: MouseEvent) => {
                if(!e.shiftKey){
                    this.controller.deselectAll();
                }
                this.controller.multiselect(...c.indicies.map((i) => points[i]));
                
                this.startDrag(e);
                this.mouseOnEmpty = false;
            });
        })
        let guidelineP = new OffCurvePointGuideLine();
        let guidelineN = new OffCurvePointGuideLine();
        let guidelineO = new OnCurvePointGuideLine();
        this.canvas.replaceContent(
            bezierPath.withClass("character-outline"),
            GROUP(...contours),
            GROUP(guidelineO, guidelineP, guidelineN),
            GROUP(...points),
        )
        
        this.addDraggableChildren(...points);
        
        this.controller.whileDragging.addResponse(() => {
            if(this.controller.selectedElements.length == 1){
                guidelineP.update();
                guidelineN.update();
                guidelineO.update();
            }
            bezierPath.setData(GlyphToSvgPathData(points));
            contours.map((c) => c.update(points));
        });
        this.controller.whileDragging.fire(0,0);
        this.boxselect.onSelect.addResponse(() => {     
            this.controller.multiselect(...points.filter((p) => this.boxselect.contains(p.x, p.y)));
        });
        this.controller.onSelectionChange.addResponse(() => {
            this.resizer.selfDestruct();
            guidelineP.disable();
            guidelineN.disable();
            guidelineO.disable();
            if(this.controller.selectedElements.length == 0){
                return
            }
            else if(this.controller.selectedElements.length < 2){
                let point = this.controller.selectedElements[0] as DraggableGlyphPoint;
                let contour = contours[point.contourIndex];
                let p2 = contour.pointAtIndex(points, point.index - 2);
                let p1 = contour.pointAtIndex(points, point.index - 1);
                let n2 = contour.pointAtIndex(points, point.index + 2);
                let n1 = contour.pointAtIndex(points, point.index + 1);
                if(!point.isOnCurve){
                    
                    guidelineP.enable(point,p1, p2);
                    guidelineN.enable(point,n1, n2);
                }
                else{
                    guidelineO.enable(point, p1, n1);
                }
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
            this.canvas.addChildren(this.resizer);
            this.resizer.x = bounds.minx - 30;
            this.resizer.y = bounds.miny - 30;
            this.resizer.width = bounds.maxx - bounds.minx + 60;
            this.resizer.height = bounds.maxy - bounds.miny + 60;
            this.resizer.updateShifted(0,0);
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
        this.boxselect.onSelect.addResponse(() => {     
            this.controller.multiselect(...paths.filter((p) => this.element.checkIntersection(p.element, this.boxselect.collisionRect)));
        });
        this.controller.onSelectionChange.addResponse(() => {
            this.resizer.selfDestruct();
            if(this.controller.selectedElements.length < 1){
                return;
            }
            let bounds = {minx: Infinity, miny: Infinity, maxx: -Infinity, maxy: -Infinity}
            for(let i = paths.length - 1; i >= 0; i--){
                if(paths[i].selected){
                    let bbox = transformBounds(font.glyphs[paths[i].index].bounds, paths[i].transform);
                    console.log(bbox);
                    bounds.minx = Math.min(bbox.min.x, bounds.minx);
                    bounds.maxx = Math.max(bbox.max.x, bounds.maxx);
                    bounds.miny = Math.min(bbox.min.y, bounds.miny);
                    bounds.maxy = Math.max(bbox.max.y, bounds.maxy);
                }
            }
            this.canvas.addChildren(this.resizer);
            this.resizer.x = bounds.minx;
            this.resizer.y = bounds.miny;
            this.resizer.width = bounds.maxx - bounds.minx;
            this.resizer.height = bounds.maxy - bounds.miny;
            this.resizer.updateShifted(0,0);
        })
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
