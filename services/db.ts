import { INITIAL_MEMBERS } from '../constants';
import { Member } from '../types';

let db: any = null;
let SQL: any = null;

// Initialize the database
export const getDb = async () => {
  if (db) return db;
  
  // Initialize SQL.js from window global (loaded via script tag)
  if (!SQL) {
    if (!(window as any).initSqlJs) {
      throw new Error("SQL.js not loaded");
    }
    SQL = await (window as any).initSqlJs({
      locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
  }

  // Try to load from local storage
  // V2 to force re-seed with new ranking order
  const savedData = localStorage.getItem('members_db_sqlite_v2');
  
  if (savedData) {
    try {
      const binaryString = atob(savedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      db = new SQL.Database(bytes);
    } catch (e) {
      console.error("Failed to load DB from storage, resetting", e);
      db = new SQL.Database();
      initSchema();
    }
  } else {
    db = new SQL.Database();
    initSchema();
  }
  
  return db;
};

// Initialize schema and seed data
const initSchema = () => {
  db.run("CREATE TABLE IF NOT EXISTS members (id TEXT PRIMARY KEY, name TEXT, title TEXT, score INTEGER)");
  
  // Check if empty
  const res = db.exec("SELECT count(*) FROM members");
  if (res[0].values[0][0] === 0) {
      const stmt = db.prepare("INSERT INTO members VALUES (?, ?, ?, ?)");
      INITIAL_MEMBERS.forEach(m => {
        stmt.run([m.id, m.name, m.title, m.score]);
      });
      stmt.free();
  }
  saveToStorage();
};

// Persist to local storage
const saveToStorage = () => {
  const data = db.export();
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  localStorage.setItem('members_db_sqlite_v2', btoa(binary));
};

// Fetch all members
export const getMembers = async (): Promise<Member[]> => {
  const db = await getDb();
  try {
      const res = db.exec("SELECT * FROM members");
      if (res.length === 0) return [];
      
      const values = res[0].values;
      
      return values.map((v: any[]) => ({
        id: v[0],
        name: v[1],
        title: v[2],
        score: v[3]
      }));
  } catch (e) {
      console.error("Error fetching members", e);
      return INITIAL_MEMBERS;
  }
};

// Update scores based on ranking
export const submitVote = async (rankedMembers: Member[]) => {
  const db = await getDb();
  
  // Calculate points and update
  // Logic: Rank 1 (+50), Rank 2 (+40), etc.
  rankedMembers.forEach((member, index) => {
    const points = (5 - index) * 10;
    db.run("UPDATE members SET score = score + ? WHERE id = ?", [points, member.id]);
  });
  
  saveToStorage();
};

// Reset for testing
export const resetDb = () => {
    localStorage.removeItem('members_db_sqlite_v2');
    location.reload();
};