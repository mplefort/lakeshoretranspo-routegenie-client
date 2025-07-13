"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOOGLE_MAPS_API_KEY = exports.RG_USER_ID = exports.RG_CLIENT_SECRET = exports.RG_CLIENT_ID = exports.RG_HOST = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.RG_HOST = process.env.RG_HOST;
exports.RG_CLIENT_ID = process.env.RG_CLIENT_ID;
exports.RG_CLIENT_SECRET = process.env.RG_CLIENT_SECRET;
exports.RG_USER_ID = Number(process.env.RG_USER_ID || '37');
exports.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
//# sourceMappingURL=index.js.map