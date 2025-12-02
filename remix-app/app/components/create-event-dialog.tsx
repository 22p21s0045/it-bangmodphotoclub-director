import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { MultiDatePicker } from "~/components/multi-date-picker";
import { DatePicker } from "~/components/date-picker";
import { LocationAutocomplete } from "~/components/location-autocomplete";

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
    
    fetcher.submit(formData, { method: "post", action: "/api/events/create" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ สร้างกิจกรรม</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">สร้างกิจกรรมใหม่</DialogTitle>
        </DialogHeader>

        <fetcher.Form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">ชื่อกิจกรรม *</Label>
            <Input
              id="title"
              name="title"
              placeholder="เช่น Photo Walk 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">รายละเอียด</Label>
            <textarea
              id="description"
              name="description"
              placeholder="อธิบายเกี่ยวกับกิจกรรม..."
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">สถานที่</Label>
              <LocationAutocomplete
                name="location"
                placeholder="เช่น สวนลุมพินี"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joinLimit">จำนวนที่รับ (คน)</Label>
              <Input
                id="joinLimit"
                name="joinLimit"
                type="number"
                min="0"
                placeholder="0 = ไม่จำกัด"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activityHours">จำนวนชั่วโมงกิจกรรม</Label>
              <Input
                id="activityHours"
                name="activityHours"
                type="number"
                min="0"
                placeholder="0 = ไม่มี"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>วันที่จัดกิจกรรม *</Label>
            <MultiDatePicker
              dates={eventDates}
              onDatesChange={setEventDates}
            />
          </div>

          <div className="space-y-2">
            <Label>กำหนดส่งรูปภาพ (Deadline)</Label>
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
          </div>

          {fetcher.data?.error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {fetcher.data.error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "กำลังสร้าง..." : "สร้างกิจกรรม"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
          </div>
        </fetcher.Form>
      </DialogContent>
    </Dialog>
  );
}
