// RF-SMART Elevate owns this file
import { Platform } from 'react-native';

export type Pot = {
  id: string;
  name: string;
  type: string;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  owner: string;
  overspendRule: string;
  carryForwardEnabled: boolean;
};

export type OverviewResponse = {
  household: {
    id: string;
    name: string;
    baseCurrency: string;
    ownerName: string;
    partnerName: string;
  };
  currentPayCycle: {
    id: string;
    label: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isJoint: boolean;
  }>;
  pots: Pot[];
};

export type TransactionInboxItem = {
  id: string;
  merchant: string;
  amount: number;
  transactionDate: string;
  accountName: string;
  category: string;
  fundingSource: string;
  owner: string;
  isAcknowledged: boolean;
  requiresPartnerReview: boolean;
  isSplit: boolean;
  refundPending: boolean;
};

export type InboxResponse = {
  total: number;
  pending: number;
  items: TransactionInboxItem[];
};

export type TransactionSplitLine = {
  id: string;
  category: string;
  fundingSource: string;
  amount: number;
  notes: string;
};

export type TransactionDetail = {
  id: string;
  merchant: string;
  amount: number;
  transactionDate: string;
  accountName: string;
  category: string;
  fundingSource: string;
  owner: string;
  isAcknowledged: boolean;
  requiresPartnerReview: boolean;
  isSplit: boolean;
  refundPending: boolean;
  notes: string;
  splits: TransactionSplitLine[];
};

export type TransactionUpdateRequest = {
  category: string;
  fundingSource: string;
  owner: string;
  isSplit: boolean;
  refundPending: boolean;
  isAcknowledged: boolean;
  notes: string;
  splits: Array<{
    category: string;
    fundingSource: string;
    amount: number;
    notes: string;
  }>;
};

export type ActiveObligation = {
  id: string;
  eventId: string;
  eventName: string;
  itemName: string;
  spendWindowStart: string;
  spendWindowEnd: string;
  plannedAmount: number;
  fundedAmount: number;
  actualAmount: number;
  varianceAmount: number;
  varianceStatus: string;
  resolutionStatus: string;
};

export type ObligationsResponse = {
  count: number;
  items: ActiveObligation[];
};

export type EventSummary = {
  id: string;
  name: string;
  type: string;
  status: string;
  dueDate: string;
  spendWindowStart: string;
  spendWindowEnd: string;
  plannedAmount: number;
  fundedAmount: number;
  actualAmount: number;
  varianceStatus: string;
};

export type EventsResponse = {
  count: number;
  items: EventSummary[];
};

export type EventDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  dueDate: string;
  spendWindowStart: string;
  spendWindowEnd: string;
  plannedAmount: number;
  fundedAmount: number;
  actualAmount: number;
  notes: string;
  tags: string[];
  items: Array<{
    id: string;
    name: string;
    plannedAmount: number;
    actualAmount: number;
    status: string;
  }>;
};

export type UpdateEventRequest = {
  status: string;
  plannedAmount: number;
  fundedAmount: number;
  notes: string;
};

export const apiBaseUrl = Platform.select({
  android: 'http://10.0.2.2:5065',
  default: 'http://localhost:5065',
});

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed for ${path}`);
  }

  return (await response.json()) as T;
}

export function getOverview() {
  return getJson<OverviewResponse>('/api/household/overview');
}

export function getInbox() {
  return getJson<InboxResponse>('/api/transactions/inbox');
}

export function getTransaction(transactionId: string) {
  return getJson<TransactionDetail>(`/api/transactions/${transactionId}`);
}

export async function updateTransaction(transactionId: string, request: TransactionUpdateRequest) {
  const response = await fetch(`${apiBaseUrl}/api/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to save transaction.');
  }

  return (await response.json()) as TransactionDetail;
}

export function getObligations() {
  return getJson<ObligationsResponse>('/api/obligations/active');
}

export function getEvents() {
  return getJson<EventsResponse>('/api/events');
}

export function getEvent(eventId: string) {
  return getJson<EventDetail>(`/api/events/${eventId}`);
}

export async function updateEvent(eventId: string, request: UpdateEventRequest) {
  const response = await fetch(`${apiBaseUrl}/api/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to save event.');
  }

  return (await response.json()) as EventDetail;
}
