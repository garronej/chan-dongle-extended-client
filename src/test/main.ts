import { DongleExtendedClient } from "../lib";
import { Request } from "../lib/fetched/AmiUserEvents";
import { SyncEvent } from "ts-events-extended";
import { Base64 } from "js-base64";


(async function testSendMessage() {

    console.log("TEST send message");

    let ami = DongleExtendedClient.localhost().ami;

    let text = "";

    for (let i = 0; i < 5000; i++)
        text += "\u0001";

    text+= " 😋 \"Hello world\" is a good foo bar\n I tell you that!!! <3";

    console.log({ text });

    ami.userEvent(
        Request.SendMessage.build(
            "111111111111111",
            "0636786385",
            text
        )
    );

    let actionid = ami.lastActionId;

    let userEvent=  await ami.evtUserEvent.waitFor(
        Request.SendMessage.match
    );

    console.log(userEvent);

    console.assert( Request.SendMessage.reassembleText(userEvent) === text );

    console.log("PASS");

    ami.disconnect();


});

(async function getMessages() {

    let messages= await DongleExtendedClient.localhost().getMessages("358880032664586", false);

    console.log({ messages });

})();
