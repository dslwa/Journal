import { useEffect, useMemo, useState } from "react";
import { apiListPlaybook, apiCreatePlaybook, apiUpdatePlaybook, apiDeletePlaybook } from "@/api/client";
import type { Playbook, UUID } from "@/types";
import Layout from "@/components/Layout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/components/ToastProvider";
import { useConfirm } from "@/components/ConfirmDialog";

export default function PlaybookPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [form, setForm] = useState({
    title: "",
    description: "",
    rules: "",
    setup: "",
    timeframe: "",
    riskNote: "",
  });

  useEffect(() => {
    loadPlaybooks();
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!showModal) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  const filteredPlaybooks = useMemo(() => {
    if (!searchQuery) return playbooks;
    const q = searchQuery.toLowerCase();
    return playbooks.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [playbooks, searchQuery]);

  const loadPlaybooks = async () => {
    setLoading(true);
    try {
      const res = await apiListPlaybook();
      setPlaybooks(res.data);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm({ title: "", description: "", rules: "", setup: "", timeframe: "", riskNote: "" });
    setIsEditing(false);
    setIsViewMode(false);
    setShowModal(true);
  };

  const openView = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
    setIsEditing(false);
    setIsViewMode(true);
    setShowModal(true);
  };

  const openEdit = (playbook: Playbook) => {
    setForm({
      title: playbook.title,
      description: playbook.description || "",
      rules: playbook.rules || "",
      setup: playbook.setup || "",
      timeframe: playbook.timeframe || "",
      riskNote: playbook.riskNote || "",
    });
    setSelectedPlaybook(playbook);
    setIsEditing(true);
    setIsViewMode(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPlaybook(null);
    setIsViewMode(false);
  };

  const savePlaybook = async () => {
    try {
      if (isEditing && selectedPlaybook) {
        const res = await apiUpdatePlaybook(selectedPlaybook.id, form);
        setPlaybooks(playbooks.map(p => p.id === selectedPlaybook.id ? res.data : p));
        showToast("Strategy updated successfully", "success");
      } else {
        const res = await apiCreatePlaybook(form);
        setPlaybooks([...playbooks, res.data]);
        showToast("Strategy created successfully", "success");
      }
      closeModal();
    } catch (err) {
      console.error("Failed to save playbook", err);
      showToast("Failed to save strategy", "error");
    }
  };

  const deletePlaybook = async (id: UUID) => {
    const confirmed = await confirm({
      title: "Delete Strategy",
      message: "Are you sure you want to delete this strategy? This action cannot be undone.",
      confirmText: "Delete",
      confirmVariant: "danger",
    });

    if (!confirmed) return;

    try {
      await apiDeletePlaybook(id);
      setPlaybooks(playbooks.filter(p => p.id !== id));
      showToast("Strategy deleted successfully", "success");
    } catch (err) {
      console.error("Failed to delete playbook", err);
      showToast("Failed to delete strategy", "error");
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="page-container">
          <div className="page-loader">
            <div className="spinner" />
            Loading playbook...
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="page-container">
        <header className="page-header-row">
          <div>
            <h1 className="page-title">Trading Playbook</h1>
            <p className="page-subtitle">Document your strategies, setups, and trading plans</p>
          </div>
          <button className="primary" onClick={openNew}>
            + New Strategy
          </button>
        </header>

        {playbooks.length > 0 && (
          <div className="filter-bar">
            <input
              className="input"
              placeholder="Search strategies by title or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>Clear</button>
            )}
          </div>
        )}

        {playbooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No strategies yet</h3>
            <p className="empty-state-text">Create your first trading strategy to get started</p>
            <button className="primary" onClick={openNew}>
              + Create Strategy
            </button>
          </div>
        ) : filteredPlaybooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No strategies match your search</div>
            <div className="empty-state-text">Try adjusting your search query</div>
          </div>
        ) : (
          <div className="playbook-grid">
            {filteredPlaybooks.map(playbook => (
              <div
                key={playbook.id}
                className="playbook-card"
                onClick={() => openView(playbook)}
              >
                <div className="playbook-card-header">
                  <h3 className="playbook-card-title">{playbook.title}</h3>
                  <div className="playbook-card-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(playbook);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaybook(playbook.id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {playbook.description && (
                  <p className="playbook-card-desc">{playbook.description}</p>
                )}

                <div className="playbook-card-footer">
                  <span className="playbook-date">
                    Updated: {new Date(playbook.updatedAt).toLocaleDateString()}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* View Modal */}
        {showModal && isViewMode && selectedPlaybook && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <header className="modal-header">
                <h2 className="modal-title">{selectedPlaybook.title}</h2>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(selectedPlaybook);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={closeModal}>Close</button>
                </div>
              </header>

              {selectedPlaybook.description && (
                <p className="playbook-view-desc">{selectedPlaybook.description}</p>
              )}

              <div className="playbook-view-md">
                <h3>Rules</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedPlaybook.rules || "*No rules defined*"}
                </ReactMarkdown>
                <h3>Setup</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedPlaybook.setup || "*No setup defined*"}
                </ReactMarkdown>
                <h3>Timeframe</h3>
                <p>{selectedPlaybook.timeframe}</p>
                <h3>Risk Note</h3>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selectedPlaybook.riskNote || "*No risk note defined*"}
                </ReactMarkdown>
              </div>

              <footer className="modal-footer">
                <span className="playbook-date">
                  Updated: {new Date(selectedPlaybook.updatedAt).toLocaleString()}
                </span>
              </footer>
            </div>
          </div>
        )}

        {/* Edit/Create Modal */}
        {showModal && !isViewMode && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal" style={{ maxWidth: 900 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <header className="modal-header">
                <h2 className="modal-title">{isEditing ? "Edit Strategy" : "New Strategy"}</h2>
                <button onClick={closeModal}>Close</button>
              </header>

              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Breakout Strategy, Support & Resistance"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <input
                  className="input"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of the strategy"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rules (Markdown supported)</label>
                <textarea
                  className="input"
                  style={{ minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                  value={form.rules}
                  onChange={(e) => setForm({ ...form, rules: e.target.value })}
                  placeholder="Entry, exit, and risk management rules..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Setup (Markdown supported)</label>
                <textarea
                  className="input"
                  style={{ minHeight: 150, resize: "vertical", fontFamily: "monospace" }}
                  value={form.setup}
                  onChange={(e) => setForm({ ...form, setup: e.target.value })}
                  placeholder="Describe the market conditions and chart setup..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Timeframe</label>
                <input
                  className="input"
                  value={form.timeframe}
                  onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
                  placeholder="e.g. 15min, 1H, 4H, 1D"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Risk Note (Markdown supported)</label>
                <textarea
                  className="input"
                  style={{ minHeight: 100, resize: "vertical", fontFamily: "monospace" }}
                  value={form.riskNote}
                  onChange={(e) => setForm({ ...form, riskNote: e.target.value })}
                  placeholder="Notes on risk management for this strategy..."
                />
              </div>

              <footer className="modal-footer">
                <button onClick={closeModal}>Cancel</button>
                <button
                  className="primary"
                  onClick={savePlaybook}
                  disabled={!form.title}
                >
                  {isEditing ? "Update" : "Create"}
                </button>
              </footer>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
