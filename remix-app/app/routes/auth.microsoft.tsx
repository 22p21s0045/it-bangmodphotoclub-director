import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { authenticator } from "~/auth.server";

export let loader = () => redirect("/auth/login");

export let action = ({ request }: ActionFunctionArgs) => {
  return authenticator.authenticate("microsoft", request);
};
