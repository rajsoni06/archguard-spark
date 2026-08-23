"use client";

import React, { useCallback, useState } from "react";
import {
  DialogContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { X, Globe, Lock, Mail, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthDialog({
  open,
  mode,
  onOpenChange,
}: {
  open: boolean;
  mode: "login" | "signup";
  onOpenChange: (v: boolean) => void;
}) {
  const { login, register } = useAuth();
  const [view, setView] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  React.useEffect(() => setView(mode), [mode]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    reset();
  }, [onOpenChange, reset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) return setError("Email is required.");
    if (!password) return setError("Password is required.");
    if (view === "signup") {
      if (!name) return setError("Name is required.");
      if (password !== confirm) return setError("Passwords do not match.");
    }
    setLoading(true);
    try {
      if (view === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      handleClose();
    } catch (err: any) {
      setError(err?.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="auth-dialog max-w-md bg-surface p-6 shadow-2xl border-border rounded-2xl">
        <DialogHeader className="auth-dialog-header text-center sm:text-left">
          <div className="mb-3 flex items-center justify-center gap-2.5 sm:justify-start">
            <img
              src="/ArchGuard_Logo.png"
              alt="ArchGuard AI"
              className="size-9 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">ArchGuard AI</span>
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
            {view === "login" ? "Sign in to ArchGuard AI" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1.5">
            {view === "login"
              ? "Access your dashboard and start designing architectures."
              : "Join ArchGuard AI to design and review architectures securely."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="auth-form mt-5 grid gap-3">
          {view === "signup" && (
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
              <User className="size-4.5 text-muted-foreground shrink-0" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>
          )}

          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
            <Mail className="size-4.5 text-muted-foreground shrink-0" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              type="email"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
            <Lock className="size-4.5 text-muted-foreground shrink-0" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
          </label>

          {view === "signup" && (
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3.5 py-2.5 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
              <Lock className="size-4.5 text-muted-foreground shrink-0" />
                <input
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  type={showConfirm ? "text" : "password"}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((visible) => !visible)}
                  aria-label={showConfirm ? "Hide confirmed password" : "Show confirmed password"}
                  className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            </label>
          )}

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-[13px] font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="mt-4 grid gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Please wait..." : view === "login" ? "Sign In" : "Create Account"}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => alert("Google OAuth placeholder")}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <Globe className="mr-2 size-4" />
              Google
            </button>
          </div>

          <div className="mt-2 text-center text-sm text-muted-foreground">
            {view === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("signup")}
                  className="font-medium text-primary hover:underline"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setView("login")}
                  className="font-medium text-primary hover:underline"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </form>

        <DialogFooter />
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
