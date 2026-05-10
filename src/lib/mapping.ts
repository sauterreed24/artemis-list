import type { ColumnRole, Contact, MappingConfig } from '../types'
import { analyzeRow, firstCellLooksLikeUsDate, maxColumnCount, padRow } from './csv'
import { digitsOnly, formatPhoneDisplay } from './phone'

export const ROLE_LABELS: Record<ColumnRole, string> = {
  ignore: 'Ignore',
  fullName: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',
  company: 'Company',
  mobile: 'Mobile / primary phone',
  workPhone: 'Company / work phone',
  email: 'Email',
  notes: 'Notes (call prep)',
  extra: 'Extra (context)',
}

export const ROLE_OPTIONS: ColumnRole[] = [
  'ignore',
  'fullName',
  'firstName',
  'lastName',
  'company',
  'mobile',
  'workPhone',
  'email',
  'notes',
  'extra',
]

/** Apollo / Reed-style no-header export: date, company, first, last, phone, email, … */
export function apolloPresetRoles(columnCount: number): ColumnRole[] {
  const roles: ColumnRole[] = Array.from({ length: columnCount }, () => 'extra')
  if (columnCount > 0) roles[0] = 'ignore'
  if (columnCount > 1) roles[1] = 'company'
  if (columnCount > 2) roles[2] = 'firstName'
  if (columnCount > 3) roles[3] = 'lastName'
  if (columnCount > 4) roles[4] = 'mobile'
  if (columnCount > 5) roles[5] = 'email'
  return roles
}

export function defaultMapping(columnCount: number): MappingConfig {
  return {
    columnCount,
    roles: apolloPresetRoles(columnCount),
  }
}

/**
 * Artemis prospect seed CSV (header row): company, first_name, last_name, phone, email,
 * city, state, green_flags, dm_target, notes, source_url
 */
export function prospectingSeedPreset(columnCount: number): ColumnRole[] {
  const roles: ColumnRole[] = Array.from({ length: columnCount }, () => 'extra')
  const pairs: [number, ColumnRole][] = [
    [0, 'company'],
    [1, 'firstName'],
    [2, 'lastName'],
    [3, 'mobile'],
    [4, 'email'],
    [9, 'notes'],
  ]
  for (const [idx, role] of pairs) {
    if (idx < columnCount) roles[idx] = role
  }
  return roles
}

function normalizeProspectingHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '_')
}

/** First CSV row looks like Artemis prospect seed / outbound headers (company + phone). */
export function headerRowLooksProspectingSeed(headerCells: string[]): boolean {
  const keys = new Set(headerCells.map(normalizeProspectingHeader))
  const hasCompany = ['company', 'practice', 'business'].some((k) => keys.has(k))
  const hasPhone = ['phone', 'mobile', 'primary_phone'].some((k) => keys.has(k))
  return hasCompany && hasPhone
}

/** Apollo vs prospecting-header vs default column roles after CSV parse. */
export function inferImportMapping(rows: string[][], headerIsFirstRow: boolean): MappingConfig {
  const count = Math.max(
    1,
    guessColumnCount(rows, headerIsFirstRow),
    maxColumnCount(rows),
  )
  const looksApollo = sampleLooksApolloStyle(rows, headerIsFirstRow)
  const headerRow = rows[0]
  if (headerIsFirstRow && headerRow && headerRowLooksProspectingSeed(headerRow)) {
    const cfg = prospectingPresetFromHeaderRow(headerRow)
    const padded = Math.max(count, cfg.columnCount)
    return { columnCount: padded, roles: padMappingRoles(cfg.roles, padded) }
  }
  const roles = looksApollo ? apolloPresetRoles(count) : defaultMapping(count).roles
  return { columnCount: count, roles }
}

/**
 * When the CSV header matches the prospecting seed (company + phone) and contextual columns
 * stay mapped as Extra, fold them into Notes with stable labels for the calling board.
 */
