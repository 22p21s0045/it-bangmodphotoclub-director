import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
// import { MicrosoftStrategy } from "remix-auth-microsoft";
import { sessionStorage } from "./session.server";

export let authenticator = new (Authenticator as any)(sessionStorage, { sessionKey: "user" });

authenticator.use(
  new FormStrategy(async ({ form }) => {
    let email = form.get("email");
    let password = form.get("password");
    
    // Validate email/password
    // Call backend API to verify credentials
    // For now, mock user
    if (email === "test@example.com" && password === "password") {
        return { id: "1", email: "test@example.com", name: "Test User" };
    }
    
    throw new Error("Invalid credentials");
  }),
  "user-pass"
);

// Microsoft strategy removed

