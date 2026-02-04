import { INITIAL_MEMBERS } from '../constants';
import { Member } from '../types';

// Using a public key-value store for global synchronization.
// We use a unique ID to avoid collisions with other projects.
const BUCKET_ID = 'qaisariya_ranking_v2_9988';
const API_URL = `https://kvdb.io/${BUCKET_ID}/members_data`;

/**
 * Fetches the current global member data.
 * Always falls back to INITIAL_MEMBERS to ensure the app doesn't go blank.
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const response = await fetch(API_URL);
    if (response.ok) {
      const data = await response.json();
      // Basic validation to ensure we got an array
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
    
    if (response.status === 404) {
      console.log("Bucket not found, initializing with defaults...");
      await saveMembers(INITIAL_MEMBERS);
    }
    
    return INITIAL_MEMBERS;
  } catch (error) {
    console.warn("Global fetch failed, showing local data:", error);
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
    // 1. Fetch the absolute latest state from the server first
    const currentGlobalMembers = await getMembers();
    
    // 2. Create a map of current scores
    const memberMap = new Map(currentGlobalMembers.map(m => [m.id, m]));

    // 3. Add points based on ranking (Rank 1: 50, Rank 2: 40, etc.)
    rankedMembers.forEach((rankedMember, index) => {
      const existing = memberMap.get(rankedMember.id);
      if (existing) {
        // Point system: 1st=50, 2nd=40, 3rd=30, 4th=20, 5th=10
        const points = (5 - index) * 10;
        existing.score = (existing.score || 0) + points;
      }
    });

    // 4. Update the global store
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