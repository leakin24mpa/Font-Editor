import { DragAction, DragController, Draggable } from "./draggable.js";
import { FEvent } from "./eventtools.js";
import { FElement } from "./htmltools.js";
import { FESVG, FESVGCircle, FESVGGroup, FESVGRect, RECT } from "./svgtools.js";

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
        filterCoordinates: Function;
        
        mouseOnEmpty: boolean;
        emptyAction: DragAction;
        private getCoords(e){
            let box = this.element.getBoundingClientRect();
            let x = e.clientX - box.left;
            let y = e.clientY - box.top;
            if(this.filterCoordinates){
                return this.filterCoordinates(x,y);
            }
            return {x: x, y: y};
        }
        private completeDrag(mousePosition){
            this.controller.endDrag(mousePosition.x, mousePosition.y);
            this.emptyAction.endDrag(mousePosition.x, mousePosition.y);
        }
        private updateDrag(mousePosition){
            this.controller.updateDrag(mousePosition.x, mousePosition.y);
            this.emptyAction.updateDrag(mousePosition.x, mousePosition.y);
        }
        private escapeDrag(){
            this.controller.escapeDrag();
            this.emptyAction.escapeDrag();
        }
        startDrag(e: MouseEvent){
            let fc = this.getCoords(e);
            this.controller.beginDrag(fc.x, fc.y);
        }
        constructor(...args: any){
            super(...args)
            this.controller = new DragController();
            this.controller.onSelect.addResponse((i) => i.withClass("selected"));
            this.controller.onDeselect.addResponse((i) => i.removeClass("selected"));

            window.addEventListener("mouseup", (e) => this.completeDrag(this.getCoords(e)))
            window.addEventListener("mousemove", (e) => this.updateDrag(this.getCoords(e)));
            window.addEventListener("keydown", (e: KeyboardEvent) => {
                if(e.key == "Escape"){
                    this.escapeDrag();
                }
            })
            this.mouseOnEmpty = true;

            this.emptyAction = new DragAction(() => {}, () => {}, () => {});

            this.onEvent("mousedown", (e: MouseEvent) => {
                if(this.mouseOnEmpty){
                    if(!e.shiftKey){
                        this.controller.deselectAll();
                    }
                    let coords = this.getCoords(e);
                    this.emptyAction.beginDrag(coords.x, coords.y);
                }
                this.mouseOnEmpty = true;
            });
            
        }
        addDraggableChildren(...children: DraggableFElement[]){
            for(var i in children){
                let child = children[i];
                child.onEvent("mousedown", (e: MouseEvent) =>{
                    this.mouseOnEmpty = false;
                    if(e.shiftKey){
                        this.controller.multiselect(child);
                    }
                    else{
                        this.controller.select(child);
                    }
                    this.startDrag(e);
                })
            }
        }
    }
}

export class SVGboxSelect extends DragAction{
    rect: FESVGRect;
    collisionRect: SVGRect;
    x1: number;
    y1: number;
    width: number;
    height: number; 
    onResize: FEvent;
    onSelect: FEvent;
    
    constructor(root: FESVG, canvas: FESVG | FESVGGroup){
        const create = (mouseX: number, mouseY: number) => {
            if(this.rect){
                this.rect.selfDestruct();
            }
            this.rect = RECT(mouseX, mouseY, 0,0).withClass("box-select");
            canvas.addChildren(this.rect);
            this.x1 = mouseX;
            this.y1 = mouseY;
        }
        const scale = (mouseX: number, mouseY: number) =>  {
            this.width = Math.abs(mouseX);
            this.height = Math.abs(mouseY);
            
            if(mouseX < 0){
                this.x1 = this.dragX + mouseX;
            }
            else{
                this.x1 = this.dragX;
            }

            if(mouseY < 0){
                this.y1 = this.dragY + mouseY;
            }
            else{
                this.y1 = this.dragY;
            }
            let htmlrect: DOMRect = this.rect.element.getBoundingClientRect();
            this.collisionRect.x = htmlrect.x;            
            this.collisionRect.y = htmlrect.y;
            this.collisionRect.width = htmlrect.width;
            this.collisionRect.height = htmlrect.height;
        
            this.rect.setPosition(this.x1, this.y1);
            this.rect.setSize(this.width, this.height);
            this.onResize.fire();
        }
        const finish = () => {
            this.rect.selfDestruct();
            this.onSelect.fire();
        }
        super(create, scale, finish);
        this.onResize = new FEvent();
        this.onSelect = new FEvent();
        this.collisionRect = root.element.createSVGRect();
    }
    contains(x: number, y: number){
        return x > this.x1 && y > this.y1 && x < this.x1 + this.width && y < this.y1 + this.height;
    }
}

