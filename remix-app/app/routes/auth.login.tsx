import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticator } from "~/auth.server";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  });
}

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
            <CardTitle className="text-2xl text-center">เข้าสู่ระบบ</CardTitle>
        </CardHeader>
        <CardContent>
            <Form method="post" className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input type="email" id="email" name="email" placeholder="example@email.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">รหัสผ่าน</Label>
                    <Input type="password" id="password" name="password" required />
                </div>
                <Button type="submit" className="w-full">เข้าสู่ระบบ</Button>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
