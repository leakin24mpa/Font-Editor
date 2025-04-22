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
        filterCoordinates: Function;
        getChildrenPositions: Function;
        getVisualPositions: Function;
        onDragEnd: Function;
        whileDragging: Function;
        private getCoords(e){
            if(this.filterCoordinates){
                return this.filterCoordinates(e.offsetX,e.offsetY);
            }
            return {x: e.offsetX, y: e.offsetY};
        }
        private completeDrag(mousePosition){
            this.controller.endDrag(mousePosition.x, mousePosition.y);
            this.onDragEnd();
        }
        private updateDrag(mousePosition){
            this.controller.updateDrag(mousePosition.x, mousePosition.y);
            this.whileDragging();
        }
        constructor(...args: any){
            super(...args)
            this.controller = new DragController();
            this.onDragEnd = () => {};
            this.whileDragging = () => {};
            this.onEvent("mouseup", (e) => this.completeDrag(this.getCoords(e)));
            this.onEvent("mouseleave", (e) => this.completeDrag(this.getCoords(e)));
            this.onEvent("mousemove", (e) => this.updateDrag(this.getCoords(e)));
            
        
        }
        addDraggableChildren(...children: DraggableFElement[]){
            for(var i in children){
                let child = children[i];
                child.onEvent("mousedown", (e) =>{
                    this.controller.select(child);
                    let fc = this.getCoords(e);
                    this.controller.beginDrag(fc.x, fc.y);
                })
            }
            this.getChildrenPositions = () => {
                return children.map((c) => {return {x: c.x, y: c.y}})
            }
            this.getVisualPositions = () => {
                return children.map((c) => {return {x: c.px, y: c.py}})
            }
        }
    }
}


