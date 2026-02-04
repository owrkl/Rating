import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Crown, Star, Globe, GripVertical, ArrowRight, CheckCircle2, Check, RotateCcw, Loader2 
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Constants & Types ---
const BUCKET_ID = 'qaisariya_ranking_v6_final';
const API_URL = `https://kvdb.io/${BUCKET_ID}/members_data`;

const INITIAL_MEMBERS = [
  { id: 'm2', name: 'عمر حامد', title: 'القيصر', score: 0 },
  { id: 'm1', name: 'محمد فرحان', title: 'امبراطور الامبراطورية المحمدية', score: 0 },
  { id: 'm3', name: 'محمد عبد العزيز', title: 'امبراطور الامبراطورية العزيزية', score: 0 },
  { id: 'm4', name: 'حمزة وائل', title: 'وزير الرياضة والشباب', score: 0 },
  { id: 'm5', name: 'عدنان أحمد', title: 'وزير التكنولوجيا', score: 0 },
];

// --- Global API Service ---
const db = {
  getMembers: async () => {
    try {
      const response = await fetch(API_URL);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
      if (response.status === 404) {
        await db.saveMembers(INITIAL_MEMBERS);
        return INITIAL_MEMBERS;
      }
      return INITIAL_MEMBERS;
    } catch (e) {
      return INITIAL_MEMBERS;
    }
  },
  saveMembers: async (members: any) => {
    try {
      await fetch(API_URL, { method: 'POST', body: JSON.stringify(members) });
    } catch (e) { console.error(e); }
  },
  submitVote: async (rankedMembers: any[]) => {
    try {
      const current = await db.getMembers();
      const memberMap = new Map(current.map(m => [m.id, m]));
      rankedMembers.forEach((m, i) => {
        const existing = memberMap.get(m.id);
        if (existing) existing.score = (existing.score || 0) + ((5 - i) * 10);
      });
      await db.saveMembers(Array.from(memberMap.values()));
      return true;
    } catch (e) { return false; }
  }
};

// --- Shared Components ---
const Avatar = ({ className = "w-12 h-12" }: { className?: string }) => (
  <div className={`relative rounded-full overflow-hidden bg-slate-200 border-2 border-slate-300 ${className}`}>
    <svg className="absolute w-full h-full text-slate-400" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  </div>
);

const MemberCard: React.FC<{ member: any; rank?: any; isCompact?: boolean }> = ({ member, rank, isCompact = false }) => (
  <div className={`flex items-center gap-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl mb-3 shadow-lg transition-all hover:bg-slate-800 hover:border-indigo-500/30`}>
    {rank && (
      <div className={`font-bold text-xl min-w-[1.5rem] text-center ${rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-slate-300' : rank === 3 ? 'text-amber-600' : 'text-slate-500'}`}>
        {rank <= 3 ? <Crown className="w-6 h-6 inline-block" /> : `#${rank}`}
      </div>
    )}
    <Avatar className="w-14 h-14 shrink-0 border-2 border-indigo-500/20" />
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-lg text-slate-100 truncate leading-tight">{member.name}</h3>
      <p className="text-sm text-indigo-400 truncate mt-0.5">{member.title}</p>
    </div>
    {!isCompact && (
      <div className="text-right pl-2">
        <div className="text-xs text-slate-400">التقييم</div>
        <div className="font-mono font-bold text-emerald-400">{member.score.toLocaleString()}</div>
      </div>
    )}
  </div>
);

