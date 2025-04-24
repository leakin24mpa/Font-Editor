import { BUTTON, DIV, FEdiv, INPUT, P, UL } from "../lib/htmltools.js";
class FEkeyValue extends FEdiv{
    constructor(key: string, object: any){
        let content;
        
        content = DIV().says(object);
        
        super(
            DIV().says(key).withClass("key"),
            content.withClass("value")
        )
        this.withClass("key-value");
    }
}
function createTreeView(key: string, object: any){
    if(typeof object == "object" && object){
        return new FEtreeView(key, object);
    }
    else{
        return new FEkeyValue(key, object);
    }
}
export class FEtreeView extends FEdiv{
    constructor(name: string, object: any){
        let content: FEdiv;
        
        let children = [
            
        ];
        for(var key in object){
            children.push(createTreeView(key, object[key]));
        }
        content = DIV(
            ...children
        ).withClass("subtree");
        let button = DIV().says(name).withClass("dropdown").onEvent("click", () => {
            content.toggleClass("active");
            button.toggleClass("active");
        });
        
        super(
            
            button,
            content
        )
        this.withClass("treeView");
    }
}