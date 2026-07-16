/* EduMentor AI Android Mobile Simulator - Frontend Logic */
class EduMentorSimulator {
    constructor() {
        this.currentTheme = 'dark';
        this.currentPersona = 'Student'; // Student, Lecturer, Admin
        this.currentUser = {
            name: 'Demo Student',
            username: 'student',
            role: 'Student'
        };
        this.currentActiveTab = 'dashboard';
        this.streakCount = 5;
        this.isPoweredOn = true;

        // Mock Web Audio API Synth Context
        this.audioCtx = null;

        // Mock Knowledge Base Documents Mapping (Initial Syllabus + Notes)
        this.knowledgeBase = [
            { id: 1, title: 'Syllabus_CS301.pdf', type: 'syllabus', content: 'Database systems CS301. Course content: relational data model, schemas, normalization, anomalies, 1NF, 2NF, 3NF, BCNF, database design, relational algebra, SQL DDL DML queries.' },
            { id: 2, title: 'Lecture_Notes_DB_Normalization.pdf', type: 'notes', content: 'Database Normalization minimizes data redundancy. Anomalies: insertion anomaly, update anomaly, deletion anomaly. First Normal Form (1NF) requires atomic attributes. Second Normal Form (2NF) resolves partial dependencies. Third Normal Form (3NF) resolves transitive functional dependencies. Boyce-Codd Normal Form (BCNF) requires every determinant to be a superkey.' },
            { id: 3, title: 'Networking_TCP_vs_UDP.pdf', type: 'notes', content: 'TCP (Transmission Control Protocol) is connection-oriented, reliable, guarantees packet ordering, handles flow control, and uses a three-way handshake. UDP (User Datagram Protocol) is connectionless, faster, has low overhead, but is unreliable and does not guarantee packet delivery.' },
            { id: 4, title: 'Exam_PastPaper_2024.pdf', type: 'papers', content: 'Database Systems Midterm. Q1: Explain transitive dependencies in 3NF with examples. Q2: Design schemas free of insertion anomalies. Q3: Difference between TCP three-way handshake and UDP connectionless transmission.' }
        ];

        // Active Courses Data Mapping
        this.coursesData = [
            {
                id: 'db-systems',
                title: 'Database Systems (CS301)',
                code: 'CS301',
                progress: 75,
                modules: [
                    {
                        title: 'Module 1: Relational Model',
                        topics: ['Relational Database Schemas', 'Primary and Foreign Keys']
                    },
                    {
                        title: 'Module 2: Database Normalization',
                        topics: ['Insertion & Deletion Anomalies', 'First & Second Normal Form', 'Third Normal Form (3NF) & BCNF']
                    }
                ]
            },
            {
                id: 'comp-networks',
                title: 'Computer Networks (CS302)',
                code: 'CS302',
                progress: 45,
                modules: [
                    {
                        title: 'Module 1: Transport Layer',
                        topics: ['TCP connection-oriented protocol', 'UDP unreliable packet transmission']
                    }
                ]
            }
        ];

        // Mock Recent Chat Query History
        this.chatQueries = [
            { query: 'Explain database normalization.', date: 'Today' },
            { query: 'What is the difference between TCP and UDP?', date: 'Yesterday' }
        ];

        // Mock Bookmarks & Downloads state tracking
        this.bookmarks = [1, 2];
        this.downloads = [1];

        // Planner Tasks
        this.plannerTasks = [
            { id: 1, text: 'Read database normalization notes', completed: true },
            { id: 2, text: 'Review past midterm exams', completed: false },
            { id: 3, text: 'Consult EduMentor AI about TCP handshakes', completed: false }
        ];

        // Accounts list (Admin management)
        this.users = [
            { name: 'System Administrator', username: 'admin', role: 'Admin' },
            { name: 'Demo Teacher', username: 'teacher', role: 'Lecturer' },
            { name: 'Demo Student', username: 'student', role: 'Student' }
        ];
    }

