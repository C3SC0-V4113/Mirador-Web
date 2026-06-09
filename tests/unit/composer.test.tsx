import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Composer } from '@/components/chat/composer';

describe('Composer', () => {
  it('renders the message textarea', () => {
    render(<Composer />);

    expect(screen.getByLabelText('Escribe tu mensaje')).toBeDefined();
  });
});
