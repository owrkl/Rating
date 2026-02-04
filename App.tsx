import React, { useState, useEffect } from 'react';
import { ViewState, Member } from './types.ts';
import { Leaderboard } from './views/Leaderboard.tsx';
import { Voting } from './views/Voting.tsx';
import { Check, RotateCcw, Loader2 } from 'lucide-react';
import * as db from './services/db.ts';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LEADERBOARD');
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMembers = async () => {
    try {
      const data = await db.getMembers();
      setMembers(data);
    } catch (error) {
      console.error("Failed to fetch members", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshMembers();
    
    // Auto-refresh every 30 seconds to sync with other voters
    const interval = setInterval(refreshMembers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmitVote = async (rankedMembers: Member[]) => {
    const success = await db.submitVote(rankedMembers);
    if (success) {
      await refreshMembers();
      setView('SUCCESS');
    } else {
      alert("حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (view === 'SUCCESS') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Check className="w-12 h-12 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">تم استلام تقييمك بنجاح!</h2>
        <p className="text-slate-400 mb-8 max-w-xs">
          تمت إضافة تقييمك إلى النتائج العالمية للقيصرية العمرية.
        </p>
        <button
          onClick={() => setView('LEADERBOARD')}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>العودة للترتيب العالمي</span>
        </button>
      </div>
    );
  }

  if (view === 'VOTING') {
    return (
      <Voting
        members={members} 
        onSubmit={handleSubmitVote}
        onCancel={() => setView('LEADERBOARD')}
      />
    );
  }

  return (
    <Leaderboard
      members={members}
      onStartVoting={() => setView('VOTING')}
    />
  );
};

export default App;