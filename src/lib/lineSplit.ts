import { lineMaxByteLength } from "ts-ami";
import { Base64 } from "js-base64";

function firstByte( nByte: number, str: string): [ string, string ] {

    let head= "";

    for( let char of str){

        if( Buffer.byteLength(head + char) > nByte ) 
            break;
        
        head+= char;

    }

    return [head, str.substring(head.length, str.length) ];

}


function divideByByte(maxByte: number, str: string): string[] {

    function callee(state: string[], rest: string): string[] {

        if( !rest ) return state;

        let [ head, newRest ]= firstByte(maxByte, rest);
        
        state.push(head);

        return callee(state, newRest);

    }

    return callee([], str);

}


export function lineSplit(str: string, encodeFunction: (str: string)=> string, key: string): string[] {

     let maxBytePerLine = lineMaxByteLength - Buffer.byteLength(`${key}: \r\n`);

     let enc= encodeFunction(str);

     return divideByByte(maxBytePerLine, enc);
    
}

export function lineSplitBase64(str: string, key: string): string[] {

    return lineSplit(str, Base64.encode, key);

}