    init() {
        this.setupClock();
        this.renderAllViews();
        this.setupChatAutoResize();
        this.playHapticSound(600, 0.08); // Initial startup bip
        setTimeout(() => {
            const splash = document.getElementById('screen-splash');
            const onboard = document.getElementById('screen-onboarding');
            if (splash && onboard) {
                splash.classList.remove('active');
                onboard.classList.add('active');
            }
        }, 2200);
    }

    setupClock() {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const clockEl = document.getElementById('phone-clock');
            if (clockEl) clockEl.innerText = timeStr;
        };
        updateClock();
        setInterval(updateClock, 30000);
    }

    // Audio Haptic generator using Web Audio API
    playHapticSound(freq = 440, duration = 0.1, type = 'sine') {
        try {
            if (!this.audioCtx) {
                this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();

            osc.type = type;
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, this.audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.12, this.audioCtx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            console.warn('Audio synthesis context error:', e);
        }
    }

    playHapticSuccess() {
        this.playHapticSound(523.25, 0.08); // C5 note
        setTimeout(() => this.playHapticSound(659.25, 0.12), 80); // E5 note
    }

    // Outer UI Controllers
    switchPersona(persona) {
        this.playHapticSound(280, 0.05);
        this.currentPersona = persona;

        // Update outer controls active states
        document.querySelectorAll('.btn-persona').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-persona-${persona.toLowerCase()}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Automatically configure mock login active roles
        if (persona === 'Student') {
            this.currentUser = { name: 'Demo Student', username: 'student', role: 'Student' };
        } else if (persona === 'Lecturer') {
            this.currentUser = { name: 'Demo Teacher', username: 'teacher', role: 'Lecturer' };
        } else if (persona === 'Admin') {
            this.currentUser = { name: 'System Administrator', username: 'admin', role: 'Admin' };
        }

        // Apply dynamically inside simulator if logged in
        const shell = document.getElementById('screen-shell');
        if (shell && shell.classList.contains('active')) {
            this.renderAllViews();
        }
    }

    toggleSimulatorTheme() {
        this.playHapticSound(320, 0.05);
        const body = document.body;
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            this.currentTheme = 'light';
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            this.currentTheme = 'dark';
        }
    }

    toggleSimulatorPower() {
        const dev = document.querySelector('.android-device');
        if (dev) {
            if (dev.classList.contains('powered-off')) {
                dev.classList.remove('powered-off');
                this.isPoweredOn = true;
                this.resetSimulator();
            } else {
                dev.classList.add('powered-off');
                this.isPoweredOn = false;
            }
        }
    }

    resetSimulator() {
        this.playHapticSound(400, 0.2, 'triangle');
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));

        const splash = document.getElementById('screen-splash');
        if (splash) splash.classList.add('active');

        setTimeout(() => {
            splash.classList.remove('active');
            document.getElementById('screen-onboarding').classList.add('active');
        }, 1500);
    }

    // Onboarding Actions
    skipOnboarding() {
        this.playHapticSound(280, 0.05);
        this.goToAuth();
    }

    nextOnboarding() {
        this.playHapticSound(320, 0.05);
        const slides = document.querySelectorAll('.onboarding-slide');
        let activeIdx = 0;
        slides.forEach((slide, idx) => {
            if (slide.classList.contains('active')) {
                activeIdx = idx;
            }
        });

        slides[activeIdx].classList.remove('active');
        const dots = document.querySelectorAll('.onboarding-dots .dot');
        dots[activeIdx].classList.remove('active');

        const nextIdx = activeIdx + 1;
        if (nextIdx < slides.length) {
            slides[nextIdx].classList.add('active');
            dots[nextIdx].classList.add('active');
        } else {
            this.goToAuth();
        }
    }

    goToAuth() {
        document.getElementById('screen-onboarding').classList.remove('active');
        document.getElementById('screen-auth').classList.add('active');
        this.showAuthSub('login');
    }

    // Auth screen subpanels
    showAuthSub(type) {
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        const text = document.getElementById('auth-toggle-text');
        const btn = document.getElementById('auth-toggle-btn');
        const desc = document.getElementById('auth-header-desc');

        if (type === 'login') {
            document.getElementById('login-form').classList.add('active');
            desc.innerText = 'Sign in to start learning';
            text.innerText = "Don't have an account?";
            btn.innerText = 'Sign Up';
            btn.onclick = () => this.showAuthSub('register');
        } else if (type === 'register') {
            document.getElementById('register-form').classList.add('active');
            desc.innerText = 'Join EduMentor';
            text.innerText = 'Already have an account?';
            btn.innerText = 'Sign In';
            btn.onclick = () => this.showAuthSub('login');
        } else if (type === 'forgot') {
            document.getElementById('forgot-form').classList.add('active');
            desc.innerText = 'Reset your password';
            text.innerText = 'Remember password?';
            btn.innerText = 'Sign In';
            btn.onclick = () => this.showAuthSub('login');
        }
    }

    toggleAuthMode() {
        this.playHapticSound(320, 0.05);
    }

    handleLogin(e) {
        e.preventDefault();
        this.playHapticSuccess();
        const userVal = document.getElementById('login-username').value.trim().toLowerCase();

        // Match mock user or fallback
        let targetUser = this.users.find(u => u.username === userVal);
        if (!targetUser) {
            targetUser = { name: userVal || 'Demo Learner', username: userVal || 'student', role: this.currentPersona };
            this.users.push(targetUser);
        }

        this.currentUser = targetUser;
        this.currentPersona = targetUser.role;
        this.enterAppShell();
    }

    handleRegister(e) {
        e.preventDefault();
        this.playHapticSuccess();
        const name = document.getElementById('register-name').value;
        const user = document.getElementById('register-username').value;
        const role = document.querySelector('input[name="reg-role"]:checked').value;
        const mappedRole = role === 'lecturer' ? 'Lecturer' : 'Student';

        this.currentUser = { name, username: user, role: mappedRole };
        this.currentPersona = mappedRole;
        this.users.push(this.currentUser);
        this.enterAppShell();
    }

    handleForgot() {
        this.playHapticSuccess();
        alert('Password reset instructions sent. Entering dashboard with active profile...');
        this.enterAppShell();
    }

    handleGoogleLogin() {
        this.playHapticSuccess();
        this.currentUser = { name: 'Google Student', username: 'google_user', role: 'Student' };
        this.currentPersona = 'Student';
        this.enterAppShell();
    }

    enterAppShell() {
        document.getElementById('screen-auth').classList.remove('active');
        document.getElementById('screen-shell').classList.add('active');
        this.renderAllViews();
        this.switchTab('dashboard');
    }

    logoutSimulator() {
        this.playHapticSound(300, 0.1);
        document.getElementById('screen-shell').classList.remove('active');
        document.getElementById('screen-auth').classList.add('active');
        this.showAuthSub('login');
    }

    // App Navigation router
    switchTab(tabId) {
        this.playHapticSound(340, 0.05);
        this.currentActiveTab = tabId;

        // Hide all views first
        document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

        // Handle profile roles visibility redirection
        if (tabId === 'profile' && this.currentUser.role === 'Lecturer') {
            const view = document.getElementById('view-lecturer');
            if (view) view.classList.add('active');
        } else if (tabId === 'profile' && this.currentUser.role === 'Admin') {
            const view = document.getElementById('view-admin');
            if (view) view.classList.add('active');
        } else {
            const activeView = document.getElementById(`view-${tabId}`);
            if (activeView) activeView.classList.add('active');
        }

        const activeTabBtn = document.getElementById(`tab-${tabId}`);
        if (activeTabBtn) activeTabBtn.classList.add('active');
    }

    // Phone keys routing
    handlePhoneBack() {
        this.playHapticSound(260, 0.05);
        if (this.currentActiveTab !== 'dashboard') {
            this.switchTab('dashboard');
        }
    }

    handlePhoneHome() {
        this.playHapticSound(300, 0.05);
        this.switchTab('dashboard');
    }

    handlePhoneRecents() {
        this.playHapticSound(330, 0.05);
        this.showFeatureWip('App Task Switcher');
    }

    // Rendering all elements
    renderAllViews() {
        this.renderDashboard();
        this.renderCoursesAccordion();
        this.renderResourcesList();
        this.renderPlanner();
        this.renderProfile();
        this.renderLecturerPanel();
        this.renderAdminPanel();
        this.updateGlobalKbStats();
    }

    updateGlobalKbStats() {
        const docCountEl = document.getElementById('kb-docs-count');
        const chunkCountEl = document.getElementById('kb-chunks-count');
        if (docCountEl) docCountEl.innerText = this.knowledgeBase.length;
        if (chunkCountEl) chunkCountEl.innerText = this.knowledgeBase.length * 10 + 2;
    }

    renderDashboard() {
        const usernameEl = document.getElementById('dash-username');
        const roleEl = document.getElementById('dash-role');
        const streakEl = document.getElementById('streak-count');

        if (usernameEl) usernameEl.innerText = this.currentUser.name;
        if (roleEl) {
            roleEl.innerText = this.currentUser.role;
            roleEl.style.background = this.currentUser.role === 'Lecturer' ? 'rgba(79,70,229,0.15)' : (this.currentUser.role === 'Admin' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)');
            roleEl.style.color = this.currentUser.role === 'Lecturer' ? 'var(--primary)' : (this.currentUser.role === 'Admin' ? 'var(--danger)' : 'var(--secondary)');
        }
        if (streakEl) streakEl.innerText = this.streakCount;

        // Render Recent queries on home
        const container = document.getElementById('recent-queries-container');
        if (container) {
            container.innerHTML = '';
            if (this.chatQueries.length === 0) {
                container.innerHTML = '<p style="font-size:0.75rem; color:var(--text-muted);">No recent study queries.</p>';
                return;
            }
            this.chatQueries.forEach(q => {
                const item = document.createElement('div');
                item.className = 'recent-query-item';
                item.onclick = () => {
                    this.switchTab('chat');
                    this.prefillChatInput(q.query);
                };
                item.innerHTML = `
                    <span class="recent-query-text">💡 "${q.query}"</span>
                    <span class="recent-query-arrow">➔</span>
                `;
                container.appendChild(item);
            });
        }
    }

    incrementStreak() {
        this.playHapticSuccess();
        this.streakCount++;
        const el = document.getElementById('streak-count');
        if (el) el.innerText = this.streakCount;
    }

    // Courses directory browser
    renderCoursesAccordion() {
        const container = document.getElementById('courses-accordion-container');
        if (!container) return;
        container.innerHTML = '';

        this.coursesData.forEach(c => {
            const card = document.createElement('div');
            card.className = 'course-node';
            card.innerHTML = `
                <div class="course-node-header" onclick="this.closest('.course-node').classList.toggle('open')">
                    <div>
                        <div class="course-node-title">${c.title}</div>
                        <div class="course-node-meta">${c.code} • ${c.progress}% Complete</div>
                    </div>
                    <span class="accordion-arrow">▶</span>
                </div>
                <div class="course-node-body">
                    ${c.modules.map(mod => `
                        <div class="module-node">
                            <div class="module-title">${mod.title}</div>
                            <div class="topics-list">
                                ${mod.topics.map(topic => `
                                    <div class="topic-item-row" onclick="edumentor.askAITutorAbout('${topic}')">
                                        <span><span class="topic-bullet">▪</span> ${topic}</span>
                                        <button class="btn-ask-topic">Ask Mentor AI</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(card);
        });
    }

    filterCourses(val) {
        const container = document.getElementById('courses-accordion-container');
        if (!container) return;

        const q = val.toLowerCase();
        document.querySelectorAll('.course-node').forEach((node, idx) => {
            const course = this.coursesData[idx];
            const match = course.title.toLowerCase().includes(q) || course.code.toLowerCase().includes(q) || JSON.stringify(course.modules).toLowerCase().includes(q);
            node.style.display = match ? 'block' : 'none';
        });
    }

    askAITutorAbout(topic) {
        this.switchTab('chat');
        this.prefillChatInput(`Help me understand ${topic}.`);
    }

    openCourseDetail(courseTitle) {
        this.switchTab('courses');
        const input = document.getElementById('courses-search-input');
        if (input) {
            input.value = courseTitle;
            this.filterCourses(courseTitle);
        }
    }

    // Resources list with download/bookmark handlers
    renderResourcesList() {
        const container = document.getElementById('resources-container');
        if (!container) return;
        container.innerHTML = '';

        this.knowledgeBase.forEach(doc => {
            const isBookmarked = this.bookmarks.includes(doc.id);
            const isDownloaded = this.downloads.includes(doc.id);

            const card = document.createElement('div');
            card.className = 'resource-card';
            card.dataset.type = doc.type;
            card.innerHTML = `
                <div class="resource-icon-box">
                    ${doc.type === 'notes' ? '📝' : (doc.type === 'syllabus' ? '📋' : '📄')}
                </div>
                <div class="resource-info">
                    <h4>${doc.title}</h4>
                    <div class="resource-meta">${doc.content.substring(0, 45)}...</div>
                </div>
                <div class="resource-actions">
                    <button class="btn-res-act ${isBookmarked ? 'active' : ''}" onclick="edumentor.toggleBookmark(${doc.id}, this)">
                        🔖
                    </button>
                    <button class="btn-res-act ${isDownloaded ? 'downloaded' : ''}" onclick="edumentor.toggleDownload(${doc.id}, this)">
                        ${isDownloaded ? '✓' : '⬇'}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    filterResources(val) {
        const container = document.getElementById('resources-container');
        if (!container) return;
        const q = val.toLowerCase();

        document.querySelectorAll('.resource-card').forEach(card => {
            const title = card.querySelector('h4').innerText.toLowerCase();
            const meta = card.querySelector('.resource-meta').innerText.toLowerCase();
            card.style.display = (title.includes(q) || meta.includes(q)) ? 'flex' : 'none';
        });
    }

    filterResourceType(type, btn) {
        this.playHapticSound(300, 0.05);
        document.querySelectorAll('.resource-tabs .tab-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        document.querySelectorAll('.resource-card').forEach(card => {
            if (type === 'all' || card.dataset.type === type) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    toggleBookmark(docId, btn) {
        this.playHapticSound(320, 0.05);
        const idx = this.bookmarks.indexOf(docId);
        if (idx !== -1) {
            this.bookmarks.splice(idx, 1);
            btn.classList.remove('active');
        } else {
            this.bookmarks.push(docId);
            btn.classList.add('active');
        }
        const bEl = document.getElementById('bookmarks-count');
        if (bEl) bEl.innerText = this.bookmarks.length;
    }

    toggleDownload(docId, btn) {
        this.playHapticSound(360, 0.05);
        const idx = this.downloads.indexOf(docId);
        if (idx !== -1) {
            this.downloads.splice(idx, 1);
            btn.classList.remove('downloaded');
            btn.innerText = '⬇';
        } else {
            this.downloads.push(docId);
            btn.classList.add('downloaded');
            btn.innerText = '✓';
        }
    }

    // Planner actions
    renderPlanner() {
        const container = document.getElementById('planner-tasks-container');
        if (!container) return;
        container.innerHTML = '';

        this.plannerTasks.forEach(t => {
            const item = document.createElement('div');
            item.className = `task-item ${t.completed ? 'completed' : ''}`;
            item.onclick = () => this.togglePlannerTask(t.id);
            item.innerHTML = `
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="event.stopPropagation(); edumentor.togglePlannerTask(${t.id})">
                <span class="task-text">${t.text}</span>
            `;
            container.appendChild(item);
        });
    }

    togglePlannerTask(id) {
        this.playHapticSound(320, 0.05);
        const task = this.plannerTasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.renderPlanner();
        }
    }

    addNewPlannerTask() {
        const val = prompt('Enter study goal title:');
        if (val && val.trim()) {
            this.playHapticSuccess();
            this.plannerTasks.push({
                id: Date.now(),
                text: val.trim(),
                completed: false
            });
            this.renderPlanner();
        }
    }

    // Profile settings
    renderProfile() {
        const avatarEl = document.getElementById('profile-avatar-char');
        const nameEl = document.getElementById('profile-full-name');
        const metaEl = document.getElementById('profile-meta');

        if (avatarEl) avatarEl.innerText = this.currentUser.name.charAt(0);
        if (nameEl) nameEl.innerText = this.currentUser.name;
        if (metaEl) metaEl.innerText = `${this.currentUser.role === 'Student' ? 'BSc Information Technology' : 'Academic Faculty'} • Semester 5`;
    }

    // Chat Logic with Custom Academic Response Builder (Gemini Mocked RAG Pipeline)
    setupChatAutoResize() {
        const textarea = document.getElementById('chat-textarea-input');
        if (textarea) {
            textarea.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight > 60 ? 60 : this.scrollHeight) + 'px';
            });
        }
    }

    prefillChatInput(text) {
        const textarea = document.getElementById('chat-textarea-input');
        if (textarea) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input'));
        }
    }

    handleChatKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            this.sendChatMessage();
        }
    }

    triggerVoiceInput() {
        this.playHapticSound(440, 0.1);
        const container = document.getElementById('audio-input-indicator');
        if (container) {
            container.classList.remove('hidden');
            setTimeout(() => {
                container.classList.add('hidden');
                this.prefillChatInput('What is the difference between TCP and UDP?');
                this.playHapticSuccess();
            }, 3000);
        }
    }

    cancelVoiceInput() {
        const container = document.getElementById('audio-input-indicator');
        if (container) container.classList.add('hidden');
    }

    clearChatHistory() {
        this.playHapticSound(240, 0.1);
        const container = document.getElementById('chat-messages-box');
        if (container) {
            container.innerHTML = `
                <div class="chat-welcome-state">
                    <span class="welcome-robot">🤖</span>
                    <h3>I am your Academic Mentor</h3>
                    <p>I answer based on uploaded syllabus, lecture notes, textbooks, and previous exam papers. Pick a suggestion below to test my RAG pipeline:</p>
                    <div class="prompt-suggestions">
                        <button class="prompt-suggest-btn" onclick="edumentor.prefillChatInput('Explain database normalization.')">
                            💡 "Explain database normalization."
                        </button>
                        <button class="prompt-suggest-btn" onclick="edumentor.prefillChatInput('What is the difference between TCP and UDP?')">
                            💡 "What is the difference between TCP and UDP?"
                        </button>
                    </div>
                </div>
            `;
        }
    }

    sendChatMessage() {
        const textarea = document.getElementById('chat-textarea-input');
        if (!textarea || !textarea.value.trim()) return;

        const val = textarea.value.trim();
        this.playHapticSound(450, 0.05);

        // Append student message bubble
        const box = document.getElementById('chat-messages-box');
        if (box) {
            const welcome = box.querySelector('.chat-welcome-state');
            if (welcome) welcome.remove();

            const studBubble = document.createElement('div');
            studBubble.className = 'message-bubble student';
            studBubble.innerText = val;
            box.appendChild(studBubble);
            box.scrollTop = box.scrollHeight;
        }

        // Reset input fields
        textarea.value = '';
        textarea.style.height = '32px';

        // Trigger step-by-step retrieved contexts and RAG flow logging
        const flowPanel = document.getElementById('rag-flow-panel');
        if (flowPanel) {
            flowPanel.classList.remove('hidden');
            const step1 = document.getElementById('rag-step-search');
            const step2 = document.getElementById('rag-step-retrieved');
            const step3 = document.getElementById('rag-step-llm');

            step1.style.color = '#cbd5e1';
            step2.style.color = 'var(--text-muted)';
            step3.style.color = 'var(--text-muted)';

            setTimeout(() => {
                step1.style.color = 'var(--secondary)';
                step2.style.color = '#cbd5e1';
                this.playHapticSound(500, 0.02);
            }, 800);

            setTimeout(() => {
                step2.style.color = 'var(--secondary)';
                step3.style.color = '#cbd5e1';
                this.playHapticSound(550, 0.02);
            }, 1600);

            setTimeout(() => {
                step3.style.color = 'var(--secondary)';
                this.playHapticSound(600, 0.02);
                flowPanel.classList.add('hidden');

                // Construct Gemini response mapping
                this.generateAiResponse(val);
            }, 2400);
        } else {
            // instant fall-back if indicator missing
            this.generateAiResponse(val);
        }
    }

    generateAiResponse(query) {
        this.playHapticSuccess();
        const box = document.getElementById('chat-messages-box');
        if (!box) return;

        const aiBubble = document.createElement('div');
        aiBubble.className = 'message-bubble ai';

        // Match Query keywords to mock a smart RAG semantic look-up
        const q = query.toLowerCase();
        let answerMarkdown = '';
        let matchedSources = [];

        if (q.includes('normal') || q.includes('database') || q.includes('1nf') || q.includes('3nf')) {
            matchedSources = ['Syllabus_CS301.pdf', 'Lecture_Notes_DB_Normalization.pdf'];
            answerMarkdown = `
                <h3>Database Normalization Guide</h3>
                <p>Database Normalization is the formal process of structuring a relational schema to minimize data redundancy and prevent data anomalies.</p>

                <strong>Step-by-Step Normal Forms:</strong>
                <ul>
                    <li><strong>1NF:</strong> Eliminates duplicate attributes and forces all fields to have atomic values.</li>
                    <li><strong>2NF:</strong> Removes partial dependencies. No non-prime attribute is dependent on any proper subset of any candidate key.</li>
                    <li><strong>3NF:</strong> Eliminates transitive functional dependencies. Every non-prime attribute is non-transitively dependent on every candidate key.</li>
                </ul>

                <pre><code>// Example schema in 3NF
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE
);</code></pre>

                <p><strong>Related Topics:</strong> Boyce-Codd Normal Form (BCNF), Multi-valued dependencies, Cosine distance similarity metrics.</p>
            `;
        } else if (q.includes('tcp') || q.includes('udp') || q.includes('network')) {
            matchedSources = ['Networking_TCP_vs_UDP.pdf', 'Exam_PastPaper_2024.pdf'];
            answerMarkdown = `
                <h3>TCP vs UDP Protocol Breakdown</h3>
                <p>Both are critical transport layer protocols used inside packet routing networks, but they solve different problems.</p>

                <p><strong>TCP (Transmission Control Protocol):</strong></p>
                <ul>
                    <li><strong>Connection-Oriented:</strong> Requires three-way handshake before exchange (SYN, SYN-ACK, ACK).</li>
                    <li><strong>Reliability:</strong> Resends lost packets, tracks order numbers, performs flow congestion checks.</li>
                </ul>

                <p><strong>UDP (User Datagram Protocol):</strong></p>
                <ul>
                    <li><strong>Connectionless:</strong> Sends packet stream without any handshake handshake checks.</li>
                    <li><strong>Performance:</strong> Lightweight, low latency overhead, ideal for gaming and streaming.</li>
                </ul>

                <p><strong>Related Topics:</strong> DNS resolution, TCP sliding window, Socket multiplexing.</p>
            `;
        } else {
            // STRICT RESPONSE RULE: Fall back to default academic guidance if info unavailable in current materials
            answerMarkdown = `<p>This topic is not available in your current course materials. Please upload relevant notes or consult your lecturer.</p>`;
        }

        // Render response bubble
        aiBubble.innerHTML = `
            <div class="ai-message-header">
                <span>🤖 EduMentor Personal AI</span>
                <div class="ai-msg-actions">
                    <button class="btn-msg-action" onclick="navigator.clipboard.writeText(this.closest('.message-bubble').querySelector('.message-content').innerText); edumentor.playHapticSuccess(); alert('Answer copied to clipboard!');" title="Copy Reply">📋 Copy</button>
                    <button class="btn-msg-action" onclick="edumentor.saveResponse('${query.replace(/'/g, "\\'")}');" title="Save Reply">⭐ Save</button>
                </div>
            </div>
            <div class="message-content">
                ${answerMarkdown}
            </div>
            ${matchedSources.length > 0 ? `
                <div class="ai-sources-ref">
                    📚 Sources: ${matchedSources.join(' | ')}
                </div>
            ` : ''}
        `;

        box.appendChild(aiBubble);
        box.scrollTop = box.scrollHeight;

        // Feed query back to recent searches
        if (!this.chatQueries.some(history => history.query.toLowerCase() === query.toLowerCase())) {
            this.chatQueries.unshift({ query, date: 'Just now' });
            this.renderDashboard();
        }
    }

    saveResponse(query) {
        this.playHapticSuccess();
        alert(`Saved academic answer for "${query}" to learning progress list!`);
    }

    // Lecturer Features Panel
    renderLecturerPanel() {
        const container = document.getElementById('managed-content-container');
        if (!container) return;
        container.innerHTML = '';

        this.knowledgeBase.forEach(doc => {
            const item = document.createElement('div');
            item.className = 'managed-item';
            item.innerHTML = `
                <div class="managed-details">
                    <h4>📄 ${doc.title}</h4>
                    <span>Category: <strong>${doc.type.toUpperCase()}</strong> • Chunks mapped: <strong>10</strong></span>
                </div>
                <button class="btn-delete-doc" onclick="edumentor.deleteDocument(${doc.id})">🗑️ Delete</button>
            `;
            container.appendChild(item);
        });
    }

    handleDocUpload(e) {
        e.preventDefault();
        this.playHapticSuccess();
        const title = document.getElementById('upload-doc-title').value.trim();
        const content = document.getElementById('upload-doc-content').value.trim();
        const type = document.querySelector('input[name="upload-cat"]:checked').value;

        if (title && content) {
            const newDoc = {
                id: Date.now(),
                title,
                type,
                content
            };
            this.knowledgeBase.push(newDoc);

            // Auto add to courses if database
            if (title.toLowerCase().includes('database') || title.toLowerCase().includes('sql')) {
                this.coursesData[0].modules[1].topics.push(title.replace('.pdf', ''));
            }

            document.getElementById('doc-upload-form').reset();
            this.renderAllViews();
            alert(`RAG Pipeline Extraction complete! Created 10 chunks & embedded in pgvector for document "${title}".`);
        }
    }

    deleteDocument(id) {
        this.playHapticSound(250, 0.08);
        this.knowledgeBase = this.knowledgeBase.filter(doc => doc.id !== id);
        this.renderAllViews();
    }

    // Admin Features Panel
    renderAdminPanel() {
        const totalUsersEl = document.getElementById('admin-stat-users');
        const queriesEl = document.getElementById('admin-stat-queries');
        const container = document.getElementById('admin-accounts-container');

        if (totalUsersEl) totalUsersEl.innerText = this.users.length * 15;
        if (queriesEl) queriesEl.innerText = this.knowledgeBase.length * 20 + 142;

        if (container) {
            container.innerHTML = '';
            this.users.forEach((u, idx) => {
                const row = document.createElement('div');
                row.className = 'admin-account-row';
                row.innerHTML = `
                    <div class="account-info">
                        <strong>${u.name}</strong>
                        <span>@${u.username}</span>
                        <span class="account-role-tag" style="background:${u.role === 'Admin' ? 'var(--danger)' : (u.role === 'Lecturer' ? 'var(--primary)' : 'var(--secondary)')}">${u.role}</span>
                    </div>
                    <div class="account-actions">
                        <button class="btn-admin-act" onclick="edumentor.suspendUser('${u.username}')">Suspend</button>
                        <button class="btn-admin-act" onclick="edumentor.deleteUser(${idx})">Delete</button>
                    </div>
                `;
                container.appendChild(row);
            });
        }
    }

    suspendUser(username) {
        this.playHapticSound(250, 0.08);
        alert(`Account @${username} has been suspended inside mock database successfully.`);
    }

    deleteUser(idx) {
        this.playHapticSound(250, 0.08);
        this.users.splice(idx, 1);
        this.renderAdminPanel();
    }

    // Modal Architecture Preview helpers
    showFeatureWip(name) {
        this.playHapticSound(440, 0.05);
        const modal = document.getElementById('wip-modal');
        const el = document.getElementById('wip-feature-name');
        if (modal && el) {
            el.innerText = name;
            modal.classList.remove('hidden');
        }
    }

    closeWipModal() {
        this.playHapticSound(300, 0.05);
        const modal = document.getElementById('wip-modal');
        if (modal) modal.classList.add('hidden');
    }
}

// Instantiate and initialize on document load robustly
const edumentor = new EduMentorSimulator();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => edumentor.init());
} else {
    edumentor.init();
}
