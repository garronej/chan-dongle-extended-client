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
var ts_events_extended_1 = require("ts-events-extended");
var ts_ami_1 = require("ts-ami");
var trackable_map_1 = require("trackable-map");
var _private = require("./private");
var api = _private.api;
var DongleController = /** @class */ (function () {
    function DongleController(asteriskManagerCredential) {
        this.dongles = new trackable_map_1.TrackableMap();
        this.evtMessage = new ts_events_extended_1.SyncEvent();
        this.evtStatusReport = new ts_events_extended_1.SyncEvent();
        if (asteriskManagerCredential) {
            this.ami = new ts_ami_1.Ami(asteriskManagerCredential);
        }
        else {
            this.ami = new ts_ami_1.Ami(_private.amiUser);
        }
        this.apiClient = this.ami.createApiClient(DongleController.apiId);
        this.initialization = this.initialize();
    }
    Object.defineProperty(DongleController, "hasInstance", {
        get: function () {
            return !!this.instance;
        },
        enumerable: true,
        configurable: true
    });
    DongleController.getInstance = function (asteriskManagerCredential) {
        if (this.instance)
            return this.instance;
        this.instance = new this(asteriskManagerCredential);
        return this.instance;
    };
    DongleController.prototype.disconnect = function () {
        if (DongleController.instance === this) {
            DongleController.instance = undefined;
        }
        return this.ami.disconnect();
    };
    DongleController.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var initializationResponse, error_1, dongles, moduleConfiguration, dongles_1, dongles_1_1, dongle, e_1, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.apiClient.makeRequest(api.initialize.method)];
                    case 1:
                        initializationResponse = _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _b.sent();
                        this.disconnect();
                        throw error_1;
                    case 3:
                        dongles = initializationResponse.dongles, moduleConfiguration = initializationResponse.moduleConfiguration;
                        try {
                            for (dongles_1 = __values(dongles), dongles_1_1 = dongles_1.next(); !dongles_1_1.done; dongles_1_1 = dongles_1.next()) {
                                dongle = dongles_1_1.value;
                                this.dongles.set(dongle.imei, dongle);
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (dongles_1_1 && !dongles_1_1.done && (_a = dongles_1.return)) _a.call(dongles_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        this.moduleConfiguration = moduleConfiguration;
                        this.apiClient.evtEvent.attach(function (_a) {
                            var name = _a.name, event = _a.event;
                            if (name === api.Events.updateMap.name) {
                                var dongleImei = event.dongleImei, dongle = event.dongle;
                                if (!dongle) {
                                    _this.dongles.delete(dongleImei);
                                }
                                else {
                                    _this.dongles.set(dongleImei, dongle);
                                }
                            }
                            else if (name === api.Events.message.name) {
                                var dongleImei = event.dongleImei, message = event.message;
                                _this.evtMessage.post({
                                    "dongle": _this.activeDongles.get(dongleImei),
                                    message: message
                                });
                            }
                            else if (name === api.Events.statusReport.name) {
                                var dongleImei = event.dongleImei, statusReport = event.statusReport;
                                _this.evtStatusReport.post({
                                    "dongle": _this.activeDongles.get(dongleImei),
                                    statusReport: statusReport
                                });
                            }
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    Object.defineProperty(DongleController.prototype, "isInitialized", {
        get: function () { return !!this.moduleConfiguration; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DongleController.prototype, "lockedDongles", {
        get: function () {
            var out = new Map();
            try {
                for (var _a = __values(this.dongles), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), imei = _c[0], dongle = _c[1];
                    if (!DongleController.LockedDongle.match(dongle))
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
    Object.defineProperty(DongleController.prototype, "activeDongles", {
        get: function () {
            var out = new Map();
            try {
                for (var _a = __values(this.dongles), _b = _a.next(); !_b.done; _b = _a.next()) {
                    var _c = __read(_b.value, 2), imei = _c[0], dongle = _c[1];
                    if (!DongleController.ActiveDongle.match(dongle))
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
    DongleController.prototype.sendMessage = function (viaDongleImei, toNumber, text) {
        return __awaiter(this, void 0, void 0, function () {
            var params, returnValue;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.activeDongles.has(viaDongleImei)) {
                            throw new Error("This dongle is not currently connected");
                        }
                        params = { viaDongleImei: viaDongleImei, toNumber: toNumber, text: text };
                        return [4 /*yield*/, this.apiClient.makeRequest(api.sendMessage.method, params, 240000)];
                    case 1:
                        returnValue = _a.sent();
                        return [2 /*return*/, returnValue];
                }
            });
        });
    };
    DongleController.prototype.unlock = function () {
        var inputs = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            inputs[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var _a, dongleImei, p2, p3, dongle, params, unlockResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = __read(inputs, 3), dongleImei = _a[0], p2 = _a[1], p3 = _a[2];
                        dongle = this.lockedDongles.get(dongleImei);
                        if (!dongle) {
                            throw new Error("This dongle is not currently locked");
                        }
                        if (p3) {
                            params = { dongleImei: dongleImei, "puk": p2, "newPin": p3 };
                        }
                        else {
                            params = { dongleImei: dongleImei, "pin": p2 };
                        }
                        return [4 /*yield*/, this.apiClient.makeRequest(api.unlock.method, params, 30000)];
                    case 1:
                        unlockResult = _b.sent();
                        if (!unlockResult.success) {
                            dongle.sim.pinState = unlockResult.pinState;
                            dongle.sim.tryLeft = unlockResult.tryLeft;
                        }
                        return [2 /*return*/, unlockResult];
                }
            });
        });
    };
    DongleController.prototype.getMessages = function (params) {
        return this.apiClient.makeRequest(api.getMessages.method, params);
    };
    DongleController.instance = undefined;
    return DongleController;
}());
exports.DongleController = DongleController;
(function (DongleController) {
    DongleController.apiId = "dongle-extended";
    var LockedDongle;
    (function (LockedDongle) {
        function match(dongle) {
            return dongle.sim.pinState !== undefined;
        }
        LockedDongle.match = match;
    })(LockedDongle = DongleController.LockedDongle || (DongleController.LockedDongle = {}));
    var ActiveDongle;
    (function (ActiveDongle) {
        function match(dongle) {
            return !LockedDongle.match(dongle);
        }
        ActiveDongle.match = match;
    })(ActiveDongle = DongleController.ActiveDongle || (DongleController.ActiveDongle = {}));
})(DongleController = exports.DongleController || (exports.DongleController = {}));
exports.DongleController = DongleController;
