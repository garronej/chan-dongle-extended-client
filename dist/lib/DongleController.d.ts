import { Ami } from "ts-ami";
import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { SyncEvent } from "ts-events-extended";
import * as api from "./apiDeclaration";
export declare class DongleController {
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(asteriskManagerCredential?: Ami.Credential): DongleController;
    disconnect(error?: Error | undefined): Promise<void>;
    readonly dongles: TrackableMap<string, types.Dongle>;
    moduleConfiguration: types.ModuleConfiguration;
    readonly evtMessage: SyncEvent<{
        dongle: types.Dongle.Usable;
        message: types.Message;
    }>;
    readonly evtStatusReport: SyncEvent<{
        dongle: types.Dongle.Usable;
        statusReport: types.StatusReport;
    }>;
    readonly evtDisconnect: SyncEvent<Error | undefined>;
    readonly initialization: Promise<void>;
    readonly ami: Ami;
    private readonly apiClient;
    constructor(asteriskManagerCredential?: Ami.Credential);
    private initialize();
    readonly isInitialized: boolean;
    readonly lockedDongles: Map<string, types.Dongle.Locked>;
    readonly usableDongles: Map<string, types.Dongle.Usable>;
    sendMessage(viaDongleImei: string, toNumber: string, text: string): Promise<types.SendMessageResult>;
    unlock(dongleImei: string, puk: string, newPin: string): Promise<types.UnlockResult>;
    unlock(dongleImei: string, pin: string): Promise<types.UnlockResult>;
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
    }): Promise<types.Message[]>;
}
