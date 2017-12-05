"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awesome_phonenumber_1 = require("awesome-phonenumber");
var imsi_grok_1 = require("imsi-grok");
var cacheImsiInfos = new Map();
function getImsiInfos(imsi) {
    if (cacheImsiInfos.has(imsi))
        return cacheImsiInfos.get(imsi);
    cacheImsiInfos.set(imsi, imsi_grok_1.grok(imsi) || undefined);
    return getImsiInfos(imsi);
}
exports.getImsiInfos = getImsiInfos;
var cacheNationalNumber = new Map();
function toNationalNumber(number, imsi) {
    var key = "" + number + imsi;
    if (cacheNationalNumber.has(key))
        return cacheNationalNumber.get(key);
    var result;
    try {
        if (number.match(/[^\+0-9]/))
            throw new Error();
        var imsiInfos = getImsiInfos(imsi);
        if (!imsiInfos)
            throw new Error();
        var pn = new awesome_phonenumber_1.default(number, imsiInfos.country_iso);
        if (!pn.isValid() || pn.getRegionCode() !== imsiInfos.country_iso)
            throw new Error();
        result = pn.getNumber("national").replace(/[^0-9]/g, "");
    }
    catch (error) {
        result = number;
    }
    cacheNationalNumber.set(key, result);
    return toNationalNumber(number, imsi);
}
exports.toNationalNumber = toNationalNumber;
