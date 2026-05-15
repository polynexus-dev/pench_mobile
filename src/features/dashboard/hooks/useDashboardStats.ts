import { useState, useEffect } from "react";

export function useDashboardStats(role: string) {
  const [stats, setStats] = useState({ totalStudents: 0, averageAttendance: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock fetch
    setTimeout(() => {
      setStats({ totalStudents: 1250, averageAttendance: 85.5 });
      setIsLoading(false);
    }, 1000);
  }, [role]);

  return { stats, isLoading };
}
