import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Surface,
  Stat,
  Section,
  EmptyState,
  InlineError,
  Kbd,
  Spinner,
  Sparkline,
  BarStack,
  DonutGauge,
} from '../components/ui';

describe('v2 primitives', () => {
  it('Surface renders children with given variant class', () => {
    render(
      <Surface variant="strike" data-testid="surface">
        <span>hello</span>
      </Surface>
    );
    const node = screen.getByTestId('surface');
    expect(node).toBeInTheDocument();
    expect(node.className).toMatch(/strike-500/);
  });

  it('Stat shows label and value', () => {
    render(<Stat label="Active Students" value={120} delta={8} staticValue />);
    expect(screen.getByText('Active Students')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('+8')).toBeInTheDocument();
  });

  it('Section renders title and children', () => {
    render(
      <Section title="Today">
        <p>body</p>
      </Section>
    );
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('EmptyState renders title and description', () => {
    render(<EmptyState title="No data" description="Nothing here yet" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('InlineError renders alert with retry', () => {
    render(<InlineError message="Boom" onRetry={() => {}} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('Kbd renders inside a <kbd> element', () => {
    render(<Kbd>K</Kbd>);
    expect(screen.getByText('K').tagName).toBe('KBD');
  });

  it('Spinner renders with role status', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('Sparkline renders an SVG when data has points', () => {
    const { container } = render(<Sparkline data={[1, 2, 3, 4]} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('BarStack renders an svg with segments', () => {
    const { container } = render(
      <BarStack
        data={[
          { label: 'Paid', value: 70, color: '#0f0' },
          { label: 'Pending', value: 30, color: '#f00' },
        ]}
      />
    );
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('DonutGauge renders svg', () => {
    const { container } = render(<DonutGauge value={0.6} />);
    expect(container.querySelector('svg')).not.toBeNull();
  });
});
