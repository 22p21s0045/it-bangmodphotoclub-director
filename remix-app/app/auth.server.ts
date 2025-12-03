import { Authenticator } from "remix-auth";
import { FormStrategy } from "remix-auth-form";
import { MicrosoftStrategy } from "remix-auth-microsoft";
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

authenticator.use(
  new MicrosoftStrategy(
    {
      clientId: process.env.MICROSOFT_CLIENT_ID || "",
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || "",
      redirectURI: "http://localhost:5173/auth/microsoft/callback",
      tenantId: process.env.MICROSOFT_TENANT_ID || "common",
      scope: "openid profile email",
      prompt: "select_account",
    } as any,
    async (args: any) => {
      const profile = args.profile;
      // Here you would find or create the user in your database
      return {
        id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
      };
    }
  )
);
