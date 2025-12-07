import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Users, Calendar, Image, Clock, Camera, Trophy, TrendingUp, FileSpreadsheet } from "lucide-react";
import axios from "axios";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { PageTransition } from "~/components/page-transition";
import { sessionStorage } from "~/session.server";

interface DashboardStats {
  overview: {
    totalMembers: number;
    totalEvents: number;
    eventsThisMonth: number;
    totalPhotos: number;
    totalActivityHours: number;
  };
  photoStats: {
    rawPhotos: number;
    editedPhotos: number;
    totalStorageBytes: number;
    eventsWithEditedPhotos: number;
    totalEvents: number;
  };
  topParticipants: Array<{
    user: { id: string; name: string; avatar: string | null; email: string };
    eventCount: number;
  }>;
  topPhotographers: Array<{
    user: { id: string; name: string; avatar: string | null; email: string };
    photoCount: number;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    createdAt: string;
    user: { id: string; name: string; avatar: string | null } | null;
    event: { id: string; title: string };
  }>;
  monthlyEvents: Array<{
    month: string;
    events: number;
  }>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  // Only allow admin
  if (!user || user.role !== "ADMIN") {
    throw new Response("Unauthorized", { status: 403 });
  }

  const stats = await axios.get<DashboardStats>(`${backendUrl}/dashboard/stats`)
    .then(res => res.data);

  return json({ stats, user });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getActionLabel(action: string): { label: string; color: string } {
  const actionMap: Record<string, { label: string; color: string }> = {
    USER_JOINED: { label: "เข้าร่วมกิจกรรม", color: "bg-green-500" },
    USER_LEFT: { label: "ออกจากกิจกรรม", color: "bg-red-500" },
    PHOTO_UPLOADED: { label: "อัปโหลดรูปภาพ", color: "bg-blue-500" },
    PHOTO_DELETED: { label: "ลบรูปภาพ", color: "bg-orange-500" },
    STATUS_CHANGED: { label: "เปลี่ยนสถานะ", color: "bg-purple-500" },
    EVENT_UPDATED: { label: "อัปเดตกิจกรรม", color: "bg-yellow-500" },
  };
  return actionMap[action] || { label: action, color: "bg-gray-500" };
}

export default function AdminDashboard() {
  const { stats } = useLoaderData<typeof loader>();

  const overviewCards = [
    {
      title: "สมาชิกทั้งหมด",
      value: stats.overview.totalMembers,
      icon: Users,
      description: "ผู้ใช้งานที่ active",
      color: "text-blue-500",
    },
    {
      title: "กิจกรรม",
      value: stats.overview.totalEvents,
      icon: Calendar,
      description: `เดือนนี้ +${stats.overview.eventsThisMonth}`,
      color: "text-green-500",
    },
    {
      title: "รูปภาพ",
      value: stats.overview.totalPhotos,
      icon: Image,
      description: "รูปทั้งหมด",
      color: "text-purple-500",
    },
  ];

  return (
    <PageTransition className="min-h-screen bg-muted/30 p-6">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">ภาพรวมชมรม IT Bangmod Photo Club</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {overviewCards.map((card) => (
            <Card key={card.title}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-3xl font-bold">{card.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                  </div>
                  <card.icon className={`w-10 h-10 ${card.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly Events Chart */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              กิจกรรมรายเดือน
            </CardTitle>
            <button
              onClick={() => {
                const backendUrl = (window as any).ENV?.BACKEND_URL || 'http://localhost:3000';
                window.open(`${backendUrl}/dashboard/events/export`, '_blank');
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyEvents}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="events"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    name="จำนวนกิจกรรม"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Middle Row: Photo Stats + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Photo Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                สถิติรูปภาพ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">รูป RAW</span>
                <span className="font-semibold">{stats.photoStats.rawPhotos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">รูปแต่งแล้ว</span>
                <span className="font-semibold text-green-600">{stats.photoStats.editedPhotos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">พื้นที่ใช้ไป</span>
                <span className="font-semibold">{formatBytes(stats.photoStats.totalStorageBytes)}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">กิจกรรมที่แต่งรูปแล้ว</span>
                  <span className="font-semibold">
                    {stats.photoStats.eventsWithEditedPhotos}/{stats.photoStats.totalEvents}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${stats.photoStats.totalEvents > 0 
                        ? (stats.photoStats.eventsWithEditedPhotos / stats.photoStats.totalEvents) * 100 
                        : 0}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 5 ขาประจำ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.topParticipants.length > 0 ? (
                <div className="space-y-3">
                  {stats.topParticipants.map((item, index) => (
                    <div key={item.user?.id || index} className="flex items-center gap-3">
                      <span className={`text-lg font-bold w-6 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        {index + 1}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={item.user?.avatar || undefined} />
                        <AvatarFallback>{item.user?.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.user?.name || "Unknown"}</p>
                      </div>
                      <Badge variant="secondary">{item.eventCount} งาน</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">ยังไม่มีข้อมูล</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              กิจกรรมล่าสุด
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivities.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivities.map((activity) => {
                  const actionInfo = getActionLabel(activity.action);
                  return (
                    <div key={activity.id} className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${actionInfo.color}`} />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.user?.avatar || undefined} />
                        <AvatarFallback>{activity.user?.name?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user?.name || "ระบบ"}</span>
                          {" "}{actionInfo.label}{" "}
                          <span className="text-muted-foreground">ใน {activity.event.title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.createdAt), "d MMM yyyy HH:mm", { locale: th })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">ยังไม่มีกิจกรรมล่าสุด</p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
