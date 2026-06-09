import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/auth/login-form';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe('LoginForm', () => {
  it('renders the email and password fields', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('Correo')).toBeDefined();
    expect(screen.getByLabelText('Contraseña')).toBeDefined();
  });

  it('toggles password visibility with the eye button', () => {
    render(<LoginForm />);

    const password = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(password.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(password.type).toBe('password');
  });
});
