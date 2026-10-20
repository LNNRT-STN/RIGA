// Synthetic demo data. Every name, account number and amount below is fictional.
// Change the demo persona here; all screens read from this file.

export const customer = {
  firstName: 'Laura',
  holder: 'JANSSENS LAURA',
  clientNumber: '7BC104822',
}

export type AccountKind = 'current' | 'savings' | 'business'

export type Account = {
  id: string
  kind: AccountKind
  name: string
  iban: string
  balance: number
}

export const initialAccounts: Account[] = [
  { id: 'current', kind: 'current', name: 'KBC Plus Account', iban: 'BE71 0961 2345 6769', balance: 1284.37 },
  { id: 'savings', kind: 'savings', name: 'KBC Start2Save', iban: 'BE62 5100 0754 7061', balance: 3150 },
  // Laura is office manager at Noord Design BV and holds a mandate on its business account.
  { id: 'business', kind: 'business', name: 'Noord Design BV', iban: 'BE24 7350 0123 4538', balance: 38420.15 },
]

export const business = {
  name: 'Noord Design BV',
  ceo: 'Pieter Claes',
}

/** Laura's Guardian Angel: the trusted person KBC informs when it suspects fraud. */
export const guardianAngel = { name: 'Marc Janssens', relation: 'your father' }

export type InvoiceToPay = {
  id: string
  supplier: string
  iban: string
  amount: number
  due: string
  reference: string
  source: string
  accountId: string
}

// The Van Damme invoice arrived with a "new bank account" in the email: the supplier IBAN case.
export const invoicesToPay: InvoiceToPay[] = [
  {
    id: 'vd-1043',
    supplier: 'Van Damme Packaging NV',
    iban: 'BE09 0018 3366 2157',
    amount: 12480,
    due: '25 Oct 2026',
    reference: 'Invoice 2026-1043',
    source: 'Email to Noord Design BV',
    accountId: 'business',
  },
  {
    id: 'px-0926',
    supplier: 'Proximus',
    iban: 'BE38 0000 1234 5672',
    amount: 64.5,
    due: '30 Oct 2026',
    reference: 'Invoice 2026-09-4471',
    source: 'Zoomit',
    accountId: 'current',
  },
]

export type TransactionCategory =
  | 'reservation'
  | 'shopping'
  | 'food'
  | 'transport'
  | 'subscription'
  | 'transfer'
  | 'income'
  | 'housing'

export type Transaction = {
  id: string
  accountId: string
  counterparty: string
  amount: number
  category: TransactionCategory
  /** Group heading: "Reservations", "Today", "Yesterday" or a date. */
  group: string
  note?: string
}

export const initialTransactions: Transaction[] = [
  { id: 't1', accountId: 'current', counterparty: 'Dott wallet top-up Brussels BE', amount: -9.2, category: 'reservation', group: 'Reservations' },
  { id: 't2', accountId: 'current', counterparty: 'FRITUUR DE KRING GENT', amount: -14.5, category: 'reservation', group: 'Reservations' },
  { id: 't3', accountId: 'current', counterparty: 'PANOS GENT', amount: -6.6, category: 'reservation', group: 'Reservations' },
  { id: 't4', accountId: 'current', counterparty: 'BOLT.EU/R/2610182214 Tallinn EE', amount: -3, category: 'reservation', group: 'Reservations', note: 'Friday 16 October' },
  { id: 't5', accountId: 'current', counterparty: 'SPOTIFY AB STOCKHOLM', amount: -10.99, category: 'subscription', group: 'Today' },
  { id: 't6', accountId: 'current', counterparty: 'Café Labiekke', amount: -12.4, category: 'food', group: 'Yesterday' },
  { id: 't7', accountId: 'current', counterparty: 'Tom Peeters', amount: -20, category: 'transfer', group: 'Yesterday', note: 'Concert tickets' },
  { id: 't8', accountId: 'current', counterparty: 'COLRUYT GENT ZUID', amount: -54.32, category: 'shopping', group: 'Thursday 15 October' },
  { id: 't9', accountId: 'current', counterparty: 'Acme Belgium NV', amount: 2107.88, category: 'income', group: 'Thursday 15 October', note: 'Salary October' },
  { id: 't10', accountId: 'current', counterparty: 'Immo Vandenberghe', amount: -750, category: 'housing', group: 'Thursday 1 October', note: 'Rent October' },
]

