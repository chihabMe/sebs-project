import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getManageEvent } from '../api/events';
import { getEventForm, updateEventForm } from '../api/organizer';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/ui/toast-provider';

export default function ManageEventFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [questions, setQuestions] = useState<{ question: string; required: boolean }[]>([]);

  const { data: event } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getManageEvent(id!),
    enabled: !!id,
  });

  const { data: existingQuestions } = useQuery({
    queryKey: ['event-form', id],
    queryFn: () => getEventForm(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (existingQuestions) {
      setQuestions(existingQuestions.map((q: any) => ({ 
        question: q.question, 
        required: q.required 
      })));
    }
  }, [existingQuestions]);

  const mutation = useMutation({
    mutationFn: (data: any) => updateEventForm(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-form', id] });
      showToast('Event form updated successfully!', 'success');
      navigate('/organizer');
    },
  });

  const addQuestion = () => {
    setQuestions([...questions, { question: '', required: true }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, val: string) => {
    const newQs = [...questions];
    newQs[index].question = val;
    setQuestions(newQs);
  };

  const toggleRequired = (index: number) => {
    const newQs = [...questions];
    newQs[index].required = !newQs[index].required;
    setQuestions(newQs);
  };

  const handleSave = () => {
    if (questions.some(q => !q.question.trim())) {
      showToast('Please fill in all questions or remove empty ones.', 'error');
      return;
    }
    mutation.mutate({ questions });
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="pt-32 px-6 max-w-4xl mx-auto w-full pb-20">
        <header className="mb-12">
          <Link to="/organizer" className="inline-flex items-center gap-2 text-outline hover:text-primary transition-colors font-bold text-xs uppercase tracking-widest mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h2 className="text-4xl font-black font-headline tracking-tight text-primary mb-2">Custom Discovery Form</h2>
          <p className="text-outline">Create custom questions for participants to answer when requesting entry to <span className="text-primary font-bold">{event?.title}</span>.</p>
        </header>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="bg-surface-container-low p-6 rounded-2xl border border-primary/5 shadow-sm flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-grow w-full space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline/60">Question #{index + 1}</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold uppercase text-outline cursor-pointer select-none" htmlFor={`req-${index}`}>Required</label>
                    <input 
                      id={`req-${index}`}
                      type="checkbox" 
                      checked={q.required} 
                      onChange={() => toggleRequired(index)}
                      className="rounded border-primary/20 text-primary focus:ring-primary/20"
                    />
                  </div>
                </div>
                <input 
                  className="w-full bg-surface-container-high rounded-xl py-3 px-4 text-on-surface border-none focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                  placeholder="e.g., Why do you want to attend this experience?"
                  value={q.question}
                  onChange={e => updateQuestion(index, e.target.value)}
                />
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="mt-6 md:mt-8 text-error hover:bg-error/5"
                onClick={() => removeQuestion(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-16 bg-surface-container-low/50 rounded-3xl border-2 border-dashed border-primary/5">
              <p className="text-outline font-medium">No custom questions added. Users will be able to book instantly without a form.</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-primary/5">
            <Button variant="outline" className="flex-1" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" /> Add Question
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={mutation.isPending}>
              <Save className="mr-2 h-4 w-4" /> 
              {mutation.isPending ? 'Saving Archive...' : 'Save Form Configuration'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
