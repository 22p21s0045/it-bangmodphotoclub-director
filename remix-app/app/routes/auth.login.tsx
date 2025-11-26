import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { authenticator } from "~/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  return await authenticator.authenticate("user-pass", request, {
    successRedirect: "/",
    failureRedirect: "/auth/login",
  });
}

export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Form method="post" className="w-full max-w-md space-y-4 p-8 border rounded-lg shadow">
        <h1 className="text-2xl font-bold">Login</h1>
        <div>
            <label className="block text-sm font-medium">Email</label>
            <input type="email" name="email" className="w-full border p-2 rounded" required />
        </div>
        <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" name="password" className="w-full border p-2 rounded" required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Login</button>
      </Form>
    </div>
  );
}
