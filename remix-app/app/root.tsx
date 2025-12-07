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

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const contextClass: Record<string, string> = {
  success: "bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100 border-green-200 dark:border-green-800",
  error: "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100 border-red-200 dark:border-red-800",
  info: "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 border-blue-200 dark:border-blue-800",
  warning: "bg-orange-50 text-orange-900 dark:bg-orange-900/20 dark:text-orange-100 border-orange-200 dark:border-orange-800",
  default: "bg-background text-foreground border-border",
  dark: "bg-background text-foreground border-border",
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
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName={(context) => 
            contextClass[context?.type || "default"] + 
            " relative flex p-4 min-h-12 rounded-xl justify-between overflow-hidden cursor-pointer shadow-lg border backdrop-blur-md mb-4 items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          }
          bodyClassName={() => "text-sm font-medium flex-1"}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
