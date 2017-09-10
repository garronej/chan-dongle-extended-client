import { 
    Ami, 
    retrieveCredential, 
    Credential
} from "ts-ami";
import { SyncEvent } from "ts-events-extended";

import { 
    Response, 
    Request, 
    Event,
} from "./AmiUserEvents";

import { typesDef as t } from "./typesDef";

export const amiUser= "dongle_ext_user";

export class DongleExtendedClient {

    private static localClient: DongleExtendedClient | undefined = undefined;

    public static localhost(): DongleExtendedClient {

        if (this.localClient) return this.localClient;

        return this.localClient = new this(
            retrieveCredential(
                { "user": amiUser }
            )
        );

    };

    public readonly ami: Ami;

    public readonly evtActiveDongleDisconnect=new SyncEvent<t.DongleActive>();
    public readonly evtLockedDongleDisconnect= new SyncEvent<t.LockedDongle>();
    public readonly evtNewActiveDongle: SyncEvent<t.DongleActive>;
    public readonly evtRequestUnlockCode: SyncEvent<t.LockedDongle>;

    public readonly evtMessageStatusReport = new SyncEvent<{ imei: string } & t.StatusReport>();
    public readonly evtNewMessage = new SyncEvent<{ imei: string } & t.Message>();

    public readonly evtDongleConnect= new SyncEvent<string>();
    public readonly evtDongleDisconnect: SyncEvent<string>;

