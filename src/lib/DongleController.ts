import { Ami, amiApi } from "ts-ami";
import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { SyncEvent } from "ts-events-extended";
import * as misc from "./misc";
import * as api from "./apiDeclaration";

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

    public readonly dongles = new TrackableMap<string, types.Dongle>();
    public moduleConfiguration!: types.ModuleConfiguration;
    public readonly evtMessage = new SyncEvent<{
        dongle: types.Dongle.Usable;
        message: types.Message
    }>();
    public readonly evtStatusReport = new SyncEvent<{
        dongle: types.Dongle.Usable;
        statusReport: types.StatusReport;
    }>();

    public readonly evtDisconnect= new SyncEvent<Error | undefined>();

    public readonly initialization: Promise<void>;

    public readonly ami: Ami;

    private readonly apiClient: amiApi.Client;

    public constructor(asteriskManagerCredential?: Ami.Credential) {

        if (asteriskManagerCredential) {
            this.ami = new Ami(asteriskManagerCredential);
        } else {
            this.ami = new Ami(misc.amiUser);
        }

        this.apiClient= this.ami.createApiClient(api.id);

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
                        new Error("DongleExtended service is no longer usable")
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
                        "dongle": this.usableDongles.get(dongleImei)!,
                        message
                    });

                } else if (name === api.Events.statusReport.name) {

                    let { dongleImei, statusReport }: api.Events.statusReport.Data = event;

                    this.evtStatusReport.post({
                        "dongle": this.usableDongles.get(dongleImei)!,
                        statusReport
                    });

                }


            }
        );

    }

    public get isInitialized(): boolean { return !!this.moduleConfiguration; }

    public get lockedDongles() {

        let out = new Map<string, types.Dongle.Locked>();

        for (let [imei, dongle] of this.dongles) {

            if (!types.Dongle.Locked.match(dongle)) continue;

            out.set(imei, dongle);

        }

        return out;

    }

    public get usableDongles() {

        let out = new Map<string, types.Dongle.Usable>();

        for (let [imei, dongle] of this.dongles) {

            if (!types.Dongle.Usable.match(dongle)) continue;

            out.set(imei, dongle);

        }

        return out;

    }

    public async sendMessage(
        viaDongleImei: string,
        toNumber: string,
        text: string
    ): Promise<types.SendMessageResult> {

        if (!this.usableDongles.has(viaDongleImei)) {

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
    ): Promise<types.UnlockResult>;

    public unlock(
        dongleImei: string,
        pin: string
    ): Promise<types.UnlockResult>;

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

        let unlockResult: types.UnlockResult = await this.apiClient.makeRequest(api.unlock.method, params, 30000);

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
    ): Promise<types.Message[]> {

        let messagesRecord: api.getMessages.Response = await this.apiClient.makeRequest(
            api.getMessages.method,
            params
        );

        return messagesRecord[params.imsi] || [];

    }

}

