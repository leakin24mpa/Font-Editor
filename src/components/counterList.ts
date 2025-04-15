import { BUTTON, FEli, FEp, FEul, P } from "../htmltools.js";

class FEcounter extends FEli{
    counter: number;
    constructor(){
        let display = P().says("counter value: 0");
        let incrementCounter = () => {
            this.counter++;
            display.says(`counter value: ${this.counter}`);
        }
        super(
            display,
            BUTTON().says("add one").onEvent("click", incrementCounter)
        );
        this.counter = 0;
    }

}

export class FEcounterlist extends FEul{
    constructor(numcounters){
        let counters = [];
        for(let i = 0; i < numcounters; i++){
            counters.push(new FEcounter());
        }
        super(...counters);
    }
}