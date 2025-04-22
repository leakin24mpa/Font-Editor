import { FEcounterlist } from "./components/counterList.js";
import { FEpointPlot } from "./components/draggablePointPlot.js";
import { createGlyphEditor, FEglyphEditor } from "./components/glyphEditor.js";
import { FEpinput } from "./components/Pinput.js";
import { FEgameInfoList } from "./components/publicGameList.js";
import { FontReader } from "./font/fontReader.js";
import { multiElement } from "./lib/domtools.js";
import { DIV, INPUT, P, SetDocumentContent } from "./lib/htmltools.js";

fetch("Georgia Bold.ttf").then((response) => response.arrayBuffer().then((response) => loadPage(response)));

let loadPage = (fontfilebuffer: ArrayBuffer) => {
    let reader = new FontReader(fontfilebuffer);

    console.log(reader.directory);
    console.log(reader.cmapdirectory);

    reader.goTo(reader.directory["glyf"].location);
    SetDocumentContent(
        // DIV(
        //     P().says("hello world")
        // ),
        // new FEgameInfoList({name: "Public Game", hostname: "Bot", playersOnline: 2, code: 8355059}, 
        //                 {name: "Public Game II", hostname: "not bot", playersOnline: 69, code: 8355059}),
        // new FEcounterlist(4),
        // new FEpinput(6, "Join"),
        // INPUT().withAttributes({type: "checkbox"}),
        ...multiElement(200, (i) => createGlyphEditor(reader, reader.readGlyph(i))),
        

    )
}