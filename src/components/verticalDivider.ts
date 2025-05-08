import { DIV, FEdiv, FElement } from "../lib/htmltools.js";

function styleWidthString(dividerWidth: string, percent: number, noPointerEvents: boolean){
  return `height: 100%; width: calc(${percent}% - 0.5 * ${dividerWidth}); ${noPointerEvents? "pointer-events: none;": ""}`
}
export class FEverticalDivider extends FEdiv{
  
  constructor(dividerWidth: string, left: FElement, right: FElement){
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
        left.withAttributes({style: styleWidthString(dividerWidth, percent, true)});
        right.withAttributes({style: styleWidthString(dividerWidth, 100 - percent, true)});
      }   
    });
    window.addEventListener("mouseup", (e) => {
      if(isDragging){
        isDragging = false;
        left.withAttributes({style: styleWidthString(dividerWidth, percent, false)});
        right.withAttributes({style: styleWidthString(dividerWidth, 100 - percent, false)});
      }
      
    });
    
    
    
    super(
      left.withAttributes({style: styleWidthString(dividerWidth, percent, false)}),
      divider.withAttributes({style: `width: ${dividerWidth}; height: 100%`}),
      right.withAttributes({style: styleWidthString(dividerWidth, percent, false)}),
    );
    this.withClass("vertical-divider");
  }
}