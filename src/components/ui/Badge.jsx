const PRIORITY_MAP = {
  low:    { label: 'Low',    class: 'badge-blue'   },
  medium: { label: 'Medium', class: 'badge-yellow' },
  high:   { label: 'High',   class: 'badge-orange' },
  urgent: { label: 'Urgent', class: 'badge-red'    },
}

const STATUS_MAP = {
  todo:        { label: 'To Do',       class: 'badge-gray'   },
  in_progress: { label: 'In Progress', class: 'badge-blue'   },
  done:        { label: 'Done',        class: 'badge-green'  },
  active:      { label: 'Active',      class: 'badge-purple' },
  completed:   { label: 'Completed',   class: 'badge-green'  },
  paused:      { label: 'Paused',      class: 'badge-yellow' },
  archived:    { label: 'Archived',    class: 'badge-gray'   },
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY_MAP[priority] ?? { label: priority, class: 'badge-gray' }
  return <span className={`badge ${p.class}`}>{p.label}</span>
}

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] ?? { label: status, class: 'badge-gray' }
  return <span className={`badge ${s.class}`}>{s.label}</span>
}
