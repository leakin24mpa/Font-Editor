import { FEdiv } from "../htmltools.js";
import { CIRCLE, GROUP, SVG } from "../svgtools.js";

function randomCoord(){
    return Math.random() * 100;
}
export class FEpointPlot extends FEdiv{
    constructor(){
        super(
            SVG(
                GROUP(
                    CIRCLE(randomCoord(), randomCoord(), 5).withClass("draggable-point"),
                    CIRCLE(randomCoord(), randomCoord(), 5).withClass("draggable-point"),
                    CIRCLE(randomCoord(), randomCoord(), 5).withClass("draggable-point"),
                    CIRCLE(randomCoord(), randomCoord(), 5).withClass("draggable-point"),
                ).withClass("point-group")
            ).withClass("point-plot").withAttributes({viewBox: "0 0 100 100"})
        )
        this.withClass("point-plot-container");
    }
}