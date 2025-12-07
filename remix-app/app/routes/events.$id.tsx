import { json, defer, redirect, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useFetcher, Await, useNavigate, useRevalidator } from "@remix-run/react";
import type { JoinEvent, Photo } from "~/types";
import { Suspense, useState } from "react";
import { EventDetailSkeleton } from "~/components/skeletons";
import axios from "axios";
import { format, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import { Calendar as CalendarIcon, MapPin, ArrowLeft, Users, Clock, Image as ImageIcon, FileText, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EditEventDialog } from "~/components/edit-event-dialog";
import { AssignUserDialog } from "~/components/assign-user-dialog";
import { LeaveEventDialog } from "~/components/leave-event-dialog";
import { RemoveUserDialog } from "~/components/remove-user-dialog";
import { UploadRawDialog } from "~/components/upload-raw-dialog";
import { PhotoPreviewDialog } from "~/components/photo-preview-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { EventStatusStepper } from "~/components/event-status-stepper";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { sessionStorage } from "~/session.server";
import { PageTransition } from "~/components/page-transition";
import { DeleteEventDialog } from "~/components/delete-event-dialog";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  const eventPromise = axios.get(`${backendUrl}/events/${params.id}`)
    .then(res => res.data)
    .catch(error => {
      throw new Response("ไม่พบกิจกรรม", { status: 404 });
    });

  return defer({ event: eventPromise, user });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId") as string;
  const userRole = formData.get("userRole") as string;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  if (intent === "leave") {
    await axios.delete(`${backendUrl}/events/${params.id}/join/${userId}`);
    return json({ success: true });
  }

  if (intent === "delete") {
    await axios.delete(`${backendUrl}/events/${params.id}`, {
      data: { userId, role: userRole }
    });
    return redirect("/events?deleted=true");
  }

  return json({ success: true });
}

