

export interface Draggable{
    x: number;
    y: number;
    visualx: number;
    visualy: number;
    duringDrag(mouseDeltaX: number, mouseDeltaY: number): void;
    completeDrag(mouseDeltaX: number, mouseDeltaY: number): void;
}
export class DragController{
    isDragging: boolean;
    selectedElement: Draggable;
    dragX: number;
    dragY: number;
    select(element: Draggable){
        this.selectedElement = element;
    }
    deselectAll(){
        this.selectedElement = null;
    }
    beginDrag(mousex: number, mousey: number){
        if(this.selectedElement){
            this.isDragging = true;
        }
        this.dragX = mousex;
        this.dragY = mousey;

    }
    updateDrag(mousex: number, mousey: number){
        if(this.selectedElement && this.isDragging){
            this.selectedElement.duringDrag(mousex - this.dragX, mousey - this.dragY);
            
        }
    }
    endDrag(mousex: number, mousey: number){
        if(this.selectedElement){
            this.selectedElement.completeDrag(mousex - this.dragX, mousey - this.dragY);
            this.selectedElement = null;
        }
        this.isDragging = false;
    }
}

