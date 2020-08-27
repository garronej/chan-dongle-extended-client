"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dongle = void 0;
var Dongle;
(function (Dongle) {
    var Locked;
    (function (Locked) {
        function match(dongle) {
            return dongle.sim.pinState !== undefined;
        }
        Locked.match = match;
    })(Locked = Dongle.Locked || (Dongle.Locked = {}));
    var Usable;
    (function (Usable) {
        function match(dongle) {
            return !Locked.match(dongle);
        }
        Usable.match = match;
    })(Usable = Dongle.Usable || (Dongle.Usable = {}));
})(Dongle = exports.Dongle || (exports.Dongle = {}));
