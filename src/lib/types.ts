export type Dongle = Dongle.Locked | Dongle.Usable;

export namespace Dongle {

    export type Locked = {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        sim: {
            iccid?: string;
            pinState: Locked.PinState;
            tryLeft: number;
        }
    };

    export namespace Locked {

        export type PinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

        export function match(dongle: Dongle): dongle is Locked {
            return (dongle.sim as Locked['sim']).pinState !== undefined;
        }

    }

    export type Usable = {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        isVoiceEnabled?: boolean;
        sim: Sim;
        isGsmConnectivityOk: boolean;
        cellSignalStrength: Usable.CellSignalStrength;
    };

    export namespace Usable {

        export function match(dongle: Dongle): dongle is Usable {
            return !Locked.match(dongle);
        }

        export type NetworkRegistrationState =
            "NOT REGISTERED AND NOT SEARCHING" |
            "REGISTERED HOME NETWORK" |
            "NOT REGISTERED BUT SEARCHING" |
            "REGISTRATION DENIED" |
            "UNKNOWN" |
            "REGISTERED ROAMING"
            ;

        export type CellSignalStrength = "NULL" | "VERY WEAK" | "WEAK" | "GOOD" | "EXCELLENT";


    }

}

export type Sim = {
    iccid: string;
    imsi: string;
    country?: Sim.Country;
    serviceProvider: {
        fromImsi?: string;
        fromNetwork?: string;
    },
    storage: Sim.Storage;
};

export namespace Sim {

    export type Country = {
        name: string;
        iso: string;
        code: number;
    };

    export type Storage = {
        number?: string;
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
        digest: string;
    };

    export type Contact = {
        index: number;
        name: string;
        number: string;
    };

}

export type UnlockResult = UnlockResult.Success | UnlockResult.Failed;

export namespace UnlockResult {

    export type Success = { success: true; };
    export type Failed = { success: false; pinState: Dongle.Locked.PinState; tryLeft: number; };

}

export type StaticModuleConfiguration = { general: any; defaults: any; };

export type SendMessageResult =
    {
        success: true;
        sendDate: Date;
    } | {
        success: false;
        reason: "DISCONNECT" | "CANNOT SEND"
    };

export type StatusReport = {
    sendDate: Date;
    dischargeDate: Date;
    isDelivered: boolean;
    status: string;
    recipient: string;
};

export type Message = {
    number: string;
    date: Date;
    text: string;
};
