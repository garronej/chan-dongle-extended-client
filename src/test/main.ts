import { UserEvent } from "../lib/AmiUserEvent";
import { SyncEvent } from "ts-events-extended";

import { DongleExtendedClient } from "../lib";

(function test1() {

    let text = "";

    for (let i = 0; i < 20000; i++)
        text += "\u0001";

    console.log(text.length);

    let action = UserEvent.Request.SendMessage.buildAction(
        "111111111111111",
        "0636786385",
        text
    );


    let { textsplitcount } = action;

    console.log({ textsplitcount });

    let ami = DongleExtendedClient.localhost().ami;

    ami.postAction(action as any);

    let actionid = ami.lastActionId;

    ami.evt.attachOnce(evt => evt.actionid === actionid, evt => {

        console.log("OK");

    });


});


(function test2() {


    let textIn = " 😋 super c'est moi! ";

    for (let i = 0; i < 19000; i++)
        textIn += "\u0001";

    let action = UserEvent.Event.NewMessage.buildAction(
        "111111111111111",
        "+36786385",
        (new Date()).toISOString(),
        textIn
    );


    let ami= DongleExtendedClient.localhost().ami;

    ami.postAction(action as any);

    let actionid = ami.lastActionId;

    (ami.evt as SyncEvent<any>).createProxy(UserEvent.Event.NewMessage.matchEvt)
    .attachOnce(evt => evt.actionid === actionid, evt => {

        let text= UserEvent.Event.NewMessage.reassembleText(evt);

        console.assert(text === textIn );

        console.log("PASS");

    });



})();

