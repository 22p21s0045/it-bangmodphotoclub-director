import { useState } from "react";
import { Trash2, AlertTriangle, ImageIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import type { Photo } from "~/types";

interface DeletePhotoDialogProps {
  photo: Photo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function DeletePhotoDialog({ 
  photo,
  open,
  onOpenChange,
  onConfirm
}: DeletePhotoDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting photo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!photo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle>ยืนยันการลบรูปภาพ</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-4">
            {/* Photo preview */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                <img 
                  src={photo.thumbnailUrl || photo.url} 
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-center">
              คุณกำลังจะลบรูปภาพ <span className="font-semibold text-foreground">"{photo.filename}"</span>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            ยกเลิก
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
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
                ลบรูปภาพ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
