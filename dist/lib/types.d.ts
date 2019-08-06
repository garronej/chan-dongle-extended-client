export declare type Dongle = Dongle.Locked | Dongle.Usable;
export declare namespace Dongle {
    type Locked = {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        sim: {
            iccid?: string;
            pinState: Locked.PinState;
            tryLeft: number;
        };
    };
    namespace Locked {
        type PinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
        function match(dongle: Dongle): dongle is Locked;
    }
    type Usable = {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        isVoiceEnabled?: boolean;
        sim: Sim;
        networkRegistrationState: Usable.NetworkRegistrationState;
    };
    namespace Usable {
        function match(dongle: Dongle): dongle is Usable;
        type NetworkRegistrationState = "NOT REGISTERED AND NOT SEARCHING" | "REGISTERED HOME NETWORK" | "NOT REGISTERED BUT SEARCHING" | "REGISTRATION DENIED" | "UNKNOWN" | "REGISTERED ROAMING";
    }
}
export declare type Sim = {
    iccid: string;
    imsi: string;
    country?: Sim.Country;
    serviceProvider: {
        fromImsi?: string;
        fromNetwork?: string;
    };
    storage: Sim.Storage;
};
export declare namespace Sim {
    type Country = {
        name: string;
        iso: string;
        code: number;
    };
    type Storage = {
        number?: string;
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
        digest: string;
    };
    type Contact = {
        index: number;
        name: string;
        number: string;
    };
}
export declare type UnlockResult = UnlockResult.Success | UnlockResult.Failed;
export declare namespace UnlockResult {
    type Success = {
        success: true;
    };
    type Failed = {
        success: false;
        pinState: Dongle.Locked.PinState;
        tryLeft: number;
    };
}
export declare type StaticModuleConfiguration = {
    general: any;
    defaults: any;
};
export declare type SendMessageResult = {
    success: true;
    sendDate: Date;
} | {
    success: false;
    reason: "DISCONNECT" | "CANNOT SEND";
};
export declare type StatusReport = {
    sendDate: Date;
    dischargeDate: Date;
    isDelivered: boolean;
    status: string;
    recipient: string;
};
export declare type Message = {
    number: string;
    date: Date;
    text: string;
};
