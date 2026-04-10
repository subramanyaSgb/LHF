import { useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import SortableCameraCard from './SortableCameraCard';
import CameraCard from './CameraCard';
import type { Camera, LayoutItem } from '@/types';

interface DraggableGridProps {
  cameras: Camera[];
  gridCols: number;
  onCameraClick?: (camera: Camera) => void;
}

/**
 * A drag-and-drop sortable grid for camera cards in custom layout mode.
 * Uses @dnd-kit to enable reordering. Card order and column-span are
 * persisted through the layout store (Zustand + localStorage).
 */
export default function DraggableGrid({
  cameras,
  gridCols,
  onCameraClick,
}: DraggableGridProps) {
  const items = useLayoutStore((s) => s.items);
  const setItems = useLayoutStore((s) => s.setItems);
  const updateItem = useLayoutStore((s) => s.updateItem);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  // Build a lookup map: cameraId -> Camera
  const cameraMap = useMemo(() => {
    const map = new Map<string, Camera>();
    for (const cam of cameras) {
      map.set(cam.id, cam);
    }
    return map;
  }, [cameras]);

  // Ensure layout items are initialised and in sync with the camera list.
  // If items is empty or cameras have changed, rebuild from cameras while
  // preserving existing order/span for cameras that still exist.
  const sortedItems: LayoutItem[] = useMemo(() => {
    const cameraIds = new Set(cameras.map((c) => c.id));

    // If store items already cover all current cameras, use them as-is
    // (filtering out any stale entries for cameras that were removed).
    if (items.length > 0) {
      const existing = items.filter(
        (item) => item.cameraId && cameraIds.has(item.cameraId),
      );
      const existingCameraIds = new Set(existing.map((item) => item.cameraId));

      // Add any new cameras that aren't in the stored items yet
      const newItems: LayoutItem[] = cameras
        .filter((c) => !existingCameraIds.has(c.id))
        .map((c, idx) => ({
          id: `layout-${c.id}`,
          cameraId: c.id,
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }));

      if (newItems.length === 0 && existing.length === items.length) {
        return existing;
      }

      const merged = [...existing, ...newItems];
      // Persist the cleaned-up list only if it actually changed
      if (merged.length !== items.length || newItems.length > 0) {
        // Defer the state update to avoid setting state during render
        queueMicrotask(() => setItems(merged));
      }
      return merged;
    }

    // No stored items — initialise from cameras
    const initial: LayoutItem[] = cameras.map((c) => ({
      id: `layout-${c.id}`,
      cameraId: c.id,
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    }));
    queueMicrotask(() => setItems(initial));
    return initial;
  }, [cameras, items, setItems]);

  const itemIds = useMemo(
    () => sortedItems.map((item) => item.id),
    [sortedItems],
  );

  // Sensors: pointer (mouse/touch) + keyboard for accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = sortedItems.findIndex((i) => i.id === active.id);
        const newIndex = sortedItems.findIndex((i) => i.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const reordered = arrayMove(sortedItems, oldIndex, newIndex);
          setItems(reordered);
        }
      }
    },
    [sortedItems, setItems],
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null);
  }, []);

  const handleSpanChange = useCallback(
    (itemId: string, span: 1 | 2) => {
      updateItem(itemId, { width: span });
    },
    [updateItem],
  );

  // Find the camera for the currently dragged item (used in DragOverlay)
  const activeDragCamera = useMemo(() => {
    if (!activeDragId) return null;
    const item = sortedItems.find((i) => i.id === activeDragId);
    if (!item?.cameraId) return null;
    return cameraMap.get(item.cameraId) ?? null;
  }, [activeDragId, sortedItems, cameraMap]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div
          className="gap-4"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          }}
        >
          {sortedItems.map((item) => {
            const camera = item.cameraId
              ? cameraMap.get(item.cameraId)
              : undefined;
            if (!camera) return null;

            const span = (item.width === 2 ? 2 : 1) as 1 | 2;

            return (
              <SortableCameraCard
                key={item.id}
                id={item.id}
                camera={camera}
                span={span}
                onClick={onCameraClick}
                onSpanChange={handleSpanChange}
              />
            );
          })}
        </div>
      </SortableContext>

      {/* Drag overlay — renders a ghost of the dragged card */}
      <DragOverlay dropAnimation={null}>
        {activeDragCamera ? (
          <div className="opacity-90 scale-[1.04] shadow-2xl rounded-[var(--radius-lg)]">
            <CameraCard camera={activeDragCamera} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
