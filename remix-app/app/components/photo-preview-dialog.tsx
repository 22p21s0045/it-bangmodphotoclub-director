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
  Info,
  Trash2
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "~/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  photos: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPhotoChange: (photo: any) => void;
  onDelete?: (photo: any) => void;
  canDelete?: boolean;
}

export function PhotoPreviewDialog({ 
  photo, 
  photos, 
  open, 
  onOpenChange,
  onPhotoChange,
  onDelete,
  canDelete = false
}: PhotoPreviewDialogProps) {
  const [showInfo, setShowInfo] = useState(false);
  const [direction, setDirection] = useState(0);
  
  if (!photo) return null;

  const metadata = (photo.metadata || {}) as PhotoMetadata;
  const currentIndex = photos.findIndex((p: any) => p.id === photo.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  const goToPrev = () => {
    if (hasPrev) {
      setDirection(-1);
      onPhotoChange(photos[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (hasNext) {
      setDirection(1);
      onPhotoChange(photos[currentIndex + 1]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrev();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") onOpenChange(false);
    if (e.key === "i") setShowInfo(!showInfo);
  };

  const formatExposure = (exposure: string | number | undefined) => {
    if (!exposure) return null;
    if (typeof exposure === "string") return exposure;
    if (exposure >= 1) return `${exposure}s`;
    return `1/${Math.round(1 / exposure)}s`;
  };

  const formatFocal = (focal: string | number | undefined) => {
    if (!focal) return null;
    if (typeof focal === "string") return focal;
    return `${focal}mm`;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatThaiDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return format(date, "d MMMM yyyy, HH:mm", { locale: th });
    } catch {
      return dateStr;
    }
  };

  // Animation variants
  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const panelVariants = {
    hidden: { x: 320, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    exit: { 
      x: 320, 
      opacity: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-none w-screen h-screen p-0 border-0 bg-black flex flex-col"
        onKeyDown={handleKeyDown}
      >
        {/* Top Bar */}
        <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 bg-black/90 border-b border-white/10 z-20">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-white/70 text-sm mr-2">
              {currentIndex + 1} / {photos.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "text-white hover:bg-white/20 transition-colors",
                showInfo && "bg-white/30"
              )}
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-5 h-5" />
            </Button>
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-red-500/50 hover:text-red-400"
                onClick={() => onDelete(photo)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            )}
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

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Image Container */}
          <motion.div 
            className="flex-1 flex items-center justify-center relative bg-black overflow-hidden"
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait" custom={direction}>
              <motion.img
                key={photo.id}
                src={photo.thumbnailUrl || photo.url}
                alt={photo.filename}
                className="max-w-full max-h-full object-contain"
                custom={direction}
                variants={imageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
              />
            </AnimatePresence>

            {/* Navigation Arrows */}
            <AnimatePresence>
              {hasPrev && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full text-white hover:bg-white/20 bg-black/50"
                    onClick={goToPrev}
                  >
                    <ChevronLeft className="w-8 h-8" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {hasNext && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-12 h-12 rounded-full text-white hover:bg-white/20 bg-black/50"
                    onClick={goToNext}
                  >
                    <ChevronRight className="w-8 h-8" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Info Panel with Framer Motion */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-80 flex-shrink-0 bg-card border-l flex flex-col overflow-hidden"
              >
                {/* Panel Header */}
                <div className="flex items-center gap-2 p-3 border-b">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowInfo(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">Info</span>
                </div>

                {/* Filename */}
                <div className="p-4 border-b">
                  <h3 className="font-semibold truncate" title={photo.filename}>
                    {photo.filename}
                  </h3>
                  {photo.createdAt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(new Date(photo.createdAt), "d MMMM yyyy, HH:mm", { locale: th })}
                    </p>
                  )}
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Camera Info */}
                  {(metadata.make || metadata.model) && (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        กล้อง
                      </h4>
                      <div className="space-y-1">
                        {metadata.make && <p className="text-sm">{metadata.make}</p>}
                        {metadata.model && <p className="text-sm font-medium">{metadata.model}</p>}
                        {metadata.lens && <p className="text-sm text-muted-foreground">{metadata.lens}</p>}
                      </div>
                    </motion.div>
                  )}

                  {/* Shooting Settings */}
                  {(metadata.iso || metadata.exposureTime || metadata.fNumber || metadata.focalLength) && (
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
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
                    </motion.div>
                  )}

                  {/* Date */}
                  {metadata.dateTimeOriginal && (
                    <motion.div 
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        วันที่ถ่าย
                      </h4>
                      <p className="text-sm">{formatThaiDate(metadata.dateTimeOriginal)}</p>
                    </motion.div>
                  )}

                  {/* File Info */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
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
                  </motion.div>
                </div>

                {/* Download Button */}
                <motion.div 
                  className="p-4 border-t"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Button asChild className="w-full">
                    <a href={photo.url} download={photo.filename} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      ดาวน์โหลดไฟล์ต้นฉบับ
                    </a>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
