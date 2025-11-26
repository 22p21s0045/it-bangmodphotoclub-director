import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "IT Bangmod Photo Club" },
    { name: "description", content: "Welcome to IT Bangmod Photo Club!" },
  ];
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">IT Bangmod Photo Club</h1>
        <p className="mt-4 text-lg text-gray-600">Welcome to the club!</p>
      </div>
    </div>
  );
}