function mergeProspectingExtraIntoNotes(
  primaryNotes: string,
  row: string[],
  roles: ColumnRole[],
  headerCells: string[],
  columnCount: number,
): string {
  if (!headerCells.length || !headerRowLooksProspectingSeed(headerCells)) {
    return primaryNotes.trim()
  }
  const n = Math.min(columnCount, roles.length, headerCells.length, row.length)
  let city = ''
  let st = ''
  let dm = ''
  let flags = ''
  let source = ''
  for (let i = 0; i < n; i++) {
    if (roles[i] !== 'extra') continue
    const v = cell(row, i)
    if (!v) continue
    const k = normalizeProspectingHeader(headerCells[i] ?? '')
    if (k === 'city') city = v
    else if (k === 'state' || k === 'st' || k === 'province') st = v
    else if (
      k === 'green_flags' ||
      k === 'greenflags' ||
      k === 'flags' ||
      k === 'qualification' ||
      k === 'qualifiers'
    )
      flags = v
    else if (
      k === 'dm_target' ||
      k === 'dm' ||
      k === 'decision_maker' ||
      k === 'decisionmaker' ||
      k === 'target_role'
    )
      dm = v
    else if (
      k === 'source_url' ||
      k === 'source' ||
      k === 'url' ||
      k === 'website' ||
      k === 'site' ||
      k === 'link'
    )
      source = v
  }
  const lines: string[] = []
  if (dm) lines.push(`DM: ${dm}`)
  if (flags) lines.push(`Flags: ${flags}`)
  const loc = [city, st].filter(Boolean).join(', ')
  if (loc) lines.push(`Location: ${loc}`)
  if (source) lines.push(`Source: ${source}`)
  const structured = lines.join('\n')
  const primary = primaryNotes.trim()
  if (!structured) return primary
  if (!primary) return structured
  return `${primary}\n\n${structured}`
}

/** Header-heuristic: prospect seed columns by name (case-insensitive). */
export function prospectingPresetFromHeaderRow(headerCells: string[]): MappingConfig {
  const roles: ColumnRole[] = headerCells.map((h) => {
    const k = normalizeProspectingHeader(h)
    if (k === 'company' || k === 'practice' || k === 'business') return 'company'
    if (k === 'first_name' || k === 'firstname') return 'firstName'
    if (k === 'last_name' || k === 'lastname') return 'lastName'
    if (k === 'phone' || k === 'mobile' || k === 'primary_phone') return 'mobile'
    if (k === 'email' || k === 'e_mail') return 'email'
    if (k === 'notes' || k === 'tidbit' || k === 'call_prep' || k === 'callprep') return 'notes'
    return 'extra'
  })
  return { columnCount: roles.length, roles }
}

/** Trim or pad role arrays when CSV width changes. */
export function padMappingRoles(roles: ColumnRole[], count: number): ColumnRole[] {
  const next = roles.slice(0, count)
  while (next.length < count) next.push('extra')
  return next
}

function cell(row: string[], i: number): string {
  return row[i]?.trim() ?? ''
}

function valuesByRole(row: string[], roles: ColumnRole[], target: ColumnRole): string[] {
  const parts: string[] = []
  for (let i = 0; i < roles.length; i++) {
    if (roles[i] === target) {
      const v = cell(row, i)
      if (v) parts.push(v)
    }
  }
  return parts
}

const APOLLO_FINGERPRINT: ColumnRole[] = [
  'ignore',
  'company',
  'firstName',
  'lastName',
  'mobile',
]

export function matchesApolloFingerprint(roles: ColumnRole[]): boolean {
  return APOLLO_FINGERPRINT.every((r, i) => roles[i] === r)
}

