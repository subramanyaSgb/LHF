import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/utils/cn';
import CameraCard from './CameraCard';
import { GripVertical, Maximize2, Minimize2 } from 'lucide-react';
import type { Camera } from '@/types';

type CardSpan = 1 | 2;

interface SortableCameraCardProps {
  id: string;
  camera: Camera;
  span: CardSpan;
  onClick?: (camera: Camera) => void;
  onSpanChange?: (id: string, span: CardSpan) => void;
}

export default function SortableCameraCard({
  id,
  camera,
  span,
  onClick,
  onSpanChange,
}: SortableCameraCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: span === 2 ? 'span 2' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-70 scale-[1.02]',
      )}
    >
      {/* Drag handle overlay */}
      <div
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          'absolute top-0 left-0 z-10 flex items-center justify-center',
          'w-8 h-8 m-1 rounded-[var(--radius-sm)]',
          'bg-bg-primary/80 backdrop-blur-sm border border-border-default',
          'cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          isDragging && 'opacity-100',
        )}
        title="Drag to reorder"
      >
        <GripVertical size={16} className="text-text-secondary" />
      </div>

      {/* Span toggle */}
      {onSpanChange && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSpanChange(id, span === 1 ? 2 : 1);
          }}
          className={cn(
            'absolute top-0 right-0 z-10 flex items-center justify-center',
            'w-8 h-8 m-1 rounded-[var(--radius-sm)]',
            'bg-bg-primary/80 backdrop-blur-sm border border-border-default',
            'cursor-pointer hover:bg-bg-card-hover',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            isDragging && 'opacity-100',
          )}
          title={span === 1 ? 'Expand to 2 columns' : 'Shrink to 1 column'}
        >
          {span === 1 ? (
            <Maximize2 size={14} className="text-text-secondary" />
          ) : (
            <Minimize2 size={14} className="text-text-secondary" />
          )}
        </button>
      )}

      <CameraCard camera={camera} onClick={onClick} />
    </div>
  );
}
