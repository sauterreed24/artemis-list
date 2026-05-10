export type ColumnRole =
  | 'ignore'
  | 'fullName'
  | 'firstName'
  | 'lastName'
  | 'company'
  | 'mobile'
  | 'workPhone'
  | 'email'
  | 'notes'
  | 'extra'

export interface MappingConfig {
  columnCount: number
  roles: ColumnRole[]
}

export interface Contact {
  id: string
  rawRow: string[]
  fullName: string
  company: string
  mobile: string
  mobileDigits: string
  workPhone: string
  workDigits: string
  email: string
  contacted: boolean
  notes: string
  needsReview: boolean
  duplicateMobile: boolean
  rowWarnings: string[]
}

export interface LeadList {
  id: string
  name: string
  createdAt: string
  contacts: Contact[]
  mapping: MappingConfig
  firstRowIsHeader: boolean
}

export interface AppPersistedState {
  version: 1
  lists: LeadList[]
  activeListId: string | null
}

export const STORAGE_KEY = 'artemis-lead-lists-v1'
