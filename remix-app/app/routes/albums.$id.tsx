import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, useNavigate } from "@remix-run/react";
import axios from "axios";
import { PageTransition } from "~/components/page-transition";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Calendar, Image as ImageIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";
import { PhotoPickerDialog } from "~/components/photo-picker-dialog";
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
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);

  const photos = album.photos || [];

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
          <Button onClick={() => setShowPhotoPicker(true)}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มรูป
          </Button>
        </div>

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
            {photos.map((photo: Photo) => (
              <div 
                key={photo.id} 
                className="break-inside-avoid group relative overflow-hidden rounded-lg bg-muted cursor-pointer"
              >
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.filename}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                {/* Hover overlay */}
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
              </div>
            ))}
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
              // Reload the page to get updated photos
              navigate(`.`, { replace: true });
            }}
          />
        )}
      </div>
    </PageTransition>
  );
}
