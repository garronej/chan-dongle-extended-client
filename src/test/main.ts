import { UserEvent, DongleExtendedClient } from "../lib";
import { SyncEvent } from "ts-events-extended";

import * as split from "../lib/textSplit";

import { Base64 } from "js-base64";


(function testSendMessage() {

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

        console.log("PASS testSendMessage");

    });


})();


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


    let ami = DongleExtendedClient.localhost().ami;

    ami.postAction(action as any);

    let actionid = ami.lastActionId;

    (ami.evt as SyncEvent<any>).createProxy(UserEvent.Event.NewMessage.matchEvt)
        .attachOnce(evt => evt.actionid === actionid, evt => {

            let text = UserEvent.Event.NewMessage.reassembleText(evt);

            console.assert(text === textIn);

            console.log("PASS");

        });



});

(function textSplitEncodeFist() {

    let text = "";

    for (let i = 0; i < 2033; i++)
        text += "\u0231";

    text += "Mais alors là oui!";

    let parts = split.textSplitBase64ForAmiEncodeFirst(text, "voila");

    console.log("number of parts: ", parts.length);

    console.log(parts);

    parts.forEach(part => console.log(Buffer.byteLength(`voila: ${part}\r\n`)));


    console.assert(Base64.decode(parts.join("")) === text);

    console.log("PASS");

});

(function textSplitSplitFirst() {

    let text = "";

    for (let i = 0; i < 190; i++) {
        text += `foo bar ${i} <3 @ ç € \n \u0012`;
    }

    let parts = split.textSplitBase64ForAmiSplitFirst(text, "voila");

    //console.log("number of parts: ", parts.length);

    //parts.forEach(part => console.log(Buffer.byteLength(`voila: ${part}\r\n`)));

    console.assert(parts.map(part => Base64.decode(part)).join("") === text);

    console.log("PASS");


});

