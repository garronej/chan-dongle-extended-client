import * as types from "./types";

export namespace controller {

    export namespace notifyCurrentState {

        export const methodName = "notifyCurrentState";

        export type Params = {
            staticModuleConfiguration: types.StaticModuleConfiguration;
            dongles: types.Dongle[];
        };

        export type Response = undefined;

    }

    export namespace updateMap {

        export const methodName = "updateMap";

        export type Params= {
            dongleImei: string;
            dongle: types.Dongle | undefined;
        };

        export type Response= undefined;

    }

    export namespace notifyMessage {

        export const methodName= "notifyMessage";

        export type Params= {
            dongleImei: string;
            message: types.Message;
        };

        
        export type Response= "SAVE MESSAGE" | "DO NOT SAVE MESSAGE";

    }

    export namespace notifyStatusReport {

        export const methodName= "notifyStatusReport";

        export type Params ={
            dongleImei: string;
            statusReport: types.StatusReport;
        };

        export type Response= undefined;

    }


}

export namespace service {


    export namespace sendMessage {

        export const methodName = "sendMessage";

        export type Params = {
            viaDongleImei: string;
            toNumber: string;
            text: string;
        };

        export type Response = types.SendMessageResult;

    }

    export namespace unlock {

        export const methodName = "unlock";

        export type Params = Params.Pin | Params.Puk;

        export namespace Params {
            export type Pin = { dongleImei: string; pin: string; };
            export type Puk = { dongleImei: string; puk: string; newPin: string; };
        }

        export function matchPin(p: Params): p is Params.Pin {
            return !!(p as Params.Pin).pin;
        }

        /** undefined when the dongle disconnect while unlocking */
        export type Response = types.UnlockResult | undefined;

    }

    export namespace getMessages {

        export const methodName = "getMessages";

        export type Params = {
            imsi?: string;
            fromDate?: Date;
            toDate?: Date;
            flush?: boolean;
        };

        export type Response = { [imsi: string]: types.Message[] };

    }


}


