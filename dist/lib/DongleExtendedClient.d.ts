import { Ami, Credential } from "ts-ami";
import { SyncEvent } from "ts-events-extended";
import { typesDef as t } from "./typesDef";
export declare const amiUser = "dongle_ext_user";
export declare class DongleExtendedClient {
    private static localClient;
    static localhost(): DongleExtendedClient;
    readonly ami: Ami;
    readonly evtActiveDongleDisconnect: SyncEvent<t.DongleActive>;
    readonly evtLockedDongleDisconnect: SyncEvent<t.LockedDongle>;
    readonly evtNewActiveDongle: SyncEvent<t.DongleActive>;
    readonly evtRequestUnlockCode: SyncEvent<t.LockedDongle>;
    readonly evtMessageStatusReport: SyncEvent<{
        imei: string;
    } & t.StatusReport>;
    readonly evtNewMessage: SyncEvent<{
        imei: string;
    } & t.Message>;
    readonly evtDongleConnect: SyncEvent<string>;
    readonly evtDongleDisconnect: SyncEvent<string>;
    constructor(credential: Credential);
    disconnect(): void;
    getContactName(imei: string, number: string): Promise<string | undefined>;
    static getNumberPayload(number: string): string | undefined;
    getConnectedDongles(): Promise<string[]>;
    getActiveDongle(imei: string): Promise<t.DongleActive | undefined>;
    getLockedDongles(): Promise<t.LockedDongle[]>;
    getActiveDongles(): Promise<t.DongleActive[]>;
    sendMessage(imei: string, number: string, text: string): Promise<number>;
    getSimPhonebook(imei: string): Promise<t.Phonebook>;
    createContact(imei: string, name: string, number: string): Promise<t.Contact>;
    getMessages(imei: string, flush: boolean): Promise<t.Message[]>;
    deleteContact(imei: string, index: number): Promise<void>;
    unlockDongle(imei: string, pin: string): Promise<void>;
    unlockDongle(imei: string, puk: string, newPin: string): Promise<void>;
    updateNumber(imei: string, number: string): Promise<void>;
    getConfig(): Promise<t.ModuleConfiguration>;
}
