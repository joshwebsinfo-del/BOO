import * as SQLite from 'expo-sqlite';

export async function getDbConnection() {
  const db = await SQLite.openDatabaseAsync('fluent_english_coach.db');
  return db;
}

export async function initDatabase() {
  const db = await getDbConnection();

  // Set up production SQLite tables with zero web/SMIS mock data and enable foreign keys
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

    CREATE TABLE IF NOT EXISTS collocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase TEXT,
      meaning TEXT,
      example_sentence TEXT
    );

    CREATE TABLE IF NOT EXISTS conversation_scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      title TEXT,
      dialogue_json TEXT
    );

    CREATE TABLE IF NOT EXISTS pronunciation_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sound_name TEXT,
      guide_sentence TEXT,
      words_list TEXT
    );

    CREATE TABLE IF NOT EXISTS reading_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      title TEXT,
      content TEXT,
      questions_json TEXT,
      is_bookmarked INTEGER DEFAULT 0
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

  // Seed default items if empty
  const rowCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vocabulary');
  if (rowCount && rowCount.count === 0) {
    await seedDatabase(db);
  }
}

async function seedDatabase(db: SQLite.SQLiteDatabase) {
  // Vocabulary Seed Entries
  const vocabEntries = [
    ['Business', 'Facilitate', '/fəˈsɪl.ɪ.teɪt/', 'To make an action or process easy or easier.', 'The new system will facilitate flawless offline synchronization.', 'Do not use as a direct synonym for simple "make".', 'Expedite, ease', 'Hinder, obstruct'],
    ['Business', 'Leverage', '/ˈliː.vər.ɪdʒ/', 'To use something that you already have in order to achieve something new or better.', 'We must leverage our advanced fluency to close international deals.', 'Do not overuse; use when highlighting strategic advantage.', 'Utilize, exploit', 'Neglect, ignore'],
    ['Travel', 'Itinerary', '/aɪˈtɪn.ər.ər.i/', 'A detailed plan or route of a journey.', 'Please review the official flight itinerary before checking in.', 'Watch the spelling - it is "itinerary", not "itinery".', 'Schedule, route', 'Disorganization'],
    ['Daily Life', 'Impeccable', '/ɪmˈpek.ə.bəl/', 'Perfect, with no problems or bad parts.', 'Her English speaking pronunciation was impeccable.', 'Impeccable is already an absolute; do not say "very impeccable".', 'Flawless, perfect', 'Flawed, imperfect'],
    ['Work', 'Collaborate', '/kəˈlæb.ə.reɪt/', 'To work jointly on an activity or project.', 'We will collaborate with senior developers on the new design.', 'Say "collaborate with", not "collaborate to".', 'Cooperate, team up', 'Compete, oppose']
  ];

  for (const entry of vocabEntries) {
    await db.runAsync(`
      INSERT INTO vocabulary (category, word, pronunciation, meaning, example_sentence, common_mistakes, synonyms, antonyms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, entry);
  }

  // Seed Phrasal Verbs
  const phrasalVerbs = [
    ['Carry on', 'To continue doing something.', 'Please carry on speaking for 2 minutes to complete the coach challenge.'],
    ['Run into', 'To meet someone unexpectedly.', 'I hope to run into my mentor at the tech conference.'],
    ['Work out', 'To solve a problem or plan something.', 'We will work out the details of the contract tomorrow.']
  ];

  for (const pv of phrasalVerbs) {
    await db.runAsync(`
      INSERT INTO phrasal_verbs (verb, meaning, example_sentence)
      VALUES (?, ?, ?)
    `, pv);
  }

  // Seed Idioms
  const idiomsList = [
    ['Break the ice', 'To make people feel more comfortable in a social situation.', 'Let us play a quick game to break the ice in the room.'],
    ['Hit the books', 'To study intensively.', 'I must hit the books tonight to master Present Perfect grammar.']
  ];

  for (const idm of idiomsList) {
    await db.runAsync(`
      INSERT INTO idioms (phrase, meaning, example_sentence)
      VALUES (?, ?, ?)
    `, idm);
  }

  // Seed Conversation Scenarios
  const dialogueSample = JSON.stringify([
    { role: "coach", text: "Welcome to your mock interview. Let us discuss how you handle critical client situations." },
    { role: "user", text: "In my previous role, I had to leverage immediate collaborative efforts to resolve critical bugs." }
  ]);

  await db.runAsync(`
    INSERT INTO conversation_scenarios (category, title, dialogue_json)
    VALUES (?, ?, ?)
  `, ['Business', 'Mock Career Interview', dialogueSample]);

  // Seed settings default values
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('font_size', '16')`);
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('notifications_enabled', '1')`);
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
