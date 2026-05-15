import { useState, useEffect } from "react";
import type { UserProfile } from "../types";
import { useAuthStore } from "@/store/authStore";

export function useProfile(id?: string) {
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock
    setTimeout(() => {
      if (user) {
        setProfile({ ...user, phone: "+91 9876543210", joinDate: "2023-01-15T00:00:00Z" });
      }
      setIsLoading(false);
    }, 500);
  }, [user, id]);

  return { profile, isLoading };
}
