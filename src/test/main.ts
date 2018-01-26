require("rejection-tracker").main(__dirname, "..", "..");

import { DongleController as Dc } from "../lib";

(async function initialize() {

    console.log("up");

    let dc = Dc.getInstance();

    console.assert(!dc.isInitialized, "m1");

    try {

        await dc.initialization;

    } catch (error) {

        console.log(error);

        return;

    }

    console.assert(dc.isInitialized, "m2");

    //console.log(JSON.stringify(dc.dongles.toObject(), null, 2));

    for( let dongle of dc.dongles.valueSet() ){

        console.assert( Dc.Dongle.sanityCheck(dongle), "sanity check failed" );

    }

    dc.dongles.evt.attach(
        ([dongle]) => console.log(JSON.stringify(dongle, null, 2))
    );

    dc.evtMessage.attach(({ dongle, message }) => console.log(JSON.stringify({ dongle, message }, null, 2)));
    dc.evtStatusReport.attach(({ dongle, statusReport }) => console.log(JSON.stringify({ dongle, statusReport }, null, 2)));

    let imei = dc.dongles.keysAsArray()[0];

    console.log({ imei });

    dc.sendMessage(imei, "0636786385", "TEST DONGLE CONTROLLER");

    let messages = await dc.getMessages({});

    console.log(JSON.stringify({ messages }, null, 2));


});

(async function testGetMessages() {

    let dc = Dc.getInstance();

    await dc.initialization;

    for (let dongle of dc.activeDongles.values()) {

        let messages = await dc.getMessagesOfSim({ "imsi": dongle.sim.imsi });

        console.log(messages);

    }

});

(async function testGetMessageWrongImsi() {

    let dc = Dc.getInstance();

    await dc.initialization;

    try {

        let messages = await dc.getMessagesOfSim({ "imsi": "42" });

        console.log("Fail");

        process.exit(-1);

    } catch (error) {

        console.log(error.message);

        console.log("PASS");

    }


});

(function testSanityChecks() {


    let dongle = {
        "imei": "353762037478870",
        "isVoiceEnabled": true,
        "manufacturer": "huawei",
        "model": "E160X",
        "firmwareVersion": "11.609.10.02.432",
        "sim": {
            "iccid": "8933150116110005978",
            "country": {
                "name": "France",
                "iso": "FR",
                "code": 33
            },
            "imsi": "208150113995832",
            "serviceProvider": {
                "fromImsi": "Free Mobile",
                "fromNetwork": "Free"
            },
            "storage": {
                "number": {
                    "asStored": "+33769365812",
                    "localFormat": "0769365812"
                },
                "infos": {
                    "contactNameMaxLength": 14,
                    "numberMaxLength": 24,
                    "storageLeft": 242
                },
                "contacts": [
                    {
                        "index": 1,
                        "name": {
                            "asStored": "Joseph Garrone",
                            "full": "Joseph Garrone"
                        },
                        "number": {
                            "asStored": "0636786385",
                            "localFormat": "0636786385"
                        }
                    },
                    {
                        "index": 7,
                        "name": {
                            "asStored": "Sienna",
                            "full": "Sienna"
                        },
                        "number": {
                            "asStored": "0782397709",
                            "localFormat": "0782397709"
                        }
                    }
                ],
                "digest": "133f4ab5a08e6a30c04e78c0016d1551"
            }
        }
    };

    console.assert(Dc.Dongle.sanityCheck(dongle));

    console.log("PASS SANITY CHECKS");

})();
