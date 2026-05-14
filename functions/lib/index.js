"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyExpiryNotifications = exports.revenueWebhook = exports.getQuota = exports.generateRecipeImage = exports.generateRecipes = exports.detectIngredients = void 0;
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
var detectIngredients_1 = require("./detectIngredients");
Object.defineProperty(exports, "detectIngredients", { enumerable: true, get: function () { return detectIngredients_1.detectIngredients; } });
var generateRecipes_1 = require("./generateRecipes");
Object.defineProperty(exports, "generateRecipes", { enumerable: true, get: function () { return generateRecipes_1.generateRecipes; } });
var generateRecipeImage_1 = require("./generateRecipeImage");
Object.defineProperty(exports, "generateRecipeImage", { enumerable: true, get: function () { return generateRecipeImage_1.generateRecipeImage; } });
var quota_1 = require("./quota");
Object.defineProperty(exports, "getQuota", { enumerable: true, get: function () { return quota_1.getQuota; } });
var revenueWebhook_1 = require("./revenueWebhook");
Object.defineProperty(exports, "revenueWebhook", { enumerable: true, get: function () { return revenueWebhook_1.revenueWebhook; } });
var expiryNotifications_1 = require("./expiryNotifications");
Object.defineProperty(exports, "dailyExpiryNotifications", { enumerable: true, get: function () { return expiryNotifications_1.dailyExpiryNotifications; } });
//# sourceMappingURL=index.js.map