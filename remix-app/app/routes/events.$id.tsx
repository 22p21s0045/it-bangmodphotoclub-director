import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EditEventDialog } from "~/components/edit-event-dialog";

export async function loader({ params }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  try {
    const res = await axios.get(`${backendUrl}/events/${params.id}`);
    return json({ event: res.data });
  } catch (error) {
    throw new Response("ไม่พบกิจกรรม", { status: 404 });
  }
}

export default function EventDetail() {
  const { event } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto p-6">
      <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
        <Link to="/events" className="inline-flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้ากิจกรรม
        </Link>
      </Button>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="h-64 md:h-96 bg-gray-100 relative">
          {event.coverImage ? (
            <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <CalendarIcon className="w-16 h-16" />
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{event.title}</h1>
              <div className="flex flex-col gap-1 text-muted-foreground mt-2">
                <div className="flex items-center gap-4 flex-wrap">
                  {event.eventDates && event.eventDates.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        วันที่จัดกิจกรรม ({event.eventDates.length} วัน):
                      </span>
                      <div className="flex flex-wrap gap-2 ml-5">
                        {event.eventDates.map((date: string, index: number) => (
                          <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                            {format(new Date(date), "d MMM yyyy", { locale: th })}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </span>
                  )}
                </div>
                {event.submissionDeadline && (
                  <div className="flex items-center gap-1 text-red-500 font-medium">
                    <CalendarIcon className="w-4 h-4" />
                    <span>
                      ส่งรูปได้ถึง: {format(new Date(event.submissionDeadline), "d MMMM yyyy", { locale: th })}
                      {" "}
                      {(() => {
                        const daysLeft = differenceInDays(new Date(event.submissionDeadline), new Date());
                        if (daysLeft < 0) return "(หมดเขตแล้ว)";
                        if (daysLeft === 0) return "(วันนี้วันสุดท้าย)";
                        return `(เหลือเวลาอีก ${daysLeft} วัน)`;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <EditEventDialog event={event} />
              <Button asChild>
                  <Link to={`/events/${event.id}/upload`}>
                      อัปโหลดรูปภาพ
                  </Link>
              </Button>
            </div>
          </div>

          <div className="prose max-w-none text-foreground mb-12">
            <h3 className="text-xl font-semibold mb-2">เกี่ยวกับกิจกรรมนี้</h3>
            <p className="text-muted-foreground">{event.description || "ไม่มีรายละเอียด"}</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6">รูปภาพ ({event.photos?.length || 0})</h3>
            {event.photos && event.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {event.photos.map((photo: any) => (
                        <div key={photo.id} className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img src={photo.thumbnailUrl || photo.url} alt="รูปภาพกิจกรรม" className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-muted-foreground italic">ยังไม่มีรูปภาพ เป็นคนแรกที่อัปโหลด!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
