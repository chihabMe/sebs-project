import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getEvents } from '../api/events';
import { getAllTags } from '../api/tags';
import Header from '../components/layout/Header';
import { Link } from 'react-router-dom';
import { formatImageUrl } from '../utils/formatUrl';
import { Button } from '../components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Skeleton } from '../components/ui/skeleton';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { PAGINATION } from '../constants/pagination';

export default function BrowseEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Local state for filters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All Events');
  const [tag, setTag] = useState(searchParams.get('tag') || 'All Tags');
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined
  );

  // Active filters for the query (only updated on "Search" click or category change)
  const [activeFilters, setActiveFilters] = useState(() => {
    const initial: Record<string, string> = {};
    if (searchParams.get('search')) initial.search = searchParams.get('search')!;
    if (searchParams.get('category') && searchParams.get('category') !== 'All Events') initial.category = searchParams.get('category')!;
    if (searchParams.get('tag') && searchParams.get('tag') !== 'All Tags') initial.tag = searchParams.get('tag')!;
    if (searchParams.get('date')) initial.date = searchParams.get('date')!;
    if (searchParams.get('organizerId')) initial.organizerId = searchParams.get('organizerId')!;
    return initial;
  });
  const [page, setPage] = useState(1);

  const { data: eventsPayload, isLoading } = useQuery({
    queryKey: ['events', activeFilters, page],
    queryFn: () => getEvents({ ...activeFilters, page, limit: PAGINATION.EVENTS_BROWSE }),
  });
  const events = eventsPayload?.data || [];
  const meta = eventsPayload?.meta;

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags,
  });

  const categories = ['All Events', 'Music', 'Tech', 'Art', 'Food', 'Social'];

  const handleSearch = () => {
    const filters: Record<string, string> = {};
    if (searchInput) filters.search = searchInput;
    if (category && category !== 'All Events') filters.category = category;
    if (tag && tag !== 'All Tags') filters.tag = tag;
    if (date) filters.date = format(date, 'yyyy-MM-dd');
    if (searchParams.get('organizerId')) filters.organizerId = searchParams.get('organizerId')!;
    
    setActiveFilters(filters);
    setPage(1);
    
    // Update URL params
    setSearchParams(filters);
  };

  const handleReset = () => {
    setSearchInput('');
    setCategory('All Events');
    setTag('All Tags');
    setDate(undefined);
    setActiveFilters({});
    setPage(1);
    setSearchParams({});
  };

  const isOrganizerFiltered = Boolean(activeFilters.organizerId);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Header />
      
      <main className="pt-24 pb-32 px-6 max-w-7xl mx-auto w-full">
        {/* Search & Filter Bar */}
        <section className="mb-12">
          <div className="flex flex-col lg:flex-row gap-4 items-end bg-surface-container-low p-6 rounded-2xl shadow-sm border border-primary/5">
            <div className="flex-1 w-full">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2 ml-1">Search Events</label>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-primary transition-colors" />
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-outline/50" 
                  placeholder="Artists, venues, or vibes..." 
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2 ml-1">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-surface-container-high border-none">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-48">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2 ml-1">Classification</label>
              <Select value={tag} onValueChange={setTag}>
                <SelectTrigger className="bg-surface-container-high border-none">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Tags">All Tags</SelectItem>
                  {tagsResponse?.data?.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full lg:w-56">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-outline mb-2 ml-1">Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-medium bg-surface-container-high border-none h-12"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-outline" />
                    {date ? format(date, "PPP") : <span className="text-outline/50">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                  <div className="p-3 border-t border-primary/5 bg-surface-container-lowest flex justify-end">
                     <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>Clear</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              <Button onClick={handleSearch} className="flex-1 lg:flex-none">
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset} title="Clear All">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        {/* Dynamic Content Header */}
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight font-headline text-primary">Vibe Discovery</h1>
            <p className="text-outline font-medium mt-1">
              {isOrganizerFiltered ? 'Showing events from a specific organizer.' : 'Explore curated experiences matching your craft.'}
            </p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <p className="text-primary text-sm font-bold">
              {isLoading ? 'Scanning Archive...' : `Showing ${meta?.total ?? events.length} events`}
            </p>
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-4">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="space-y-3 px-1">
                  <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-4" />
                </div>
              </div>
            ))
          ) : events.length > 0 ? (
            events.map((event: any) => (
              <div key={event.id} className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(62,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(62,0,0,0.08)] transition-all duration-500 border border-transparent hover:border-primary/5">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src={formatImageUrl(event.image)} 
                    alt={event.title}
                  />
                  {event.isApproved === false && (
                    <div className="absolute top-4 left-4 bg-error text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
                      Pending Approval
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
                    {event.tags?.slice(0, 3).map((t: any) => (
                      <span key={t.id} className="bg-black/50 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-7">
                  <div className="flex gap-5 mb-5">
                    <div className="flex flex-col items-center justify-center bg-primary text-on-primary w-14 h-14 rounded-2xl shrink-0 shadow-md">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{format(new Date(event.date), 'MMM')}</span>
                      <span className="text-xl font-black leading-none">{format(new Date(event.date), 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-1 font-headline">{event.title}</h3>
                      <p className="text-outline text-sm mt-1.5 flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[16px] text-primary">location_on</span> {event.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-5 border-t border-surface-container-high">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></span>
                       <span className="text-[10px] font-bold text-outline uppercase tracking-widest">{event.category}</span>
                    </div>
                    <Link to={`/events/${event.id}`} className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-primary/5 text-primary text-xs font-bold hover:bg-primary hover:text-on-primary transition-all group/btn">
                      View Event <Search className="ml-2 h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="lg:col-span-3 bg-surface-container-low/50 rounded-2xl border-2 border-dashed border-primary/10 flex flex-col items-center justify-center p-16 text-center min-h-[450px]">
              <div className="w-24 h-24 bg-surface-container-highest rounded-full flex items-center justify-center mb-6 shadow-inner">
                <Search className="w-10 h-10 text-outline/40" />
              </div>
              <h4 className="text-3xl font-bold font-headline text-primary">No artifacts found</h4>
              <p className="text-outline mt-3 mb-10 max-w-sm font-medium">Our archive doesn't contain entries matching your specific query. Try broadening your discovery parameters.</p>
              <Button onClick={handleReset} variant="default" size="default">
                Clear All Discovery Filters
              </Button>
            </div>
          )}
        </div>
        {meta ? (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-xs text-outline font-semibold">
              Page {meta.page} of {meta.totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={meta.page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                Previous
              </Button>
              <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => setPage((current) => current + 1)}>
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
