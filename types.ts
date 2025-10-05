export enum AppStep {
  Upload,
  Processing,
  Results,
}

export enum AddressStatus {
  Unprocessed = 'UNPROCESSED',
  Processing = 'PROCESSING',
  Validated = 'VALIDATED',
  Error = 'ERROR',
}

export interface Address {
  id: number;
  originalData: Record<string, any>;
  fullAddress: string;
  houseNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  zip?: string;
  status: AddressStatus;
  error?: string;
}
