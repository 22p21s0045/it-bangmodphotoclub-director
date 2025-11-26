import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, Link } from "@remix-run/react";
import { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { ThemeToggle } from "~/components/theme-toggle";
import { DatePicker } from "~/components/date-picker";
import { CreateEventDialog } from "~/components/create-event-dialog";
import { EditEventDialog } from "~/components/edit-event-dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const search = url.searchParams.get("search") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  
  try {
    const res = await axios.get(`${backendUrl}/events`, {
      params: { search, startDate, endDate }
    });
    return json({ events: res.data, search, startDate, endDate });
  } catch (error) {
    console.error("Failed to fetch events", error);
    return json({ events: [], search, startDate, endDate });
  }
}

export default function Events() {
  const { events, search, startDate, endDate } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">กิจกรรม</h1>
        <div className="flex items-center gap-2">
            <CreateEventDialog />
            <ThemeToggle />
            <Button variant="outline" asChild>
                <Link to="/calendar" className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> ปฏิทิน
                </Link>
            </Button>
        </div>
      </div>

      <Card className="mb-8">
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
                          className="pl-9"
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

      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
            ไม่พบกิจกรรม
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่องาน</TableHead>
                <TableHead>วันที่จัดงาน</TableHead>
                <TableHead>สถานที่</TableHead>
                <TableHead>จำนวนรับ</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event: any) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{event.title}</span>
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
                    {event.joinLimit > 0 ? `${event.joinLimit} คน` : "ไม่จำกัด"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <EditEventDialog event={event} />
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/events/${event.id}`}>ดูรายละเอียด</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
