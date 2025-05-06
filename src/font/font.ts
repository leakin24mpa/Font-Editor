import { P } from "../lib/htmltools.js";
import {CharacterIndexMap, FontDirectory, FontReader, Glyph, nameIDs } from "./fontReader.js";

export class Font{
    directory: FontDirectory;
    head: any;
    maxp: any;
    hhea: any;
    loca: number[];
    name: any;
    cmapInfo: any;
    cmap: any;
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
            created: reader.readLongDateTime(), 
            modified: reader.readLongDateTime(), 
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
        let subtableIndex;
        let cmapInfo;
        for(let i = 0; i < subtables.length; i++){
            reader.goTo(subtables[i].location);
            cmapInfo = {
                format: reader.readUint16(),
                length: reader.readUint16(),
                language: reader.readUint16()
            }
            
            if(cmapInfo.format == 4){
                validFormat = true;
                subtableIndex = i;
                break;
            }
        }
        if(!validFormat){
            throw new Error("The font uses an unsupported cmap encoding format ");
        }

        let cmap = [];
        if(cmapInfo.format == 4){
            reader.goTo(subtables[subtableIndex].location);
            reader.skipForward(6);
            
            cmapInfo.segCount = reader.readUint16() / 2;
            cmapInfo.searchRange = reader.readUint16();
            cmapInfo.entrySelector = reader.readUint16();
            cmapInfo.rangeShift = reader.readUint16();
            cmapInfo.endCode = reader.readUint16();
            
            cmapInfo.segments = [];
            for(let i = 0; i < cmapInfo.segCount; i++){
                cmapInfo.segments.push({
                    endCode: reader.readUint16() });
            }
            cmapInfo.reservedPad = reader.readUint16();
            for(let i = 0; i < cmapInfo.segCount; i++){
                cmapInfo.segments[i].startCode = reader.readUint16();
            }
            for(let i = 0; i < cmapInfo.segCount; i++){
                cmapInfo.segments[i].idDelta = reader.readUint16();
            }
            cmapInfo.rangeTableIndex = reader.byteIdx;
            for(let i = 0; i < cmapInfo.segCount; i++){
                
                cmapInfo.segments[i].idRangeOffset = reader.readUint16();

            }

            for(let i = 0; i < cmapInfo.segCount; i++){
                let seg = cmapInfo.segments[i];
                for(let ci = seg.startCode; ci <= seg.endCode; ci++){
                    if(seg.idRangeOffset == 0){
                        cmap[(ci + seg.idDelta) % 65536] = ci;
                    }
                    else{
                        let charindexindex = seg.idRangeOffset + 2 * (ci - seg.startCode)+ cmapInfo.rangeTableIndex + i * 2;
                        
                        reader.goTo(charindexindex);
                        let idx = reader.readUint16();
                        if(idx != 0){
                            idx = (idx + seg.idDelta) % 65536
                        }
                        cmap[idx] = ci;
                    }
                    
                    
                }
                
            }
        }

        reader.goToTable(directory.name);
        let name = {
            format: reader.readUint16(),
            count: reader.readUint16(),
            stringOffset: reader.readUint16(),
            records: []
        }
        for(let i = 0; i < name.count; i++){
            name.records.push({
                platformID: reader.readUint16(),
                platformSpecificID: reader.readUint16(),
                languageID: reader.readUint16(),
                nameID: reader.readUint16(),
                length: reader.readUint16(),
                offset: reader.readUint16(),

            })
        }
        let stringpostion = directory.name.location + name.stringOffset;
        let fontInfo = {};
        for(var i in name.records){
            reader.goTo(stringpostion);
            reader.skipForward(name.records[i].offset);
            if(name.records[i].platformSpecificID == 1 && name.records[i].languageID == 1033){
                let text = reader.readString(name.records[i].length);
                fontInfo[nameIDs[name.records[i].nameID]] = text;
            }
            
        }
        
        

        this.directory = directory;
        this.head = head;
        this.maxp = maxp;
        this.hhea = hhea;
        this.loca = loca;
        this.name = fontInfo;
        this.cmapInfo = cmapInfo;
        this.cmap = cmap;
        this.glyphs = [];
        for(let i = 0; i < maxp.numGlyphs; i++){
            reader.goTo(loca[i]);
            this.glyphs.push(reader.readGlyph());
        }

    }
}
