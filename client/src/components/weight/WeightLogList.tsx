import { useState } from 'react';
import { useWeightStore } from '../../store/weightStore';

export function WeightLogList() {
  const { logs, openLogModal, deleteLog } = useWeightStore();
  const [expanded, setExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (logs.length === 0) return null;

  // Show most recent first
  const sortedLogs = [...logs].reverse();
  const displayLogs = expanded ? sortedLogs : sortedLogs.slice(0, 5);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteLog(id);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-sans font-semibold text-primary text-sm">Weight History</h3>
        <span className="text-[10px] text-dimmed font-sans">{logs.length} entries</span>
      </div>

      <div className="space-y-1.5">
        {displayLogs.map((log, idx) => {
          // Calculate delta from previous log
          const logIndex = logs.findIndex(l => l.id === log.id);
          const prev = logIndex > 0 ? logs[logIndex - 1] : null;
          const delta = prev ? Math.round((log.weightKg - prev.weightKg) * 10) / 10 : null;

          const dateStr = new Date(log.loggedAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
          });

          const isFirst = logIndex === 0;

          return (
            <div key={log.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-elevated/50 transition-colors group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-xs text-secondary font-sans w-12 shrink-0">{dateStr}</span>
                <span className="font-mono font-bold text-primary text-sm">{log.weightKg} kg</span>
                {delta !== null && (
                  <span className={`text-[10px] font-mono font-medium ${
                    delta < 0 ? 'text-success' : delta > 0 ? 'text-red-400' : 'text-dimmed'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </span>
                )}
                {log.note && (
                  <span className="text-[10px] text-dimmed font-sans truncate">{log.note}</span>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openLogModal(log)}
                  className="text-secondary hover:text-accent text-xs p-1 transition-colors"
                  title="Edit"
                >
                  ✏️
                </button>
                {!isFirst && (
                  confirmDeleteId === log.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deletingId === log.id}
                        className="text-red-400 text-[10px] font-sans font-medium px-1.5 py-0.5 bg-red-900/30 rounded"
                      >
                        {deletingId === log.id ? '...' : 'Yes'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-secondary text-[10px] font-sans px-1.5 py-0.5"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(log.id)}
                      className="text-secondary hover:text-red-400 text-xs p-1 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {sortedLogs.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-center text-accent text-xs font-sans font-medium mt-2 py-1 hover:underline"
        >
          {expanded ? 'Show less' : `Show all ${sortedLogs.length} entries`}
        </button>
      )}
    </div>
  );
}
