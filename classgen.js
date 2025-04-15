let tags = ["div", "button", "input", "p", "ul", "li", "a", "form"];

let classnames = tags.map((t) => "FE" + t);
let functions = tags.map((t) => t.toUpperCase());

for(var i in tags){
    let tag = tags[i];
    let name = classnames[i];
    let fn = functions[i];
    console.log(`
class ${name} extends FElement{constructor(...children: FElement[]){super("${tag}", ...children);}}
const ${fn} = (...children: FElement[]) => new ${name}(...children);`);
}
console.log(`export {${classnames.reduce((n1, n2) => n1 + ", " + n2)}}`);
console.log(`export {${functions.reduce((n1, n2) => n1 + ", " + n2)}}`);