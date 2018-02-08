import * as types from "./types";
export declare const id = "dongle-extended";
export declare namespace Events {
    namespace updateMap {
        const name = "updateMap";
        type Data = {
            dongleImei: string;
            dongle: types.Dongle | undefined;
        };
    }
    namespace message {
        const name = "message";
        type Data = {
            dongleImei: string;
            message: types.Message;
        };
    }
    namespace statusReport {
        const name = "statusReport";
        type Data = {
            dongleImei: string;
            statusReport: types.StatusReport;
        };
    }
    namespace periodicalSignal {
        const name = "periodicalSignal";
        type Data = {
            serviceUpSince: number;
        };
        const interval = 6000;
    }
}
export declare namespace initialize {
    const method = "initialize";
    type Response = {
        moduleConfiguration: types.ModuleConfiguration;
        dongles: types.Dongle[];
        serviceUpSince: number;
    };
}
export declare namespace sendMessage {
    const method = "sendMessage";
    type Params = {
        viaDongleImei: string;
        toNumber: string;
        text: string;
    };
    type Response = types.SendMessageResult;
}
export declare namespace unlock {
    const method = "unlock";
    type Pin = {
        dongleImei: string;
        pin: string;
    };
    type Puk = {
        dongleImei: string;
        puk: string;
        newPin: string;
    };
    type Params = Pin | Puk;
    function matchPin(p: Params): p is Pin;
    type Response = types.UnlockResult;
}
export declare namespace getMessages {
    const method = "getMessages";
    type Params = {
        imsi?: string;
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    };
    type Response = {
        [imsi: string]: types.Message[];
    };
}
