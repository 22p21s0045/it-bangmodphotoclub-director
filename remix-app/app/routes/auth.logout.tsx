import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { sessionStorage } from "~/session.server";

export async function action({ request }: ActionFunctionArgs) {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  
  return redirect("/auth/login", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(session),
    },
  });
}

export async function loader() {
  return redirect("/");
}
