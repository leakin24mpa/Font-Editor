import { FEcarousel } from "./components/carousel.js";
import { FEcounterlist } from "./components/counterList.js";
import { FEpointPlot } from "./components/draggablePointPlot.js";
import { createGlyphEditor, createSVGforGlyph, FEglyphDisplay, FEglyphEditor } from "./components/glyphEditor.js";
import { FEpinput } from "./components/Pinput.js";
import { FEgameInfoList } from "./components/publicGameList.js";
import { FEtreeView } from "./components/treeView.js";
import { Font } from "./font/font.js";
import { FontReader } from "./font/fontReader.js";
import { multiElement } from "./lib/domtools.js";
import { DIV, INPUT, P, SetDocumentContent } from "./lib/htmltools.js";
import { SVG } from "./lib/svgtools.js";

fetch("CascadiaMono-VariableFont_wght.ttf").then((response) => response.arrayBuffer().then((response) => loadPage(response)));

let loadPage = (fontfilebuffer: ArrayBuffer) => {
    let font = new Font(fontfilebuffer);
    let editor = DIV(
        createGlyphEditor(font, 184)
    );
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
        //...multiElement(200, (i) => createGlyphEditor(font, i)),
        editor,
        DIV(
            ...multiElement(
                font.maxp.numGlyphs, (i) => new FEglyphDisplay(font, i).withClass("glyph-display")
                .onEvent("click", () => {
                    editor.replaceContent(createGlyphEditor(font, i));
                })
            ),
        ).withClass("glyph-picker"),
        
        
        DIV(
            new FEtreeView("Cascadia Mono", {
                Directory: font.directory,
                Head: font.head,
                "Max Profile": font.maxp,
                "Horizontal Header": font.hhea,
                glyph0: font.glyphs[0]
            })
        ).withClass("font-data")

    )
}
