"use client";

import { useState } from "react";
import { loginAction, signUpAction } from "../actions";
import { ActionForm } from "./ActionForm";

type Mode = "signin" | "signup";

/** Email + password form with a sign-in / sign-up toggle. */
export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("signin");
  const isSignup = mode === "signup";

  return (
    <div>
      <div className="auth-toggle" role="tablist" aria-label="Modo de acceso">
        <button
          type="button"
          role="tab"
          aria-selected={!isSignup}
          onClick={() => setMode("signin")}
        >
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignup}
          onClick={() => setMode("signup")}
        >
          Crear cuenta
        </button>
      </div>

      <ActionForm key={mode} action={isSignup ? signUpAction : loginAction}>
        <input type="hidden" name="next" value={next} />
        <label className="field-label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
        <label className="field-label" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Al menos 6 caracteres"
          minLength={6}
          required
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
        <button type="submit">{isSignup ? "Crear cuenta y entrar" : "Entrar"}</button>
      </ActionForm>
    </div>
  );
}
