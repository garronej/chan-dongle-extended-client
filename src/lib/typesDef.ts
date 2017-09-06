export namespace typesDef {

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