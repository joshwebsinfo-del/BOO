/* EduMentor AI Android Mobile Simulator - Kwekwe Poly Controller Logic */
class EduMentorSimulator {
    constructor() {
        this.currentTheme = 'dark';
        this.currentPersona = 'Student'; // Student, Lecturer, Admin
        this.currentUser = {
            name: 'Demo Student',
            username: 'student@kwekwe.ac.zw',
            studentNo: 'KP-2026-993F',
            role: 'Student'
        };
        this.currentActiveTab = 'dashboard';
        this.streakCount = 5;
        this.isPoweredOn = true;
        this.notificationsOpen = false;

        // Mock Web Audio API Synth Context
        this.audioCtx = null;

        // Dynamic Course Modules state (starts with 2 pre-seeded, Admin can dynamically append new ones!)
        this.courseModules = [
            {
                title: 'Module 1: Relational Model',
                topics: ['Relational Database Schemas', 'Primary and Foreign Keys']
            },
            {
                title: 'Module 2: Database Normalization',
                topics: ['Insertion & Deletion Anomalies', 'First & Second Normal Form', 'Third Normal Form (3NF) & BCNF']
            }
        ];

        // Global Documents Registry (all start as completely unreleased/hidden except the syllabus!)
        this.documentsRegistry = [
            { id: 1, title: 'Syllabus_CS301.pdf', type: 'syllabus', content: 'Database systems CS301. Course content: relational data model, schemas, normalization, anomalies, 1NF, 2NF, 3NF, BCNF.', released: true, animClass: '' },
            { id: 2, title: 'Lecture_Notes_DB_Normalization.pdf', type: 'notes', content: 'Database Normalization minimizes data redundancy. First Normal Form (1NF) requires atomic attributes. Second Normal Form (2NF) resolves partial dependencies. Third Normal Form (3NF) resolves transitive functional dependencies.', released: false, animClass: '' },
            { id: 3, title: 'Networking_TCP_vs_UDP.pdf', type: 'notes', content: 'TCP (Transmission Control Protocol) is connection-oriented, reliable, guarantees packet ordering, handles flow control, and uses a three-way handshake. UDP (User Datagram Protocol) is connectionless, faster, has low overhead.', released: false, animClass: '' },
            { id: 4, title: 'Exam_PastPaper_2024.pdf', type: 'papers', content: 'Database Systems Midterm. Q1: Explain transitive dependencies in 3NF with examples. Q2: Design schemas free of insertion anomalies. Q3: Difference between TCP three-way handshake and UDP.', released: false, animClass: '' }
        ];

        // Active notification messages
        this.notifications = [
            { id: 1, text: '📅 Database Exam on July 21, 2026', read: false },
            { id: 2, text: '🤖 New AI model DeepSeek R1 loaded as fallback', read: false },
            { id: 3, text: '🎓 Admin released a new syllabus resource!', read: false }
        ];

        // Mock Recent Chat Query History
        this.chatQueries = [
            { query: 'Explain database normalization.', date: 'Today' },
            { query: 'What is the difference between TCP and UDP?', date: 'Yesterday' }
        ];

        // Bookmarks & Downloads state tracking
        this.bookmarks = [1];
        this.downloads = [1];

        // Planner Tasks (Task Checklist with Priority)
        this.plannerTasks = [
            { id: 1, text: 'Read database normalization notes', priority: 'high', completed: true },
            { id: 2, text: 'Review past midterm exams', priority: 'medium', completed: false },
            { id: 3, text: 'Consult EduMentor AI about TCP handshakes', priority: 'low', completed: false }
        ];

        // Accounts list (Admin portal management)
        this.users = [
            { name: 'Joshua Webs Administrator', username: 'joshwebsinfo@gmail.com', role: 'Admin', studentNo: 'N/A' },
            { name: 'Prof. Alistair Chen', username: 'chen@kwekwe.ac.zw', role: 'Lecturer', studentNo: 'N/A' },
            { name: 'Demo Student', username: 'student@kwekwe.ac.zw', role: 'Student', studentNo: 'KP-2026-993F' }
        ];

        // Departments list
        this.departments = [
            { id: 1, name: 'Information Technology', head: 'Prof. Alistair Chen' },
            { id: 2, name: 'Computer Science', head: 'Prof. Sarah Jenkins' }
        ];

        this.adminActiveSubTab = 'users';
    }

