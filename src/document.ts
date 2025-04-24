import { FEcarousel } from "./components/carousel.js";
import { FEcounterlist } from "./components/counterList.js";
import { FEpointPlot } from "./components/draggablePointPlot.js";
import { FEglyphEditor } from "./components/glyphEditor.js";
import { FEpinput } from "./components/Pinput.js";
import { FEgameInfoList } from "./components/publicGameList.js";
import { FEtreeView } from "./components/treeView.js";
import { DIV, INPUT, P, SetDocumentContent } from "./lib/htmltools.js";

SetDocumentContent(
    // DIV(
    //     P().says("hello world")
    // ),
    // new FEgameInfoList({name: "Public Game", hostname: "Bot", playersOnline: 2, code: 8355059}, 
    //                    {name: "Public Game II", hostname: "not bot", playersOnline: 69, code: 8355059}),
    // new FEcounterlist(4),
    // new FEpinput(6, "Join"),
    // INPUT().withAttributes({type: "checkbox"}),
    // new FEcarousel(
    //     new FEpointPlot(5),
    //     new FEglyphEditor()
    // ),
    new FEtreeView(
        "tree",
        {
            item1: true,
            item2: 8355059,
            next: {
                inner1: false,
                inner2: null
            },
            array: [
                3,
                4,
                5,
                9
            ]
        }
    ),
    
)