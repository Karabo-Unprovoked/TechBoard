import React, { useState, useEffect, DragEvent } from 'react';
import { GripVertical } from 'lucide-react';
import { supabase } from '../lib/supabase';

export type DashboardBlockId =
  | 'stats'
  | 'latest-updates'
  | 'overdue-tickets'
  | 'status-overview';

interface DashboardBlock {
  id: DashboardBlockId;
  order: number;
}

interface DraggableDashboardProps {
  children: React.ReactNode;
  blockId: DashboardBlockId;
  onOrderChange?: () => void;
}

const DEFAULT_LAYOUT: DashboardBlock[] = [
  { id: 'stats', order: 0 },
  { id: 'latest-updates', order: 1 },
  { id: 'overdue-tickets', order: 2 },
  { id: 'status-overview', order: 3 },
];

export const DraggableDashboard: React.FC<DraggableDashboardProps> = ({
  children,
  blockId,
  onOrderChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOver, setDraggedOver] = useState(false);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', blockId);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(true);
  };

  const handleDragLeave = () => {
    setDraggedOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain') as DashboardBlockId;
    setDraggedOver(false);

    if (draggedId !== blockId) {
      window.dispatchEvent(
        new CustomEvent('dashboard-block-drop', {
          detail: { draggedId, targetId: blockId },
        })
      );
      onOrderChange?.();
    }
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group transition-all ${
        isDragging ? 'opacity-50' : ''
      } ${draggedOver ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
    >
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10">
        <GripVertical size={20} className="text-gray-400" />
      </div>
      {children}
    </div>
  );
};

export const useDashboardLayout = () => {
  const [layout, setLayout] = useState<DashboardBlock[]>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLayout();
  }, []);

  useEffect(() => {
    const handleBlockDrop = async (e: Event) => {
      const customEvent = e as CustomEvent<{
        draggedId: DashboardBlockId;
        targetId: DashboardBlockId;
      }>;
      const { draggedId, targetId } = customEvent.detail;

      const newLayout = [...layout];
      const draggedIndex = newLayout.findIndex((b) => b.id === draggedId);
      const targetIndex = newLayout.findIndex((b) => b.id === targetId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [draggedBlock] = newLayout.splice(draggedIndex, 1);
        newLayout.splice(targetIndex, 0, draggedBlock);

        newLayout.forEach((block, index) => {
          block.order = index;
        });

        setLayout(newLayout);
        await saveLayout(newLayout);
      }
    };

    window.addEventListener('dashboard-block-drop', handleBlockDrop);
    return () => {
      window.removeEventListener('dashboard-block-drop', handleBlockDrop);
    };
  }, [layout]);

  const loadLayout = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLayout(DEFAULT_LAYOUT);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('dashboard_layout')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.dashboard_layout) {
        setLayout(data.dashboard_layout as DashboardBlock[]);
      } else {
        setLayout(DEFAULT_LAYOUT);
      }
    } catch (error) {
      console.error('Error loading dashboard layout:', error);
      setLayout(DEFAULT_LAYOUT);
    } finally {
      setLoading(false);
    }
  };

  const saveLayout = async (newLayout: DashboardBlock[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            dashboard_layout: newLayout,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Error saving dashboard layout:', error);
    }
  };

  const resetLayout = async () => {
    setLayout(DEFAULT_LAYOUT);
    await saveLayout(DEFAULT_LAYOUT);
  };

  const sortBlocks = <T extends { blockId: DashboardBlockId }>(
    blocks: T[]
  ): T[] => {
    return blocks.sort((a, b) => {
      const orderA = layout.find((l) => l.id === a.blockId)?.order ?? 999;
      const orderB = layout.find((l) => l.id === b.blockId)?.order ?? 999;
      return orderA - orderB;
    });
  };

  return {
    layout,
    loading,
    resetLayout,
    sortBlocks,
  };
};

}