    init() {
        this.setupClock();
        this.renderAllViews();
        this.setupChatAutoResize();
        this.playHapticSound(600, 0.08); // Initial startup beep
        setTimeout(() => {
            const splash = document.getElementById('screen-splash');
            const onboard = document.getElementById('screen-onboarding');
            if (splash && onboard) {
                splash.classList.remove('active');
                onboard.classList.add('active');
            }
        }, 1500);
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
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

            gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch (e) {
            // Audio context not allowed or blocked
        }
    }

    playHapticSuccess() {
        this.playHapticSound(520, 0.08);
        setTimeout(() => this.playHapticSound(650, 0.08), 80);
    }

    playHapticNotification() {
        this.playHapticSound(440, 0.05);
        setTimeout(() => this.playHapticSound(554, 0.05), 60);
        setTimeout(() => this.playHapticSound(659, 0.1), 120);
    }

    showToast(message) {
        const toast = document.getElementById('toast-alert');
        const text = document.getElementById('toast-message-text');
        if (toast && text) {
            text.innerText = message;
            toast.classList.remove('hidden');
            setTimeout(() => {
                toast.classList.add('hidden');
            }, 3000);
        }
    }

    // Theme Switcher Controller
    toggleSimulatorTheme() {
        const body = document.body;
        this.playHapticSound(800, 0.05);
        if (body.classList.contains('dark-mode')) {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            this.currentTheme = 'light';
            this.showToast('Theme switched to Light mode');
        } else {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            this.currentTheme = 'dark';
            this.showToast('Theme switched to Dark mode');
        }
    }

    resetSimulator() {
        this.playHapticSound(300, 0.2, 'sawtooth');
        this.showToast('Resetting simulator...');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    // Tab view switcher
    switchTab(tabId) {
        if (this.currentActiveTab === tabId) return;
        this.playHapticSound(480, 0.03);
        this.currentActiveTab = tabId;

        // Hide notification overlay if switching tabs
        const notifPane = document.getElementById('notif-pane');
        if (notifPane) {
            notifPane.classList.add('hidden');
            this.notificationsOpen = false;
        }

        const screens = document.querySelectorAll('.tab-view');
        screens.forEach(s => s.classList.remove('active'));

        const activeView = document.getElementById(`view-${tabId}`);
        if (activeView) activeView.classList.add('active');

        const tabBtns = document.querySelectorAll('.nav-tab');
        tabBtns.forEach(btn => btn.classList.remove('active'));

        const activeTabBtn = document.getElementById(`tab-${tabId}`);
        if (activeTabBtn) activeTabBtn.classList.add('active');

        // Scroll to bottom of chat if switching to AI Tutor tab
        if (tabId === 'chat') {
            const box = document.getElementById('chat-messages-box');
            if (box) {
                setTimeout(() => box.scrollTop = box.scrollHeight, 100);
            }
        }
    }

    // Persona controller
    switchPersona(persona) {
        this.playHapticSuccess();
        this.currentPersona = persona;

        document.querySelectorAll('.btn-persona').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-persona-${persona.toLowerCase()}`);
        if (activeBtn) activeBtn.classList.add('active');

        // Set user simulation defaults based on persona
        if (persona === 'Student') {
            this.currentUser = {
                name: 'Demo Student',
                username: 'student@kwekwe.ac.zw',
                studentNo: 'KP-2026-993F',
                role: 'Student'
            };
        } else if (persona === 'Lecturer') {
            this.currentUser = {
                name: 'Prof. Alistair Chen',
                username: 'chen@kwekwe.ac.zw',
                studentNo: 'N/A',
                role: 'Lecturer'
            };
        } else {
            this.currentUser = {
                name: 'Joshua Webs Administrator',
                username: 'joshwebsinfo@gmail.com',
                studentNo: 'N/A',
                role: 'Admin'
            };
        }

        this.showToast(`Swapped to simulated ${persona} workflow`);
        this.renderAllViews();
        this.switchTab('dashboard');
    }

    // Auth screen controller
    switchAuthForm(formId) {
        this.playHapticSound(500, 0.05);
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${formId}-form`).classList.add('active');
    }

