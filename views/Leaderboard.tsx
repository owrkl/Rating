import React from 'react';
import { Member } from '../types';
import { Avatar } from '../components/Avatar';
import { MemberCard } from '../components/MemberCard';
import { Crown, Star } from 'lucide-react';

interface LeaderboardProps {
  members: Member[];
  onStartVoting: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ members, onStartVoting }) => {
  // Sort members by score descending
  const sortedMembers = [...members].sort((a, b) => b.score - a.score);
  const topThree = sortedMembers.slice(0, 3);
  const restOfMembers = sortedMembers.slice(3);

  // Helper to reorder top 3 for the podium visual (2, 1, 3)
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Header */}
      <div className="text-center py-8 px-4 bg-gradient-to-b from-indigo-900/40 to-transparent">
        <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 mb-2 drop-shadow-sm">
          أعضاء القيصرية العمرية
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          الترتيب الحالي بناءً على تصويت المجتمع
        </p>
      </div>

      {/* Podium Section */}
      <div className="flex justify-center items-end gap-2 md:gap-6 px-4 mb-10 max-w-3xl mx-auto">
        {podiumOrder.map((member, index) => {
          // Determine podium styles based on visual position (not array index)
          const isFirst = index === 1; // Middle element in [2, 1, 3] layout
          const isSecond = index === 0;
          const isThird = index === 2;
          
          let rank = 0;
          let heightClass = '';
          let colorClass = '';
          let borderClass = '';

          if (isFirst) {
            rank = 1;
            heightClass = 'h-48 md:h-56';
            colorClass = 'from-yellow-600/40 to-yellow-900/20';
            borderClass = 'border-yellow-500';
          } else if (isSecond) {
            rank = 2;
            heightClass = 'h-36 md:h-44';
            colorClass = 'from-slate-400/40 to-slate-700/20';
            borderClass = 'border-slate-300';
          } else {
            rank = 3;
            heightClass = 'h-28 md:h-36';
            colorClass = 'from-amber-700/40 to-amber-900/20';
            borderClass = 'border-amber-600';
          }

          if (!member) return null;

          return (
            <div key={member.id} className="flex flex-col items-center w-1/3 max-w-[140px]">
              <div className="relative mb-2 w-fit mx-auto">
                <Avatar className={`w-16 h-16 md:w-24 md:h-24 border-4 ${borderClass} shadow-xl`} />
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${borderClass} bg-slate-900 text-white`}>
                  {rank}
                </div>
                {isFirst && <Crown className="absolute -top-10 left-1/2 -translate-x-1/2 w-10 h-10 text-yellow-400 animate-bounce" />}
              </div>
              
              <div className={`w-full rounded-t-lg bg-gradient-to-t ${colorClass} backdrop-blur-md border-x border-t ${borderClass.replace('border-', 'border-opacity-30 ')} flex flex-col justify-end items-center p-2 text-center ${heightClass}`}>
                <p className="text-xs md:text-sm font-bold text-white line-clamp-1 w-full">{member.name}</p>
                <p className="text-[10px] md:text-xs text-slate-300 line-clamp-1 w-full mb-1">{member.title}</p>
                <div className="bg-slate-900/60 rounded px-2 py-0.5 text-xs font-mono text-emerald-400">
                  {member.score.toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* List Section */}
      <div className="px-4 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-200">
          <Star className="w-5 h-5 text-indigo-400" />
          باقي الأعضاء
        </h2>
        <div className="space-y-3">
          {restOfMembers.map((member, idx) => (
            <MemberCard key={member.id} member={member} rank={idx + 4} />
          ))}
        </div>
      </div>

      {/* Sticky Action Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent z-50">
        <button
          onClick={onStartVoting}
          className="w-full max-w-md mx-auto block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-indigo-900/40 transform transition hover:scale-[1.02] active:scale-[0.98] text-lg"
        >
          أرسل تقييمك
        </button>
      </div>
    </div>
  );
};