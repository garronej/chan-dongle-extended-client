import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { SyncEvent, VoidSyncEvent } from "ts-events-extended";
import * as net from "net";
import { 
    controller as localApiDeclaration, 
    service as remoteApiDeclaration 
} from "./apiDeclaration";
import * as sipLibrary from "ts-sip";
import * as misc from "./misc";

export class DongleController {

    public readonly dongles = new TrackableMap<string, types.Dongle>();

    public staticModuleConfiguration!: types.StaticModuleConfiguration;

    public readonly evtMessage = new SyncEvent<{
        dongle: types.Dongle.Usable;
        message: types.Message;
        submitShouldSave(prShouldSave: Promise<"SAVE MESSAGE" | "DO NOT SAVE MESSAGE">): void;
    }>();

    public readonly evtStatusReport = new SyncEvent<{
        dongle: types.Dongle.Usable;
        statusReport: types.StatusReport;
    }>();

    /** evtData is hasError */
    public readonly evtClose = new VoidSyncEvent();

    /** post isSuccess */
    private readonly evtInitializationCompleted = new SyncEvent<boolean>();

    /** resolve when instance ready to be used; reject if initialization fail */
    public readonly prInitialization = new Promise<void>(
        (resolve, reject) => {

            let error = new Error("DongleController initialization error");

            this.evtInitializationCompleted.waitFor(3 * 1000)
                .then(isSuccess => isSuccess ? resolve() : reject(error))
                .catch(() => reject(error))
                ;

        }
    );

    public get isInitialized(): boolean {
        return !!this.evtInitializationCompleted.postCount
    }

    private readonly socket: sipLibrary.Socket;

    public constructor(
        host: string,
        port: number
    ) {

        this.socket = new sipLibrary.Socket(
            net.connect({ host, port })
        );

        (new sipLibrary.api.Server(this.makeLocalApiHandlers()))
            .startListening(this.socket);

        sipLibrary.api.client.enableKeepAlive(
            this.socket, 5 * 1000
        );

        sipLibrary.api.client.enableErrorLogging(this.socket,
            sipLibrary.api.client.getDefaultErrorLogger({
                "idString": "DongleController",
                "log": DongleController.log
            })
        );

        this.socket.evtClose.attachOnce(() => {

            if (!this.evtInitializationCompleted.postCount) {
                this.evtInitializationCompleted.post(false);
            }

            this.evtClose.post()

        });

    }

    public destroy(): void {
        this.socket.destroy();
    }

    private async sendApiRequest<Params, Response>(
        methodName: string,
        params: Params
    ): Promise<Response> {

        try {

            return await sipLibrary.api.client.sendRequest<Params, Response>(
                this.socket, methodName, params
            );

        } catch{

            return new Promise<any>(resolve => { });

        }

    }

