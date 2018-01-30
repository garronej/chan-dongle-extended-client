import { SyncEvent } from "ts-events-extended";
import { Ami } from "ts-ami";
import { TrackableMap } from "trackable-map";
import { SimCountry } from "./utils";
import * as _private from "./private";
import api = _private.api;
export declare class DongleController {
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(asteriskManagerCredential?: Ami.Credential): DongleController;
    disconnect(error?: Error | undefined): Promise<void>;
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
    readonly evtDisconnect: SyncEvent<Error | undefined>;
    readonly initialization: Promise<void>;
    readonly ami: Ami;
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
    function isImsiWellFormed(imsi: string): boolean;
    function isImeiWellFormed(imei: string): boolean;
    function isIccidWellFormed(iccid: string): boolean;
    type ModuleConfiguration = {
        general: typeof _private.defaultConfig['general'];
        defaults: typeof _private.defaultConfig['defaults'];
    };
    type StatusReport = {
        sendDate: Date;
        dischargeDate: Date;
        isDelivered: boolean;
        status: string;
        recipient: string;
    };
    type Message = {
        number: string;
        date: Date;
        text: string;
    };
    type Contact = {
        readonly index: number;
        readonly name: {
            readonly asStored: string;
            full: string;
        };
        readonly number: {
            readonly asStored: string;
            localFormat: string;
        };
    };
    namespace Contact {
        function sanityCheck(o: Contact): boolean;
    }
    type SimStorage = {
        number?: {
            readonly asStored: string;
            localFormat: string;
        };
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
        digest: string;
    };
    namespace SimStorage {
        function sanityCheck(o: SimStorage): boolean;
        function computeDigest(number: string | undefined, storageLeft: number, contacts: Contact[]): string;
    }
    type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";
    namespace LockedPinState {
        function sanityCheck(o: LockedPinState): boolean;
    }
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
        function sanityCheck(o: UnlockResult): boolean;
    }
    interface LockedDongle {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        sim: {
            iccid?: string;
            pinState: LockedPinState;
            tryLeft: number;
        };
    }
    namespace LockedDongle {
        function match(dongle: Dongle): dongle is LockedDongle;
        function sanityCheck(o: LockedDongle): boolean;
    }
    interface ActiveDongle {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        isVoiceEnabled?: boolean;
        sim: {
            iccid: string;
            imsi: string;
            country?: SimCountry;
            serviceProvider: {
                fromImsi?: string;
                fromNetwork?: string;
            };
            storage: SimStorage;
        };
    }
    namespace ActiveDongle {
        function match(dongle: Dongle): dongle is ActiveDongle;
        function sanityCheck(o: ActiveDongle): boolean;
    }
    type Dongle = LockedDongle | ActiveDongle;
    namespace Dongle {
        function sanityCheck(o: Dongle): boolean;
    }
    type SendMessageResult = {
        success: true;
        sendDate: Date;
    } | {
        success: false;
        reason: "DISCONNECT" | "CANNOT SEND";
    };
}
