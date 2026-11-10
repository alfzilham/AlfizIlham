'use client';

import { useActionState, useState } from 'react';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { login } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: '' });
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      <Field label="Username" name="username" autoComplete="username" required icon={<User />} placeholder="Your username" />
      <Field
        label="Password"
        name="password"
        type={show ? 'text' : 'password'}
        autoComplete="current-password"
        required
        icon={<Lock />}
        placeholder="Your password"
        end={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="flex size-10 items-center justify-center rounded-full text-muted hover:text-fg"
          >
            {show ? <EyeOff className="size-[18px]" aria-hidden="true" /> : <Eye className="size-[18px]" aria-hidden="true" />}
          </button>
        }
      />
      {state.error && (
        <p role="alert" className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" loading={pending} className="mt-1 w-full">
        {pending ? 'Signing in' : 'Sign in'}
      </Button>
    </form>
  );
}
