import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
export declare class DongleController {
    readonly dongles: TrackableMap<string, types.Dongle>;
    staticModuleConfiguration: types.StaticModuleConfiguration;
    readonly evtMessage: SyncEvent<{
        dongle: types.Dongle.Usable;
        message: types.Message;
        submitShouldSave(prShouldSave: Promise<"SAVE MESSAGE" | "DO NOT SAVE MESSAGE">): void;
    }>;
    readonly evtStatusReport: SyncEvent<{
        dongle: types.Dongle.Usable;
        statusReport: types.StatusReport;
    }>;
    /** evtData is hasError */
    readonly evtClose: VoidSyncEvent;
    /** post isSuccess */
    private readonly evtInitializationCompleted;
    /** resolve when instance ready to be used; reject if initialization fail */
    readonly prInitialization: Promise<void>;
    readonly isInitialized: boolean;
    private readonly socket;
    constructor(host: string, port: number);
    destroy(): void;
    private sendApiRequest<Params, Response>(methodName, params);
    private makeLocalApiHandlers();
    readonly lockedDongles: Map<string, types.Dongle.Locked>;
    readonly usableDongles: Map<string, types.Dongle.Usable>;
    /** assert target dongle is connected */
    sendMessage(viaDongleImei: string, toNumber: string, text: string): Promise<types.SendMessageResult>;
    /** assert target dongle is connected when calling this */
    unlock(dongleImei: string, puk: string, newPin: string): Promise<types.UnlockResult>;
    unlock(dongleImei: string, pin: string): Promise<types.UnlockResult>;
    getMessages(params: {
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    }): Promise<(types.Message & {
        imsi: string;
    })[]>;
    getMessagesOfSim(params: {
        imsi: string;
        fromDate?: Date;
        toDate?: Date;
        flush?: boolean;
    }): Promise<types.Message[]>;
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(): DongleController;
    static getInstance(host: string, port: number): DongleController;
}
export declare namespace DongleController {
    let log: any;
}
