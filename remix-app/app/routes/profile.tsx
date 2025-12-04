import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { sessionStorage } from "~/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { ImageCropper } from "~/components/image-cropper";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/auth/login");
  }

  return json({ user });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/auth/login");
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const avatar = formData.get("avatar");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  const updates: any = {};

  if (name && name !== user.name) updates.name = name;
  if (avatar && avatar !== user.avatar) updates.avatar = avatar;
  
  if (password) {
    if (password !== confirmPassword) {
      return json({ error: "รหัสผ่านไม่ตรงกัน" }, { status: 400 });
    }
    updates.password = password;
  }

  if (Object.keys(updates).length === 0) {
    return json({ success: true, message: "ไม่มีการเปลี่ยนแปลงข้อมูล" });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  try {
    const res = await axios.patch(`${backendUrl}/users/${user.id}`, updates);
    
    // Update session with new user data
    const updatedUser = { ...user, ...res.data };
    // Don't store password in session
    delete updatedUser.password;
    
    session.set("user", updatedUser);

    return json(
      { success: true, message: "บันทึกข้อมูลเรียบร้อยแล้ว" },
      { 
        headers: { 
          "Set-Cookie": await sessionStorage.commitSession(session) 
        } 
      }
    );
  } catch (error) {
    console.error("Failed to update profile", error);
    return json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" }, { status: 500 });
  }
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [isUploading, setIsUploading] = useState(false);
  
  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedImage(reader.result as string);
        setCropperOpen(true);
      });
      reader.readAsDataURL(file);
      // Reset input so same file can be selected again
      e.target.value = "";
    }
  };

  const handleCropConfirm = async (croppedImageBlob: Blob) => {
    setIsUploading(true);
    try {
      const backendUrl = "http://localhost:3000";
      const filename = `avatar-${Date.now()}.jpg`;
      const file = new File([croppedImageBlob], filename, { type: "image/jpeg" });
      
      // 1. Get Presigned URL
      const { data } = await axios.post(`${backendUrl}/users/avatar/upload-url`, {
        filename: filename,
        userId: user.id,
      });

      // 2. Upload to MinIO
      await axios.put(data.url, file, {
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      // 3. Update Preview
      const publicUrl = `http://localhost:9000/photos/${data.path}?t=${new Date().getTime()}`;
      setAvatarPreview(publicUrl);
      
    } catch (error) {
      console.error("Upload failed", error);
      alert("อัปโหลดรูปภาพไม่สำเร็จ");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    setAvatarPreview(user.avatar);
  }, [user.avatar]);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">จัดการโปรไฟล์</h1>

      {actionData?.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ผิดพลาด</AlertTitle>
          <AlertDescription>{actionData.error}</AlertDescription>
        </Alert>
      )}

      {actionData?.success && (
        <Alert className="mb-6 border-green-500 text-green-700 bg-green-50">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>สำเร็จ</AlertTitle>
          <AlertDescription>{actionData.message}</AlertDescription>
        </Alert>
      )}

      <Form method="post">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>ข้อมูลส่วนตัว</CardTitle>
            <CardDescription>แก้ไขข้อมูลส่วนตัวของคุณ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center justify-center gap-4 mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg group-hover:opacity-90 transition-opacity">
                  <AvatarImage src={avatarPreview} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-slate-300">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                </div>
                {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์</p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              {/* Hidden input to store the avatar URL for form submission */}
              <input type="hidden" name="avatar" value={avatarPreview || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อที่แสดง</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={user.name} 
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input 
                id="email" 
                value={user.email} 
                disabled 
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">อีเมลไม่สามารถแก้ไขได้</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่านใหม่</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
            </Button>
          </CardFooter>
        </Card>
      </Form>

      <ImageCropper 
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageSrc={selectedImage}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
