import * as types from "./types";
import * as misc from "./misc";

export function string(str: string, regExp: RegExp): boolean {
    return typeof str === "string" && !!str.match(regExp);
}

export function imsi(str: string): boolean {
    return string(str, /^[0-9]{15}$/);
}

export function imei(imei: string): boolean {
    return imsi(imei);
}

export function iccid(str: string): boolean {
    return string(str, /^[0-9]{6,22}$/);
}

export function md5(str: string): boolean {
    return string(str,/^[0-9a-f]{32}$/);

}

export function simStorage(o: types.Sim.Storage): boolean {

    if (!(
        o instanceof Object &&
        ( typeof o.number === "string" || o.number===undefined ) &&
        o.infos instanceof Object &&
        o.contacts instanceof Array &&
        md5(o.digest)
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
        typeof o.name === "string" &&
        typeof o.number === "string"
    );

}

//TODO: maybe this check is not worth it.
export function simCountry(
    o: types.Sim.Country,
    imsi: string
): boolean {

    try {

        var expected = misc.getSimCountryAndSp(imsi);

    } catch{

        return false;

    }

    return (
        !!expected &&
        o instanceof Object &&
        o.code === expected.code &&
        o.iso === expected.iso &&
        o.name === expected.name
    );

}

export function sim(o: types.Sim): boolean {

    return (
        o instanceof Object &&
        iccid(o.iccid) &&
        imsi(o.imsi) &&
        (
            o.country === undefined ||
            simCountry(o.country, o.imsi)
        ) && (
            o.serviceProvider.fromImsi === undefined ||
            typeof o.serviceProvider.fromImsi === "string"
        ) && (
            o.serviceProvider.fromNetwork === undefined ||
            typeof o.serviceProvider.fromNetwork === "string"
        ) &&
        simStorage(o.storage)
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
        sim(o.sim) &&
        typeof o.isGsmConnectivityOk === "boolean" &&
        typeof o.cellSignalStrength === "string"
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