    private makeLocalApiHandlers(): sipLibrary.api.Server.Handlers {

        const handlers: sipLibrary.api.Server.Handlers = {};

        (() => {

            const methodName = localApiDeclaration.notifyCurrentState.methodName;
            type Params = localApiDeclaration.notifyCurrentState.Params;

            let handler: sipLibrary.api.Server.Handler<Params, undefined> = {
                "handler": ({ staticModuleConfiguration, dongles }) => {

                    for (let dongle of dongles) {
                        this.dongles.set(dongle.imei, dongle);
                    }

                    this.staticModuleConfiguration = staticModuleConfiguration;

                    this.evtInitializationCompleted.post(true);

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        })();

        (() => {

            const methodName = localApiDeclaration.updateMap.methodName;
            type Params = localApiDeclaration.updateMap.Params;
            type Response = localApiDeclaration.updateMap.Response;

            let handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, dongle }) => {

                    if (!dongle) {
                        this.dongles.delete(dongleImei);
                    } else {
                        this.dongles.set(dongleImei, dongle);
                    }

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        })();

        (() => {

            const methodName = localApiDeclaration.notifyMessage.methodName;
            type Params = localApiDeclaration.notifyMessage.Params;
            type Response = localApiDeclaration.notifyMessage.Response;

            let handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, message }) => {

                    let pr= new Promise<Response>(resolve=> resolve("SAVE MESSAGE"));

                    this.evtMessage.post({
                        "dongle": this.usableDongles.get(dongleImei)!,
                        message,
                        "submitShouldSave": (prShouldSave)=> pr= prShouldSave
                    });

                    return pr;

                }
            };

            handlers[methodName] = handler;

        })();

        (() => {

            const methodName = localApiDeclaration.notifyStatusReport.methodName;
            type Params = localApiDeclaration.notifyStatusReport.Params;
            type Response = localApiDeclaration.notifyStatusReport.Response;

            let handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, statusReport }) => {

                    this.evtStatusReport.post({
                        "dongle": this.usableDongles.get(dongleImei)!,
                        statusReport
                    });

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        })();

        return handlers;

    }


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

    /** assert target dongle is connected */
    public sendMessage(
        viaDongleImei: string,
        toNumber: string,
        text: string
    ): Promise<types.SendMessageResult> {

        const methodName = remoteApiDeclaration.sendMessage.methodName;
        type Params = remoteApiDeclaration.sendMessage.Params;
        type Response = remoteApiDeclaration.sendMessage.Response;

        return this.sendApiRequest<Params, Response>(
            methodName,
            { viaDongleImei, toNumber, text }
        );

    }

    /** assert target dongle is connected when calling this */
    public unlock(dongleImei: string, puk: string, newPin: string): Promise<types.UnlockResult>;
    public unlock(dongleImei: string, pin: string): Promise<types.UnlockResult>;
    public async unlock(...inputs) {

        let [dongleImei, p2, p3] = inputs;

        let dongle = this.lockedDongles.get(dongleImei);

        const methodName = remoteApiDeclaration.unlock.methodName;
        type Params = remoteApiDeclaration.unlock.Params;
        type Response = remoteApiDeclaration.unlock.Response;

        let params: Params = (!!p3) ?
            ({ dongleImei, "puk": p2, "newPin": p3 }) : ({ dongleImei, "pin": p2 });

        let unlockResult = await this.sendApiRequest<Params, Response>(
            methodName, params
        );

        if (unlockResult && !unlockResult.success) {

            if (dongle) {

                dongle.sim.pinState = unlockResult.pinState;
                dongle.sim.tryLeft = unlockResult.tryLeft;

            }

        }

        return unlockResult;

    }

    public getMessages(
        params: { fromDate?: Date; toDate?: Date; flush?: boolean; }
    ) {

        const methodName = remoteApiDeclaration.getMessages.methodName;
        type Params = remoteApiDeclaration.getMessages.Params;
        type Response = remoteApiDeclaration.getMessages.Response;

        return this.sendApiRequest<Params, Response>(
            methodName, params
        );

    }

    public async getMessagesOfSim(
        params: { imsi: string; fromDate?: Date; toDate?: Date; flush?: boolean; }
    ): Promise<types.Message[]> {

        const methodName = remoteApiDeclaration.getMessages.methodName;
        type Params = remoteApiDeclaration.getMessages.Params;
        type Response = remoteApiDeclaration.getMessages.Response;

        let messagesRecord = await this.sendApiRequest<Params, Response>(
            methodName, params
        );

        return messagesRecord[params.imsi] || [];

    }

    //Static

    private static instance: DongleController | undefined = undefined;

    public static get hasInstance(): boolean {
        return !!this.instance;
    }

    public static getInstance(): DongleController;
    public static getInstance(host: string, port: number): DongleController;
    public static getInstance(host?: string, port?: number): DongleController {

        if (!!this.instance) {
            return this.instance;
        }

        this.instance = new DongleController( host || "127.0.0.1", port || misc.port);

        this.instance.socket.evtClose.attachOncePrepend(
            () => this.instance = undefined
        );

        return this.instance;

    }

}

export namespace DongleController {

    export let log = console.log.bind(console);

}
