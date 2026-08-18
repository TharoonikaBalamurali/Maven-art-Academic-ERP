import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { Tabs } from './Tabs';

/**
 * These primitives are required by §34 but had no page using them after Day 1,
 * so they were untested. Overlays and tab panels are exactly the components
 * that break silently, hence direct coverage of their accessible behaviour.
 */

describe('Modal', () => {
  it('is not rendered to the user until opened', () => {
    renderWithProviders(
      <Modal open={false} onClose={vi.fn()} title="Edit student">
        <p>form body</p>
      </Modal>,
    );

    expect(screen.getByText('form body')).not.toBeVisible();
  });

  it('exposes an accessible name and description when open', () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()} title="Edit student" description="Change the record.">
        <p>form body</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAccessibleName('Edit student');
    expect(dialog).toHaveAccessibleDescription('Change the record.');
  });

  it('closes via the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <Modal open onClose={onClose} title="Edit student">
        <p>form body</p>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('reports closing when the dialog is dismissed natively (Escape)', async () => {
    const onClose = vi.fn();
    renderWithProviders(
      <Modal open onClose={onClose} title="Edit student">
        <p>form body</p>
      </Modal>,
    );

    // Escape fires the element's `close` event; asserting on that event is
    // what proves our handler is wired to the platform behaviour.
    const dialog = screen.getByRole('dialog') as HTMLDialogElement;
    dialog.close();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});

describe('ConfirmDialog', () => {
  it('reports confirm and cancel distinctly', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    renderWithProviders(
      <ConfirmDialog
        open
        title="Delete student"
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('blocks both actions while the operation is in flight', () => {
    renderWithProviders(
      <ConfirmDialog
        open
        loading
        title="Delete student"
        description="This cannot be undone."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
  });
});

function TabsHarness() {
  const [active, setActive] = useState('personal');
  return (
    <Tabs
      label="Student details"
      activeId={active}
      onChange={setActive}
      tabs={[
        { id: 'personal', label: 'Personal', content: <p>personal panel</p> },
        { id: 'academic', label: 'Academic', content: <p>academic panel</p> },
        { id: 'fees', label: 'Fees', content: <p>fees panel</p> },
      ]}
    />
  );
}

describe('Tabs', () => {
  it('shows only the selected panel', () => {
    renderWithProviders(<TabsHarness />);

    expect(screen.getByText('personal panel')).toBeInTheDocument();
    expect(screen.queryByText('academic panel')).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Personal' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches panels on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TabsHarness />);

    await user.click(screen.getByRole('tab', { name: 'Fees' }));

    expect(screen.getByText('fees panel')).toBeInTheDocument();
    expect(screen.queryByText('personal panel')).not.toBeInTheDocument();
  });

  it('implements roving tabindex so Tab enters the list once', () => {
    renderWithProviders(<TabsHarness />);

    expect(screen.getByRole('tab', { name: 'Personal' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Academic' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves between tabs with the arrow keys (WAI-ARIA tabs pattern)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TabsHarness />);

    screen.getByRole('tab', { name: 'Personal' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Academic' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Fees' })).toHaveAttribute('aria-selected', 'true');

    // Wraps around from the last tab.
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Personal' })).toHaveAttribute('aria-selected', 'true');
  });

  it('links every tab to its panel', () => {
    renderWithProviders(<TabsHarness />);

    const tab = screen.getByRole('tab', { name: 'Personal' });
    const panel = screen.getByRole('tabpanel');
    expect(tab).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });
});
