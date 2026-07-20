// State, controller, and offline data simulator logic for Fluent English Coach Web Simulator

// Seed / Mock Database Structure
const offlineVocab = [
    { id: 1, category: "Business", word: "Facilitate", pronunciation: "/fəˈsɪl.ɪ.teɪt/", meaning: "To make an action or process easy or easier.", example: "The new software will facilitate flawless workflow communication.", mistakes: "Don't confuse with 'make' - facilitate suggests smoothing a path already started.", synonyms: "Ease, expedite, assist", antonyms: "Hinder, block" },
    { id: 2, category: "Business", word: "Leverage", pronunciation: "/ˈliː.vər.ɪdʒ/", meaning: "To use something that you already have in order to achieve something new or better.", example: "We can leverage our existing relationship with the intermediate clients.", mistakes: "Avoid using it as a simple verb when 'use' is more appropriate.", synonyms: "Utilize, exploit", antonyms: "Waste, ignore" },
    { id: 3, category: "Travel", word: "Itinerary", pronunciation: "/aɪˈtɪn.ər.ər.i/", meaning: "A detailed plan or route of a journey.", example: "We must finalize our business trip itinerary before Monday.", mistakes: "Do not write 'itinery' - watch the spelling.", synonyms: "Schedule, path, guide", antonyms: "Random route" },
    { id: 4, category: "Daily Life", word: "Impeccable", pronunciation: "/ɪmˈpek.ə.bəl/", meaning: "Perfect, with no problems or bad parts.", example: "Her pronunciation was impeccable, sounding exactly like a confident natural English speaker.", mistakes: "Don't use with 'very' - impeccable already implies absolute perfection.", synonyms: "Flawless, spotless", antonyms: "Imperfect, flawed" },
    { id: 5, category: "Work", word: "Collaborate", pronunciation: "/kəˈlæb.ə.reɪt/", meaning: "To work jointly on an activity or project.", example: "Our design team will collaborate directly with intermediate developers.", mistakes: "Use 'collaborate on' a project, not 'collaborate a project'.", synonyms: "Cooperate, unite", antonyms: "Compete, isolate" },
    { id: 6, category: "Daily Life", word: "Exquisite", pronunciation: "/ɪkˈskwɪz.ɪt/", meaning: "Extremely beautiful and delicate.", example: "The speech patterns he used were exquisite.", mistakes: "Avoid using for simple daily tools; keep it for natural beauty/arts.", synonyms: "Beautiful, fine", antonyms: "Crude, poor" }
];

const offlineConversations = {
    Interview: [
        { role: "coach", text: "Welcome to our team! Tell me about a time you had to handle an eleventh-hour crisis." },
        { role: "user", text: "At my previous company, a crucial client database went offline on the eve of a launch. I coordinated with the DevOps lead to facilitate immediate backup restoration." },
        { role: "coach", text: "Impeccable. And how did you leverage your communication skills to calm the client?" },
        { role: "user", text: "I kept the channel transparent and provided hourly updates, showing absolute confidence." }
    ],
    Airport: [
        { role: "coach", text: "Good afternoon. May I see your ticket and travel itinerary, please?" },
        { role: "user", text: "Sure, here is my passport and printed travel itinerary." },
        { role: "coach", text: "Excellent. Are you checking in any bags for this long-haul flight?" },
        { role: "user", text: "Just one bag, and I'd love a seat with extra legroom if available." }
    ]
};

const offlinePronunciations = {
    TH: {
        words: "Thinking, Through, Although, Method",
        sentence: "The thinking actor went through a thorough script reading, although it was exhausting.",
    },
    R_L: {
        words: "Relationship, Leverage, Flawless, Really",
        sentence: "Really, maintaining flawless relationships requires incredible personal leverage.",
    },
    V_W: {
        words: "Vocabulary, Workflow, Exquisite, Workout",
        sentence: "We workout daily to expand our business vocabulary and streamline the overall workflow."
    }
};

