import { FEDragRegion, multiElement } from "../lib/domtools.js";
import { Draggable } from "../lib/draggable.js";
import { FEdiv } from "../lib/htmltools.js";
import { CIRCLE, GROUP, PATH, SVG, SVGCircle } from "../lib/svgtools.js";

function randomCoord(){
    return Math.random() * 100;
}


class DraggablePoint extends SVGCircle implements Draggable{
    x: number;
    y: number;
    constructor(x,y,radius ){
        super(x,y,radius);
        this.x = x;
        this.y = y;

    }
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.setPosition(mouseDeltaX + this.x, mouseDeltaY + this.y);
    }
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void {
        this.x += mouseDeltaX;
        this.y += mouseDeltaY;
        this.setPosition(this.x, this.y);
    }
}
export class FEpointPlot extends FEdiv{
    constructor(numPoints){
        let bezierPath = PATH("M 100 100 Q 200 200 300 100");
        let dragArea = new FEDragRegion(SVG().withClass("point-plot").withAttributes({viewBox: "0 0 400 400"}),
                    ...multiElement(numPoints, (i) => new DraggablePoint(randomCoord(), randomCoord(), 5).withClass("draggable-point")))

        super(
            dragArea.addChildren(bezierPath)
        )

        dragArea.onDragEnd = () => {
            let p = dragArea.getChildrenPositions();
            let data = `M ${p[0].x} ${p[0].y}`
            for(let i = 1; i < p.length; i+= 2){
                data += `Q ${p[i].x} ${p[i].y} ${p[i + 1].x} ${p[i + 1].y}`
            }
            bezierPath.setData(data);
        }
        this.withClass("point-plot-container");
    }
}