# chan-dongle-extended-client  

This is the client for [chan-dongle-extended](https://github.com/garronej/chan-dongle-extended).

[Website of the project](https://garronej.github.io/chan-dongle-extended-pages/)

## Installation 

`package.json`
```json
  "dependencies": {
    "chan-dongle-extended-client": "github:garronej/chan-dongle-extended-client",
  }
```

## Usage  

```typescript
import { DongleController as Dc } from "chan-dongle-extended-client";

/** Once it resolve Dc.getInstance() can be used synchronously */
const prDongleControllerInitialized = new Promise<void>(async resolve => {

    // This is the port used by default if you didn't specified another explicitely.  
    const { port } = await import("chan-dongle-extended-client/dist/lib/misc");

    await new Promise(resolve => setTimeout(resolve, 3000));

    while (true) {

        const dc = Dc.getInstance("127.0.0.1", port);

        try {

            await dc.prInitialization;

        } catch{

            debug("dongle-extended not initialized yet, scheduling retry...");

            await new Promise(resolve => setTimeout(resolve, 3000));

            continue;

        }

        dc.evtClose.attachOnce(
            () => {
                Promise.reject(new Error("TCP connection lost with chan-dongle-extended"))
            }
        );

        break;

    }

    resolve();

});

prDongleControllerInitialized.then(()=> {

       
        const dc = Dc.getInstance();
        
        dc.createContact(...)
        dc.sendMessage(...)
        dc.evtMessage.attach(message=> { ... })

});
```

If you need more information you can try revers ingeneer the usage of `chan-dongle-extended-client` in [this project](https://github.com/garronej/semasim-gateway).  

