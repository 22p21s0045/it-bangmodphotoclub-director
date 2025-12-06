import { json, defer, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, Link, useFetcher, Await } from "@remix-run/react";
import { sessionStorage } from "~/session.server";
import { useState, useEffect, Suspense } from "react";
import { EventListSkeleton } from "~/components/skeletons";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { DatePicker } from "~/components/date-picker";
import { CreateEventDialog } from "~/components/create-event-dialog";
import { EditEventDialog } from "~/components/edit-event-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, UserPlus } from "lucide-react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  
  const eventsPromise = axios.get(`${backendUrl}/events`, {
      params: { search, startDate, endDate }
    }).then(res => res.data).catch(error => {
      console.error("Failed to fetch events", error);
      return [];
    });

  return defer({ 
    events: eventsPromise, 
    search, 
    startDate, 
    endDate, 
    user 
  });
}

export default function Events() {
  const { events, search, startDate, endDate, user } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const fetcher = useFetcher();
  
  const [editingEvent, setEditingEvent] = useState<any>(null); // State for the event being edited
  const [searchValue, setSearchValue] = useState(search);
  const [startDateValue, setStartDateValue] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [endDateValue, setEndDateValue] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );

  // Submit form when filters change
  useEffect(() => {
    const formData = new FormData();
    formData.append("search", searchValue);
    if (startDateValue) {
      formData.append("startDate", format(startDateValue, "yyyy-MM-dd"));
    }
    if (endDateValue) {
      formData.append("endDate", format(endDateValue, "yyyy-MM-dd"));
    }
    submit(formData, { method: "get" });
  }, [searchValue, startDateValue, endDateValue, submit]);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-8">
      <div className="container mx-auto p-4 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">กิจกรรม</h1>
            <p className="text-muted-foreground mt-1">จัดการและดูรายการกิจกรรมทั้งหมดของคุณ</p>
          </div>
          <div className="flex items-center gap-2">
              <CreateEventDialog />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 w-full space-y-2">
                      <Label>ค้นหา</Label>
                      <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                              type="text" 
                              value={searchValue}
                              onChange={(e) => setSearchValue(e.target.value)}
                              placeholder="ค้นหากิจกรรม..." 
                              className="pl-9 bg-gray-50/50"
                          />
                      </div>
                  </div>
                  <div className="space-y-2 w-full md:w-auto">
                      <Label>วันที่เริ่มต้น</Label>
                      <DatePicker 
                        date={startDateValue}
                        onDateChange={setStartDateValue}
                        placeholder="เลือกวันที่เริ่มต้น"
                      />
                  </div>
                  <div className="space-y-2 w-full md:w-auto">
                      <Label>วันที่สิ้นสุด</Label>
                      <DatePicker 
                        date={endDateValue}
                        onDateChange={setEndDateValue}
                        placeholder="เลือกวันที่สิ้นสุด"
                      />
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <Suspense fallback={<div className="p-6"><EventListSkeleton /></div>}>
              <Await resolve={events}>
                {(resolvedEvents) => (
                  resolvedEvents.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        ไม่พบกิจกรรม
                    </div>
                  ) : (
                    <div className="rounded-none border-0">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="py-4">ชื่องาน</TableHead>
                            <TableHead className="py-4">วันที่จัดงาน</TableHead>
                            <TableHead className="py-4">สถานที่</TableHead>
                            <TableHead className="py-4">จำนวนที่ต้องการ</TableHead>
                            <TableHead className="py-4">สถานะ</TableHead>
                            <TableHead className="py-4">ผู้รับผิดชอบ</TableHead>
                            <TableHead className="text-right py-4">จัดการ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {resolvedEvents.map((event: any, index: number) => (
                            <TableRow 
                              key={event.id}
                              className="hover:bg-gray-50/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex flex-col py-1">
                                  <span className="text-base">{event.title}</span>
                                  <span className="text-xs text-muted-foreground line-clamp-1">{event.description}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  {event.eventDates && event.eventDates.length > 0 ? (
                                    <>
                                      <span>
                                        {event.eventDates.length === 1
                                          ? format(new Date(event.eventDates[0]), "d MMM yyyy", { locale: th })
                                          : `${event.eventDates.length} วัน`}
                                      </span>
                                      {event.eventDates.length > 1 && (
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(event.eventDates[0]), "d MMM", { locale: th })} - {format(new Date(event.eventDates[event.eventDates.length - 1]), "d MMM yyyy", { locale: th })}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{event.location || "-"}</TableCell>
                              <TableCell>
                                {event.joinLimit > 0 ? (
                                  <Badge variant="secondary" className="font-normal">
                                    {event.joinLimit} คน
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">ไม่จำกัด</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {(() => {
                                  const isFull = event.joinLimit > 0 && event.joins && event.joins.length >= event.joinLimit;
                                  const displayStatus = (event.status === 'UPCOMING' && isFull) ? 'PENDING_RAW' : event.status;
                                  
                                  return (
                                    <Badge variant={
                                      displayStatus === 'COMPLETED' ? 'default' :
                                      displayStatus === 'PENDING_EDIT' ? 'secondary' :
                                      displayStatus === 'PENDING_RAW' ? 'outline' :
                                      'destructive'
                                    } className="capitalize">
                                      {displayStatus === 'COMPLETED' ? 'เสร็จสิ้น' :
                                       displayStatus === 'PENDING_EDIT' ? 'รอแต่งรูป' :
                                       displayStatus === 'PENDING_RAW' ? 'รอไฟล์ RAW' :
                                       'กำลังหาคน'}
                                    </Badge>
                                  );
                                })()}
                              </TableCell>
                              <TableCell>
                                <div className="flex -space-x-3 overflow-hidden p-1">
                                  {event.joins && event.joins.length > 0 ? (
                                    event.joins.map((join: any) => (
                                      <Avatar 
                                        key={join.id} 
                                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white cursor-help"
                                        title={join.user?.name || "User"}
                                      >
                                        <AvatarImage src={join.user?.avatar} />
                                        <AvatarFallback>{join.user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                                      </Avatar>
                                    ))
                                  ) : (
                                    <span className="text-muted-foreground text-xs">-</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                      <Link to={`/events/${event.id}`} className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" /> ดูรายละเอียด
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setEditingEvent(event)} className="cursor-pointer">
                                      <Pencil className="mr-2 h-4 w-4" /> แก้ไข
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {user && (
                                      <DropdownMenuItem 
                                        className="w-full cursor-pointer"
                                        disabled={event.joins?.some((j: any) => j.userId === user.id) || fetcher.state === "submitting"}
                                        onSelect={(e) => {
                                          fetcher.submit(
                                            { eventId: event.id }, 
                                            { method: "post", action: "/api/events/join" }
                                          );
                                        }}
                                      >
                                         <UserPlus className="mr-2 h-4 w-4" />
                                         {event.joins?.some((j: any) => j.userId === user.id) ? "เข้าร่วมแล้ว" : "เข้าร่วม"}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )
                )}
              </Await>
            </Suspense>
          </Card>
        </div>
  
        {/* Controlled Edit Dialog */}
        {editingEvent && (
          <EditEventDialog 
            event={editingEvent} 
            open={!!editingEvent} 
            onOpenChange={(open) => !open && setEditingEvent(null)}
          />
        )}
      </div>
    </div>
  );
}
