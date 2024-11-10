// app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <div className="space-y-4">
        <button
          onClick={() => router.push("/local")}
          className="block w-48 bg-blue-500"
        >
          Local Game
        </button>
        <button
          onClick={() => router.push("/online")}
          className="block w-48 bg-green-500"
        >
          Online Game
        </button>
      </div>
    </div>
  );
}
