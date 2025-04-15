import { FElement } from "./htmltools.js";

const ns =  "http://www.w3.org/2000/svg";
export class SVGElement extends FElement{
    constructor(type: string){
        super(null);
        this.element = document.createElementNS(ns, type);

    }
}
export class FESVG extends FElement{
    constructor(...children: SVGElement[]){
        super(null);
        this.element = document.createElementNS(ns, "svg");
        for(var i in children){
            this.element.appendChild(children[i].element);
        }
    }
}
export const SVG = (...children: SVGElement[]) => new FESVG(...children);

export class SVGGroup extends SVGElement{
    constructor(...children: SVGElement[]){
        super("g");
        for(var i in children){
            this.element.appendChild(children[i].element);
        }
    }
}
export const GROUP = (...children: SVGElement[]) => new SVGGroup(...children);

export class SVGCircle extends SVGElement{
    constructor(x: number, y: number, radius: number){
        super("circle");
        this.withAttributes({cx: x, cy: y, r: radius})
    }
    setPosition(x: number,y: number){
        this.withAttributes({cx: x, cy: y});
    }
}
export const CIRCLE = (x: number, y: number, radius: number) => new SVGCircle(x,y,radius);


export class SVGLine extends SVGElement{
    constructor(x1: number, y1: number, x2: number, y2: number){
        super("line");
        this.withAttributes({x1: x1,y1: y1,x2: x2,y2: y2});
    }
    setP1(x: number, y: number){
        this.withAttributes({x1: x,y1: y});
    }
    setP2(x: number, y: number){
        this.withAttributes({x2: x,y2: y});
    }
}
export const LINE = (x1: number, y1: number, x2: number, y2: number) => new SVGLine(x1,y1,x2,y2);

export class SVGPath extends SVGElement{
    constructor(data: string){
        super("path");
        this.withAttributes({d: data});
    }
    setData(data: string){
        this.withAttributes({d: data});
    }
}
export const PATH = (data: string) => new SVGPath(data);