import { BUTTON, FEform, FEinput, P } from "../htmltools.js";

export class FEpindigit extends FEinput{
    constructor(){
        super();
        this.withAttributes({maxLength: 1, autoComplete: "off", pattern: "[0-9]", min: 0, max: 9, type: "number", inputmode: "numeric", required: true});
    }   
}

export class FEpinput extends FEform{
    constructor(numdigits: number, buttontext: string){
        let digits = [];
        let display = P().says("not input yet");

        for(let i = 0; i < numdigits; i++){
            digits.push(new FEpindigit());
        }
        for(let i = 0; i < numdigits; i++){
            let d = digits[i];
            d.onEvent("input", (e) => {
                if(d.element.value.length > 1){
                    d.element.value = d.element.value[1];
                }
                if(d.element.value.length > 0){
                    if(i < numdigits - 1){
                        digits[i + 1].element.focus();
                    }
                }
                else{
                    if(i > 0){
                        digits[i - 1].element.focus();
                    }
                }
            });
        }
        
        super(display, ...digits, BUTTON().says(buttontext));
        let getDigits = () => {
            let code = '';
            for(let i = 0; i < numdigits; i++){
                let d = digits[i].element.value;
                if(d.length == 1 && d.match(/[0-9]/)){
                    code += d; 
                }
                else{
                    return false;
                }
            }
            return code;
        }
        this.onEvent("submit", (e) => {e.preventDefault(); console.log(getDigits());});
    }
}