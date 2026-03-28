import { useEffect, useMemo, useState } from 'react';
import { apiListPlaybook, apiCreatePlaybook, apiUpdatePlaybook, apiDeletePlaybook, apiUploadPlaybookImage, fileUrl } from '@/api/client';
import type { Playbook, UUID } from '@/types';
import Layout from '@/components/layout/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/contexts/ToastContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useEscapeKey } from '@/hooks/useEscapeKey';

const inputCls = `w-full bg-surface border border-border-primary text-slate-100 px-3 py-2.5
  rounded-lg text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-slate-500`;

export default function PlaybookPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewTab, setPreviewTab] = useState<'edit' | 'preview'>('edit');
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [form, setForm] = useState({ title: '', description: '', content: '', tags: '', imageUrl: '', checklist: '[]' });

  useEffect(() => { loadPlaybooks(); }, []);
  useEscapeKey(showModal ? closeModal : null);

  const filteredPlaybooks = useMemo(() => {
    if (!searchQuery) return playbooks;
    const q = searchQuery.toLowerCase();
    return playbooks.filter(p => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.tags?.toLowerCase().includes(q));
  }, [playbooks, searchQuery]);

  const loadPlaybooks = async () => {
    setLoading(true);
    try { setPlaybooks((await apiListPlaybook()).data); }
    finally { setLoading(false); }
  };

  const openNew = () => {
    setForm({ title: '', description: '', content: '', tags: '', imageUrl: '', checklist: '[]' });
    setNewChecklistItem(''); setIsEditing(false); setIsViewMode(false); setPreviewTab('edit'); setShowModal(true);
  };

  const openView = (pb: Playbook) => { setSelectedPlaybook(pb); setIsEditing(false); setIsViewMode(true); setShowModal(true); };

  const openEdit = (pb: Playbook) => {
    setForm({ title: pb.title, description: pb.description || '', content: pb.content, tags: pb.tags || '', imageUrl: pb.imageUrl || '', checklist: pb.checklist || '[]' });
    setNewChecklistItem(''); setSelectedPlaybook(pb); setIsEditing(true); setIsViewMode(false); setPreviewTab('edit'); setShowModal(true);
  };

  function closeModal() { setShowModal(false); setSelectedPlaybook(null); setIsViewMode(false); }

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (isEditing && selectedPlaybook) {
      setUploadingImage(true);
      try { const res = await apiUploadPlaybookImage(selectedPlaybook.id, file); setForm({ ...form, imageUrl: res.data.imageUrl }); showToast('Image uploaded'); }
      catch { showToast('Failed to upload image', 'error'); }
      finally { setUploadingImage(false); }
    } else {
      setForm({ ...form, imageUrl: URL.createObjectURL(file) });
    }
  };

  const handleDrop = async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) await processImageFile(f); };

  const savePlaybook = async () => {
    try {
      if (isEditing && selectedPlaybook) {
        const res = await apiUpdatePlaybook(selectedPlaybook.id, form);
        setPlaybooks(playbooks.map(p => p.id === selectedPlaybook.id ? res.data : p));
        showToast('Strategy updated');
      } else {
        const res = await apiCreatePlaybook(form);
        if (form.imageUrl && form.imageUrl.startsWith('blob:')) {
          const input = document.querySelector('input[type="file"]') as HTMLInputElement;
          const file = input?.files?.[0];
          if (file) { await apiUploadPlaybookImage(res.data.id, file); await loadPlaybooks(); }
        } else { setPlaybooks([...playbooks, res.data]); }
        showToast('Strategy created');
      }
      closeModal();
    } catch { showToast('Failed to save strategy', 'error'); }
  };

  const deletePlaybook = async (id: UUID) => {
    const confirmed = await confirm({ title: 'Delete Strategy', message: 'Are you sure? This action cannot be undone.', confirmText: 'Delete', confirmVariant: 'danger' });
    if (!confirmed) return;
    try { await apiDeletePlaybook(id); setPlaybooks(playbooks.filter(p => p.id !== id)); showToast('Strategy deleted'); }
    catch { showToast('Failed to delete strategy', 'error'); }
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    try { const items: string[] = JSON.parse(form.checklist); items.push(newChecklistItem.trim()); setForm({ ...form, checklist: JSON.stringify(items) }); }
    catch { setForm({ ...form, checklist: JSON.stringify([newChecklistItem.trim()]) }); }
    setNewChecklistItem('');
  };

  const removeChecklistItem = (idx: number) => {
    try { const items: string[] = JSON.parse(form.checklist); items.splice(idx, 1); setForm({ ...form, checklist: JSON.stringify(items) }); }
    catch { /* ignore */ }
  };

  const getChecklistItems = (): string[] => { try { return JSON.parse(form.checklist); } catch { return []; } };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Trading Playbook</h1>
          <p className="text-sm text-slate-400 mt-1">Document your strategies, setups, and trading plans</p>
        </div>
        <button onClick={openNew} className="px-4 py-2.5 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors">
          + New Strategy
        </button>
      </div>

      {/* Search */}
      {playbooks.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <input className={`${inputCls} flex-1`} placeholder="Search strategies..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button onClick={() => setSearchQuery('')} className="text-sm text-slate-400 hover:text-slate-200">Clear</button>}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-20 text-slate-400"><div className="spinner" /> Loading playbook...</div>
      ) : playbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4">📋</div>
          <div className="text-base font-medium text-slate-300 mb-1">No strategies yet</div>
          <div className="text-sm text-slate-500 mb-4">Create your first trading strategy to get started</div>
          <button onClick={openNew} className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-semibold hover:bg-brand-hover">+ Create Strategy</button>
        </div>
      ) : filteredPlaybooks.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-base font-medium text-slate-300 mb-1">No strategies match your search</div>
          <div className="text-sm text-slate-500">Try adjusting your search query</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlaybooks.map(pb => (
            <div key={pb.id} onClick={() => openView(pb)}
              className="bg-panel rounded-xl border border-border-primary overflow-hidden cursor-pointer hover:border-brand/30 transition-colors">
              {pb.imageUrl && (
                <div className="h-40 overflow-hidden">
                  <img src={fileUrl(pb.imageUrl)} alt="" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-100 line-clamp-1">{pb.title}</h3>
                  <div className="flex gap-2 ml-2 flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEdit(pb); }} className="text-xs text-slate-400 hover:text-slate-200">Edit</button>
                    <button onClick={e => { e.stopPropagation(); deletePlaybook(pb.id); }} className="text-xs text-danger hover:text-red-300">Delete</button>
                  </div>
                </div>
                {pb.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{pb.description}</p>}
                <div className="text-xs text-slate-500 line-clamp-3 mb-3 markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{pb.content.slice(0, 200) + (pb.content.length > 200 ? '...' : '')}</ReactMarkdown>
                </div>
                {pb.tags && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {pb.tags.split(',').map((tag, i) => tag.trim() ? (
                      <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-brand/10 text-brand rounded-full">{tag.trim()}</span>
                    ) : null)}
                  </div>
                )}
                <div className="text-[10px] text-slate-600">Updated: {new Date(pb.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View modal */}
      {showModal && isViewMode && selectedPlaybook && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[5vh] z-[1000] overflow-y-auto" onClick={closeModal}>
          <div className="bg-panel border border-border-primary rounded-2xl w-full max-w-[900px] shadow-2xl mb-8" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
              <h2 className="text-xl font-bold text-slate-100">{selectedPlaybook.title}</h2>
              <div className="flex gap-3">
                <button onClick={e => { e.stopPropagation(); openEdit(selectedPlaybook); }}
                  className="px-3 py-2 text-sm border border-border-primary rounded-lg text-slate-300 hover:bg-surface-secondary">Edit</button>
                <button onClick={closeModal}
                  className="px-3 py-2 text-sm border border-border-primary rounded-lg text-slate-300 hover:bg-surface-secondary">Close</button>
              </div>
            </div>
            <div className="p-6">
              {selectedPlaybook.imageUrl && (
                <div className="rounded-lg overflow-hidden mb-4 max-h-[300px]">
                  <img src={fileUrl(selectedPlaybook.imageUrl)} alt="" className="w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }} />
                </div>
              )}
              {selectedPlaybook.description && <p className="text-sm text-slate-400 mb-4">{selectedPlaybook.description}</p>}
              {selectedPlaybook.tags && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedPlaybook.tags.split(',').map((tag, i) => tag.trim() ? (
                    <span key={i} className="px-2.5 py-1 text-xs font-medium bg-brand/10 text-brand rounded-full">{tag.trim()}</span>
                  ) : null)}
                </div>
              )}
              {selectedPlaybook.checklist && (() => {
                try {
                  const items: string[] = JSON.parse(selectedPlaybook.checklist);
                  if (items.length > 0) return (
                    <div className="mb-4">
                      <span className="text-xs font-medium text-slate-400">Checklist: </span>
                      <span className="text-sm text-slate-300">{items.join(', ')}</span>
                    </div>
                  );
                } catch { /* ignore */ }
                return null;
              })()}
              <div className="markdown-content text-slate-200">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedPlaybook.content}</ReactMarkdown>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border-primary">
              <span className="text-xs text-slate-500">Updated: {new Date(selectedPlaybook.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create modal */}
      {showModal && !isViewMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-[5vh] z-[1000] overflow-y-auto" onClick={closeModal}>
          <div className="bg-panel border border-border-primary rounded-2xl w-full max-w-[900px] shadow-2xl mb-8" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="flex items-center justify-between p-6 pb-4 border-b border-border-primary">
              <h2 className="text-xl font-bold text-slate-100">{isEditing ? 'Edit Strategy' : 'New Strategy'}</h2>
              <button onClick={closeModal} className="w-8 h-8 rounded-lg border border-border-primary flex items-center justify-center text-slate-100 hover:bg-surface-secondary">{'\u2715'}</button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Title</label>
                <input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Breakout Strategy" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Description (optional)</label>
                <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" />
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Image (optional)</label>
                {!form.imageUrl ? (
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                      ${isDragging ? 'border-brand bg-brand/5' : 'border-border-primary hover:border-border-light'}`}
                    style={uploadingImage ? { opacity: 0.6, pointerEvents: 'none' } : {}}
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                    onDragLeave={e => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                    onClick={() => document.getElementById('img-upload')?.click()}
                  >
                    <input id="img-upload" type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) processImageFile(f); }} className="hidden" disabled={uploadingImage} />
                    <div className="text-2xl mb-2">{uploadingImage ? '\u23F3' : isDragging ? '\u{1F4C2}' : '\u{1F5BC}\uFE0F'}</div>
                    {uploadingImage ? <p className="text-sm text-slate-400">Uploading...</p> : (
                      <>
                        <p className="text-sm text-slate-400">{isDragging ? 'Drop image here' : 'Click to upload or drag & drop'}</p>
                        <p className="text-xs text-slate-600 mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={form.imageUrl.startsWith('blob:') ? form.imageUrl : fileUrl(form.imageUrl)} alt="Preview" className="w-full max-h-[200px] object-cover" />
                    <button onClick={() => setForm({ ...form, imageUrl: '' })} disabled={uploadingImage}
                      className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-xs rounded hover:bg-black/80">
                      {'\u2715'} Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags (comma-separated)</label>
                <input className={inputCls} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Long, Day Trade, Momentum" />
              </div>

              {/* Checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Pre-trade Checklist</label>
                <p className="text-xs text-slate-600 mb-2">These items will appear as a checklist when this strategy is selected in a trade.</p>
                <div className="space-y-2 mb-2">
                  {getChecklistItems().map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-surface rounded-lg px-3 py-2 border border-border-primary">
                      <input type="checkbox" disabled className="opacity-50" />
                      <span className="flex-1 text-sm text-slate-300">{item}</span>
                      <button onClick={() => removeChecklistItem(idx)} className="text-xs text-slate-500 hover:text-danger">{'\u2715'}</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)}
                    placeholder="Add checklist item..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} />
                  <button onClick={addChecklistItem}
                    className="px-3 py-2.5 text-sm border border-border-primary rounded-lg text-slate-300 hover:bg-surface-secondary whitespace-nowrap">Add</button>
                </div>
              </div>

              {/* Content editor */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-400">Strategy Content (Markdown)</label>
                  <div className="flex gap-1 bg-surface rounded-md p-0.5">
                    {(['edit', 'preview'] as const).map(t => (
                      <button key={t} onClick={() => setPreviewTab(t)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all
                          ${previewTab === t ? 'bg-panel text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}>
                        {t === 'edit' ? 'Edit' : 'Preview'}
                      </button>
                    ))}
                  </div>
                </div>
                {previewTab === 'edit' ? (
                  <textarea className={`${inputCls} min-h-[300px] resize-y font-mono`}
                    value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                    placeholder="Describe your strategy in detail using Markdown..." />
                ) : (
                  <div className="bg-surface border border-border-primary rounded-lg p-4 min-h-[300px] markdown-content text-slate-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content || '*No content yet*'}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end p-6 pt-4 border-t border-border-primary">
              <button onClick={closeModal}
                className="px-4 py-2.5 rounded-lg border border-border-primary text-slate-100 text-sm font-medium hover:bg-surface-secondary">Cancel</button>
              <button onClick={savePlaybook} disabled={!form.title || !form.content}
                className="px-5 py-2.5 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50 transition-colors">
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
