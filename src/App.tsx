import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CallingBoard } from './components/CallingBoard'
import { ImportWizard } from './components/ImportWizard'
import { ListSidebar } from './components/ListSidebar'
import { downloadTextFile, exportContactsToCsv, exportFilenameForList } from './lib/exportCsv'
import { applyDuplicateFlags, defaultMapping } from './lib/mapping'
import { loadState, saveState } from './lib/storage'
import type { AppPersistedState, Contact, LeadList, MappingConfig } from './types'

function isTypingTargetForShortcut(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable
}

function newEmptyList(): LeadList {
  return {
    id: crypto.randomUUID(),
    name: 'New list',
    createdAt: new Date().toISOString(),
    contacts: [],
    mapping: defaultMapping(15),
    firstRowIsHeader: false,
  }
}

function ensureSeed(state: AppPersistedState): AppPersistedState {
  if (state.lists.length > 0) return state
  const list = newEmptyList()
  return { ...state, lists: [list], activeListId: list.id }
}

const APP_DOC_TITLE = 'Artemis calling lists'
const TSHAPE2_SEED_PATH = `${import.meta.env.BASE_URL}seeds/tshape2-prospects-southwest.csv`

export default function App() {
  const [state, setState] = useState<AppPersistedState>(() => ensureSeed(loadState()))
  const [importOpen, setImportOpen] = useState(false)
  const [saveNotice, setSaveNotice] = useState<'quota' | null>(null)
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  /** Debounce writes — large lists + typing notes were hammering localStorage. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (saveState(state)) setSaveNotice(null)
      else setSaveNotice('quota')
    }, 400)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    const flush = () => {
      if (saveState(stateRef.current)) setSaveNotice(null)
      else setSaveNotice('quota')
    }
    window.addEventListener('beforeunload', flush)
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  useEffect(() => {
    if (!importOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [importOpen])

  useEffect(() => {
    if (!importOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setImportOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [importOpen])

  const activeList = useMemo(
    () => state.lists.find((l) => l.id === state.activeListId) ?? null,
    [state.lists, state.activeListId],
  )

  /** Ctrl/Cmd+O → import (browser “open” metaphor); ignored while typing or when modal is open. */
  useEffect(() => {
    if (importOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (!activeList) return
      if (isTypingTargetForShortcut(e.target)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        setImportOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [importOpen, activeList])

  useEffect(() => {
    document.title = activeList?.name ? `${activeList.name} · ${APP_DOC_TITLE}` : APP_DOC_TITLE
  }, [activeList?.name])

  const updateList = useCallback((id: string, patch: Partial<LeadList>) => {
    setState((s) => ({
      ...s,
      lists: s.lists.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }))
  }, [])

  const patchContact = useCallback(
    (listId: string, contactId: string, patch: Partial<Contact>) => {
      const affectsDuplicates =
        'mobileDigits' in patch ||
        'mobile' in patch ||
        'workDigits' in patch ||
        'workPhone' in patch ||
        'rawRow' in patch
      setState((s) => ({
        ...s,
        lists: s.lists.map((l) => {
          if (l.id !== listId) return l
          const contacts = l.contacts.map((c) => (c.id === contactId ? { ...c, ...patch } : c))
          return {
            ...l,
            contacts: affectsDuplicates ? applyDuplicateFlags(contacts) : contacts,
          }
        }),
      }))
    },
    [],
  )

  const handleApplyImport = useCallback(
    (
      imported: Contact[],
      mapping: MappingConfig,
      firstRowIsHeader: boolean,
      append: boolean,
    ) => {
      if (!activeList) return
      const merged = append ? [...activeList.contacts, ...imported] : imported
      updateList(activeList.id, {
        contacts: applyDuplicateFlags(merged),
        mapping,
        firstRowIsHeader,
      })
    },
    [activeList, updateList],
  )

  const handleContactPatch = useCallback(
    (id: string, patch: Partial<Contact>) => {
      if (!activeList) return
      patchContact(activeList.id, id, patch)
    },
    [activeList, patchContact],
  )

  return (
    <div className="app-shell">
      <a
        href="#main-content"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault()
          const el = document.getElementById('main-content')
          el?.focus()
          el?.scrollIntoView({ behavior: 'auto', block: 'start' })
        }}
      >
        Skip to main content
      </a>
      {saveNotice === 'quota' && (
        <div className="save-banner" role="alert">
          <span>
            Could not save to browser storage (full or blocked). Export CSV as a backup so you do not
            lose work.
          </span>
          <button type="button" className="btn btn-small" onClick={() => setSaveNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      <header className="app-header">
        <div>
          <h1 className="app-title">Artemis calling lists</h1>
          <p className="app-sub">
            Local-only · CSV import · Built for reading along while you dial
            <span className="app-sub-shortcut" title="When focus is not in a text field">
              {' '}
              · <kbd>Ctrl</kbd>+<kbd>O</kbd> import
            </span>
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!activeList}
            onClick={() => setImportOpen(true)}
          >
            Import CSV
          </button>
          <button
            type="button"
            className="btn"
            disabled={!activeList || activeList.contacts.length === 0}
            onClick={() => {
              if (!activeList) return
              const csv = exportContactsToCsv(activeList.contacts)
              downloadTextFile(exportFilenameForList(activeList.name), csv)
            }}
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="app-body">
        <ListSidebar
          lists={state.lists}
          activeListId={state.activeListId}
          onSelect={(id) => setState((s) => ({ ...s, activeListId: id }))}
          onNewList={() => {
            const list = newEmptyList()
            setState((s) => ({
              ...s,
              lists: [...s.lists, list],
              activeListId: list.id,
            }))
          }}
          onRename={(id, name) => updateList(id, { name })}
          onDelete={(id) => {
            setState((s) => {
              const lists = s.lists.filter((l) => l.id !== id)
              if (lists.length === 0) {
                const fresh = newEmptyList()
                return { ...s, lists: [fresh], activeListId: fresh.id }
              }
              const nextActive =
                s.activeListId === id ? lists[0].id : s.activeListId
              return { ...s, lists, activeListId: nextActive }
            })
          }}
        />

        <main id="main-content" className="app-main" tabIndex={-1}>
          {activeList && activeList.contacts.length === 0 ? (
            <div className="empty-main">
              <h2>No contacts yet</h2>
              <p>Import a CSV to map columns and build your calling list.</p>
              <p className="empty-sample muted">
                <a href={TSHAPE2_SEED_PATH} download>
                  Download sample southwest prospect CSV
                </a>{' '}
                — then Import, enable <strong>First row is header</strong>, and confirm column mapping.
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setImportOpen(true)}>
                Import CSV
              </button>
              <p className="kbd-hint muted empty-shortcut-hint">
                <kbd>Ctrl</kbd>+<kbd>O</kbd> (Windows) or <kbd>Cmd</kbd>+<kbd>O</kbd> (Mac) opens import when
                you are not typing in a field.
              </p>
            </div>
          ) : activeList ? (
            <CallingBoard contacts={activeList.contacts} onChangeContact={handleContactPatch} />
          ) : null}
        </main>
      </div>

      <ImportWizard
        open={importOpen}
        onClose={() => setImportOpen(false)}
        targetList={activeList}
        onApply={handleApplyImport}
      />
    </div>
  )
}
