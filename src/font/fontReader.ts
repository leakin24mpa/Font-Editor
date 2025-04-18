

function isBitSet(flag: number, index: number): boolean{
    return ((flag >> index & 1) == 1)
}
class BinaryReader{
    dataview: DataView;
    byteIdx: number;
    constructor(arraybuffer: ArrayBuffer){
        this.dataview = new DataView(arraybuffer);
        this.byteIdx = 0;
    }
    readByte(){
        return this.dataview.getUint8(this.byteIdx++);
    }
    readUint16(){
        this.byteIdx += 2;
        return this.dataview.getUint16(this.byteIdx - 2, false);
    }
    readInt16(){
        this.byteIdx += 2;
        return this.dataview.getInt16(this.byteIdx - 2, false);
    }
    readUint32(){
        this.byteIdx += 4;
        return this.dataview.getUint32(this.byteIdx - 4, false);
    }
    readString(length){
        let str = "";
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(this.readByte());
        }
        return str;
    }
    goTo(byte){
        this.byteIdx = byte;
    }
    skipForward(bytes){
        this.byteIdx += bytes;
    }
}
interface FontTableInfo{
    tag: string;
    sum: number;
    location: number;
    length: number;
}
type FontDirectory = {
    [tag: string]: FontTableInfo;
}

type CMapDirectory = {
    [id: number]: {pid: number, psid: number, offset: number, map: FontCharMap}
}
interface FontCharMap{
    format: number;
    length: number;
    language: number;
}

