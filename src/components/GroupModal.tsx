import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { GroupColorKey, TaskGroup } from '../types/task';
import { GROUP_COLORS } from '../utils/taskLogic';

interface GroupModalProps {
  open: boolean;
  editingGroup: TaskGroup | null;
  onClose: () => void;
  onSubmit: (payload: {
    id?: string;
    name: string;
    color: GroupColorKey;
  }) => { ok: boolean; error?: string };
}

const COLOR_KEYS = Object.keys(GROUP_COLORS) as GroupColorKey[];

export function GroupModal({
  open,
  editingGroup,
  onClose,
  onSubmit,
}: GroupModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<GroupColorKey>('cobalt');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editingGroup) {
      setName(editingGroup.name);
      setColor(editingGroup.color);
    } else {
      setName('');
      setColor('cobalt');
    }
    setError(null);
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [open, editingGroup]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = onSubmit({ id: editingGroup?.id, name, color });
    if (!res.ok) {
      setError(res.error ?? 'Nom de groupe invalide.');
      return;
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre"
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px]"
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2
            id="group-modal-title"
            className="font-display text-base font-semibold text-slate-900 dark:text-white"
          >
            {editingGroup ? 'Modifier le groupe' : 'Nouveau groupe de tâches'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label
              htmlFor="group-name-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Nom du groupe
            </label>
            <input
              ref={inputRef}
              id="group-name-input"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ex. Marketing, Personnel, Sprint Q4"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 dark:focus:border-blue-500"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Couleur d’identification
            </span>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_KEYS.map((key) => {
                const token = GROUP_COLORS[key];
                const selected = color === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColor(key)}
                    aria-pressed={selected}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      selected
                        ? 'border-slate-900 dark:border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-2.5 h-2.5 rounded-[3px] shrink-0 ${token.dotClass}`}
                    />
                    <span className="truncate">{token.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
            >
              {editingGroup ? 'Enregistrer' : 'Créer le groupe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
