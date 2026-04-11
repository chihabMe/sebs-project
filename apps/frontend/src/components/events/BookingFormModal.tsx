import { useState } from 'react';
import { Button } from '../ui/button';
import { X, ClipboardCheck } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  required: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: { questionId: string; answer: string }[]) => void;
  questions: Question[];
  isPending: boolean;
  eventTitle: string;
}

export default function BookingFormModal({ isOpen, onClose, onSubmit, questions, isPending, eventTitle }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleAnswerChange = (id: string, val: string) => {
    setAnswers({ ...answers, [id]: val });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    onSubmit(formattedAnswers);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-on-surface/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-surface rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-primary/5">
        <header className="bg-primary p-8 text-on-primary">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          <h2 className="text-2xl font-black font-headline tracking-tight">Entry Verification</h2>
          <p className="text-on-primary/70 text-sm mt-1">The curator of <span className="font-bold">{eventTitle}</span> has requested additional information for your registry.</p>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-outline block ml-1">
                  {q.question} {q.required && <span className="text-error">*</span>}
                </label>
                <textarea 
                  required={q.required}
                  className="w-full bg-surface-container-high rounded-xl py-3 px-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium min-h-[80px]"
                  placeholder="Type your response here..."
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-primary/5 flex gap-4">
            <Button variant="ghost" className="flex-1" onClick={onClose} type="button">Discard</Button>
            <Button className="flex-[2]" disabled={isPending} type="submit">
              {isPending ? 'Submitting Archive...' : 'Submit Entry Request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
