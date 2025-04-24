import { FEdiv, FElement } from "../lib/htmltools.js";

export class FEcarousel extends FEdiv{
    constructor(...children: FElement[]){
        super(...(children.map((c) => c.withClass("carousel-item"))))

    }
}