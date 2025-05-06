import { FontReader } from "./fontReader.js";

enum dt{
  Int8,
  Uint8,

  Int16,
  Uint16,

  Int32,
  Uint32,

  short_frac,
  Fixed,

  FWord,
  uFWord,

  F2dot14,

  LongDateTime,
}


type TTFtemplate = {[key: string]: dt};


export const offsetSubtable: TTFtemplate = {
  scalerType: dt.Uint32,
  numTables: dt.Uint16,
  searchRange: dt.Uint16,
  entrySelector: dt.Uint16,
  rangeShift: dt.Uint16,
}

export const directoryEntry: TTFtemplate = {
  sum: dt.Uint32,
  location: dt.Uint32,
  length: dt.Uint32,
}




export class fontTableReader extends FontReader{
  constructor(arraybuffer: ArrayBuffer){
    super(arraybuffer);
  }
  readValue(type: dt){
    switch(type){
      case dt.Int8:
        return this.readInt8();
      case dt.Uint8:
        return this.readUint8();
      case dt.Int16:
        return this.readInt16();
      case dt.Uint16:
        return this.readUint16();
      case dt.Int32:
        return this.readInt32();
      case dt.Uint32:
        return this.readUint32();
      case dt.uFWord:
        return this.readUint16();
      case dt.FWord:
        return this.readUint16();
      case dt.F2dot14:
        return this.readInt2_14();
      case dt.Fixed:
        return this.readFixed16_16();
      case dt.short_frac:
        return this.readShortFrac();
      case dt.LongDateTime:
        return this.readLongDateTime();      
      default:
        return 0;
    }
  }
  readTable(template: any){
    let table = {};
    for(var key in template){ 
      table[key] = this.readValue(template[key]);
    }
    return table;
  }
}


