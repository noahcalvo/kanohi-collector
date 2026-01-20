
"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";


export default function TutorialPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGuest = async () => {
    setLoading(true);
    // First, check if a guest user already exists (cookie present)
    let res = await fetch("/api/me", { method: "GET" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.user.id && data.created_from_guest) {
        router.push("/");
        return;
      }
    }
    // Otherwise, create a new guest user
    res = await fetch("/api/me?guest=1", { method: "POST" });
    if (res.ok) {
      // Force a full reload to ensure cookie is sent
      window.location.href = "/";
    } else {
      alert("Failed to create guest user");
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">Welcome to Kanohi Collector!</h1>
      <p className="mb-6">
        Start your journey by following the tutorial or sign in to your account.
      </p>
      {/* Add onboarding steps, guest creation, and sign-in options here */}
      <button
        className="btn btn-primary mb-2"
        onClick={handleGuest}
        disabled={loading}
      >
        {loading ? "Loading..." : "Continue as Guest"}
      </button>
      <button className="btn btn-secondary" onClick={handleSignIn}>
        Sign In
      </button>
    </main>
  );
}
