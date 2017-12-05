import PhoneNumber from "awesome-phonenumber";
import { grok } from "imsi-grok"

export interface ImsiInfos {
    mcc: string;
    mnc: string;
    country_iso: string;
    country_name: string;
    country_code: string;
    network_name: string;
    msin: string;
}

const cacheImsiInfos= new Map<string, ImsiInfos | undefined>();

export function getImsiInfos(imsi: string): ImsiInfos | undefined {

    if( cacheImsiInfos.has(imsi) )
        return cacheImsiInfos.get(imsi);

    cacheImsiInfos.set(imsi, grok(imsi) || undefined);

    return getImsiInfos(imsi);

}


const cacheNationalNumber= new Map<string, string>();

export function toNationalNumber(number: string, imsi: string): string{

    let key= `${number}${imsi}`;

    if( cacheNationalNumber.has(key) )
        return cacheNationalNumber.get(key)!;

    let result: string;

    try{

        if( number.match(/[^\+0-9]/) ) throw new Error();

        let imsiInfos = getImsiInfos(imsi)!;

        if( !imsiInfos ) throw new Error();

        let pn= new PhoneNumber(number, imsiInfos.country_iso);

        if( !pn.isValid() || pn.getRegionCode() !== imsiInfos.country_iso ) 
            throw new Error();

        result= pn.getNumber("national").replace(/[^0-9]/g, "");

    }catch(error){

        result= number;

    }

    cacheNationalNumber.set(key, result);

    return toNationalNumber(number, imsi);

}

