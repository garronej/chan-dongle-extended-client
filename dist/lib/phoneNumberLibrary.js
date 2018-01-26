"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awesome_phonenumber_1 = require("awesome-phonenumber");
var imsi_grok_1 = require("imsi-grok");
var mccmnc = require("mccmnc.json");
console.log("=>xxxx");
var isoAndCodeByName = new Map();
(function () {
    for (var key in mccmnc) {
        var _a = mccmnc[key], country_iso = _a.country_iso, country_name = _a.country_name, country_code = _a.country_code;
        if (!country_name) {
            throw new Error("xx");
        }
        if (!country_code) {
            throw new Error("xxx");
        }
        if (isoAndCodeByName.has(country_name)) {
            console.log("exsisting", isoAndCodeByName.get(country_name));
            console.log("new", mccmnc[key]);
            throw new Error("x");
        }
        isoAndCodeByName.set(country_name, { "iso": country_iso, "code": parseInt(country_code) });
    }
})();
var cacheImsiInfos = new Map();
function getImsiInfos(imsi) {
    if (cacheImsiInfos.has(imsi)) {
        return cacheImsiInfos.get(imsi);
    }
    cacheImsiInfos.set(imsi, imsi_grok_1.grok(imsi) || undefined);
    return getImsiInfos(imsi);
}
exports.getImsiInfos = getImsiInfos;
var cacheNationalNumber = new Map();
function toNationalNumber(number, countryIso) {
    var key = "" + number + countryIso;
    if (cacheNationalNumber.has(key)) {
        return cacheNationalNumber.get(key);
    }
    var result;
    try {
        if (number.match(/[^\+0-9]/)) {
            throw new Error();
        }
        var pn = new awesome_phonenumber_1.default(number, countryIso);
        if (!pn.isValid() || pn.getRegionCode() !== countryIso) {
            throw new Error();
        }
        result = pn.getNumber("national").replace(/[^0-9]/g, "");
    }
    catch (error) {
        result = number;
    }
    cacheNationalNumber.set(key, result);
    return toNationalNumber(number, countryIso);
}
exports.toNationalNumber = toNationalNumber;
