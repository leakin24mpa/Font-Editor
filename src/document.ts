import { FEcarousel } from "./components/carousel.js";
import { FEcounterlist } from "./components/counterList.js";
import { FEpointPlot } from "./components/draggablePointPlot.js";
import { createGlyphEditor, createSVGforGlyph, FEglyphDisplay, FEsimpleGlyphEditor } from "./components/glyphCanvas.js";
import { FEglyphEditor } from "./components/glyphEditor.js";
import { FEpinput } from "./components/Pinput.js";
import { FEgameInfoList } from "./components/publicGameList.js";
import { FEtreeView } from "./components/treeView.js";
import { FEverticalDivider } from "./components/verticalDivider.js";
import { Font } from "./font/font.js";
import { FontReader } from "./font/fontReader.js";
import { fontTableReader, offsetSubtable } from "./font/fontTableReader.js";
import { multiElement } from "./lib/domtools.js";
import { DIV, INPUT, P, SetDocumentContent } from "./lib/htmltools.js";
import { SVG } from "./lib/svgtools.js";

fetch("Comic Sans MS Bold.ttf").then((response) => response.arrayBuffer().then((response) => loadPage(response)));

let loadPage = (fontfilebuffer: ArrayBuffer) => {
    let font = new Font(fontfilebuffer);

    let reader = new fontTableReader(fontfilebuffer);
    console.log(reader.readTable(offsetSubtable));

    let editor = new FEglyphEditor(font, 184);
    SetDocumentContent(
        new FEverticalDivider(
            editor,
            DIV(
                ...multiElement(
                    font.maxp.numGlyphs, (i) => new FEglyphDisplay(font, i).withClass("glyph-display")
                    .onEvent("click", () => {
                        editor.loadGlyph(font, i);
                    })
                ),
            ).withClass("glyph-picker"),
        ),
        
        
        
        DIV(
            new FEtreeView(font.name["Full Name"], {
                "Directory": font.directory,
                "Head": font.head,
                "Max Profile": font.maxp,
                "Horizontal Header": font.hhea,
                "Cmap Info": font.cmapInfo,
                "Character Map": font.cmap,
                "name": font.name
            })
        ).withClass("font-data")

    )
}
