import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { copyText } from '../lib/clipboard'
import type { Contact } from '../types'
import { telHref } from '../lib/phone'

type Props = {
  contacts: Contact[]
  onChangeContact: (id: string, patch: Partial<Contact>) => void
}

function isTypingTarget(el: HTMLElement): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  return el.isContentEditable
}

/** Person-first headline: real name when present; otherwise practice / company as the lead. */
function leadPresentation(c: Contact): { headline: string; sub: string } {
  const name = (c.fullName ?? '').trim()
  const co = (c.company ?? '').trim()
  const unknownName = !name || name.toLowerCase() === 'unknown'
  if (!unknownName) return { headline: name, sub: co || 'Company not on file' }
  if (co) return { headline: co, sub: 'No individual name in this import' }
  return { headline: name || 'Lead', sub: '' }
}

export const CallingBoard = memo(function CallingBoard({
  contacts,
  onChangeContact,
}: Props) {
  const [query, setQuery] = useState('')
  const [onlyWithPhone, setOnlyWithPhone] = useState(false)
  const [hideDone, setHideDone] = useState(false)
  const [focusIdx, setFocusIdx] = useState(0)
  const [copyFeedback, setCopyFeedback] = useState<'success' | 'fail' | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)
  const indexListRef = useRef<HTMLUListElement>(null)

  const deferredQuery = useDeferredValue(query)
  const filterKey = `${deferredQuery}|${String(onlyWithPhone)}|${String(hideDone)}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return contacts
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => {
        if (hideDone && c.contacted) return false
        if (onlyWithPhone && !c.mobileDigits) return false
        if (!q) return true
        const blob =
          `${c.fullName} ${c.company} ${c.email} ${c.notes} ${c.mobile} ${c.mobileDigits} ${c.workPhone} ${c.workDigits}`.toLowerCase()
        return blob.includes(q)
      })
  }, [contacts, deferredQuery, onlyWithPhone, hideDone])

  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setFocusIdx(0)
  }

  const displayIdx =
    filterKey !== prevFilterKey
      ? 0
      : filtered.length === 0
        ? 0
        : Math.min(focusIdx, filtered.length - 1)

  if (filterKey === prevFilterKey && displayIdx !== focusIdx) {
    setFocusIdx(displayIdx)
  }

  const current = filtered[displayIdx]?.c
  const currentIndexInFull = filtered[displayIdx]?.index ?? -1

  const lead = useMemo(() => {
    if (!current) return { headline: '', sub: '' }
    return leadPresentation(current)
  }, [current])

  const goPrev = useCallback(() => {
    setFocusIdx((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setFocusIdx((i) => Math.min(Math.max(0, filtered.length - 1), i + 1))
  }, [filtered.length])

  const clearFilters = useCallback(() => {
    setQuery('')
    setOnlyWithPhone(false)
    setHideDone(false)
  }, [])

  useEffect(() => {
    const root = indexListRef.current
    if (!root || filtered.length === 0) return
    const el = root.querySelector<HTMLElement>(`[data-focus-index="${String(displayIdx)}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'auto' })
  }, [displayIdx, filtered.length])

  useEffect(() => {
    if (!copyFeedback) return
    const id = window.setTimeout(() => setCopyFeedback(null), copyFeedback === 'fail' ? 3200 : 1800)
    return () => clearTimeout(id)
  }, [copyFeedback])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (isTypingTarget(t)) return

      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        searchRef.current?.focus()
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goNext()
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        goPrev()
      }
      if (e.key === ' ' && current) {
        e.preventDefault()
        onChangeContact(current.id, { contacted: !current.contacted })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, goNext, goPrev, onChangeContact])

  const doneCount = useMemo(
    () => contacts.reduce((n, c) => n + (c.contacted ? 1 : 0), 0),
    [contacts],
  )
  const dupRows = useMemo(() => contacts.reduce((n, c) => n + (c.duplicateMobile ? 1 : 0), 0), [contacts])
  const remaining = contacts.length - doneCount
  const searchPending = query !== deferredQuery

  const filtersActive = query.trim() !== '' || onlyWithPhone || hideDone

  return (
    <div className="board">
      <div className="board-toolbar">
        <label className="field-grow">
          <span className="field-label">Search</span>
          <input
            ref={searchRef}
            id="contact-search"
            className="input"
            type="search"
            placeholder="Name, company, email, notes, phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          {searchPending && <span className="search-pending">Filtering…</span>}
          <span className="search-hint muted">Press / to focus</span>
        </label>
        <label className="checkbox-row tight">
          <input
            type="checkbox"
            checked={onlyWithPhone}
            onChange={(e) => setOnlyWithPhone(e.target.checked)}
          />
          Has cell #
        </label>
        <label className="checkbox-row tight">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Hide done
        </label>
        <div
          className="progress-pill"
          title={
            dupRows > 0
              ? `${dupRows} rows share a primary phone number with another row`
              : 'Progress'
          }
        >
          {doneCount}/{contacts.length} done
          {remaining > 0 && <span className="progress-sub"> · {remaining} left</span>}
          {dupRows > 0 && <span className="progress-sub"> · {dupRows} dup #</span>}
        </div>
        {filtersActive && (
          <button type="button" className="btn btn-small btn-toolbar" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {copyFeedback && (
        <p className={`copy-toast ${copyFeedback === 'fail' ? 'copy-toast-error' : ''}`} role="status">
          {copyFeedback === 'fail' ? 'Could not copy' : 'Copied'}
        </p>
      )}

      <div className="board-split">
        <div className="board-list">
          <div className="board-list-head">
            <h2 className="board-list-title">Queue</h2>
            <span className="board-list-count" aria-live="polite">
              {filtered.length}
            </span>
          </div>
          <ul className="contact-index" ref={indexListRef} aria-label="Filtered prospects">
            {filtered.map(({ c }, i) => {
              const { headline, sub } = leadPresentation(c)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    data-focus-index={i}
                    className={`index-item ${i === displayIdx ? 'active' : ''} ${c.contacted ? 'done' : ''}`}
                    onClick={() => setFocusIdx(i)}
                  >
                    <span className="index-name">{headline}</span>
                    {sub ? <span className="index-co">{sub}</span> : null}
                    {c.needsReview && <span className="badge warn">Review</span>}
                    {c.duplicateMobile && <span className="badge dup">Dup #</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="board-focus">
          {!current ? (
            <div className="empty-focus">
              <p>No contacts match your filters.</p>
              {contacts.length > 0 && filtersActive && (
                <button type="button" className="btn btn-primary" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <article className="focus-card">
              <header className="focus-hero">
                <div className="focus-identity">
                  <p className="focus-eyebrow">Prospect</p>
                  <h2 className="focus-headline">{lead.headline}</h2>
                  {lead.sub ? <p className="focus-subline">{lead.sub}</p> : null}
                </div>
                <label className="checkbox-row tight focus-done">
                  <input
                    type="checkbox"
                    checked={current.contacted}
                    onChange={(e) =>
                      onChangeContact(current.id, { contacted: e.target.checked })
                    }
                  />
                  Done
                </label>
              </header>

              {current.email ? (
                <div className="focus-section focus-email-block">
                  <h3 className="focus-section-title">Email</h3>
                  <div className="focus-inline-row">
                    <a className="focus-email-link" href={`mailto:${current.email}`}>
                      {current.email}
                    </a>
                    <button
                      type="button"
                      className="btn btn-small btn-copy"
                      onClick={() =>
                        void copyText(current.email).then((ok) =>
                          setCopyFeedback(ok ? 'success' : 'fail'),
                        )
                      }
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}

              <section className="focus-section focus-notes-section" aria-labelledby="focus-notes-h">
                <h3 className="focus-section-title" id="focus-notes-h">
                  Notes
                </h3>
                <p className="focus-section-lede muted">
                  Call prep, angles, extra numbers you find — stays with this lead.
                </p>
                <textarea
                  className="textarea"
                  rows={5}
                  value={current.notes}
                  onChange={(e) => onChangeContact(current.id, { notes: e.target.value })}
                  placeholder="Hooks, gatekeeper, cell from reception, callback time…"
                  aria-label="Notes for this prospect"
                />
              </section>

              <section className="focus-section focus-numbers" aria-labelledby="focus-phones-h">
                <h3 className="focus-section-title" id="focus-phones-h">
                  Phone numbers
                </h3>
                <p className="focus-section-lede muted">
                  From your import; add anything you source (front desk, site, LinkedIn) in Notes.
                </p>
                <div className="focus-numbers-grid">
                  <div className="focus-number-card">
                    <span className="focus-number-label">Cell / mobile</span>
                    {current.mobileDigits ? (
                      <div className="focus-tel-row">
                        <a className="focus-tel-link" href={telHref(current.mobileDigits)!}>
                          {current.mobile}
                        </a>
                        <button
                          type="button"
                          className="btn btn-small btn-copy"
                          onClick={() =>
                            void copyText(current.mobileDigits).then((ok) =>
                              setCopyFeedback(ok ? 'success' : 'fail'),
                            )
                          }
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <p className="focus-number-missing muted">None in file</p>
                    )}
                  </div>
                  <div className="focus-number-card">
                    <span className="focus-number-label">Company / main line</span>
                    {current.workDigits ? (
                      <div className="focus-tel-row">
                        <a className="focus-tel-link" href={telHref(current.workDigits)!}>
                          {current.workPhone}
                        </a>
                        <button
                          type="button"
                          className="btn btn-small btn-copy"
                          onClick={() =>
                            void copyText(current.workDigits).then((ok) =>
                              setCopyFeedback(ok ? 'success' : 'fail'),
                            )
                          }
                        >
                          Copy
                        </button>
                      </div>
                    ) : current.workPhone ? (
                      <div className="focus-tel-row">
                        <span className="focus-tel-plain">{current.workPhone}</span>
                      </div>
                    ) : (
                      <p className="focus-number-missing muted">None in file</p>
                    )}
                  </div>
                </div>
              </section>

              {(current.needsReview || current.rowWarnings.length > 0) && (
                <div className="warn-box">
                  <strong>Needs attention</strong>
                  <ul>
                    {current.rowWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              <details className="context">
                <summary>Raw CSV columns</summary>
                <ul className="raw-cols">
                  {current.rawRow.map((cell, i) => (
                    <li key={i}>
                      <span className="raw-idx">{i + 1}</span>
                      {cell}
                    </li>
                  ))}
                </ul>
              </details>

              <footer className="focus-footer">
                <span className="muted">
                  Row {currentIndexInFull + 1} of {contacts.length} · filtered {displayIdx + 1}/
                  {filtered.length}
                </span>
                <div className="focus-nav">
                  <button type="button" className="btn" onClick={goPrev} disabled={displayIdx <= 0}>
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={goNext}
                    disabled={displayIdx >= filtered.length - 1}
                  >
                    Next
                  </button>
                </div>
              </footer>
              <p className="kbd-hint muted">
                <kbd>/</kbd> search · <kbd>←</kbd> <kbd>→</kbd> move · <kbd>Space</kbd> Done
              </p>
            </article>
          )}
        </div>
      </div>
    </div>
  )
})
