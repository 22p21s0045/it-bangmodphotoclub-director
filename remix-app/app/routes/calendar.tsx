import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useSearchParams } from "@remix-run/react";
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
        endDate: endOfWeek(end).toISOString() 
      }
    });
    return json({ events: res.data, currentDate: date.toISOString() });
  } catch (error) {
    return json({ events: [], currentDate: date.toISOString() });
  }
}

export default function Calendar() {
  const { events, currentDate } = useLoaderData<typeof loader>();
  const date = new Date(currentDate);
  const [searchParams, setSearchParams] = useSearchParams();

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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Link to="/events" className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
        </Link>
        <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 w-48 text-center">
                {format(date, "MMMM yyyy")}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
        <div className="w-24"></div> {/* Spacer for centering */}
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-fr bg-gray-200 gap-px">
            {days.map((day, dayIdx) => {
                const dayEvents = events.filter((event: any) => 
                    isSameDay(new Date(event.startDate), day)
                );

                return (
                    <div 
                        key={day.toString()} 
                        className={`min-h-[120px] bg-white p-2 ${
                            !isSameMonth(day, monthStart) ? "bg-gray-50 text-gray-400" : ""
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
                                    className="block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded truncate hover:bg-blue-100 transition"
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
