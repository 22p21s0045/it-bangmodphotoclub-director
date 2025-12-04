import { json, ActionFunctionArgs } from "@remix-run/node";
import axios from "axios";
import { authenticator } from "~/auth.server";
import { sessionStorage } from "~/session.server";

export async function action({ request }: ActionFunctionArgs) {
  // Get user from session manually since authenticator might not be working as expected with v4
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");

  if (!user) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const eventId = formData.get("eventId");

  if (!eventId) {
    return json({ error: "Event ID is required" }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  try {
    await axios.post(`${backendUrl}/events/${eventId}/join`, {
      userId: user.id,
    });
    return json({ success: true });
  } catch (error) {
    console.error("Failed to join event", error);
    return json({ error: "Failed to join event" }, { status: 500 });
  }
}
