import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Home from '@/app/page';

describe('Home page smoke test', () => {
  it('renders a heading', () => {
    render(<Home />);

    expect(screen.getByRole('heading', { level: 1 })).toBeDefined();
  });
});
