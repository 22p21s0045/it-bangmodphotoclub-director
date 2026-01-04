import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import axios from "axios";
import { PageTransition } from "~/components/page-transition";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Calendar, Check, Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";
import { PhotoPickerDialog } from "~/components/photo-picker-dialog";
import { cn } from "~/lib/utils";
import type { Album, Photo } from "~/types";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const res = await axios.get(`${backendUrl}/albums/${id}`);
    return json({ album: res.data });
  } catch (error) {
    console.error("Failed to fetch album", error);
    throw new Response("Album not found", { status: 404 });
  }
};

export default function AlbumDetailPage() {
  const { album } = useLoaderData<typeof loader>() as { album: Album };
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const photos = album.photos || [];

  const togglePhoto = (photoId: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map(p => p.id));
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedPhotoIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedPhotoIds.length === 0) return;
    
    if (!confirm(`คุณต้องการลบ ${selectedPhotoIds.length} รูปออกจากอัลบั้มนี้?`)) {
      return;
    }

    setDeleting(true);
    try {
      const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
      await axios.delete(`${backendUrl}/albums/${album.id}/photos`, {
        data: { photoIds: selectedPhotoIds }
      });
      setSelectionMode(false);
      setSelectedPhotoIds([]);
      revalidator.revalidate();
    } catch (error) {
      console.error("Failed to delete photos", error);
      alert("ไม่สามารถลบรูปภาพได้");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{album.title}</h1>
              {album.description && (
                <p className="text-muted-foreground mt-1">{album.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" />
                  {photos.length} รูป
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(album.createdAt), "d MMMM yyyy", { locale: th })}
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancelSelection}>
                  <X className="w-4 h-4 mr-1" />
                  ยกเลิก
                </Button>
                <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                  {selectedPhotoIds.length === photos.length ? "ยกเลิกเลือกทั้งหมด" : "เลือกทั้งหมด"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDeleteSelected}
                  disabled={selectedPhotoIds.length === 0 || deleting}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  ลบ ({selectedPhotoIds.length})
                </Button>
              </>
            ) : (
              <>
                {photos.length > 0 && (
                  <Button variant="outline" onClick={() => setSelectionMode(true)}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    เลือกลบ
                  </Button>
                )}
                <Button onClick={() => setShowPhotoPicker(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มรูป
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selection Mode Banner */}
        {selectionMode && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium">
              กำลังเลือกรูปภาพ: คลิกที่รูปเพื่อเลือก/ยกเลิก
            </span>
            <span className="text-sm text-muted-foreground">
              เลือกแล้ว {selectedPhotoIds.length} จาก {photos.length} รูป
            </span>
          </div>
        )}

        {/* Photo Grid - Masonry Style */}
        {photos.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/50">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="text-xl font-medium text-muted-foreground mt-4">ยังไม่มีรูปภาพ</h3>
            <p className="text-sm text-muted-foreground mt-2">
              เพิ่มรูปภาพจากกิจกรรมต่างๆ เข้าอัลบั้มนี้
            </p>
            <Button className="mt-6" onClick={() => setShowPhotoPicker(true)}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรูปภาพ
            </Button>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
            {photos.map((photo: Photo) => {
              const isSelected = selectedPhotoIds.includes(photo.id);
              return (
                <div 
                  key={photo.id} 
                  className={cn(
                    "break-inside-avoid group relative overflow-hidden rounded-lg bg-muted cursor-pointer transition-all",
                    selectionMode && "ring-2 ring-offset-2",
                    selectionMode && isSelected ? "ring-primary" : "ring-transparent"
                  )}
                  onClick={() => selectionMode && togglePhoto(photo.id)}
                >
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.filename}
                    className={cn(
                      "w-full h-auto object-cover transition-all duration-300",
                      selectionMode ? "" : "group-hover:scale-105",
                      selectionMode && isSelected && "opacity-80"
                    )}
                    loading="lazy"
                  />
                  
                  {/* Selection Checkbox */}
                  {selectionMode && (
                    <div className={cn(
                      "absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "bg-white/80 border-gray-400"
                    )}>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  )}

                  {/* Hover overlay (only when not in selection mode) */}
                  {!selectionMode && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="text-white text-xs truncate">{photo.filename}</p>
                        {photo.type && (
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            photo.type === 'EDITED' 
                              ? 'bg-green-500/80 text-white' 
                              : 'bg-orange-500/80 text-white'
                          }`}>
                            {photo.type === 'EDITED' ? 'แต่งแล้ว' : 'RAW'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Photo Picker Dialog */}
        {showPhotoPicker && (
          <PhotoPickerDialog
            albumId={album.id}
            isOpen={true}
            onClose={() => setShowPhotoPicker(false)}
            onSuccess={() => {
              setShowPhotoPicker(false);
              revalidator.revalidate();
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
