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
    getChildrenPositions: Function;
    onDragEnd: Function;
    private completeDrag(mouseEvent){
        this.controller.endDrag(mouseEvent.offsetX, mouseEvent.offsetY);
        this.onDragEnd();
    }
    constructor(element: FElement, ...children: DraggableFElement[]){
        super(element.element, ...children);
        this.controller = new DragController();
        this.onDragEnd = () => {};
        this.onEvent("mouseup", (e) => this.completeDrag(e));
        this.onEvent("mouseleave", (e) => this.completeDrag(e));
        this.onEvent("mousemove", (e) => this.controller.updateDrag(e.offsetX, e.offsetY));
        
        this.getChildrenPositions = () => {
            return children.map((c) => {return {x: c.x, y: c.y}})
        }

        for(var i in children){
            let child = children[i];
            child.onEvent("mousedown", (e) =>{
                this.controller.select(child);
                this.controller.beginDrag(e.offsetX, e.offsetY);
            })
        }
    }
    addDraggableChildren(...children: DraggableFElement[]){
        this.addChildren(...children);
        for(var i in children){
            let child = children[i];
            child.onEvent("mousedown", (e) =>{
                this.controller.select(child);
                this.controller.beginDrag(e.offsetX, e.offsetY);
            })
        }
    }
}