import { P } from "../lib/htmltools.js";
import {CharacterIndexMap, FontDirectory, FontReader, Glyph } from "./fontReader.js";

export class Font{
    directory: FontDirectory;
    head: any;
    maxp: any;
    hhea: any;
    loca: number[];
    cmap: CharacterIndexMap;
    glyphs: Glyph[];
    constructor(arraybuffer: ArrayBuffer){
        let reader = new FontReader(arraybuffer);
        let offsetSubtable = {
            scalerType: reader.readUint32(),
            numTables: reader.readUint16(),
            searchRange: reader.readUint16(),
            entrySelector: reader.readUint16(),
            rangeShift: reader.readUint16(),
        }
        let directory: FontDirectory = {}; //The directory contains info about what tables are in the font file
        for(let i = 0; i < offsetSubtable.numTables; i++){
            directory[reader.readString(4)] = { //read the name of the table
                sum: reader.readUint32(),  //the checksum for the table
                location: reader.readUint32(), //the byte index where the table is located
                length: reader.readUint32()  //the number of bytes in the table
            };
        }

        reader.goToTable(directory.head);
        console.log(reader.byteIdx);
       
        let head = { //the head table contains the main data about the font including version# and the max character sizes
            majorVersion: reader.readUint16(),
            minorVersion: reader.readUint16(),
            revision: reader.readFixed16_16(),
            checksumAdjustment: reader.readUint32(),
            magicNumber: reader.readUint32(),
            flags: reader.readUint16(),
            unitsPerEm: reader.readUint16(),
            created: reader.readFloat64(), //incorrect, should be int64
            modified: reader.readFloat64(), //incorrect, should be int64
            bounds: {
                min:{
                    x: reader.readInt16(),
                    y: reader.readInt16()
                },
                max:{
                    x: reader.readInt16(),
                    y: reader.readInt16()
                }
            }, 
            macStyle: reader.readUint16(),
            lowsetRecPPEM: reader.readUint16(),
            fontDirectionHint: reader.readInt16(),
            indexToLocFormat: reader.readInt16(),
            glyphDataFormat: reader.readInt16()
        };


        reader.goToTable(directory.maxp); 
        let maxp = { //the maxp table contains info about the upper limits of the font
            version: reader.readFixed16_16(),
            numGlyphs: reader.readUint16(),
            maxPoints: reader.readUint16(),
            maxContours: reader.readUint16(),
            maxComponentPoints: reader.readUint16(),
            maxComponentContours: reader.readUint16(),
            maxZones: reader.readUint16(),
            maxTwilightPoints: reader.readUint16(),
            maxStorage: reader.readUint16(),
            maxFunctionDefs: reader.readUint16(),
            maxInstructionDefs: reader.readUint16(),
            maxStackElements: reader.readUint16(),
            maxSizeOfInstructions: reader.readUint16(),
            maxComponentElements: reader.readUint16(),
            maxComponentDepth: reader.readUint16()
        }


        reader.goToTable(directory.hhea);
        let hhea = {
            version: reader.readFixed16_16(),
            ascent: reader.readInt16(),
            descent: reader.readInt16(),
            lineGap: reader.readInt16(),
            advanceWidthMax: reader.readUint16(),
            minLeftSideBearing: reader.readInt16(),
            minRightSideBearing: reader.readInt16(),
            xMaxExtent: reader.readInt16(),
            caretSlopeRise: reader.readInt16(),
            caretSlopeRun: reader.readInt16(),
            caretOffset: reader.readInt16(),
            reserved: [
                reader.readInt16(), 
                reader.readInt16(), 
                reader.readInt16(), 
                reader.readInt16()
            ],
            metricDataFormat: reader.readInt16(),
            numOfLongHorMetrics: reader.readUint16()
        }


        reader.goToTable(directory.loca);
        let loca = [];
        let isShortEntries = head.indexToLocFormat == 0;
        for(let i = 0; i < maxp.numGlyphs; i++){
            let offset;
            if(isShortEntries){
                offset = 2 * reader.readUint16();
            }
            else{
                offset = reader.readUint32();
            }
            loca.push(directory.glyf.location + offset);
        }

        reader.goToTable(directory.cmap);
        let cmapversion = reader.readUint16(),
            subtableCount = reader.readUint16();
        
        let subtables = [];
        for(let i = 0; i < subtableCount; i++){
            let table = {
                platformID: reader.readUint16(), 
                platformSpecificID: reader.readUint16(), 
                location: directory.cmap.location + reader.readUint32(), 
                map: null};
            subtables.push(table);
        }
        if(subtables.length == 0){
            throw new Error("The font does not have a unicode cmap table");
        }
        let validFormat = false;
        let cmapInfo;
        for(let i = 0; i < subtables.length; i++){
            reader.goTo(subtables[i].location);
            cmapInfo = {
                format: reader.readUint16(),
                length: reader.readUint16(),
                language: reader.readUint16()
            }
            
            if(cmapInfo.format == 4 || cmapInfo.format == 0){
                validFormat = true;
                break;
            }
        }
        if(!validFormat){
            throw new Error("The font uses an unsupported cmap encoding format ");
        }
        
        

        this.directory = directory;
        this.head = head;
        this.maxp = maxp;
        this.hhea = hhea;
        this.loca = loca;

        this.cmap = {};
        this.glyphs = [];
        for(let i = 0; i < maxp.numGlyphs; i++){
            reader.goTo(loca[i]);
            this.glyphs.push(reader.readGlyph());
        }

    }
}
