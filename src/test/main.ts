require("rejection-tracker").main(__dirname, "..", "..");

import { DongleController as Dc } from "../lib";

(async function initialize() {

    console.log("up");

    let dc = Dc.getInstance();

    console.assert(!dc.isInitialized, "m1");

    try {

        await dc.initialization;

    } catch (error){ 

        console.log(error);

        return;

    }

    console.assert(dc.isInitialized, "m2");

    //console.log(JSON.stringify(dc.dongles.toObject(), null, 2));

    dc.dongles.evt.attach(
        ([dongle]) => console.log(JSON.stringify(dongle, null, 2))
    );

    dc.evtMessage.attach( ({ dongle, message })=> console.log(JSON.stringify({dongle , message}, null, 2)));
    dc.evtStatusReport.attach( ({ dongle, statusReport })=> console.log(JSON.stringify({dongle , statusReport}, null, 2)));

    let imei= dc.dongles.keysAsArray()[0];

    console.log({ imei });

    dc.sendMessage(imei, "0636786385", "TEST DONGLE CONTROLLER");

    let messages= await dc.getMessages({});

    console.log(JSON.stringify({ messages }, null, 2));


});

(async function testGetMessages() {

    let dc= Dc.getInstance();

    await dc.initialization;

    for( let dongle of dc.activeDongles.values()){

        let messages = await dc.getMessagesOfSim({ "imsi": dongle.sim.imsi });

        console.log(messages);

    }

});

(async function testGetMessageWrongImsi() {

    let dc= Dc.getInstance();

    await dc.initialization;

    try{

        let messages = await dc.getMessagesOfSim({ "imsi": "42" });

        console.log("Fail");

        process.exit(-1);

    }catch(error){

        console.log(error.message);

        console.log("PASS");

    }


})();
