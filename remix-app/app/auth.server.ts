import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
// import { MicrosoftStrategy } from "remix-auth-microsoft";
import { sessionStorage } from "./session.server";

// @ts-expect-error - remix-auth v4 types seem to be mismatching with implementation
console.log("Initializing Authenticator...");
console.log("Session Storage:", sessionStorage);
export const authenticator = new Authenticator(sessionStorage, { sessionKey: "user" });
console.log("Authenticator initialized:", authenticator);

authenticator.use(
  new FormStrategy(async ({ form }) => {
    let email = form.get("email");
    let password = form.get("password");
    
    try {
        let backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
        backendUrl = backendUrl.replace("localhost", "127.0.0.1");
        const response = await fetch(`${backendUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Login API error:", response.status, text);
            throw new Error("Invalid credentials");
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.error("Login failed:", error);
        throw new Error("Invalid credentials");
    }
  }),
  "user-pass"
);

// Microsoft strategy removed

