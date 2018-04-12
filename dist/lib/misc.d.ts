import * as types from "./types";
export declare const amiUser = "chan_dongle_extended";
export declare const port = 48399;
export declare function getSimCountryAndSp(imsi: string): (types.Sim.Country & {
    serviceProvider: string;
}) | undefined;
export declare namespace getSimCountryAndSp {
    type ImsiInfos = {
        mcc: string;
        mnc: string;
        country_iso: string | null;
        country_name: string;
        country_code: string;
        network_name: string;
    };
    function getMccmnc(): Record<string, ImsiInfos>;
    const cache: Map<string, (types.Sim.Country & {
        serviceProvider: string;
    }) | undefined>;
}
/** Convert a number to national dry or return itself */
export declare function toNationalNumber(number: string, imsi: string): string;
export declare function computeSimStorageDigest(number: string | undefined, storageLeft: number, contacts: types.Sim.Contact[]): string;
