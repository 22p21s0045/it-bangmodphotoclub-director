import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import type { Event } from "~/types";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Clock, FileText, Info, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { MultiDatePicker } from "~/components/multi-date-picker";
import { DatePicker } from "~/components/date-picker";
import { LocationAutocomplete } from "~/components/location-autocomplete";
import { Card, CardContent } from "~/components/ui/card";

type ActionData = {
  success?: boolean;
  error?: string;
};

interface EditEventDialogProps {
  event: Event;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function EditEventDialog({ event, open: controlledOpen, onOpenChange: controlledOnOpenChange, trigger }: EditEventDialogProps) {
  const fetcher = useFetcher<ActionData>();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setUncontrolledOpen;
  
  const [eventDates, setEventDates] = useState<Date[]>(
    event.eventDates ? event.eventDates.map((d) => new Date(d as string)) : []
  );
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>(
    event.submissionDeadline ? new Date(event.submissionDeadline) : undefined
  );

  const isSubmitting = fetcher.state === "submitting";

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setEventDates(event.eventDates ? event.eventDates.map((d) => new Date(d as string)) : []);
      setSubmissionDeadline(event.submissionDeadline ? new Date(event.submissionDeadline) : undefined);
    }
  }, [open, event]);

  // Close dialog on successful submission
  useEffect(() => {
    if (fetcher.data?.success) {
      setOpen(false);
    }
  }, [fetcher.data, setOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add event dates as JSON array
    if (eventDates.length > 0) {
      const dateStrings = eventDates.map(date => date.toISOString());
      formData.set("eventDates", JSON.stringify(dateStrings));
    }

    // Default values for joinLimit and activityHours
    if (!formData.get("joinLimit")) {
      formData.set("joinLimit", "0");
    }
    if (!formData.get("activityHours")) {
      formData.set("activityHours", "0");
    }
    
    fetcher.submit(formData, { method: "post", action: "/api/events/update" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button className="bg-black text-white hover:bg-black/80" size="sm">
              <Pencil className="w-4 h-4 mr-1" /> แก้ไข
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-muted/50">
          <DialogTitle className="text-2xl font-bold text-foreground">แก้ไขกิจกรรม</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            แก้ไขข้อมูลกิจกรรมด้านล่าง
          </DialogDescription>
        </DialogHeader>

        <fetcher.Form onSubmit={handleSubmit} className="p-6">
          <input type="hidden" name="id" value={event.id} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <Info className="h-4 w-4" />
                <span>ข้อมูลพื้นฐาน</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  ชื่อกิจกรรม <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={event.title}
                  placeholder="เช่น Photo Walk 2024"
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  รายละเอียด
                </Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={event.description ?? ""}
                  placeholder="อธิบายเกี่ยวกับกิจกรรม..."
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    สถานที่
                  </Label>
                  <LocationAutocomplete
                    name="location"
                    value={event.location ?? ""}
                    placeholder="เช่น สวนลุมพินี"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joinLimit" className="text-sm font-medium flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    จำนวนที่รับ
                  </Label>
                  <Input
                    id="joinLimit"
                    name="joinLimit"
                    type="number"
                    min="0"
                    defaultValue={event.joinLimit}
                    placeholder="0 = ไม่จำกัด"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="activityHours" className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    ชั่วโมงกิจกรรม
                  </Label>
                  <Input
                    id="activityHours"
                    name="activityHours"
                    type="number"
                    min="0"
                    defaultValue={event.activityHours}
                    placeholder="0 = ไม่มี"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    สถานะ
                  </Label>
                  <Select name="status" defaultValue={event.status || "UPCOMING"}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="เลือกสถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPCOMING">เปิดรับ</SelectItem>
                      <SelectItem value="PENDING_RAW">รอไฟล์ RAW</SelectItem>
                      <SelectItem value="PENDING_EDIT">รอแต่งรูป</SelectItem>
                      <SelectItem value="COMPLETED">เสร็จสิ้น</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Right Column - Dates */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                <CalendarDays className="h-4 w-4" />
                <span>กำหนดการ</span>
              </div>

              <Card className="border-dashed">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      วันที่จัดกิจกรรม <span className="text-red-500">*</span>
                    </Label>
                    <MultiDatePicker
                      dates={eventDates}
                      onDatesChange={setEventDates}
                    />
                    {eventDates.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        เลือก {eventDates.length} วัน
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardContent className="pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      กำหนดส่งรูปภาพ (Deadline)
                    </Label>
                    <DatePicker
                      date={submissionDeadline}
                      onDateChange={setSubmissionDeadline}
                      placeholder="เลือกวันกำหนดส่ง"
                      disabled={eventDates.length > 0 ? { before: eventDates[0] } : undefined}
                    />
                    <input
                      type="hidden"
                      name="submissionDeadline"
                      value={submissionDeadline ? format(submissionDeadline, "yyyy-MM-dd") : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      วันสุดท้ายที่สมาชิกต้องส่งรูปภาพ
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {fetcher.data?.error && (
            <div className="mt-6 bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {fetcher.data.error}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-6"
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting} className="px-8">
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
