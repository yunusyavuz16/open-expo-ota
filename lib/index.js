"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Platform = exports.ReleaseChannel = exports.useUpdates = exports.useSelfHostedUpdates = exports.UpdatesProvider = void 0;
// Export core functionality
var provider_1 = require("./provider");
Object.defineProperty(exports, "UpdatesProvider", { enumerable: true, get: function () { return provider_1.UpdatesProvider; } });
Object.defineProperty(exports, "useSelfHostedUpdates", { enumerable: true, get: function () { return provider_1.useSelfHostedUpdates; } });
var hooks_1 = require("./hooks");
Object.defineProperty(exports, "useUpdates", { enumerable: true, get: function () { return hooks_1.useUpdates; } });
// Export types
var types_1 = require("./types");
Object.defineProperty(exports, "ReleaseChannel", { enumerable: true, get: function () { return types_1.ReleaseChannel; } });
Object.defineProperty(exports, "Platform", { enumerable: true, get: function () { return types_1.Platform; } });
// Export the main class
const updates_1 = __importDefault(require("./updates"));
exports.default = updates_1.default;
