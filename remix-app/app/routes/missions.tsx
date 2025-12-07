import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Target, Check, Star, Zap, Info, X } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { PageTransition } from "~/components/page-transition";
import { sessionStorage } from "~/session.server";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";

interface RankInfo {
  name: string;
  minExp: number;
  maxExp: number;
  image: string;
}

interface UserRank {
  exp: number;
  level: number;
  rank: RankInfo;
  nextRank: RankInfo | null;
  progress: number;
  expToNextRank: number;
}

interface Mission {
  id: string;
  title: string;
  description: string;
  expReward: number;
  type: string;
  completed: boolean;
  completedAt: string | null;
  progress: {
    current: number;
    required: number;
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [missionsRes, rankRes] = await Promise.all([
    axios.get<Mission[]>(`${backendUrl}/missions/user/${user.id}`),
    axios.get<UserRank>(`${backendUrl}/missions/rank/${user.id}`),
  ]);

  return json({ 
    missions: missionsRes.data, 
    userRank: rankRes.data,
    user,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const missionId = formData.get("missionId") as string;

  const result = await axios.post(`${backendUrl}/missions/${missionId}/complete/${user.id}`)
    .then(res => res.data)
    .catch(err => ({ success: false, message: err.message }));

  return json(result);
}

export default function MissionsPage() {
  const { missions, userRank } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const completedCount = missions.filter(m => m.completed).length;
  const [showRankInfo, setShowRankInfo] = useState(false);

  const allRanks = [
    { name: 'Rookie', minExp: 0, maxExp: 99, image: '/images/ranks/rookie.svg', description: 'เริ่มต้น สมาชิกใหม่ทุกคน', auraColor: 'rgba(156, 163, 175, 0.5)', glowColor: '#9CA3AF' },
    { name: 'Intermediate', minExp: 100, maxExp: 299, image: '/images/ranks/intermediate.svg', description: 'สมาชิกที่มีประสบการณ์พอสมควร', auraColor: 'rgba(34, 197, 94, 0.5)', glowColor: '#22C55E' },
    { name: 'Master', minExp: 300, maxExp: 599, image: '/images/ranks/master.svg', description: 'สมาชิกที่เชี่ยวชาญและ Active', auraColor: 'rgba(168, 85, 247, 0.5)', glowColor: '#A855F7' },
    { name: 'Grand Master', minExp: 600, maxExp: Infinity, image: '/images/ranks/grand-master.svg', description: 'สมาชิกระดับสูงสุด ขาประจำชมรม', auraColor: 'rgba(251, 191, 36, 0.6)', glowColor: '#FBBF24' },
  ];

  // Get current rank aura
  const currentRankAura = allRanks.find(r => r.name === userRank.rank.name);

  return (
    <PageTransition className="min-h-screen bg-muted/30 p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-8 h-8 text-primary" />
              ภารกิจ
            </h1>
            <p className="text-muted-foreground">ทำภารกิจเพื่อรับ EXP และเลื่อน Rank</p>
          </div>
          <button
            onClick={() => setShowRankInfo(true)}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
          >
            <Info className="w-4 h-4" />
            ดู Rank ทั้งหมด
          </button>
        </div>

        {/* Rank Info Dialog */}
        <Dialog open={showRankInfo} onOpenChange={setShowRankInfo}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                ระบบ Rank
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {allRanks.map((rank, index) => (
                <div 
                  key={rank.name}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    userRank.rank.name === rank.name 
                      ? 'bg-primary/10 border-primary' 
                      : 'bg-card border-border'
                  }`}
                >
                  <div 
                    className="w-16 h-16 flex-shrink-0 relative"
                    style={{
                      filter: `drop-shadow(0 0 8px ${rank.glowColor}) drop-shadow(0 0 16px ${rank.auraColor})`,
                    }}
                  >
                    <div 
                      className="absolute inset-0 rounded-full opacity-30"
                      style={{ backgroundColor: rank.auraColor }}
                    />
                    <img src={rank.image} alt={rank.name} className="w-full h-full object-contain relative z-10" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{rank.name}</h3>
                      {userRank.rank.name === rank.name && (
                        <Badge variant="default" className="text-xs">ปัจจุบัน</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rank.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      EXP: {rank.minExp} - {rank.maxExp === Infinity ? '∞' : rank.maxExp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Rank Card */}
        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6">
            <div className="flex items-center gap-6">
              {/* Rank Image with Aura */}
              <div 
                className="w-28 h-28 flex-shrink-0 relative"
                style={{
                  filter: currentRankAura 
                    ? `drop-shadow(0 0 12px ${currentRankAura.glowColor}) drop-shadow(0 0 24px ${currentRankAura.auraColor}) drop-shadow(0 0 36px ${currentRankAura.auraColor})`
                    : undefined,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    backgroundColor: currentRankAura?.auraColor,
                    opacity: 0.3,
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full overflow-hidden"
                >
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shine" />
                </div>
                <img 
                  src={userRank.rank.image} 
                  alt={userRank.rank.name}
                  className="w-full h-full object-contain relative z-10"
                />
              </div>
              
              {/* Rank Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold">{userRank.rank.name}</h2>
                  <Badge variant="secondary" className="text-lg">
                    <Zap className="w-4 h-4 mr-1" />
                    {userRank.exp} EXP
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                {userRank.nextRank ? (
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-1">
                      <span>ไปยัง {userRank.nextRank.name}</span>
                      <span>อีก {userRank.expToNextRank} EXP</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all duration-500"
                        style={{ width: `${userRank.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-green-600 font-medium flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    คุณอยู่ Rank สูงสุดแล้ว!
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Mission Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-primary">{completedCount}</p>
              <p className="text-sm text-muted-foreground">ภารกิจที่ทำสำเร็จ</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-500">{missions.length - completedCount}</p>
              <p className="text-sm text-muted-foreground">ภารกิจที่เหลือ</p>
            </CardContent>
          </Card>
        </div>

        {/* Mission List */}
        <Card>
          <CardHeader>
            <CardTitle>รายการภารกิจ</CardTitle>
          </CardHeader>
          <CardContent>
            {missions.length > 0 ? (
              <div className="space-y-4">
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      mission.completed 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                        : 'bg-card border-border hover:border-primary/50 transition-colors'
                    }`}
                  >
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      mission.completed 
                        ? 'bg-green-500 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {mission.completed ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Target className="w-5 h-5" />
                      )}
                    </div>

                    {/* Mission Info */}
                    <div className="flex-1">
                      <h3 className={`font-medium ${mission.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {mission.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                      
                      {/* Progress Bar */}
                      {!mission.completed && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>ความคืบหน้า</span>
                            <span className="font-medium">{mission.progress.current}/{mission.progress.required}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${(mission.progress.current / mission.progress.required) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reward */}
                    <Badge variant={mission.completed ? "secondary" : "default"} className="text-sm flex-shrink-0">
                      +{mission.expReward} EXP
                    </Badge>
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
