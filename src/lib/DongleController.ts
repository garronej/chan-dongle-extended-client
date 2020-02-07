import { TrackableMap } from "trackable-map";
import * as types from "./types";
import { Evt, VoidEvt } from "ts-evt";
import * as net from "net";
import { 
    controller as localApiDeclaration, 
    service as remoteApiDeclaration 
} from "./apiDeclaration";
import * as sipLibrary from "ts-sip";
import * as misc from "./misc";

export class DongleController {

    public readonly dongles = new TrackableMap<string, types.Dongle>();

    public readonly evtGsmConnectivityChange = new Evt<{ dongle: types.Dongle.Usable }>();

    public readonly evtCellSignalStrengthChange = new Evt<{
        dongle: types.Dongle.Usable;
        previousCellSignalStrength: types.Dongle.Usable.CellSignalStrength;
    }>();

    public staticModuleConfiguration!: types.StaticModuleConfiguration;

    public readonly evtMessage = new Evt<{
        dongle: types.Dongle.Usable;
        message: types.Message;
        submitShouldSave(prShouldSave: Promise<"SAVE MESSAGE" | "DO NOT SAVE MESSAGE">): void;
    }>();

    public readonly evtStatusReport = new Evt<{
        dongle: types.Dongle.Usable;
        statusReport: types.StatusReport;
    }>();

    public readonly evtClose = new VoidEvt();

    /** post isSuccess */
    private readonly evtInitializationCompleted = new Evt<boolean>();

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
            net.connect({ host, port }),
            true
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

        {

            const { methodName } = localApiDeclaration.notifyCurrentState;
            type Params = localApiDeclaration.notifyCurrentState.Params;
            type Response = localApiDeclaration.notifyCurrentState.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
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

        }

        {

            const { methodName } = localApiDeclaration.updateMap;
            type Params = localApiDeclaration.updateMap.Params;
            type Response = localApiDeclaration.updateMap.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
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

        }

