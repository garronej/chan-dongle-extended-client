import * as types from "./types";

export const id = "dongle-extended";

export namespace Events {

    export namespace updateMap {

        export const name = "updateMap";

        export type Data = {
            dongleImei: string;
            dongle: types.Dongle | undefined;
        };

    }

    export namespace message {

        export const name = "message";

        export type Data = {
            dongleImei: string;
            message: types.Message;
        };

    }

    export namespace statusReport {

        export const name = "statusReport";

        export type Data = {
            dongleImei: string;
            statusReport: types.StatusReport;
        };

    }

    export namespace periodicalSignal {

        export const name = "periodicalSignal";

        export type Data = {
            serviceUpSince: number;
        };

        export const interval = 6000;

    }

}


export namespace initialize {

    export const method = "initialize";

    export type Response = {
        moduleConfiguration: types.ModuleConfiguration;
        dongles: types.Dongle[];
        serviceUpSince: number;
    };

}

export namespace sendMessage {

    export const method = "sendMessage";

    export type Params = {
        viaDongleImei: string;
        toNumber: string;
        text: string;
    };

    export type Response = types.SendMessageResult;

}

export namespace unlock {

    export const method = "unlock";

    export type Pin = { dongleImei: string; pin: string; };
    export type Puk = { dongleImei: string; puk: string; newPin: string; };

    export type Params = Pin | Puk;

    export function matchPin(p: Params): p is Pin {
        return !!(p as Pin).pin;
    }

    export type Response = types.UnlockResult;

}

export namespace getMessages {

    export const method = "getMessages";

    export type Params = {
        imsi?: string;
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    };

    export type Response = { [imsi: string]: types.Message[] };

}
