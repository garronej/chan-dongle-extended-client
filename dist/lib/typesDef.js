"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typesDef;
(function (typesDef) {
    typesDef.errorMessages = {
        "dongleNotFound": "Dongle not found",
        "messageNotSent": "Message not sent",
        "noStorageLeft": "No storage left on SIM card"
    };
    typesDef.defaultConfig = {
        "general": {
            "interval": "10000000",
            "jbenable": "no",
            "jbmaxsize": "100",
            "jbimpl": "fixed"
        },
        "defaults": {
            "context": "from-dongle",
            "group": "0",
            "rxgain": "0",
            "txgain": "0",
            "autodeletesms": "no",
            "resetdongle": "yes",
            "u2diag": "-1",
            "usecallingpres": "yes",
            "callingpres": "allowed_passed_screen",
            "disablesms": "no",
            "language": "en",
            "smsaspdu": "yes",
            "mindtmfgap": "45",
            "mindtmfduration": "80",
            "mindtmfinterval": "200",
            "callwaiting": "auto",
            "disable": "no",
            "initstate": "start",
            "exten": "+12345678987",
            "dtmf": "relax"
        }
    };
})(typesDef = exports.typesDef || (exports.typesDef = {}));