    bypassOnboarding() {
        this.playHapticSuccess();
        document.getElementById('screen-onboarding').classList.remove('active');
        document.getElementById('screen-auth').classList.add('active');
    }

    nextOnboardingSlide() {
        const slides = document.querySelectorAll('.onboard-slide');
        const dots = document.querySelectorAll('.carousel-dot');
        let activeIdx = 0;

        slides.forEach((slide, idx) => {
            if (slide.classList.contains('active')) activeIdx = idx;
        });

        const nextIdx = (activeIdx + 1) % slides.length;
        this.playHapticSound(550, 0.05);

        if (activeIdx === slides.length - 1) {
            this.bypassOnboarding();
            return;
        }

        slides[activeIdx].classList.remove('active');
        dots[activeIdx].classList.remove('active');

        slides[nextIdx].classList.add('active');
        dots[nextIdx].classList.add('active');
    }

    handleLogin(event) {
        event.preventDefault();
        const userVal = document.getElementById('login-username').value;
        const passVal = document.getElementById('login-password').value;

        // Match admin login or general login
        if (userVal === 'joshwebsinfo@gmail.com' && passVal === 'joshua#$#$') {
            this.currentUser = {
                name: 'Joshua Webs Administrator',
                username: 'joshwebsinfo@gmail.com',
                studentNo: 'N/A',
                role: 'Admin'
            };
            this.currentPersona = 'Admin';
            this.playHapticSuccess();
            this.showToast('Admin logged in successfully!');
        } else {
            // General Student/Lecturer log in
            this.currentUser = {
                name: userVal.split('@')[0],
                username: userVal,
                studentNo: 'KP-2026-993F',
                role: userVal.includes('teacher') || userVal.includes('chen') ? 'Lecturer' : 'Student'
            };
            this.currentPersona = this.currentUser.role;
            this.playHapticSuccess();
            this.showToast(`Logged in as ${this.currentUser.role}`);
        }

        document.getElementById('screen-auth').classList.remove('active');
        document.getElementById('screen-shell').classList.add('active');
        this.renderAllViews();
        this.switchTab('dashboard');
    }

    handleRegister(event) {
        event.preventDefault();
        const nameVal = document.getElementById('register-name').value;
        const emailVal = document.getElementById('register-email').value;
        const studentNoVal = document.getElementById('register-student-no').value;

        this.currentUser = {
            name: nameVal,
            username: emailVal,
            studentNo: studentNoVal,
            role: 'Student'
        };
        this.currentPersona = 'Student';
        this.playHapticSuccess();
        this.showToast(`Account ${studentNoVal} created successfully!`);

        document.getElementById('screen-auth').classList.remove('active');
        document.getElementById('screen-shell').classList.add('active');
        this.renderAllViews();
        this.switchTab('dashboard');
    }

    handleForgot(event) {
        event.preventDefault();
        this.playHapticSuccess();
        this.showToast('Reset email sent to your academic inbox!');
        this.switchAuthForm('login');
    }

    logout() {
        this.playHapticSound(350, 0.1);
        this.showToast('Logged out successfully');
        document.getElementById('screen-shell').classList.remove('active');
        document.getElementById('screen-auth').classList.add('active');
        this.switchAuthForm('login');
    }