export type Beneficiary = { id: string; name: string; iban: string }

export const beneficiaries: Beneficiary[] = [
  { id: 'b1', name: 'Tom Peeters', iban: 'BE43 0689 9999 9501' },
  { id: 'b2', name: 'Sara De Smet', iban: 'BE68 5390 0754 7034' },
  { id: 'b3', name: 'Immo Vandenberghe', iban: 'BE19 7380 1234 5612' },
  { id: 'b4', name: 'Jonas Maes', iban: 'BE56 0011 2233 4488' },
  { id: 'b5', name: 'Revolut', iban: 'BE88 9670 1234 0941' },
]

export const kateCoins = 12.5

export const investments = [
  { id: 'i1', name: 'KBC investment account', value: 2480.25, change: 3.4 },
  { id: 'i2', name: 'Bolero trading account', value: 6312.4, change: -0.8 },
]

export const inAndOut = {
  month: 'October',
  income: 2107.88,
  expenses: 1876.41,
  history: [
    { month: 'May', income: 120, expenses: 60 },
    { month: 'Jun', income: 40, expenses: 110 },
    { month: 'Jul', income: 1450, expenses: 380 },
    { month: 'Aug', income: 1790, expenses: 1780 },
    { month: 'Sep', income: 1960, expenses: 2550 },
    { month: 'Oct', income: 2107.88, expenses: 1876.41 },
  ],
}

export type ForYouItem = {
  id: string
  kind: 'kate' | 'tip' | 'product'
  title?: string
  body: string
  footnote?: string
  icon: 'kate' | 'house-search' | 'house-key' | 'lightbulb' | 'shield'
  /** Opens this screen instead of asking Kate about the card. */
  opens?: 'trust'
}

export const forYou: ForYouItem[] = [
  {
    id: 'trust',
    kind: 'kate',
    title: 'Is this real?',
    body: 'Not sure about an invoice, a caller or a website? Kate checks it with KBC Trust in seconds.',
    icon: 'kate',
    opens: 'trust',
  },
  {
    id: 'warranty',
    kind: 'kate',
    title: 'Kate helps you out',
    body: 'Would you like to keep the warranty for your recent purchase at Coolblue Gent in digital form?',
    icon: 'kate',
  },
  {
    id: 'rental-tips',
    kind: 'tip',
    body: 'Busy looking for a rental home? These 12 tips will help you get off to a good start.',
    icon: 'house-search',
  },
  {
    id: 'rent-guarantee',
    kind: 'product',
    body: 'Going to rent? Discover the KBC Rental Guarantee Savings Account, a regulated savings account (Category A).',
    footnote: 'Read the key savings information before you open an account.',
    icon: 'house-key',
  },
]

export const messages: ForYouItem[] = [
  ...forYou,
  {
    id: 'energy',
    kind: 'kate',
    title: 'Kate tip',
    body: 'High energy prices? These tips keep the warmth inside your home and the cold outside.',
    icon: 'lightbulb',
  },
  {
    id: 'fraud',
    kind: 'kate',
    title: 'Kate lets you know',
    body: 'Careful: are you urgently asked to install an app via WhatsApp? Don’t fall for it, it’s fraud!',
    icon: 'shield',
  },
]

export const newsHeadlines = [
  'European markets close higher as inflation cools further',
  'Bought a house with hidden defects: when can you hold the seller liable?',
]
