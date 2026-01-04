import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useRevalidator } from "@remix-run/react";
import { useState } from "react";
import axios from "axios";
import { PageTransition } from "~/components/page-transition";
import { CreateAlbumDialog } from "~/components/create-album-dialog";
import { PhotoPickerDialog } from "~/components/photo-picker-dialog";
import { AlbumCard } from "~/components/album-card";
import { Album } from "~/types";
import { Button } from "~/components/ui/button";
import { Plus } from "lucide-react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
    const res = await axios.get(`${backendUrl}/albums`);
    return json({ albums: res.data });
  } catch (error) {
    console.error("Failed to fetch albums", error);
    return json({ albums: [] });
  }
};

export default function Index() {
  const { albums } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  return (
    <PageTransition>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">IT Bangmod Photo Club</h1>
            <p className="text-muted-foreground mt-1">
              รวบรวมภาพความทรงจำจากทุกกิจกรรมของชาวไอทีบางมด
            </p>
          </div>
          <CreateAlbumDialog onSuccess={handleRefresh} />
        </div>

        {/* Albums Grid */}
        {albums.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/50">
            <h3 className="text-xl font-medium text-muted-foreground">ยังไม่มีอัลบั้ม</h3>
            <p className="text-sm text-muted-foreground mt-2">
              เริ่มสร้างอัลบั้มแรกของคุณเพื่อเก็บรวมรวมรูปภาพ
            </p>
            <div className="mt-6">
              <CreateAlbumDialog onSuccess={handleRefresh} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {albums.map((album: Album) => (
              <AlbumCard 
                key={album.id}
                album={album} 
                onClick={() => {
                  navigate(`/albums/${album.id}`);
                }} 
              />
            ))}
          </div>
        )}

        {/* Photo Picker Dialog (Controlled) */}
        {selectedAlbumId && (
           <PhotoPickerDialog 
             albumId={selectedAlbumId}
             isOpen={true}
             onClose={() => setSelectedAlbumId(null)}
             onSuccess={() => {
               setSelectedAlbumId(null);
               handleRefresh();
             }}
           />
        )}
        
        {/*
           Issue: PhotoPickerDialog manages its own 'open' state.
           I'll fix it by modifying PhotoPickerDialog to accept control props or 
           just render it always but pass `open={!!selectedAlbumId}` and `onOpenChange={(v) => !v && setSelectedAlbumId(null)}`.
           
           I will rewrite this logic in a simpler way in the next step if strictly needed, 
           but for now I will use a different approach:
           Just render the dialog when selectedAlbumId is set, and let the dialog handle itself?
           No, Shadcn Dialog needs `open` prop if controlled.
           
           I will modify PhotoPickerDialog in next turn or quick-fix the usage here if I can.
           Actually, the `PhotoPickerDialog` I wrote exposes `open` via `Dialog open={open}` state.
           It doesn't accept `open` prop from parent.
           
           Quick fix: Pass a `defaultOpen={true}` if I can, or modify component.
           I'll modify `_index.tsx` to include `PhotoPickerDialog` structure that wraps the trigger properly,
           BUT here I am triggering from a button in the list.
           
           Let's use a wrapper component or modify the Picker to be more flexible.
           I'll stick to the current implementation but realize I need to wrap each AlbumCard OR use a single dialog.
           Using a single dialog is better for performance.
           
           I will look at `PhotoPickerDialog` code again.
           It uses `useState(false)` for open.
           
           I will edit `PhotoPickerDialog` to accept `isOpen` and `onClose` props to make it controllable.
        */}
      </div>
    </PageTransition>
  );
}
