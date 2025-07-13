declare module 'node-quickbooks' {
  interface QuickBooksConstructor {
    new (
      consumerKey: string,
      consumerSecret: string,
      oauthToken: string,
      oauthTokenSecret: boolean | string,
      realmId: string,
      useSandbox: boolean,
      debug?: boolean,
      minorVer?: string | null,
      oAuthVer?: string,
      refreshToken?: string
    ): QuickBooksInstance;
  }

  interface QuickBooksInstance {
    getCustomer(id: string, callback: (err: any, customer: any) => void): void;
    findCustomers(criteria: any, callback: (err: any, customers: any) => void): void;
    findCompanyInfos(criteria: any, callback: (err: any, companyInfo: any) => void): void;
    createCustomer(customerData: any, callback: (err: any, customer: any) => void): void;
    updateCustomer(customerData: any, callback: (err: any, customer: any) => void): void;
    createInvoice(invoiceData: any, callback: (err: any, invoice: any) => void): void;
    getInvoice(id: string, callback: (err: any, invoice: any) => void): void;
    findInvoices(criteria: any, callback: (err: any, invoices: any) => void): void;
  }

  const QuickBooks: QuickBooksConstructor;
  export default QuickBooks;
}