    // Dynamic Course modules management
    adminAddModule(event) {
        event.preventDefault();
        const titleInput = document.getElementById('admin-add-module-title');
        const topicInput = document.getElementById('admin-add-module-topic');

        const title = titleInput.value.trim();
        const topic = topicInput.value.trim();

        if (title && topic) {
            this.courseModules.push({
                title: title,
                topics: [topic]
            });

            titleInput.value = '';
            topicInput.value = '';

            this.playHapticSuccess();
            this.showToast('New module added and synchronized across Kwekwe Poly!');
            this.addNotification(`📚 New syllabus module added: ${title}`);
            this.renderAllViews();
        }
    }

    // Resources Release Controller (Fade)
    releaseResource(docId) {
        const doc = this.documentsRegistry.find(d => d.id === docId);
        if (doc) {
            doc.released = true;
            doc.animClass = 'fade-in-view'; // triggers the fade release CSS transition
            this.playHapticSuccess();
            this.showToast(`Released document: ${doc.title}`);
            this.addNotification(`📄 Academic notes released: ${doc.title}`);
            this.renderAllViews();
        }
    }

    // Toggle Notifications Pane
    toggleNotifications() {
        const pane = document.getElementById('notif-pane');
        this.playHapticSound(500, 0.05);
        if (pane) {
            if (this.notificationsOpen) {
                pane.classList.add('hidden');
                this.notificationsOpen = false;
            } else {
                pane.classList.remove('hidden');
                this.notificationsOpen = true;
                this.renderNotificationsList();
            }
        }
    }

    addNotification(text) {
        this.notifications.unshift({
            id: Date.now(),
            text: text,
            read: false
        });
        this.playHapticNotification();
        this.renderNotificationsList();
    }

    clearNotifications() {
        this.notifications = [];
        this.playHapticSound(300, 0.05);
        this.renderNotificationsList();
        this.showToast('All notifications cleared');
    }

    renderNotificationsList() {
        const list = document.getElementById('notif-list');
        const badge = document.getElementById('notif-badge');

        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (badge) {
            if (unreadCount > 0) {
                badge.innerText = unreadCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }

        if (list) {
            list.innerHTML = '';
            if (this.notifications.length === 0) {
                list.innerHTML = '<div class="empty-notifications">No new notifications</div>';
                return;
            }

            this.notifications.forEach(n => {
                const item = document.createElement('div');
                item.className = `notif-pane-item ${n.read ? 'read' : ''}`;
                item.innerHTML = `
                    <p class="notif-text">${n.text}</p>
                    <span class="notif-time">Just Now</span>
                `;
                item.onclick = () => {
                    n.read = true;
                    this.renderNotificationsList();
                };
                list.appendChild(item);
            });
        }
    }

    // Task Planner checklists
    addTask(event) {
        event.preventDefault();
        const textInput = document.getElementById('new-task-text');
        const prioInput = document.getElementById('new-task-priority');

        const text = textInput.value.trim();
        const priority = prioInput.value;

        if (text) {
            this.plannerTasks.push({
                id: Date.now(),
                text: text,
                priority: priority,
                completed: false
            });
            textInput.value = '';
            this.playHapticSuccess();
            this.renderPlanner();
            this.showToast('Task added to your checklist');
        }
    }

    toggleTask(taskId) {
        const task = this.plannerTasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.playHapticSound(task.completed ? 600 : 400, 0.05);
            this.renderPlanner();
        }
    }

    clearCompletedTasks() {
        this.plannerTasks = this.plannerTasks.filter(t => !t.completed);
        this.playHapticSound(300, 0.05);
        this.renderPlanner();
        this.showToast('Cleared completed items');
    }

    // Dynamic rendering functions
    renderAllViews() {
        this.renderDashboard();
        this.renderChatMessages();
        this.renderCourses();
        this.renderResources();
        this.renderPlanner();
        this.renderProfile();
        this.renderAdminSubTab();
        this.renderNotificationsList();
    }

