import PhoneNumber from "awesome-phonenumber";
import * as types from "./types";
import * as md5 from "md5";
import * as sanityChecks from "./sanityChecks";
import * as fs from "fs";
import * as path from "path";

export const amiUser = "chan_dongle_extended";
export const port = 48399;

export function getSimCountryAndSp(
    imsi: string
): (types.Sim.Country & { serviceProvider: string; }) | undefined {

    if (getSimCountryAndSp.cache.has(imsi)) {
        return getSimCountryAndSp.cache.get(imsi);
    }

    if (!sanityChecks.imsi(imsi)) {
        throw new Error("imsi malformed");
    }

    let mccmnc = getSimCountryAndSp.getMccmnc();

    let imsiInfos = mccmnc[imsi.substr(0, 6)] || mccmnc[imsi.substr(0, 5)];

    getSimCountryAndSp.cache.set(imsi, 
        imsiInfos ? ({
            "name": imsiInfos.country_name,
            "iso": (imsiInfos.country_iso || "US").toLowerCase(),
            "code": parseInt(imsiInfos.country_code),
            "serviceProvider": imsiInfos.network_name
        }) : undefined
    );

    return getSimCountryAndSp(imsi);

}

export namespace getSimCountryAndSp {

    export type ImsiInfos = {
        mcc: string;
        mnc: string;
        country_iso: string | null;
        country_name: string;
        country_code: string;
        network_name: string;
    };

    let mccmnc: Record<string, ImsiInfos> | undefined = undefined;

    export function getMccmnc(): Record<string, ImsiInfos> {

        if (mccmnc) {
            return mccmnc;
        }

        mccmnc = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, "..", "..", "res", "mccmnc.json"),
                "utf8"
            )
        );

        return getMccmnc();

    }

    export const cache = new Map<string, (types.Sim.Country & { serviceProvider: string; }) | undefined>();

}

/** Convert a number to national dry or return itself */
export function toNationalNumber(
    number: string,
    imsi: string
): string {

    let simCountry= getSimCountryAndSp(imsi);

    if( !simCountry ){
        return number;
    }

    if (number.match(/[^\+0-9]/)) {
        return number;
    }

    let pn = new PhoneNumber(number, simCountry.iso.toUpperCase());

    if (!pn.isValid() || (pn.getRegionCode() || "" ).toLowerCase() !== simCountry.iso) {
        return number;
    }

    return pn.getNumber("national").replace(/[^0-9]/g, "");

}

export function computeSimStorageDigest(
    number: string | undefined,
    storageLeft: number,
    contacts: types.Sim.Contact[]
): string {

    let strArr = contacts
        .sort((c1, c2) => c1.index - c2.index)
        .map(c => `${c.index}${c.name.asStored}${c.number.asStored}`);

    strArr.push(`${number}`);
    strArr.push(`${storageLeft}`);

    return md5(strArr.join(""));

}

