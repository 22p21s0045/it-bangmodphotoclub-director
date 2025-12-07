import { useState } from "react";
import { useParams, Link, useNavigate } from "@remix-run/react";
import axios from "axios";
import { ArrowLeft, Upload, FileWarning, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "~/components/ui/dialog";
import { RAW_EXTENSIONS, isRawFile } from "~/lib/raw-extensions";

type UploadStatus = "idle" | "getting-url" | "uploading" | "notifying" | "success" | "error";

export default function UploadPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRaw, setIsRaw] = useState<boolean | null>(null);
  
  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setIsRaw(null);
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const rawCheck = isRawFile(selectedFile.name);
      
      setFile(selectedFile);
      setIsRaw(rawCheck);
      
      if (!rawCheck) {
        setError(`ไฟล์ "${selectedFile.name}" ไม่ใช่ไฟล์ RAW กรุณาเลือกไฟล์ RAW เท่านั้น (เช่น .CR2, .NEF, .ARW, .DNG, .RAF เป็นต้น)`);
      }
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !id || !isRaw) return;
    
    setUploading(true);
    setShowModal(true);
    setUploadStatus("getting-url");
    setUploadError(null);

    try {
      // 1. Get Presigned URL
      setUploadStatus("getting-url");
      const { data } = await axios.post('http://localhost:3000/photos/upload-url', {
        filename: file.name,
        eventId: id,
        userId: '1', // Mock user ID
      });

      // 2. Upload to MinIO
      setUploadStatus("uploading");
      await axios.put(data.url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Notify Backend
      setUploadStatus("notifying");
      await axios.post('http://localhost:3000/photos', {
        url: data.path,
        filename: file.name,
        eventId: id,
        userId: '1',
      });

      setUploadStatus("success");
      setFile(null);
      setIsRaw(null);
    } catch (err) {
      console.error(err);
      setUploadStatus("error");
      setUploadError('อัปโหลดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    if (uploadStatus === "success") {
      navigate(`/events/${id}`);
    } else if (uploadStatus === "error") {
      setShowModal(false);
      setUploadStatus("idle");
    }
  };

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case "getting-url":
        return "กำลังเตรียมการอัปโหลด...";
      case "uploading":
        return "กำลังอัปโหลดไฟล์...";
      case "notifying":
        return "กำลังบันทึกข้อมูล...";
      case "success":
        return "อัปโหลดสำเร็จ!";
      case "error":
        return "เกิดข้อผิดพลาด";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Upload Progress Modal */}
      <Dialog open={showModal} onOpenChange={(open) => {
        // Only allow closing if upload is complete (success or error)
        if (!open && !uploading && (uploadStatus === "success" || uploadStatus === "error")) {
          handleCloseModal();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {uploadStatus === "success" ? "อัปโหลดสำเร็จ" : uploadStatus === "error" ? "เกิดข้อผิดพลาด" : "กำลังอัปโหลด"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {uploadStatus === "success" 
                ? "ไฟล์ของคุณถูกอัปโหลดเรียบร้อยแล้ว" 
                : uploadStatus === "error"
                ? "กรุณาลองอีกครั้ง"
                : "กรุณารอสักครู่..."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 space-y-6">
            {/* Status Icon */}
            {uploadStatus === "success" ? (
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            ) : uploadStatus === "error" ? (
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <X className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            )}

            {/* Status Message */}
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">{getStatusMessage()}</p>
              {file && uploadStatus !== "success" && uploadStatus !== "error" && (
                <p className="text-sm text-muted-foreground">{file.name}</p>
              )}
              {uploadError && (
                <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              )}
            </div>

            {/* Progress Steps */}
            {uploadStatus !== "success" && uploadStatus !== "error" && (
              <div className="w-full space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    uploadStatus === "getting-url" ? "bg-primary text-primary-foreground" : "bg-green-500 text-white"
                  }`}>
                    {uploadStatus === "getting-url" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className={uploadStatus === "getting-url" ? "text-foreground font-medium" : "text-muted-foreground"}>
                    เตรียมการอัปโหลด
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    uploadStatus === "uploading" ? "bg-primary text-primary-foreground" : 
                    uploadStatus === "notifying" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {uploadStatus === "uploading" ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     uploadStatus === "notifying" ? <CheckCircle2 className="w-4 h-4" /> : "2"}
                  </div>
                  <span className={uploadStatus === "uploading" ? "text-foreground font-medium" : "text-muted-foreground"}>
                    อัปโหลดไฟล์
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    uploadStatus === "notifying" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {uploadStatus === "notifying" ? <Loader2 className="w-4 h-4 animate-spin" /> : "3"}
                  </div>
                  <span className={uploadStatus === "notifying" ? "text-foreground font-medium" : "text-muted-foreground"}>
                    บันทึกข้อมูล
                  </span>
                </div>
              </div>
            )}

            {/* Action Button */}
            {(uploadStatus === "success" || uploadStatus === "error") && (
              <Button onClick={handleCloseModal} className="w-full">
                {uploadStatus === "success" ? "กลับไปหน้ารายละเอียดงาน" : "ลองอีกครั้ง"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
            <Link to={`/events/${id}`} className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้ารายละเอียดงาน
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Upload className="w-6 h-6 text-primary" />
              อัปโหลดไฟล์ RAW
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              อัปโหลดไฟล์ RAW จากกล้องของคุณ รองรับไฟล์ .CR2, .CR3, .NEF, .ARW, .DNG, .RAF และอื่นๆ
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept={RAW_EXTENSIONS.join(',')}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-sm text-muted-foreground mt-1">หรือลากไฟล์มาวางที่นี่</p>
                  </div>
                </label>
              </div>

              {/* File Info */}
              {file && (
                <div className={`p-4 rounded-lg border ${isRaw ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'}`}>
                  <div className="flex items-start gap-3">
                    {isRaw ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isRaw ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                        <Badge variant={isRaw ? "default" : "destructive"}>
                          {isRaw ? "✓ ไฟล์ RAW" : "✕ ไม่ใช่ไฟล์ RAW"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <FileWarning className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || !isRaw || uploading}
              className="w-full h-12 text-base"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  กำลังอัปโหลด...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  อัปโหลดไฟล์ RAW
                </>
              )}
            </Button>

            {/* Supported Formats Info */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p className="font-medium mb-2">รูปแบบไฟล์ RAW ที่รองรับ:</p>
              <p>Canon (.CR2, .CR3) • Nikon (.NEF) • Sony (.ARW) • Fujifilm (.RAF)</p>
              <p>Adobe DNG (.DNG) • Olympus (.ORF) • Panasonic (.RW2) • และอื่นๆ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

