"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.id = "dongle-extended";
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
        periodicalSignal.interval = 6000;
    })(periodicalSignal = Events.periodicalSignal || (Events.periodicalSignal = {}));
})(Events = exports.Events || (exports.Events = {}));
var initialize;
(function (initialize) {
    initialize.method = "initialize";
})(initialize = exports.initialize || (exports.initialize = {}));
var sendMessage;
(function (sendMessage) {
    sendMessage.method = "sendMessage";
})(sendMessage = exports.sendMessage || (exports.sendMessage = {}));
var unlock;
(function (unlock) {
    unlock.method = "unlock";
    function matchPin(p) {
        return !!p.pin;
    }
    unlock.matchPin = matchPin;
})(unlock = exports.unlock || (exports.unlock = {}));
var getMessages;
(function (getMessages) {
    getMessages.method = "getMessages";
})(getMessages = exports.getMessages || (exports.getMessages = {}));
