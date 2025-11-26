import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  // Fetch events from backend
  // const res = await fetch('http://localhost:3000/events');
  // const events = await res.json();
  const events = [
      { id: '1', title: 'Photo Walk 2024', date: '2024-12-01' },
      { id: '2', title: 'Portrait Workshop', date: '2024-12-15' }
  ];
  return json({ events });
}

export default function Events() {
  const { events } = useLoaderData<typeof loader>();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded shadow hover:shadow-lg transition">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <p className="text-gray-600">{event.date}</p>
            <a href={`/events/${event.id}/upload`} className="mt-4 inline-block text-blue-600 hover:underline">Upload Photos</a>
          </div>
        ))}
      </div>
    </div>
  );
}
