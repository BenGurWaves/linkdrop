"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Nav from "./nav";

export default function AuthNav() {
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { email: data.user.email ?? "" } : null);
    });
  }, []);

  // While loading, render nav without user (shows sign in by default)
  if (user === undefined) return <Nav />;

  return <Nav user={user} />;
}
