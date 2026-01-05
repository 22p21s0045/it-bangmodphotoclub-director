import { useState, useEffect, useMemo } from "react";
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

interface AggregatedActivity extends EventActivityLog {
  count?: number;
  photoTypes?: { RAW: number; EDITED: number };
}

const actionConfig: Record<string, { icon: typeof UserPlus; label: string; color: string }> = {
  USER_JOINED: { icon: UserPlus, label: "เข้าร่วมกิจกรรม", color: "text-green-500" },
  USER_LEFT: { icon: UserMinus, label: "ถอนตัวจากกิจกรรม", color: "text-red-500" },
  PHOTO_UPLOADED: { icon: Upload, label: "อัพโหลดรูปภาพ", color: "text-blue-500" },
  PHOTO_DELETED: { icon: Trash2, label: "ลบรูปภาพ", color: "text-orange-500" },
  STATUS_CHANGED: { icon: RefreshCw, label: "เปลี่ยนสถานะ", color: "text-purple-500" },
  EVENT_UPDATED: { icon: Settings, label: "แก้ไขกิจกรรม", color: "text-gray-500" },
};

// Aggregate consecutive photo activities from same user within 5 minutes
function aggregateActivities(activities: EventActivityLog[]): AggregatedActivity[] {
  if (activities.length === 0) return [];
  
  const result: AggregatedActivity[] = [];
  let currentGroup: AggregatedActivity | null = null;
  
  for (const activity of activities) {
    const isPhotoAction = activity.action === 'PHOTO_UPLOADED' || activity.action === 'PHOTO_DELETED';
    
    if (!isPhotoAction) {
      // Not a photo action, flush current group and add this one
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push({ ...activity });
      continue;
    }
    
    // It's a photo action - check if we can merge with current group
    if (currentGroup && 
        currentGroup.action === activity.action &&
        currentGroup.userId === activity.userId) {
      // Check time difference (5 minutes = 300000ms)
      const timeDiff = Math.abs(
        new Date(currentGroup.createdAt).getTime() - new Date(activity.createdAt).getTime()
      );
      
      if (timeDiff <= 300000) {
        // Merge into current group
        currentGroup.count = (currentGroup.count || 1) + 1;
        const photoType = (activity.details as Record<string, unknown>)?.type as string;
        if (photoType && currentGroup.photoTypes) {
          if (photoType === 'RAW') currentGroup.photoTypes.RAW++;
          else if (photoType === 'EDITED') currentGroup.photoTypes.EDITED++;
        }
        continue;
      }
    }
    
    // Can't merge - flush current group and start new one
    if (currentGroup) {
      result.push(currentGroup);
    }
    
    const photoType = (activity.details as Record<string, unknown>)?.type as string;
    currentGroup = { 
      ...activity, 
      count: 1,
      photoTypes: { 
        RAW: photoType === 'RAW' ? 1 : 0, 
        EDITED: photoType === 'EDITED' ? 1 : 0 
      }
    };
  }
  
  // Don't forget the last group
  if (currentGroup) {
    result.push(currentGroup);
  }
  
  return result;
}

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

  // Aggregate photo activities
  const aggregatedActivities = useMemo(() => aggregateActivities(activities), [activities]);

  const getActionDetails = (activity: AggregatedActivity) => {
    const config = actionConfig[activity.action] || { 
      icon: History, 
      label: activity.action, 
      color: "text-muted-foreground" 
    };
    
    let details = "";
    
    // For aggregated photo actions, show count
    if (activity.count && activity.count > 1) {
      details = ` ${activity.count} รูป`;
      if (activity.photoTypes) {
        const types: string[] = [];
        if (activity.photoTypes.RAW > 0) types.push(`RAW ${activity.photoTypes.RAW}`);
        if (activity.photoTypes.EDITED > 0) types.push(`แต่งแล้ว ${activity.photoTypes.EDITED}`);
        if (types.length > 0) details += ` (${types.join(', ')})`;
      }
    } else if (activity.details) {
      const d = activity.details as Record<string, unknown>;
      if (d.type) details = ` [${d.type === 'EDITED' ? 'แต่งแล้ว' : d.type}]`;
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
            <span>ความคืบหน้า</span>
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
              ) : aggregatedActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>ยังไม่มีประวัติกิจกรรม</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {aggregatedActivities.map((activity) => {
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
