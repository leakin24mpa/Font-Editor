import { Transform2d } from "../lib/transformtools.js";


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
    readInt2_14(){
        return this.readInt16() / 16384.0;
    }
    readString(length: number){
        let str = "";
        for(let i = 0; i < length; i++){
            str += String.fromCharCode(this.readByte());
        }
        return str;
    }
    readFixed16_16(){
        let val = this.readUint32();
        let i = val >> 16;
        let f = (val & 0xFFFF) / 65536;
        return i + f;
    }
    readFloat64(){
        let f = this.dataview.getFloat64(this.byteIdx, false);
        this.byteIdx += 8;
        return f;

    }
    goTo(byte: number){
        this.byteIdx = byte;
    }
    skipForward(bytes){
        this.byteIdx += bytes;
    }
}
export interface FontTableInfo{
    sum: number;
    location: number;
    length: number;
}
export type FontDirectory = {
    [tag: string]: FontTableInfo;
}

export type CharacterIndexMap = {
    [unicodeId: number]: number;
};


export interface GlyphPoint{
    px: number;
    py: number;
    isOnCurve: boolean;
    isImplied: boolean;
    isEndpoint: boolean;
}
export interface SimpleGlyph{
    isCompound: false;
    bounds: Bounds;
    pointCount: number;
    contourCount: number;
    points: GlyphPoint[];
}
export interface CompoundGlyph{
    isCompound: true;
    bounds: {min: {x: number; y: number;}; max: {x: number; y: number;};};
    components: {index: number, transform: Transform2d}[];

}
export type Glyph = SimpleGlyph | CompoundGlyph;

export interface Bounds{
    min: {x: number; y: number;}; 
    max: {x: number; y: number;};
}
export class FontReader extends BinaryReader{
    goToTable(table: FontTableInfo){
        this.goTo(table.location);
    }
    constructor(arraybuffer: ArrayBuffer){
        super(arraybuffer);
    }
     
    readGlyph(): Glyph{
        let nContours = this.readInt16();
        let isCompound = nContours < 0;

        let xMin = this.readInt16();
        let yMin = this.readInt16();
        let xMax = this.readInt16();
        let yMax = this.readInt16();
        let bounds = {min: {x: xMin, y: yMin}, max: {x: xMax, y: yMax}};

        if(isCompound){
            return this.readCompoundGlyph(bounds);
        }
        else{
            return this.readSimpleGlyph(nContours, bounds);
        }

        
    }
    readCompoundGlyph(bounds): CompoundGlyph{
        let glyph: CompoundGlyph = {isCompound: true, bounds: bounds, components: []}
        let moreToRead = true;
        let nComponents = 0;
        while(moreToRead){
            nComponents++;
            let flag = this.readUint16();
            moreToRead = isBitSet(flag, 5);
            
            let args1and2arewords = isBitSet(flag, 0);
            let argsAreXY = isBitSet(flag, 1);
            let hasScale = isBitSet(flag, 3);
            let hasXYscale = isBitSet(flag, 6);
            let has2x2 = isBitSet(flag, 7);

            let arg1, arg2;

            let index = this.readUint16();
            if(args1and2arewords){
                arg1 = this.readInt16();
                arg2 = this.readInt16();
            }
            else{
                arg1 = this.readByte();
                arg2 = this.readByte();
            }
            let transform = Transform2d.nothing();
            if(argsAreXY){
                transform = Transform2d.translation(arg1, arg2);
            }
            if(hasScale){
                transform.composeWith(Transform2d.scale(this.readInt2_14()))
                //this.skipForward(4);
            }
            else if(hasXYscale){
                transform.composeWith(Transform2d.scaleXY(this.readInt2_14(), this.readInt2_14()))
                //this.skipForward(8);
            }
            else if(has2x2){
                transform.composeWith(
                    new Transform2d(
                        this.readInt2_14(), 
                        this.readInt2_14(),
                        this.readInt2_14(),
                        this.readInt2_14(),
                        0, 0));
                //this.skipForward(16);
            }
            glyph.components.push({index: index, transform})
        }
        return glyph;
    }
    readSimpleGlyph(nContours, bounds){
        let endpoints = [];
        for(let i = 0;i < nContours; i++){
            endpoints.push(this.readUint16());
        }
        let instructionCount = this.readUint16();
        for(let i = 0; i < instructionCount; i++){
            this.readByte();
        }
        let flags = [], xCoordinates = [], yCoordinates = [];
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
            flags.push(flag);
        }
        xCoordinates = this.readCoordinates(flags, nPoints, 1, 4);
        yCoordinates = this.readCoordinates(flags, nPoints, 2, 5);

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
            if(!isOnCurve && !isBitSet(flags[i],0)){
                //if there are two off-curve points in a row, then there is an implied third point on the curve between them
                let x = (xCoordinates[i - 1] + xCoordinates[i]) * 0.5;
                let y = (yCoordinates[i - 1] + yCoordinates[i]) * 0.5;
                glyph.points.push({ px: x, py: y, isOnCurve: true, isImplied: true, isEndpoint: false});
            }
            let isEndpoint = false;
            if(i == endpoints[nextEndpointIdx]){
                nextEndpointIdx++;
                isEndpoint = true;
            }
            isOnCurve = isBitSet(flags[i],0);
            glyph.points.push({ px:xCoordinates[i], py: yCoordinates[i], isOnCurve: isOnCurve, isImplied: false, isEndpoint: isEndpoint});
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

}