        {

            const { methodName } = localApiDeclaration.notifyMessage;
            type Params = localApiDeclaration.notifyMessage.Params;
            type Response = localApiDeclaration.notifyMessage.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, message }) => {

                    let pr = new Promise<Response>(resolve => resolve("SAVE MESSAGE"));

                    this.evtMessage.post({
                        "dongle": this.usableDongles.get(dongleImei)!,
                        message,
                        "submitShouldSave": (prShouldSave) => pr = prShouldSave
                    });

                    return pr;

                }
            };

            handlers[methodName] = handler;

        }

        {

            const { methodName } = localApiDeclaration.notifyStatusReport;
            type Params = localApiDeclaration.notifyStatusReport.Params;
            type Response = localApiDeclaration.notifyStatusReport.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, statusReport }) => {

                    this.evtStatusReport.post({
                        "dongle": this.usableDongles.get(dongleImei)!,
                        statusReport
                    });

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        }

        {

            const { methodName } = localApiDeclaration.notifyGsmConnectivityChange;
            type Params = localApiDeclaration.notifyGsmConnectivityChange.Params;
            type Response = localApiDeclaration.notifyGsmConnectivityChange.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei }) => {

                    const dongle = this.usableDongles.get(dongleImei)!;

                    dongle.isGsmConnectivityOk = !dongle.isGsmConnectivityOk;

                    this.evtGsmConnectivityChange.post({dongle});

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        }

        {

            const { methodName } = localApiDeclaration.notifyCellSignalStrengthChange;
            type Params = localApiDeclaration.notifyCellSignalStrengthChange.Params;
            type Response = localApiDeclaration.notifyCellSignalStrengthChange.Response;

            const handler: sipLibrary.api.Server.Handler<Params, Response> = {
                "handler": ({ dongleImei, cellSignalStrength }) => {

                    const dongle = this.usableDongles.get(dongleImei)!;

                    const previousCellSignalStrength= dongle.cellSignalStrength;

                    dongle.cellSignalStrength = cellSignalStrength;

                    this.evtCellSignalStrengthChange.post({ dongle, previousCellSignalStrength });

                    return Promise.resolve(undefined);

                }
            };

            handlers[methodName] = handler;

        }

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

    /** 
     * assert target dongle is connected 
     * 
     *  throws: 
     *  (sip-library api client) SendRequestError
     * 
     * */
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

    /** 
     * assert target dongle is connected when calling this 
     * 
     * Return undefined if dongle disconnect while unlocking.
     * 
     *  throws: 
     *  (sip-library api client) SendRequestError
     * 
     * */
    public unlock(dongleImei: string, puk: string, newPin: string): Promise<types.UnlockResult | undefined>;
    public unlock(dongleImei: string, pin: string): Promise<types.UnlockResult | undefined>;
    public async unlock(...inputs): Promise<types.UnlockResult | undefined> {

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

    /** 
     * 
     *  throws that can be anticipated: 
     *  no dongle with imsi, 
     * 
     *  throw that can't be anticipated:
     *  (sip-library api client) SendRequestError
     * 
     * */
    public async rebootDongle(imei: string): Promise<void> {

        const methodName = remoteApiDeclaration.rebootDongle.methodName;
        type Params = remoteApiDeclaration.rebootDongle.Params;
        type Response = remoteApiDeclaration.rebootDongle.Response;

        if (!this.dongles.has(imei)) {

            throw new Error(`Dongle imei: ${imei} is not currently connected`);

        }

        await this.sendApiRequest<Params, Response>(
            methodName, { imei }
        );


    }


    /** 
     * 
     *  throws: 
     *  (sip-library api client) SendRequestError
     * 
     * */
    public getMessages(params: remoteApiDeclaration.getMessages.Params) {

        const methodName = remoteApiDeclaration.getMessages.methodName;
        type Params = remoteApiDeclaration.getMessages.Params;
        type Response = remoteApiDeclaration.getMessages.Response;

        return this.sendApiRequest<Params, Response>(
            methodName, params
        );

    }

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
    public async createContact(
        imsi: string,
        number: string,
        name: string
    ): Promise<types.Sim.Contact> {

        const methodName = remoteApiDeclaration.createContact.methodName;
        type Params = remoteApiDeclaration.createContact.Params;
        type Response = remoteApiDeclaration.createContact.Response;


        const dongle = Array.from(this.usableDongles.values())
            .find(({ sim }) => sim.imsi === imsi)
            ;

        if (!dongle) {

            throw new Error(`No dongle with SIM imsi: ${imsi}`);

        }

        if (number.length > dongle.sim.storage.infos.numberMaxLength) {

            throw new Error(`Phone number too long`);

        }

        if (dongle.sim.storage.infos.storageLeft === 0) {

            throw new Error("No space left on SIM internal storage");

        }

        const resp = await this.sendApiRequest<Params, Response>(
            methodName, { imsi, number, name }
        );

        if (resp.isSuccess) {

            dongle.sim.storage.infos.storageLeft--;

            dongle.sim.storage.contacts.push(resp.contact);

            misc.updateStorageDigest(dongle.sim.storage);

        } else {

            throw new Error("Dongle disconnect or unexpected error");

        }

        return resp.contact;

    }

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
    public async updateContact(
        imsi: string,
        index: number,
        new_name: string | undefined,
        new_number: string | undefined
    ): Promise<types.Sim.Contact> {

        const methodName = remoteApiDeclaration.updateContact.methodName;
        type Params = remoteApiDeclaration.updateContact.Params;
        type Response = remoteApiDeclaration.updateContact.Response;

        if (new_name === undefined && new_number === undefined) {
            throw new Error("New name and new number can't be both undefined");
        }

        const dongle = Array.from(this.usableDongles.values())
            .find(({ sim }) => sim.imsi === imsi)
            ;

        if (!dongle) {

            throw new Error(`No dongle with SIM imsi: ${imsi}`);

        }

        if (
            new_number !== undefined &&
            new_number.length > dongle.sim.storage.infos.numberMaxLength
        ) {

            throw new Error(`Phone number too long`);

        }

        const updated_contact = dongle.sim.storage.contacts
            .find(c => c.index === index)
            ;

        if (!updated_contact) {

            throw new Error(`There is no contact at index: ${index} in SIM`);

        }

        const resp = await this.sendApiRequest<Params, Response>(
            methodName, { imsi, index, new_name, new_number }
        );

        if (resp.isSuccess) {

            updated_contact.name = resp.contact.name;
            updated_contact.number = resp.contact.number;

            misc.updateStorageDigest(dongle.sim.storage);

        } else {

            throw new Error("Dongle disconnect or unexpected error");

        }

        return resp.contact;

    }

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
    public async deleteContact(imsi: string, index: number): Promise<void> {

        const methodName = remoteApiDeclaration.deleteContact.methodName;
        type Params = remoteApiDeclaration.deleteContact.Params;
        type Response = remoteApiDeclaration.deleteContact.Response;

        const dongle = Array.from(this.usableDongles.values())
            .find(({ sim }) => sim.imsi === imsi)
            ;

        if (!dongle) {

            throw new Error(`No dongle with SIM imsi: ${imsi}`);

        }

        const contact_to_delete = dongle.sim.storage.contacts
            .find(c => c.index === index)
            ;

        if (!contact_to_delete) {

            throw new Error(`There is no contact at index: ${index} in SIM`);

        }

        const resp = await this.sendApiRequest<Params, Response>(
            methodName, { imsi, index }
        );

        if (resp.isSuccess) {

            dongle.sim.storage.contacts.splice(
                dongle.sim.storage.contacts.indexOf(contact_to_delete),
                1
            );

            dongle.sim.storage.infos.storageLeft++;

            misc.updateStorageDigest(dongle.sim.storage);

        } else {

            throw new Error("Dongle disconnect or unexpected error");

        }


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

        this.instance = new DongleController(host || "127.0.0.1", port || misc.port);

        this.instance.socket.evtClose.attachOncePrepend(
            () => this.instance = undefined
        );

        return this.instance;

    }

}

export namespace DongleController {

    export let log = console.log.bind(console);

}