const grammarLessons = {
    PresentPerfect: {
        title: "Present Perfect vs Past Simple",
        explanation: "Use the Present Perfect (have + past participle) for actions linked to the present. Use the Past Simple for finished actions in the past with a specific time.",
        examples: "Right: 'I have traveled to London' (experience). Right: 'I went to London yesterday' (finished past).",
        exercises: "Select 'I went' for yesterday, and 'I have worked' for ongoing career tasks."
    },
    Conditionals: {
        title: "Unreal Conditionals (Would/If)",
        explanation: "The second conditional uses 'If + past simple, would + verb'. It expresses imaginary or highly improbable situations in the present or future.",
        examples: "Right: 'If I had impeccable pronunciation, I would coach others.'",
        exercises: "Remember to use 'were' instead of 'was' for all pronouns: 'If I were you...'"
    }
};

// Current Active State
let currentTab = "home";
let learnCategory = "All";
let isSpeakingChallengeRecording = false;
let isPronunciationRecording = false;
let activeScenario = "Interview";
let activeScenarioIndex = 1;
let activePronunciationSound = "TH";
let currentQuizIndex = 0;

// User Statistics State
let userXP = parseInt(localStorage.getItem("fluent_user_xp") || "480");
let dailyStreak = parseInt(localStorage.getItem("fluent_user_streak") || "5");
let lessonsDone = parseInt(localStorage.getItem("fluent_lessons_done") || "15");

// Clock / Time simulator
function startClock() {
    setInterval(() => {
        const now = new Date();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const hrs = String(now.getHours()).padStart(2, '0');
        const clockEl = document.getElementById("sim-clock");
        if (clockEl) clockEl.textContent = `${hrs}:${mins}`;
    }, 1000);
}

// Play simulated text-to-speech using Web Speech Synthesis API
function playTTS(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9; // intermediate comfortable rate
        window.speechSynthesis.speak(utterance);
    } else {
        alert(`🔊 [Simulated Sound]: "${text}"`);
    }
}

// Tab switcher controller
function switchTab(tabName, element) {
    // Hide all active panels
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add("active");

    // Update bottom tab highlights
    document.querySelectorAll(".phone-bottom-tabs .tab-item").forEach(t => t.classList.remove("active"));
    if (element) {
        element.classList.add("active");
    } else {
        // Find bottom tab element corresponding to the name and activate it
        const tabs = document.querySelectorAll(".phone-bottom-tabs .tab-item");
        tabs.forEach(t => {
            if (t.textContent.toLowerCase().includes(tabName)) t.classList.add("active");
        });
    }

    currentTab = tabName;
}

// Set Learn category filter
function setLearnCategory(category, element) {
    learnCategory = category;
    document.querySelectorAll(".category-pill").forEach(p => p.classList.remove("active"));
    if (element) element.classList.add("active");
    renderLearnEntries();
}

// Global search filtering
function filterOfflineContent(query) {
    renderLearnEntries(query);
}

