"use client";

import { type ReactNode, useActionState, useEffect, useRef } from "react";
import type { ActionState } from "../actions";

interface Props {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  resetOnSuccess?: boolean;
}

/** Form bound to a server action that shows the action's error or success message. */
export function ActionForm({ action, children, confirm, className, resetOnSuccess }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValues = useRef<FormData | null>(null);
  useEffect(() => {
    if (resetOnSuccess && state.error && submittedValues.current) {
      for (const [name, value] of submittedValues.current.entries()) {
        const field = formRef.current?.elements.namedItem(name);
        if (field instanceof HTMLInputElement && typeof value === "string") field.value = value;
      }
    }
    if (resetOnSuccess && state.success) {
      formRef.current?.reset();
      formRef.current?.querySelector<HTMLInputElement>('input:not([type="hidden"])')?.focus();
    }
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
        else submittedValues.current = new FormData(event.currentTarget);
      }}
    >
      <fieldset disabled={pending} className="bare" aria-busy={pending}>
        {children}
      </fieldset>
      <div role="status" aria-live="polite" aria-atomic="true">
        {pending ? <p className="pending-status">Guardando…</p> : <>
          {state.error && <p className="feedback error">{state.error}</p>}
          {state.success && <p className="feedback success">{state.success}</p>}
        </>}
      </div>
    </form>
  );
}