interface GlyphPoint{
    x: number;
    y: number;
    isOnCurve: boolean;
    isImplied: boolean;
    isEndpoint: boolean;
}
interface GlyphData{
    xCoordinates: number[];
    yCoordinates: number[];
    flags: number[];
}
export interface Glyph{
    isCompound: false;
    bounds: {min: {x: number; y: number;}; max: {x: number; y: number;};}
    pointCount: number;
    contourCount: number;
    points: GlyphPoint[];
}
export interface CompoundGlyph{
    isCompound: true;
    bounds: {min: {x: number; y: number;}; max: {x: number; y: number;};};
    components: {index: number, transformation: {a: number, b: number, c: number, d: number, e: number, f: number}}[];

}
export class FontReader extends BinaryReader{
    directory: FontDirectory;
    cmapdirectory: CMapDirectory;
    glyphLocations: number[];
    constructor(arraybuffer: ArrayBuffer){
        super(arraybuffer)
        this.goTo(4);
        let tableCount = this.readUint16();
        this.skipForward(6);
        this.directory = {};
        for(let i = 0; i < tableCount; i++){
            let tag = this.readString(4);
            let sum = this.readUint32();
            let location = this.readUint32();
            let length = this.readUint32();

            this.directory[tag] = {tag: tag, sum: sum, location: location, length: length};
        }
        this.prepareCmap();
        this.createGlyphMap();
    }
    verifyEntry(tag){
        let entry = this.directory[tag];
        this.goTo(entry.location);
        let sum = 0;
        for(let i = 0; i < ((entry.length + 3) & ~3); i += 4){
            sum = (sum + this.readUint32()) >>> 0;
        }
        console.log(`verifying entry "${tag}", expected sum: ${entry.sum}, calculated sum: ${sum}`);
    }
    prepareCmap(){
        let entry = this.directory["cmap"];
        this.goTo(entry.location);
        this.readUint16()
        let subtableCount = this.readUint16();
        this.cmapdirectory = {};

        for(let i = 0; i < subtableCount; i++){
            let platformId = this.readUint16();
            let platformSpecificID = this.readUint16();
            let offset = this.readUint32();
            this.cmapdirectory[i] = {pid: platformId, psid: platformSpecificID, offset: offset, map: null};
        }
        for(var i in this.cmapdirectory){
            this.goTo(entry.location + this.cmapdirectory[i].offset);
            let format = this.readUint16();
            let length = this.readUint16();
            let language = this.readUint16();
            let map: FontCharMap = {format: format, length: length, language: language}
            this.cmapdirectory[i].map = map;
        }
    }
    readGlyph(index: number): Glyph | CompoundGlyph{
        this.goTo(this.glyphLocations[index]);
        let nContours = this.readInt16();
        console.log("contour-count: " + nContours);
        let isCompound = nContours < 0;
        if(isCompound){
            console.log("compound glyph!");
            nContours *= -1;
        }

        let xMin = this.readInt16();
        let yMin = this.readInt16();
        let xMax = this.readInt16();
        let yMax = this.readInt16();
        let bounds = {min: {x: xMin, y: yMin}, max: {x: xMax, y: yMax}};
        console.log(`bounds: minimum - (${xMin}, ${yMin})  maximum - (${xMax}, ${yMax})`);

        if(isCompound){
            return this.readCompoundGlyph(bounds);
        }
        else{
            return this.readSimpleGlyph(nContours, bounds);
        }

        
    }
    readCompoundGlyph(bounds): CompoundGlyph{
        let moreToRead = true;
        let nComponents = 0;
        while(moreToRead){
            nComponents++;
            let flag = this.readUint16();
            moreToRead = isBitSet(flag, 5);
            let index = this.readUint16();
            let hasScale = isBitSet(flag, 3);
            let hasXYscale = isBitSet(flag, 6);
            let has2x2 = isBitSet(flag, 7);
            
        }
        return {isCompound: true, bounds: bounds, components: []}
    }
    readSimpleGlyph(nContours, bounds){
        let endpoints = [];
        for(let i = 0;i < nContours; i++){
            endpoints.push(this.readUint16());
        }
        console.log(`contour endpoints: ${endpoints}`);
        let instructionCount = this.readUint16();
        for(let i = 0; i < instructionCount; i++){
            this.readByte();
        }
        let data: GlyphData = {flags: [], xCoordinates: [], yCoordinates: []};
        let nPoints = endpoints[endpoints.length - 1] + 1;
        let repeat = 0;
        let flag;
        for(let i = 0; i < nPoints; i++){
            if(repeat > 0){
                repeat--;
            }
            else{
                flag = this.readByte();
                if(isBitSet(flag, 3)){
                    repeat = this.readByte();
                }
            }
            data.flags.push(flag);
        }
        data.xCoordinates = this.readCoordinates(data.flags, nPoints, 1, 4);
        data.yCoordinates = this.readCoordinates(data.flags, nPoints, 2, 5);

        let glyph: Glyph = {
            isCompound: false,
            bounds: bounds,
            pointCount: nPoints,
            contourCount: nContours,
            points: [],
        };
        let isOnCurve = true;
        let nextEndpointIdx = 0;
        for(let i = 0; i < nPoints; i++){
            if(!isOnCurve && !isBitSet(data.flags[i],0)){
                //if there are two off-curve points in a row, then there is an implied third point on the curve between them
                let x = (data.xCoordinates[i - 1] + data.xCoordinates[i]) * 0.5;
                let y = (data.yCoordinates[i - 1] + data.yCoordinates[i]) * 0.5;
                glyph.points.push({ x: x, y: y, isOnCurve: true, isImplied: true, isEndpoint: false});
            }
            let isEndpoint = false;
            if(i == endpoints[nextEndpointIdx]){
                nextEndpointIdx++;
                isEndpoint = true;
            }
            isOnCurve = isBitSet(data.flags[i],0);
            glyph.points.push({ x:data.xCoordinates[i], y: data.yCoordinates[i], isOnCurve: isOnCurve, isImplied: false, isEndpoint: isEndpoint});
        }
        return glyph;
    }
    readCoordinates(flags, nPoints, shortBitindex, dualBitIndex){
        let x = 0;
        let coords = [];
        for(let i = 0; i < nPoints; i++){
            let next;
            let xshort = isBitSet(flags[i], shortBitindex); //determines if the data is one byte long or two
            let dbm = isBitSet(flags[i], dualBitIndex); //if xshort says one byte, determines the sign of that byte
            if(xshort){
                next = this.readByte();
                if(!dbm){
                    next *= -1;
                }
            }
            else{
                if(dbm){
                    next = 0;
                }
                else{
                    next = this.readInt16();
                }
            }
            x += next;
            coords.push(x);
        }
        return coords;
    }
    createGlyphMap(){
        this.goTo(this.directory["maxp"].location);
        this.skipForward(4);
        let glyphCount = this.readUint16();

        this.goTo(this.directory["head"].location);
        this.skipForward(50);

        let isShortEntries = this.readUint16() == 0;
        let glyphTableLocation = this.directory["glyf"].location;
        this.glyphLocations = [];

        this.goTo(this.directory["loca"].location);
        for(let i = 0; i < glyphCount; i++){
            let offset;
            if(isShortEntries){
                offset = 2 * this.readUint16();
            }
            else{
                offset = this.readUint32();
            }
            this.glyphLocations.push(glyphTableLocation + offset);
        }
        console.log(this.glyphLocations);
    }

}




