
export class Font{
    directory: FontDirectory;

    constructor(arraybuffer: ArrayBuffer){

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