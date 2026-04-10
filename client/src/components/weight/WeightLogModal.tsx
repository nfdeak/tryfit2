import { useState, useEffect } from 'react';
import { useWeightStore } from '../../store/weightStore';

export function WeightLogModal() {
  const { isLogModalOpen, editingLog, closeLogModal, logWeight, updateLog } = useWeightStore();
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!editingLog;

  useEffect(() => {
    if (isLogModalOpen) {
      if (editingLog) {
        setWeight(String(editingLog.weightKg));
        setNote(editingLog.note || '');
        setDate(editingLog.loggedAt.substring(0, 10));
      } else {
        setWeight('');
        setNote('');
        setDate(new Date().toISOString().substring(0, 10));
      }
      setError('');
    }
  }, [isLogModalOpen, editingLog]);

  if (!isLogModalOpen) return null;

  const handleSave = async () => {
    const w = parseFloat(weight);
    if (isNaN(w) || w < 20 || w > 300) {
      setError('Enter a weight between 20 and 300 kg');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit && editingLog) {
        await updateLog(editingLog.id, { weightKg: w, note: note.trim() });
      } else {
        await logWeight({ weightKg: w, note: note.trim(), loggedAt: date });
      }
      closeLogModal();
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50" style={{ backdropFilter: 'blur(8px)' }} onClick={closeLogModal}>
      <div
        className="bg-surface w-full max-w-md rounded-t-3xl p-6 border-t border-x border-border animate-[slideUp_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-4" />
        <h3 className="font-display font-bold text-primary text-lg mb-4">
          {isEdit ? 'Edit Weight Log' : 'Log Weight'}
        </h3>

        <div className="space-y-3">
          {/* Weight input */}
          <div>
            <label className="text-xs text-secondary font-sans mb-1 block">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g. 75.5"
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-primary font-mono text-lg focus:outline-none focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          {/* Date picker (only for new logs) */}
          {!isEdit && (
            <div>
              <label className="text-xs text-secondary font-sans mb-1 block">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().substring(0, 10)}
                className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-primary font-sans text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          )}

          {/* Note */}
          <div>
            <label className="text-xs text-secondary font-sans mb-1 block">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. After morning walk"
              maxLength={100}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-3 text-primary font-sans text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-xs font-sans bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={closeLogModal}
            className="flex-1 bg-elevated text-secondary font-medium py-3 rounded-[14px] font-sans text-sm border border-border"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-accent text-white font-semibold py-3 rounded-[14px] font-sans text-sm active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
