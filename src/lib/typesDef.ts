export namespace typesDef {

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

    export type ModuleConfiguration = {
        general: typeof defaultConfig['general'];
        defaults: typeof defaultConfig['defaults'];
        [dongleName: string]: {
            audio: string;
            data: string;
        } | any;
    };

    export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

    export interface StatusReport {
        messageId: number;
        dischargeTime: Date;
        isDelivered: boolean;
        status: string;
        recipient: string;
    }

    export interface Message {
        number: string;
        date: Date;
        text: string;
    }

    export interface Contact {
        index: number;
        number: string;
        name: string;
    }

    export interface DongleBase {
        imei: string;
        iccid: string;
    }

    export interface LockedDongle extends DongleBase {
        pinState: LockedPinState;
        tryLeft: number;
    }

    export interface DongleActive extends DongleBase {
        imsi: string;
        number: string | undefined;
        serviceProvider: string | undefined;
        isVoiceEnabled: boolean | undefined;
    }

    export type Phonebook = {
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
    };

}