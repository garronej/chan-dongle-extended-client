"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var controller;
(function (controller) {
    var notifyCurrentState;
    (function (notifyCurrentState) {
        notifyCurrentState.methodName = "notifyCurrentState";
    })(notifyCurrentState = controller.notifyCurrentState || (controller.notifyCurrentState = {}));
    var updateMap;
    (function (updateMap) {
        updateMap.methodName = "updateMap";
    })(updateMap = controller.updateMap || (controller.updateMap = {}));
    var notifyMessage;
    (function (notifyMessage) {
        notifyMessage.methodName = "notifyMessage";
    })(notifyMessage = controller.notifyMessage || (controller.notifyMessage = {}));
    var notifyStatusReport;
    (function (notifyStatusReport) {
        notifyStatusReport.methodName = "notifyStatusReport";
    })(notifyStatusReport = controller.notifyStatusReport || (controller.notifyStatusReport = {}));
})(controller = exports.controller || (exports.controller = {}));
var service;
(function (service) {
    var sendMessage;
    (function (sendMessage) {
        sendMessage.methodName = "sendMessage";
    })(sendMessage = service.sendMessage || (service.sendMessage = {}));
    var unlock;
    (function (unlock) {
        unlock.methodName = "unlock";
        function matchPin(p) {
            return !!p.pin;
        }
        unlock.matchPin = matchPin;
    })(unlock = service.unlock || (service.unlock = {}));
    var getMessages;
    (function (getMessages) {
        getMessages.methodName = "getMessages";
    })(getMessages = service.getMessages || (service.getMessages = {}));
})(service = exports.service || (exports.service = {}));
