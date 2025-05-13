import { FEvent } from "./eventtools.js";


export interface Draggable{
    x: number;
    y: number;
    px: number;
    py: number;
    selected: boolean;
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void;
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void;
}
export class DragController{
    isDragging: boolean;
    selectedElements: Draggable[];
    dragX: number;
    dragY: number;

    onSelect: FEvent;
    onDeselect: FEvent;

    onSelectionChange: FEvent;
    onDragStart: FEvent;
    onDragEnd: FEvent;
    whileDragging: FEvent;

    select(element: Draggable){
        if(!element.selected){
            this.deselectAll();
            this.multiselect(element);
        }
        this.onSelectionChange.fire(this.selectedElements);
    }
    multiselect(...elements: Draggable[]){
        for(var i in elements){
            if(!elements[i].selected){
                this.selectedElements.push(elements[i]);
                elements[i].selected = true;
                this.onSelect.fire(elements[i]);
            }
        }
        this.onSelectionChange.fire(this.selectedElements);
    }
    deselect(element: Draggable){
        let index = this.selectedElements.indexOf(element);
        if(index >= 0){
            element.selected = false;
            this.selectedElements.splice(index, 1);
            this.onDeselect.fire(element);
        }
        this.onSelectionChange.fire(this.selectedElements);
    }
    deselectAll(){
        for(let i = 0; i < this.selectedElements.length; i++){
            this.onDeselect.fire(this.selectedElements[i]);
            this.selectedElements[i].selected = false;
        }
        this.selectedElements = [];
        this.onSelectionChange.fire(this.selectedElements);
    }
    beginDrag(mousex: number, mousey: number){
        if(this.selectedElements.length > 0){
            this.isDragging = true;
            this.dragX = mousex;
            this.dragY = mousey;
            this.onDragStart.fire();
        }
    }
    updateDrag(mousex: number, mousey: number){
        if(this.isDragging){
            for(let i = 0; i < this.selectedElements.length; i++){
                this.selectedElements[i].duringDrag(mousex - this.dragX, mousey - this.dragY);
            }
            this.whileDragging.fire();
        }
        
    }
    endDrag(mousex: number, mousey: number){
        if(this.isDragging){
            for(let i = 0; i < this.selectedElements.length; i++){
                this.selectedElements[i].completeDrag(mousex - this.dragX, mousey - this.dragY);
            }
            this.whileDragging.fire();
            this.isDragging = false;
            this.onDragEnd.fire();
        } 
    }
    escapeDrag(){
        if(this.isDragging){
            
            for(let i = 0; i < this.selectedElements.length; i++){
                this.selectedElements[i].completeDrag(0,0);
            }
            this.whileDragging.fire();
            this.isDragging = false;
            this.onDragEnd.fire();
        }
    }
    constructor(){
        this.selectedElements = [];
        this.onDeselect = new FEvent();
        this.onSelect = new FEvent();
        this.onDragStart = new FEvent();
        this.onDragEnd = new FEvent();
        this.whileDragging = new FEvent();
        this.onSelectionChange = new FEvent();
    }
}
export class DragAction{
    onBeginDrag: FEvent;
    onDragUpdate: FEvent;
    onEndDrag: FEvent;

    dragX: number;
    dragY: number;
    isDragging: boolean;
    constructor(beginning: Function, middle: Function, end: Function){
        this.onBeginDrag = new FEvent(beginning);
        this.onDragUpdate = new FEvent(middle);
        this.onEndDrag = new FEvent(end);
        this.isDragging = false;
    }
    beginDrag(mouseX: number, mouseY: number){
        this.dragX = mouseX;
        this.dragY = mouseY;
        this.onBeginDrag.fire(mouseX, mouseY);
        this.isDragging = true;
    }
    updateDrag(mouseX: number, mouseY: number){
        if(this.isDragging){
            this.onDragUpdate.fire(mouseX - this.dragX, mouseY - this.dragY);
        }
    }
    endDrag(mouseX: number, mouseY: number){
        if(this.isDragging){
            this.onDragUpdate.fire(mouseX - this.dragX, mouseY - this.dragY);
            this.onEndDrag.fire(mouseX - this.dragX, mouseY - this.dragY);
            this.isDragging = false;
        }
    }
    escapeDrag(){
        if(this.isDragging){
            this.onEndDrag.fire(0,0);
            this.isDragging = false;
        }
    }
}

