import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher } from "@remix-run/react";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, ArrowLeft, UserMinus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EditEventDialog } from "~/components/edit-event-dialog";
import { AssignUserDialog } from "~/components/assign-user-dialog";
import { LeaveEventDialog } from "~/components/leave-event-dialog";
import { RemoveUserDialog } from "~/components/remove-user-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { sessionStorage } from "~/session.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  try {
    const res = await axios.get(`${backendUrl}/events/${params.id}`);
    return json({ event: res.data, user });
  } catch (error) {
    throw new Response("ไม่พบกิจกรรม", { status: 404 });
  }
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId");
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  if (intent === "leave") {
    await axios.delete(`${backendUrl}/events/${params.id}/join/${userId}`);
  }

  return json({ success: true });
}

export default function EventDetail() {
  const { event, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const isUserJoined = user && event.joins?.some((j: any) => j.userId === user.id);

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
                        {event.eventDates.map((date: string, index: number) => {
                          const eventDate = new Date(date);
                          const today = new Date();
                          const daysUntil = differenceInDays(eventDate, today);
                          
                          return (
                            <div key={index} className="flex flex-col">
                              <span className="text-sm">
                                {format(eventDate, "d MMMM yyyy", { locale: th })}
                              </span>
                              {daysUntil >= 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ({daysUntil === 0 ? "วันนี้" : `อีก ${daysUntil} วัน`})
                                </span>
                              )}
                            </div>
                          );
                        })}
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
              </div>
            </div>
            <div className="flex gap-2">
              {isUserJoined && (
                <LeaveEventDialog 
                  eventId={event.id} 
                  userId={user.id} 
                  isUserJoined={isUserJoined} 
                />
              )}
              <EditEventDialog event={event} />
            </div>
          </div>

          <div className="prose max-w-none text-foreground mb-12">
            <h3 className="text-xl font-semibold mb-2">เกี่ยวกับกิจกรรมนี้</h3>
            <p className="text-muted-foreground">{event.description || "ไม่มีรายละเอียด"}</p>
          </div>

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">ผู้รับผิดชอบ {event.joins?.length || 0} คน</h3>
                {user?.role === "ADMIN" && (
                    <AssignUserDialog 
                        eventId={event.id} 
                        joinedUserIds={event.joins?.map((j: any) => j.userId) || []}
                        onAssign={() => {
                            // Remix will automatically revalidate the loader
                        }}
                    />
                )}
            </div>
            
            {event.joins && event.joins.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {event.joins.map((join: any) => (
                        <div key={join.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <Avatar className="h-10 w-10">
                                  <AvatarImage src={join.user.avatar} />
                                  <AvatarFallback>{join.user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col overflow-hidden">
                                  <span className="font-medium truncate">{join.user.name || "User"}</span>
                                  <span className="text-xs text-muted-foreground truncate">{join.user.email}</span>
                              </div>
                            </div>
                            {user?.role === "ADMIN" && (
                              <RemoveUserDialog 
                                eventId={event.id}
                                userId={join.userId}
                                userName={join.user.name || "User"}
                              />
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-muted-foreground italic">ยังไม่มีผู้เข้าร่วม</div>
            )}
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
