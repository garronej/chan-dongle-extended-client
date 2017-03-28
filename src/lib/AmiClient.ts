import { UserEvent, generateUniqueActionId } from "./AmiUserEvent";
import Response= UserEvent.Response;
import Request= UserEvent.Request;
import Event= UserEvent.Event;

import { AmiCredential, Credential } from "./AmiCredential";
import * as AstMan from "asterisk-manager";
import { SyncEvent } from "ts-events-extended";
import * as pr from "ts-promisify";

export interface StatusReport {
    messageId: number;
    dischargeTime: Date;
    isDelivered: boolean;
    status: string;
}

export type LockedPinState = "SIM PIN" | "SIM PUK" | "SIM PIN2" | "SIM PUK2";

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

export interface DongleBase {
    imei: string;
    iccid: string;
}

export interface LockedDongle extends DongleBase {
    pinState: LockedPinState;
    tryLeft: number;
}

export interface DongleActive extends DongleBase {
    imsi: string;
    number: string | undefined;
    serviceProvider: string | undefined;
}

export type Phonebook = {
    infos: {
        contactNameMaxLength: number;
        numberMaxLength: number;
        storageLeft: number;
    };
    contacts: Contact[];
};

let first = true;

export class AmiClient {

    private static localClient: AmiClient | undefined = undefined;

