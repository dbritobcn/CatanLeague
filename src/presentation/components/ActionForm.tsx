"use client";

import { type ReactNode, useActionState } from "react";
import type { ActionState } from "../actions";

interface Props {
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode;
  confirm?: string;
  className?: string;
}

/** Form bound to a server action that shows the action's error or success message. */
export function ActionForm({ action, children, confirm, className }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      <fieldset disabled={pending} className="bare">
        {children}
      </fieldset>
      {state.error && <p className="feedback error">{state.error}</p>}
      {state.success && <p className="feedback success">{state.success}</p>}
    </form>
  );
}
