import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { QueryProvider } from "~/providers/query-provider";
import { Layout } from "~/components/layout";
import styles from "~/styles/tailwind.css?url";
import { sessionStorage } from "~/session.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai+Looped:wght@100;200;300;400;500;600;700;800;900&display=swap" },
];

export const loader = async ({ request }: { request: Request }) => {
  const session = await sessionStorage.getSession(request.headers.get("Cookie"));
  const user = session.get("user");
  console.log("Root loader - Cookie:", request.headers.get("Cookie"));
  console.log("Root loader - User from session:", user);
  return { user };
};

export default function App() {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-noto-thai">
        <QueryProvider>
          <Layout>
            <Outlet />
          </Layout>
        </QueryProvider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
