import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "@remix-run/react";
import { Trash2, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
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

interface DeleteEventDialogProps {
  eventId: string;
  eventTitle: string;
  userId: string;
  userRole: string;
  photoCount?: number;
}

export function DeleteEventDialog({ 
  eventId, 
  eventTitle, 
  userId, 
  userRole,
  photoCount = 0
}: DeleteEventDialogProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const fetcher = useFetcher<{ success: boolean; deleted?: boolean }>();

  // Only show if user is admin
  if (userRole !== "ADMIN") {
    return null;
  }

  const isDeleting = fetcher.state !== "idle";

  // Navigate to events list after successful deletion
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.deleted) {
      setOpen(false);
      toast.success("ลบกิจกรรมเรียบร้อยแล้ว");
      navigate("/events");
    }
  }, [fetcher.state, fetcher.data, navigate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          ลบกิจกรรม
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle>ยืนยันการลบกิจกรรม</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-2">
            <p>
              คุณกำลังจะลบกิจกรรม <span className="font-semibold text-foreground">"{eventTitle}"</span>
            </p>
            {photoCount > 0 && (
              <p className="text-destructive">
                ⚠️ รูปภาพทั้งหมด {photoCount} รูปในกิจกรรมนี้จะถูกลบด้วย
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            ยกเลิก
          </Button>
          <fetcher.Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="userRole" value={userRole} />
            <Button 
              type="submit"
              variant="destructive"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  กำลังลบ...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  ยืนยันการลบ
                </>
              )}
            </Button>
          </fetcher.Form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
