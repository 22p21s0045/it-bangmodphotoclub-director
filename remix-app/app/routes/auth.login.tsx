import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticator } from "~/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { useState, useEffect } from "react";

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  });
}

export default function Login() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "/images/login-bg-2.jpg",
    "/images/login-bg-3.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-white text-zinc-900">
      {/* Left side - Image */}
      <div className="hidden w-1/2 bg-zinc-900 lg:block relative overflow-hidden">
        {images.map((img, index) => (
          <div
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-black/20" /> {/* Overlay for better text contrast if needed */}
        <div className="absolute bottom-8 left-8 text-white p-4 z-10">
            <h2 className="text-3xl font-bold">IT Bangmod Director</h2>
            <p className="text-lg opacity-90">จัดการกิจกรรมและดูแลคอมมูนิตี้ของคุณได้ง่ายๆ</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex w-full flex-col justify-center px-8 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white lg:mx-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" x2="3" y1="12" y2="12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">ยินดีต้อนรับกลับ</h1>
            <p className="text-sm text-muted-foreground">
              กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
            </p>
          </div>

          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="admin@example.com" 
                required 
                className="bg-white border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <a href="#" className="text-xs text-zinc-600 hover:text-zinc-900 hover:underline">
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <Input 
                type="password" 
                id="password" 
                name="password" 
                required 
                className="bg-white border-zinc-200 focus:border-zinc-900 focus:ring-zinc-900"
              />
            </div>
            <Button type="submit" className="w-full bg-zinc-900 text-white hover:bg-zinc-800">
              เข้าสู่ระบบ
            </Button>
          </Form>

          <p className="px-8 text-center text-sm text-muted-foreground">
            ยังไม่มีบัญชี?{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              ติดต่อผู้ดูแลระบบ
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
