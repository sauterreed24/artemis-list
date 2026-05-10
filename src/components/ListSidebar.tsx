import type { LeadList } from '../types'

type Props = {
  lists: LeadList[]
  activeListId: string | null
  onSelect: (id: string) => void
  onNewList: () => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function ListSidebar({
  lists,
  activeListId,
  onSelect,
  onNewList,
  onRename,
  onDelete,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <h2>Lists</h2>
        <button type="button" className="btn btn-small" onClick={onNewList}>
          New list
        </button>
      </div>
      <ul className="list-nav">
        {lists.map((list) => (
          <li key={list.id}>
            <button
              type="button"
              className={`list-nav-item ${list.id === activeListId ? 'active' : ''}`}
              aria-current={list.id === activeListId ? true : undefined}
              onClick={() => onSelect(list.id)}
            >
              <span className="list-nav-name">{list.name}</span>
              <span className="list-nav-meta">{list.contacts.length}</span>
            </button>
          </li>
        ))}
      </ul>
      {activeListId && (
        <div className="sidebar-actions">
          <RenameForm
            key={activeListId}
            initialName={lists.find((l) => l.id === activeListId)?.name ?? ''}
            onSave={(name) => onRename(activeListId, name)}
          />
          <button
            type="button"
            className="btn btn-danger btn-small"
            onClick={() => {
              if (confirm('Delete this list and all its contacts?')) onDelete(activeListId)
            }}
          >
            Delete list
          </button>
        </div>
      )}
    </aside>
  )
}

function RenameForm({
  initialName,
  onSave,
}: {
  initialName: string
  onSave: (name: string) => void
}) {
  return (
    <form
      className="rename-form"
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const name = String(fd.get('name') ?? '').trim()
        if (name) onSave(name)
      }}
    >
      <label className="sr-only" htmlFor="rename-list">
        Rename list
      </label>
      <input
        id="rename-list"
        name="name"
        type="text"
        defaultValue={initialName}
        className="input"
        placeholder="List name"
      />
      <button type="submit" className="btn btn-small">
        Rename
      </button>
    </form>
  )
}
