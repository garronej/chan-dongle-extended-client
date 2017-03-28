import { ini } from "ini-extended";
import { readFileSync, existsSync } from "fs";
import * as path from "path";

export const asteriskConfDirPath= path.join("/etc", "asterisk");
export const managerConfPath = path.join(asteriskConfDirPath, "manager.conf");

export interface Credential {
    port: number;
    host: string;
    user: string;
    secret: string;
};

let credential: Credential | undefined= undefined;

export namespace AmiCredential {

    export function retrieve(confFilePath?: string): Credential {

        if (credential) return credential;

        return credential = init(confFilePath || managerConfPath);

    }

}

function init(path: string): Credential {

    if( !existsSync(path) )
        throw new Error("NO_FILE");

    let config = ini.parseStripWhitespace(readFileSync(path, "utf8"))

    let general: {
        enabled?: "yes" | "no";
        port?: string;
        bindaddr?: string;
    } = config.general || {};

    if (general.enabled !== "yes")
        throw new Error("NOT_ENABLED");

    let port: number = general.port ? parseInt(general.port) : 5038;
    let host: string =
        (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";

    delete config.general;

    for (let userName of Object.keys(config)) {

        let userConfig: {
            secret?: string;
            read?: string;
            write?: string;
        } = config[userName];

        if (
            !userConfig.secret ||
            !userConfig.write ||
            !userConfig.read
        ) continue;

        if (
            isGranted(getListAuthority(userConfig.read!)) &&
            isGranted(getListAuthority(userConfig.write!))
        ) {

            return {
                port,
                host,
                "user": userName,
                "secret": userConfig.secret
            };

        }

    }

    throw Error("NO_USER");

}



function getListAuthority(strList: string): string[] {

    strList = strList.replace(/\ /g, "");

    return strList.split(",");

}

function isGranted(list: string[]): boolean {

    let hasUser = false;
    let hasSystem = false;
    let hasConfig = false;

    for (let authority of list) {

        if (authority.toLowerCase() === "all")
            return true;

        if (authority.toLocaleLowerCase() === "user")
            hasUser = true;

        if (authority.toLocaleLowerCase() === "system")
            hasSystem = true;

        if (authority.toLocaleLowerCase() === "config")
            hasConfig = true;

    }

    return hasUser && (hasSystem || hasConfig);

}