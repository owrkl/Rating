import React from 'react';
import { Member } from '../types';
import { Avatar } from './Avatar';
import { Crown } from 'lucide-react';

interface MemberCardProps {
  member: Member;
  rank?: number;
  isCompact?: boolean;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member, rank, isCompact = false }) => {
  const getRankColor = (r: number) => {
    switch (r) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-slate-300';
      case 3: return 'text-amber-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className={`flex items-center gap-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-4 rounded-xl mb-3 shadow-lg transition-all hover:bg-slate-800 hover:border-indigo-500/30 ${isCompact ? 'py-3' : ''}`}>
      {rank && (
        <div className={`font-bold text-xl min-w-[1.5rem] text-center ${getRankColor(rank)}`}>
          {rank <= 3 ? <Crown className="w-6 h-6 inline-block mb-1" /> : `#${rank}`}
        </div>
      )}
      
      <Avatar className="w-14 h-14 shrink-0 border-2 border-indigo-500/20" />
      
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg text-slate-100 truncate leading-tight">
          {member.name}
        </h3>
        <p className="text-sm text-indigo-400 truncate mt-0.5">
          {member.title}
        </p>
      </div>

      {!isCompact && (
        <div className="text-right pl-2">
          <div className="text-xs text-slate-400">التقييم</div>
          <div className="font-mono font-bold text-emerald-400">
            {member.score.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};