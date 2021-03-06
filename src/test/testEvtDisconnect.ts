require("rejection-tracker").main(__dirname, "..", "..");

import { DongleController as Dc } from "../lib";

console.log("START TEST");

(async ()=> {

    let dc = Dc.getInstance();

    dc.evtClose.attachOnce(()=> {

        console.log("");

    });

    await dc.prInitialization;

    console.log(`dc initialized, dongles size: ${dc.dongles.size}`);

    dc.dongles.evtCreate.attach(([dongle, imei])=> console.log("evtCreate", imei));

    dc.dongles.evtUpdate.attach(([dongle, imei])=> console.log("evtUpdate", imei));

    dc.dongles.evtDelete.attach(([dongle, imei])=> console.log("evtDelete", imei));

    dc.evtMessage.attach(({ dongle, message })=> {

        console.log({ message });

    });

})();



