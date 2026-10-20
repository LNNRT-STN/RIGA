// Customer control for KBC Trust: what data it may use, how proactive it may be, who is told and
// which verified partners may reach the customer. Kept in app state (see store.tsx) so every flow
// reads the same choices. Settings live in memory and reset on reload; nothing is sent anywhere.
import { FileText, History, PhoneIncoming, type LucideIcon } from 'lucide-react'
import type { TrustResult } from './api'

export type DataKey = 'documents' | 'calls' | 'payments'

export type Proactivity = 'stop' | 'warn' | 'ask'

export type PartnerId = 'proximus' | 'engie' | 'telenet' | 'van-damme'

export type TrustControls = {
  data: Record<DataKey, boolean>
  proactivity: Proactivity
  guardianAngel: boolean
  partners: Record<PartnerId, boolean>
}

export const defaultTrustControls: TrustControls = {
  data: { documents: true, calls: true, payments: true },
  proactivity: 'stop',
  guardianAngel: true,
  partners: { proximus: true, engie: true, telenet: true, 'van-damme': true },
}

export type DataType = { key: DataKey; label: string; short: string; uses: string; kept: string; icon: LucideIcon }

export const dataTypes: DataType[] = [
  {
    key: 'documents',
    label: 'Documents you share with Kate',
    short: 'documents',
    uses: 'Invoices and emails you ask Kate to check',
    kept: 'Read once, deleted after the check',
    icon: FileText,
  },
  {
    key: 'calls',
    label: 'Incoming calls',
    short: 'calls',
    uses: 'Caller number, voice and video signals',
    kept: 'Deleted when the call ends',
    icon: PhoneIncoming,
  },
  {
    key: 'payments',
    label: 'Payment history',
    short: 'payment history',
    uses: 'Who you paid before, to spot a changed account number',
    kept: 'Stays at KBC, never shared with partners',
    icon: History,
  },
]

export const proactivityOptions: { value: Proactivity; label: string; detail: string }[] = [
  {
    value: 'stop',
    label: 'Stop risky payments',
    detail: 'KBC Trust checks every new beneficiary and stops high risk payments. Unclear cases go to a person at Secure4u.',
  },
  {
    value: 'warn',
    label: 'Warn me, I decide',
    detail: 'KBC Trust checks every new beneficiary and warns you. You can still pay.',
  },
  {
    value: 'ask',
    label: 'Only when I ask',
    detail: 'KBC Trust checks only what you share with Kate or ask it to check.',
  },
]

export function proactivityLabel(value: Proactivity) {
  return proactivityOptions.find((o) => o.value === value)?.label ?? ''
}

// Mirrors the partner registry in src/backend/registry.py (simulated).
export const partners: { id: PartnerId; name: string; sends: string; verifiedSince: string; supplier: string }[] = [
  { id: 'proximus', name: 'Proximus', sends: 'Mobile and internet invoices', verifiedSince: '12 Mar 2026', supplier: 'Proximus' },
  { id: 'engie', name: 'Engie Electrabel', sends: 'Energy invoices', verifiedSince: '21 Apr 2026', supplier: 'Engie Electrabel' },
  { id: 'telenet', name: 'Telenet', sends: 'TV and internet invoices', verifiedSince: '8 May 2026', supplier: 'Telenet' },
  {
    id: 'van-damme',
    name: 'Van Damme Packaging',
    sends: 'Supplier invoices for Noord Design BV',
    verifiedSince: '3 Jun 2026',
    supplier: 'Van Damme Packaging NV',
  },
]

export function partnerForSupplier(supplier: string) {
  return partners.find((p) => p.supplier === supplier)
}

/** One line in "What KBC Trust did": every check and every change the customer makes. */
export type ActivityEntry = { id: number; when: string; title: string; detail: string }

// Two synthetic entries so the log is not empty before the first demo check.
export const initialActivity: ActivityEntry[] = [
  {
    id: -1,
    when: 'Yesterday, 18:04',
    title: 'Checked a payment to Tom Peeters',
    detail: 'Used your payment history. Paid 4 times before.',
  },
  {
    id: -2,
    when: 'Thu 15 Oct, 09:12',
    title: 'Proximus invoice delivered to Kate',
    detail: 'Proximus learned only that its invoice reached you.',
  },
]

/** What a check used and what happens to it afterwards, shown under every verdict and in the log. */
export function dataUse(subject: TrustResult['subject']): { used: string; kept: string } {
  switch (subject) {
    case 'invoice':
      return { used: 'the document you shared', kept: 'Deleted after the check.' }
    case 'call':
      return { used: 'the caller’s number, voice and video', kept: 'Deleted when the call ends.' }
    case 'payee':
      return { used: 'your payment history and the account holder’s name', kept: 'Nothing new stored.' }
    case 'website':
      return { used: 'only the web address you typed', kept: 'Not stored.' }
  }
}

export function timeNow() {
  return `Today, ${new Date().toLocaleTimeString('en-BE', { hour: '2-digit', minute: '2-digit', hour12: false })}`
}
