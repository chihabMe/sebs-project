import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getEvents } from '../api/events';
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

export default function BrowseEventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Local state for filters
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All Events');
  const [date, setDate] = useState<Date | undefined>(
    searchParams.get('date') ? new Date(searchParams.get('date')!) : undefined
  );

  // Active filters for the query (only updated on "Search" click or category change)
  const [activeFilters, setActiveFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || 'All Events',
    date: searchParams.get('date') || '',
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', activeFilters],
    queryFn: () => getEvents(activeFilters),
  });

  const categories = ['All Events', 'Music', 'Tech', 'Art', 'Food', 'Social'];

  const handleSearch = () => {
    const filters = {
      search: searchInput,
      category,
      date: date ? format(date, 'yyyy-MM-dd') : '',
    };
    setActiveFilters(filters);
    
    // Update URL params
    const params: Record<string, string> = {};
    if (filters.search) params.search = filters.search;
    if (filters.category !== 'All Events') params.category = filters.category;
    if (filters.date) params.date = filters.date;
    setSearchParams(params);
  };

  const handleReset = () => {
    setSearchInput('');
    setCategory('All Events');
    setDate(undefined);
    const resetFilters = { search: '', category: 'All Events', date: '' };
    setActiveFilters(resetFilters);
    setSearchParams({});
  };

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
            <p className="text-outline font-medium mt-1">Explore curated experiences matching your craft.</p>
          </div>
          <div className="bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
            <p className="text-primary text-sm font-bold">
              {isLoading ? 'Scanning Archive...' : `Showing ${events?.length || 0} events`}
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
          ) : events && events.length > 0 ? (
            events.map((event: any) => (
              <div key={event.id} className="group relative bg-surface-container-lowest rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(62,0,0,0.04)] hover:shadow-[0_24px_48px_rgba(62,0,0,0.08)] transition-all duration-500 border border-transparent hover:border-primary/5">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    src={formatImageUrl(event.image)} 
                    alt={event.title}
                  />
                  <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur-md shadow-lg px-4 py-1.5 rounded-full border border-primary/10">
                    <span className="text-primary font-black text-sm">${event.price}</span>
                  </div>
                  {event.isApproved === false && (
                    <div className="absolute top-4 left-4 bg-error text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
                      Pending Approval
                    </div>
                  )}
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
                      Get Tickets <Search className="ml-2 h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
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
      </main>
    </div>
  );
}
