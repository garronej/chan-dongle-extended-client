import { SyncEvent } from "ts-events-extended";
import { Ami, amiApi } from "ts-ami";
import { TrackableMap } from "trackable-map";
import * as md5 from "md5";
import { SimCountry } from "./utils";

import * as _private from "./private";
import api= _private.api;

export class DongleController {

    private static instance: DongleController | undefined = undefined;

    public static get hasInstance(): boolean {
        return !!this.instance;
    }

    public static getInstance(
        asteriskManagerCredential?: Ami.Credential
    ): DongleController {

        if (this.instance){
             return this.instance;
        }

        this.instance = new this(asteriskManagerCredential);

        return this.instance;

    }

    public disconnect(error?: Error | undefined ) {

        if (DongleController.instance === this) {
            DongleController.instance = undefined;
        }

        let prDisconnect= this.ami.disconnect();

        this.evtDisconnect.post(error);

        return prDisconnect;

    }


    public readonly dongles = new TrackableMap<string, DongleController.Dongle>();
    public moduleConfiguration: DongleController.ModuleConfiguration;
    public readonly evtMessage = new SyncEvent<{
        dongle: DongleController.ActiveDongle;
        message: DongleController.Message
    }>();
    public readonly evtStatusReport = new SyncEvent<{
        dongle: DongleController.ActiveDongle;
        statusReport: DongleController.StatusReport;
    }>();

    public readonly evtDisconnect= new SyncEvent<Error | undefined>();

    public readonly initialization: Promise<void>;

    public readonly ami: Ami;

    private readonly apiClient: amiApi.Client;

    public constructor(asteriskManagerCredential?: Ami.Credential) {

        if (asteriskManagerCredential) {
            this.ami = new Ami(asteriskManagerCredential);
        } else {
            this.ami = new Ami(_private.amiUser);
        }

        this.apiClient= this.ami.createApiClient(DongleController.apiId);

        this.initialization = this.initialize();

    }


    private async initialize() {

        let initializationResponse: api.initialize.Response;

        try {

            initializationResponse = await this.apiClient.makeRequest(api.initialize.method);

        } catch (error) {

            error.message= `DongleController initialization error: ${error.message}`;

            this.disconnect(error);

            throw error;

        }

        let { dongles, moduleConfiguration, serviceUpSince } = initializationResponse;

        for (let dongle of dongles) {
            this.dongles.set(dongle.imei, dongle);
        }

        this.moduleConfiguration = moduleConfiguration;

        let evtPeriodicalSignal = new SyncEvent<number>();

        (async () => {

            while (true) {

                let newUpSince: number | undefined = undefined;

                try {

                    newUpSince = await evtPeriodicalSignal.waitFor(
                        api.Events.periodicalSignal.interval + 4000
                    );

                } catch{ }

                if (newUpSince !== serviceUpSince) {

                    this.disconnect(
                        new Error("DongleExtended service is no longer active")
                    );

                    return;

                }

            }

        })();

        this.apiClient.evtEvent.attach(
            ({ name, event }) => {

                if (name === api.Events.periodicalSignal.name) {

                    let { serviceUpSince }: api.Events.periodicalSignal.Data = event;

                    evtPeriodicalSignal.post(serviceUpSince);

                } else if (name === api.Events.updateMap.name) {

                    let { dongleImei, dongle }: api.Events.updateMap.Data = event;

                    if (!dongle) {
                        this.dongles.delete(dongleImei);
                    } else {
                        this.dongles.set(dongleImei, dongle);
                    }

                } else if (name === api.Events.message.name) {

                    let { dongleImei, message }: api.Events.message.Data = event;

                    this.evtMessage.post({
                        "dongle": this.activeDongles.get(dongleImei)!,
                        message
                    });

                } else if (name === api.Events.statusReport.name) {

                    let { dongleImei, statusReport }: api.Events.statusReport.Data = event;

                    this.evtStatusReport.post({
                        "dongle": this.activeDongles.get(dongleImei)!,
                        statusReport
                    });

                }


            }
        );

    }

    public get isInitialized(): boolean { return !!this.moduleConfiguration; }

    public get lockedDongles() {

        let out = new Map<string, DongleController.LockedDongle>();

        for (let [imei, dongle] of this.dongles) {

            if (!DongleController.LockedDongle.match(dongle)) continue;

            out.set(imei, dongle);

        }

        return out;

    }

