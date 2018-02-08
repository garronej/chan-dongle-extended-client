import * as types from "./types";
import * as misc from "./misc";

export function imsi(imsi: string): boolean {
    return typeof imsi === "string" && imsi.match(/^[0-9]{15}$/) !== null;
}

export function imei(imei: string): boolean {
    return imsi(imei);
}

export function iccid(iccid: string): boolean {
    return typeof iccid === "string" && iccid.match(/^[0-9]{6,22}$/) !== null;
}

export function simStorage(o: types.Sim.Storage): boolean {

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

        if (!simContact(contact)) {
            return false;
        }

    }

    return true;

}

export function lockedPinState(o: types.Dongle.Locked.PinState): boolean {
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


export function dongleLocked(o: types.Dongle.Locked): boolean {

    return (
        o instanceof Object &&
        imei(o.imei) &&
        typeof o.manufacturer === "string" &&
        typeof o.model === "string" &&
        typeof o.firmwareVersion === "string" &&
        o.sim instanceof Object &&
        (
            (
                o.sim.iccid === undefined ||
                iccid(o.sim.iccid)
            ) &&
            lockedPinState(o.sim.pinState) &&
            typeof o.sim.tryLeft === "number"
        )
    );

}

export function simContact(o: types.Sim.Contact): boolean {

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

export function dongleUsable(o: types.Dongle.Usable): boolean {

    return (
        o instanceof Object &&
        imei(o.imei) &&
        typeof o.manufacturer === "string" &&
        typeof o.model === "string" &&
        typeof o.firmwareVersion === "string" &&
        (
            typeof o.isVoiceEnabled === "boolean" ||
            o.isVoiceEnabled === undefined
        ) &&
        o.sim instanceof Object &&
        iccid(o.sim.iccid) &&
        imsi(o.sim.imsi) &&
        misc.SimCountry.sanityCheck(o.sim.country) &&
        (
            typeof o.sim.serviceProvider.fromImsi === "string" ||
            o.sim.serviceProvider.fromImsi === undefined
        ) && (
            typeof o.sim.serviceProvider.fromNetwork === "string" ||
            o.sim.serviceProvider.fromNetwork === undefined
        ) &&
        simStorage(o.sim.storage)
    );

}

export function dongle(o: types.Dongle): boolean {

    return (
        dongleLocked(o as types.Dongle.Locked) ||
        dongleUsable(o as types.Dongle.Usable)
    );

}

export function unlockResult(o: types.UnlockResult): boolean {

    if (!(
        o instanceof Object &&
        typeof o.success === "boolean"
    )) return false;

    if (o.success) {

        return true;

    } else {

        return (
            lockedPinState(o.pinState) &&
            typeof o.tryLeft === "number"
        );

    }

}