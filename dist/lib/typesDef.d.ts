export declare namespace typesDef {
    const errMessDongleNotFound = "Dongle not found";
    const defaultConfig: {
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
    type ModuleConfiguration = {
        general: typeof defaultConfig['general'];
        defaults: typeof defaultConfig['defaults'];
        [dongleName: string]: {
            audio: string;
            data: string;
        } | any;
    };
    type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
    interface StatusReport {
        messageId: number;
        dischargeTime: Date;
        isDelivered: boolean;
        status: string;
        recipient: string;
    }
    interface Message {
        number: string;
        date: Date;
        text: string;
    }
    interface Contact {
        index: number;
        number: string;
        name: string;
    }
    interface DongleBase {
        imei: string;
        iccid: string;
    }
    interface LockedDongle extends DongleBase {
        pinState: LockedPinState;
        tryLeft: number;
    }
    interface DongleActive extends DongleBase {
        imsi: string;
        number: string | undefined;
        serviceProvider: string | undefined;
        isVoiceEnabled: boolean | undefined;
    }
    type Phonebook = {
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
    };
}