    public get activeDongles() {

        let out = new Map<string, DongleController.ActiveDongle>();

        for (let [imei, dongle] of this.dongles) {

            if (!DongleController.ActiveDongle.match(dongle)) continue;

            out.set(imei, dongle);

        }

        return out;

    }

    public async sendMessage(
        viaDongleImei: string,
        toNumber: string,
        text: string
    ): Promise<DongleController.SendMessageResult> {

        if (!this.activeDongles.has(viaDongleImei)) {

            throw new Error("This dongle is not currently connected");

        }

        let params: api.sendMessage.Params = { viaDongleImei, toNumber, text };

        let returnValue: api.sendMessage.Response = await this.apiClient.makeRequest(
            api.sendMessage.method,
            params,
            240000
        );

        return returnValue;

    }

    public unlock(
        dongleImei: string,
        puk: string,
        newPin: string
    ): Promise<DongleController.UnlockResult>;

    public unlock(
        dongleImei: string,
        pin: string
    ): Promise<DongleController.UnlockResult>;

    public async unlock(...inputs) {

        let [dongleImei, p2, p3] = inputs;

        let dongle = this.lockedDongles.get(dongleImei);

        if (!dongle) {

            throw new Error("This dongle is not currently locked");

        }

        let params: api.unlock.Params;

        if (p3) {

            params = { dongleImei, "puk": p2, "newPin": p3 };

        } else {

            params = { dongleImei, "pin": p2 };

        }

        let unlockResult: DongleController.UnlockResult = await this.apiClient.makeRequest(api.unlock.method, params, 30000);

        if (!unlockResult.success) {

            dongle.sim.pinState = unlockResult.pinState;
            dongle.sim.tryLeft = unlockResult.tryLeft;

        }

        return unlockResult;

    }

    public getMessages(
        params: { fromDate?: Date; toDate?: Date; flush?: boolean; }
    ): Promise<api.getMessages.Response> {

        return this.apiClient.makeRequest(
            api.getMessages.method,
            params
        );

    }

    public async getMessagesOfSim(
        params: { imsi: string; fromDate?: Date; toDate?: Date; flush?: boolean; }
    ): Promise<DongleController.Message[]> {

        let messagesRecord: api.getMessages.Response = await this.apiClient.makeRequest(
            api.getMessages.method,
            params
        );

        return messagesRecord[params.imsi] || [];

    }


}

export namespace DongleController {

    export const apiId = "dongle-extended";

    export function isImsiWellFormed(imsi: string) {
        return typeof imsi === "string" && imsi.match(/^[0-9]{15}$/) !== null;
    }

    export function isImeiWellFormed(imei: string) {
        return isImsiWellFormed(imei);
    }

    export function isIccidWellFormed(iccid: string) {
        return typeof iccid === "string" && iccid.match(/^[0-9]{6,22}$/) !== null;
    }

    export type ModuleConfiguration = {
        general: typeof _private.defaultConfig['general'];
        defaults: typeof _private.defaultConfig['defaults'];
    };

    export type StatusReport = {
        sendDate: Date;
        dischargeDate: Date;
        isDelivered: boolean;
        status: string;
        recipient: string;
    };

    export type Message = {
        number: string;
        date: Date;
        text: string;
    };

    export type Contact = {
        readonly index: number;
        readonly name: {
            readonly asStored: string;
            full: string;
        };
        readonly number: {
            readonly asStored: string;
            localFormat: string;
        };
    }

    export namespace Contact {

        export function sanityCheck(o: Contact): boolean {

            return (
                o instanceof Object &&
                typeof o.index === "number" &&
                o.name instanceof Object &&
                typeof o.name.asStored === "string" &&
                typeof o.name.full === "string" &&
                o.number instanceof Object &&
                typeof o.number.asStored === "string" &&
                typeof o.number.localFormat === "string"
            );

        }

    }

