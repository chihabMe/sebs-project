import { useQuery } from '@tanstack/react-query';
import { getAttendanceHistory } from '../../api/auth';
import { subDays, format, isSameDay } from 'date-fns';

type AttendanceHistoryItem = {
  id?: string;
  eventId?: string;
  title?: string;
  date: string | Date;
  attended?: boolean;
  missed?: boolean;
  upcoming?: boolean;
};

type AttendanceStats = {
  totalConfirmed: number;
  attended: number;
  missed: number;
  upcoming: number;
  attendanceRate: number;
};

type AttendancePayload = {
  history: AttendanceHistoryItem[];
  stats: AttendanceStats;
};

type AttendanceHeatmapProps = {
  history?: AttendanceHistoryItem[];
  stats?: AttendanceStats;
  title?: string;
};

const emptyStats: AttendanceStats = {
  totalConfirmed: 0,
  attended: 0,
  missed: 0,
  upcoming: 0,
  attendanceRate: 0,
};

export default function AttendanceHeatmap({ history: providedHistory, stats: providedStats, title = 'Activity Heatmap' }: AttendanceHeatmapProps) {
  const { data, isLoading } = useQuery<AttendancePayload>({
    queryKey: ['attendance'],
    queryFn: async () => (await getAttendanceHistory()) as unknown as AttendancePayload,
    enabled: !providedHistory,
  });

  if (!providedHistory && isLoading) {
    return <div className="h-32 flex items-center justify-center animate-pulse bg-surface-container-high rounded-xl"></div>;
  }

  const history = providedHistory ?? data?.history ?? [];
  const stats = providedStats ?? data?.stats ?? emptyStats;
  const today = new Date();
  const days = Array.from({ length: 100 }).map((_, i) => subDays(today, 99 - i));

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.2em]">{title}</h3>
          <p className="mt-2 text-xs font-medium text-on-surface-variant">
            Blue means attended. Red means booked and missed.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
          <Stat label="Attended" value={stats.attended} tone="primary" />
          <Stat label="Missed" value={stats.missed} tone="error" />
          <Stat label="Upcoming" value={stats.upcoming} tone="neutral" />
          <Stat label="Rate" value={`${stats.attendanceRate}%`} tone="neutral" />
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {days.map((day, i) => {
          const eventsForDay = history.filter((item) => isSameDay(new Date(item.date), day));
          const attendedEvents = eventsForDay.filter((item) => item.attended);
          const missedEvents = eventsForDay.filter((item) => item.missed);
          const hasAttended = attendedEvents.length > 0;
          const hasMissed = missedEvents.length > 0;
          const cellColor = hasAttended ? 'bg-primary' : hasMissed ? 'bg-error' : 'bg-surface-container-highest/50';
          const tooltipParts = [
            attendedEvents.length ? `${attendedEvents.length} attended` : '',
            missedEvents.length ? `${missedEvents.length} missed` : '',
          ].filter(Boolean);
          
          return (
            <div
              key={i}
              className={`w-3 h-3 rounded-sm ${cellColor}`}
              title={format(day, 'MMM d, yyyy') + (tooltipParts.length ? ` - ${tooltipParts.join(', ')}` : '')}
            />
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
        <span>No event</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-surface-container-highest/50"></div>
          <div className="w-3 h-3 rounded-sm bg-primary"></div>
          <div className="w-3 h-3 rounded-sm bg-error"></div>
        </div>
        <span>Attended / missed</span>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: 'primary' | 'error' | 'neutral' }) {
  const toneClass = tone === 'primary' ? 'text-primary' : tone === 'error' ? 'text-error' : 'text-on-surface';
  return (
    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high px-3 py-2">
      <p className={`text-lg font-black leading-none ${toneClass}`}>{value}</p>
      <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-outline">{label}</p>
    </div>
  );
}
