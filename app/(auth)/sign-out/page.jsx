"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { clearStoredUser } from "@/lib/authClient";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await axios.post('/api/auth/sign-out');
      } catch {
        // ignore
      } finally {
        clearStoredUser();
        delete axios.defaults.headers.common['x-user-email'];
        if (alive) router.replace('/');
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-foreground">Signing out...</h1>
        <p className="text-muted-foreground mt-2">Redirecting you to the home page.</p>
      </div>
    </div>
  );
}
