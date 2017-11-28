import { SyncEvent } from "ts-events-extended";
import { Ami } from "ts-ami";
import { TrackableMap } from "trackable-map";
import * as _private from "./private";
import api = _private.api;
export declare class DongleController {
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(asteriskManagerCredential?: Ami.Credential): DongleController;
    disconnect(): Promise<void>;
    readonly dongles: TrackableMap<string, DongleController.Dongle>;
    moduleConfiguration: DongleController.ModuleConfiguration;
    readonly evtMessage: SyncEvent<{
        dongle: DongleController.ActiveDongle;
        message: DongleController.Message;
    }>;
    readonly evtStatusReport: SyncEvent<{
        dongle: DongleController.ActiveDongle;
        statusReport: DongleController.StatusReport;
    }>;
    readonly ami: Ami;
    readonly initialization: Promise<void>;
    private readonly apiClient;
    constructor(asteriskManagerCredential?: Ami.Credential);
    private initialize();
    readonly isInitialized: boolean;
    readonly lockedDongles: Map<string, DongleController.LockedDongle>;
    readonly activeDongles: Map<string, DongleController.ActiveDongle>;
    sendMessage(viaDongleImei: string, toNumber: string, text: string): Promise<DongleController.SendMessageResult>;
    unlock(dongleImei: string, puk: string, newPin: string): Promise<DongleController.UnlockResult>;
    unlock(dongleImei: string, pin: string): Promise<DongleController.UnlockResult>;
    getMessages(params: {
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    }): Promise<api.getMessages.Response>;
    getMessagesOfSim(params: {
        imsi: string;
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    }): Promise<DongleController.Message[]>;
}
export declare namespace DongleController {
    const apiId = "dongle-extended";
    type ModuleConfiguration = {
        general: typeof _private.defaultConfig['general'];
        defaults: typeof _private.defaultConfig['defaults'];
    };
    interface StatusReport {
        sendDate: Date;
        dischargeDate: Date;
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
    type Phonebook = {
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
    };
    type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
    type UnlockResult = UnlockResult.Success | UnlockResult.Failed;
    namespace UnlockResult {
        type Success = {
            success: true;
        };
        type Failed = {
            success: false;
            pinState: LockedPinState;
            tryLeft: number;
        };
    }
    interface LockedDongle {
        imei: string;
        sim: {
            iccid?: string;
            pinState: LockedPinState;
            tryLeft: number;
        };
    }
    namespace LockedDongle {
        function match(dongle: Dongle): dongle is LockedDongle;
    }
    interface ActiveDongle {
        imei: string;
        isVoiceEnabled?: boolean;
        sim: {
            iccid: string;
            imsi: string;
            number?: string;
            serviceProvider?: string;
            phonebook: Phonebook;
        };
    }
    namespace ActiveDongle {
        function match(dongle: Dongle): dongle is ActiveDongle;
    }
    type Dongle = LockedDongle | ActiveDongle;
    type SendMessageResult = {
        success: true;
        sendDate: Date;
    } | {
        success: false;
        reason: "DISCONNECT" | "CANNOT SEND";
    };
}
