import { useQuery } from '@tanstack/react-query';
import { getAttendanceHistory } from '../../api/auth';
import { subDays, format, isSameDay } from 'date-fns';

export default function AttendanceHeatmap() {
  const { data: history, isLoading } = useQuery({
    queryKey: ['attendance'],
    queryFn: getAttendanceHistory,
  });

  if (isLoading) {
    return <div className="h-32 flex items-center justify-center animate-pulse bg-surface-container-high rounded-xl"></div>;
  }

  // Generate last 100 days
  const today = new Date();
  const days = Array.from({ length: 100 }).map((_, i) => subDays(today, 99 - i));

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
      <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em] mb-4">Activity Heatmap</h3>
      <div className="flex flex-wrap gap-1">
        {days.map((day, i) => {
          // Find if user attended an event on this day
          const attendedEvents = history?.filter((h) => isSameDay(new Date(h.date), day) && h.attended);
          const hasAttended = attendedEvents && attendedEvents.length > 0;
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm \${
                hasAttended ? 'bg-primary' : 'bg-surface-container-highest/50'
              }`}
              title={format(day, 'MMM d, yyyy') + (hasAttended ? \` - \${attendedEvents.length} events\` : '')}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-container-highest/50"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
          <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
          <div className="w-3 h-3 rounded-sm bg-primary"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
