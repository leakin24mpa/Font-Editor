import { P, FEli, FEul} from "../htmltools.js";



interface gameInfo{
    name: string;
    hostname: string;
    playersOnline: number;
    code: number;
}

export class FEgameInfo extends FEli{
    constructor(info: gameInfo){
        super(
            P().says(info.name),
            P().says("hosted by: " + info.hostname),
            P().says("Players Online: " + info.playersOnline),
            P().says("#" + info.code)
        );
    }
}

export class FEgameInfoList extends FEul{
    constructor(...infos: gameInfo[]){
        super(...infos.map((i) => new FEgameInfo(i)));
    }
    addInfo(info: gameInfo){
        this.addChildren(new FEgameInfo(info));
    }
}



