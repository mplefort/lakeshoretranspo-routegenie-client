"use strict";
/**
 * QuickBooks Usage Example - TypeScript
 *
 * This example shows how to use the QuickBooks connector to get customer information.
 *
 * USAGE:
 *   npx tsc src/examples/quickBooksExample.ts --outDir dist --moduleResolution node
 *   node dist/examples/quickBooksExample.js
 *
 * IMPORTANT: Before running this example, you need to:
 * 1. Complete the OAuth 2.0 flow to get access tokens
 * 2. Update the tokens below with your actual values
 *
 * For a complete OAuth 2.0 flow demo, run:
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeGetCustomer = exports.getSpecificCustomer = exports.quickBooksExample = void 0;
const quickBooks_1 = require("../adapters/quickBooks");
function quickBooksExample() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 QuickBooks API Example - Getting Customer Info\n');
        try {
            // Step 1: Create connector instance with proper typing
            const config = {
                useSandbox: true,
                debug: true // Set to false to reduce logging
            };
            const qbConnector = new quickBooks_1.QuickBooksConnector(config);
            // Step 2: Get OAuth authorization URL (run this first)
            const authUrl = qbConnector.getAuthorizationUrl('example-state');
            console.log('🔗 Authorization URL:');
            console.log(authUrl);
            console.log('\n📝 Instructions:');
            console.log('1. Visit the URL above in your browser');
            console.log('2. Sign in to QuickBooks and authorize the app');
            console.log('3. Copy the authorization code from the redirect URL');
            console.log('4. Exchange the code for access tokens using QuickBooks OAuth API');
            console.log('5. Update the tokens below and run this example again');
            console.log('\n💡 For a complete interactive OAuth flow, run the auth flow script instead:\n');
            console.log('   npx tsc src/scripts/quickBooksAuthFlow.ts --outDir dist --moduleResolution node');
            console.log('   node dist/scripts/quickBooksAuthFlow.js\n');
            // Step 3: Initialize with OAuth tokens (replace with your actual tokens)
            const tokens = {
                accessToken: 'your-access-token',
                refreshToken: 'your-refresh-token',
                realmId: 'your-realm-id' // Replace with actual company/realm ID
            };
            // Only proceed if we have real tokens
            if (tokens.accessToken !== 'your-access-token') {
                qbConnector.initialize(tokens);
                // Step 4: Test the connection
                console.log('🔍 Testing QuickBooks connection...');
                const isConnected = yield qbConnector.testConnection();
                if (isConnected) {
                    console.log('✅ Connected to QuickBooks successfully!\n');
                    // Step 5: Get customer with ID 1
                    console.log('👤 Attempting to get customer with ID 1...');
                    try {
                        const customer = yield qbConnector.getCustomer('1');
                        console.log('✅ Customer found:');
                        console.log(`   Name: ${customer.Name}`);
                        console.log(`   ID: ${customer.Id}`);
                        console.log(`   Balance: ${customer.Balance || 0}`);
                        console.log(`   Email: ${((_a = customer.PrimaryEmailAddr) === null || _a === void 0 ? void 0 : _a.Address) || 'N/A'}`);
                        console.log('\n📄 Full customer object:');
                        console.log(JSON.stringify(customer, null, 2));
                    }
                    catch (error) {
                        console.log('❌ Customer with ID 1 not found');
                        console.log('🔍 Let\'s try to find all customers instead...\n');
                        // Alternative: Get all customers
                        const allCustomers = yield qbConnector.findCustomers({ limit: 5 });
                        if (allCustomers.QueryResponse && allCustomers.QueryResponse.Customer) {
                            console.log('📋 Found customers:');
                            allCustomers.QueryResponse.Customer.forEach((customer, index) => {
                                console.log(`   ${index + 1}. ${customer.Name} (ID: ${customer.Id})`);
                            });
                        }
                        else {
                            console.log('No customers found in QuickBooks');
                        }
                    }
                }
                else {
                    console.log('❌ Failed to connect to QuickBooks');
                    console.log('   Please check your tokens and network connection');
                }
            }
            else {
                console.log('⚠️  Please update the tokens in this file with your actual OAuth tokens');
                console.log('    Or use the interactive auth flow script for a complete demo.');
            }
        }
        catch (error) {
            console.error('❌ Error:', error instanceof Error ? error.message : error);
        }
    });
}
exports.quickBooksExample = quickBooksExample;
// Helper function to get a specific customer with proper typing
function getSpecificCustomer(customerId, tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = { useSandbox: true };
        const qbConnector = new quickBooks_1.QuickBooksConnector(config);
        qbConnector.initialize(tokens);
        return yield qbConnector.getCustomer(customerId);
    });
}
exports.getSpecificCustomer = getSpecificCustomer;
// Helper function to get customer with error handling
function safeGetCustomer(customerId, tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield getSpecificCustomer(customerId, tokens);
        }
        catch (error) {
            console.error(`Failed to get customer ${customerId}:`, error instanceof Error ? error.message : error);
            return null;
        }
    });
}
exports.safeGetCustomer = safeGetCustomer;
// Run example if this file is executed directly
if (require.main === module) {
    quickBooksExample();
}
//# sourceMappingURL=quickBooksExample.js.map