"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var awesome_phonenumber_1 = require("awesome-phonenumber");
var md5 = require("md5");
var sanityChecks = require("./sanityChecks");
var fs = require("fs");
var path = require("path");
exports.amiUser = "dongle_ext_user";
function getSimCountry(imsi) {
    if (getSimCountry.cache.has(imsi)) {
        return getSimCountry.cache.get(imsi);
    }
    if (!sanityChecks.imsi(imsi)) {
        throw new Error("imsi malformed");
    }
    var mccmnc = getSimCountry.getMccmnc();
    var imsiInfos = mccmnc[imsi.substr(0, 6)] || mccmnc[imsi.substr(0, 5)];
    getSimCountry.cache.set(imsi, imsiInfos ? ({
        "name": imsiInfos.country_name,
        "iso": (imsiInfos.country_iso || "US").toLowerCase(),
        "code": parseInt(imsiInfos.country_code)
    }) : undefined);
    return getSimCountry(imsi);
}
exports.getSimCountry = getSimCountry;
(function (getSimCountry) {
    var mccmnc = undefined;
    function getMccmnc() {
        if (mccmnc) {
            return mccmnc;
        }
        mccmnc = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "res", "mccmnc.json"), "utf8"));
        return getMccmnc();
    }
    getSimCountry.getMccmnc = getMccmnc;
    getSimCountry.cache = new Map();
})(getSimCountry = exports.getSimCountry || (exports.getSimCountry = {}));
/** Convert a number to national dry or return itself */
function toNationalNumber(number, imsi) {
    var simCountry = getSimCountry(imsi);
    if (!simCountry) {
        return number;
    }
    if (number.match(/[^\+0-9]/)) {
        return number;
    }
    var pn = new awesome_phonenumber_1.default(number, simCountry.iso.toUpperCase());
    if (!pn.isValid() || (pn.getRegionCode() || "").toLowerCase() !== simCountry.iso) {
        return number;
    }
    return pn.getNumber("national").replace(/[^0-9]/g, "");
}
exports.toNationalNumber = toNationalNumber;
function computeSimStorageDigest(number, storageLeft, contacts) {
    var strArr = contacts
        .sort(function (c1, c2) { return c1.index - c2.index; })
        .map(function (c) { return "" + c.index + c.name.asStored + c.number.asStored; });
    strArr.push("" + number);
    strArr.push("" + storageLeft);
    return md5(strArr.join(""));
}
exports.computeSimStorageDigest = computeSimStorageDigest;
