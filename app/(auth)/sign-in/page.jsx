"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

const allowedEmailDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
]);

function getEmailError(value) {
  if (typeof value !== "string") return "Email is required";
  const email = value.trim();
  if (!email) return "Email is required";
  if (/\s/.test(email)) return "Email cannot contain spaces";
  if (email.length > 254) return "Email is too long";

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return "Email must contain a single @";

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1).toLowerCase();

  if (!/^[A-Za-z][A-Za-z0-9._+-]*$/.test(local)) {
    return "Email username must start with a letter and use valid characters";
  }
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return "Email username has invalid dots";
  }

  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return "Email domain has invalid characters";
  if (domain.startsWith("-") || domain.endsWith("-") || domain.includes("..")) {
    return "Email domain is invalid";
  }

  const labels = domain.split(".");
  if (labels.length < 2) return "Email domain must include a TLD";
  if (labels.some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
    return "Email domain labels are invalid";
  }

  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,24}$/.test(tld)) return "Email is invalid";

  if (!allowedEmailDomains.has(domain)) {
    return "Use correct Email Domain ";
  }

  return null;
}

function getPasswordError(value) {
  if (typeof value !== "string") return "Password is required";
  if (!value) return "Password is required";
  const nonSpaceCount = value.replace(/\s/g, "").length;
  if (nonSpaceCount < 8) return "Password must be at least 8 characters (spaces don't count)";
  return null;
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const emailError = useMemo(() => getEmailError(email), [email]);
  const passwordError = useMemo(() => getPasswordError(password), [password]);

  const canSubmit = useMemo(() => {
    return !emailError && !passwordError && !submitting;
  }, [emailError, passwordError, submitting]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (emailError || passwordError) {
      setError(emailError || passwordError);
      return;
    }
    setSubmitting(true);
    try {
      await axios.post("/api/auth/sign-in", {
        email: email.trim().toLowerCase(),
        password,
      });
      router.push("/workspace");
    } catch (err) {
      const msg = err?.response?.data?.error;
      setError(typeof msg === 'string' ? msg : "Sign in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-background">
      <div className="w-full max-w-[1024px] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[600px] border border-border">
        <div
          className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative p-12 flex-col justify-between"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBI8NhQb5SosO-82Un71X7rZNsqHfFBdZQwhQPRd2y_FMZC8aeFplF_UmXKoTqkZ-D2bJm8a5WRaECjCH8dyCeRPRwbiggMbWG9kOamC8PoapepIb54nMCU4s--o7Ka4KD18msTHpY4wkX7HXBhU83cw0KzKp9ZRaVPe5aVZU67G2ZZXVaAMqank846Im-B7XHuaDcI9PEySaGNzeLOuIk6-J_pBe78-dtiIsM7eNTg4aJooQKJTMp7JBKpBjRsQ8rogPXWozkwvdi6')",
          }}
        >
          <div className="absolute inset-0 bg-sidebar-primary/40 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white">
              <div className="size-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white" size={20} />
              </div>
              <h2 className="text-white text-xl font-bold tracking-tight">Learnify</h2>
            </div>
          </div>

          <div className="relative z-10 text-white">
            <h3 className="text-3xl font-bold leading-tight mb-4">Master new skills anytime, anywhere.</h3>
            <p className="text-white/80 text-base leading-relaxed max-w-sm">
              Join a community of millions of learners and start your journey towards excellence today.
            </p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative bg-card">
          <div className="lg:hidden flex items-center gap-2 text-foreground mb-8">
            <div className="size-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="text-sidebar-primary-foreground" size={20} />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Learnify</h2>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2" htmlFor="email">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="text-muted-foreground" size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-3.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-sidebar-primary focus:border-transparent transition-all outline-none"
                />
              </div>
              {emailError && <div className="text-xs text-destructive mt-2">{emailError}</div>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="text-muted-foreground" size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-sidebar-primary focus:border-transparent transition-all outline-none"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <div className="text-xs text-destructive mt-2">{passwordError}</div>}
            </div>

            {error && <div className="text-sm text-destructive">{error}</div>}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-sidebar-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sidebar-primary-foreground font-bold py-3.5 px-4 rounded-lg transition-colors shadow-lg flex justify-center items-center gap-2"
            >
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?
              <Link className="font-bold text-sidebar-primary hover:underline ml-1" href="/sign-up">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
