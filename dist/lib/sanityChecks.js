"use strict";
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
Object.defineProperty(exports, "__esModule", { value: true });
var misc = require("./misc");
function imsi(imsi) {
    return typeof imsi === "string" && imsi.match(/^[0-9]{15}$/) !== null;
}
exports.imsi = imsi;
function imei(imei) {
    return imsi(imei);
}
exports.imei = imei;
function iccid(iccid) {
    return typeof iccid === "string" && iccid.match(/^[0-9]{6,22}$/) !== null;
}
exports.iccid = iccid;
function simStorage(o) {
    if (!(o instanceof Object && (o.number === undefined || (o.number instanceof Object &&
        typeof o.number.asStored === "string" &&
        typeof o.number.localFormat === "string")) &&
        o.infos instanceof Object &&
        o.contacts instanceof Array))
        return false;
    var infos = o.infos, contacts = o.contacts;
    if (!(typeof infos.contactNameMaxLength === "number" &&
        typeof infos.numberMaxLength === "number" &&
        typeof infos.storageLeft === "number"))
        return false;
    try {
        for (var contacts_1 = __values(contacts), contacts_1_1 = contacts_1.next(); !contacts_1_1.done; contacts_1_1 = contacts_1.next()) {
            var contact = contacts_1_1.value;
            if (!simContact(contact)) {
                return false;
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (contacts_1_1 && !contacts_1_1.done && (_a = contacts_1.return)) _a.call(contacts_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return true;
    var e_1, _a;
}
exports.simStorage = simStorage;
function lockedPinState(o) {
    return (typeof o === "string" &&
        (o === "SIM PIN" ||
            o === "SIM PUK" ||
            o === "SIM PIN2" ||
            o === "SIM PUK2"));
}
exports.lockedPinState = lockedPinState;
function dongleLocked(o) {
    return (o instanceof Object &&
        imei(o.imei) &&
        typeof o.manufacturer === "string" &&
        typeof o.model === "string" &&
        typeof o.firmwareVersion === "string" &&
        o.sim instanceof Object &&
        ((o.sim.iccid === undefined ||
            iccid(o.sim.iccid)) &&
            lockedPinState(o.sim.pinState) &&
            typeof o.sim.tryLeft === "number"));
}
exports.dongleLocked = dongleLocked;
function simContact(o) {
    return (o instanceof Object &&
        typeof o.index === "number" &&
        o.name instanceof Object &&
        typeof o.name.asStored === "string" &&
        typeof o.name.full === "string" &&
        o.number instanceof Object &&
        typeof o.number.asStored === "string" &&
        typeof o.number.localFormat === "string");
}
exports.simContact = simContact;
function dongleUsable(o) {
    return (o instanceof Object &&
        imei(o.imei) &&
        typeof o.manufacturer === "string" &&
        typeof o.model === "string" &&
        typeof o.firmwareVersion === "string" &&
        (typeof o.isVoiceEnabled === "boolean" ||
            o.isVoiceEnabled === undefined) &&
        o.sim instanceof Object &&
        iccid(o.sim.iccid) &&
        imsi(o.sim.imsi) &&
        misc.SimCountry.sanityCheck(o.sim.country) &&
        (typeof o.sim.serviceProvider.fromImsi === "string" ||
            o.sim.serviceProvider.fromImsi === undefined) && (typeof o.sim.serviceProvider.fromNetwork === "string" ||
        o.sim.serviceProvider.fromNetwork === undefined) &&
        simStorage(o.sim.storage));
}
exports.dongleUsable = dongleUsable;
function dongle(o) {
    return (dongleLocked(o) ||
        dongleUsable(o));
}
exports.dongle = dongle;
function unlockResult(o) {
    if (!(o instanceof Object &&
        typeof o.success === "boolean"))
        return false;
    if (o.success) {
        return true;
    }
    else {
        return (lockedPinState(o.pinState) &&
            typeof o.tryLeft === "number");
    }
}
exports.unlockResult = unlockResult;
