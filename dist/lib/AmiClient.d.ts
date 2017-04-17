import { UserEvent } from "./AmiUserEvent";
import { Credential } from "./AmiCredential";
import { SyncEvent } from "ts-events-extended";
export interface StatusReport {
    messageId: number;
    dischargeTime: Date;
    isDelivered: boolean;
    status: string;
}
export declare type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
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
export interface ManagerEvent {
    event: string;
    privilege: string;
    [header: string]: string;
}
export declare class AmiClient {
    private static localClient;
    static localhost(): AmiClient;
    readonly ami: any;
    readonly evtMessageStatusReport: SyncEvent<{
        imei: string;
    } & StatusReport>;
    readonly evtDongleDisconnect: SyncEvent<DongleActive>;
    readonly evtNewActiveDongle: SyncEvent<DongleActive>;
    readonly evtRequestUnlockCode: SyncEvent<LockedDongle>;
    readonly evtNewMessage: SyncEvent<{
        imei: string;
    } & Message>;
    readonly evtAmiUserEvent: SyncEvent<UserEvent>;
    readonly evtAmi: SyncEvent<ManagerEvent>;
    private isFullyBooted;
    constructor(credential: Credential);
    postUserEventAction(actionEvt: UserEvent): {
        actionid: string;
        promise: Promise<any>;
    };
    postAction(actionEvt: any): {
        actionid: string;
        promise: Promise<any>;
    };
    disconnect(): void;
    private registerListeners();
    getLockedDongles(callback?: (dongles: LockedDongle[]) => void): Promise<LockedDongle[]>;
    getActiveDongles(callback?: (dongles: DongleActive[]) => void): Promise<DongleActive[]>;
    sendMessage(imei: string, number: string, text: string, callback?: (error: Error | null, messageId: number) => void): Promise<[Error | null, number]>;
    getSimPhonebook(imei: string, callback?: (error: null | Error, phonebook: Phonebook | null) => void): Promise<[null | Error, Phonebook | null]>;
    createContact(imei: string, name: string, number: string, callback?: (error: null | Error, contact: Contact | null) => void): Promise<[null | Error, Contact | null]>;
    getMessages(imei: string, flush: boolean, callback?: (error: null | Error, messages: Message[] | null) => void): Promise<[null | Error, Message[] | null]>;
    deleteContact(imei: string, index: number, callback?: (error: null | Error) => void): Promise<null | Error>;
    private static readUnlockParams(inputs);
    unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    updateNumber(imei: string, number: string, callback?: (error: null | Error) => void): Promise<null | Error>;
}
