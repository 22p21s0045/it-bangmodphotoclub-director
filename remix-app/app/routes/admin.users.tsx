import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher, Link } from "@remix-run/react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
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
import { MoreHorizontal, Trash, UserCog } from "lucide-react";
import axios from "axios";
import { sessionStorage } from "~/session.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  
  if (!user || user.role !== "ADMIN") {
    throw new Response("Unauthorized", { status: 401 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
  const res = await axios.get(`${backendUrl}/users`);
  
  return json({ users: res.data, currentUser: user });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId");
  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  if (intent === "delete") {
    await axios.delete(`${backendUrl}/users/${userId}`);
  } else if (intent === "updateRole") {
    const newRole = formData.get("role");
    await axios.patch(`${backendUrl}/users/${userId}`, { role: newRole });
  }

  return json({ success: true });
}

export default function AdminUsers() {
  const { users, currentUser } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleDelete = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = (user: any) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
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
        <div className="text-sm text-muted-foreground">
          ทั้งหมด {users.length} คน
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>ชื่อ</TableHead>
              <TableHead>อีเมล</TableHead>
              <TableHead>บทบาท</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name || "ไม่ระบุชื่อ"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                  }`}>
                    {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "สมาชิก"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {user.id !== currentUser.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>การจัดการ</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                          <UserCog className="mr-2 h-4 w-4" />
                          เปลี่ยนบทบาท
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 focus:bg-red-50"
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
