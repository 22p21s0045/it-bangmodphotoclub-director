import { useState } from "react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { Badge } from "~/components/ui/badge";
import { 
  Camera, 
  Aperture, 
  Timer, 
  Gauge, 
  Focus, 
  Calendar,
  FileImage,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "~/lib/utils";

interface PhotoMetadata {
  fileType?: string;
  mimeType?: string;
  imageWidth?: number;
  imageHeight?: number;
  make?: string;
  model?: string;
  iso?: number;
  exposureTime?: string | number;
  fNumber?: number;
  focalLength?: string | number;
  dateTimeOriginal?: string;
  lens?: string;
}

interface PhotoPreviewDialogProps {
  photo: any;
  photos: any[]; // All photos for navigation
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoChange: (photo: any) => void;
}

export function PhotoPreviewDialog({ 
  photo, 
  photos, 
  open, 
  onOpenChange,
  onPhotoChange 
}: PhotoPreviewDialogProps) {
  const [showInfo, setShowInfo] = useState(false);
  
  if (!photo) return null;

  const metadata = (photo.metadata || {}) as PhotoMetadata;
  const currentIndex = photos.findIndex((p: any) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      onPhotoChange(photos[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      onPhotoChange(photos[currentIndex + 1]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onOpenChange(false);
    if (e.key === "i") setShowInfo(!showInfo);
  };

  // Format exposure time
  const formatExposure = (exposure: string | number | undefined) => {
    if (!exposure) return null;
    if (typeof exposure === "string") return exposure;
    if (exposure >= 1) return `${exposure}s`;
    return `1/${Math.round(1 / exposure)}s`;
  };

  // Format focal length
  const formatFocal = (focal: string | number | undefined) => {
    if (!focal) return null;
    if (typeof focal === "string") return focal;
    return `${focal}mm`;
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  // Format date to Thai format (AD year)
  const formatThaiDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, "d MMMM yyyy, HH:mm", { locale: th });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 bg-black/95"
        onKeyDown={handleKeyDown}
      >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-1">
            <span className="text-white/70 text-sm mr-4">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white hover:bg-white/20",
                showInfo && "bg-white/20"
              )}
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              asChild
            >
              <a href={photo.url} download={photo.filename} target="_blank" rel="noopener noreferrer">
                <Download className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Main Image Area */}
        <div className="flex h-full">
          {/* Image Container */}
          <div className="flex-1 flex items-center justify-center relative">
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.filename}
              className="max-w-full max-h-full object-contain"
            />

            {/* Navigation Arrows */}
            {hasPrev && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white hover:bg-white/20 bg-black/30"
                onClick={goToPrev}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white hover:bg-white/20 bg-black/30"
                onClick={goToNext}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Info Panel - Slide in from right */}
          <div 
            className={cn(
              "w-80 bg-card/95 backdrop-blur border-l flex flex-col overflow-hidden transition-all duration-300",
              showInfo ? "translate-x-0" : "translate-x-full absolute right-0 h-full"
            )}
            style={{ display: showInfo ? 'flex' : 'none' }}
          >
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg truncate" title={photo.filename}>
                {photo.filename}
              </h3>
              {photo.createdAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(photo.createdAt), "d MMMM yyyy, HH:mm", { locale: th })}
                </p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Camera Info */}
              {(metadata.make || metadata.model) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    กล้อง
                  </h4>
                  <div className="space-y-1">
                    {metadata.make && (
                      <p className="text-sm">{metadata.make}</p>
                    )}
                    {metadata.model && (
                      <p className="text-sm font-medium">{metadata.model}</p>
                    )}
                    {metadata.lens && (
                      <p className="text-sm text-muted-foreground">{metadata.lens}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Shooting Settings */}
              {(metadata.iso || metadata.exposureTime || metadata.fNumber || metadata.focalLength) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">ค่าการถ่ายภาพ</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {metadata.fNumber && (
                      <div className="flex items-center gap-2">
                        <Aperture className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">f/{metadata.fNumber}</span>
                      </div>
                    )}
                    {metadata.exposureTime && (
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{formatExposure(metadata.exposureTime)}</span>
                      </div>
                    )}
                    {metadata.iso && (
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">ISO {metadata.iso}</span>
                      </div>
                    )}
                    {metadata.focalLength && (
                      <div className="flex items-center gap-2">
                        <Focus className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{formatFocal(metadata.focalLength)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Date */}
              {metadata.dateTimeOriginal && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    วันที่ถ่าย
                  </h4>
                  <p className="text-sm">
                    {formatThaiDate(metadata.dateTimeOriginal)}
                  </p>
                </div>
              )}

              {/* File Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  ข้อมูลไฟล์
                </h4>
                <div className="space-y-2 text-sm">
                  {metadata.fileType && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ประเภท</span>
                      <Badge variant="secondary">{metadata.fileType}</Badge>
                    </div>
                  )}
                  {(metadata.imageWidth && metadata.imageHeight) && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ขนาด</span>
                      <span>{metadata.imageWidth} × {metadata.imageHeight}</span>
                    </div>
                  )}
                  {photo.size && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ขนาดไฟล์</span>
                      <span>{formatSize(photo.size)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="p-4 border-t">
              <Button asChild className="w-full">
                <a href={photo.url} download={photo.filename} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-2" />
                  ดาวน์โหลดไฟล์ต้นฉบับ
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
