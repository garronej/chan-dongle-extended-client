import { DongleController as Dc } from "./DongleController";

export const amiUser = "dongle_ext_user";

export const defaultConfig = {
    "general": {
        "interval": "10000000",
        "jbenable": "no",
        "jbmaxsize": "100",
        "jbimpl": "fixed"
    },
    "defaults": {
        "context": "from-dongle",
        "group": "0",
        "rxgain": "0",
        "txgain": "0",
        "autodeletesms": "no",
        "resetdongle": "yes",
        "u2diag": "-1",
        "usecallingpres": "yes",
        "callingpres": "allowed_passed_screen",
        "disablesms": "no",
        "language": "en",
        "smsaspdu": "yes",
        "mindtmfgap": "45",
        "mindtmfduration": "80",
        "mindtmfinterval": "200",
        "callwaiting": "auto",
        "disable": "no",
        "initstate": "start",
        "exten": "+12345678987",
        "dtmf": "relax"
    }
};

export namespace api {

    export namespace Events {

        export namespace updateMap {

            export const name = "updateMap";

            export type Data = {
                dongleImei: string;
                dongle: Dc.Dongle | undefined;
            };

        }

        export namespace message {

            export const name = "message";

            export type Data = {
                dongleImei: string;
                message: Dc.Message;
            };

        }

        export namespace statusReport {

            export const name = "statusReport";

            export type Data = {
                dongleImei: string;
                statusReport: Dc.StatusReport;
            };

        }

    }


    export namespace initialize {

        export const method = "initialize";

        export type Response = {
            moduleConfiguration: Dc.ModuleConfiguration;
            dongles: Dc.Dongle[];
        };

    }

    export namespace sendMessage {

        export const method = "sendMessage";

        export type Params = {
            viaDongleImei: string;
            toNumber: string;
            text: string;
        };

        export type Response = Dc.SendMessageResult;

    }

    export namespace unlock {

        export const method = "unlock";

        export type Pin = { dongleImei: string; pin: string; };
        export type Puk = { dongleImei: string; puk: string; newPin: string; };

        export type Params = Pin | Puk;

        export function matchPin(p: Params): p is Pin {
            return !!(p as Pin).pin;
        }

        export type Response = Dc.UnlockResult;

    }

    export namespace getMessages {

        export const method = "getMessages";

        export type Params = {
            imei?: string;
            iccid?: string;
            fromDate?: Date;
            toDate?: Date;
            flush?: boolean;
        };

        export type Response = Dc.Messages;

    }

}

