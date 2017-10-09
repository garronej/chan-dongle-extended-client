import { SyncEvent } from "ts-events-extended";
import { Ami } from "ts-ami";
import { TrackableMap } from "trackable-map";

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

        if (this.instance) return this.instance;

        this.instance = new this(asteriskManagerCredential);

        return this.instance;

    }

    public disconnect() {

        if (DongleController.instance === this) {
            DongleController.instance = undefined;
        }

        return this.ami.disconnect();

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

    public readonly ami: Ami;

    public readonly initialization: Promise<void>;

    public constructor(asteriskManagerCredential?: Ami.Credential) {

        if (asteriskManagerCredential) {
            this.ami = new Ami(asteriskManagerCredential);
        } else {
            this.ami = new Ami(_private.amiUser);
        }

        this.initialization = this.initialize();

    }

    private async initialize() {

        let initializationResponse: api.initialize.Response;

        try {

            initializationResponse = await this.ami.apiClient.makeRequest(api.initialize.method);

        } catch (error) {

            this.disconnect();

            throw error;

        }

        let { dongles, moduleConfiguration } = initializationResponse;

        for (let dongle of dongles) {
            this.dongles.set(dongle.imei, dongle);
        }

        this.moduleConfiguration = moduleConfiguration;

        this.ami.apiClient.evtEvent.attach(
            ({ name, event }) => {

                if (name === api.Events.updateMap.name) {

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

        let returnValue: api.sendMessage.Response = await this.ami.apiClient.makeRequest(
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

    public unlock(...inputs) {

        let [dongleImei, p2, p3] = inputs;

        if (!this.lockedDongles.has(dongleImei)) {

            throw new Error("This dongle is not currently locked");

        }

        let params: api.unlock.Params;

        if (p3) {

            params = { dongleImei, "puk": p2, "newPin": p3 };

        } else {

            params = { dongleImei, "pin": p2 };

        }

        return this.ami.apiClient.makeRequest(api.unlock.method, params, 30000);

    }

    public getMessages(
        params: api.getMessages.Params
    ): Promise<api.getMessages.Response> {

        return this.ami.apiClient.makeRequest(api.getMessages.method, params);

    }

}

export namespace DongleController {

    export type ModuleConfiguration = {
        general: typeof _private.defaultConfig['general'];
        defaults: typeof _private.defaultConfig['defaults'];
    };

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

    export type Phonebook = {
        infos: {
            contactNameMaxLength: number;
            numberMaxLength: number;
            storageLeft: number;
        };
        contacts: Contact[];
    };


    export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

    export type UnlockResult = UnlockResult.Success | UnlockResult.Failed;

    export namespace UnlockResult {

        export type Success = { success: true; };
        export type Failed = { success: false; pinState: LockedPinState; tryLeft: number; };

    }

    export interface LockedDongle {
        imei: string;
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
    }

    export interface ActiveDongle {
        imei: string;
        isVoiceEnabled?: boolean;
        sim: {
            iccid: string;
            imsi: string;
            number?: string;
            serviceProvider?: string;
            phonebook: Phonebook;
        }
    }

    export namespace ActiveDongle {
        export function match(dongle: Dongle): dongle is ActiveDongle {
            return !LockedDongle.match(dongle);
        }
    }

    export type Dongle = LockedDongle | ActiveDongle;

    export type Messages = { [imsi: string]: Message[] }

    export type SendMessageResult= { success: true; sentMessageId: number; } | { success: false; reason: "DISCONNECT" | "CANNOT SEND" };

}
