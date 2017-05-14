"use strict";
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
var ts_ami_1 = require("ts-ami");
var js_base64_1 = require("js-base64");
function firstByte(nByte, str) {
    var head = "";
    try {
        for (var str_1 = __values(str), str_1_1 = str_1.next(); !str_1_1.done; str_1_1 = str_1.next()) {
            var char = str_1_1.value;
            if (Buffer.byteLength(head + char) > nByte)
                break;
            head += char;
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (str_1_1 && !str_1_1.done && (_a = str_1.return)) _a.call(str_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return [head, str.substring(head.length, str.length)];
    var e_1, _a;
}
function divideByByte(maxByte, str) {
    function callee(state, rest) {
        if (!rest)
            return state;
        var _a = __read(firstByte(maxByte, rest), 2), head = _a[0], newRest = _a[1];
        state.push(head);
        return callee(state, newRest);
    }
    return callee([], str);
}
function lineSplit(str, encodeFunction, key) {
    var maxBytePerLine = ts_ami_1.lineMaxByteLength - Buffer.byteLength(key + ": \r\n");
    var enc = encodeFunction(str);
    return divideByByte(maxBytePerLine, enc);
}
exports.lineSplit = lineSplit;
function lineSplitBase64(str, key) {
    return lineSplit(str, js_base64_1.Base64.encode, key);
}
exports.lineSplitBase64 = lineSplitBase64;
//# sourceMappingURL=lineSplit.js.map