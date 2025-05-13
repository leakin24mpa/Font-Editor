import { FEglyphDisplay } from "./components/glyphCanvas.js";
import { FEglyphEditor } from "./components/glyphEditor.js";
import { FEhorizontallDivider } from "./components/horizontalDivider.js";
import { FEtreeView } from "./components/treeView.js";
import { FEverticalDivider } from "./components/verticalDivider.js";
import { Font } from "./font/font.js";
import { fontTableReader, offsetSubtable } from "./font/fontTableReader.js";
import { multiElement } from "./lib/domtools.js";
import { DIV, SetDocumentContent } from "./lib/htmltools.js";


fetch("CascadiaMono-VariableFont_wght.ttf").then((response) => response.arrayBuffer().then((response) => loadPage(response)));

let loadPage = (fontfilebuffer: ArrayBuffer) => {
    let font = new Font(fontfilebuffer);

    let reader = new fontTableReader(fontfilebuffer);
    console.log(reader.readTable(offsetSubtable));

    let editor = new FEglyphEditor(font, 184);

    SetDocumentContent(
        new FEverticalDivider(
            10,
            new FEhorizontallDivider(
                10,
                editor,
                DIV().says("hello world")
            ),
            
            DIV(
                ...multiElement(
                    font.maxp.numGlyphs, (i) => new FEglyphDisplay(font, i).withClass("glyph-display")
                    .onEvent("click", () => {
                        editor.loadGlyph(font, i);

                    })
                ),
            ).withClass("glyph-picker"),
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
        ),
        
        
        
        

    )
}
