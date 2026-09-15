import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
  UserCheck,
  Users,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  useGetHelpAndFaqsQuery,
  useCreateHelpAndFaqMutation,
  useUpdateHelpAndFaqMutation,
  useDeleteHelpAndFaqMutation,
  FaqItem,
} from '@/redux/api/helpAndFaqApi';

const DEFAULT_ROLES = ['DISPATCHER', 'USER'];

export const FaqPanel = () => {
  const { data: faqResponse, isLoading, isError, refetch } = useGetHelpAndFaqsQuery();
  const [createHelpAndFaq, { isLoading: isCreating }] = useCreateHelpAndFaqMutation();
  const [updateHelpAndFaq, { isLoading: isUpdating }] = useUpdateHelpAndFaqMutation();
  const [deleteHelpAndFaq, { isLoading: isDeleting }] = useDeleteHelpAndFaqMutation();

  const faqs = faqResponse?.data || [];

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAns, setEditAns] = useState('');
  const [editRole, setEditRole] = useState('DISPATCHER');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAns, setNewAns] = useState('');
  const [newRole, setNewRole] = useState('DISPATCHER');

  // Collect unique categories/roles from API data plus defaults
  const categories = Array.from(
    new Set([...DEFAULT_ROLES, ...faqs.map(f => f.role).filter(Boolean)])
  );

  const filtered = activeCategory === 'All'
    ? faqs
    : faqs.filter(f => f.role?.toUpperCase() === activeCategory.toUpperCase());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (faq: FaqItem) => {
    setEditingId(faq._id);
    setEditQuestion(faq.question);
    setEditAns(faq.ans);
    setEditRole(faq.role || 'DISPATCHER');
    setShowAddForm(false);
    setExpandedIds(prev => ({ ...prev, [faq._id]: true }));
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editQuestion.trim() || !editAns.trim()) return;
    try {
      await updateHelpAndFaq({
        id: editingId,
        body: {
          question: editQuestion.trim(),
          ans: editAns.trim(),
          role: editRole,
        },
      }).unwrap();
      toast.success('FAQ updated successfully');
      setEditingId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update FAQ');
    }
  };

  const handleDeleteFaq = async (id: string) => {
    try {
      await deleteHelpAndFaq(id).unwrap();
      toast.success('FAQ deleted successfully');
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete FAQ');
    }
  };

  const handleAddFaq = async () => {
    if (!newQuestion.trim() || !newAns.trim()) return;
    try {
      await createHelpAndFaq({
        question: newQuestion.trim(),
        ans: newAns.trim(),
        role: newRole,
      }).unwrap();
      toast.success('FAQ created successfully');
      setNewQuestion('');
      setNewAns('');
      setNewRole('DISPATCHER');
      setShowAddForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create FAQ');
    }
  };

  const categoryCount = (cat: string) =>
    cat === 'All'
      ? faqs.length
      : faqs.filter(f => f.role?.toUpperCase() === cat.toUpperCase()).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-bold text-ink">FAQ Management</p>
          <p className="text-xs text-ink-3 mt-0.5 font-medium">
            {faqs.length} questions across {categories.length} categories
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Add New FAQ
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-ink-2 border-line-2 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {cat === 'DISPATCHER' ? 'Dispatcher' : cat === 'USER' ? 'User' : cat}
            <span
              className={`text-xs font-extrabold px-1.5 py-0.5 rounded-md ${
                activeCategory === cat ? 'bg-white/20 text-white' : 'bg-bg text-ink-2'
              }`}
            >
              {categoryCount(cat)}
            </span>
          </button>
        ))}
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-primary/10 pb-3">
            <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Plus size={14} /> Add New FAQ Entry
            </p>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-ink-4 hover:text-ink p-1 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Role / Audience Selector */}
          <div>
            <label className="text-xs font-bold text-ink-2 uppercase mb-1.5 block">
              Target Audience / Role <span className="text-urgent">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setNewRole(r)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    newRole === r
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-ink-2 border-line-2 hover:border-primary/40'
                  }`}
                >
                  {r === 'DISPATCHER' ? <UserCheck size={14} /> : <Users size={14} />}
                  {r === 'DISPATCHER' ? 'Dispatcher FAQ' : 'User FAQ'} ({r})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-2 uppercase mb-1.5 block">
              Question <span className="text-urgent">*</span>
            </label>
            <input
              type="text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="e.g. How do I reset a dispatcher password?"
              autoFocus
              className="w-full text-sm font-semibold text-ink border border-line-2 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:font-normal"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-2 uppercase mb-1.5 block">
              Answer <span className="text-urgent">*</span>
            </label>
            <textarea
              value={newAns}
              onChange={e => setNewAns(e.target.value)}
              placeholder="Write a clear, helpful answer..."
              rows={3}
              className="w-full text-sm text-ink font-medium border border-line-2 rounded-xl px-3.5 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none placeholder:font-normal"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewQuestion('');
                setNewAns('');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-ink-2 hover:text-ink rounded-xl border border-line-2 bg-white transition-colors"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleAddFaq}
              disabled={isCreating || !newQuestion.trim() || !newAns.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save FAQ
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 flex flex-col items-center justify-center border border-line-2 rounded-2xl bg-white">
          <Loader2 size={28} className="text-primary animate-spin mb-2" />
          <p className="text-xs font-bold text-ink-3">Loading FAQs from database...</p>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="py-12 flex flex-col items-center justify-center border border-urgent/20 bg-urgent/5 rounded-2xl">
          <HelpCircle size={28} className="text-urgent mb-2" />
          <p className="text-sm font-bold text-urgent">Failed to load FAQs</p>
          <button
            onClick={() => refetch()}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-urgent rounded-xl hover:bg-urgent/90 transition-colors"
          >
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {/* FAQ List */}
      {!isLoading && !isError && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center border border-dashed border-line-2 rounded-2xl bg-white">
              <HelpCircle size={28} className="text-ink-4 mb-2" />
              <p className="text-sm font-bold text-ink-2">No FAQs found</p>
              <p className="text-xs text-ink-3 mt-0.5 font-medium">Click "Add New FAQ" to create one.</p>
            </div>
          )}

          {filtered.map((faq, idx) => {
            const isExpanded = expandedIds[faq._id] || editingId === faq._id;
            const roleUpper = faq.role?.toUpperCase();
            return (
              <div
                key={faq._id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  editingId === faq._id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-line-2 bg-white hover:border-line'
                }`}
              >
                {/* Question Row */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                  onClick={() => editingId !== faq._id && toggleExpand(faq._id)}
                >
                  <span className="text-xs font-black text-ink-3 w-5 shrink-0">
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="flex-1 min-w-0">
                    {editingId === faq._id ? (
                      <input
                        type="text"
                        value={editQuestion}
                        onChange={e => setEditQuestion(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-sm font-bold text-ink border border-primary rounded-xl px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    ) : (
                      <p className="text-sm font-bold text-ink truncate">{faq.question}</p>
                    )}
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 uppercase tracking-wide ${
                      roleUpper === 'DISPATCHER'
                        ? 'bg-primary/10 text-primary border-primary/20'
                        : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                    }`}
                  >
                    {roleUpper === 'DISPATCHER' ? 'Dispatcher' : roleUpper === 'USER' ? 'User' : faq.role}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    {editingId === faq._id ? (
                      <>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isUpdating}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-accent hover:bg-accent/90 rounded-lg transition-colors disabled:opacity-40"
                          title="Save"
                        >
                          {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1 text-ink-3 hover:text-ink hover:bg-bg rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit Button */}
                        <button
                          onClick={() => startEdit(faq)}
                          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-lg transition-all border border-primary/20"
                          title="Edit FAQ"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>

                        {/* Delete Button */}
                        {deleteConfirmId === faq._id ? (
                          <div className="flex items-center gap-1 animate-in fade-in duration-150">
                            <button
                              onClick={() => handleDeleteFaq(faq._id)}
                              disabled={isDeleting}
                              className="px-2 py-1 text-xs font-bold text-white bg-urgent rounded-lg disabled:opacity-40"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 text-xs font-semibold text-ink-3 border border-line-2 rounded-lg bg-white hover:bg-bg"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(faq._id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-urgent bg-urgent/10 hover:bg-urgent hover:text-white rounded-lg transition-all border border-urgent/20"
                            title="Delete FAQ"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(faq._id);
                          }}
                          className="p-1.5 ml-1 text-ink-3 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title={isExpanded ? 'Collapse Answer' : 'Expand Answer'}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Answer Expand */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-line-2/50 animate-in slide-in-from-top-1 duration-200">
                    {editingId === faq._id ? (
                      <div className="space-y-3 pt-3">
                        <div>
                          <label className="text-xs font-bold text-ink-2 uppercase mb-1.5 block">
                            Answer
                          </label>
                          <textarea
                            value={editAns}
                            onChange={e => setEditAns(e.target.value)}
                            rows={3}
                            className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-ink-2 uppercase mb-1.5 block">
                            Target Audience / Role
                          </label>
                          <div className="flex gap-2">
                            {DEFAULT_ROLES.map(r => (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setEditRole(r)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                  editRole === r
                                    ? 'bg-primary text-white border-primary shadow-xs'
                                    : 'bg-white text-ink-2 border-line-2 hover:border-primary/40'
                                }`}
                              >
                                {r === 'DISPATCHER' ? <UserCheck size={13} /> : <Users size={13} />}
                                {r === 'DISPATCHER' ? 'Dispatcher FAQ' : 'User FAQ'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 pt-3">
                        <div className="w-5 shrink-0 flex justify-center mt-0.5">
                          <MessageSquare size={14} className="text-primary" />
                        </div>
                        <p className="text-sm font-medium text-ink-2 leading-relaxed">{faq.ans}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-ink-3 font-medium text-center">
        FAQ content is shown to dispatchers and users in the Help & Support section.
      </p>
    </div>
  );
};


