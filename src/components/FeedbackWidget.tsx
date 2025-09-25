import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquareWarning, LifeBuoy, Send, X } from 'lucide-react';

type FeedbackType = 'problem' | 'feature' | 'other';

interface StoredFeedback {
  id: string;
  type: FeedbackType;
  subject: string;
  description: string;
  email?: string;
  url: string;
  userAgent: string;
  ts: string;
}

const storageKey = 'roadReportFeedback';

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('problem');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const envInfo = useMemo(() => ({
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
  }), []);

  const reset = () => {
    setType('problem');
    setSubject('');
    setDescription('');
    setEmail('');
    setSubmittedId(null);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const saveFeedback = (item: StoredFeedback) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const list: StoredFeedback[] = raw ? JSON.parse(raw) : [];
      const next = [item, ...list];
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payload: StoredFeedback = {
      id,
      type,
      subject: subject.trim(),
      description: description.trim(),
      email: email.trim() || undefined,
      url: envInfo.url,
      userAgent: envInfo.userAgent,
      ts: new Date().toISOString(),
    };
    // Persist locally; could be extended to POST to backend later
    saveFeedback(payload);
    // Simulate network delay for UX
    await new Promise((r) => setTimeout(r, 400));
    setSubmittedId(id);
    setIsSubmitting(false);
  };

  return (
    <>
      <button
        aria-label="Troubleshooting feedback"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 px-3 py-2 rounded-full shadow-lg bg-primary text-primary-foreground hover:opacity-90"
        onClick={() => setOpen(true)}
      >
        <LifeBuoy className="w-4 h-4" />
        <span className="hidden sm:inline">Troubleshoot</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="w-4 h-4 text-primary" />
              Troubleshooting Feedback
            </DialogTitle>
            <DialogDescription>
              Tell us what went wrong or what you need. This helps us fix issues faster.
            </DialogDescription>
          </DialogHeader>

          {submittedId ? (
            <div className="space-y-3">
              <Badge className="bg-green-100 text-green-800">Thanks! Feedback submitted</Badge>
              <p className="text-sm text-muted-foreground">Reference ID: {submittedId}</p>
              <div className="flex justify-end">
                <Button onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {(
                  [
                    { k: 'problem', label: 'Problem' },
                    { k: 'feature', label: 'Feature' },
                    { k: 'other', label: 'Other' },
                  ] as Array<{ k: FeedbackType; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.k}
                    type="button"
                    onClick={() => setType(opt.k)}
                    className={`px-3 py-1 rounded border ${
                      type === opt.k ? 'bg-primary text-primary-foreground' : 'bg-background'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm">Subject</label>
                <input
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Short summary"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Details</label>
                <textarea
                  className="w-full px-3 py-2 border rounded-md bg-background min-h-28"
                  placeholder="Steps to reproduce, what happened, what you expected..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm">Email (optional)</label>
                <input
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
                We will include the current page and browser info to help troubleshoot.
                <div className="mt-2 space-y-1">
                  <div><span className="font-medium">Page:</span> {envInfo.url || '—'}</div>
                  <div className="break-all"><span className="font-medium">Browser:</span> {envInfo.userAgent || '—'}</div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!subject.trim() || !description.trim() || isSubmitting}>
                  <Send className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Submitting…' : 'Submit Feedback'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FeedbackWidget;


