// RF-SMART Elevate owns this file
import { Platform } from 'react-native';

export type Pot = {
  id: string;
  name: string;
  kind: 'big-pot' | 'little-pot';
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  owner: string;
  overspendRule: string;
  carryForwardEnabled: boolean;
  showOnDashboard: boolean;
};

export type PotsResponse = {
  count: number;
  items: Pot[];
};

export type CreatePotRequest = {
  name: string;
  kind: 'big-pot' | 'little-pot';
  plannedAmount: number;
  owner: string;
  overspendRule: string;
  carryForwardEnabled: boolean;
  showOnDashboard: boolean;
};

export type UpdatePotRequest = {
  plannedAmount: number;
  showOnDashboard: boolean;
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
  eventId?: string | null;
  eventName?: string | null;
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
  sourceProvider: string;
  externalTransactionId: string;
  category: string;
  fundingSource: string;
  eventId?: string | null;
  eventName?: string | null;
  owner: string;
  isAcknowledged: boolean;
  requiresPartnerReview: boolean;
  isSplit: boolean;
  refundPending: boolean;
  notes: string;
  splits: TransactionSplitLine[];
};

export type CreateTransactionRequest = {
  accountName: string;
  merchant: string;
  amount: number;
  transactionDate: string;
  sourceProvider: string;
  externalTransactionId: string;
  category: string;
  fundingSource: string;
  eventId?: string | null;
  owner: string;
  requiresPartnerReview: boolean;
  isAcknowledged: boolean;
  isSplit: boolean;
  refundPending: boolean;
  notes: string;
  splits: Array<{
    category: string;
    fundingSource: string;
    amount: number;
    notes: string;
  }>;
};

export type TransactionUpdateRequest = {
  category: string;
  fundingSource: string;
  eventId?: string | null;
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
  recurrenceRule: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  fundingPotId?: string | null;
  fundingPotName?: string | null;
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

export type AuditEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  detailJson: string;
  createdUtc: string;
};

export type AuditResponse = {
  count: number;
  items: AuditEntry[];
};

export type EventDetail = {
  id: string;
  name: string;
  type: string;
  status: string;
  recurrenceRule: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  fundingPotId?: string | null;
  fundingPotName?: string | null;
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

export type CreateEventRequest = {
  name: string;
  type: string;
  status: string;
  recurrenceRule: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  fundingPotId?: string | null;
  dueDate: string;
  spendWindowStart: string;
  spendWindowEnd: string;
  plannedAmount: number;
  fundedAmount: number;
  notes: string;
  tags: string[];
};

export type UpdateEventRequest = {
  status: string;
  recurrenceRule: 'one-time' | 'monthly' | 'quarterly' | 'yearly';
  fundingPotId?: string | null;
  plannedAmount: number;
  fundedAmount: number;
  notes: string;
};

export type TransactionFormOptions = {
  accountNames: string[];
  categories: string[];
  fundingSources: string[];
  fundingSourceKinds: Record<string, Pot['kind']>;
  fundingSourcePotIds: Record<string, string>;
  owners: string[];
  sourceProviders: string[];
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

export function getPots() {
  return getJson<PotsResponse>('/api/pots');
}

export function getInbox() {
  return getJson<InboxResponse>('/api/transactions/inbox');
}

export function getTransaction(transactionId: string) {
  return getJson<TransactionDetail>(`/api/transactions/${transactionId}`);
}

export async function createTransaction(request: CreateTransactionRequest) {
  const response = await fetch(`${apiBaseUrl}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to create transaction.');
  }

  return (await response.json()) as TransactionDetail;
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

export function getEvents(fundingPotId?: string | null) {
  const query = fundingPotId ? `?fundingPotId=${encodeURIComponent(fundingPotId)}` : '';
  return getJson<EventsResponse>(`/api/events${query}`);
}

export async function createEvent(request: CreateEventRequest) {
  const response = await fetch(`${apiBaseUrl}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to create event.');
  }

  return (await response.json()) as EventDetail;
}

export function getEvent(eventId: string) {
  return getJson<EventDetail>(`/api/events/${eventId}`);
}

export function getAuditEntries() {
  return getJson<AuditResponse>('/api/audit');
}

export async function createPot(request: CreatePotRequest) {
  const response = await fetch(`${apiBaseUrl}/api/pots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to create pot.');
  }

  return (await response.json()) as Pot;
}

export async function updatePot(potId: string, request: UpdatePotRequest) {
  const response = await fetch(`${apiBaseUrl}/api/pots/${potId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? 'Unable to update pot.');
  }

  return (await response.json()) as Pot;
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

const defaultTransactionCategories = [
  'Unassigned',
  'Groceries',
  'Dining',
  'Transport',
  'Household',
  'Subscriptions',
  'Health',
  'Gifts',
  'Travel',
  'Utilities',
];

function uniqueSorted(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export function buildTransactionFormOptions(input: {
  overview?: OverviewResponse | null;
  inbox?: InboxResponse | null;
  detail?: TransactionDetail | null;
}): TransactionFormOptions {
  const inboxItems = input.inbox?.items ?? [];
  const detailSplits = input.detail?.splits ?? [];
  const household = input.overview?.household;
  const pots = input.overview?.pots ?? [];

  return {
    accountNames: uniqueSorted([
      'Joint',
      ...(input.overview?.accounts ?? []).map((account) => account.name),
      ...inboxItems.map((item) => item.accountName),
      input.detail?.accountName,
    ]),
    categories: uniqueSorted([
      ...defaultTransactionCategories,
      ...inboxItems.map((item) => item.category),
      ...detailSplits.map((split) => split.category),
      input.detail?.category,
    ]),
    fundingSources: uniqueSorted([
      ...pots.map((pot) => pot.name),
      ...detailSplits.map((split) => split.fundingSource),
      input.detail?.fundingSource,
    ]),
    fundingSourceKinds: Object.fromEntries(pots.map((pot) => [pot.name, pot.kind])),
    fundingSourcePotIds: Object.fromEntries(pots.map((pot) => [pot.name, pot.id])),
    owners: uniqueSorted([
      'Household',
      household?.ownerName,
      household?.partnerName,
      ...inboxItems.map((item) => item.owner),
      input.detail?.owner,
    ]),
    sourceProviders: uniqueSorted([
      'manual',
      ...inboxItems.map(() => 'manual'),
      input.detail?.sourceProvider,
    ]),
  };
}
