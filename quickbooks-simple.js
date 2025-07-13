"use strict";
/**
 * Simple TypeScript QuickBooks OAuth Flow (No Node.js Types)
 *
 * This is a minimal TypeScript example that demonstrates the OAuth concepts
 * without importing Node.js type definitions that cause compilation issues.
 *
 * To compile: npx tsc quickbooks-simple.ts --target ES2020 --module CommonJS --skipLibCheck
 * To run: node quickbooks-simple.js
 */
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
exports.SimpleQuickBooksConnector = void 0;
/**
 * Simplified TypeScript QuickBooks Connector
 * This shows the TypeScript patterns without complex dependencies
 */
var SimpleQuickBooksConnector = /** @class */ (function () {
    function SimpleQuickBooksConnector(config) {
        this.config = config;
    }
    /**
     * Generate OAuth authorization URL (TypeScript implementation)
     */
    SimpleQuickBooksConnector.prototype.getAuthorizationUrl = function (state) {
        if (state === void 0) { state = 'typescript-demo'; }
        var scope = 'com.intuit.quickbooks.accounting';
        var responseType = 'code';
        var authUrl = "https://appcenter.intuit.com/connect/oauth2?" +
            "client_id=".concat(this.config.clientId, "&") +
            "scope=".concat(scope, "&") +
            "redirect_uri=".concat(encodeURIComponent(this.config.redirectUri), "&") +
            "response_type=".concat(responseType, "&") +
            "state=".concat(state);
        return authUrl;
    };
    /**
     * Simulate customer retrieval (TypeScript pattern)
     */
    SimpleQuickBooksConnector.prototype.getCustomer = function (customerId, tokens) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real implementation, this would use the node-quickbooks library
                console.log("Getting customer ".concat(customerId, " with TypeScript..."));
                // Simulate API call
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            var mockCustomer = {
                                Id: customerId,
                                Name: "Customer ".concat(customerId),
                                Active: true,
                                Balance: 150.75,
                                PrimaryEmailAddr: {
                                    Address: "customer".concat(customerId, "@example.com")
                                }
                            };
                            resolve(mockCustomer);
                        }, 1000);
                    })];
            });
        });
    };
    /**
     * TypeScript OAuth flow demonstration
     */
    SimpleQuickBooksConnector.prototype.demonstrateAuthFlow = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authUrl, mockTokens, customer, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔷 TypeScript QuickBooks OAuth Flow Demo\n');
                        authUrl = this.getAuthorizationUrl('typescript-auth-demo');
                        console.log('✅ Authorization URL (TypeScript):');
                        console.log(authUrl);
                        console.log();
                        // Step 2: Simulate token exchange
                        console.log('🔄 Simulating token exchange...');
                        mockTokens = {
                            accessToken: 'mock_access_token_typescript',
                            refreshToken: 'mock_refresh_token_typescript',
                            realmId: '123456789'
                        };
                        console.log('✅ Tokens obtained (simulated)');
                        console.log();
                        // Step 3: Use TypeScript async/await pattern for customer operations
                        console.log('👤 Getting customer with TypeScript async/await...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getCustomer('1', mockTokens)];
                    case 2:
                        customer = _a.sent();
                        this.displayCustomerTypescript(customer);
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('❌ Error:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Display customer with TypeScript type safety
     */
    SimpleQuickBooksConnector.prototype.displayCustomerTypescript = function (customer) {
        console.log('✅ Customer retrieved with TypeScript:');
        console.log("   \uD83D\uDCDD Name: ".concat(customer.Name));
        console.log("   \uD83C\uDD94 ID: ".concat(customer.Id));
        console.log("   \u2705 Active: ".concat(customer.Active));
        console.log("   \uD83D\uDCB0 Balance: $".concat(customer.Balance || '0.00'));
        if (customer.PrimaryEmailAddr) {
            console.log("   \uD83D\uDCE7 Email: ".concat(customer.PrimaryEmailAddr.Address));
        }
        if (customer.PrimaryPhone) {
            console.log("   \uD83D\uDCDE Phone: ".concat(customer.PrimaryPhone.FreeFormNumber));
        }
        if (customer.BillAddr) {
            var addr = customer.BillAddr;
            console.log("   \uD83C\uDFE0 Address: ".concat(addr.Line1 || '', " ").concat(addr.City || '', " ").concat(addr.PostalCode || ''));
        }
    };
    return SimpleQuickBooksConnector;
}());
exports.SimpleQuickBooksConnector = SimpleQuickBooksConnector;
/**
 * Demo function showing TypeScript OAuth patterns
 */
function runTypeScriptDemo() {
    return __awaiter(this, void 0, void 0, function () {
        var config, connector, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔷 TypeScript QuickBooks Connector Demo');
                    console.log('======================================\n');
                    config = {
                        clientId: 'your_client_id_here',
                        clientSecret: 'your_client_secret_here',
                        redirectUri: 'https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl',
                        useSandbox: true
                    };
                    connector = new SimpleQuickBooksConnector(config);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, connector.demonstrateAuthFlow()];
                case 2:
                    _a.sent();
                    console.log('\n🎉 TypeScript demo completed successfully!');
                    console.log('\n💡 Key TypeScript Features Demonstrated:');
                    console.log('   ✅ Interface type definitions (QBConfig, QBTokens, QBCustomer)');
                    console.log('   ✅ Class-based architecture with private methods');
                    console.log('   ✅ Async/await patterns for API calls');
                    console.log('   ✅ Type-safe parameter passing');
                    console.log('   ✅ Promise-based error handling');
                    console.log('\n🔗 This pattern can be integrated with the node-quickbooks library');
                    console.log('   once the TypeScript compilation environment is resolved.');
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    console.error('\n❌ Demo failed:', error_2);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Run demo if this is the main module
if (typeof require !== 'undefined' && require.main === module) {
    runTypeScriptDemo();
}
