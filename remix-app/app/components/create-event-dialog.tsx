import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { format } from "date-fns";
import { CalendarDays, MapPin, Users, Clock, FileText, Info } from "lucide-react";
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
import { MultiDatePicker } from "~/components/multi-date-picker";
import { DatePicker } from "~/components/date-picker";
import { LocationAutocomplete } from "~/components/location-autocomplete";
import { Card, CardContent } from "~/components/ui/card";

type ActionData = {
  success?: boolean;
  error?: string;
};

export function CreateEventDialog() {
  const fetcher = useFetcher<ActionData>();
  const [open, setOpen] = useState(false);
  const [eventDates, setEventDates] = useState<Date[]>([]);
  const [submissionDeadline, setSubmissionDeadline] = useState<Date | undefined>();

  const isSubmitting = fetcher.state === "submitting";

  // Close dialog on successful submission
  useEffect(() => {
    if (fetcher.data?.success) {
      setOpen(false);
      // Reset form
      setEventDates([]);
      setSubmissionDeadline(undefined);
    }
  }, [fetcher.data]);

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
    
    fetcher.submit(formData, { method: "post", action: "/api/events/create" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ สร้างกิจกรรม</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gray-50/50">
          <DialogTitle className="text-2xl font-bold text-gray-900">สร้างกิจกรรมใหม่</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            กรอกข้อมูลกิจกรรมด้านล่างเพื่อสร้างกิจกรรมใหม่
          </DialogDescription>
        </DialogHeader>

        <fetcher.Form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
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
                    placeholder="0 = ไม่จำกัด"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activityHours" className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  จำนวนชั่วโมงกิจกรรม
                </Label>
                <Input
                  id="activityHours"
                  name="activityHours"
                  type="number"
                  min="0"
                  placeholder="0 = ไม่มี"
                  className="h-11 max-w-[200px]"
                />
              </div>
            </div>

            {/* Right Column - Dates */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
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
              {isSubmitting ? "กำลังสร้าง..." : "สร้างกิจกรรม"}
            </Button>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
