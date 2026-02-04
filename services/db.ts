import { INITIAL_MEMBERS } from '../constants';
import { Member } from '../types';

// Using a public key-value store for global synchronization
// Bucket ID is specific to this project
const BUCKET_ID = 'qaisariya_ranking_global_v1';
const API_URL = `https://kvdb.io/${BUCKET_ID}/members_data`;

/**
 * Fetches the current global member data.
 * If the remote store is empty, it returns the initial default members.
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      if (response.status === 404) {
        // First time initialization
        await saveMembers(INITIAL_MEMBERS);
        return INITIAL_MEMBERS;
      }
      throw new Error('Failed to fetch global data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Global fetch error, falling back to local defaults:", error);
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
 * To prevent race conditions, it fetches the LATEST data right before updating.
 */
export const submitVote = async (rankedMembers: Member[]) => {
  try {
    // 1. Get current global state to ensure we are adding to the latest scores
    const currentGlobalMembers = await getMembers();
    
    // 2. Create a map for easy lookup
    const memberMap = new Map(currentGlobalMembers.map(m => [m.id, m]));

    // 3. Add points based on ranking (Rank 1: 50, Rank 2: 40, etc.)
    rankedMembers.forEach((rankedMember, index) => {
      const existing = memberMap.get(rankedMember.id);
      if (existing) {
        const points = (5 - index) * 10;
        existing.score += points;
      }
    });

    // 4. Save back to the global store
    const updatedList = Array.from(memberMap.values());
    await saveMembers(updatedList);
    
    return true;
  } catch (error) {
    console.error("Voting submission failed:", error);
    return false;
  }
};

/**
 * Resets the global data (Admin/Testing use only)
 */
export const resetDb = async () => {
  await saveMembers(INITIAL_MEMBERS);
  location.reload();
};