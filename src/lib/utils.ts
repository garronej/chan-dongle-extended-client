import PhoneNumber from "awesome-phonenumber";
import { grok as imsiGrok } from "imsi-grok"
const mccmnc = require("mccmnc.json");

export type ImsiInfos = {
    mcc: string;
    mnc: string;
    country_iso: string | null;
    country_name: string;
    country_code: string;
    network_name: string;
    msin: string;
};

export function getImsiInfos(imsi: string): ImsiInfos | undefined {

    if( getImsiInfo.cache.has(imsi) ){
        return getImsiInfo.cache.get(imsi);
    }

    let imsiInfo: ImsiInfos | undefined= imsiGrok(imsi);

    if( imsiInfo ){

        if( imsiInfo.network_name === "Lliad/FREE Mobile" ){
            imsiInfo.network_name= "Free Mobile";
        }

    }

    getImsiInfo.cache.set(imsi, imsiInfo);

    return getImsiInfos(imsi);

}

export namespace getImsiInfo {

    export const cache= new Map<string, ImsiInfos | undefined>();

}

export type SimCountry = {
    name: string;
    iso: string;
    code: number;
};

export namespace SimCountry {

    const setSanityCheck = new Set<string>();

    (() => {

        for (let key in mccmnc) {

            let { country_iso, country_name, country_code } = mccmnc[key];

            country_iso= (country_iso || "US").toLowerCase();

            setSanityCheck.add(`${country_iso}${country_name}${country_code}`);

        }

    })();

    export function sanityCheck(country: SimCountry | undefined): boolean {
        return (
            country instanceof Object &&
            setSanityCheck.has(`${country.iso}${country.name}${country.code}`)
        );
    }

    export function getFromImsi(
        imsi: string
    ): SimCountry | undefined {

        let imsiInfo = getImsiInfos(imsi);

        return imsiInfo ? ({
            "name": imsiInfo.country_name,
            "iso": (imsiInfo.country_iso || "US").toLowerCase(),
            "code": parseInt(imsiInfo.country_code)
        }) : undefined;

    }

}

export function toNationalNumber(
    number: string,
    imsi: string
): string {

    let imsiInfo = getImsiInfos(imsi);

    if (!imsiInfo || !imsiInfo.country_iso) {
        return number;
    }

    if (number.match(/[^\+0-9]/)) {
        return number;
    }

    let pn = new PhoneNumber(number, imsiInfo.country_iso);

    if (!pn.isValid() || pn.getRegionCode() !== imsiInfo.country_iso) {
        return number;
    }

    return pn.getNumber("national").replace(/[^0-9]/g, "");

}
