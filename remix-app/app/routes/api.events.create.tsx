import { json, ActionFunctionArgs } from "@remix-run/node";
import axios from "axios";

// Loader for data fetching (returns empty object)
export async function loader() {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const location = formData.get("location");
  const eventDatesJson = formData.get("eventDates");

  const joinLimit = formData.get("joinLimit");
  const submissionDeadline = formData.get("submissionDeadline");

  const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";

  try {
    // Parse eventDates from JSON
    const eventDates = eventDatesJson ? JSON.parse(eventDatesJson.toString()) : [];
    
    await axios.post(`${backendUrl}/events`, {
      title,
      description,
      location,
      eventDates,
      joinLimit: joinLimit ? parseInt(joinLimit.toString()) : 0,
      submissionDeadline,
    });
    return json({ success: true });
  } catch (error) {
    return json({ error: "ไม่สามารถสร้างกิจกรรมได้" }, { status: 400 });
  }
}
