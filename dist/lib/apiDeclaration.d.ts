import * as types from "./types";
export declare namespace controller {
    namespace notifyCurrentState {
        const methodName = "notifyCurrentState";
        type Params = {
            staticModuleConfiguration: types.StaticModuleConfiguration;
            dongles: types.Dongle[];
        };
        type Response = undefined;
    }
    namespace updateMap {
        const methodName = "updateMap";
        type Params = {
            dongleImei: string;
            dongle: types.Dongle | undefined;
        };
        type Response = undefined;
    }
    namespace notifyMessage {
        const methodName = "notifyMessage";
        type Params = {
            dongleImei: string;
            message: types.Message;
        };
        type Response = "SAVE MESSAGE" | "DO NOT SAVE MESSAGE";
    }
    namespace notifyStatusReport {
        const methodName = "notifyStatusReport";
        type Params = {
            dongleImei: string;
            statusReport: types.StatusReport;
        };
        type Response = undefined;
    }
}
export declare namespace service {
    namespace sendMessage {
        const methodName = "sendMessage";
        type Params = {
            viaDongleImei: string;
            toNumber: string;
            text: string;
        };
        type Response = types.SendMessageResult;
    }
    namespace unlock {
        const methodName = "unlock";
        type Params = Params.Pin | Params.Puk;
        namespace Params {
            type Pin = {
                dongleImei: string;
                pin: string;
            };
            type Puk = {
                dongleImei: string;
                puk: string;
                newPin: string;
            };
        }
        function matchPin(p: Params): p is Params.Pin;
        /** undefined when the dongle disconnect while unlocking */
        type Response = types.UnlockResult | undefined;
    }
    namespace getMessages {
        const methodName = "getMessages";
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
}
