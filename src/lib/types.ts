// The subset of the Apideck Bill shape the walkthrough reads. Matches what
// GET /accounting/bills returns from both the mock and live Apideck.
export type BillDTO = {
  id: string;
  number?: string;
  supplier?: { id?: string; display_name?: string; company_name?: string };
  currency: string;
  currency_rate?: number;
  total_amount: number;
  balance?: number;
  status?: string;
  due_date?: string;
};

export type SettlementResult = {
  billId: string;
  paymentId?: string;
  journalEntryId?: string;
  paymentResult?: import("@/components/MockApiCall").ApiResult;
  journalResult?: import("@/components/MockApiCall").ApiResult;
};
