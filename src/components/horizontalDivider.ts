import { DIV, FEdiv, FElement } from "../lib/htmltools.js";

function styleWidthString(percent: number, factor: number, noPointerEvents: boolean){
  return `width: 100%; height: calc(${percent} * (100% - ${factor}px)); ${noPointerEvents? "pointer-events: none;": ""}`
}
class DraggableDivider extends FEdiv{
  y: number;
  initialY: number;
  constructor(y: number, dividerWidth: number){
    super()
    this.withClass("divider").withAttributes({style: `height: ${dividerWidth}px; width: 100%`})
    this.y = y;
    this.initialY = y;
  }
}
export class FEhorizontallDivider extends FEdiv{
  
  constructor(dividerWidth: number, ...children: FElement[]){
    let mouseY;
    let selected = 0;
    let isDragging = false;

    let dividers = [];
    for(let i = 0; i < children.length - 1; i++){
      let divider = new DraggableDivider((i + 1) / children.length, dividerWidth);
      divider.onEvent("mousedown", (e) =>
      {
        divider.initialY = divider.y;
        selected = i;
        mouseY = e.clientY;
        isDragging = true;
      })
      dividers.push(divider);
    }
    let setDividerPosition = (i, y, mouseevents) => {
      
      let leftSide = (i == 0);
      let rightSide = (i == dividers.length - 1);
      let next = !rightSide? dividers[i + 1].y : 1;
      let prev = !leftSide? dividers[i - 1].y : 0;
      let percent = Math.min(Math.max(y, 0), 1);
      if(percent < prev && !leftSide){
        setDividerPosition(i-1,y, mouseevents);
      }
      if(percent > next && !rightSide){
        setDividerPosition(i+1,y, mouseevents);
      }

      let factor = dividers.length * dividerWidth;
      children[i].withAttributes({style: styleWidthString(percent - prev, factor, mouseevents)});
      children[i + 1].withAttributes({style: styleWidthString(next - percent, factor, mouseevents)});
      dividers[i].y = percent;
    }
    

    window.addEventListener("mousemove", (e) =>
    {
      if(isDragging){
        setDividerPosition(selected, dividers[selected].initialY + (e.clientY - mouseY) / this.element.clientHeight, true);
      }   
    });
    window.addEventListener("mouseup", (e) => {
      if(isDragging){
        isDragging = false;
        setDividerPosition(selected, dividers[selected].initialY + (e.clientY - mouseY) / this.element.clientHeight, false);
      }
      
    });
    
    super(
      children[0]
    );
    for(let i = 0; i < dividers.length; i++){
      this.addChildren(dividers[i], children[i+1]);
      setDividerPosition(i, dividers[i].y, false);
    }
    this.withClass("horizontal-divider");
  }
}