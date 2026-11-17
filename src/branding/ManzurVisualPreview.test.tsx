import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ManzurVisualPreview from './ManzurVisualPreview';

vi.mock('./ManzurLandingPage', () => ({ default: () => <h1>Manzur public landing</h1> }));

describe('public visual preview routes', () => {
  it('shows a clearly labeled landing', () => {
    render(<MemoryRouter initialEntries={['/']}><ManzurVisualPreview /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Manzur public landing' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Sin cuentas, pagos ni datos reales');
  });
  it.each(['/login', '/register', '/dashboard', '/payments', '/students', '/pending-approval'])(
    'never renders a credential or personal-data form for %s',
    (path) => {
      const { container } = render(<MemoryRouter initialEntries={[path]}><ManzurVisualPreview /></MemoryRouter>);
      expect(screen.getByRole('heading', { name: 'Acceso a cuentas no habilitado' })).toBeInTheDocument();
      expect(container.querySelector('form, input, textarea')).toBeNull();
      expect(screen.getByRole('link', { name: 'Volver a Manzur Bros' })).toHaveAttribute('href', '/');
    },
  );
});
