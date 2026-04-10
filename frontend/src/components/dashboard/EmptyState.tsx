import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { Camera, Plus } from 'lucide-react';

interface EmptyStateProps {
  className?: string;
}

export default function EmptyState({ className }: EmptyStateProps) {
  const isAdmin = useAuthStore((s) => s.hasMinRole('admin'));

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full min-h-[60vh] gap-6 px-4',
        className,
      )}
    >
      {/* Camera illustration */}
      <div className="flex items-center justify-center w-28 h-28 rounded-full bg-bg-card border-2 border-border-default">
        <Camera size={56} className="text-text-muted" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-extrabold text-text-primary text-center tracking-wide">
        No cameras configured
      </h2>

      {/* Subtitle */}
      <p className="text-lg text-text-secondary text-center max-w-md">
        {isAdmin
          ? 'Add cameras to start monitoring ladle surface temperatures in real time.'
          : 'Contact your system administrator to add cameras and begin monitoring.'}
      </p>

      {/* CTA for admins */}
      {isAdmin && (
        <a
          href="/cameras"
          className={cn(
            'flex items-center gap-2 rounded-[var(--radius-lg)] px-8 py-4',
            'bg-brand-primary hover:bg-brand-primary-hover',
            'text-lg font-extrabold text-white uppercase tracking-wider',
            'transition-colors shadow-[var(--shadow-elevated)]',
          )}
        >
          <Plus size={22} strokeWidth={3} />
          Add Camera
        </a>
      )}
    </div>
  );
}
