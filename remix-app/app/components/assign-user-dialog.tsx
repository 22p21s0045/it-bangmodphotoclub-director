import { useState, useEffect } from "react";
import { useFetcher } from "@remix-run/react";
import { Search, UserPlus, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { apiClient } from "~/lib/api-client";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

interface AssignUserDialogProps {
  eventId: string;
  joinedUserIds: string[];
  onAssign: () => void;
}

export function AssignUserDialog({ eventId, joinedUserIds, onAssign }: AssignUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const fetcher = useFetcher();

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // In a real app, we should have a search endpoint. 
      // For now, we'll fetch all and filter client-side as per current backend capabilities.
      const res = await apiClient.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = (userId: string) => {
    fetcher.submit(
      { userId, eventId },
      { method: "post", action: `/api/events/join` }
    );
  };

  // Handle response
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
        if (fetcher.data.error) {
            alert(fetcher.data.error); // Simple alert for now, can be improved with toast
        } else {
            onAssign();
        }
    }
  }, [fetcher.state, fetcher.data, onAssign]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          มอบหมายงาน
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>มอบหมายงานให้สมาชิก</DialogTitle>
          <DialogDescription>
            ค้นหาและเลือกสมาชิกที่ต้องการมอบหมายให้เข้าร่วมกิจกรรมนี้
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาชื่อ หรือ อีเมล..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex justify-center p-4">กำลังโหลด...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">ไม่พบสมาชิก</div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => {
                  const isJoined = joinedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name || "User"}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>
                      {isJoined ? (
                        <Button variant="ghost" size="sm" disabled className="text-green-600">
                          <Check className="w-4 h-4 mr-1" /> เข้าร่วมแล้ว
                        </Button>
                      ) : (
                        <Button 
                            size="sm" 
                            onClick={() => handleAssign(user.id)}
                            disabled={fetcher.state !== "idle"}
                        >
                          เลือก
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
