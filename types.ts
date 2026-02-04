export interface Member {
  id: string;
  name: string;
  title: string;
  score: number; // For leaderboard display
  ranking?: number; // For user voting
}

export type ViewState = 'LEADERBOARD' | 'VOTING' | 'SUCCESS';

export interface SortableMemberProps {
  member: Member;
  index: number;
}