export type PaymentMetadata = {
    paymentMethod?: string
    notes?: string
  }
  
  export type CreditMetadata = {
    purpose?: string
    rejectionReason?: string
  }
  
  export function isPaymentMetadata(value: unknown): value is PaymentMetadata {
    return typeof value === "object" && value !== null && !Array.isArray(value)
  }
  
  export function isCreditMetadata(value: unknown): value is CreditMetadata {
    return typeof value === "object" && value !== null && !Array.isArray(value)
  }
  
  