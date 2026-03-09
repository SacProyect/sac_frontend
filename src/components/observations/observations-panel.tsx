import React, { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, Calendar, FileText,
  X, Check, AlertCircle, Clock, Loader2,
  ChevronDown, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createObservation,
  getObservations,
  updateObservation,
  deleteObservations,
} from '@/components/utils/api/taxpayer-functions';
import { useAuth } from '@/hooks/use-auth';

/* ─── Types ─────────────────────────────────────────────────── */
interface Observation {
  id: string;
  description: string;
  date: string;
  created_at?: string;
}

interface ObservationsPanelProps {
  taxpayerId: string | undefined;
}

/* ─── Helpers ────────────────────────────────────────────────── */
function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ticketNumber(index: number) {
  return `#${String(index + 1).padStart(3, '0')}`;
}

/* ─── Component ──────────────────────────────────────────────── */
export function ObservationsPanel({ taxpayerId }: ObservationsPanelProps) {
  const { user } = useAuth();

  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* create form */
  const [showForm, setShowForm] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  /* edit state */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedDesc, setEditedDesc] = useState('');

  /* delete confirm */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* expanded tickets */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canAdmin = user?.role === 'ADMIN' || user?.role === 'COORDINATOR' || user?.role === 'SUPERVISOR' || user?.role === 'FISCAL';

  /* ── Fetch ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!taxpayerId) return;

    (async () => {
      try {
        setLoading(true);
        const data = await getObservations(taxpayerId);
        setObservations(data ?? []);
      } catch {
        toast.error('No se pudieron cargar las observaciones.');
      } finally {
        setLoading(false);
      }
    })();
  }, [taxpayerId]);

  /* ── Create ─────────────────────────────────────────────────── */
  const handleCreate = async () => {
    if (!taxpayerId) return;
    if (newDesc.trim().length < 10) {
      toast.error('La observación debe tener al menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await createObservation({ description: newDesc, date: newDate, taxpayerId });
      toast.success('¡Observación creada!');
      setNewDesc('');
      setNewDate(new Date().toISOString().split('T')[0]);
      setShowForm(false);
      const updated = await getObservations(taxpayerId);
      setObservations(updated ?? []);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al crear la observación.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Update ─────────────────────────────────────────────────── */
  const handleUpdate = async (id: string) => {
    if (editedDesc.trim().length < 10) {
      toast.error('La observación debe tener al menos 10 caracteres.');
      return;
    }
    try {
      await updateObservation(id, editedDesc);
      toast.success('¡Observación actualizada!');
      setObservations(prev =>
        prev.map(o => (o.id === id ? { ...o, description: editedDesc } : o))
      );
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al actualizar.');
    }
  };

  /* ── Delete ─────────────────────────────────────────────────── */
  const handleDelete = async (id: string) => {
    try {
      await deleteObservations(id);
      toast.success('Observación eliminada.');
      setObservations(prev => prev.filter(o => o.id !== id));
      setDeletingId(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Error al eliminar.');
    }
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="obs-panel flex flex-col h-full min-h-0">
      <style>{`
        .obs-panel {
          --obs-bg: #0f172a;
          --obs-surface: #1e293b;
          --obs-surface-2: #263348;
          --obs-border: rgba(148,163,184,0.12);
          --obs-border-em: rgba(245,158,11,0.35);
          --obs-accent: #f59e0b;
          --obs-accent-dim: rgba(245,158,11,0.12);
          --obs-accent-hover: #fbbf24;
          --obs-text-1: #f1f5f9;
          --obs-text-2: #94a3b8;
          --obs-text-3: #64748b;
          --obs-danger: #ef4444;
          --obs-danger-dim: rgba(239,68,68,0.10);
          --obs-success: #10b981;
          --obs-radius-sm: 6px;
          --obs-radius: 10px;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* ── Panel header ── */
        .ops-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid var(--obs-border);
          flex-shrink: 0;
        }
        .ops-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ops-header-icon {
          width: 28px; height: 28px;
          background: var(--obs-accent-dim);
          border: 1px solid var(--obs-border-em);
          border-radius: var(--obs-radius-sm);
          display: flex; align-items: center; justify-content: center;
          color: var(--obs-accent);
          flex-shrink: 0;
        }
        .ops-header-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--obs-text-1);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        .ops-count-badge {
          background: var(--obs-accent-dim);
          border: 1px solid var(--obs-border-em);
          color: var(--obs-accent);
          font-size: 11px;
          font-weight: 700;
          padding: 1px 7px;
          border-radius: 999px;
          line-height: 1.6;
        }
        .ops-add-btn {
          display: flex; align-items: center; gap: 5px;
          background: var(--obs-accent);
          color: #0f172a;
          border: none;
          border-radius: var(--obs-radius-sm);
          padding: 5px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }
        .ops-add-btn:hover { background: var(--obs-accent-hover); }
        .ops-add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Scrollable body ── */
        .ops-body {
          flex: 1 1 0;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          scrollbar-width: thin;
          scrollbar-color: var(--obs-border) transparent;
        }
        .ops-body::-webkit-scrollbar { width: 4px; }
        .ops-body::-webkit-scrollbar-thumb { background: var(--obs-border); border-radius: 2px; }

        /* ── Create form ── */
        .ops-create-form {
          background: var(--obs-surface);
          border: 1px solid var(--obs-border-em);
          border-radius: var(--obs-radius);
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          animation: fadeSlideIn 0.2s ease;
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ops-form-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--obs-accent);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 2px;
        }
        .ops-form-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ops-form-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--obs-text-2);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ops-form-input {
          width: 100%;
          background: var(--obs-surface-2);
          border: 1px solid var(--obs-border);
          border-radius: var(--obs-radius-sm);
          color: var(--obs-text-1);
          font-size: 13px;
          padding: 7px 10px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
        }
        .ops-form-input:focus { border-color: var(--obs-accent); }
        .ops-form-textarea {
          min-height: 80px;
          resize: vertical;
          line-height: 1.5;
        }
        .ops-form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .ops-btn-cancel {
          background: transparent;
          border: 1px solid var(--obs-border);
          color: var(--obs-text-2);
          border-radius: var(--obs-radius-sm);
          padding: 5px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s;
        }
        .ops-btn-cancel:hover { border-color: var(--obs-text-3); color: var(--obs-text-1); }
        .ops-btn-save {
          display: flex; align-items: center; gap: 5px;
          background: var(--obs-success);
          color: #f1f5f9;
          border: none;
          border-radius: var(--obs-radius-sm);
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .ops-btn-save:hover { opacity: 0.85; }
        .ops-btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Empty state ── */
        .ops-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 36px 20px;
          text-align: center;
        }
        .ops-empty-icon {
          width: 44px; height: 44px;
          background: var(--obs-accent-dim);
          border: 1px dashed var(--obs-border-em);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--obs-accent);
          opacity: 0.7;
        }
        .ops-empty-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--obs-text-2);
        }
        .ops-empty-sub {
          font-size: 12px;
          color: var(--obs-text-3);
          max-width: 220px;
          line-height: 1.5;
        }
        .ops-empty-cta {
          display: flex; align-items: center; gap: 5px;
          background: var(--obs-accent-dim);
          border: 1px solid var(--obs-border-em);
          color: var(--obs-accent);
          border-radius: var(--obs-radius-sm);
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ops-empty-cta:hover { background: rgba(245,158,11,0.20); }

        /* ── Loading ── */
        .ops-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px 0;
          color: var(--obs-text-3);
          font-size: 13px;
        }
        .ops-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Ticket ── */
        .obs-ticket {
          background: var(--obs-surface);
          border: 1px solid var(--obs-border);
          border-radius: var(--obs-radius);
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .obs-ticket:hover { border-color: rgba(148,163,184,0.24); box-shadow: 0 2px 12px rgba(0,0,0,0.2); }
        .obs-ticket.is-expanded { border-color: var(--obs-border-em); }

        .ticket-top {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 11px 12px 10px;
          cursor: pointer;
          user-select: none;
        }
        .ticket-num-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
          padding-top: 1px;
        }
        .ticket-num {
          font-size: 10px;
          font-weight: 800;
          color: var(--obs-accent);
          letter-spacing: 0.08em;
          font-family: 'Courier New', monospace;
          background: var(--obs-accent-dim);
          border: 1px solid var(--obs-border-em);
          border-radius: 4px;
          padding: 0 5px;
          line-height: 1.8;
        }
        .ticket-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--obs-accent);
          opacity: 0.5;
        }

        .ticket-main {
          flex: 1 1 0;
          min-width: 0;
        }
        .ticket-desc-preview {
          font-size: 13px;
          color: var(--obs-text-1);
          line-height: 1.45;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 6px;
        }
        .ticket-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ticket-date {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--obs-text-3);
        }
        .ticket-expand-icon {
          color: var(--obs-text-3);
          flex-shrink: 0;
          transition: transform 0.2s;
          margin-top: 2px;
        }
        .ticket-expand-icon.rotated { transform: rotate(180deg); }

        /* ── Expanded body ── */
        .ticket-body {
          border-top: 1px solid var(--obs-border);
          padding: 12px 12px 12px 14px;
          animation: fadeSlideIn 0.18s ease;
        }
        .ticket-full-desc {
          font-size: 13px;
          color: var(--obs-text-1);
          line-height: 1.6;
          margin-bottom: 10px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Edit textarea */
        .ticket-edit-area {
          width: 100%;
          background: var(--obs-surface-2);
          border: 1px solid var(--obs-accent);
          border-radius: var(--obs-radius-sm);
          color: var(--obs-text-1);
          font-size: 13px;
          padding: 8px 10px;
          outline: none;
          resize: vertical;
          min-height: 70px;
          line-height: 1.5;
          margin-bottom: 8px;
          box-sizing: border-box;
        }

        .ticket-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }
        .ticket-btn {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 10px;
          border-radius: var(--obs-radius-sm);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid transparent;
          transition: opacity 0.15s, background 0.15s;
        }
        .ticket-btn.edit {
          background: rgba(59,130,246,0.12);
          border-color: rgba(59,130,246,0.3);
          color: #60a5fa;
        }
        .ticket-btn.edit:hover { opacity: 0.8; }
        .ticket-btn.save {
          background: var(--obs-success);
          color: #f1f5f9;
        }
        .ticket-btn.save:hover { opacity: 0.85; }
        .ticket-btn.cancel-edit {
          background: transparent;
          border-color: var(--obs-border);
          color: var(--obs-text-2);
        }
        .ticket-btn.cancel-edit:hover { border-color: var(--obs-text-3); }
        .ticket-btn.delete {
          background: var(--obs-danger-dim);
          border-color: rgba(239,68,68,0.3);
          color: #f87171;
        }
        .ticket-btn.delete:hover { opacity: 0.8; }

        /* ── Delete confirm inline ── */
        .ticket-delete-confirm {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: var(--obs-radius-sm);
          padding: 10px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
          animation: fadeSlideIn 0.15s ease;
        }
        .ticket-delete-confirm-text {
          font-size: 12px;
          color: #fca5a5;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ticket-delete-confirm-actions {
          display: flex;
          gap: 6px;
        }
        .ticket-btn.confirm-delete {
          background: var(--obs-danger);
          color: white;
          font-weight: 700;
        }
        .ticket-btn.confirm-delete:hover { opacity: 0.85; }
      `}</style>

      {/* ── Panel header ── */}
      <div className="ops-header">
        <div className="ops-header-left">
          <div className="ops-header-icon">
            <MessageSquare size={13} />
          </div>
          <span className="ops-header-title">Observaciones</span>
          <span className="ops-count-badge">{observations.length}</span>
        </div>
        {canAdmin && (
          <button
            className="ops-add-btn"
            onClick={() => setShowForm(f => !f)}
            disabled={submitting}
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Cerrar' : 'Nueva'}
          </button>
        )}
      </div>

      {/* ── Scrollable body ── */}
      <div className="ops-body">

        {/* Create form */}
        {showForm && canAdmin && (
          <div className="ops-create-form">
            <p className="ops-form-title">Nueva Observación</p>

            <div className="ops-form-row">
              <span className="ops-form-label">Fecha</span>
              <input
                type="date"
                className="ops-form-input"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />
            </div>

            <div className="ops-form-row">
              <span className="ops-form-label">Descripción</span>
              <textarea
                className="ops-form-input ops-form-textarea"
                placeholder="Describe la observación del contribuyente..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>

            <div className="ops-form-actions">
              <button className="ops-btn-cancel" onClick={() => { setShowForm(false); setNewDesc(''); }}>
                Cancelar
              </button>
              <button className="ops-btn-save" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 size={12} className="ops-spin" /> : <Check size={12} />}
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="ops-loading">
            <Loader2 size={16} className="ops-spin" />
            Cargando observaciones...
          </div>
        )}

        {/* Empty state */}
        {!loading && observations.length === 0 && (
          <div className="ops-empty">
            <div className="ops-empty-icon">
              <FileText size={20} />
            </div>
            <p className="ops-empty-title">Sin observaciones</p>
            <p className="ops-empty-sub">
              Este contribuyente no tiene observaciones registradas. Puedes crear la primera ahora.
            </p>
            {canAdmin && (
              <button className="ops-empty-cta" onClick={() => setShowForm(true)}>
                <Plus size={13} />
                Crear observación
              </button>
            )}
          </div>
        )}

        {/* Tickets */}
        {!loading && observations.map((obs, idx) => {
          const isExpanded = expandedId === obs.id;
          const isEditing = editingId === obs.id;
          const isDeleting = deletingId === obs.id;

          return (
            <div
              key={obs.id}
              className={`obs-ticket${isExpanded ? ' is-expanded' : ''}`}
            >
              {/* ── Top row (always visible) ── */}
              <div
                className="ticket-top"
                onClick={() => {
                  if (isEditing) return;
                  setExpandedId(isExpanded ? null : obs.id);
                }}
              >
                <div className="ticket-num-col">
                  <span className="ticket-num">{ticketNumber(idx)}</span>
                  <span className="ticket-dot" />
                </div>

                <div className="ticket-main">
                  <p className="ticket-desc-preview">{obs.description}</p>
                  <div className="ticket-meta">
                    <span className="ticket-date">
                      <Calendar size={10} />
                      {formatDate(obs.date)}
                    </span>
                    {obs.created_at && obs.created_at !== obs.date && (
                      <span className="ticket-date">
                        <Clock size={10} />
                        {formatDate(obs.created_at)}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  className={`ticket-expand-icon${isExpanded ? ' rotated' : ''}`}
                />
              </div>

              {/* ── Expanded body ── */}
              {isExpanded && (
                <div className="ticket-body">
                  {isEditing ? (
                    <>
                      <textarea
                        className="ticket-edit-area"
                        value={editedDesc}
                        onChange={e => setEditedDesc(e.target.value)}
                        autoFocus
                      />
                      <div className="ticket-actions">
                        <button
                          className="ticket-btn cancel-edit"
                          onClick={() => { setEditingId(null); setEditedDesc(''); }}
                        >
                          <X size={11} />
                          Cancelar
                        </button>
                        <button
                          className="ticket-btn save"
                          onClick={() => handleUpdate(obs.id)}
                        >
                          <Check size={11} />
                          Guardar
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="ticket-full-desc">{obs.description}</p>

                      {/* Delete confirm zone */}
                      {isDeleting ? (
                        <div className="ticket-delete-confirm">
                          <span className="ticket-delete-confirm-text">
                            <AlertCircle size={13} />
                            ¿Eliminar esta observación? Esta acción es irreversible.
                          </span>
                          <div className="ticket-delete-confirm-actions">
                            <button
                              className="ticket-btn cancel-edit"
                              onClick={() => setDeletingId(null)}
                            >
                              No
                            </button>
                            <button
                              className="ticket-btn confirm-delete"
                              onClick={() => handleDelete(obs.id)}
                            >
                              Sí, eliminar
                            </button>
                          </div>
                        </div>
                      ) : canAdmin && (
                        <div className="ticket-actions">
                          <button
                            className="ticket-btn edit"
                            onClick={() => { setEditingId(obs.id); setEditedDesc(obs.description); }}
                          >
                            <Edit2 size={11} />
                            Editar
                          </button>
                          <button
                            className="ticket-btn delete"
                            onClick={() => setDeletingId(obs.id)}
                          >
                            <Trash2 size={11} />
                            Eliminar
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ObservationsPanel;
