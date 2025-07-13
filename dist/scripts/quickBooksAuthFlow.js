"use strict";
/**
 * QuickBooks OAuth Flow Demo - TypeScript
 *
 * This script demonstrates the complete OAuth 2.0 flow for QuickBooks integration.
 * It can be compiled with TypeScript and run with Node.js.
 *
 * Usage:
 *   npx tsc src/scripts/quickBooksAuthFlow.ts --outDir dist --moduleResolution node
 *   node dist/scripts/quickBooksAuthFlow.js
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
exports.QuickBooksAuthFlow = void 0;
var quickBooks_1 = require("../adapters/quickBooks");
var readline = require("readline");
var QuickBooksAuthFlow = /** @class */ (function () {
    function QuickBooksAuthFlow() {
        // Initialize with sandbox settings for testing
        var config = {
            useSandbox: true,
            debug: true
        };
        this.qbConnector = new quickBooks_1.QuickBooksConnector(config);
        // Setup readline for user input
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    /**
     * Main flow orchestrator
     */
    QuickBooksAuthFlow.prototype.runAuthFlow = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authCode, realmId, tokens, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 QuickBooks OAuth 2.0 Flow Demo\n');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 9, 10]);
                        // Step 1: Show authorization URL
                        return [4 /*yield*/, this.showAuthorizationStep()];
                    case 2:
                        // Step 1: Show authorization URL
                        _a.sent();
                        return [4 /*yield*/, this.getAuthorizationCode()];
                    case 3:
                        authCode = _a.sent();
                        return [4 /*yield*/, this.getRealmId()];
                    case 4:
                        realmId = _a.sent();
                        return [4 /*yield*/, this.exchangeCodeForTokens(authCode, realmId)];
                    case 5:
                        tokens = _a.sent();
                        // Step 5: Test the connection
                        return [4 /*yield*/, this.testConnection(tokens)];
                    case 6:
                        // Step 5: Test the connection
                        _a.sent();
                        // Step 6: Demo customer operations
                        return [4 /*yield*/, this.demoCustomerOperations(tokens)];
                    case 7:
                        // Step 6: Demo customer operations
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 8:
                        error_1 = _a.sent();
                        console.error('❌ Error in auth flow:', error_1 instanceof Error ? error_1.message : error_1);
                        return [3 /*break*/, 10];
                    case 9:
                        this.rl.close();
                        return [7 /*endfinally*/];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Step 1: Display authorization URL and instructions
     */
    QuickBooksAuthFlow.prototype.showAuthorizationStep = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📋 Step 1: Authorization URL Generation');
                        console.log('=====================================\n');
                        authUrl = this.qbConnector.getAuthorizationUrl('demo-state-123');
                        console.log('✅ Authorization URL generated successfully!');
                        console.log('🔗 Please visit this URL to authorize the application:\n');
                        console.log(authUrl);
                        console.log('\n📝 Instructions:');
                        console.log('1. Click the URL above or copy-paste it into your browser');
                        console.log('2. Sign in to your QuickBooks Sandbox account');
                        console.log('3. Select a company and authorize the application');
                        console.log('4. You will be redirected to a URL containing authorization code and realmId');
                        console.log('\nThe redirect URL will look like:');
                        console.log('https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?code=AB11695...&realmId=9130...&state=demo-state-123\n');
                        return [4 /*yield*/, this.waitForUserInput('Press Enter when you have completed the authorization...')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Step 2: Get authorization code from user
     */
    QuickBooksAuthFlow.prototype.getAuthorizationCode = function () {
        return __awaiter(this, void 0, void 0, function () {
            var authCode;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('\n📋 Step 2: Authorization Code');
                        console.log('=============================\n');
                        console.log('From the redirect URL, copy the "code" parameter value.');
                        console.log('Example: If the URL is:');
                        console.log('https://developer.intuit.com/v2/OAuth2Playground/RedirectUrl?code=AB11695744021hJJjjOaI&realmId=9130356350539583');
                        console.log('Then the authorization code is: AB11695744021hJJjjOaI\n');
                        return [4 /*yield*/, this.getUserInput('Enter the authorization code: ')];
                    case 1:
                        authCode = _a.sent();
                        if (!authCode || authCode.length < 10) {
                            throw new Error('Invalid authorization code. Please check and try again.');
                        }
                        console.log('✅ Authorization code received\n');
                        return [2 /*return*/, authCode.trim()];
                }
            });
        });
    };
    /**
     * Step 3: Get realm ID from user
     */
    QuickBooksAuthFlow.prototype.getRealmId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var realmId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📋 Step 3: Realm ID (Company ID)');
                        console.log('=================================\n');
                        console.log('From the same redirect URL, copy the "realmId" parameter value.');
                        console.log('This identifies which QuickBooks company you authorized.\n');
                        return [4 /*yield*/, this.getUserInput('Enter the realm ID: ')];
                    case 1:
                        realmId = _a.sent();
                        if (!realmId || realmId.length < 5) {
                            throw new Error('Invalid realm ID. Please check and try again.');
                        }
                        console.log('✅ Realm ID received\n');
                        return [2 /*return*/, realmId.trim()];
                }
            });
        });
    };
    /**
     * Step 4: Exchange authorization code for tokens
     * In a real application, this would make an HTTP POST request to QuickBooks OAuth endpoint
     */
    QuickBooksAuthFlow.prototype.exchangeCodeForTokens = function (authCode, realmId) {
        return __awaiter(this, void 0, void 0, function () {
            var accessToken, refreshToken, tokens;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📋 Step 4: Token Exchange');
                        console.log('=========================\n');
                        console.log('🔄 In a real application, this step would make an HTTP POST request to:');
                        console.log('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer\n');
                        console.log('📝 The request would include:');
                        console.log("- grant_type: authorization_code");
                        console.log("- code: ".concat(authCode));
                        console.log("- redirect_uri: ".concat(process.env.QB_REDIRECT_URI));
                        console.log("- Authorization header with client credentials\n");
                        console.log('⚠️  For this demo, please provide the tokens manually.');
                        console.log('In production, these would be obtained automatically from the OAuth response.\n');
                        return [4 /*yield*/, this.getUserInput('Enter the access_token: ')];
                    case 1:
                        accessToken = _a.sent();
                        return [4 /*yield*/, this.getUserInput('Enter the refresh_token: ')];
                    case 2:
                        refreshToken = _a.sent();
                        tokens = {
                            accessToken: accessToken.trim(),
                            refreshToken: refreshToken.trim(),
                            realmId: realmId
                        };
                        console.log('✅ Tokens configured\n');
                        return [2 /*return*/, tokens];
                }
            });
        });
    };
    /**
     * Step 5: Test the connection
     */
    QuickBooksAuthFlow.prototype.testConnection = function (tokens) {
        return __awaiter(this, void 0, void 0, function () {
            var companyInfo, company, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📋 Step 5: Connection Test');
                        console.log('==========================\n');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log('🔧 Initializing QuickBooks connection...');
                        this.qbConnector.initialize(tokens);
                        console.log('✅ QuickBooks connector initialized');
                        console.log('🔍 Testing connection by getting company info...');
                        return [4 /*yield*/, this.qbConnector.getCompanyInfo()];
                    case 2:
                        companyInfo = _a.sent();
                        console.log('✅ Connection successful!');
                        if (companyInfo.QueryResponse && companyInfo.QueryResponse.CompanyInfo) {
                            company = companyInfo.QueryResponse.CompanyInfo[0];
                            console.log("   \uD83D\uDCCA Company: ".concat(company.CompanyName));
                            console.log("   \uD83C\uDF0D Country: ".concat(company.Country));
                            console.log("   \uD83D\uDCE7 Email: ".concat(company.Email || 'N/A'));
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error('❌ Connection test failed:', error_2 instanceof Error ? error_2.message : error_2);
                        throw error_2;
                    case 4:
                        console.log('');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Step 6: Demo customer operations
     */
    QuickBooksAuthFlow.prototype.demoCustomerOperations = function (tokens) {
        return __awaiter(this, void 0, void 0, function () {
            var customer, error_3, allCustomers, firstCustomerId, firstCustomer, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('📋 Step 6: Customer Operations Demo');
                        console.log('===================================\n');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 9, , 10]);
                        // Try to get customer with ID 1
                        console.log('👤 Attempting to get customer with ID 1...');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 8]);
                        return [4 /*yield*/, this.qbConnector.getCustomer('1')];
                    case 3:
                        customer = _a.sent();
                        this.displayCustomer(customer);
                        return [3 /*break*/, 8];
                    case 4:
                        error_3 = _a.sent();
                        console.log('❌ Customer with ID 1 not found');
                        console.log('🔍 Let\'s find all available customers instead...\n');
                        return [4 /*yield*/, this.qbConnector.findCustomers({ limit: 5 })];
                    case 5:
                        allCustomers = _a.sent();
                        this.displayCustomerList(allCustomers);
                        if (!(allCustomers.QueryResponse && allCustomers.QueryResponse.Customer && allCustomers.QueryResponse.Customer.length > 0)) return [3 /*break*/, 7];
                        firstCustomerId = allCustomers.QueryResponse.Customer[0].Id;
                        console.log("\n\uD83D\uDC64 Getting details for customer ID ".concat(firstCustomerId, ":"));
                        return [4 /*yield*/, this.qbConnector.getCustomer(firstCustomerId)];
                    case 6:
                        firstCustomer = _a.sent();
                        this.displayCustomer(firstCustomer);
                        _a.label = 7;
                    case 7: return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_4 = _a.sent();
                        console.error('❌ Error in customer operations:', error_4 instanceof Error ? error_4.message : error_4);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Display customer information in a formatted way
     */
    QuickBooksAuthFlow.prototype.displayCustomer = function (customer) {
        console.log('✅ Customer found:');
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
            console.log("   \uD83C\uDFE0 Address: ".concat(customer.BillAddr.Line1 || '', " ").concat(customer.BillAddr.City || '', " ").concat(customer.BillAddr.PostalCode || ''));
        }
        console.log('\n📄 Complete customer object:');
        console.log(JSON.stringify(customer, null, 2));
    };
    /**
     * Display customer list
     */
    QuickBooksAuthFlow.prototype.displayCustomerList = function (customers) {
        if (customers.QueryResponse && customers.QueryResponse.Customer) {
            console.log('📋 Available customers:');
            customers.QueryResponse.Customer.forEach(function (customer, index) {
                console.log("   ".concat(index + 1, ". ").concat(customer.Name, " (ID: ").concat(customer.Id, ") - Active: ").concat(customer.Active));
            });
        }
        else {
            console.log('ℹ️  No customers found in QuickBooks');
        }
    };
    /**
     * Helper method to get user input
     */
    QuickBooksAuthFlow.prototype.getUserInput = function (prompt) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.rl.question(prompt, function (answer) {
                resolve(answer);
            });
        });
    };
    /**
     * Helper method to wait for user input
     */
    QuickBooksAuthFlow.prototype.waitForUserInput = function (message) {
        var _this = this;
        return new Promise(function (resolve) {
            _this.rl.question(message, function () {
                resolve();
            });
        });
    };
    return QuickBooksAuthFlow;
}());
exports.QuickBooksAuthFlow = QuickBooksAuthFlow;
// Run if this file is executed directly
if (require.main === module) {
    var authFlow = new QuickBooksAuthFlow();
    authFlow.runAuthFlow()
        .then(function () {
        console.log('\n🎉 QuickBooks OAuth flow demo completed successfully!');
        process.exit(0);
    })["catch"](function (error) {
        console.error('\n💥 OAuth flow demo failed:', error);
        process.exit(1);
    });
}