    renderDashboard() {
        const streakEl = document.getElementById('streak-num');
        if (streakEl) streakEl.innerText = this.streakCount;

        const queriesEl = document.getElementById('dash-queries-count');
        if (queriesEl) queriesEl.innerText = `${this.chatQueries.length} Queries`;

        const coursesEl = document.getElementById('dash-courses-count');
        if (coursesEl) coursesEl.innerText = `1 Course`;
    }

    renderChatMessages() {
        // Initial welcome chat state if empty
        const box = document.getElementById('chat-messages-box');
        if (box && box.children.length === 0) {
            box.innerHTML = `
                <div class="chat-welcome-state">
                    <span class="welcome-robot">🤖</span>
                    <h3>Kwekwe Poly Assistant</h3>
                    <p>I behave like a personal lecturer and study companion. Type a query or choose a course topic recommendation below.</p>
                    <div class="prompt-suggestions">
                        <button class="prompt-suggest-btn" onclick="edumentor.prefillChatInput('Explain database normalization.')">
                            💡 "Explain database normalization."
                        </button>
                        <button class="prompt-suggest-btn" onclick="edumentor.prefillChatInput('What is the difference between TCP and UDP?')">
                            💡 "Difference between TCP & UDP"
                        </button>
                    </div>
                </div>
            `;
        }
    }

