import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import axios from "axios";
import { useState, useEffect } from "react";
import { sessionStorage } from "~/session.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
// import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);

    try {
      const backendUrl = "http://localhost:3000";
      
      // 1. Get Presigned URL
      const { data } = await axios.post(`${backendUrl}/users/avatar/upload-url`, {
        filename: file.name,
        userId: user.id,
      });

      // 2. Upload to MinIO
      await axios.put(data.url, file, {
        headers: {
          'Content-Type': file.type,
        },
      });

      // 3. Update Preview and Hidden Input
      // The path returned from backend is relative to bucket, we need full URL if accessing directly or just path if proxying
      // Assuming we can use the path directly if we have a way to serve it, or we construct the URL
      // For now, let's assume the backend returns a usable path or we construct it.
      // Actually, Minio usually needs a signed GET url or a public bucket.
      // Let's assume public bucket for avatars or we use the path.
      // Ideally we should use the full URL.
      
      // Since we don't have a public URL easily without configuration, let's try to use the path and assume the frontend knows how to display it 
      // OR better, let's ask the backend for the public URL or just use the path if it's a public bucket.
      // Given the previous code used `data.path`, let's use that.
      
      // Wait, the previous code in events.$id.upload.tsx used `data.path` to save to DB.
      // Here we want to update the input value so when form submits, it saves the new URL.
      
      // Let's construct a public URL if possible, or just use the path if the app handles it.
      // For Minio localhost:9000/photos/...
      
      const publicUrl = `http://localhost:9000/photos/${data.path}`;
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
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="text-2xl bg-slate-300">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
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
              <Label htmlFor="avatar">รูปโปรไฟล์</Label>
              <div className="flex gap-2">
                <Input 
                  id="avatar" 
                  name="avatar" 
                  value={avatarPreview} 
                  onChange={(e) => setAvatarPreview(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="hidden"
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-muted-foreground">อัปโหลดรูปภาพ (JPG, PNG)</p>
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
    </div>
  );
}
