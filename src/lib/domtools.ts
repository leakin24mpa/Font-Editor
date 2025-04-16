import { DragController, Draggable } from "./draggable.js";
import { FElement } from "./htmltools.js";

export function multiElement(n: number, generator: Function){
    let elements = [];
    for(let i = 0; i < n; i++){
        elements.push(generator(i));
    }
    return elements;
}
export type DraggableFElement = Draggable & FElement;

export class FEDragRegion extends FElement{
    controller: DragController;
    constructor(element: FElement, ...children: DraggableFElement[]){
        super(element.element, ...children);
        this.controller = new DragController();

        this.onEvent("mouseup", (e) => this.controller.endDrag(e.offsetX, e.offsetY));
        this.onEvent("mouseleave", (e) => this.controller.endDrag(e.offsetX, e.offsetY));
        this.onEvent("mousemove", (e) => this.controller.updateDrag(e.offsetX, e.offsetY));
        

        for(var i in children){
            let child = children[i];
            child.onEvent("mousedown", (e) =>{
                this.controller.select(child);
                this.controller.beginDrag(e.offsetX, e.offsetY);
            })
        }
    }
}