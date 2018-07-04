import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import { service as remoteApiDeclaration } from "./apiDeclaration";
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
    /**
     * assert target dongle is connected
     *
     *  throws:
     *  (sip-library api client) SendRequestError
     *
     * */
    sendMessage(viaDongleImei: string, toNumber: string, text: string): Promise<types.SendMessageResult>;
    /**
     * assert target dongle is connected when calling this
     *
     * Return undefined if dongle disconnect while unlocking.
     *
     *  throws:
     *  (sip-library api client) SendRequestError
     *
     * */
    unlock(dongleImei: string, puk: string, newPin: string): Promise<types.UnlockResult | undefined>;
    unlock(dongleImei: string, pin: string): Promise<types.UnlockResult | undefined>;
    /**
     *
     *  throws:
     *  (sip-library api client) SendRequestError
     *
     * */
    getMessages(params: remoteApiDeclaration.getMessages.Params): Promise<(types.Message & {
        imsi: string;
    })[]>;
    /**
     *
     *  throws that can be anticipated:
     *  no dongle with imsi,
     *  phone number too long,
     *  no space left on SIM storage
     *
     *  throw that can't be anticipated:
     *  (sip-library api client) SendRequestError
     *  Modem disconnect
     *  Unexpected error
     *
     * */
    createContact(imsi: string, number: string, name: string): Promise<types.Sim.Contact>;
    /**
     *
     *  throws that can be anticipated:
     *  no dongle with imsi,
     *  new_number too long,
     *  no contact at index,
     *  new_name and new_number are both undefined
     *
     *  throw that can't be anticipated:
     *  (sip-library api client) SendRequestError
     *  Modem disconnect
     *  Unexpected error
     *
     * */
    updateContact(imsi: string, index: number, new_name: string | undefined, new_number: string | undefined): Promise<types.Sim.Contact>;
    /**
     *
     *  throws that can be anticipated:
     *  no dongle with imsi,
     *  no contact at index.
     *
     *  throw that can't be anticipated:
     *  (sip-library api client) SendRequestError
     *  Modem disconnect
     *  Unexpected error
     *
     * */
    deleteContact(imsi: string, index: number): Promise<void>;
    private static instance;
    static readonly hasInstance: boolean;
    static getInstance(): DongleController;
    static getInstance(host: string, port: number): DongleController;
}
export declare namespace DongleController {
    let log: any;
}
