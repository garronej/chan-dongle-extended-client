export declare namespace typesDef {
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
