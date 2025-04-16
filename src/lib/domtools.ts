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

export function FEdragRegion<T extends new (...args: any) => FElement>(base: T) {
    return class FEdragRegion extends base {
        controller: DragController;
        draggables: DraggableFElement[];
        getChildrenPositions: Function;
        getVisualPositions: Function;
        onDragEnd: Function;
        whileDragging: Function;
        private completeDrag(mouseEvent){
            this.controller.endDrag(mouseEvent.offsetX, mouseEvent.offsetY);
            this.onDragEnd();
        }
        private updateDrag(mouseEvent){
            this.controller.updateDrag(mouseEvent.offsetX, mouseEvent.offsetY);
            this.whileDragging();
        }
        constructor(...args: any){
            super(...args)
            this.controller = new DragController();
            this.onDragEnd = () => {};
            this.whileDragging = () => {};
            this.onEvent("mouseup", (e) => this.completeDrag(e));
            this.onEvent("mouseleave", (e) => this.completeDrag(e));
            this.onEvent("mousemove", (e) => this.updateDrag(e));
            
        
        }
        addDraggableChildren(...children: DraggableFElement[]){
            for(var i in children){
                let child = children[i];
                child.onEvent("mousedown", (e) =>{
                    this.controller.select(child);
                    this.controller.beginDrag(e.offsetX, e.offsetY);
                })
            }
            this.getChildrenPositions = () => {
                return children.map((c) => {return {x: c.x, y: c.y}})
            }
            this.getVisualPositions = () => {
                return children.map((c) => {return {x: c.visualx, y: c.visualy}})
            }
        }
    }
}


