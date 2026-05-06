import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { checkIn } from '../api/bookings';
import { getEvent } from '../api/events';
import Header from '../components/layout/Header';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/toast-provider';
import { CheckCircle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function CheckinPage() {
  const { id } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const hasSubmittedRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => getEvent(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (authLoading || eventLoading || hasSubmittedRef.current || !id) return;
    
    if (!isAuthenticated) {
      setStatus('error');
      setErrorMessage('You must be logged in to check in.');
      return;
    }

    const performCheckin = async () => {
      hasSubmittedRef.current = true;
      try {
        await checkIn(id!);
        setStatus('success');
        showToast('Checked in successfully!', 'success');
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.response?.data?.message || 'Check-in failed');
        showToast(error.response?.data?.message || 'Check-in failed', 'error');
      }
    };

    performCheckin();
  }, [id, isAuthenticated, authLoading, eventLoading, showToast]);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="bg-surface-container-low p-8 rounded-3xl max-w-md w-full text-center border border-primary/5 shadow-xl">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <h2 className="text-xl font-bold font-headline">Checking you in...</h2>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-20 h-20 text-secondary" />
              <h2 className="text-3xl font-black font-headline text-primary">Checked In!</h2>
              <p className="text-on-surface-variant font-medium">
                Welcome to {event?.title || 'the event'}. Enjoy your experience!
              </p>
              <Link to={`/events/${id}`} className="mt-4">
                <Button className="w-full">View Event Details</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-20 h-20 text-error" />
              <h2 className="text-3xl font-black font-headline text-error">Check-in Failed</h2>
              <p className="text-on-surface-variant font-medium">{errorMessage}</p>
              {!isAuthenticated && (
                <Link to="/login" className="w-full mt-4">
                  <Button className="w-full">Log In</Button>
                </Link>
              )}
              {isAuthenticated && (
                <Link to={`/events/${id}`} className="w-full mt-4">
                  <Button variant="outline" className="w-full">Back to Event</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
