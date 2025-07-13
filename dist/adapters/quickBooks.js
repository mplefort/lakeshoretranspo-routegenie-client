"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
exports.__esModule = true;
exports.getCustomerExample = exports.quickBooksConnector = exports.QuickBooksConnector = void 0;
// Import node-quickbooks with require to avoid ts-node type issues
var QuickBooks = require('node-quickbooks');
var dotenv_1 = require("dotenv");
// Load environment variables
dotenv_1["default"].config();
var QuickBooksConnector = /** @class */ (function () {
    function QuickBooksConnector(config) {
        var _a, _b;
        this.config = {
            clientId: (config === null || config === void 0 ? void 0 : config.clientId) || process.env.QB_CLIENT_ID,
            clientSecret: (config === null || config === void 0 ? void 0 : config.clientSecret) || process.env.QB_CLIENT_SECRET,
            redirectUri: (config === null || config === void 0 ? void 0 : config.redirectUri) || process.env.QB_REDIRECT_URI,
            useSandbox: (_a = config === null || config === void 0 ? void 0 : config.useSandbox) !== null && _a !== void 0 ? _a : true,
            debug: (_b = config === null || config === void 0 ? void 0 : config.debug) !== null && _b !== void 0 ? _b : true
        };
        if (!this.config.clientId || !this.config.clientSecret) {
            throw new Error('QuickBooks Client ID and Client Secret are required');
        }
    }
    /**
     * Initialize QuickBooks connection with tokens
     */
    QuickBooksConnector.prototype.initialize = function (tokens) {
        this.qbo = new QuickBooks(this.config.clientId, this.config.clientSecret, tokens.accessToken, false, // no token secret for oAuth 2.0
        tokens.realmId, this.config.useSandbox, this.config.debug, null, // minorversion - use latest
        '2.0', // oAuth version
        tokens.refreshToken);
    };
    /**
     * Get OAuth 2.0 authorization URL
     */
    QuickBooksConnector.prototype.getAuthorizationUrl = function (state) {
        var scope = 'com.intuit.quickbooks.accounting';
        var responseType = 'code';
        var stateParam = state || 'secureRandomState';
        return "https://appcenter.intuit.com/connect/oauth2?" +
            "client_id=".concat(this.config.clientId, "&") +
            "scope=".concat(scope, "&") +
            "redirect_uri=".concat(encodeURIComponent(this.config.redirectUri), "&") +
            "response_type=".concat(responseType, "&") +
            "state=".concat(stateParam);
    };
    /**
     * Get customer by ID
     */
    QuickBooksConnector.prototype.getCustomer = function (customerId) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.qbo) {
                    throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.qbo.getCustomer(customerId, function (err, customer) {
                            if (err) {
                                reject(new Error("Failed to get customer: ".concat(err.message || err)));
                            }
                            else {
                                resolve(customer);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Find customers with optional criteria
     */
    QuickBooksConnector.prototype.findCustomers = function (criteria) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.qbo) {
                    throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.qbo.findCustomers(criteria || {}, function (err, customers) {
                            if (err) {
                                reject(new Error("Failed to find customers: ".concat(err.message || err)));
                            }
                            else {
                                resolve(customers);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Get company information
     */
    QuickBooksConnector.prototype.getCompanyInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.qbo) {
                    throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.qbo.findCompanyInfos({}, function (err, companyInfo) {
                            if (err) {
                                reject(new Error("Failed to get company info: ".concat(err.message || err)));
                            }
                            else {
                                resolve(companyInfo);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Create a new customer
     */
    QuickBooksConnector.prototype.createCustomer = function (customerData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.qbo) {
                    throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.qbo.createCustomer(customerData, function (err, customer) {
                            if (err) {
                                reject(new Error("Failed to create customer: ".concat(err.message || err)));
                            }
                            else {
                                resolve(customer);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Update an existing customer
     */
    QuickBooksConnector.prototype.updateCustomer = function (customerData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.qbo) {
                    throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.qbo.updateCustomer(customerData, function (err, customer) {
                            if (err) {
                                reject(new Error("Failed to update customer: ".concat(err.message || err)));
                            }
                            else {
                                resolve(customer);
                            }
                        });
                    })];
            });
        });
    };
    /**
     * Test connection by getting company info
     */
    QuickBooksConnector.prototype.testConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getCompanyInfo()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        console.error('QuickBooks connection test failed:', error_1);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return QuickBooksConnector;
}());
exports.QuickBooksConnector = QuickBooksConnector;
// Example usage and helper functions
exports.quickBooksConnector = new QuickBooksConnector();
/**
 * Example function to demonstrate getting customer with ID 1
 */
function getCustomerExample() {
    return __awaiter(this, void 0, void 0, function () {
        var exampleTokens, customer, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    exampleTokens = {
                        accessToken: 'your-access-token',
                        refreshToken: 'your-refresh-token',
                        realmId: 'your-realm-id'
                    };
                    exports.quickBooksConnector.initialize(exampleTokens);
                    return [4 /*yield*/, exports.quickBooksConnector.getCustomer('1')];
                case 1:
                    customer = _a.sent();
                    console.log('Customer with ID 1:', customer);
                    return [2 /*return*/, customer];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error getting customer:', error_2);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getCustomerExample = getCustomerExample;
exports["default"] = QuickBooksConnector;
