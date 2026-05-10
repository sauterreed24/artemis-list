import type { AppPersistedState, LeadList } from '../types'
import { STORAGE_KEY } from '../types'

export function loadState(): AppPersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as AppPersistedState
    if (parsed?.version !== 1 || !Array.isArray(parsed.lists)) return emptyState()
    return {
      version: 1,
      lists: parsed.lists.map(normalizeList),
      activeListId: parsed.activeListId ?? null,
    }
  } catch {
    return emptyState()
  }
}

export function saveState(state: AppPersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

function emptyState(): AppPersistedState {
  return { version: 1, lists: [], activeListId: null }
}

function normalizeList(list: LeadList): LeadList {
  return {
    ...list,
    contacts: (list.contacts ?? []).map((c) => ({
      ...c,
      duplicateMobile: Boolean(c.duplicateMobile),
      needsReview: Boolean(c.needsReview),
      rowWarnings: Array.isArray(c.rowWarnings) ? c.rowWarnings : [],
      rawRow: Array.isArray(c.rawRow) ? c.rawRow : [],
    })),
    mapping: list.mapping ?? { columnCount: 0, roles: [] },
    firstRowIsHeader: Boolean(list.firstRowIsHeader),
  }
}
