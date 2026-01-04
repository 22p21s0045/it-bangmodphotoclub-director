import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Check, Image as ImageIcon, Loader2, Search } from "lucide-react";
import axios from "axios";
import { cn } from "~/lib/utils";
import type { Event, Photo } from "~/types";

interface PhotoPickerDialogProps {
  albumId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function PhotoPickerDialog({ albumId, trigger, onSuccess, isOpen, onClose }: PhotoPickerDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  
  const setOpen = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
    if (!newOpen && onClose) {
      onClose();
    }
  };

  const [step, setStep] = useState<"select-event" | "select-photos">("select-event");
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);

  // Fetch events when dialog opens
  useEffect(() => {
    if (open && events.length === 0) {
      fetchEvents();
    }
  }, [open]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
      const res = await axios.get(`${backendUrl}/events?limit=20`);
      setEvents(res.data.data);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchPhotos = async (eventId: string) => {
    setLoadingPhotos(true);
    try {
      const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
      const res = await axios.get(`${backendUrl}/events/${eventId}`);
      setPhotos(res.data.photos || []);
      setStep("select-photos");
    } catch (error) {
      console.error("Failed to fetch photos", error);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleEventSelect = (value: string) => {
    setSelectedEventId(value);
    fetchPhotos(value);
  };

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const toggleAll = () => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map(p => p.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedPhotoIds.length === 0) return;
    setSubmitting(true);
    try {
      const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
      await axios.patch(`${backendUrl}/albums/${albumId}/photos`, {
        photoIds: selectedPhotoIds
      });
      setOpen(false);
      if (onSuccess) onSuccess();
      // Reset state
      setStep("select-event");
      setSelectedPhotoIds([]);
      setSelectedEventId("");
    } catch (error) {
      console.error("Failed to add photos", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">เพิ่มรูปภาพ</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>เลือกรูปภาพเข้าอัลบั้ม</DialogTitle>
          <DialogDescription>
            {step === "select-event" 
              ? "เลือกกิจกรรมเพื่อดึงรูปภาพ" 
              : `เลือกรูปภาพจากกิจกรรม (${photos.length} รูป)`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-6">
          {step === "select-event" && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>ค้นหากิจกรรม</Label>
                <Select onValueChange={handleEventSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกิจกรรม..." />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingEvents ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> กำลังโหลด...
                      </div>
                    ) : (
                      events.map(event => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === "select-photos" && (
            <div className="h-full flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => setStep("select-event")}>
                  &larr; กลับไปเลือกกิจกรรม
                </Button>
                <Button variant="secondary" size="sm" onClick={toggleAll}>
                  {selectedPhotoIds.length === photos.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                </Button>
              </div>
              
              <ScrollArea className="flex-1 border rounded-md p-4">
                 {loadingPhotos ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                 ) : photos.length === 0 ? (
                    <div className="text-center p-12 text-muted-foreground">
                      ไม่มีรูปภาพในกิจกรรมนี้
                    </div>
                 ) : (
                   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {photos.map(photo => {
                       const isSelected = selectedPhotoIds.includes(photo.id);
                       return (
                         <div 
                           key={photo.id} 
                           className={cn(
                             "relative aspect-square cursor-pointer group rounded-md overflow-hidden border-2 transition-all",
                             isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "border-transparent hover:border-muted-foreground/50"
                           )}
                           onClick={() => togglePhoto(photo.id)}
                         >
                           <img 
                             src={photo.thumbnailUrl || photo.url} 
                             alt={photo.filename}
                             className="w-full h-full object-cover transition-transform group-hover:scale-105"
                           />
                           {isSelected && (
                             <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-md">
                               <Check className="w-3 h-3" />
                             </div>
                           )}
                           <div className={cn(
                             "absolute inset-0 bg-black/20 transition-opacity",
                             isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                           )} />
                         </div>
                       );
                     })}
                   </div>
                 )}
              </ScrollArea>
              
              <div className="text-sm text-muted-foreground text-right">
                เลือกแล้ว {selectedPhotoIds.length} รูป
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button 
            disabled={submitting || selectedPhotoIds.length === 0 || step === "select-event"} 
            onClick={handleSubmit}
          >
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            นำเข้า {selectedPhotoIds.length > 0 ? `(${selectedPhotoIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
