import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Member } from '../types';
import { Avatar } from '../components/Avatar';
import { GripVertical, ArrowRight, CheckCircle2 } from 'lucide-react';

// --- Draggable Item Component ---
interface SortableItemProps {
  id: string;
  member: Member;
  index: number;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, member, index }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };

  const getRankColor = (i: number) => {
    if (i === 0) return 'bg-yellow-500 text-slate-900';
    if (i === 1) return 'bg-slate-300 text-slate-900';
    if (i === 2) return 'bg-amber-600 text-white';
    return 'bg-slate-700 text-slate-400';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-3 bg-slate-800 border ${isDragging ? 'border-indigo-500 shadow-2xl scale-105' : 'border-slate-700'} p-3 rounded-xl mb-3 touch-none select-none`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(index)}`}>
        {index + 1}
      </div>

      <Avatar className="w-12 h-12 shrink-0" />

      <div className="flex-1 text-right">
        <h4 className="font-bold text-slate-100">{member.name}</h4>
        <p className="text-xs text-slate-400">{member.title}</p>
      </div>

      <div {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-slate-500 hover:text-indigo-400">
        <GripVertical className="w-6 h-6" />
      </div>
    </div>
  );
};

// --- Main Voting View ---
interface VotingProps {
  members: Member[];
  onSubmit: (rankedMembers: Member[]) => void;
  onCancel: () => void;
}

export const Voting: React.FC<VotingProps> = ({ members, onSubmit, onCancel }) => {
  // Initialize state with members
  const [items, setItems] = useState<Member[]>(members);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate network delay
    setTimeout(() => {
        onSubmit(items);
        setIsSubmitting(false);
    }, 800);
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-900">
      <div className="p-4 flex items-center gap-4 bg-slate-800/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <button 
          onClick={onCancel}
          className="p-2 rounded-full hover:bg-slate-700 transition-colors text-slate-400"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-bold text-white">رتب الأعضاء</h2>
      </div>

      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-indigo-200 text-sm text-center">
          قم بسحب وإفلات الأعضاء لترتيبهم من الأفضل (رقم 1) إلى الأقل (رقم 5)
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map(i => i.id)}
            strategy={verticalListSortingStrategy}
          >
            {items.map((member, index) => (
              <SortableItem 
                key={member.id} 
                id={member.id} 
                member={member} 
                index={index}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 border-t border-slate-800 z-50">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
             <span className="animate-pulse">جاري الإرسال...</span>
          ) : (
             <>
               <CheckCircle2 className="w-6 h-6" />
               <span>أرسل التقييم</span>
             </>
          )}
        </button>
      </div>
    </div>
  );
};