import { Album } from "~/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Calendar, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface AlbumCardProps {
  album: Album;
  onClick?: () => void;
}

export function AlbumCard({ album, onClick }: AlbumCardProps) {
  // Use first photo as cover if available
  const coverUrl = album.photos && album.photos.length > 0 
    ? (album.photos[0].thumbnailUrl || album.photos[0].url) 
    : null;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group border-border/50 hover:border-primary/50"
      onClick={onClick}
    >
      <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={album.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center">
            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
            <span className="text-xs">ไม่มีรูปภาพ</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
           {/* Overlay content on hover */}
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">{album.title}</h3>
        {album.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[2.5em]">
            {album.description}
          </p>
        )}
        {!album.description && <div className="min-h-[2.5em]" />}
        
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{format(new Date(album.createdAt), "d MMM yyyy", { locale: th })}</span>
        </div>
      </CardContent>
    </Card>
  );
}
