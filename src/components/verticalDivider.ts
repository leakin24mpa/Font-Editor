import { DIV, FEdiv, FElement } from "../lib/htmltools.js";

export class FEverticalDivider extends FEdiv{
  
  constructor(left: FElement, right: FElement){
    let mouseX;
    let percent = 50;
    let initialPercent = 50;
    let isDragging = false;

    let divider = DIV().withClass("divider");
    divider.onEvent("mousedown", (e) =>
    {
      mouseX = e.clientX;
      initialPercent = percent;
      isDragging = true
    })

    window.addEventListener("mousemove", (e) =>
    {
      if(isDragging){
        percent = initialPercent + (e.clientX - mouseX) / this.element.clientWidth * 100;
        percent = Math.min(Math.max(percent, 0), 100);
        left.withAttributes({style: `height: 100%; width: calc(${percent}% - 5px); pointer-events: none;`});
        right.withAttributes({style: `height: 100%; width: calc(${100 - percent}% - 5px); pointer-events: none;`});
      }   
    });
    window.addEventListener("mouseup", (e) => {
      if(isDragging){
        isDragging = false;
        left.withAttributes({style: `height: 100%; width: calc(${percent}% - 5px);`});
        right.withAttributes({style: `height: 100%; width: calc(${100 - percent}% - 5px);`});
      }
      
    });
    
    
    
    super(
      left.withAttributes({style: "height: 100%; width: calc(50% - 5px);"}),
      divider,
      right.withAttributes({style: "height: 100%; width: calc(50% - 5px);"}),
    )
    this.withClass("vertical-divider");
  }
}