    export type SimStorage = {
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

    export namespace SimStorage {

        export function sanityCheck(o: SimStorage): boolean {

            if (!(
                o instanceof Object && (
                    o.number === undefined || (
                        o.number instanceof Object &&
                        typeof o.number.asStored === "string" &&
                        typeof o.number.localFormat === "string"
                    )
                ) &&
                o.infos instanceof Object &&
                o.contacts instanceof Array
            )) return false;

            let { infos, contacts } = o;

            if (!(
                typeof infos.contactNameMaxLength === "number" &&
                typeof infos.numberMaxLength === "number" &&
                typeof infos.storageLeft === "number"
            )) return false;

            for (let contact of contacts) {

                if (!Contact.sanityCheck(contact)) {
                    return false;
                }

            }

            return true;

        }

        export function computeDigest(
            number: string | undefined,
            storageLeft: number,
            contacts: Contact[]
        ): string {

            let strArr = contacts
                .sort((c1, c2) => c1.index - c2.index)
                .map(c => `${c.index}${c.name.asStored}${c.number.asStored}`);

            strArr.push(`${number}`);
            strArr.push(`${storageLeft}`);

            return md5(strArr.join(""));

        }


    }

    export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

    export namespace LockedPinState {

        export function sanityCheck(o: LockedPinState): boolean {
            return (
                typeof o === "string" &&
                (
                    o === "SIM PIN" ||
                    o === "SIM PUK" ||
                    o === "SIM PIN2" ||
                    o === "SIM PUK2"
                )
            );
        }

    }

    export type UnlockResult = UnlockResult.Success | UnlockResult.Failed;

    export namespace UnlockResult {

        export type Success = { success: true; };
        export type Failed = { success: false; pinState: LockedPinState; tryLeft: number; };

        export function sanityCheck(o: UnlockResult): boolean {

            if (!(
                o instanceof Object &&
                typeof o.success === "boolean"
            )) return false;

            if (o.success) {

                return true;

            } else {

                return (
                    LockedPinState.sanityCheck(o.pinState) &&
                    typeof o.tryLeft === "number"
                );

            }

        }

    }

    export interface LockedDongle {
        imei: string;
        manufacturer: string;
        model: string;
        firmwareVersion: string;
        sim: {
            iccid?: string;
            pinState: LockedPinState;
            tryLeft: number;
        }
    }

    export namespace LockedDongle {

        export function match(dongle: Dongle): dongle is LockedDongle {
            return (dongle.sim as LockedDongle['sim']).pinState !== undefined;
        }

        export function sanityCheck(o: LockedDongle): boolean {

            return (
                o instanceof Object &&
                isImeiWellFormed(o.imei) &&
                typeof o.manufacturer === "string" &&
                typeof o.model === "string" &&
                typeof o.firmwareVersion === "string" &&
                o.sim instanceof Object &&
                (
                    (
                        o.sim.iccid === undefined ||
                        isIccidWellFormed(o.sim.iccid)
                    ) &&
                    LockedPinState.sanityCheck(o.sim.pinState) &&
                    typeof o.sim.tryLeft === "number"
                )
            );

        }
    }

    export interface ActiveDongle {
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
            },
            storage: SimStorage;
        }
    }

    export namespace ActiveDongle {

        export function match(dongle: Dongle): dongle is ActiveDongle {
            return !LockedDongle.match(dongle);
        }

        export function sanityCheck(o: ActiveDongle): boolean {

            return (
                o instanceof Object &&
                isImeiWellFormed(o.imei) &&
                typeof o.manufacturer === "string" &&
                typeof o.model === "string" &&
                typeof o.firmwareVersion === "string" &&
                (
                    typeof o.isVoiceEnabled === "boolean" ||
                    o.isVoiceEnabled === undefined
                ) &&
                o.sim instanceof Object &&
                isIccidWellFormed(o.sim.iccid) &&
                isImsiWellFormed(o.sim.imsi) &&
                SimCountry.sanityCheck(o.sim.country) &&
                (
                    typeof o.sim.serviceProvider.fromImsi === "string" ||
                    o.sim.serviceProvider.fromImsi === undefined
                ) && (
                    typeof o.sim.serviceProvider.fromNetwork === "string" ||
                    o.sim.serviceProvider.fromNetwork === undefined
                ) &&
                SimStorage.sanityCheck(o.sim.storage)
            );

        }

    }

    export type Dongle = LockedDongle | ActiveDongle;

    export namespace Dongle {

        export function sanityCheck(o: Dongle): boolean {

            return (
                LockedDongle.sanityCheck(o as LockedDongle) ||
                ActiveDongle.sanityCheck(o as ActiveDongle)
            );

        }

    }

    export type SendMessageResult =
        {
            success: true;
            sendDate: Date;
        } | {
            success: false;
            reason: "DISCONNECT" | "CANNOT SEND"
        };

}
