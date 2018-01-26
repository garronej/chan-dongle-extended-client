"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awesome_phonenumber_1 = require("awesome-phonenumber");
var imsi_grok_1 = require("imsi-grok");
var mccmnc = require("mccmnc.json");
function getImsiInfos(imsi) {
    if (getImsiInfo.cache.has(imsi)) {
        return getImsiInfo.cache.get(imsi);
    }
    var imsiInfo = imsi_grok_1.grok(imsi);
    if (imsiInfo) {
        if (imsiInfo.network_name === "Lliad/FREE Mobile") {
            imsiInfo.network_name = "Free Mobile";
        }
    }
    getImsiInfo.cache.set(imsi, imsiInfo);
    return getImsiInfos(imsi);
}
exports.getImsiInfos = getImsiInfos;
var getImsiInfo;
(function (getImsiInfo) {
    getImsiInfo.cache = new Map();
})(getImsiInfo = exports.getImsiInfo || (exports.getImsiInfo = {}));
var SimCountry;
(function (SimCountry) {
    var setSanityCheck = new Set();
    (function () {
        for (var key in mccmnc) {
            var _a = mccmnc[key], country_iso = _a.country_iso, country_name = _a.country_name, country_code = _a.country_code;
            setSanityCheck.add("" + country_iso + country_name + (country_code || "US"));
        }
    })();
    function sanityCheck(country) {
        return (country instanceof Object &&
            setSanityCheck.has("" + country.iso + country.name + country.code));
    }
    SimCountry.sanityCheck = sanityCheck;
    function getFromImsi(imsi) {
        var imsiInfo = getImsiInfos(imsi);
        return imsiInfo ? ({
            "name": imsiInfo.country_name,
            "iso": imsiInfo.country_iso || "US",
            "code": parseInt(imsiInfo.country_code)
        }) : undefined;
    }
    SimCountry.getFromImsi = getFromImsi;
})(SimCountry = exports.SimCountry || (exports.SimCountry = {}));
function toNationalNumber(number, imsi) {
    var imsiInfo = getImsiInfos(imsi);
    if (!imsiInfo || !imsiInfo.country_iso) {
        return number;
    }
    if (number.match(/[^\+0-9]/)) {
        return number;
    }
    var pn = new awesome_phonenumber_1.default(number, imsiInfo.country_iso);
    if (!pn.isValid() || pn.getRegionCode() !== imsiInfo.country_iso) {
        return number;
    }
    return pn.getNumber("national").replace(/[^0-9]/g, "");
}
exports.toNationalNumber = toNationalNumber;
