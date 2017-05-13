import { 
    Ami, 
    retrieveCredential, 
    Credential, 
    generateUniqueActionId 
} from "ts-ami";

import { UserEvent } from "./AmiUserEvent";
import Response = UserEvent.Response;
import Request = UserEvent.Request;
import Event = UserEvent.Event;

import { SyncEvent } from "ts-events-extended";

export interface StatusReport {
    messageId: number;
    dischargeTime: Date;
    isDelivered: boolean;
    status: string;
    recipient: string;
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

export class DongleExtendedClient {

    private static localClient: DongleExtendedClient | undefined = undefined;

    public static localhost(): DongleExtendedClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(
            retrieveCredential(
                { "user": "dongle_ext_user" }
            )
        );

    };

    public readonly ami: Ami;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & StatusReport>();
    public readonly evtDongleDisconnect = new SyncEvent<DongleActive>();
    public readonly evtNewActiveDongle = new SyncEvent<DongleActive>();
    public readonly evtRequestUnlockCode = new SyncEvent<LockedDongle>();
    public readonly evtNewMessage = new SyncEvent<{ imei: string } & Message>();


    public readonly evtUserEvent= new SyncEvent<UserEvent>();

    public lastActionId= "";

    public postUserEventAction( userEvent: UserEvent ): Promise<any> {

        let p= this.ami.postAction(userEvent as any);

        this.lastActionId= this.ami.lastActionId;

        return p;

    }

    constructor(credential: Credential) {

        this.ami = new Ami(credential);

        this.ami.evt.attach(
            ({ event }) => event === "UserEvent",
            userEvent => this.evtUserEvent.post(userEvent as any)
        );


        this.evtUserEvent.attach(Event.matchEvt, evt => {

            if (Event.MessageStatusReport.matchEvt(evt))
                this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime),
                    "recipient": evt.recipient
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

    public disconnect(): void {
        this.ami.disconnect();
    }


    public async getLockedDongles(): Promise<LockedDongle[]> {

        this.postUserEventAction(
            Request.GetLockedDongles.buildAction()
        );

        let actionid= this.lastActionId;

        let evtResponse = await this.evtUserEvent.waitFor(
            Response.GetLockedDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: LockedDongle[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.evtUserEvent.waitFor(
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

        return out;

    }

    public async getActiveDongles(): Promise<DongleActive[]> {

        this.postUserEventAction(
            Request.GetActiveDongles.buildAction()
        );

        let actionid= this.lastActionId;

        let evtResponse = await this.evtUserEvent.waitFor(
            Response.GetActiveDongles.Infos.matchEvt(actionid),
            10000
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: DongleActive[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.evtUserEvent.waitFor(
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

        return out;

    }


    //return messageId
    public async sendMessage(
        imei: string,
        number: string,
        text: string,
    ): Promise<number> {

        this.postUserEventAction(
            Request.SendMessage.buildAction(
                imei, number, text
            )
        );

        let actionid= this.lastActionId;

        let evtResponse = await this.evtUserEvent.waitFor(
            Response.SendMessage.matchEvt(actionid),
            30000
        );

        if (evtResponse.error)
            throw new Error(evtResponse.error);

        return parseInt(evtResponse.messageid);

    }


    public async getSimPhonebook(
        imei: string
    ): Promise<Phonebook> {

        this.postUserEventAction(
            Request.GetSimPhonebook.buildAction(imei)
        );

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.GetSimPhonebook.Infos.matchEvt(actionid),
            10000
        );

        if (evt.error) 
            throw new Error(evt.error);

        let infos = {
            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
            "numberMaxLength": parseInt(evt.numbermaxlength),
            "storageLeft": parseInt(evt.storageleft)
        };

        let contactCount = parseInt(evt.contactcount);

        let contacts: Contact[] = [];

        while (contacts.length !== contactCount) {

            let evt = await this.evtUserEvent.waitFor(
                Response.GetSimPhonebook.Entry.matchEvt(actionid),
                10000
            );

            contacts.push({
                "index": parseInt(evt.index),
                "name": evt.name,
                "number": evt.number
            });

        }

        return { infos, contacts };


    }

    public async createContact(
        imei: string,
        name: string,
        number: string,
    ): Promise<Contact> {

        this.postUserEventAction(
            Request.CreateContact.buildAction(
                imei,
                name,
                number
            )
        );

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.CreateContact.matchEvt(actionid),
            10000
        );

        if (evt.error)
            throw new Error(evt.error);

        let contact: Contact = {
            "index": parseInt(evt.index),
            "name": evt.name,
            "number": evt.number
        };

        return contact;

    }

    public async getMessages(
        imei: string,
        flush: boolean,
    ): Promise<Message[]> {

        this.postUserEventAction(
            Request.GetMessages.buildAction(
                imei,
                flush ? "true" : "false"
            )
        );

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.GetMessages.Infos.matchEvt(actionid),
            10000
        );

        if (evt.error)
            throw new Error(evt.error);

        let messagesCount = parseInt(evt.messagescount);

        let messages: Message[] = [];

        while (messages.length !== messagesCount) {

            let evt = await this.evtUserEvent.waitFor(
                Response.GetMessages.Entry.matchEvt(actionid),
                10000
            );

            messages.push({
                "number": evt.number,
                "date": new Date(evt.date),
                "text": Response.GetMessages.Entry.reassembleText(evt)
            });

        }

        return messages;

    }

    public async deleteContact(
        imei: string,
        index: number
    ) {

        this.postUserEventAction(
            Request.DeleteContact.buildAction(
                imei,
                index.toString()
            )
        );

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.matchEvt(Request.DeleteContact.keyword, actionid),
            10000
        );

        if( evt.error )
            throw new Error(evt.error);

    }


    public unlockDongle(imei: string, pin: string): Promise<void>;
    public unlockDongle(imei: string, puk: string, newPin: string): Promise<void>;
    public async unlockDongle(...inputs: any[]): Promise<void> {

        let imei= inputs[0] as string;

        if (inputs.length === 2){

            let pin= inputs[1] as string;

            this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, pin)
            );

        } else {

            let puk= inputs[1] as string;
            let newPin= inputs[2] as string;

            this.postUserEventAction(
                Request.UnlockDongle.buildAction(imei, puk, newPin)
            );
        }

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.matchEvt(Request.UnlockDongle.keyword, actionid),
            10000
        );

        if( evt.error )
            throw new Error(evt.error);

    }

    public async updateNumber(
        imei: string,
        number: string
    ) {

        this.postUserEventAction(
            Request.UpdateNumber.buildAction(imei, number)
        );

        let actionid= this.lastActionId;

        let evt = await this.evtUserEvent.waitFor(
            Response.matchEvt(Request.UpdateNumber.keyword, actionid),
            10000
        );

        if( evt.error ) throw new Error(evt.error);

    }

}