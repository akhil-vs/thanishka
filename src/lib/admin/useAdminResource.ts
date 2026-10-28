"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "./client";

export function useAdminResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminFetch<T>(path)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError("");
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Request failed");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  return {
    data,
    error,
    setError,
    reload: () => setVersion((v) => v + 1),
  };
}
