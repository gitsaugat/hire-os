/**
 * Vertical timeline rendering status_history entries.
 * @param {{ history: Array }} props
 */
export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) {
    return <p className="text-sm text-zinc-500">No status history yet.</p>
  }

  return (
    <ol className="relative border-l border-zinc-200 ml-3">
      {history.map((entry, idx) => (
        <li key={entry.id} className="mb-8 ml-6">
          {/* Dot */}
          <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-zinc-300">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
          </span>

          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-zinc-800">
              {entry.to_status.replace(/_/g, ' ')}
            </p>

            {entry.from_status && (
              <p className="text-xs text-zinc-500">
                from{' '}
                <span className="font-medium">
                  {entry.from_status.replace(/_/g, ' ')}
                </span>
              </p>
            )}

            {entry.reason && (
              <p className="text-sm text-zinc-600 italic">&quot;{entry.reason}&quot;</p>
            )}

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>
                {new Date(entry.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>·</span>
              <span
                className={entry.changed_by === 'AI' ? 'text-purple-500' : 'text-zinc-400'}
              >
                {entry.changed_by}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
