import { json, defer, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation, Await } from "@remix-run/react";
import type { User, UpdateUserDto } from "~/types";
import axios from "axios";
import { useState, useEffect, useRef, Suspense } from "react";
import { ProfileSkeleton } from "~/components/skeletons";
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

  // Simulate a delay to show skeleton (optional, for testing)
  // await new Promise(resolve => setTimeout(resolve, 1000));

  return defer({ user: Promise.resolve(user) });
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return redirect("/auth/login");
  }

  const formData = await request.formData();
  const name = formData.get("name");
  const studentId = formData.get("studentId") as string;
  const avatar = formData.get("avatar");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (studentId && (!/^\d+$/.test(studentId) || studentId.length !== 11)) {
    return json({ error: "รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก" }, { status: 400 });
  }

  const updates: Partial<UpdateUserDto> = {};

  if (name && name !== user.name) updates.name = name as string;
  if (studentId !== null && studentId !== user.studentId) updates.studentId = studentId as string;
  if (avatar && avatar !== user.avatar) updates.avatar = avatar as string;
  
  if (password) {
    if (password !== confirmPassword) {
      return json({ error: "รหัสผ่านไม่ตรงกัน" }, { status: 400 });
    }
    updates.password = password as string;
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
  } catch (error: unknown) {
    console.error("Failed to update profile", error);
    const axiosError = error as { response?: { data?: { message?: string } }, message?: string };
    const errorMessage = axiosError.response?.data?.message || axiosError.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
    return json({ error: errorMessage }, { status: 500 });
  }
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>() as any;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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

      <Suspense fallback={<ProfileSkeleton />}>
        <Await resolve={user}>
          {(resolvedUser) => (
            <ProfileForm user={resolvedUser} actionData={actionData} isSubmitting={isSubmitting} />
          )}
        </Await>
      </Suspense>
    </div>
  );
}

function ProfileForm({ user, actionData, isSubmitting }: { user: User, actionData: { error?: string, success?: boolean, message?: string } | undefined, isSubmitting: boolean }) {
  const [name, setName] = useState(user.name);
  const [studentId, setStudentId] = useState(user.studentId || "");
  const [avatarPreview, setAvatarPreview] = useState(user.avatar);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isChanged = 
    name !== user.name || 
    studentId !== (user.studentId || "") ||
    avatarPreview !== user.avatar || 
    password !== "" || 
    confirmPassword !== "";

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
    setName(user.name);
    setStudentId(user.studentId || "");
  }, [user.avatar, user.name, user.studentId]);

  return (
    <>
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
                  <AvatarImage src={avatarPreview ?? undefined} className="object-cover" />
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
                value={name ?? ""}
                onChange={(e) => setName(e.target.value)}
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">รหัสนักศึกษา</Label>
              <Input 
                id="studentId" 
                name="studentId" 
                value={studentId}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and max 11 digits
                  if (/^\d*$/.test(value) && value.length <= 11) {
                    setStudentId(value);
                  }
                }}
                placeholder="6xxxxxxxxxx"
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">
                ต้องเป็นตัวเลข 11 หลัก
              </p>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting || !isChanged} className="w-full">
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
    </>
  );
}



