import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useFetcher, Form } from "@remix-run/react";
import { Plus, Target, Trash2, Camera, Calendar } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageTransition } from "~/components/page-transition";
import { sessionStorage } from "~/session.server";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";

interface Mission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  type: string;
  isActive: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || user.role !== "ADMIN") {
    throw new Response("Forbidden", { status: 403 });
  }

  const missionsRes = await axios.get<Mission[]>(`${backendUrl}/missions`);

  return json({ missions: missionsRes.data, user });
}

export async function action({ request }: ActionFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user || user.role !== "ADMIN") {
    return json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const expReward = parseInt(formData.get("expReward") as string) || 10;
    const type = formData.get("type") as string || "MANUAL";

    await axios.post(`${backendUrl}/missions`, {
      title,
      description,
      expReward,
      type,
    });
  } else if (intent === "delete") {
    const missionId = formData.get("missionId") as string;
    await axios.delete(`${backendUrl}/missions/${missionId}`);
  }

  return json({ success: true });
}

export default function AdminMissionsPage() {
  const { missions } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'AUTO_PHOTO':
        return <Camera className="w-4 h-4" />;
      case 'AUTO_JOIN':
        return <Calendar className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'AUTO_PHOTO':
        return <Badge variant="secondary">📷 อัปโหลดรูป</Badge>;
      case 'AUTO_JOIN':
        return <Badge variant="secondary">🎯 เข้าร่วมกิจกรรม</Badge>;
      default:
        return <Badge variant="outline">✋ Manual</Badge>;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-muted/30 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              จัดการภารกิจ
            </h1>
            <p className="text-muted-foreground">สร้างและจัดการภารกิจสำหรับสมาชิก</p>
          </div>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            สร้างภารกิจ
          </button>
        </div>

        {/* Create Mission Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                สร้างภารกิจใหม่
              </DialogTitle>
            </DialogHeader>
            <fetcher.Form method="post" onSubmit={() => setShowCreateDialog(false)}>
              <input type="hidden" name="intent" value="create" />
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">ชื่อภารกิจ</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    placeholder="เช่น ช่างภาพมือทอง"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">รายละเอียด</Label>
                  <Input 
                    id="description" 
                    name="description" 
                    placeholder="เช่น อัปโหลดรูปภาพครบ 100 รูป"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    * ใส่ตัวเลขเป้าหมาย เช่น "5 รูป" หรือ "3 ครั้ง"
                  </p>
                </div>

                <div>
                  <Label htmlFor="expReward">EXP ที่ได้รับ</Label>
                  <Input 
                    id="expReward" 
                    name="expReward" 
                    type="number" 
                    defaultValue={20}
                    min={1}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="type">ประเภท</Label>
                  <select 
                    id="type" 
                    name="type"
                    className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-foreground"
                    defaultValue="AUTO_PHOTO"
                  >
                    <option value="AUTO_PHOTO">📷 นับจากรูปที่อัปโหลด</option>
                    <option value="AUTO_JOIN">🎯 นับจากกิจกรรมที่เข้าร่วม</option>
                    <option value="MANUAL">✋ Admin อนุมัติเอง</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={fetcher.state !== "idle"}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {fetcher.state !== "idle" ? "กำลังสร้าง..." : "สร้างภารกิจ"}
                </button>
              </div>
            </fetcher.Form>
          </DialogContent>
        </Dialog>

        {/* Missions List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการภารกิจทั้งหมด ({missions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {missions.length > 0 ? (
              <div className="space-y-3">
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary`}>
                      {getTypeIcon(mission.type)}
                    </div>

                    <div className="flex-1">
                      <h3 className="font-medium">{mission.title}</h3>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                    </div>

                    {getTypeBadge(mission.type)}

                    <Badge className="text-sm">+{mission.expReward} EXP</Badge>

                    <fetcher.Form method="post">
                      <input type="hidden" name="intent" value="delete" />
                      <input type="hidden" name="missionId" value={mission.id} />
                      <button
                        type="submit"
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        title="ลบภารกิจ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </fetcher.Form>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">ยังไม่มีภารกิจ</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
