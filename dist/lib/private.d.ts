import { DongleController as Dc } from "./DongleController";
export declare const amiUser = "dongle_ext_user";
export declare const defaultConfig: {
    "general": {
        "interval": string;
        "jbenable": string;
        "jbmaxsize": string;
        "jbimpl": string;
    };
    "defaults": {
        "context": string;
        "group": string;
        "rxgain": string;
        "txgain": string;
        "autodeletesms": string;
        "resetdongle": string;
        "u2diag": string;
        "usecallingpres": string;
        "callingpres": string;
        "disablesms": string;
        "language": string;
        "smsaspdu": string;
        "mindtmfgap": string;
        "mindtmfduration": string;
        "mindtmfinterval": string;
        "callwaiting": string;
        "disable": string;
        "initstate": string;
        "exten": string;
        "dtmf": string;
    };
};
export declare namespace api {
    namespace Events {
        namespace updateMap {
            const name = "updateMap";
            type Data = {
                dongleImei: string;
                dongle: Dc.Dongle | undefined;
            };
        }
        namespace message {
            const name = "message";
            type Data = {
                dongleImei: string;
                message: Dc.Message;
            };
        }
        namespace statusReport {
            const name = "statusReport";
            type Data = {
                dongleImei: string;
                statusReport: Dc.StatusReport;
            };
        }
    }
    namespace initialize {
        const method = "initialize";
        type Response = {
            moduleConfiguration: Dc.ModuleConfiguration;
            dongles: Dc.Dongle[];
        };
    }
    namespace sendMessage {
        const method = "sendMessage";
        type Params = {
            viaDongleImei: string;
            toNumber: string;
            text: string;
        };
        type Response = Dc.SendMessageResult;
    }
    namespace unlock {
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
        type Response = Dc.UnlockResult;
    }
    namespace getMessages {
        const method = "getMessages";
        type Params = {
            imsi?: string;
            fromDate?: Date;
            toDate?: Date;
            flush?: boolean;
        };
        type Response = Dc.Messages;
    }
}
