import { json, redirect, ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useNavigation, Link } from "@remix-run/react";
import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DatePicker } from "~/components/date-picker";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const location = formData.get("location");
  const startDate = formData.get("startDate");
  const endDate = formData.get("endDate");

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  try {
    await axios.post(`${backendUrl}/events`, {
      title,
      description,
      location,
      startDate,
      endDate,
    });
    return redirect("/events");
  } catch (error) {
    return json({ error: "ไม่สามารถสร้างกิจกรรมได้" }, { status: 400 });
  }
}

export default function NewEvent() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6 pl-0 hover:bg-transparent hover:text-primary">
        <Link to="/events" className="inline-flex items-center">
          <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้ากิจกรรม
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">สร้างกิจกรรมใหม่</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">ชื่อกิจกรรม *</Label>
              <Input
                id="title"
                name="title"
                placeholder="เช่น Photo Walk 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <textarea
                id="description"
                name="description"
                placeholder="อธิบายเกี่ยวกับกิจกรรม..."
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">สถานที่</Label>
              <Input
                id="location"
                name="location"
                placeholder="เช่น สวนลุมพินี"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>วันที่เริ่มต้น *</Label>
                <DatePicker
                  date={startDate}
                  onDateChange={setStartDate}
                  placeholder="เลือกวันที่เริ่มต้น"
                />
                <input
                  type="hidden"
                  name="startDate"
                  value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                />
              </div>

              <div className="space-y-2">
                <Label>วันที่สิ้นสุด *</Label>
                <DatePicker
                  date={endDate}
                  onDateChange={setEndDate}
                  placeholder="เลือกวันที่สิ้นสุด"
                />
                <input
                  type="hidden"
                  name="endDate"
                  value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                />
              </div>
            </div>

            {actionData?.error && (
              <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                {actionData.error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "กำลังสร้าง..." : "สร้างกิจกรรม"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/events">ยกเลิก</Link>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
