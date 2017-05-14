import { lineMaxByteLength } from "ts-ami";
import { Base64 } from "js-base64";


function splitStep(
    nByte: number,
    text: string,
    encodeFunction: (str: string) => string
): [string, string] {

    for (let index = 0; index < text.length; index++) {

        if (Buffer.byteLength(encodeFunction(text.substring(0, index + 1))) > nByte) {

            if (index === 0) throw new Error("nByte to small to split this string with this encoding");

            return [encodeFunction(text.substring(0, index)), text.substring(index, text.length)];

        }

    }

    return [encodeFunction(text), ""];

}


function performSplit(
    maxByte: number,
    text: string,
    encodingFunction: (str: string) => string
): string[] {

    function callee(state: string[], rest: string): string[] {

        if (!rest) return state;

        let [encodedPart, newRest] = splitStep(maxByte, rest, encodingFunction);

        state.push(encodedPart);

        return callee(state, newRest);

    }

    return callee([], text);

}



export function textSplit(
    text: string,
    encodeFunction: (str: string) => string,
    order: "SPLIT-ENCODE" | "ENCODE-SPLIT",
    maxBytePerPart: number,
    offsetByte?: number
): string[] {

    if (typeof (offsetByte) === "number")
        maxBytePerPart = maxBytePerPart - offsetByte;

    switch (order) {
        case "SPLIT-ENCODE":
            return performSplit(maxBytePerPart, text, encodeFunction);
        case "ENCODE-SPLIT":
            return performSplit(maxBytePerPart, encodeFunction(text), str => str);
    }


}

function textSplitBase64ForAmi(
    text: string,
    order: "SPLIT-ENCODE" | "ENCODE-SPLIT",
    key: string
): string[] {

    return textSplit(
        text,
        Base64.encode,
        order,
        lineMaxByteLength - 1,
        Buffer.byteLength(`${key}: \r\n`)
    );

}

export function textSplitBase64ForAmiEncodeFirst(text: string, key: string): string[] {

    return textSplitBase64ForAmi(text, "ENCODE-SPLIT", key);

}


export function textSplitBase64ForAmiSplitFirst(text: string, key: string): string[] {

    return textSplitBase64ForAmi(text, "SPLIT-ENCODE", key);

}



