export declare const asteriskConfDirPath: string;
export interface Credential {
    port: number;
    host: string;
    user: string;
    secret: string;
}
export declare namespace AmiCredential {
    function retrieve(confFilePath?: string): Credential;
}
