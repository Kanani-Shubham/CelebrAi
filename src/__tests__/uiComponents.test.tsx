import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConfirmDialog, Tabs, EmptyState, ToastContainer } from '../components/ui';
import { toast } from '../components/ui/toast';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

function ProblematicChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test crash boundary error');
  }
  return <div>Normal Content</div>;
}

describe('CelebrAI Core UI Component Suite', () => {
  describe('ErrorBoundary Component', () => {
    it('renders normal children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>All Good</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('All Good')).toBeInTheDocument();
    });

    it('catches crashes and renders elegant fallback UI with reload button', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ProblematicChild shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/Test crash boundary error/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

      spy.mockRestore();
    });
  });

  describe('ConfirmDialog Component', () => {
    it('renders dialog when open is true and fires callbacks', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const { rerender } = render(
        <ConfirmDialog
          open={false}
          title="Delete Event"
          message="Are you sure you want to delete this event?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );

      expect(screen.queryByText('Delete Event')).not.toBeInTheDocument();

      rerender(
        <ConfirmDialog
          open={true}
          title="Delete Event"
          message="Are you sure you want to delete this event?"
          onConfirm={onConfirm}
          onCancel={onCancel}
          confirmLabel="Yes, Delete"
        />
      );

      expect(screen.getByText('Delete Event')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: /yes, delete/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tabs Component', () => {
    function TabWrapper() {
      const [activeTab, setActiveTab] = useState('overview');
      return (
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'tasks', label: 'Tasks', count: 5 },
            { id: 'budget', label: 'Budget' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
      );
    }

    it('renders tabs with badge counts and switches active tab on click', () => {
      render(<TabWrapper />);

      const overviewTab = screen.getByRole('tab', { name: /overview/i });
      const tasksTab = screen.getByRole('tab', { name: /tasks/i });

      expect(overviewTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('(5)')).toBeInTheDocument();

      fireEvent.click(tasksTab);
      expect(tasksTab).toHaveAttribute('aria-selected', 'true');
      expect(overviewTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('EmptyState Component', () => {
    it('renders message, title, and action button', () => {
      const onAction = vi.fn();
      render(
        <EmptyState
          title="No tasks yet"
          message="Create your first celebration task to get organized."
          action={{ label: 'Add Task', onClick: onAction }}
        />
      );

      expect(screen.getByText('No tasks yet')).toBeInTheDocument();
      expect(screen.getByText(/Create your first celebration task/i)).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: /add task/i });
      fireEvent.click(btn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Toast Notification System', () => {
    it('dispatches toasts and renders them within ToastContainer', async () => {
      render(<ToastContainer />);

      act(() => {
        toast.success('Event saved successfully!');
      });

      expect(await screen.findByText('Event saved successfully!')).toBeInTheDocument();

      act(() => {
        toast.error('Failed to load guest list');
      });

      expect(await screen.findByText('Failed to load guest list')).toBeInTheDocument();
    });
  });
});
