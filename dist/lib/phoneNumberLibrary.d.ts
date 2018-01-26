export interface ImsiInfos {
    mcc: string;
    mnc: string;
    country_iso: string | null;
    country_name: string;
    country_code: string;
    network_name: string;
    msin: string;
}
export declare function getImsiInfos(imsi: string): ImsiInfos | undefined;
export declare function toNationalNumber(number: string, countryIso: string): string;
