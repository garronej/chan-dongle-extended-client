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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var trackable_map_1 = require("trackable-map");
var types = require("./types");
var ts_events_extended_1 = require("ts-events-extended");
var net = require("net");
var apiDeclaration_1 = require("./apiDeclaration");
var sipLibrary = require("ts-sip");
var misc = require("./misc");
var DongleController = /** @class */ (function () {
    function DongleController(host, port) {
        var _this = this;
        this.dongles = new trackable_map_1.TrackableMap();
        this.evtMessage = new ts_events_extended_1.SyncEvent();
        this.evtStatusReport = new ts_events_extended_1.SyncEvent();
        /** evtData is hasError */
        this.evtClose = new ts_events_extended_1.VoidSyncEvent();
        /** post isSuccess */
        this.evtInitializationCompleted = new ts_events_extended_1.SyncEvent();
        /** resolve when instance ready to be used; reject if initialization fail */
        this.prInitialization = new Promise(function (resolve, reject) {
            var error = new Error("DongleController initialization error");
            _this.evtInitializationCompleted.waitFor(3 * 1000)
                .then(function (isSuccess) { return isSuccess ? resolve() : reject(error); })
                .catch(function () { return reject(error); });
        });
        this.socket = new sipLibrary.Socket(net.connect({ host: host, port: port }));
        (new sipLibrary.api.Server(this.makeLocalApiHandlers()))
            .startListening(this.socket);
        sipLibrary.api.client.enableKeepAlive(this.socket, 5 * 1000);
        sipLibrary.api.client.enableErrorLogging(this.socket, sipLibrary.api.client.getDefaultErrorLogger({
            "idString": "DongleController",
            "log": DongleController.log
        }));
        this.socket.evtClose.attachOnce(function () {
            if (!_this.evtInitializationCompleted.postCount) {
                _this.evtInitializationCompleted.post(false);
            }
            _this.evtClose.post();
        });
    }
    Object.defineProperty(DongleController.prototype, "isInitialized", {
        get: function () {
            return !!this.evtInitializationCompleted.postCount;
        },
        enumerable: true,
        configurable: true
    });
    DongleController.prototype.destroy = function () {
        this.socket.destroy();
    };
    DongleController.prototype.sendApiRequest = function (methodName, params) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, sipLibrary.api.client.sendRequest(this.socket, methodName, params)];
                    case 1: return [2 /*return*/, _b.sent()];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, new Promise(function (resolve) { })];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DongleController.prototype.makeLocalApiHandlers = function () {
        var _this = this;
        var handlers = {};
        (function () {
            var methodName = apiDeclaration_1.controller.notifyCurrentState.methodName;
            var handler = {
                "handler": function (_a) {
                    var staticModuleConfiguration = _a.staticModuleConfiguration, dongles = _a.dongles;
                    try {
                        for (var dongles_1 = __values(dongles), dongles_1_1 = dongles_1.next(); !dongles_1_1.done; dongles_1_1 = dongles_1.next()) {
                            var dongle = dongles_1_1.value;
                            _this.dongles.set(dongle.imei, dongle);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (dongles_1_1 && !dongles_1_1.done && (_b = dongles_1.return)) _b.call(dongles_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    _this.staticModuleConfiguration = staticModuleConfiguration;
                    _this.evtInitializationCompleted.post(true);
                    return Promise.resolve(undefined);
                    var e_1, _b;
                }
            };
            handlers[methodName] = handler;
        })();
        (function () {
            var methodName = apiDeclaration_1.controller.updateMap.methodName;
            var handler = {
                "handler": function (_a) {
                    var dongleImei = _a.dongleImei, dongle = _a.dongle;
                    if (!dongle) {
                        _this.dongles.delete(dongleImei);
                    }
                    else {
                        _this.dongles.set(dongleImei, dongle);
                    }
                    return Promise.resolve(undefined);
                }
            };
            handlers[methodName] = handler;
        })();
        (function () {
            var methodName = apiDeclaration_1.controller.notifyMessage.methodName;
            var handler = {
                "handler": function (_a) {
                    var dongleImei = _a.dongleImei, message = _a.message;
                    var pr = new Promise(function (resolve) { return resolve("SAVE MESSAGE"); });
                    _this.evtMessage.post({
                        "dongle": _this.usableDongles.get(dongleImei),
                        message: message,
                        "submitShouldSave": function (prShouldSave) { return pr = prShouldSave; }
                    });
                    return pr;
                }
            };
            handlers[methodName] = handler;
        })();
        (function () {
            var methodName = apiDeclaration_1.controller.notifyStatusReport.methodName;
            var handler = {
                "handler": function (_a) {
                    var dongleImei = _a.dongleImei, statusReport = _a.statusReport;
                    _this.evtStatusReport.post({
                        "dongle": _this.usableDongles.get(dongleImei),
                        statusReport: statusReport
                    });
                    return Promise.resolve(undefined);
                }
            };
            handlers[methodName] = handler;
        })();
        return handlers;
    };
    Object.defineProperty(DongleController.prototype, "lockedDongles", {
        get: function () {
            var out = new Map();
            try {
                for (var _a = __values(this.dongles), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), imei = _c[0], dongle = _c[1];
                    if (!types.Dongle.Locked.match(dongle))
                        continue;
                    out.set(imei, dongle);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return out;
            var e_2, _d;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DongleController.prototype, "usableDongles", {
        get: function () {
            var out = new Map();
            try {
                for (var _a = __values(this.dongles), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), imei = _c[0], dongle = _c[1];
                    if (!types.Dongle.Usable.match(dongle))
                        continue;
                    out.set(imei, dongle);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return out;
            var e_3, _d;
        },
        enumerable: true,
        configurable: true
    });
    /** assert target dongle is connected */
    DongleController.prototype.sendMessage = function (viaDongleImei, toNumber, text) {
        var methodName = apiDeclaration_1.service.sendMessage.methodName;
        return this.sendApiRequest(methodName, { viaDongleImei: viaDongleImei, toNumber: toNumber, text: text });
    };
    DongleController.prototype.unlock = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, dongleImei, p2, p3, dongle, methodName, params, unlockResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = __read(inputs, 3), dongleImei = _a[0], p2 = _a[1], p3 = _a[2];
                        dongle = this.lockedDongles.get(dongleImei);
                        methodName = apiDeclaration_1.service.unlock.methodName;
                        params = (!!p3) ?
                            ({ dongleImei: dongleImei, "puk": p2, "newPin": p3 }) : ({ dongleImei: dongleImei, "pin": p2 });
                        return [4 /*yield*/, this.sendApiRequest(methodName, params)];
                    case 1:
                        unlockResult = _b.sent();
                        if (unlockResult && !unlockResult.success) {
                            if (dongle) {
                                dongle.sim.pinState = unlockResult.pinState;
                                dongle.sim.tryLeft = unlockResult.tryLeft;
                            }
                        }
                        return [2 /*return*/, unlockResult];
                }
            });
        });
    };
    DongleController.prototype.getMessages = function (params) {
        var methodName = apiDeclaration_1.service.getMessages.methodName;
        return this.sendApiRequest(methodName, params);
    };
    DongleController.prototype.getMessagesOfSim = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var methodName, messagesRecord;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        methodName = apiDeclaration_1.service.getMessages.methodName;
                        return [4 /*yield*/, this.sendApiRequest(methodName, params)];
                    case 1:
                        messagesRecord = _a.sent();
                        return [2 /*return*/, messagesRecord[params.imsi] || []];
                }
            });
        });
    };
    Object.defineProperty(DongleController, "hasInstance", {
        get: function () {
            return !!this.instance;
        },
        enumerable: true,
        configurable: true
    });
    DongleController.getInstance = function (host, port) {
        var _this = this;
        if (!!this.instance) {
            return this.instance;
        }
        this.instance = new DongleController(host || "127.0.0.1", port || misc.port);
        this.instance.socket.evtClose.attachOncePrepend(function () { return _this.instance = undefined; });
        return this.instance;
    };
    //Static
    DongleController.instance = undefined;
    return DongleController;
}());
exports.DongleController = DongleController;
(function (DongleController) {
    DongleController.log = console.log.bind(console);
})(DongleController = exports.DongleController || (exports.DongleController = {}));
exports.DongleController = DongleController;
