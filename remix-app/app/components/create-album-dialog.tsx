import { useState } from "react";
import { useFetcher } from "@remix-run/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import axios from "axios";

interface CreateAlbumDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateAlbumDialog({ onSuccess, trigger }: CreateAlbumDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      // Direct axios call or useFetcher action
      const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
      await axios.post(`${backendUrl}/albums`, {
        title,
        description,
        isPublic
      });
      
      setOpen(false);
      setTitle("");
      setDescription("");
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Failed to create album:", error);
      alert("Failed to create album");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            สร้างอัลบั้ม
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>สร้างอัลบั้มใหม่</DialogTitle>
            <DialogDescription>
              สร้างอัลบั้มเพื่อรวบรวมรูปภาพจากกิจกรรมต่างๆ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">ชื่ออัลบั้ม</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น กิจกรรมรับน้อง 2024"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">รายละเอียด (ไม่บังคับ)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="คำอธิบายเพิ่มเติม..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="public">อัลบั้มสาธารณะ</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้าง
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
