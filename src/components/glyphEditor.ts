import { Font } from "../font/font.js";
import { DIV, FEdiv } from "../lib/htmltools.js";
import { createGlyphEditor } from "./glyphCanvas.js";

export class FEglyphEditor extends FEdiv{
    constructor(font: Font, glyphindex: number){
        let charcode = font.cmap[glyphindex];
        super(
            DIV().withClass("glyph-info").says(`Editing ${String.fromCharCode(charcode)} (Unicode #${charcode})`),
            createGlyphEditor(font, glyphindex),
            DIV().says("")
        )
    }
    loadGlyph(font: Font, glyphindex: number){
        let charcode = font.cmap[glyphindex];
        this.replaceContent(
            DIV().withClass("glyph-info").says(`Editing ${String.fromCharCode(charcode)} (Unicode #${charcode})`),
            createGlyphEditor(font, glyphindex)
        )
    }
}