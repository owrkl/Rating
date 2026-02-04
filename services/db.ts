import { INITIAL_MEMBERS } from '../constants.ts';
import { Member } from '../types.ts';

// Unique bucket ID for the Qaisariya group ranking
const BUCKET_ID = 'qaisariya_ranking_global_v5';
const API_URL = `https://kvdb.io/${BUCKET_ID}/members_data`;

/**
 * Fetches the current global member data.
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
    
    if (response.status === 404) {
      console.log("Global storage initializing...");
      await saveMembers(INITIAL_MEMBERS);
      return INITIAL_MEMBERS;
    }
    
    return INITIAL_MEMBERS;
  } catch (error) {
    console.warn("Global fetch failed, showing defaults:", error);
    return INITIAL_MEMBERS;
  }
};

/**
 * Saves the member data to the global store.
 */
const saveMembers = async (members: Member[]) => {
  try {
    await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(members),
    });
  } catch (error) {
    console.error("Failed to save to global store:", error);
  }
};

/**
 * Submits a vote by updating the global totals.
 */
export const submitVote = async (rankedMembers: Member[]) => {
  try {
    // Fetch latest state to ensure score synchronization
    const currentGlobalMembers = await getMembers();
    const memberMap = new Map(currentGlobalMembers.map(m => [m.id, m]));

    rankedMembers.forEach((rankedMember, index) => {
      const existing = memberMap.get(rankedMember.id);
      if (existing) {
        // Point system: 1st=50, 2nd=40, 3rd=30, 4th=20, 5th=10
        const points = (5 - index) * 10;
        existing.score = (existing.score || 0) + points;
      }
    });

    const updatedList = Array.from(memberMap.values());
    await saveMembers(updatedList);
    
    return true;
  } catch (error) {
    console.error("Voting submission failed:", error);
    return false;
  }
};

export const resetDb = async () => {
  await saveMembers(INITIAL_MEMBERS);
  location.reload();
};