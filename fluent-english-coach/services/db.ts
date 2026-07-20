import * as SQLite from 'expo-sqlite';

// Open or initialize the offline database
export async function getDbConnection() {
  const db = await SQLite.openDatabaseAsync('fluent_english_coach.db');
  return db;
}

export async function initDatabase() {
  const db = await getDbConnection();

  // Create all required SQLite tables for a complete fully offline application
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

  // Seed default metadata if missing
  const rowCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM vocabulary');
  if (rowCount && rowCount.count === 0) {
    await seedDatabase(db);
  }
}

async function seedDatabase(db: SQLite.SQLiteDatabase) {
  console.log('Seeding offline SQLite database...');

  // Seeding 10+ robust vocabulary entries representing professional categories
  const vocabEntries = [
    ['Business', 'Facilitate', '/fəˈsɪl.ɪ.teɪt/', 'To make an action or process easy or easier.', 'The new system will facilitate flawless offline synchronization.', 'Do not use as a direct synonym for simple "make".', 'Expedite, ease', 'Hinder, obstruct'],
    ['Business', 'Leverage', '/ˈliː.vər.ɪdʒ/', 'To use something that you already have in order to achieve something new or better.', 'We must leverage our advanced fluency to close international deals.', 'Do not overuse; use when highlighting strategic advantage.', 'Utilize, exploit', 'Neglect, ignore'],
    ['Travel', 'Itinerary', '/aɪˈtɪn.ər.ər.i/', 'A detailed plan or route of a journey.', 'Please review the official flight itinerary before checking in.', 'Watch the spelling - it is "itinerary", not "itinery".', 'Schedule, route', 'Disorganization'],
    ['Daily Life', 'Impeccable', '/ɪmˈpek.ə.bəl/', 'Perfect, with no problems or bad parts.', 'Her English speaking pronunciation was impeccable.', 'Impeccable is already an absolute; do not say "very impeccable".', 'Flawless, perfect', 'Flawed, imperfect'],
    ['Work', 'Collaborate', '/kəˈlæb.ə.reɪt/', 'To work jointly on an activity or project.', 'We will collaborate with senior developers on the new design.', 'Say "collaborate with", not "collaborate to".', 'Cooperate, team up', 'Compete, oppose'],
    ['Relationships', 'Empathetic', '/ˌem.pəˈθet.ɪk/', 'Showing an ability to understand and share the feelings of others.', 'An empathetic leader listens carefully to staff concerns.', 'Do not confuse with "sympathetic".', 'Compassionate, understanding', 'Callous, indifferent'],
    ['Food', 'Exquisite', '/ɪkˈskwɪz.ɪt/', 'Extremely beautiful and delicate; delicious.', 'The restaurant served an exquisite selection of local delicacies.', 'Keep for high-quality items; not cheap daily foods.', 'Delectable, superb', 'Crude, tasteless'],
    ['Technology', 'Ubiquitous', '/juːˈbɪk.wɪ.təs/', 'Present, appearing, or found everywhere.', 'Mobile phones have become ubiquitous in daily life.', 'Use to describe trends or universal tools.', 'Pervasive, widespread', 'Rare, scarce'],
    ['Shopping', 'Deorbit', '/diːˈɔːbɪt/', 'To break from a standard trajectory.', 'The market forces deorbited traditional retail prices.', 'This is highly specialized vocabulary.', 'Deviate', 'Remain'],
    ['Health', 'Resilient', '/rɪˈzɪl.i.ənt/', 'Able to withstand or recover quickly from difficult conditions.', 'Intermediate learners are highly resilient when correcting pronunciation.', 'Ensure correct syllable stress on the second syllable.', 'Tough, strong', 'Fragile, vulnerable']
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
    ['Work out', 'To solve a problem or plan something.', 'We will work out the details of the contract tomorrow.'],
    ['Take off', 'To depart suddenly; to become successful.', 'Her English confidence has really taken off this month.'],
    ['Give up', 'To stop making an effort; resign.', 'Never give up when practicing complex intermediate grammar rules.']
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
    ['Hit the books', 'To study intensively.', 'I must hit the books tonight to master Present Perfect grammar.'],
    ['Piece of cake', 'Something very easy to do.', 'Practicing speaking on this mobile app is a piece of cake.'],
    ['Under the weather', 'Slightly unwell or tired.', 'He was under the weather yesterday, so he rested.'],
    ['Better late than never', 'It is better for someone to arrive or do something late than not at all.', 'I joined the fluency course late, but better late than never.']
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
    { role: "user", text: "In my previous role, I had to leverage immediate collaborative efforts to resolve critical bugs." },
    { role: "coach", text: "Excellent choice of vocabulary. How did you verify the results?" },
    { role: "user", text: "We ran automated regression tests to confirm flawless production delivery." }
  ]);

  await db.runAsync(`
    INSERT INTO conversation_scenarios (category, title, dialogue_json)
    VALUES (?, ?, ?)
  `, ['Business', 'Mock Career Interview', dialogueSample]);

  // Seed Grammar Lessons
  await db.runAsync(`
    INSERT INTO grammar_lessons (topic, explanation, examples_json, quiz_json)
    VALUES (?, ?, ?, ?)
  `, [
    'Present Perfect vs Past Simple',
    'Use Present Perfect for open experiences, and Past Simple for specific completed past events.',
    JSON.stringify(['I have worked here for 2 years (linked to now).', 'I worked there in 2024 (completed past).']),
    JSON.stringify({
      question: "Which sentence is correct for a finished action?",
      options: ["I have gone to London yesterday.", "I went to London yesterday.", "I was going to London yesterday."],
      answer: 1
    })
  ]);

  // Seed achievements
  const achievementBadges = [
    ['Streak Starter', 'Maintained a daily streak of 5+ days.', '🔥', 1],
    ['Vocabulary Master', 'Completed vocabulary review across all categories.', '🎓', 0],
    ['Confident Speaker', 'Spent over 30 minutes in speaking challenges.', '🎙️', 0]
  ];

  for (const ach of achievementBadges) {
    await db.runAsync(`
      INSERT INTO achievements (title, description, badge_icon, is_unlocked)
      VALUES (?, ?, ?, ?)
    `, ach);
  }

  // Seed settings default values
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('font_size', '16')`);
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('notifications_enabled', '1')`);
  await db.runAsync(`INSERT INTO settings (key, value) VALUES ('app_version', '1.0.0')`);

  console.log('Seeding finished successfully.');
}
