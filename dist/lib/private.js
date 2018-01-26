"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amiUser = "dongle_ext_user";
exports.defaultConfig = {
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
var api;
(function (api) {
    var Events;
    (function (Events) {
        var updateMap;
        (function (updateMap) {
            updateMap.name = "updateMap";
        })(updateMap = Events.updateMap || (Events.updateMap = {}));
        var message;
        (function (message) {
            message.name = "message";
        })(message = Events.message || (Events.message = {}));
        var statusReport;
        (function (statusReport) {
            statusReport.name = "statusReport";
        })(statusReport = Events.statusReport || (Events.statusReport = {}));
        var periodicalSignal;
        (function (periodicalSignal) {
            periodicalSignal.name = "periodicalSignal";
            periodicalSignal.interval = 15000;
        })(periodicalSignal = Events.periodicalSignal || (Events.periodicalSignal = {}));
    })(Events = api.Events || (api.Events = {}));
    var initialize;
    (function (initialize) {
        initialize.method = "initialize";
    })(initialize = api.initialize || (api.initialize = {}));
    var sendMessage;
    (function (sendMessage) {
        sendMessage.method = "sendMessage";
    })(sendMessage = api.sendMessage || (api.sendMessage = {}));
    var unlock;
    (function (unlock) {
        unlock.method = "unlock";
        function matchPin(p) {
            return !!p.pin;
        }
        unlock.matchPin = matchPin;
    })(unlock = api.unlock || (api.unlock = {}));
    var getMessages;
    (function (getMessages) {
        getMessages.method = "getMessages";
    })(getMessages = api.getMessages || (api.getMessages = {}));
})(api = exports.api || (exports.api = {}));
