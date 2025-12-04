import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { X } from "lucide-react";
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

interface RemoveUserDialogProps {
  eventId: string;
  userId: string;
  userName: string;
}

export function RemoveUserDialog({ eventId, userId, userName }: RemoveUserDialogProps) {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher();

  // Close dialog on successful submission
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>ยืนยันการลบผู้รับผิดชอบ</DialogTitle>
          <DialogDescription>
            คุณแน่ใจหรือไม่ที่จะลบ <strong>{userName}</strong> ออกจากกิจกรรมนี้?
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
              {fetcher.state !== "idle" ? "กำลังดำเนินการ..." : "ยืนยันการลบ"}
            </Button>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