    public static localhost(): AmiClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(AmiCredential.retrieve());

    };

    private readonly ami: any;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & StatusReport>();
    public readonly evtDongleDisconnect = new SyncEvent<DongleActive>();
    public readonly evtNewActiveDongle = new SyncEvent<DongleActive>();
    public readonly evtRequestUnlockCode = new SyncEvent<LockedDongle>();
    public readonly evtNewMessage = new SyncEvent<{ imei: string } & Message>();

    public readonly evtAmiUserEvent = new SyncEvent<UserEvent>();

    private isFullyBooted = false;

    constructor(credential: Credential) {

        if (first) {
            process.on("unhandledRejection", error => {
                console.log("INTERNAL ERROR AMI CLIENT");
                console.log(error);
                throw error;
            });
            first = false;
        }

        let { port, host, user, secret } = credential;

        this.ami = new AstMan(port, host, user, secret, true);

        this.ami.keepConnected();

        this.ami.on("userevent", evt => this.evtAmiUserEvent.post(evt));
        this.ami.on("fullybooted", () => { this.isFullyBooted = true; });
        this.ami.on("close", () => { this.isFullyBooted = false; });

        this.registerListeners();

    }


    public postUserEventAction(actionEvt: UserEvent): { actionid: string; promise: Promise<any> } {
        return this.postAction(actionEvt);
    }

    public postAction(actionEvt: any): { actionid: string; promise: Promise<any> } {

        if (!actionEvt.actionid)
            actionEvt.actionid = generateUniqueActionId();

        let { actionid } = actionEvt;

        let promise = new Promise<void>(async (resolve, reject) => {

            if (!this.isFullyBooted)
                await pr.generic(this.ami, this.ami.once)("fullybooted");

            this.ami.actionExpectSingleResponse(actionEvt, (error, res) => error ? reject(error) : resolve(res));

        });

        return { actionid, promise };
    }


    public disconnect(): void {
        this.ami.disconnect();
    }


    private registerListeners(): void {

        this.evtAmiUserEvent.attach(Event.matchEvt, evt => {

            if (Event.MessageStatusReport.matchEvt(evt))
                this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime)
                });
            else if (Event.DongleDisconnect.matchEvt(evt))
                this.evtDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
            else if (Event.NewActiveDongle.matchEvt(evt))
                this.evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
            else if (Event.RequestUnlockCode.matchEvt(evt))
                this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (Event.NewMessage.matchEvt(evt))
                this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": UserEvent.Event.NewMessage.reassembleText(evt)
                });

        });

    }

    public async getLockedDongles(
        callback?: (dongles: LockedDongle[]) => void
    ): Promise<LockedDongle[]> {

        let { actionid } = this.postUserEventAction(
            Request.GetLockedDongles.buildAction()
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.GetLockedDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: LockedDongle[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.evtAmiUserEvent.waitFor(
                Response.GetLockedDongles.Entry.matchEvt(actionid),
                10000
            );

            let { imei, iccid, pinstate, tryleft } = evtResponse;

            out.push({
                imei,
                iccid,
                "pinState": pinstate as LockedPinState,
                "tryLeft": parseInt(tryleft)
            });

        }

        if (callback) callback(out);
        return out;

    }

    public async getActiveDongles(
        callback?: (dongles: DongleActive[]) => void
    ): Promise<DongleActive[]> {

        let { actionid } = this.postUserEventAction(
            Request.GetActiveDongles.buildAction()
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.GetActiveDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: DongleActive[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.evtAmiUserEvent.waitFor(
                Response.GetActiveDongles.Entry.matchEvt(actionid),
                10000
            );

            let { imei, iccid, imsi, number, serviceprovider } = evtResponse;

            out.push({
                imei,
                iccid,
                imsi,
                "number": number || undefined,
                "serviceProvider": serviceprovider || undefined
            });

        }

        if (callback) callback(out);
        return out;

    }

    public async sendMessage(
        imei: string,
        number: string,
        text: string,
        callback?: (error: Error | null, messageId: number) => void
    ): Promise<[Error | null, number]> {

        let { actionid } = this.postUserEventAction(
            Request.SendMessage.buildAction(
                imei, number, text
            )
        );

        let evtResponse = await this.evtAmiUserEvent.waitFor(
            Response.SendMessage.matchEvt(actionid),
            10000
        );

        let error: null | Error;
        let messageId: number;

        if (evtResponse.error) {

            error = new Error(evtResponse.error);

            messageId = NaN;

        } else {

            error = null;

            messageId = parseInt(evtResponse.messageid);

        }

        if (callback) callback(error, messageId);
        return [error, messageId];

    }


    public async  getSimPhonebook(
        imei: string,
        callback?: (error: null | Error, phonebook: Phonebook | null) => void
    ): Promise<[null | Error, Phonebook | null]> {

        let { actionid } = this.postUserEventAction(
            Request.GetSimPhonebook.buildAction(imei)
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.GetSimPhonebook.Infos.matchEvt(actionid),
            10000
        );

        if (evt.error) {
            let error = new Error(evt.error);
            if (callback) callback(error, null);
            return [error, null];
        }

        let infos = {
            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
            "numberMaxLength": parseInt(evt.numbermaxlength),
            "storageLeft": parseInt(evt.storageleft)
        };

        let contactCount = parseInt(evt.contactcount);

        let contacts: Contact[] = [];

        while (contacts.length !== contactCount) {

            let evt = await this.evtAmiUserEvent.waitFor(
                Response.GetSimPhonebook.Entry.matchEvt(actionid),
                10000
            );

            contacts.push({
                "index": parseInt(evt.index),
                "name": evt.name,
                "number": evt.number
            });

        }

        let phonebook = { infos, contacts };

        if (callback) callback(null, phonebook);

        return [null, phonebook];

    }

    public async createContact(
        imei: string,
        name: string,
        number: string,
        callback?: (error: null | Error, contact: Contact | null) => void
    ): Promise<[null | Error, Contact | null]> {

        let { actionid } = this.postUserEventAction(
            Request.CreateContact.buildAction(
                imei,
                name,
                number
            )
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.CreateContact.matchEvt(actionid),
            10000
        );

        if (evt.error) {

            let error = new Error(evt.error);

            if (callback) callback(error, null);

            return [error, null];

        }

        let contact: Contact = {
            "index": parseInt(evt.index),
            "name": evt.name,
            "number": evt.number
        };

        if (callback) callback(null, contact);
        return [null, contact];

    }

    public async getMessages(
        imei: string,
        flush: boolean,
        callback?: (error: null | Error, messages: Message[] | null) => void
    ): Promise<[null | Error, Message[] | null]> {

        let { actionid } = this.postUserEventAction(
            Request.GetMessages.buildAction(
                imei,
                flush ? "true" : "false"
            )
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.GetMessages.Infos.matchEvt(actionid),
            10000
        );

        if (evt.error) {

            let error = new Error(evt.error);

            if (callback) callback(error, null);
            return [error, null];

        }

        let messagesCount = parseInt(evt.messagescount);

        let messages: Message[] = [];

        while (messages.length !== messagesCount) {

            let evt = await this.evtAmiUserEvent.waitFor(
                Response.GetMessages.Entry.matchEvt(actionid),
                10000
            );

            messages.push({
                "number": evt.number,
                "date": new Date(evt.date),
                "text": Response.GetMessages.Entry.reassembleText(evt)
            });

        }

        if (callback) callback(null, messages);
        return [null, messages];


    }

    public async deleteContact(
        imei: string,
        index: number,
        callback?: (error: null | Error) => void
    ): Promise<null | Error> {

        let { actionid } = this.postUserEventAction(
            Request.DeleteContact.buildAction(
                imei,
                index.toString()
            )
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.matchEvt(Request.DeleteContact.keyword, actionid),
            10000
        );

        let error = evt.error ? new Error(evt.error) : null;

        if (callback) callback(error);
        return error;

    }


    private static readUnlockParams(inputs: any[]): {
        imei: string;
        pin?: string;
        puk?: string;
        newPin?: string;
        callback?: (error: null | Error) => void
    } {

        let imei = inputs.shift();

        let callback: ((error: null | Error) => void) | undefined = undefined;

        if (typeof inputs[inputs.length - 1] === "function")
            callback = inputs.pop();


        if (inputs.length === 1) {

            let [pin] = inputs;

            return { imei, pin, callback };

        } else {

            let [puk, newPin] = inputs;

            return { imei, puk, newPin, callback };

        }


    }

    public unlockDongle(imei: string, pin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public unlockDongle(imei: string, puk: string, newPin: string, callback?: (error: null | Error) => void): Promise<null | Error>;
    public async unlockDongle(...inputs: any[]): Promise<null | Error> {

        let { imei, pin, puk, newPin, callback } = AmiClient.readUnlockParams(inputs);

        let actionid: string;

        if (pin)
            actionid = this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, pin)
            ).actionid;
        else
            actionid = this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, puk!, newPin!)
            ).actionid;

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.matchEvt(Request.UnlockDongle.keyword, actionid),
            10000
        );

        let error = evt.error ? new Error(evt.error) : null;

        if (callback) callback(error);
        return error;

    }

    public async updateNumber(
        imei: string,
        number: string,
        callback?: (error: null | Error) => void
    ): Promise<null | Error> {

        let { actionid } = this.postUserEventAction(
            Request.UpdateNumber.buildAction(imei, number)
        );

        let evt = await this.evtAmiUserEvent.waitFor(
            Response.matchEvt(Request.UpdateNumber.keyword, actionid),
            10000
        );

        let error = evt.error ? new Error(evt.error) : null;

        if (callback) callback(error);
        return error;

    }

}