export default function EventDetail() {
  const { event, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <PageTransition className="min-h-screen bg-muted/30">
      {/* Modern Header with Stepper */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4">
          {/* Back Button Row */}
          <div className="py-3 flex items-center">
            <Link 
              to="/events" 
              className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              <span>กลับไปหน้ากิจกรรม</span>
            </Link>
          </div>
          
          {/* Status Stepper */}
          <Suspense fallback={<div className="h-24 animate-pulse bg-muted/20 rounded-lg mb-4" />}>
            <Await resolve={event}>
              {(resolvedEvent) => (
                <div className="pb-5 pt-1">
                  <EventStatusStepper currentStatus={resolvedEvent.status} />
                </div>
              )}
            </Await>
          </Suspense>
        </div>
      </div>

      <Suspense fallback={<EventDetailSkeleton />}>
        <Await resolve={event}>
          {(resolvedEvent) => {
            const isUserJoined = user && resolvedEvent.joins?.some((j: JoinEvent) => j.userId === user.id);
            const participantCount = resolvedEvent.joins?.length || 0;
            const isFull = resolvedEvent.joinLimit > 0 && participantCount >= resolvedEvent.joinLimit;
            
            return (
              <div className="container mx-auto px-4 py-6">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content - Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Title & Actions Card */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                              {resolvedEvent.title}
                            </h1>
                            <div className="flex flex-wrap gap-2">
                              {resolvedEvent.location && (
                                <Badge variant="secondary" className="text-sm font-normal">
                                  <MapPin className="w-3.5 h-3.5 mr-1.5" />
                                  {resolvedEvent.location}
                                </Badge>
                              )}
                              {resolvedEvent.activityHours > 0 && (
                                <Badge variant="secondary" className="text-sm font-normal">
                                  <Clock className="w-3.5 h-3.5 mr-1.5" />
                                  {resolvedEvent.activityHours} ชั่วโมงกิจกรรม
                                </Badge>
                              )}
                              <Badge variant={isFull ? "default" : "outline"} className="text-sm font-normal">
                                <Users className="w-3.5 h-3.5 mr-1.5" />
                                {participantCount}/{resolvedEvent.joinLimit > 0 ? resolvedEvent.joinLimit : "∞"} คน
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0 flex-wrap">
                            {isUserJoined && (
                              <LeaveEventDialog 
                                eventId={resolvedEvent.id} 
                                userId={user.id} 
                                isUserJoined={isUserJoined}
                              />
                            )}
                            <EditEventDialog event={resolvedEvent} />
                            <DeleteEventDialog 
                              eventId={resolvedEvent.id}
                              eventTitle={resolvedEvent.title}
                              userId={user?.id || ''}
                              userRole={user?.role || 'USER'}
                              photoCount={resolvedEvent.photos?.length || 0}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Description Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          เกี่ยวกับกิจกรรมนี้
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed">
                          {resolvedEvent.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Participants Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            ผู้รับผิดชอบ ({participantCount} คน)
                          </CardTitle>
                          {user?.role === "ADMIN" && (
                            <AssignUserDialog 
                              eventId={resolvedEvent.id} 
                              joinedUserIds={resolvedEvent.joins?.map((j: JoinEvent) => j.userId) || []}
                              onAssign={() => {}}
                            />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {resolvedEvent.joins && resolvedEvent.joins.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {resolvedEvent.joins.map((join: JoinEvent) => (
                              <div key={join.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 border">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={join.user?.avatar ?? undefined} />
                                    <AvatarFallback>{join.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col overflow-hidden">
                                    <span className="font-medium truncate">{join.user?.name || "User"}</span>
                                    <span className="text-xs text-muted-foreground truncate">{join.user?.email}</span>
                                  </div>
                                </div>
                                {user?.role === "ADMIN" && (
                                  <RemoveUserDialog 
                                    eventId={resolvedEvent.id}
                                    userId={join.userId}
                                    userName={join.user?.name || "User"}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>ยังไม่มีผู้เข้าร่วม</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar - Right Column */}
                  <div className="space-y-6">
                    {/* Event Dates Card */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CalendarIcon className="w-5 h-5 text-primary" />
                          วันที่จัดงาน
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resolvedEvent.eventDates && resolvedEvent.eventDates.length > 0 ? (
                          <div className="space-y-2">
                            {resolvedEvent.eventDates.map((date: string, index: number) => {
                              const eventDate = new Date(date);
                              const today = new Date();
                              const daysUntil = differenceInDays(eventDate, today);
                              const isPast = daysUntil < 0;
                              
                              return (
                                <div 
                                  key={index} 
                                  className={`p-3 rounded-lg border ${
                                    isPast 
                                      ? 'bg-muted/30 opacity-60' 
                                      : daysUntil === 0 
                                        ? 'bg-primary/10 border-primary/30' 
                                        : 'bg-muted/50'
                                  }`}
                                >
                                  <div className="font-semibold text-foreground">
                                    {format(eventDate, "d MMMM yyyy", { locale: th })}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(eventDate, "EEEE", { locale: th })}
                                  </div>
                                  {!isPast && (
                                    <Badge 
                                      variant={daysUntil === 0 ? "default" : "outline"} 
                                      className="mt-2 text-xs"
                                    >
                                      {daysUntil === 0 ? "วันนี้!" : `อีก ${daysUntil} วัน`}
                                    </Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">ยังไม่ได้กำหนดวัน</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Full Width Photos Section */}
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        รูปภาพ ({resolvedEvent.photos?.length || 0})
                      </CardTitle>
                      <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        อัปโหลดไฟล์ RAW
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {resolvedEvent.photos && resolvedEvent.photos.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-0.5">
                        {resolvedEvent.photos.map((photo: Photo) => (
                          <div 
                            key={photo.id} 
                            className="relative aspect-square overflow-hidden group cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                          >
                            <img 
                              src={photo.thumbnailUrl || photo.url} 
                              alt={photo.filename} 
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>ยังไม่มีรูปภาพในกิจกรรมนี้</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {/* Upload Dialog */}
                <UploadRawDialog
                  eventId={resolvedEvent.id}
                  userId={user?.id || ''}
                  open={uploadDialogOpen}
                  onOpenChange={setUploadDialogOpen}
                  onSuccess={() => revalidator.revalidate()}
                />
                {/* Photo Preview Dialog */}
                <PhotoPreviewDialog
                  photo={selectedPhoto}
                  photos={resolvedEvent.photos || []}
                  open={!!selectedPhoto}
                  onOpenChange={(open) => !open && setSelectedPhoto(null)}
                  onPhotoChange={setSelectedPhoto}
                />
              </div>
            );
          }}
        </Await>
      </Suspense>
    </PageTransition>
  );
}
