import { Ami, Credential } from "ts-ami";
import { LockedPinState } from "./AmiUserEvent";
import { SyncEvent } from "ts-events-extended";
export declare const amiUser = "dongle_ext_user";
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
export declare type Phonebook = {
    infos: {
        contactNameMaxLength: number;
        numberMaxLength: number;
        storageLeft: number;
    };
    contacts: Contact[];
};
export declare class DongleExtendedClient {
    private static localClient;
    static localhost(): DongleExtendedClient;
    readonly ami: Ami;
    readonly evtMessageStatusReport: SyncEvent<{
        imei: string;
    } & StatusReport>;
    readonly evtDongleDisconnect: SyncEvent<DongleActive>;
    readonly evtNewActiveDongle: SyncEvent<DongleActive>;
    readonly evtRequestUnlockCode: SyncEvent<LockedDongle>;
    readonly evtNewMessage: SyncEvent<{
        imei: string;
    } & Message>;
    constructor(credential: Credential);
    disconnect(): void;
    getLockedDongles(): Promise<LockedDongle[]>;
    getActiveDongles(): Promise<DongleActive[]>;
    sendMessage(imei: string, number: string, text: string): Promise<number>;
    getSimPhonebook(imei: string): Promise<Phonebook>;
    createContact(imei: string, name: string, number: string): Promise<Contact>;
    getMessages(imei: string, flush: boolean): Promise<Message[]>;
    deleteContact(imei: string, index: number): Promise<void>;
    unlockDongle(imei: string, pin: string): Promise<void>;
    unlockDongle(imei: string, puk: string, newPin: string): Promise<void>;
    updateNumber(imei: string, number: string): Promise<void>;
}
