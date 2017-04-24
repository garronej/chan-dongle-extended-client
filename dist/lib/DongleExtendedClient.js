"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts_ami_1 = require("ts-ami");
var AmiUserEvent_1 = require("./AmiUserEvent");
var Response = AmiUserEvent_1.UserEvent.Response;
var Request = AmiUserEvent_1.UserEvent.Request;
var Event = AmiUserEvent_1.UserEvent.Event;
var ts_events_extended_1 = require("ts-events-extended");
var DongleExtendedClient = (function () {
    function DongleExtendedClient(credential) {
        var _this = this;
        this.evtMessageStatusReport = new ts_events_extended_1.SyncEvent();
        this.evtDongleDisconnect = new ts_events_extended_1.SyncEvent();
        this.evtNewActiveDongle = new ts_events_extended_1.SyncEvent();
        this.evtRequestUnlockCode = new ts_events_extended_1.SyncEvent();
        this.evtNewMessage = new ts_events_extended_1.SyncEvent();
        this.evtUserEvent = new ts_events_extended_1.SyncEvent();
        this.lastActionId = "";
        this.ami = new ts_ami_1.Ami(credential);
        this.ami.evt.attach(function (_a) {
            var event = _a.event;
            return event === "UserEvent";
        }, function (userEvent) { return _this.evtUserEvent.post(userEvent); });
        this.evtUserEvent.attach(Event.matchEvt, function (evt) {
            if (Event.MessageStatusReport.matchEvt(evt))
                _this.evtMessageStatusReport.post({
                    "imei": evt.imei,
                    "messageId": parseInt(evt.messageid),
                    "isDelivered": evt.isdelivered === "true",
                    "status": evt.status,
                    "dischargeTime": new Date(evt.dischargetime),
                    "recipient": evt.recipient
                });
            else if (Event.DongleDisconnect.matchEvt(evt))
                _this.evtDongleDisconnect.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
            else if (Event.NewActiveDongle.matchEvt(evt))
                _this.evtNewActiveDongle.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "imsi": evt.imsi,
                    "number": evt.number || undefined,
                    "serviceProvider": evt.serviceprovider || undefined
                });
            else if (Event.RequestUnlockCode.matchEvt(evt))
                _this.evtRequestUnlockCode.post({
                    "imei": evt.imei,
                    "iccid": evt.iccid,
                    "pinState": evt.pinstate,
                    "tryLeft": parseInt(evt.tryleft)
                });
            else if (Event.NewMessage.matchEvt(evt))
                _this.evtNewMessage.post({
                    "imei": evt.imei,
                    "number": evt.number,
                    "date": new Date(evt.date),
                    "text": AmiUserEvent_1.UserEvent.Event.NewMessage.reassembleText(evt)
                });
        });
    }
    DongleExtendedClient.localhost = function () {
        if (this.localClient)
            return this.localClient;
        return this.localClient = new this(ts_ami_1.retrieveCredential({ "user": "dongle_ext_user" }));
    };
    ;
    DongleExtendedClient.prototype.postUserEventAction = function (userEvent) {
        var p = this.ami.postAction(userEvent);
        this.lastActionId = this.ami.lastActionId;
        return p;
    };
    DongleExtendedClient.prototype.disconnect = function () {
        this.ami.disconnect();
    };
    DongleExtendedClient.prototype.getLockedDongles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse, dongleCount, out, evtResponse_1, imei, iccid, pinstate, tryleft;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.GetLockedDongles.buildAction());
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetLockedDongles.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evtResponse = _a.sent();
                        dongleCount = parseInt(evtResponse.donglecount);
                        out = [];
                        _a.label = 2;
                    case 2:
                        if (!(out.length !== dongleCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetLockedDongles.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evtResponse_1 = _a.sent();
                        imei = evtResponse_1.imei, iccid = evtResponse_1.iccid, pinstate = evtResponse_1.pinstate, tryleft = evtResponse_1.tryleft;
                        out.push({
                            imei: imei,
                            iccid: iccid,
                            "pinState": pinstate,
                            "tryLeft": parseInt(tryleft)
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, out];
                }
            });
        });
    };
    DongleExtendedClient.prototype.getActiveDongles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse, dongleCount, out, evtResponse_2, imei, iccid, imsi, number, serviceprovider;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.GetActiveDongles.buildAction());
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetActiveDongles.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evtResponse = _a.sent();
                        dongleCount = parseInt(evtResponse.donglecount);
                        out = [];
                        _a.label = 2;
                    case 2:
                        if (!(out.length !== dongleCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetActiveDongles.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evtResponse_2 = _a.sent();
                        imei = evtResponse_2.imei, iccid = evtResponse_2.iccid, imsi = evtResponse_2.imsi, number = evtResponse_2.number, serviceprovider = evtResponse_2.serviceprovider;
                        out.push({
                            imei: imei,
                            iccid: iccid,
                            imsi: imsi,
                            "number": number || undefined,
                            "serviceProvider": serviceprovider || undefined
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, out];
                }
            });
        });
    };
    //return messageId
    DongleExtendedClient.prototype.sendMessage = function (imei, number, text) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evtResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.SendMessage.buildAction(imei, number, text));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.SendMessage.matchEvt(actionid), 30000)];
                    case 1:
                        evtResponse = _a.sent();
                        if (evtResponse.error)
                            throw new Error(evtResponse.error);
                        return [2 /*return*/, parseInt(evtResponse.messageid)];
                }
            });
        });
    };
    DongleExtendedClient.prototype.getSimPhonebook = function (imei) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, infos, contactCount, contacts, evt_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.GetSimPhonebook.buildAction(imei));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetSimPhonebook.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        infos = {
                            "contactNameMaxLength": parseInt(evt.contactnamemaxlength),
                            "numberMaxLength": parseInt(evt.numbermaxlength),
                            "storageLeft": parseInt(evt.storageleft)
                        };
                        contactCount = parseInt(evt.contactcount);
                        contacts = [];
                        _a.label = 2;
                    case 2:
                        if (!(contacts.length !== contactCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetSimPhonebook.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evt_1 = _a.sent();
                        contacts.push({
                            "index": parseInt(evt_1.index),
                            "name": evt_1.name,
                            "number": evt_1.number
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, { infos: infos, contacts: contacts }];
                }
            });
        });
    };
    DongleExtendedClient.prototype.createContact = function (imei, name, number) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, contact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.CreateContact.buildAction(imei, name, number));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.CreateContact.matchEvt(actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        contact = {
                            "index": parseInt(evt.index),
                            "name": evt.name,
                            "number": evt.number
                        };
                        return [2 /*return*/, contact];
                }
            });
        });
    };
    DongleExtendedClient.prototype.getMessages = function (imei, flush) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt, messagesCount, messages, evt_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.GetMessages.buildAction(imei, flush ? "true" : "false"));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetMessages.Infos.matchEvt(actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        messagesCount = parseInt(evt.messagescount);
                        messages = [];
                        _a.label = 2;
                    case 2:
                        if (!(messages.length !== messagesCount)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.GetMessages.Entry.matchEvt(actionid), 10000)];
                    case 3:
                        evt_2 = _a.sent();
                        messages.push({
                            "number": evt_2.number,
                            "date": new Date(evt_2.date),
                            "text": Response.GetMessages.Entry.reassembleText(evt_2)
                        });
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/, messages];
                }
            });
        });
    };
    DongleExtendedClient.prototype.deleteContact = function (imei, index) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.DeleteContact.buildAction(imei, index.toString()));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.matchEvt(Request.DeleteContact.keyword, actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        return [2 /*return*/];
                }
            });
        });
    };
    DongleExtendedClient.prototype.unlockDongle = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var imei, pin, puk, newPin, actionid, evt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        imei = inputs[0];
                        if (inputs.length === 2) {
                            pin = inputs[1];
                            this.postUserEventAction(Request.UnlockDongle.buildAction(imei, pin));
                        }
                        else {
                            puk = inputs[1];
                            newPin = inputs[2];
                            this.postUserEventAction(Request.UnlockDongle.buildAction(imei, puk, newPin));
                        }
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.matchEvt(Request.UnlockDongle.keyword, actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        return [2 /*return*/];
                }
            });
        });
    };
    DongleExtendedClient.prototype.updateNumber = function (imei, number) {
        return __awaiter(this, void 0, void 0, function () {
            var actionid, evt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.postUserEventAction(Request.UpdateNumber.buildAction(imei, number));
                        actionid = this.lastActionId;
                        return [4 /*yield*/, this.evtUserEvent.waitFor(Response.matchEvt(Request.UpdateNumber.keyword, actionid), 10000)];
                    case 1:
                        evt = _a.sent();
                        if (evt.error)
                            throw new Error(evt.error);
                        return [2 /*return*/];
                }
            });
        });
    };
    return DongleExtendedClient;
}());
DongleExtendedClient.localClient = undefined;
exports.DongleExtendedClient = DongleExtendedClient;
//# sourceMappingURL=DongleExtendedClient.js.map