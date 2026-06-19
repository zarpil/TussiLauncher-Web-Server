"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al iniciar sesión");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid-bg min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#060210] p-4">
      {/* Background glow effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,105,180,0.08),transparent_70%)] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle,rgba(255,20,147,0.08),transparent_70%)] pointer-events-none" />

      {/* Login Card */}
      <div className="glass-card w-full max-w-[400px] p-8 md:p-10 text-center relative z-10">
        {/* Logo container */}
        <div className="w-[100px] h-[100px] mx-auto mb-6 rounded-2xl overflow-hidden border border-[var(--nexus-border)] shadow-[0_0_25px_rgba(255,105,180,0.3)]">
          <img src="/logo.png" alt="Tussi Logo" className="w-full h-full object-cover" />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          <span className="bg-gradient-to-r from-[var(--nexus-pink)] to-[var(--nexus-accent)] bg-clip-text text-transparent">
            Tussi Panel
          </span>
        </h1>
        <p className="text-xs text-[var(--nexus-muted)] mb-8">
          Acceso privado para administración del servidor
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="text-left">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--nexus-muted)] block mb-2">
              Contraseña de administrador
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="nexus-input w-full text-center tracking-widest text-lg py-2.5 focus:border-[var(--nexus-pink)]"
              disabled={loading}
              required
            />
          </div>

          {error && (
            <div className="text-xs font-semibold text-[var(--nexus-red)] bg-[rgba(255,68,102,0.1)] border border-[rgba(255,68,102,0.2)] rounded-lg py-2 px-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-neon w-full py-3 mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(255,105,180,0.35)]"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              "Ingresar al Panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
