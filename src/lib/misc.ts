import * as types from "./types";
import * as md5 from "md5";
import * as sanityChecks from "./sanityChecks";
import * as fs from "fs";
import * as path from "path";

export const port = 48399;

export function getSimCountryAndSp(
    imsi: string
): (types.Sim.Country & { serviceProvider: string; }) | undefined {

    if (!sanityChecks.imsi(imsi)) {
        throw new Error("imsi malformed");
    }

    let mccmnc = getSimCountryAndSp.getMccmnc();

    let imsiInfos = mccmnc[imsi.substr(0, 6)] || mccmnc[imsi.substr(0, 5)];

    return imsiInfos ? ({
        "name": imsiInfos.country_name,
        "iso": (imsiInfos.country_iso || "US").toLowerCase(),
        "code": parseInt(imsiInfos.country_code),
        "serviceProvider": imsiInfos.network_name
    }) : undefined


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

}

export function computeSimStorageDigest(
    number: string | undefined,
    storageLeft: number,
    contacts: types.Sim.Contact[]
): string {

    let strArr = contacts
        .sort((c1, c2) => c1.index - c2.index)
        .map(c => `${c.index}${c.name}${c.number}`);

    strArr.push(`${number}`);
    strArr.push(`${storageLeft}`);

    return md5(strArr.join(""));

}

export function updateStorageDigest(
    storage: types.Sim.Storage
): void {

    storage.digest = computeSimStorageDigest(
        storage.number,
        storage.infos.storageLeft,
        storage.contacts
    );

}

