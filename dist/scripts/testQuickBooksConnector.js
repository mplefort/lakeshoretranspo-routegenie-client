"use strict";
/**
 * Test script for QuickBooks connector
 *
 * This script demonstrates how to use the QuickBooks connector to:
 * 1. Get authorization URL for OAuth 2.0 flow
 * 2. Initialize the connector with tokens
 * 3. Get customer information by ID
 *
 * To use this script:
 * 1. First run it to get the authorization URL
 * 2. Complete the OAuth flow to get tokens
 * 3. Update the tokens in this script
 * 4. Run again to test customer retrieval
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomerById = void 0;
const quickBooks_1 = require("../adapters/quickBooks");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
function testQuickBooksConnector() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🚀 Testing QuickBooks Connector...\n');
            // Initialize the connector
            const qbConnector = new quickBooks_1.QuickBooksConnector({
                useSandbox: true,
                debug: true
            });
            // Step 1: Get authorization URL
            console.log('📋 Step 1: Authorization URL');
            const authUrl = qbConnector.getAuthorizationUrl('test-state-123');
            console.log('Visit this URL to authorize the application:');
            console.log(authUrl);
            console.log('\n');
            // Step 2: Initialize with tokens (you'll need to get these from the OAuth flow)
            console.log('🔑 Step 2: Initialize with tokens');
            console.log('After completing OAuth, you will need to:');
            console.log('1. Extract the authorization code from the callback URL');
            console.log('2. Exchange it for access and refresh tokens');
            console.log('3. Update the tokens below\n');
            // TODO: Replace these with actual tokens from OAuth flow
            const tokens = {
                accessToken: 'your-access-token-here',
                refreshToken: 'your-refresh-token-here',
                realmId: 'your-realm-id-here'
            };
            // Only proceed if we have real tokens (not placeholders)
            if (!tokens.accessToken.includes('your-')) {
                qbConnector.initialize(tokens);
                // Step 3: Test connection
                console.log('🔍 Step 3: Testing connection...');
                const isConnected = yield qbConnector.testConnection();
                console.log(`Connection status: ${isConnected ? '✅ Connected' : '❌ Failed'}\n`);
                if (isConnected) {
                    // Step 4: Get customer with ID 1
                    console.log('👤 Step 4: Getting customer with ID 1...');
                    try {
                        const customer = yield qbConnector.getCustomer('1');
                        console.log('Customer found:');
                        console.log(JSON.stringify(customer, null, 2));
                    }
                    catch (customerError) {
                        console.log('❌ Customer not found or error occurred:');
                        console.log(customerError);
                        // Try to list all customers instead
                        console.log('\n📋 Trying to list all customers...');
                        const customers = yield qbConnector.findCustomers({ limit: 5 });
                        console.log('Available customers:');
                        console.log(JSON.stringify(customers, null, 2));
                    }
                    // Step 5: Get company info
                    console.log('\n🏢 Step 5: Getting company information...');
                    const companyInfo = yield qbConnector.getCompanyInfo();
                    console.log('Company info:');
                    console.log(JSON.stringify(companyInfo, null, 2));
                }
            }
            else {
                console.log('⚠️  Please complete the OAuth flow and update the tokens in this script');
                console.log('   Then run this script again to test customer retrieval');
            }
        }
        catch (error) {
            console.error('❌ Error testing QuickBooks connector:', error);
        }
    });
}
// Export for use in other modules
function getCustomerById(customerId, tokens) {
    return __awaiter(this, void 0, void 0, function* () {
        const qbConnector = new quickBooks_1.QuickBooksConnector({ useSandbox: true, debug: false });
        qbConnector.initialize(tokens);
        return yield qbConnector.getCustomer(customerId);
    });
}
exports.getCustomerById = getCustomerById;
// Run if this file is executed directly
if (require.main === module) {
    testQuickBooksConnector()
        .then(() => console.log('\n✅ Test completed'))
        .catch(err => console.error('\n❌ Test failed:', err));
}
//# sourceMappingURL=testQuickBooksConnector.js.map