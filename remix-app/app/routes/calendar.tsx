import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams, useNavigation } from "@remix-run/react";
import axios from "axios";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { CalendarSkeleton } from "~/components/skeletons";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  
  const start = startOfMonth(date);
  const end = endOfMonth(date);

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  
  try {
    // Fetch events for the whole month range (approx)
    // Ideally backend supports range filtering
    const res = await axios.get(`${backendUrl}/events`, {
      params: { 
        startDate: startOfWeek(start).toISOString(), 
        endDate: endOfWeek(end).toISOString(),
        limit: 100 // Fetch up to 100 events for the calendar view
      }
    });
    // Handle new API response structure { data: Event[], meta: Meta }
    const eventsData = res.data.data || [];
    return json({ events: eventsData, currentDate: date.toISOString() });
  } catch (error) {
    console.error("Calendar loader error:", error);
    return json({ events: [], currentDate: date.toISOString() });
  }
}

export default function Calendar() {
  const { events, currentDate } = useLoaderData<typeof loader>();
  const date = new Date(currentDate);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  
  const isLoading = navigation.state === "loading";

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => {
    const next = addMonths(date, 1);
    setSearchParams({ date: next.toISOString() });
  };

  const prevMonth = () => {
    const prev = subMonths(date, 1);
    setSearchParams({ date: prev.toISOString() });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 h-full">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Link>
        <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground w-48 text-center">
                {format(date, "MMMM yyyy")}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr bg-border gap-px">
            {days.map((day, dayIdx) => {
                const dayEvents = events.filter((event: any) => 
                    event.eventDates && event.eventDates.some((dateStr: string) => isSameDay(new Date(dateStr), day))
                );

                return (
                    <div 
                        key={day.toString()} 
                        className={`min-h-[120px] bg-card p-2 ${
                            !isSameMonth(day, monthStart) ? "bg-muted/50 text-muted-foreground" : ""
                        }`}
                    >
                        <div className={`text-right text-sm mb-1 ${
                            isSameDay(day, new Date()) ? "font-bold text-blue-600" : ""
                        }`}>
                            {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                            {dayEvents.map((event: any) => (
                                <Link 
                                    key={event.id} 
                                    to={`/events/${event.id}`}
                                    className="block text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded truncate hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                                    title={event.title}
                                >
                                    {event.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