    renderCourses() {
        const box = document.getElementById('courses-accordion-list');
        if (!box) return;
        box.innerHTML = '';

        // Standard Single course (Database Systems CS301)
        const card = document.createElement('div');
        card.className = 'course-node open'; // starts open to show modules

        let modulesHtml = '';
        this.courseModules.forEach((mod, idx) => {
            let topicsHtml = '';
            mod.topics.forEach(topic => {
                topicsHtml += `
                    <div class="topic-item-row" onclick="edumentor.askAITutorAbout('${topic}')">
                        <span><span class="topic-bullet">▪</span> ${topic}</span>
                        <button class="btn-ask-topic">Ask Mentor AI</button>
                    </div>
                `;
            });

            modulesHtml += `
                <div class="module-node">
                    <div class="module-title">${mod.title}</div>
                    <div class="topics-list">
                        ${topicsHtml}
                    </div>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="course-node-header" onclick="this.closest('.course-node').classList.toggle('open')">
                <div class="course-node-title-box">
                    <div class="course-node-title">Database Systems (CS301)</div>
                    <div class="course-node-meta">IT Program • 100% Synced • ${this.courseModules.length} Modules</div>
                </div>
                <span class="accordion-arrow">▼</span>
            </div>
            <div class="course-node-body">
                ${modulesHtml}
            </div>
        `;
        box.appendChild(card);

        // Update telemetry counts
        const syncCount = document.getElementById('sync-modules-count');
        if (syncCount) syncCount.innerText = this.courseModules.length;
    }

    renderResources() {
        const grid = document.getElementById('resources-grid-list');
        const statsCount = document.getElementById('kb-docs-count');
        const telemetryList = document.getElementById('telemetry-source-list');

        if (!grid) return;
        grid.innerHTML = '';
        if (telemetryList) telemetryList.innerHTML = '';

        let releasedCount = 0;

        this.documentsRegistry.forEach(doc => {
            // Render external telemetry sidebar item
            if (telemetryList) {
                const badgeClass = doc.released ? 'badge-success' : 'badge-danger';
                const badgeText = doc.released ? 'Released' : 'Locked';
                const item = document.createElement('div');
                item.className = 'kb-source-item';
                item.innerHTML = `
                    <span>📄 ${doc.title}</span>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                `;
                telemetryList.appendChild(item);
            }

            // Only display in the Student resources grid if released!
            if (doc.released) {
                releasedCount++;
                const isBookmarked = this.bookmarks.includes(doc.id);
                const isDownloaded = this.downloads.includes(doc.id);

                const card = document.createElement('div');
                card.className = `resource-card ${doc.animClass}`;
                card.innerHTML = `
                    <div class="resource-icon-box">
                        <span class="res-icon">📄</span>
                    </div>
                    <div class="resource-info">
                        <div class="resource-title">${doc.title}</div>
                        <div class="resource-meta">${doc.content.substring(0, 45)}...</div>
                    </div>
                    <div class="resource-actions">
                        <button class="btn-res-act ${isBookmarked ? 'active' : ''}" onclick="edumentor.toggleBookmark(${doc.id}, this)">
                            ${isBookmarked ? '★' : '☆'}
                        </button>
                        <button class="btn-res-act ${isDownloaded ? 'downloaded' : ''}" onclick="edumentor.toggleDownload(${doc.id}, this)">
                            📥
                        </button>
                    </div>
                `;
                grid.appendChild(card);
            }
        });

        if (statsCount) statsCount.innerText = releasedCount;

        if (releasedCount === 0) {
            grid.innerHTML = `
                <div class="empty-resources-state">
                    <span class="lock-emoji">🔒</span>
                    <h4>Syllabus Resources Locked</h4>
                    <p>There are no active study materials released yet. Please check back when your lecturer or administrator releases them.</p>
                </div>
            `;
        }
    }

    renderPlanner() {
        const container = document.getElementById('task-checklist-box');
        if (!container) return;
        container.innerHTML = '';

        if (this.plannerTasks.length === 0) {
            container.innerHTML = '<div class="empty-checklist">No tasks set. Add one above!</div>';
            return;
        }

        this.plannerTasks.forEach(t => {
            const item = document.createElement('div');
            item.className = `task-item ${t.completed ? 'completed' : ''} prio-${t.priority}`;
            item.innerHTML = `
                <input type="checkbox" ${t.completed ? 'checked' : ''} onclick="edumentor.toggleTask(${t.id})">
                <span class="task-text">${t.text}</span>
                <span class="prio-tag">${t.priority.toUpperCase()}</span>
                <button class="btn-delete-task" onclick="edumentor.deleteTask(${t.id})">✕</button>
            `;
            container.appendChild(item);
        });
    }

    deleteTask(id) {
        this.plannerTasks = this.plannerTasks.filter(t => t.id !== id);
        this.playHapticSound(300, 0.05);
        this.renderPlanner();
    }

    renderProfile() {
        const nameEl = document.getElementById('profile-user-name');
        const roleEl = document.getElementById('profile-user-role');
        const noEl = document.getElementById('profile-student-no');
        const consoleLauncher = document.getElementById('profile-admin-console-launcher');
        const roleLabelHeader = document.getElementById('user-role-lbl');

        if (nameEl) nameEl.innerText = this.currentUser.name;
        if (roleEl) roleEl.innerText = `${this.currentUser.role} • Kwekwe Poly`;

        if (noEl) {
            if (this.currentUser.role === 'Student') {
                noEl.innerText = `Student No: ${this.currentUser.studentNo}`;
                noEl.style.display = 'block';
            } else {
                noEl.style.display = 'none';
            }
        }

        if (roleLabelHeader) roleLabelHeader.innerText = `${this.currentUser.role} Portal`;

        if (consoleLauncher) {
            if (this.currentUser.role === 'Admin') {
                consoleLauncher.classList.remove('hidden');
            } else {
                consoleLauncher.classList.add('hidden');
            }
        }
    }

    renderAdminSubTab() {
        const uList = document.getElementById('admin-users-list');
        const dList = document.getElementById('admin-depts-list');
        const docsList = document.getElementById('admin-docs-list');

        if (this.adminActiveSubTab === 'users' && uList) {
            uList.innerHTML = '';
            this.users.forEach((u, idx) => {
                const row = document.createElement('div');
                row.className = 'admin-account-row';
                row.innerHTML = `
                    <div class="account-info">
                        <strong>${u.name}</strong>
                        <span class="account-meta">${u.username} • ID: ${u.studentNo}</span>
                        <span class="account-role-tag role-${u.role.toLowerCase()}">${u.role}</span>
                    </div>
                `;
                uList.appendChild(row);
            });
        }

        if (this.adminActiveSubTab === 'departments' && dList) {
            dList.innerHTML = '';
            this.departments.forEach((d, idx) => {
                const row = document.createElement('div');
                row.className = 'admin-account-row';
                row.innerHTML = `
                    <div class="account-info">
                        <strong>${d.name}</strong>
                        <span class="account-meta">Head: ${d.head}</span>
                    </div>
                    <button class="btn-admin-act" onclick="edumentor.deleteDept(${idx})" style="color:var(--danger); border-color:rgba(239,68,68,0.2);">Remove</button>
                `;
                dList.appendChild(row);
            });
        }

        if (this.adminActiveSubTab === 'documents' && docsList) {
            docsList.innerHTML = '';
            this.documentsRegistry.forEach(doc => {
                const row = document.createElement('div');
                row.className = 'admin-account-row';

                let releaseBtn = '';
                if (!doc.released) {
                    releaseBtn = `<button class="btn-admin-act" onclick="edumentor.releaseResource(${doc.id})" style="background:var(--primary); color:#fff; border:none; padding:0.2rem 0.5rem;">Fade Release</button>`;
                } else {
                    releaseBtn = `<span class="badge badge-success" style="font-size:10px;">Released</span>`;
                }

                row.innerHTML = `
                    <div class="account-info">
                        <strong>📄 ${doc.title}</strong>
                        <span class="account-meta">${doc.content.substring(0, 50)}...</span>
                    </div>
                    <div class="account-actions">
                        ${releaseBtn}
                    </div>
                `;
                docsList.appendChild(row);
            });
        }
    }

    switchAdminSubTab(subTabId) {
        this.playHapticSound(500, 0.03);
        this.adminActiveSubTab = subTabId;

        document.querySelectorAll('.admin-sub-view').forEach(view => view.classList.add('hidden'));
        document.getElementById(`admin-sub-view-${subTabId}`).classList.remove('hidden');

        document.querySelectorAll('#view-admin .resource-tabs .tab-pill').forEach(pill => pill.classList.remove('active'));
        document.getElementById(`btn-admin-tab-${subTabId}`).classList.add('active');

        this.renderAdminSubTab();
    }

    // Document Bookmark and Downloads
    toggleBookmark(docId, btn) {
        this.playHapticSound(600, 0.05);
        if (this.bookmarks.includes(docId)) {
            this.bookmarks = this.bookmarks.filter(id => id !== docId);
            btn.classList.remove('active');
            btn.innerText = '☆';
            this.showToast('Bookmark removed');
        } else {
            this.bookmarks.push(docId);
            btn.classList.add('active');
            btn.innerText = '★';
            this.showToast('Resource bookmarked!');
        }
    }

    toggleDownload(docId, btn) {
        this.playHapticSound(600, 0.05);
        if (this.downloads.includes(docId)) {
            this.downloads = this.downloads.filter(id => id !== docId);
            btn.classList.remove('downloaded');
            this.showToast('Downloaded file cleared');
        } else {
            this.downloads.push(docId);
            btn.classList.add('downloaded');
            this.showToast('Downloaded to offline storage!');
        }
    }

    // Portal routing
    openAdminPanel() {
        this.switchTab('admin');
    }

    closeAdminPanel() {
        this.switchTab('profile');
    }

    // Chat Controller & input resizing
    autoGrowTextarea(element) {
        element.style.height = '32px';
        element.style.height = (element.scrollHeight - 4) + 'px';
    }

    prefillChatInput(val) {
        const textarea = document.getElementById('chat-input-textarea');
        if (textarea) {
            textarea.value = val;
            this.autoGrowTextarea(textarea);
        }
    }

    prefillAndGoToChat(val) {
        this.prefillChatInput(val);
        this.switchTab('chat');
    }

    askAITutorAbout(topic) {
        this.prefillAndGoToChat(`Help me understand ${topic} in detail.`);
    }

    setupChatAutoResize() {
        const textarea = document.getElementById('chat-input-textarea');
        if (textarea) {
            textarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.submitQuery();
                }
            });
        }
    }

    submitQuery() {
        const textarea = document.getElementById('chat-input-textarea');
        if (!textarea) return;

        const val = textarea.value.trim();
        if (!val) return;

        this.playHapticSound(500, 0.05);
        const box = document.getElementById('chat-messages-box');
        if (box) {
            // Remove initial welcome chat state
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
                step2.innerText = "📄 Match found. Sourced from Kwekwe Poly registry...";
                step2.style.color = 'var(--secondary)';
                step3.style.color = '#cbd5e1';
                this.playHapticSound(600, 0.02);
                flowPanel.classList.add('hidden');

                // Construct AI Response
                this.generateAiResponse(val);
            }, 2400);
        } else {
            this.generateAiResponse(val);
        }
    }

    generateAiResponse(query) {
        this.playHapticSuccess();
        const box = document.getElementById('chat-messages-box');
        if (!box) return;

        const aiBubble = document.createElement('div');
        aiBubble.className = 'message-bubble ai';

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
            answerMarkdown = `<p>This topic is not available in your current course materials. Please upload relevant notes or consult your lecturer.</p>`;
        }

        aiBubble.innerHTML = `
            <div class="ai-message-header">
                <span class="ai-avatar">🤖</span>
                <strong>EduMentor AI</strong>
                <div class="ai-msg-actions">
                    <button class="btn-msg-action" onclick="navigator.clipboard.writeText(this.closest('.message-bubble').querySelector('.message-content').innerText); edumentor.playHapticSuccess(); alert('Answer copied to clipboard!');" title="Copy Reply">📋 Copy</button>
                    <button class="btn-msg-action" onclick="edumentor.saveResponse('${query.replace(/'/g, "\\'")}');" title="Save Reply">⭐ Save</button>
                </div>
            </div>
            <div class="message-content">
                ${answerMarkdown}
                ${matchedSources.length > 0 ? `
                    <div class="ai-sources-ref">
                        <strong>Sourced from Kwekwe Poly materials:</strong>
                        ${matchedSources.map(s => `<span class="source-tag">📄 ${s}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        box.appendChild(aiBubble);
        box.scrollTop = box.scrollHeight;
    }

    saveResponse(query) {
        this.playHapticSuccess();
        this.showToast('Response bookmarked under study profile!');
    }

    deleteDept(idx) {
        this.playHapticSound(300, 0.05);
        this.departments.splice(idx, 1);
        this.renderAdminSubTab();
        this.showToast('Department removed');
    }

    adminAddDept(event) {
        event.preventDefault();
        const nameVal = document.getElementById('admin-add-dept-name').value;
        const headVal = document.getElementById('admin-add-dept-head').value;

        this.departments.push({
            id: Date.now(),
            name: nameVal,
            head: headVal
        });

        document.getElementById('admin-add-dept-name').value = '';
        document.getElementById('admin-add-dept-head').value = '';

        this.playHapticSuccess();
        this.renderAdminSubTab();
        this.showToast(`Department ${nameVal} added successfully!`);
    }

    adminAddUser(event) {
        event.preventDefault();
        const nameVal = document.getElementById('admin-add-username').value;
        const emailVal = document.getElementById('admin-add-email').value;
        const roleVal = document.getElementById('admin-add-role').value;

        this.users.push({
            name: nameVal,
            username: emailVal,
            role: roleVal,
            studentNo: roleVal === 'Student' ? 'KP-2026-' + Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase() : 'N/A'
        });

        document.getElementById('admin-add-username').value = '';
        document.getElementById('admin-add-email').value = '';

        this.playHapticSuccess();
        this.renderAdminSubTab();
        this.showToast(`Provisioned account for ${nameVal}`);
    }
}

// Global initialization
const edumentor = new EduMentorSimulator();
window.addEventListener('load', () => edumentor.init());
