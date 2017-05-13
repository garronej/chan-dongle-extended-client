import { UserEvent } from "../lib/AmiUserEvent";

import { DongleExtendedClient } from "../lib";



let text= "";

for( let i=0; i<20000; i++)
    text+= "\u0001";

console.log(text.length);

let action= UserEvent.Request.SendMessage.buildAction(
    "111111111111111", 
    "0636786385",
    text
);


let { textsplitcount }= action;

console.log( { textsplitcount });

let ami= DongleExtendedClient.localhost().ami;

ami.postAction(action as any);

let actionid= ami.lastActionId;

ami.evt.attachOnce(evt => evt.actionid === actionid, evt=> {

    console.log("OK");

});