class ResizerPoint extends FESVGCircle{
    xc: number;
    yc: number;
    constructor(radius: number, rx: number, ry: number){
        super(0, 0, radius);
        this.withClass("resizer-point");
        this.xc = rx;
        this.yc = ry;
        if(rx > 0){
            this.withClass("px");
        }
        if(rx < 0){
            this.withClass("mx");
        }
        if(ry > 0){
            this.withClass("py");
        }
        if(ry < 0){
            this.withClass("my");
        }
    }

}
export class SVGboxResizer extends FESVGGroup{
    dragX: number;
    dragY: number;

    x: number;
    y: number;
    width: number;
    height: number;
    update: Function;

    isDragging: boolean;
    dragElement: ResizerPoint;
    
    onBeginResize: FEvent;
    onResize: FEvent;
    onDoneResizing: FEvent;

    constructor(x: number, y: number, width: number, height: number, radius: number){
        let rect = RECT(x, y, width, height).withClass("resizer-rect");
        let points = [
            new ResizerPoint(radius, -1, -1),
            new ResizerPoint(radius, 1, -1),
            new ResizerPoint(radius, 1, 1),
            new ResizerPoint(radius, -1, 1),
            new ResizerPoint(radius, 0, -1),
            new ResizerPoint(radius, 1, 0),
            new ResizerPoint(radius, 0, 1),
            new ResizerPoint(radius, -1, 0),
            new ResizerPoint(radius, 0, 0).withClass("rotate")
        ]
        const update = (minOffsetX, minOffsetY, maxOffsetX, maxOffsetY) => {
            let x1 = this.x + minOffsetX;
            let y1 = this.y + minOffsetY;
            let x2 = this.x + this.width + maxOffsetX;
            let y2 = this.y + this.height + maxOffsetY;
            
            if(x2 < x1){
                let t = x2;
                x2 = x1;
                x1 = t;
            }
            if(y2 < y1){
                let t = y2;
                y2 = y1;
                y1 = t;
            }
            let my = (y1 + y2) / 2;
            let mx = (x1 + x2) / 2;

            points[0].setPosition(x1, y1);
            points[1].setPosition(x2, y1);
            points[2].setPosition(x2, y2);
            points[3].setPosition(x1, y2);
            points[4].setPosition(mx, y1);
            points[5].setPosition(x2, my);
            points[6].setPosition(mx, y2);
            points[7].setPosition(x1, my);
            points[8].setPosition(x2 + 1.5 * radius, y2 + 1.5 * radius);
            rect.setPosition(x1, y1);
            rect.setSize(x2 - x1, y2 - y1);
            
            this.element.style.visibility = (this.width < 0 || this.height < 0)? "hiddden": "visible";
        }
        super(
            rect,
            ...points
        )
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.update = update;
        this.updateShifted(0,0);
        points.map((p) => p.onEvent("click", (e: MouseEvent) => {
            this.dragElement = p;
            this.isDragging = true;
            this.dragX = e.offsetX;
            this.dragY = e.offsetY;
            this.onBeginResize.fire();
        }));
    }
    expandToContain(x: number, y: number){
        this.width = Math.max(this.width, x - this.x);
        this.height = Math.max(this.height, y - this.y);

        this.x = Math.min(this.x, x);
        this.y = Math.min(this.y, y);
    }
    updateShifted(x,y){
        this.update(x,y,x,y);
    }
    whileDragging(mouseDeltaX: number, mouseDeltaY: number){
        if(!this.isDragging){
            return;
        }
        if(this.dragElement.xc){
            mouseDeltaX = 0;
        }
        if(this.dragElement.yc){
            mouseDeltaY = 0;
        }
        
    }
    
}


