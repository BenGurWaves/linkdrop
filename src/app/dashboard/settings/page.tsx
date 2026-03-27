"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function SettingsRedirect() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    router.replace(
      `/dashboard/editor${sp.get("page") ? `?page=${sp.get("page")}` : ""}`
    );
  }, [router, sp]);

  return null;
}
