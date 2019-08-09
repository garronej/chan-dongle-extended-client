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
function string(str, regExp) {
    return typeof str === "string" && !!str.match(regExp);
}
exports.string = string;
function imsi(str) {
    return string(str, /^[0-9]{15}$/);
}
exports.imsi = imsi;
function imei(imei) {
    return imsi(imei);
}
exports.imei = imei;
function iccid(str) {
    return string(str, /^[0-9]{6,22}$/);
}
exports.iccid = iccid;
function md5(str) {
    return string(str, /^[0-9a-f]{32}$/);
}
exports.md5 = md5;
function simStorage(o) {
    var e_1, _a;
    if (!(o instanceof Object &&
        (typeof o.number === "string" || o.number === undefined) &&
        o.infos instanceof Object &&
        o.contacts instanceof Array &&
        md5(o.digest)))
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
        typeof o.name === "string" &&
        typeof o.number === "string");
}
exports.simContact = simContact;
//TODO: maybe this check is not worth it.
function simCountry(o, imsi) {
    try {
        var expected = misc.getSimCountryAndSp(imsi);
    }
    catch (_a) {
        return false;
    }
    return (!!expected &&
        o instanceof Object &&
        o.code === expected.code &&
        o.iso === expected.iso &&
        o.name === expected.name);
}
exports.simCountry = simCountry;
function sim(o) {
    return (o instanceof Object &&
        iccid(o.iccid) &&
        imsi(o.imsi) &&
        (o.country === undefined ||
            simCountry(o.country, o.imsi)) && (o.serviceProvider.fromImsi === undefined ||
        typeof o.serviceProvider.fromImsi === "string") && (o.serviceProvider.fromNetwork === undefined ||
        typeof o.serviceProvider.fromNetwork === "string") &&
        simStorage(o.storage));
}
exports.sim = sim;
function dongleUsable(o) {
    return (o instanceof Object &&
        imei(o.imei) &&
        typeof o.manufacturer === "string" &&
        typeof o.model === "string" &&
        typeof o.firmwareVersion === "string" &&
        (typeof o.isVoiceEnabled === "boolean" ||
            o.isVoiceEnabled === undefined) &&
        sim(o.sim) &&
        typeof o.isGsmConnectivityOk === "boolean" &&
        typeof o.cellSignalStrength === "string");
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