// Render Vocab Builder items dynamically
function renderLearnEntries(query = "") {
    const listContainer = document.getElementById("learn-entries-list");
    if (!listContainer) return;

    let filtered = offlineVocab;
    if (learnCategory !== "All") {
        filtered = filtered.filter(v => v.category === learnCategory);
    }

    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(v =>
            v.word.toLowerCase().includes(q) ||
            v.meaning.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center; padding: 20px; color:#6b7280;">No offline entries matching your filter.</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(v => `
        <div class="premium-card">
            <span class="muted-label">${v.category}</span>
            <div class="word-header" style="display:flex; justify-content:space-between; align-items:center;">
                <h3 class="premium-word" style="margin: 0; color:var(--primary); font-size:1.25rem;">${v.word}</h3>
                <button class="btn-audio" onclick="playTTS('${v.word}')">🔊 Speak</button>
            </div>
            <p style="font-size:0.85rem; color:var(--secondary-text); margin:4px 0;">${v.pronunciation}</p>
            <p style="font-size:0.9rem; margin:10px 0;"><strong>Meaning:</strong> ${v.meaning}</p>
            <p style="font-size:0.85rem; font-style:italic; color:#475569; margin-bottom:10px;">"${v.example}"</p>
            <div style="background:#fff7ed; padding:10px; border-radius:8px; font-size:0.8rem; border-left:3px solid var(--accent);">
                <strong>Common Mistake:</strong> ${v.mistakes}
            </div>
        </div>
    `).join('');
}

// Speaking Challenge record controller
function toggleSpeakingRecord() {
    const recordBtn = document.getElementById("btn-toggle-record");
    const waveBox = document.getElementById("speaking-wave-box");
    const playBtn = document.getElementById("btn-play-speak");
    const retryBtn = document.getElementById("btn-retry-speak");

    if (!isSpeakingChallengeRecording) {
        // Start Recording
        isSpeakingChallengeRecording = true;
        recordBtn.textContent = "⏹ Stop Challenge";
        recordBtn.classList.add("recording-active");
        waveBox.classList.add("recording-active");
        playBtn.classList.add("hidden");
        retryBtn.classList.add("hidden");
    } else {
        // Stop Recording
        isSpeakingChallengeRecording = false;
        recordBtn.textContent = "🎤 Challenge Recorded";
        recordBtn.classList.remove("recording-active");
        waveBox.classList.remove("recording-active");
        playBtn.classList.remove("hidden");
        retryBtn.classList.remove("hidden");

        // Award XP and save to local progress
        addXP(30);
    }
}

function playSimulatedRecording() {
    playTTS("This is a playback of your recorded intermediate speech response. Focus on minimizing hesitation filler words.");
}

function resetSpeakingChallenge() {
    document.getElementById("btn-play-speak").classList.add("hidden");
    document.getElementById("btn-retry-speak").classList.add("hidden");
    const recordBtn = document.getElementById("btn-toggle-record");
    recordBtn.textContent = "🎤 Start Speaking";
    recordBtn.classList.remove("recording-active");
}

// Dialogue scenario engine
function loadScenario(scenarioName) {
    activeScenario = scenarioName;
    activeScenarioIndex = 1;
    renderScenarioDialogue();
}

function renderScenarioDialogue() {
    const chatBox = document.getElementById("scenario-chat-box");
    if (!chatBox) return;

    const dialogs = offlineConversations[activeScenario];
    const visible = dialogs.slice(0, activeScenarioIndex);

    chatBox.innerHTML = visible.map(d => `
        <div class="dialogue-bubble ${d.role}">
            <strong>${d.role === "coach" ? "Fluent Coach 👔" : "You 🎙️"}</strong>
            <p style="margin: 4px 0 0 0;">${d.text}</p>
        </div>
    `).join('');

    chatBox.scrollTop = chatBox.scrollHeight;
}

function simulateSwapRoles() {
    alert("Swapping Roles: You will now speak the Coach prompts and get synthesized listening feedback!");
}

function continueConversationSimulator() {
    const dialogs = offlineConversations[activeScenario];
    if (activeScenarioIndex < dialogs.length) {
        activeScenarioIndex++;
        renderScenarioDialogue();
        addXP(15);
    } else {
        alert("Scenario completed! Play again or choose another offline dialogue.");
    }
}

// Practice Sub-sections tab controller
function switchPracticeSection(sectionName, element) {
    document.querySelectorAll(".practice-sub-view").forEach(v => v.classList.remove("active"));
    document.getElementById(`practice-${sectionName}`).classList.add("active");

    document.querySelectorAll(".practice-sub-selector .sub-tab-btn").forEach(b => b.classList.remove("active"));
    if (element) element.classList.add("active");
}

// Vocabulary Quiz logic
const quizQuestions = [
    {
        q: "Select the most premium, professional term for: 'I got your email'",
        options: ["I acknowledge receipt of your email.", "I received your message.", "Got it, thanks.", "Understood your point."],
        answer: 0,
        feedback: "Correct! 'I acknowledge receipt' is a standard business expression of high intermediate fluency."
    },
    {
        q: "Complete the collocation: 'We need to ____ a decision before the final review.'",
        options: ["do", "make", "take", "create"],
        answer: 1,
        feedback: "Correct! You always 'make' a decision, rather than 'do' a decision."
    },
    {
        q: "What is the correct idiom to say you're feeling slightly sick?",
        options: ["Hit the books", "Piece of cake", "Under the weather", "Break the ice"],
        answer: 2,
        feedback: "Correct! 'Under the weather' implies mild, non-serious indisposition."
    }
];

function renderQuizQuestion() {
    const qNum = document.getElementById("quiz-question-number");
    const qText = document.getElementById("quiz-question-text");
    const optBox = document.getElementById("quiz-options-box");
    const feedbackBox = document.getElementById("quiz-feedback");

    if (!qNum || !qText || !optBox) return;

    feedbackBox.classList.add("hidden");

    const activeQuestion = quizQuestions[currentQuizIndex];
    qNum.textContent = `QUESTION ${currentQuizIndex + 1} OF ${quizQuestions.length}`;
    qText.textContent = activeQuestion.q;

    optBox.innerHTML = activeQuestion.options.map((opt, idx) => `
        <button class="quiz-option-btn" onclick="checkQuizAnswer(${idx})">${opt}</button>
    `).join('');
}

function checkQuizAnswer(selectedIdx) {
    const activeQuestion = quizQuestions[currentQuizIndex];
    const optionButtons = document.querySelectorAll(".quiz-option-btn");
    const feedbackBox = document.getElementById("quiz-feedback");

    optionButtons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === activeQuestion.answer) {
            btn.classList.add("correct");
        } else if (idx === selectedIdx) {
            btn.classList.add("incorrect");
        }
    });

    feedbackBox.textContent = activeQuestion.feedback;
    feedbackBox.classList.remove("hidden");

    // Award XP
    if (selectedIdx === activeQuestion.answer) {
        addXP(25);
    }

    // Advance after short delay
    setTimeout(() => {
        currentQuizIndex = (currentQuizIndex + 1) % quizQuestions.length;
        renderQuizQuestion();
    }, 4000);
}

// Pronunciation sound lab selector
function loadPronunciation(soundKey, element) {
    activePronunciationSound = soundKey;
    document.querySelectorAll(".sound-pill").forEach(b => b.classList.remove("active"));
    if (element) element.classList.add("active");

    const data = offlinePronunciations[soundKey];
    document.getElementById("pron-word-title").textContent = data.words;
    document.getElementById("pron-sentence").textContent = data.sentence;
}

function togglePronunciationRecord() {
    const timer = document.getElementById("pron-record-timer");
    const recordBtn = document.getElementById("btn-pron-record");

    if (!isPronunciationRecording) {
        isPronunciationRecording = true;
        timer.classList.remove("hidden");
        recordBtn.textContent = "⏹ Stop Listening";
        recordBtn.classList.add("recording-active");
    } else {
        isPronunciationRecording = false;
        timer.classList.add("hidden");
        recordBtn.textContent = "🎤 Record Yourself";
        recordBtn.classList.remove("recording-active");
        alert("Pronunciation analysis complete! Your sound matched the professional guide model with 94% accuracy.");
        addXP(20);
    }
}

// Rule-based spelling / grammar corrector for Writing Coach
function analyzeWritingProgress() {
    const text = document.getElementById("writing-input").value;
    const wordCountEl = document.getElementById("writing-word-count");
    const errorCountEl = document.getElementById("writing-error-count");
    const feedbackList = document.getElementById("writing-feedback-suggestions");

    if (!text) {
        wordCountEl.textContent = "0";
        errorCountEl.textContent = "0";
        feedbackList.innerHTML = `<p class="empty-placeholder">Begin typing to receive instant rule-based spelling, casing, and grammar suggestions.</p>`;
        return;
    }

    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    wordCountEl.textContent = words.length;

    // Run simple rule checks offline
    const suggestions = [];

    // Rule 1: check lowercase 'i'
    if (/\bi\b/.test(text)) {
        suggestions.push({
            type: "Grammar",
            issue: "Always capitalize the personal pronoun 'I'.",
            fix: "Change 'i' to 'I'."
        });
    }

    // Rule 2: Basic double spacing check
    if (/\s{2,}/.test(text)) {
        suggestions.push({
            type: "Formatting",
            issue: "Multiple consecutive spaces found.",
            fix: "Use single spaces between words."
        });
    }

    // Rule 3: textbook phrase optimization suggestion
    if (/very happy/i.test(text)) {
        suggestions.push({
            type: "Fluency Boost",
            issue: "Instead of 'very happy', leverage professional vocabulary to sound more natural.",
            fix: "Try: 'thrilled', 'absolutely delighted', or 'over the moon'."
        });
    }

    if (/very basic/i.test(text)) {
        suggestions.push({
            type: "Fluency Boost",
            issue: "Instead of 'very basic', sound like an advanced confident speaker.",
            fix: "Try: 'fundamental' or 'elementary'."
        });
    }

    errorCountEl.textContent = suggestions.length;

    if (suggestions.length === 0) {
        feedbackList.innerHTML = `<div style="background:#dcfce7; border-left:4px solid var(--success); padding:10px; border-radius:8px; font-size:0.85rem;">
            <strong>Impeccable style!</strong> No rule issues found in your intermediate writing passage so far.
        </div>`;
    } else {
        feedbackList.innerHTML = suggestions.map(s => `
            <div class="writing-feedback-suggestion-item">
                <strong>[${s.type}]</strong> ${s.issue} <br>
                <span style="color:var(--primary); font-weight:700;">Suggestion: ${s.fix}</span>
            </div>
        `).join('');
    }
}

// Grammar Master lessons
function loadGrammarLesson(lessonKey) {
    const contentBox = document.getElementById("grammar-content");
    const lesson = grammarLessons[lessonKey];

    if (!contentBox || !lesson) return;

    contentBox.innerHTML = `
        <h3 style="color:var(--primary);">${lesson.title}</h3>
        <p style="font-size:0.9rem; line-height:1.5;">${lesson.explanation}</p>
        <div style="background:#eff6ff; padding:10px; border-radius:8px; border-left:3px solid var(--primary); font-size:0.85rem; margin:10px 0;">
            <strong>Practice Collocations:</strong><br>
            ${lesson.examples}
        </div>
        <p style="font-size:0.85rem; font-style:italic; color:var(--secondary-text);">${lesson.exercises}</p>
        <button class="btn-primary" style="width:100%; margin-top:10px;" onclick="addXP(30); alert('Grammar concept complete!');">Complete Lesson & Earn +30 XP</button>
    `;
}

// XP reward state manager
function addXP(amount) {
    userXP += amount;
    localStorage.setItem("fluent_user_xp", userXP);
    const xpEl = document.getElementById("xp-count");
    if (xpEl) xpEl.textContent = userXP;

    // Recalculate level if milestone crossed
    recalculateUserLevel();
}

function recalculateUserLevel() {
    const levelEl = document.getElementById("user-current-level");
    if (!levelEl) return;

    let newLevel = "Intermediate";
    if (userXP > 800) {
        newLevel = "English Master 🏆";
    } else if (userXP > 650) {
        newLevel = "Confident Speaker 🗣️";
    } else if (userXP > 500) {
        newLevel = "Upper Intermediate 🚀";
    }

    levelEl.textContent = newLevel;
}

// Reset offline coach progress safely
function resetAllCoachProgress() {
    if (confirm("Are you sure you want to completely erase all local Fluent Coach progress, custom vocabulary bookmarks, streaks, and XP logs? This cannot be undone.")) {
        localStorage.removeItem("fluent_user_xp");
        localStorage.removeItem("fluent_user_streak");
        localStorage.removeItem("fluent_lessons_done");

        userXP = 480;
        dailyStreak = 5;
        lessonsDone = 15;

        alert("All local SQLite statistics have been reset successfully.");
        window.location.reload();
    }
}

// Startup Initializers
window.addEventListener("DOMContentLoaded", () => {
    startClock();
    renderLearnEntries();
    loadScenario("Interview");
    renderQuizQuestion();
    loadPronunciation("TH");
    loadGrammarLesson("PresentPerfect");
    recalculateUserLevel();
});
