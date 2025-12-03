import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
// import { MicrosoftStrategy } from "remix-auth-microsoft";
import { sessionStorage } from "./session.server";

export let authenticator = new (Authenticator as any)(sessionStorage, { sessionKey: "user" });

authenticator.use(
  new FormStrategy(async ({ form }) => {
    let email = form.get("email");
    let password = form.get("password");
    
    try {
        const backendUrl = process.env.BACKEND_URL || "http://localhost:3000";
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

