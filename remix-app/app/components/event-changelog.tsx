import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { History, UserPlus, UserMinus, Upload, Trash2, Settings, RefreshCw, ChevronDown } from "lucide-react";
import axios from "axios";
import type { EventActivityLog } from "~/types";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { AnimatePresence, motion } from "framer-motion";

interface EventChangelogProps {
  eventId: string;
}

const actionConfig: Record<string, { icon: typeof UserPlus; label: string; color: string }> = {
  USER_JOINED: { icon: UserPlus, label: "เข้าร่วมกิจกรรม", color: "text-green-500" },
  USER_LEFT: { icon: UserMinus, label: "ถอนตัวจากกิจกรรม", color: "text-red-500" },
  PHOTO_UPLOADED: { icon: Upload, label: "อัพโหลดรูปภาพ", color: "text-blue-500" },
  PHOTO_DELETED: { icon: Trash2, label: "ลบรูปภาพ", color: "text-orange-500" },
  STATUS_CHANGED: { icon: RefreshCw, label: "เปลี่ยนสถานะ", color: "text-purple-500" },
  EVENT_UPDATED: { icon: Settings, label: "แก้ไขกิจกรรม", color: "text-gray-500" },
};

export function EventChangelog({ eventId }: EventChangelogProps) {
  const [activities, setActivities] = useState<EventActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/events/${eventId}/activities`);
        setActivities(response.data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && activities.length === 0) {
      fetchActivities();
    }
  }, [eventId, isOpen, activities.length]);

  const getActionDetails = (activity: EventActivityLog) => {
    const config = actionConfig[activity.action] || { 
      icon: History, 
      label: activity.action, 
      color: "text-muted-foreground" 
    };
    
    let details = "";
    if (activity.details) {
      const d = activity.details as Record<string, unknown>;
      if (d.filename) details = ` (${d.filename})`;
      if (d.type) details += ` [${d.type}]`;
    }
    
    return { ...config, details };
  };

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <Button 
          variant="ghost" 
          className="p-0 hover:bg-transparent flex items-center gap-2 group w-full justify-start"
          onClick={() => setIsOpen(!isOpen)}
        >
          <CardTitle className="text-lg flex items-center gap-2 cursor-pointer">
            <ChevronDown className={`w-5 h-5 text-primary transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} />
            <History className="w-5 h-5 text-primary" />
            <span>ประวัติกิจกรรม</span>
          </CardTitle>
        </Button>
      </CardHeader>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="changelog-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>ยังไม่มีประวัติกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {activities.map((activity) => {
                    const { icon: Icon, label, color, details } = getActionDetails(activity);
                    
                    return (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-full bg-background ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {activity.user && (
                              <>
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={activity.user.avatar ?? undefined} />
                                  <AvatarFallback className="text-xs">
                                    {activity.user.name?.charAt(0).toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm truncate">
                                  {activity.user.name || "Unknown"}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {label}{details}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(activity.createdAt), { 
                              addSuffix: true, 
                              locale: th 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
