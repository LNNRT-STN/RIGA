// Client for partner sign-up in `src/backend/partners.py`. The enterprise register, DNS lookups and
// phone confirmation behind it are simulated; the checksum, lookalike and report rules are real.

import type { CheckStatus } from '@/kbc/trust/api'

export type PartnerModule = { id: string; label: string; detail: string; status: 'available' | 'planned' }

export type DirectoryPartner = {
  id: string
  name: string
  shortName: string
  category: string
  website: string | null
  verifiedSince: string
  modules: string[]
  joinedToday: boolean
}

export type Directory = { partners: DirectoryPartner[]; count: number; modules: PartnerModule[]; categories: string[] }

export type Company = {
  enterpriseNumber: string
  legalName: string
  legalForm: string
  address: string
  founded: string
  activity: string
  active: boolean
  kbcCustomerSince: string | null
}

export type Application = {
  enterpriseNumber: string
  brandName: string
  website: string
  phone: string
  category: string
  domains: string[]
  ibans: string[]
  modules: string[]
}

export type LookupResult = { company: Company; suggested: Omit<Application, 'enterpriseNumber' | 'modules'> | null }

export type DnsRecord = { domain: string; host: string; type: 'TXT'; value: string; found: boolean }

export type OnboardingCheck = { id: string; label: string; status: CheckStatus; detail: string }

export type ApplyResult = {
  decision: 'approved' | 'review' | 'rejected'
  headline: string
  summary: string
  checks: OnboardingCheck[]
  partner: DirectoryPartner | null
  apiKey: string | null
  partnerCount: number
  elapsedMs: number
}

/** A rejected request. `fields` maps a form field to what to fix. */
export class PartnerApiError extends Error {
  status: number
  fields: Partial<Record<keyof Application, string>>

  constructor(status: number, message: string, fields: PartnerApiError['fields'] = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new PartnerApiError(0, 'KBC Trust can’t be reached. Check that the backend runs, then try again.')
  }
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; fields?: PartnerApiError['fields'] }
  if (!response.ok) throw new PartnerApiError(response.status, data.error ?? `KBC Trust returned ${response.status}`, data.fields)
  return data
}

// The checks are near-instant; hold the progress view long enough to read what KBC verifies.
const MIN_VERIFY_MS = 2200

export const getDirectory = () => request<Directory>('/partners')

export const lookupCompany = (enterpriseNumber: string) => request<LookupResult>('/partners/lookup', { enterpriseNumber })

export const getDnsRecords = (enterpriseNumber: string, domains: string[]) =>
  request<{ records: DnsRecord[] }>('/partners/dns', { enterpriseNumber, domains })

export async function applyAsPartner(application: Application) {
  const [result] = await Promise.all([
    request<ApplyResult>('/partners/apply', application),
    new Promise((resolve) => window.setTimeout(resolve, MIN_VERIFY_MS)),
  ])
  return result
}

export const verifySteps = [
  'Reading the enterprise register',
  'Confirming who holds your accounts',
  'Checking your domains and phone number',
  'Comparing with verified partners and scam reports',
]

/** Demo presets for the presenter. Both companies exist only in the simulated register. */
export const demoCompanies = {
  genuine: { enterpriseNumber: '0764.312.290', label: 'Zonnig Reizen', detail: 'Travel agency, KBC customer' },
  impostor: {
    enterpriseNumber: '0891.234.515',
    label: 'Fake Proximus',
    detail: 'Company founded 9 days ago',
    application: {
      brandName: 'Proximus Facturatie',
      website: 'proximus-factuur.be',
      phone: '+32 2 555 01 99',
      category: 'telecom',
      domains: ['proximus-factuur.be'],
      ibans: ['BE64 7370 1059 3352'],
    },
  },
} as const