export function rowToContact(
  row: string[],
  roles: ColumnRole[],
  columnCount: number,
  prospectingHeaderRow?: string[] | null,
): Contact {
  const padded = padRow(row, columnCount)
  const strictDateColumn = matchesApolloFingerprint(roles)
  const { needsReview, warnings } = analyzeRow(padded, columnCount, strictDateColumn)

  const fullNameCol = valuesByRole(padded, roles, 'fullName').join(' ')
  const first = valuesByRole(padded, roles, 'firstName').join(' ')
  const last = valuesByRole(padded, roles, 'lastName').join(' ')
  const fullName =
    fullNameCol.trim() ||
    `${first} ${last}`.trim() ||
    cell(padded, 2) ||
    'Unknown'

  const company = valuesByRole(padded, roles, 'company').join(' ') || cell(padded, 1)
  const mobileRaw = valuesByRole(padded, roles, 'mobile')[0] ?? ''
  const workRaw = valuesByRole(padded, roles, 'workPhone')[0] ?? ''
  const mobileDigits = digitsOnly(mobileRaw)
  const workDigits = digitsOnly(workRaw)

  const mobileDisplay = mobileDigits ? formatPhoneDisplay(mobileDigits) : mobileRaw
  const workDisplay = workDigits ? formatPhoneDisplay(workDigits) : workRaw

  const email = valuesByRole(padded, roles, 'email')[0] ?? ''
  const primaryNotes = valuesByRole(padded, roles, 'notes').join('\n').trim()
  const notes =
    prospectingHeaderRow && prospectingHeaderRow.length > 0
      ? mergeProspectingExtraIntoNotes(primaryNotes, padded, roles, prospectingHeaderRow, columnCount)
      : primaryNotes

  const rowWarnings = [...warnings]
  if (mobileDigits && mobileDigits.length < 10) {
    rowWarnings.push('Primary phone has fewer than 10 digits')
  }

  return {
    id: crypto.randomUUID(),
    rawRow: padded,
    fullName,
    company,
    mobile: mobileDisplay,
    mobileDigits,
    workPhone: workDisplay,
    workDigits,
    email,
    contacted: false,
    notes,
    needsReview,
    rowWarnings,
    duplicateMobile: false,
  }
}

export function rowsToContacts(
  rows: string[][],
  mapping: MappingConfig,
  firstRowIsHeader: boolean,
): Contact[] {
  const headerRow = firstRowIsHeader ? rows[0] : null
  const prospectingHeaders =
    headerRow && headerRowLooksProspectingSeed(headerRow) ? headerRow : null
  const dataRows = firstRowIsHeader ? rows.slice(1) : rows
  const { columnCount, roles } = mapping
  const base = dataRows.map((r) =>
    rowToContact(r, roles, columnCount, prospectingHeaders),
  )
  return applyDuplicateFlags(base)
}

export function applyDuplicateFlags(contacts: Contact[]): Contact[] {
  const counts = new Map<string, number>()
  for (const c of contacts) {
    if (!c.mobileDigits) continue
    counts.set(c.mobileDigits, (counts.get(c.mobileDigits) ?? 0) + 1)
  }
  return contacts.map((c) => ({
    ...c,
    duplicateMobile: Boolean(c.mobileDigits && (counts.get(c.mobileDigits) ?? 0) > 1),
  }))
}

export function guessColumnCount(rows: string[][], firstRowIsHeader: boolean): number {
  const data = firstRowIsHeader ? rows.slice(1) : rows
  const sample = data.slice(0, 25)
  return sample.reduce((m, r) => Math.max(m, r.length), 0)
}

/** Whether majority of sampled rows have a US-style date in column 0 (Apollo heuristic). */
export function sampleLooksApolloStyle(rows: string[][], firstRowIsHeader: boolean): boolean {
  const data = firstRowIsHeader ? rows.slice(1) : rows
  const sample = data.slice(0, 30).filter((r) => r.some((c) => String(c).trim()))
  if (!sample.length) return false
  let hits = 0
  for (const r of sample) {
    if (firstCellLooksLikeUsDate(r[0] ?? '')) hits++
  }
  return hits / sample.length >= 0.5
}
