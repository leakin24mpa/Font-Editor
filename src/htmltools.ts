export class FElement{
    element;
    constructor(type: string | HTMLElement, ...children: FElement[]){
        if(typeof type === 'string' || type instanceof String){
            this.element = document.createElement(type as string);
        }
        else{
            this.element = type;
        }
        
        for(var i in children){
            this.element.appendChild(children[i].element);
        }
        return this;
    }
    withAttributes(attributes){
        for(var attribute in attributes){
            this.element.setAttribute(attribute, attributes[attribute]);
        }
        return this;
    }
    id(id: string){
        this.element.id = id;
        return this;
    }
    withClass(classname: string){
        this.element.classList.add(classname);
        return this;
    }
    removeClass(classname: string){
        this.element.classList.remove(classname);
        return this;
    }
    says(innerHTML: string){
        this.element.textContent = innerHTML;
        return this;
    }
    replaceContent(...children: FElement[]){
        this.element.replaceChildren();
        for(var i in children){
            this.element.appendChild(children[i].element);
        }
        return this;
    }
    onEvent(eventName: string, callback){
        this.element.addEventListener(eventName, callback);
        return this;
    }
    addChildren(...children: FElement[]){
        for(var i in children){
            this.element.appendChild(children[i].element);
        }
    }
}

export function ElementByID(id: string){
    let e = document.getElementById(id);
    if(e){
        return new FElement(e);
    }
    else{
        throw new Error("Could not find an element with id \"" + id + "\".");
    }
}

export function SetDocumentContent(...children: FElement[]){
    document.body.replaceChildren();
    for(var i in children){
        document.body.appendChild(children[i].element);
    }
}

class FEdiv extends FElement{constructor(...children: FElement[]){super("div", ...children);}}
const DIV = (...children: FElement[]) => new FEdiv(...children);

class FEbutton extends FElement{constructor(...children: FElement[]){super("button", ...children);}}
const BUTTON = (...children: FElement[]) => new FEbutton(...children);

class FEinput extends FElement{constructor(...children: FElement[]){super("input", ...children);}}
const INPUT = (...children: FElement[]) => new FEinput(...children);

class FEp extends FElement{constructor(...children: FElement[]){super("p", ...children);}}
const P = (...children: FElement[]) => new FEp(...children);

class FEul extends FElement{constructor(...children: FElement[]){super("ul", ...children);}}
const UL = (...children: FElement[]) => new FEul(...children);

class FEli extends FElement{constructor(...children: FElement[]){super("li", ...children);}}
const LI = (...children: FElement[]) => new FEli(...children);

class FEa extends FElement{constructor(...children: FElement[]){super("a", ...children);}}
const A = (...children: FElement[]) => new FEa(...children);

class FEform extends FElement{constructor(...children: FElement[]){super("form", ...children);}}
const FORM = (...children: FElement[]) => new FEa(...children);
export {FEdiv, FEbutton, FEinput, FEp, FEul, FEli, FEa, FEform}
export {DIV, BUTTON, INPUT, P, UL, LI, A, FORM}