    constructor(credential: Credential) {

        let evtNewActiveDongle: typeof DongleExtendedClient.prototype.evtNewActiveDongle= new SyncEvent();
        this.evtNewActiveDongle= evtNewActiveDongle.createProxy();

        let evtRequestUnlockCode: typeof DongleExtendedClient.prototype.evtRequestUnlockCode= new SyncEvent();
        this.evtRequestUnlockCode= evtRequestUnlockCode.createProxy();

        let evtDongleDisconnect: typeof DongleExtendedClient.prototype.evtDongleDisconnect= new SyncEvent();
        this.evtDongleDisconnect= evtDongleDisconnect.createProxy();

        this.ami = new Ami(credential);

        this.ami.evtUserEvent.attach(Event.match, evt => {
            if (Event.ActiveDongleDisconnect.match(evt)){
                this.evtActiveDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
                evtDongleDisconnect.post(evt.imei);
            }
            else if(Event.LockedDongleDisconnect.match(evt)){
                this.evtLockedDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
                evtDongleDisconnect.post(evt.imei);
            }
            else if (Event.NewActiveDongle.match(evt))
                evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
            else if (Event.RequestUnlockCode.match(evt))
                evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (Event.MessageStatusReport.match(evt))
                this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime),
                    "recipient": evt.recipient
                });
            else if (Event.NewMessage.match(evt))
                this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": Event.NewMessage.reassembleText(evt)
                });
        });

        let evtNewActiveDongleProxy= evtNewActiveDongle.createProxy();
        let evtRequestUnlockCodeProxy= evtRequestUnlockCode.createProxy();
        let evtDongleDisconnectProxy= evtDongleDisconnect.createProxy();

        evtRequestUnlockCodeProxy.attach(({ imei })=> {

            this.evtDongleConnect.post(imei);

            let voidFunction= ()=>{};

            evtRequestUnlockCodeProxy.attachOnceExtract(
                lockedDongle=> lockedDongle.imei === imei,
                voidFunction
            );

            evtNewActiveDongleProxy.attachOnceExtract(
                dongleActive=> dongleActive.imei === imei, 
                voidFunction
            );

            evtDongleDisconnectProxy.attachOnce(
                newImei=> newImei === imei,
                ()=> { 
                    evtNewActiveDongleProxy.detach(voidFunction);
                    evtRequestUnlockCodeProxy.detach(voidFunction);
                }
            );

        });

        evtNewActiveDongleProxy.attach(({ imei }) => this.evtDongleConnect.post(imei) );


    }

    public disconnect(): void {
        this.ami.disconnect();
    }

    public async getContactName(
        imei: string,
        number: string
    ): Promise<string | undefined> {

        let numberPayload = DongleExtendedClient.getNumberPayload(number);

        if (!numberPayload) return undefined;

        let { contacts } = await this.getSimPhonebook(imei);

        for (let { number, name } of contacts)
            if (numberPayload === DongleExtendedClient.getNumberPayload(number)) return name;

        return undefined;

    }

    //TODO: Use a library for this.
    public static getNumberPayload(number: string): string | undefined {

        let match = number.match(/^(?:0*|(?:\+[0-9]{2}))([0-9]+)$/);

        return match ? match[1] : undefined;

    }


    public async getConnectedDongles(): Promise<string[]> {

        let imeis: string[]= [];

        for( let { imei } of await this.getLockedDongles() )
            imeis.push(imei);
        
        for( let { imei } of await this.getActiveDongles() )
            imeis.push(imei);
        
        return imeis;

    }


    public async getActiveDongle(imei: string): Promise<t.DongleActive | undefined>{

        for( let dongleActive of await this.getActiveDongles() )
            if( dongleActive.imei === imei ) return dongleActive;
        
        return undefined;

    }


    public async getLockedDongles(): Promise<t.LockedDongle[]> {

        this.ami.userEvent(
            Request.GetLockedDongles.build()
        );

        let actionid = this.ami.lastActionId;

        let evtResponse = await this.ami.evtUserEvent.waitFor(
            Response.GetLockedDongles_first.match(actionid),
            10001
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: t.LockedDongle[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.ami.evtUserEvent.waitFor(
                Response.GetLockedDongles_follow.match(actionid),
                10002
            );

            let { imei, iccid, pinstate, tryleft } = evtResponse;

            out.push({
                imei,
                iccid,
                "pinState": pinstate as t.LockedPinState,
                "tryLeft": parseInt(tryleft)
            });

        }

        return out;

    }

    public async getActiveDongles(): Promise<t.DongleActive[]> {

        this.ami.userEvent(
            Request.GetActiveDongles.build()
        );

        let actionid = this.ami.lastActionId;

        let evtResponse = await this.ami.evtUserEvent.waitFor(
            Response.GetActiveDongles_first.match(actionid),
            10003
        );

        let dongleCount = parseInt(evtResponse.donglecount);

        let out: t.DongleActive[] = [];

        while (out.length !== dongleCount) {

            let evtResponse = await this.ami.evtUserEvent.waitFor(
                Response.GetActiveDongles_follow.match(actionid),
                10004
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

        this.ami.userEvent(
            Request.SendMessage.build(
                imei, number, text
            )
        );

        let actionid = this.ami.lastActionId;

        let evtResponse = await this.ami.evtUserEvent.waitFor(
            Response.SendMessage.match(actionid),
            30000
        );

        if (evtResponse.error)
            throw new Error(evtResponse.error);

        return parseInt(evtResponse.messageid);

    }


    public async getSimPhonebook(
        imei: string
    ): Promise<t.Phonebook> {

        this.ami.userEvent(
            Request.GetSimPhonebook.build(imei)
        );

        let actionid = this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.GetSimPhonebook_first.match(actionid),
            10005
        );

        if (evt.error)
            throw new Error(evt.error);

        let infos = {
            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
            "numberMaxLength": parseInt(evt.numbermaxlength),
            "storageLeft": parseInt(evt.storageleft)
        };

        let contactCount = parseInt(evt.contactcount);

        let contacts: t.Contact[] = [];

        while (contacts.length !== contactCount) {

            let evt = await this.ami.evtUserEvent.waitFor(
                Response.GetSimPhonebook_follow.match(actionid),
                10006
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
    ): Promise<t.Contact> {

        this.ami.userEvent(
            Request.CreateContact.build(
                imei,
                name,
                number
            )
        );

        let actionid = this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.CreateContact.match(actionid),
            10007
        );

        if (evt.error)
            throw new Error(evt.error);

        let contact: t.Contact = {
            "index": parseInt(evt.index),
            "name": evt.name,
            "number": evt.number
        };

        return contact;

    }

    public async getMessages(
        imei: string,
        flush: boolean,
    ): Promise<t.Message[]> {

        this.ami.userEvent(
            Request.GetMessages.build(
                imei,
                flush ? "true" : "false"
            )
        );

        let actionid = this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.GetMessages_first.match(actionid),
            10008
        );

        if (evt.error)
            throw new Error(evt.error);

        let messagesCount = parseInt(evt.messagescount);

        let messages: t.Message[] = [];

        while (messages.length !== messagesCount) {

            let evt = await this.ami.evtUserEvent.waitFor(
                Response.GetMessages_follow.match(actionid),
                10009
            );

            messages.push({
                "number": evt.number,
                "date": new Date(evt.date),
                "text": Response.GetMessages_follow.reassembleText(evt)
            });

        }

        return messages;

    }

    public async deleteContact(
        imei: string,
        index: number
    ) {

        this.ami.userEvent(
            Request.DeleteContact.build(
                imei,
                index.toString()
            )
        );

        let actionid = this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.match(actionid),
            10010
        );

        if (evt.error)
            throw new Error(evt.error);

    }

    public unlockDongle(imei: string, pin: string): Promise<void>;
    public unlockDongle(imei: string, puk: string, newPin: string): Promise<void>;
    public async unlockDongle(...inputs: any[]): Promise<void> {

        let imei = inputs[0] as string;

        if (inputs.length === 2) {

            let pin = inputs[1] as string;

            this.ami.userEvent(
                Request.UnlockDongle.build(imei, pin)
            );

        } else {

            let puk = inputs[1] as string;
            let newPin = inputs[2] as string;

            this.ami.userEvent(
                Request.UnlockDongle.build(imei, puk, newPin)
            );
        }

        let actionid = this.ami.lastActionId;


        let evt = await this.ami.evtUserEvent.waitFor(
            Response.match(actionid),
            10011
        );

        if (evt.error)
            throw new Error(evt.error);

    }

    public async updateNumber(
        imei: string,
        number: string
    ) {

        this.ami.userEvent(
            Request.UpdateNumber.build(imei, number)
        );

        let actionid = this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.match(actionid),
            10012
        );

        if (evt.error) throw new Error(evt.error);

    }

    public async getConfig(): Promise<t.ModuleConfiguration> {

        this.ami.userEvent(
            Request.GetConfig.build()
        );

        let actionid= this.ami.lastActionId;

        let evt = await this.ami.evtUserEvent.waitFor(
            Response.GetConfig.match(actionid),
            10013
        );

        return Response.GetConfig.reassembleConfig(evt);

    }

}