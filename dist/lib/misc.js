"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var md5 = require("md5");
var sanityChecks = require("./sanityChecks");
var fs = require("fs");
var path = require("path");
exports.port = 48399;
function getSimCountryAndSp(imsi) {
    if (!sanityChecks.imsi(imsi)) {
        throw new Error("imsi malformed");
    }
    var mccmnc = getSimCountryAndSp.getMccmnc();
    var imsiInfos = mccmnc[imsi.substr(0, 6)] || mccmnc[imsi.substr(0, 5)];
    return imsiInfos ? ({
        "name": imsiInfos.country_name,
        "iso": (imsiInfos.country_iso || "US").toLowerCase(),
        "code": parseInt(imsiInfos.country_code),
        "serviceProvider": imsiInfos.network_name
    }) : undefined;
}
exports.getSimCountryAndSp = getSimCountryAndSp;
(function (getSimCountryAndSp) {
    var mccmnc = undefined;
    function getMccmnc() {
        if (mccmnc) {
            return mccmnc;
        }
        mccmnc = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "res", "mccmnc.json"), "utf8"));
        return getMccmnc();
    }
    getSimCountryAndSp.getMccmnc = getMccmnc;
})(getSimCountryAndSp = exports.getSimCountryAndSp || (exports.getSimCountryAndSp = {}));
function computeSimStorageDigest(number, storageLeft, contacts) {
    var strArr = contacts
        .sort(function (c1, c2) { return c1.index - c2.index; })
        .map(function (c) { return "" + c.index + c.name + c.number; });
    strArr.push("" + number);
    strArr.push("" + storageLeft);
    return md5(strArr.join(""));
}
exports.computeSimStorageDigest = computeSimStorageDigest;
function updateStorageDigest(storage) {
    storage.digest = computeSimStorageDigest(storage.number, storage.infos.storageLeft, storage.contacts);
}
exports.updateStorageDigest = updateStorageDigest;
