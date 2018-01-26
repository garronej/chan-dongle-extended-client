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
export declare type SimCountry = {
    name: string;
    iso: string;
    code: number;
};
export declare namespace SimCountry {
    function sanityCheck(country: SimCountry | undefined): boolean;
    function getFromImsi(imsi: string): SimCountry | undefined;
}
export declare function toNationalNumber(number: string, imsi: string): string;
