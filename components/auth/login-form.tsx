'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { Brand } from '@/components/brand/brand';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';

import type { FormEvent } from 'react';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      redirect: false,
    });

    if (result?.error) {
      setError('Correo o contraseña inválidos.');
      setPending(false);
      return;
    }

    router.push('/chat');
    router.refresh();
  }

  const invalid = error ? true : undefined;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="justify-items-center gap-4 text-center">
        <Brand.Root className="gap-3">
          <Brand.Icon className="size-6" />
          <Brand.Wordmark className="text-lg" />
        </Brand.Root>
        <CardTitle>Inicia sesión</CardTitle>
        <CardDescription>Accede a tu asistente ejecutivo Mirador.</CardDescription>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={(event) => void handleSubmit(event)}>
          <FieldGroup>
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ceo@empresa.com"
                required
                aria-invalid={invalid}
              />
            </Field>
            <Field data-invalid={invalid}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  aria-invalid={invalid}
                  className="[&::-ms-clear]:hidden [&::-ms-reveal]:hidden"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <FieldError>{error}</FieldError>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="login-form" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Spinner data-icon="inline-start" />
              Ingresando…
            </>
          ) : (
            'Ingresar'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
