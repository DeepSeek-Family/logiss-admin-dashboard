import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, HelpCircle, GripVertical, MessageSquare } from 'lucide-react';
import { Badge } from '@/shared/components/ui';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  category: string;
  expanded: boolean;
}

const CATEGORIES = ['Driver', 'Customer'];

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 1,
    question: 'How do I start my shift and accept a trip?',
    answer: 'Open the Driver app → tap "Go On Duty" → trips assigned to you will appear automatically. Tap "Accept" to confirm and get navigation directions.',
    category: 'Driver',
    expanded: false,
  },
  {
    id: 2,
    question: 'How do I mark a trip as complete?',
    answer: 'After dropping off the passenger, tap "Complete Trip" in the app. You will be prompted to confirm the drop-off location before the trip is closed.',
    category: 'Driver',
    expanded: false,
  },
  {
    id: 3,
    question: 'What do I do if a passenger is a no-show?',
    answer: 'Wait at least 5 minutes after the scheduled pickup time. If the passenger does not appear, tap "No Show" in the app. Dispatch will be notified automatically.',
    category: 'Driver',
    expanded: false,
  },
  {
    id: 4,
    question: 'How do I cancel my scheduled trip?',
    answer: 'To cancel a trip, please call our dispatch center at least 24 hours in advance. Late cancellations may be subject to a fee depending on your payer.',
    category: 'Customer',
    expanded: false,
  },
  {
    id: 5,
    question: 'What is a Will-Call trip?',
    answer: 'A Will-Call trip is a return trip where the exact pickup time is not fixed in advance. You must call dispatch when you are ready to be picked up from your appointment.',
    category: 'Customer',
    expanded: false,
  },
];

export const FaqPanel = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newCategory, setNewCategory] = useState('Driver');

  const filtered = activeCategory === 'All'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  const toggleExpand = (id: number) => {
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, expanded: !f.expanded } : f));
  };

  const startEdit = (faq: FaqItem) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditCategory(faq.category);
    setShowAddForm(false);
    // expand the item being edited
    setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, expanded: true } : f));
  };

  const saveEdit = () => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    setFaqs(prev => prev.map(f =>
      f.id === editingId
        ? { ...f, question: editQuestion.trim(), answer: editAnswer.trim(), category: editCategory }
        : f
    ));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const deleteFaq = (id: number) => {
    setFaqs(prev => prev.filter(f => f.id !== id));
    setDeleteConfirmId(null);
  };

  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const item: FaqItem = {
      id: Date.now(),
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: newCategory,
      expanded: true,
    };
    setFaqs(prev => [...prev, item]);
    setNewQuestion('');
    setNewAnswer('');
    setNewCategory('Dispatcher');
    setShowAddForm(false);
  };

  const categoryCount = (cat: string) =>
    cat === 'All' ? faqs.length : faqs.filter(f => f.category === cat).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">FAQ Management</p>
          <p className="text-xs text-ink-4 mt-0.5">{faqs.length} questions across {CATEGORIES.length} categories</p>
        </div>
        <button
          onClick={() => { setShowAddForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={14} />
          Add FAQ
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              activeCategory === cat
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-ink-3 border-line-2 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {cat}
            <span className={`text-xs font-bold px-1 py-0.5 rounded ${activeCategory === cat ? 'bg-white/20' : 'bg-bg'}`}>
              {categoryCount(cat)}
            </span>
          </button>
        ))}
      </div>

      {/* Add New Form */}
      {showAddForm && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-primary uppercase tracking-wider">New FAQ Entry</p>
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              className="text-xs font-semibold text-ink border border-line-2 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-ink-4 uppercase mb-1.5 block">Question</label>
            <input
              type="text"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              placeholder="e.g. How do I cancel a scheduled trip?"
              autoFocus
              className="w-full text-sm font-medium text-ink border border-line-2 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-ink-4 uppercase mb-1.5 block">Answer</label>
            <textarea
              value={newAnswer}
              onChange={e => setNewAnswer(e.target.value)}
              placeholder="Write a clear, helpful answer..."
              rows={3}
              className="w-full text-sm text-ink border border-line-2 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setNewQuestion(''); setNewAnswer(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink-3 hover:text-ink rounded-lg border border-line-2 bg-white transition-colors"
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={addFaq}
              disabled={!newQuestion.trim() || !newAnswer.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Check size={13} /> Add FAQ
            </button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-line-2 rounded-2xl">
            <HelpCircle size={28} className="text-ink-4 mb-2" />
            <p className="text-sm font-semibold text-ink-4">No FAQs in this category</p>
            <p className="text-xs text-ink-4 mt-0.5">Click "Add FAQ" to create one.</p>
          </div>
        )}

        {filtered.map((faq, idx) => (
          <div
            key={faq.id}
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
              editingId === faq.id
                ? 'border-primary bg-primary/5'
                : 'border-line-2 bg-white hover:border-line'
            }`}
          >
            {/* Question Row */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer group"
              onClick={() => editingId !== faq.id && toggleExpand(faq.id)}
            >
              {/* Drag handle */}
              <GripVertical size={14} className="text-line-2 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />

              {/* Index */}
              <span className="text-xs font-black text-ink-4 w-5 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Question text or edit input */}
              <div className="flex-1 min-w-0">
                {editingId === faq.id ? (
                  <input
                    type="text"
                    value={editQuestion}
                    onChange={e => setEditQuestion(e.target.value)}
                    onClick={e => e.stopPropagation()}
                    className="w-full text-sm font-semibold text-ink border border-primary rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
                  />
                ) : (
                  <p className="text-sm font-semibold text-ink truncate">{faq.question}</p>
                )}
              </div>

              {/* Category Badge */}
              <Badge variant="bg" className="text-xs shrink-0 hidden sm:flex">{faq.category}</Badge>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                {editingId === faq.id ? (
                  <>
                    <button onClick={saveEdit} className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Save">
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} className="p-1.5 text-ink-4 hover:bg-bg rounded-lg transition-colors" title="Cancel">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(faq)}
                      className="p-1.5 text-ink-4 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    {deleteConfirmId === faq.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in duration-150">
                        <button onClick={() => deleteFaq(faq.id)} className="px-2 py-1 text-xs font-bold text-white bg-urgent rounded-lg">Delete</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 text-xs font-semibold text-ink-4 border border-line-2 rounded-lg bg-white">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(faq.id)}
                        className="p-1.5 text-ink-4 hover:text-urgent hover:bg-urgent/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <span className="ml-1 text-ink-4">
                      {faq.expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Answer Expand */}
            {(faq.expanded || editingId === faq.id) && (
              <div className="px-4 pb-4 border-t border-line-2/50 animate-in slide-in-from-top-1 duration-200">
                {editingId === faq.id ? (
                  <div className="space-y-3 pt-3">
                    <div>
                      <label className="text-xs font-bold text-ink-4 uppercase mb-1.5 block">Answer</label>
                      <textarea
                        value={editAnswer}
                        onChange={e => setEditAnswer(e.target.value)}
                        rows={3}
                        className="w-full text-sm text-ink border border-line-2 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-ink-4 uppercase">Category</label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value)}
                        className="text-xs font-semibold text-ink border border-line-2 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-primary"
                      >
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 pt-3">
                    <div className="w-5 shrink-0 flex justify-center mt-0.5">
                      <MessageSquare size={13} className="text-primary/50" />
                    </div>
                    <p className="text-sm text-ink-3 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-ink-4 text-center">
        FAQ content is shown to drivers and customers in the Help &amp; Support section.
      </p>
    </div>
  );
};
