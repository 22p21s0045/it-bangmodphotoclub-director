import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams, useNavigation } from "@remix-run/react";
import type { Event } from "~/types";
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
  subMonths,
  isAfter,
  isBefore,
  addDays
} from "date-fns";
import { th } from "date-fns/locale";
import { ChevronLeft, ChevronRight, ArrowLeft, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react";
import { CalendarSkeleton } from "~/components/skeletons";
import { PageTransition } from "~/components/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

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

  // Get upcoming events (today and future)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = events
    .filter((event: Event) => {
      if (!event.eventDates || event.eventDates.length === 0) return false;
      // Check if any event date is today or in the future
      return event.eventDates.some((dateStr) => {
        const eventDate = new Date(dateStr as string);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      });
    })
    .map((event: Event) => {
      // Get the nearest upcoming date for this event
      const futureDates = event.eventDates!
        .map(d => new Date(d as string))
        .filter(d => {
          const compareDate = new Date(d);
          compareDate.setHours(0, 0, 0, 0);
          return compareDate >= today;
        })
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());
      
      return {
        ...event,
        nextDate: futureDates[0] || new Date(event.eventDates![0] as string)
      };
    })
    .sort((a: Event & { nextDate: Date }, b: Event & { nextDate: Date }) => a.nextDate.getTime() - b.nextDate.getTime())
    .slice(0, 10); // Show up to 10 upcoming events

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 h-full">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <PageTransition className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/events" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Link>
        <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-full transition-colors">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-foreground w-48 text-center">
                {format(date, "MMMM yyyy")}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-full transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
        <div className="w-24"></div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar - Takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
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
                    const dayEvents = events.filter((event: Event) => 
                        event.eventDates && event.eventDates.some((dateStr) => isSameDay(new Date(dateStr as string), day))
                    );

                    return (
                        <div 
                            key={day.toString()} 
                            className={`min-h-[100px] bg-card p-2 ${
                                !isSameMonth(day, monthStart) ? "bg-muted/50 text-muted-foreground" : ""
                            }`}
                        >
                            <div className={`text-right text-sm mb-1 ${
                                isSameDay(day, new Date()) ? "font-bold text-blue-600" : ""
                            }`}>
                                {format(day, "d")}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event: Event) => (
                                    <Link 
                                        key={event.id} 
                                        to={`/events/${event.id}`}
                                        className="block text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded truncate hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                                        title={event.title}
                                    >
                                        {event.title}
                                    </Link>
                                ))}
                                {dayEvents.length > 3 && (
                                  <span className="text-xs text-muted-foreground px-2">
                                    +{dayEvents.length - 3} more
                                  </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* Upcoming Events Sidebar - Takes 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <Card className="h-fit sticky top-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                กิจกรรมที่กำลังจะมาถึง
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event: Event & { nextDate: Date }) => {
                  const daysUntil = Math.ceil((event.nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isToday = daysUntil === 0;
                  const isTomorrow = daysUntil === 1;
                  
                  return (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {event.title}
                        </h3>
                        {isToday ? (
                          <Badge className="bg-green-500 text-white text-xs shrink-0">วันนี้</Badge>
                        ) : isTomorrow ? (
                          <Badge className="bg-blue-500 text-white text-xs shrink-0">พรุ่งนี้</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs shrink-0">
                            อีก {daysUntil} วัน
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{format(event.nextDate, "d MMMM yyyy", { locale: th })}</span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
