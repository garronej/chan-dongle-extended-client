import * as types from "./types";
export declare type ImsiInfos = {
    mcc: string;
    mnc: string;
    country_iso: string | null;
    country_name: string;
    country_code: string;
    network_name: string;
    msin: string;
};
export declare function getImsiInfos(imsi: string): ImsiInfos | undefined;
export declare namespace getImsiInfo {
    const cache: Map<string, ImsiInfos | undefined>;
}
export declare namespace SimCountry {
    function sanityCheck(country: types.Sim.Country | undefined): boolean;
    function getFromImsi(imsi: string): types.Sim.Country | undefined;
}
export declare function toNationalNumber(number: string, imsi: string): string;
export declare function computeSimStorageDigest(number: string | undefined, storageLeft: number, contacts: types.Sim.Contact[]): string;
export declare const amiUser = "dongle_ext_user";
