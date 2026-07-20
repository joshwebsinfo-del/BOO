import * as SQLite from 'expo-sqlite';

export async function getDbConnection() {
  const db = await SQLite.openDatabaseAsync('fluent_english_coach.db');
  return db;
}

export async function initDatabase() {
  const db = await getDbConnection();

  // Set up professional production-ready tables
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      speaking_time INTEGER DEFAULT 0,
      reading_time INTEGER DEFAULT 0,
      listening_time INTEGER DEFAULT 0,
      writing_time INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_type TEXT,
      item_id INTEGER,
      completed_at TEXT,
      score INTEGER
    );

    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      word TEXT,
      pronunciation TEXT,
      meaning TEXT,
      example_sentence TEXT,
      common_mistakes TEXT,
      synonyms TEXT,
      antonyms TEXT,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS idioms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT,
      meaning TEXT,
      example_sentence TEXT,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS phrasal_verbs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      verb TEXT,
      meaning TEXT,
      example_sentence TEXT,
      is_favorite INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS conversation_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      title TEXT,
      dialogue_json TEXT
    );

    CREATE TABLE IF NOT EXISTS grammar_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT,
      explanation TEXT,
      examples_json TEXT,
      quiz_json TEXT
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      badge_icon TEXT,
      is_unlocked INTEGER DEFAULT 0
    );
  `);

  // Seeding from the generated curriculum JSON files
  const rowCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vocabulary');
  if (rowCount && rowCount.count === 0) {
    await seedDatabase(db);
  }
}

async function seedDatabase(db: SQLite.SQLiteDatabase) {
  console.log('Seeding offline SQLite database from generated curriculum assets...');

  try {
    // Import generated JSON data
    const vocabularyData = require('../data/vocabulary.json');
    const idiomsData = require('../data/idioms.json');
    const phrasalVerbsData = require('../data/phrasal_verbs.json');
    const grammarData = require('../data/grammar.json');
    const conversationsData = require('../data/conversations.json');
    const achievementsData = require('../data/achievements.json');

    // Seed Vocabulary
    for (const v of vocabularyData.slice(0, 100)) { // seed first 100 for fast mobile asset load, easily scalable
      await db.runAsync(`
        INSERT INTO vocabulary (category, word, pronunciation, meaning, example_sentence, common_mistakes, synonyms, antonyms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [v.category, v.word, v.pronunciation, v.definition, v.example_sentence, v.common_mistake, v.synonyms, v.antonyms]);
    }

    // Seed Idioms
    for (const idm of idiomsData.slice(0, 50)) {
      await db.runAsync(`
        INSERT INTO idioms (phrase, meaning, example_sentence)
        VALUES (?, ?, ?)
      `, [idm.idiom, idm.meaning, idm.example]);
    }

    // Seed Phrasal Verbs
    for (const pv of phrasalVerbsData.slice(0, 50)) {
      await db.runAsync(`
        INSERT INTO phrasal_verbs (verb, meaning, example_sentence)
        VALUES (?, ?, ?)
      `, [pv.verb, pv.meaning, pv.examples]);
    }

    // Seed Conversation Scenarios
    for (const conv of conversationsData.slice(0, 30)) {
      await db.runAsync(`
        INSERT INTO conversation_scenarios (category, title, dialogue_json)
        VALUES (?, ?, ?)
      `, [conv.category, conv.title, JSON.stringify(conv.dialogue)]);
    }

    // Seed Grammar Lessons
    for (const g of grammarData.slice(0, 20)) {
      await db.runAsync(`
        INSERT INTO grammar_lessons (topic, explanation, examples_json, quiz_json)
        VALUES (?, ?, ?, ?)
      `, [g.category, g.explanation, JSON.stringify(g.examples), JSON.stringify({ question: g.quiz, answer: g.correct_answer })]);
    }

    // Seed achievements
    for (const ach of achievementsData.slice(0, 20)) {
      await db.runAsync(`
        INSERT INTO achievements (title, description, badge_icon, is_unlocked)
        VALUES (?, ?, ?, ?)
      `, [ach.title, ach.description, ach.badge_icon, 0]);
    }

    // Default settings
    await db.runAsync(`INSERT INTO settings (key, value) VALUES ('font_size', '16')`);
    await db.runAsync(`INSERT INTO settings (key, value) VALUES ('notifications_enabled', '1')`);

    console.log('Seeding finished successfully.');
  } catch (err) {
    console.error('Error seeding SQLite database from JSON files:', err);
  }
}

// Actual SQLite query methods to use directly inside app screens:
export async function getAllVocabulary() {
  const db = await getDbConnection();
  return await db.getAllAsync('SELECT * FROM vocabulary');
}

export async function getAllIdioms() {
  const db = await getDbConnection();
  return await db.getAllAsync('SELECT * FROM idioms');
}

export async function getAllPhrasalVerbs() {
  const db = await getDbConnection();
  return await db.getAllAsync('SELECT * FROM phrasal_verbs');
}

export async function getConversationScenarios() {
  const db = await getDbConnection();
  return await db.getAllAsync('SELECT * FROM conversation_scenarios');
}

export async function saveProgress(lessonType: string, itemId: number, score: number) {
  const db = await getDbConnection();
  const now = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO progress (lesson_type, item_id, completed_at, score) VALUES (?, ?, ?, ?)',
    [lessonType, itemId, now, score]
  );
}

export async function updateDailyStats(speaking: number, reading: number, listening: number, writing: number, xp: number) {
  const db = await getDbConnection();
  const today = new Date().toISOString().split('T')[0];
  await db.runAsync(`
    INSERT INTO statistics (date, speaking_time, reading_time, listening_time, writing_time, xp_earned)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET
      speaking_time = speaking_time + excluded.speaking_time,
      reading_time = reading_time + excluded.reading_time,
      listening_time = listening_time + excluded.listening_time,
      writing_time = writing_time + excluded.writing_time,
      xp_earned = xp_earned + excluded.xp_earned
  `, [today, speaking, reading, listening, writing, xp]);
}

export async function getStatistics() {
  const db = await getDbConnection();
  return await db.getAllAsync('SELECT * FROM statistics ORDER BY date DESC');
}
