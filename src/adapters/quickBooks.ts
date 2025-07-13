// Import node-quickbooks with require to avoid ts-node type issues
const QuickBooks = require('node-quickbooks');
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface QBConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  useSandbox: boolean;
  debug?: boolean;
}

export interface QBTokens {
  accessToken: string;
  refreshToken: string;
  realmId: string;
}

// Enhanced interface for customer data
export interface QBCustomer {
  Id: string;
  Name: string;
  Active: boolean;
  Balance?: number;
  PrimaryEmailAddr?: {
    Address: string;
  };
  PrimaryPhone?: {
    FreeFormNumber: string;
  };
  BillAddr?: {
    Line1?: string;
    City?: string;
    PostalCode?: string;
    CountrySubDivisionCode?: string;
  };
  SyncToken: string;
  [key: string]: any; // Allow additional properties
}

// Interface for QuickBooks query response
export interface QBQueryResponse<T = any> {
  QueryResponse?: {
    Customer?: T[];
    CompanyInfo?: T[];
    maxResults?: number;
    startPosition?: number;
    [key: string]: any;
  };
}

// Interface for company info
export interface QBCompanyInfo {
  Id: string;
  CompanyName: string;
  Country: string;
  Email?: string;
  [key: string]: any;
}

export class QuickBooksConnector {
  private config: QBConfig;
  private qbo: any;

  constructor(config?: Partial<QBConfig>) {
    this.config = {
      clientId: config?.clientId || process.env.QB_CLIENT_ID!,
      clientSecret: config?.clientSecret || process.env.QB_CLIENT_SECRET!,
      redirectUri: config?.redirectUri || process.env.QB_REDIRECT_URI!,
      useSandbox: config?.useSandbox ?? true, // Default to sandbox for testing
      debug: config?.debug ?? true
    };

    if (!this.config.clientId || !this.config.clientSecret) {
      throw new Error('QuickBooks Client ID and Client Secret are required');
    }
  }

  /**
   * Initialize QuickBooks connection with tokens
   */
  public initialize(tokens: QBTokens): void {
    this.qbo = new QuickBooks(
      this.config.clientId,
      this.config.clientSecret,
      tokens.accessToken,
      false, // no token secret for oAuth 2.0
      tokens.realmId,
      this.config.useSandbox,
      this.config.debug,
      null, // minorversion - use latest
      '2.0', // oAuth version
      tokens.refreshToken
    );
  }

  /**
   * Get OAuth 2.0 authorization URL
   */
  public getAuthorizationUrl(state?: string): string {
    const scope = 'com.intuit.quickbooks.accounting';
    const responseType = 'code';
    const stateParam = state || 'secureRandomState';

    return `https://appcenter.intuit.com/connect/oauth2?` +
      `client_id=${this.config.clientId}&` +
      `scope=${scope}&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      `response_type=${responseType}&` +
      `state=${stateParam}`;
  }

  /**
   * Get customer by ID
   */
  public async getCustomer(customerId: string): Promise<QBCustomer> {
    if (!this.qbo) {
      throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
    }

    return new Promise((resolve, reject) => {
      this.qbo.getCustomer(customerId, (err: any, customer: QBCustomer) => {
        if (err) {
          reject(new Error(`Failed to get customer: ${err.message || err}`));
        } else {
          resolve(customer);
        }
      });
    });
  }

  /**
   * Find customers with optional criteria
   */
  public async findCustomers(criteria?: any): Promise<QBQueryResponse<QBCustomer>> {
    if (!this.qbo) {
      throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
    }

    return new Promise((resolve, reject) => {
      this.qbo.findCustomers(criteria || {}, (err: any, customers: QBQueryResponse<QBCustomer>) => {
        if (err) {
          reject(new Error(`Failed to find customers: ${err.message || err}`));
        } else {
          resolve(customers);
        }
      });
    });
  }

  /**
   * Get company information
   */
  public async getCompanyInfo(): Promise<QBQueryResponse<QBCompanyInfo>> {
    if (!this.qbo) {
      throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
    }

    return new Promise((resolve, reject) => {
      this.qbo.findCompanyInfos({}, (err: any, companyInfo: QBQueryResponse<QBCompanyInfo>) => {
        if (err) {
          reject(new Error(`Failed to get company info: ${err.message || err}`));
        } else {
          resolve(companyInfo);
        }
      });
    });
  }

  /**
   * Create a new customer
   */
  public async createCustomer(customerData: Partial<QBCustomer>): Promise<QBCustomer> {
    if (!this.qbo) {
      throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
    }

    return new Promise((resolve, reject) => {
      this.qbo.createCustomer(customerData, (err: any, customer: QBCustomer) => {
        if (err) {
          reject(new Error(`Failed to create customer: ${err.message || err}`));
        } else {
          resolve(customer);
        }
      });
    });
  }

  /**
   * Update an existing customer
   */
  public async updateCustomer(customerData: QBCustomer): Promise<QBCustomer> {
    if (!this.qbo) {
      throw new Error('QuickBooks not initialized. Call initialize() first with valid tokens.');
    }

    return new Promise((resolve, reject) => {
      this.qbo.updateCustomer(customerData, (err: any, customer: QBCustomer) => {
        if (err) {
          reject(new Error(`Failed to update customer: ${err.message || err}`));
        } else {
          resolve(customer);
        }
      });
    });
  }

  /**
   * Test connection by getting company info
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.getCompanyInfo();
      return true;
    } catch (error) {
      console.error('QuickBooks connection test failed:', error);
      return false;
    }
  }
}

// Example usage and helper functions
export const quickBooksConnector = new QuickBooksConnector();

/**
 * Example function to demonstrate getting customer with ID 1
 */
export async function getCustomerExample(): Promise<QBCustomer | null> {
  try {
    // Note: You'll need to have valid tokens to use this
    // This is just an example of how to use the connector
    
    const exampleTokens: QBTokens = {
      accessToken: 'your-access-token',
      refreshToken: 'your-refresh-token',
      realmId: 'your-realm-id'
    };

    quickBooksConnector.initialize(exampleTokens);
    
    const customer = await quickBooksConnector.getCustomer('1');
    console.log('Customer with ID 1:', customer);
    
    return customer;
  } catch (error) {
    console.error('Error getting customer:', error);
    return null;
  }
}

export default QuickBooksConnector;