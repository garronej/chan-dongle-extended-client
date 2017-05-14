export declare function textSplit(text: string, encodeFunction: (str: string) => string, order: "SPLIT-ENCODE" | "ENCODE-SPLIT", maxBytePerPart: number, offsetByte?: number): string[];
export declare function textSplitBase64ForAmiEncodeFirst(text: string, key: string): string[];
export declare function textSplitBase64ForAmiSplitFirst(text: string, key: string): string[];
