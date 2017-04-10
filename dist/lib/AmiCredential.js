"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ini_extended_1 = require("ini-extended");
var fs_1 = require("fs");
var path = require("path");
exports.asteriskConfDirPath = path.join("/etc", "asterisk");
exports.managerConfPath = path.join(exports.asteriskConfDirPath, "manager.conf");
;
var credential = undefined;
var AmiCredential;
(function (AmiCredential) {
    function retrieve(confFilePath) {
        if (credential)
            return credential;
        return credential = init(confFilePath || exports.managerConfPath);
    }
    AmiCredential.retrieve = retrieve;
})(AmiCredential = exports.AmiCredential || (exports.AmiCredential = {}));
function init(path) {
    if (!fs_1.existsSync(path))
        throw new Error("NO_FILE");
    var config = ini_extended_1.ini.parseStripWhitespace(fs_1.readFileSync(path, "utf8"));
    var general = config.general || {};
    var port = general.port ? parseInt(general.port) : 5038;
    var host = (general.bindaddr && general.bindaddr !== "0.0.0.0") ? general.bindaddr : "127.0.0.1";
    delete config.general;
    var dongle_ext_user = config["dongle_ext_user"] ? ["dongle_ext_user"] : null;
    for (var _i = 0, _a = (dongle_ext_user || Object.keys(config)); _i < _a.length; _i++) {
        var userName = _a[_i];
        var userConfig = config[userName];
        if (!userConfig.secret ||
            !userConfig.write ||
            !userConfig.read)
            continue;
        if (isGranted(getListAuthority(userConfig.read)) &&
            isGranted(getListAuthority(userConfig.write))) {
            if (general.enabled !== "yes")
                throw new Error("NOT_ENABLED");
            return {
                port: port,
                host: host,
                "user": userName,
                "secret": userConfig.secret
            };
        }
    }
    throw Error("NO_USER");
}
function getListAuthority(strList) {
    strList = strList.replace(/\ /g, "");
    return strList.split(",");
}
function isGranted(list) {
    var hasUser = false;
    var hasSystem = false;
    var hasConfig = false;
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var authority = list_1[_i];
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
//# sourceMappingURL=AmiCredential.js.map