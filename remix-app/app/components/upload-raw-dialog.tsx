import { useState } from "react";
import axios from "axios";
import { Upload, FileWarning, CheckCircle2, AlertCircle, Loader2, X, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { RAW_EXTENSIONS, isRawFile } from "~/lib/raw-extensions";
import { ScrollArea } from "~/components/ui/scroll-area";

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface FileItem {
  file: File;
  isRaw: boolean;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface UploadRawDialogProps {
  eventId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function UploadRawDialog({ eventId, userId, open, onOpenChange, onSuccess }: UploadRawDialogProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: FileItem[] = Array.from(e.target.files).map(file => ({
        file,
        isRaw: isRawFile(file.name),
        status: "pending" as const
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    // Reset input so same files can be selected again
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const rawFiles = files.filter(f => f.isRaw);
  const invalidFiles = files.filter(f => !f.isRaw);
  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);

  const handleUpload = async () => {
    const filesToUpload = files.filter(f => f.isRaw && f.status === "pending");
    if (filesToUpload.length === 0 || !eventId) return;
    
    setUploading(true);
    setUploadStatus("uploading");
    setUploadProgress({ current: 0, total: filesToUpload.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < filesToUpload.length; i++) {
      const fileItem = filesToUpload[i];
      const fileIndex = files.findIndex(f => f.file === fileItem.file);
      
      // Update status to uploading
      setFiles(prev => prev.map((f, idx) => 
        idx === fileIndex ? { ...f, status: "uploading" as const } : f
      ));
      setUploadProgress({ current: i + 1, total: filesToUpload.length });

      try {
        // 1. Get Presigned URL
        const { data } = await axios.post('http://localhost:3000/photos/upload-url', {
          filename: fileItem.file.name,
          eventId: eventId,
          userId: userId,
        });

        // 2. Upload to MinIO
        await axios.put(data.url, fileItem.file, {
          headers: {
            'Content-Type': fileItem.file.type || 'application/octet-stream',
          },
        });

        // 3. Notify Backend with full URL and relative path
        await axios.post('http://localhost:3000/photos', {
          url: data.publicUrl,  // Full MinIO URL for display
          path: data.path,      // Relative path for worker
          filename: fileItem.file.name,
          eventId: eventId,
          userId: userId,
        });

        // Update status to success
        setFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: "success" as const } : f
        ));
        successCount++;
      } catch (err) {
        console.error(err);
        // Update status to error
        setFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { ...f, status: "error" as const, error: "อัปโหลดไม่สำเร็จ" } : f
        ));
        errorCount++;
      }
    }

    setUploading(false);
    setUploadStatus(errorCount === 0 ? "success" : "error");
    // Note: onSuccess will be called when dialog closes to give time for thumbnail processing
  };

  const resetState = () => {
    setFiles([]);
    setUploadStatus("idle");
    setUploadProgress({ current: 0, total: 0 });
  };

  const handleClose = () => {
    if (!uploading) {
      const hadSuccessfulUploads = files.some(f => f.status === "success");
      onOpenChange(false);
      setTimeout(() => {
        resetState();
        // Refresh data after giving time for thumbnail processing
        if (hadSuccessfulUploads && onSuccess) {
          onSuccess();
        }
      }, 500);
    }
  };

  // Render upload progress/result view
  if (uploadStatus !== "idle") {
    const successFiles = files.filter(f => f.status === "success");
    const errorFiles = files.filter(f => f.status === "error");
    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "uploading");

    return (
      <Dialog open={open} onOpenChange={(val) => {
        if (!val && !uploading) handleClose();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center">
              {uploading ? "กำลังอัปโหลด" : uploadStatus === "success" ? "อัปโหลดสำเร็จ" : "อัปโหลดเสร็จสิ้น"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {uploading 
                ? `กำลังอัปโหลดไฟล์ ${uploadProgress.current}/${uploadProgress.total}...`
                : `อัปโหลดสำเร็จ ${successFiles.length} ไฟล์${errorFiles.length > 0 ? `, ล้มเหลว ${errorFiles.length} ไฟล์` : ""}`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Progress or Result Icon */}
            <div className="flex justify-center">
              {uploading ? (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : uploadStatus === "success" ? (
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              )}
            </div>

            {/* File Status List */}
            <ScrollArea className="h-48 rounded-lg border">
              <div className="p-3 space-y-2">
                {files.filter(f => f.isRaw).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className="flex-shrink-0">
                      {item.status === "uploading" && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                      {item.status === "success" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {item.status === "error" && <X className="w-4 h-4 text-red-500" />}
                      {item.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Badge variant={
                      item.status === "success" ? "default" : 
                      item.status === "error" ? "destructive" : 
                      "secondary"
                    } className="text-xs">
                      {item.status === "success" ? "สำเร็จ" : 
                       item.status === "error" ? "ล้มเหลว" : 
                       item.status === "uploading" ? "กำลังอัปโหลด" : "รอคิว"}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Close Button */}
            {!uploading && (
              <Button onClick={handleClose} className="w-full">
                ปิดหน้าต่าง
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Render selection view
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            อัปโหลดไฟล์ RAW
          </DialogTitle>
          <DialogDescription>
            เลือกไฟล์ RAW หลายไฟล์พร้อมกันได้ รองรับไฟล์ .CR2, .NEF, .ARW และอื่นๆ
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 flex-1 overflow-hidden">
          {/* Left Side: File List */}
          <div className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                ไฟล์ที่เลือก ({files.length} ไฟล์)
              </span>
              {files.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFiles} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4 mr-1" />
                  ล้างทั้งหมด
                </Button>
              )}
            </div>
            
            <ScrollArea className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              {files.length > 0 ? (
                <div className="p-3 space-y-2">
                  {files.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        item.isRaw 
                          ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.isRaw ? 'bg-primary/20' : 'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <ImageIcon className={`w-5 h-5 ${item.isRaw ? 'text-primary' : 'text-red-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.file.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {(item.file.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                          <Badge variant={item.isRaw ? "default" : "destructive"} className="text-xs">
                            {item.isRaw ? "RAW" : "ไม่ใช่ RAW"}
                          </Badge>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => removeFile(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
                  <ImageIcon className="w-12 h-12 opacity-30 mb-2" />
                  <p className="text-sm">ยังไม่มีไฟล์ที่เลือก</p>
                </div>
              )}
            </ScrollArea>
            
            {/* Summary */}
            {files.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                <span>ไฟล์ RAW: {rawFiles.length} | ไม่ใช่ RAW: {invalidFiles.length}</span>
                <span>รวม: {(totalSize / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            )}
          </div>

          {/* Right Side: Controls */}
          <div className="flex flex-col justify-between">
            {/* File Input */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload-dialog"
                  accept={RAW_EXTENSIONS.join(',')}
                  multiple
                />
                <label
                  htmlFor="file-upload-dialog"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">เลือกไฟล์</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      คลิกหรือลากไฟล์มาวาง (เลือกได้หลายไฟล์)
                    </p>
                  </div>
                </label>
              </div>

              {/* Warning for invalid files */}
              {invalidFiles.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <FileWarning className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                      มี {invalidFiles.length} ไฟล์ที่ไม่ใช่ไฟล์ RAW จะไม่ถูกอัปโหลด
                    </p>
                  </div>
                </div>
              )}

              {/* Supported Formats */}
              <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <p className="font-medium mb-1">รูปแบบที่รองรับ:</p>
                <p>Canon (.CR2, .CR3), Nikon (.NEF), Sony (.ARW), Fujifilm (.RAF), DNG และอื่นๆ</p>
              </div>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={rawFiles.length === 0}
              className="w-full h-12 text-base mt-4"
            >
              <Upload className="w-5 h-5 mr-2" />
              อัปโหลด {rawFiles.length > 0 ? `${rawFiles.length} ไฟล์` : "ไฟล์ RAW"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
