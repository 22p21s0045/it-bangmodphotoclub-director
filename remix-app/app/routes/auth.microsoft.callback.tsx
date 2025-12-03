import { LoaderFunctionArgs, redirect } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export let loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    await authenticator.authenticate("microsoft", request);
    return redirect("/");
  } catch (error) {
    if (error instanceof Response) throw error;
    return redirect("/auth/login");
  }
};
