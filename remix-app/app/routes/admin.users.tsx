import { json, defer, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link, Form, Await } from "@remix-run/react";
import type { User } from "~/types";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "~/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "~/components/ui/dialog";
import { MoreHorizontal, Trash, UserCog, UserPlus, Ban, CheckCircle } from "lucide-react";
import axios from "axios";
import { sessionStorage } from "~/session.server";
import { useState, useEffect, Suspense } from "react";
import { UserListSkeleton } from "~/components/skeletons";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  
  if (!user || user.role !== "ADMIN") {
    throw new Response("Unauthorized", { status: 401 });
  }

  let backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  backendUrl = backendUrl.replace("localhost", "127.0.0.1");
  console.log("Fetching users from:", backendUrl);
  
  const usersPromise = axios.get(`${backendUrl}/users`)
    .then(res => res.data)
    .catch(error => {
      console.error("Error fetching users:", error);
      return [];
    });

  return defer({ users: usersPromise, currentUser: user });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  let backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  backendUrl = backendUrl.replace("localhost", "127.0.0.1");

  if (intent === "delete") {
    const userId = formData.get("userId");
    await axios.delete(`${backendUrl}/users/${userId}`);
  } else if (intent === "updateRole") {
    const userId = formData.get("userId");
    const newRole = formData.get("role");
    await axios.patch(`${backendUrl}/users/${userId}`, { role: newRole });
  } else if (intent === "toggleStatus") {
    const userId = formData.get("userId");
    const isActive = formData.get("isActive") === "true";
    await axios.patch(`${backendUrl}/users/${userId}`, { isActive });
  } else if (intent === "create") {
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");
    const role = formData.get("role");
    
    try {
      await axios.post(`${backendUrl}/users`, {
        name,
        email,
        password,
        role,
        isActive: true
      });
    } catch (error) {
      return json({ error: "Failed to create user" }, { status: 400 });
    }
  }

  return json({ success: true });
}

export default function AdminUsers() {
  const { users, currentUser } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setAddUserDialogOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    fetcher.submit(
      { intent: "toggleStatus", userId: user.id, isActive: (!user.isActive).toString() },
      { method: "post" }
    );
  };

  const confirmDelete = () => {
    if (selectedUser) {
      fetcher.submit(
        { intent: "delete", userId: selectedUser.id },
        { method: "post" }
      );
      setDeleteDialogOpen(false);
    }
  };

  const confirmRoleChange = (role: "USER" | "ADMIN") => {
    if (selectedUser) {
      fetcher.submit(
        { intent: "updateRole", userId: selectedUser.id, role },
        { method: "post" }
      );
      setRoleDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <Suspense fallback={<span>...</span>}>
              <Await resolve={users}>
                {(resolvedUsers) => `ทั้งหมด ${resolvedUsers.length} คน`}
              </Await>
            </Suspense>
          </div>
          <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                เพิ่มผู้ใช้งาน
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
                <DialogDescription>
                  กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่
                </DialogDescription>
              </DialogHeader>
              <fetcher.Form method="post" className="space-y-4">
                <input type="hidden" name="intent" value="create" />
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input id="name" name="name" required placeholder="สมชาย ใจดี" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input id="email" name="email" type="email" required placeholder="somchai@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <select 
                    id="role" 
                    name="role" 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="USER">สมาชิก</option>
                    <option value="ADMIN">ผู้ดูแลระบบ</option>
                  </select>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={fetcher.state !== "idle"}>
                    {fetcher.state !== "idle" ? "กำลังสร้าง..." : "สร้างบัญชี"}
                  </Button>
                </DialogFooter>
              </fetcher.Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Suspense fallback={<UserListSkeleton />}>
        <Await resolve={users}>
          {(resolvedUsers) => (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Avatar</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>บทบาท</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resolvedUsers.map((user: User, index: number) => (
                    <TableRow 
                      key={user.id} 
                      className={`
                        ${!user.isActive ? "bg-muted/50" : ""} 
                        ${user.isActive && index % 2 === 0 ? "bg-muted/30" : "bg-card"}
                        hover:bg-muted transition-colors
                      `}
                    >
                      <TableCell>
                        <Avatar>
                          <AvatarImage src={user.avatar ?? undefined} />
                          <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.name || "ไม่ระบุชื่อ"}
                        {!user.isActive && <span className="ml-2 text-xs text-red-500">(ระงับการใช้งาน)</span>}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <span className="inline-flex items-center text-green-600 text-xs font-medium">
                            <CheckCircle className="w-3 h-3 mr-1" /> ปกติ
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-600 text-xs font-medium">
                            <Ban className="w-3 h-3 mr-1" /> ถูกระงับ
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "ADMIN" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300" : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                        }`}>
                          {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "สมาชิก"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-accent cursor-pointer">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user)} 
                                className="cursor-pointer hover:bg-accent transition-colors"
                              >
                                <UserCog className="mr-2 h-4 w-4" />
                                เปลี่ยนบทบาท
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleToggleStatus(user)} 
                                className="cursor-pointer hover:bg-accent transition-colors"
                              >
                                {user.isActive ? (
                                  <>
                                    <Ban className="mr-2 h-4 w-4 text-orange-500" />
                                    ระงับการใช้งาน
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                    คืนสิทธิ์การใช้งาน
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => handleDelete(user)}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                ลบผู้ใช้งาน
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Await>
      </Suspense>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งาน {selectedUser?.name}? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={confirmDelete}>ลบผู้ใช้งาน</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เปลี่ยนบทบาทผู้ใช้งาน</DialogTitle>
            <DialogDescription>
              เลือกบทบาทใหม่สำหรับ {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-4 py-4">
            <Button 
              variant={selectedUser?.role === "USER" ? "default" : "outline"}
              onClick={() => confirmRoleChange("USER")}
              className="w-32"
            >
              สมาชิก
            </Button>
            <Button 
              variant={selectedUser?.role === "ADMIN" ? "default" : "outline"}
              onClick={() => confirmRoleChange("ADMIN")}
              className="w-32"
            >
              ผู้ดูแลระบบ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
