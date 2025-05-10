"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = exports.ReleaseChannel = void 0;
var ReleaseChannel;
(function (ReleaseChannel) {
    ReleaseChannel["PRODUCTION"] = "production";
    ReleaseChannel["STAGING"] = "staging";
    ReleaseChannel["DEVELOPMENT"] = "development";
})(ReleaseChannel || (exports.ReleaseChannel = ReleaseChannel = {}));
var Platform;
(function (Platform) {
    Platform["IOS"] = "ios";
    Platform["ANDROID"] = "android";
    Platform["WEB"] = "web";
})(Platform || (exports.Platform = Platform = {}));
