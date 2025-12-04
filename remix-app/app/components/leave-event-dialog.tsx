import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { UserMinus } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";

interface LeaveEventDialogProps {
  eventId: string;
  userId: string;
  isUserJoined: boolean;
}

export function LeaveEventDialog({ eventId, userId, isUserJoined }: LeaveEventDialogProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  // Close dialog on successful submission
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  if (!isUserJoined) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          ถอนตัว
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ยืนยันการถอนตัว</DialogTitle>
          <DialogDescription>
            คุณแน่ใจหรือไม่ที่จะถอนตัวออกจากกิจกรรมนี้? การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="leave" />
            <input type="hidden" name="userId" value={userId} />
            <Button 
              type="submit" 
              variant="destructive"
              disabled={fetcher.state !== "idle"}
            >
              {fetcher.state !== "idle" ? "กำลังดำเนินการ..." : "ยืนยันการถอนตัว"}
            </Button>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
