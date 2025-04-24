import { FEcarousel } from "./components/carousel.js";
import { FEcounterlist } from "./components/counterList.js";
import { FEpointPlot } from "./components/draggablePointPlot.js";
import { createGlyphEditor, FEglyphEditor } from "./components/glyphEditor.js";
import { FEpinput } from "./components/Pinput.js";
import { FEgameInfoList } from "./components/publicGameList.js";
import { Font } from "./font/font.js";
import { FontReader } from "./font/fontReader.js";
import { multiElement } from "./lib/domtools.js";
import { DIV, INPUT, P, SetDocumentContent } from "./lib/htmltools.js";

fetch("Georgia Bold.ttf").then((response) => response.arrayBuffer().then((response) => loadPage(response)));

let loadPage = (fontfilebuffer: ArrayBuffer) => {
    let font = new Font(fontfilebuffer);
    console.log(font);
    SetDocumentContent(
        // DIV(
        //     P().says("hello world")
        // ),
        // new FEgameInfoList({name: "Public Game", hostname: "Bot", playersOnline: 2, code: 8355059}, 
        //                 {name: "Public Game II", hostname: "not bot", playersOnline: 69, code: 8355059}),
        // new FEcounterlist(4),
        // new FEpinput(6, "Join"),
        // INPUT().withAttributes({type: "checkbox"}),
        ...multiElement(200, (i) => createGlyphEditor(font, i)),
        

    )
}