const SortableItem: React.FC<{ id: any; member: any; index: any }> = ({ id, member, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.8 : 1 };
  const getRankColor = (i: number) => i === 0 ? 'bg-yellow-500 text-slate-900' : i === 1 ? 'bg-slate-300 text-slate-900' : i === 2 ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-400';

  return (
    <div ref={setNodeRef} style={style} className={`relative flex items-center gap-3 bg-slate-800 border ${isDragging ? 'border-indigo-500 shadow-2xl scale-105' : 'border-slate-700'} p-3 rounded-xl mb-3 touch-none select-none`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(index)}`}>{index + 1}</div>
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

// --- Views ---
const Leaderboard = ({ members, onStartVoting }: { members: any[]; onStartVoting: () => void }) => {
  const sorted = [...members].sort((a, b) => b.score - a.score);
  const topThree = sorted.slice(0, 3);
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];

  return (
    <div className="min-h-screen pb-24 relative overflow-x-hidden">
      <div className="text-center py-8 px-4 bg-gradient-to-b from-indigo-900/40 to-transparent relative">
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-[10px] md:text-xs font-bold animate-pulse-soft">
          <Globe className="w-3 h-3" /><span>مباشر (عام)</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-2 drop-shadow-sm">أعضاء القيصرية العمرية</h1>
        <p className="text-slate-400 text-sm md:text-base">الترتيب العالمي بناءً على جميع المشاركات</p>
      </div>
      <div className="flex justify-center items-end gap-2 md:gap-6 px-4 mb-10 max-w-3xl mx-auto">
        {podiumOrder.map((m, i) => {
          if (!m) return <div key={i} className="w-1/3" />;
          const isFirst = i === 1;
          const height = isFirst ? 'h-48 md:h-56' : i === 0 ? 'h-36 md:h-44' : 'h-28 md:h-36';
          const border = isFirst ? 'border-yellow-500' : i === 0 ? 'border-slate-300' : 'border-amber-600';
          const color = isFirst ? 'from-yellow-600/40 to-yellow-900/20' : i === 0 ? 'from-slate-400/40 to-slate-700/20' : 'from-amber-700/40 to-amber-900/20';
          return (
            <div key={m.id} className="flex flex-col items-center w-1/3 max-w-[140px]">
              <div className="relative mb-2">
                {isFirst && <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400 animate-bounce" />}
                <Avatar className={`w-16 h-16 md:w-24 md:h-24 border-4 ${border} shadow-xl`} />
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${border} bg-slate-900 text-white`}>{i === 1 ? 1 : i === 0 ? 2 : 3}</div>
              </div>
              <div className={`w-full rounded-t-lg bg-gradient-to-t ${color} backdrop-blur-md border-x border-t ${border.replace('border-', 'border-opacity-30 ')} flex flex-col justify-end items-center p-2 text-center ${height}`}>
                <p className="text-xs md:text-sm font-bold text-white line-clamp-1 w-full">{m.name}</p>
                <div className="bg-slate-900/60 rounded px-2 py-0.5 text-xs font-mono text-emerald-400">{m.score.toLocaleString()}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200"><Star className="w-5 h-5 text-indigo-400" />باقي الأعضاء</h2>
        <div className="space-y-3">{sorted.slice(3).map((m, idx) => <MemberCard key={m.id} member={m} rank={idx + 4} />)}</div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent z-50">
        <button onClick={onStartVoting} className="w-full max-w-md mx-auto block bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-900/40 transform transition active:scale-95 text-lg">أرسل تقييمك</button>
      </div>
    </div>
  );
};

const Voting = ({ members, onSubmit, onCancel }: { members: any[]; onSubmit: (items: any[]) => Promise<void>; onCancel: () => void }) => {
  const [items, setItems] = useState(members);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i: any) => i.id === active.id);
        const newIndex = items.findIndex((i: any) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };
  return (
    <div className="min-h-screen pb-24 bg-slate-900">
      <div className="p-4 flex items-center gap-4 bg-slate-800/50 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-700 text-slate-400"><ArrowRight className="w-6 h-6" /></button>
        <h2 className="text-lg font-bold text-white">رتب الأعضاء</h2>
      </div>
      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-lg text-indigo-200 text-sm text-center">قم بسحب وإفلات الأعضاء لترتيبهم من الأفضل إلى الأقل</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((m: any, idx) => <SortableItem key={m.id} id={m.id} member={m} index={idx} />)}
          </SortableContext>
        </DndContext>
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/95 border-t border-slate-800 z-50">
        <button onClick={async () => { setIsSubmitting(true); await onSubmit(items); }} disabled={isSubmitting} className="w-full max-w-md mx-auto flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-70">
          {isSubmitting ? <span className="animate-pulse">جاري الإرسال...</span> : <><CheckCircle2 className="w-6 h-6" /><span>أرسل التقييم</span></>}
        </button>
      </div>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [view, setView] = useState('LEADERBOARD');
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const data = await db.getMembers();
    setMembers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><Loader2 className="w-10 h-10 text-indigo-500 animate-spin" /></div>;

  if (view === 'SUCCESS') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse"><Check className="w-12 h-12 text-emerald-400" /></div>
      <h2 className="text-3xl font-bold text-white mb-2">تم التقييم!</h2>
      <button onClick={() => setView('LEADERBOARD')} className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl mt-6"><RotateCcw className="w-5 h-5" />العودة للترتيب</button>
    </div>
  );

  return view === 'VOTING' 
    ? <Voting members={members} onCancel={() => setView('LEADERBOARD')} onSubmit={async (m: any[]) => { if (await db.submitVote(m)) { await refresh(); setView('SUCCESS'); } }} />
    : <Leaderboard members={members} onStartVoting={() => setView('VOTING')} />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<React.StrictMode><App /></React.StrictMode>);
}