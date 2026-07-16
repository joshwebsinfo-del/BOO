/**
 * BrainForge OS | Premium Unified State Management, Advanced Interaction & Dynamic Logic
 */

const brainforge = {
    // Current user context
    user: {
        name: "Joshua",
        streak: 14,
        longestStreak: 28,
        gpa: 4.82,
        studyHours: 5.5,
        targetHours: 8.0,
    },

    // Current active tab state
    currentTab: 'dashboard',

    // Grid Layout / Widget configurations
    widgets: [
        { id: 'hero', name: 'Study Goal (Hero)', order: 1, hidden: false, pinned: false, size: 'full', color: 'indigo' },
        { id: 'productivity', name: 'Productivity Score', order: 2, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'heatmap', name: 'Learning Heatmap', order: 3, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'tasks', name: 'Today\'s Study Checklist', order: 4, hidden: false, pinned: false, size: 'full', color: 'slate' },
        { id: 'revision', name: 'Spaced Repetition Due', order: 5, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'exams', name: 'Upcoming Milestones', order: 6, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'analytics', name: 'Smart Academic Analytics', order: 7, hidden: false, pinned: false, size: 'full', color: 'slate' },
        { id: 'brain', name: 'Cognitive Retention Map', order: 8, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'focus', name: 'Focus Meter Level', order: 9, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'streak', name: 'Learning Streak Flame', order: 10, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'courses', name: 'Enrolled Course Progress', order: 11, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'ai-insights', name: 'AI Recommendations', order: 12, hidden: false, pinned: false, size: 'full', color: 'slate' },
        { id: 'achievements', name: 'Unlocked Badges', order: 13, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'motivation', name: 'Daily Quote of the Day', order: 14, hidden: false, pinned: false, size: 'half', color: 'slate' },
        { id: 'recent', name: 'Recent Activity History', order: 15, hidden: false, pinned: false, size: 'full', color: 'slate' }
    ],

    // Mock Database for Search index and timeline updates
    db: {
        notes: [
            { id: 'n1', title: 'Relational Database Joins', subject: 'Databases', content: 'Natural join joins two tables based on same column name. Left join returns all rows from left table.' },
            { id: 'n2', title: 'TCP/IP Model Protocol stack', subject: 'Networking', content: 'Four main layers: Application, Transport, Internet, Network Access. IP routing is stateless.' },
            { id: 'n3', title: 'Asymptotic notation limits', subject: 'Math', content: 'Big O measures upper bound constraint. Theta represents perfect tight bound condition.' }
        ],
        flashcards: [
            { id: 'f1', question: 'What is ACID in databases?', answer: 'Atomicity, Consistency, Isolation, Durability' },
            { id: 'f2', question: 'Dijkstra shortest path algorithm?', answer: 'Greedy algorithm computing single-source shortest path' },
            { id: 'f3', question: 'What is Paging in OS?', answer: 'Memory management scheme dividing physical memory into pages' }
        ],
        tasks: [
            { id: 't1', title: 'Revise SQL Indexing constraints', subject: 'Databases', priority: 'High', deadline: 'Today, 4:00 PM', duration: '45m', completed: false },
            { id: 't2', title: 'Read Chapter 4 of Computer networks', subject: 'Networking', priority: 'Medium', deadline: 'Today, 8:00 PM', duration: '1h 15m', completed: false },
            { id: 't3', title: 'Practice Big-O induction proofs', subject: 'Math', priority: 'High', deadline: 'Today, 10:00 PM', duration: '30m', completed: false },
            { id: 't4', title: 'Design state machine flowchart', subject: 'Automata', priority: 'Low', deadline: 'Tomorrow', duration: '1h', completed: true },
            { id: 't5', title: 'Review 50 Spaced Repetition cards', subject: 'General', priority: 'Medium', deadline: 'Today, 11:30 PM', duration: '20m', completed: false }
        ],
        revisions: [
            { id: 'r1', subject: 'Databases', topic: 'SQL Index B-Trees', difficulty: 'Hard', retention: 55, duration: '20m' },
            { id: 'r2', subject: 'Networking', topic: 'Subnet Mask Division', difficulty: 'Medium', retention: 72, duration: '15m' },
            { id: 'r3', subject: 'Math', topic: 'Bayes Theorem Probability', difficulty: 'Easy', retention: 89, duration: '10m' }
        ],
        exams: [
            { id: 'e1', name: 'Midterm Assessment', subject: 'Databases', days: 3, venue: 'Lab Alpha-B', confidence: 85 },
            { id: 'e2', name: 'System Term Test', subject: 'Computer Architecture', days: 8, venue: 'Seminar Hall 2', confidence: 60 }
        ],
        recent: [
            { id: 'rec1', action: 'Opened note', target: 'Relational Database Joins', time: '10 minutes ago', icon: '📝' },
            { id: 'rec2', action: 'Completed practice session', target: 'ACID properties flashcards', time: '1 hour ago', icon: '🎯' },
            { id: 'rec3', action: 'Edited project file', target: 'ER-Diagram mapping.pdf', time: '3 hours ago', icon: '📁' },
            { id: 'rec4', action: 'Unlocked badge achievement', target: 'Perfect Quiz Score', time: 'Yesterday', icon: '🏅' }
        ],
        quotes: [
            { text: "The only way to learn a new programming language is by writing programs in it.", author: "Dennis Ritchie" },
            { text: "Computers are good at following instructions, but not at reading your mind.", author: "Donald Knuth" },
            { text: "Premature optimization is the root of all evil.", author: "Tony Hoare" },
            { text: "Make it work, make it right, make it fast.", author: "Kent Beck" }
        ]
    },

    audioContext: null,
    originalWidgets: {},

    // Save initial DOM references of widgets before innerHTML wipeout
    saveOriginalWidgets() {
        this.widgets.forEach(widget => {
            const el = document.getElementById(`widget-${widget.id}`);
            if (el) {
                this.originalWidgets[widget.id] = el;
            }
        });
    },

    // Initialize all core triggers & listeners
    init() {
        console.log("BrainForge OS Engine Bootstrapped successfully.");
        this.saveOriginalWidgets();
        this.loadSavedLayout();
        this.bindEvents();
        this.renderAll();
        this.playSynthesizedSound('boot');
    },

    // Bind event handlers to UI buttons
    bindEvents() {
        // Toggle mobile screen simulator versus full fluid screen
        const viewModeBtn = document.getElementById('view-mode-btn');
        if (viewModeBtn) {
            viewModeBtn.addEventListener('click', () => {
                const wrapper = document.getElementById('device-wrapper');
                const statusLabel = document.getElementById('view-mode-status');
                const icon = document.getElementById('view-mode-icon');

                this.triggerHapticFeedback();
                if (wrapper.classList.contains('phone-bezel')) {
                    wrapper.classList.remove('phone-bezel');
                    wrapper.classList.add('full-screen-fluid');
                    statusLabel.textContent = "Full View";
                    icon.textContent = "🖥️";
                } else {
                    wrapper.classList.remove('full-screen-fluid');
                    wrapper.classList.add('phone-bezel');
                    statusLabel.textContent = "Phone Bezel";
                    icon.textContent = "📱";
                }
            });
        }

        // Theme Switcher trigger
        const themeBtn = document.getElementById('theme-mode-btn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                const appViewport = document.getElementById('app-viewport');
                const themeStatus = document.getElementById('theme-status');
                this.triggerHapticFeedback();

                if (appViewport.classList.contains('light-mode-viewport')) {
                    appViewport.classList.remove('light-mode-viewport');
                    themeStatus.textContent = "Dark Mode";
                    themeStatus.className = "text-indigo-400 font-bold";
                } else {
                    appViewport.classList.add('light-mode-viewport');
                    themeStatus.textContent = "Light Mode";
                    themeStatus.className = "text-cyan-400 font-bold";
                }
                this.showToastNotification("Theme Adapted", "Color palette customized smoothly.", "info");
            });
        }

        // Radial floating action "+" menu toggler
        const centerAddBtn = document.getElementById('floating-center-add-btn');
        const shortcutsPanel = document.getElementById('floating-shortcuts-panel');
        const closeShortcutsBtn = document.getElementById('close-shortcuts-btn');

        if (centerAddBtn && shortcutsPanel) {
            centerAddBtn.addEventListener('click', () => {
                this.playSynthesizedSound('click-pop');
                shortcutsPanel.classList.remove('hidden');
            });
        }
        if (closeShortcutsBtn && shortcutsPanel) {
            closeShortcutsBtn.addEventListener('click', () => {
                this.triggerHapticFeedback();
                shortcutsPanel.classList.add('hidden');
            });
        }

        // Layout Customizer triggers
        const settingsBtn = document.getElementById('settings-trigger-btn');
        const shortcutsCustomizeBtn = document.getElementById('shortcuts-customize-grid-btn');
        const customizerDrawer = document.getElementById('layout-customizer-drawer');
        const closeCustomizerBtn = document.getElementById('close-customizer-btn');

        if (settingsBtn && customizerDrawer) {
            settingsBtn.addEventListener('click', () => {
                this.playSynthesizedSound('click-pop');
                customizerDrawer.classList.toggle('hidden');
                this.renderCustomizerDrawer();
            });
        }
        if (shortcutsCustomizeBtn && customizerDrawer) {
            shortcutsCustomizeBtn.addEventListener('click', () => {
                shortcutsPanel.classList.add('hidden');
                customizerDrawer.classList.remove('hidden');
                this.renderCustomizerDrawer();
            });
        }
        if (closeCustomizerBtn && customizerDrawer) {
            closeCustomizerBtn.addEventListener('click', () => {
                this.triggerHapticFeedback();
                customizerDrawer.classList.add('hidden');
            });
        }

        // Global Search panels
        const searchBtn = document.getElementById('search-trigger-btn');
        const searchPanel = document.getElementById('global-search-panel');
        const searchInput = document.getElementById('global-search-input');
        const clearSearchBtn = document.getElementById('clear-search-btn');

        if (searchBtn && searchPanel) {
            searchBtn.addEventListener('click', () => {
                this.triggerHapticFeedback();
                searchPanel.classList.toggle('hidden');
                if (!searchPanel.classList.contains('hidden')) {
                    searchInput.focus();
                }
            });
        }
        if (clearSearchBtn && searchInput) {
            clearSearchBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearchIndex('');
            });
        }
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearchIndex(e.target.value);
            });
        }

        // Motivation quote refresher
        const refreshMotivationBtn = document.getElementById('refresh-motivation-btn');
        if (refreshMotivationBtn) {
            refreshMotivationBtn.addEventListener('click', () => {
                this.triggerHapticFeedback();
                this.playSynthesizedSound('click-pop');
                const idx = Math.floor(Math.random() * this.db.quotes.length);
                const quote = this.db.quotes[idx];
                document.getElementById('motivation-quote').textContent = `"${quote.text}"`;
                document.getElementById('motivation-author').textContent = `— ${quote.author}`;
                this.showToastNotification("Quote Synchronized", "Fresh educational quote downloaded offline.", "success");
            });
        }

        // Multi-tab Nav click listener
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Sticky shrinking App bar when scroll-container scrolls
        const scrollContainer = document.getElementById('app-scroll-container');
        const topAppBar = document.getElementById('top-app-bar');
        if (scrollContainer && topAppBar) {
            scrollContainer.addEventListener('scroll', () => {
                if (scrollContainer.scrollTop > 40) {
                    topAppBar.classList.add('py-1', 'border-white/10');
                    topAppBar.classList.remove('pt-4', 'pb-3', 'border-transparent');
                } else {
                    topAppBar.classList.remove('py-1', 'border-white/10');
                    topAppBar.classList.add('pt-4', 'pb-3', 'border-transparent');
                }
            });
        }
    },

    // Save and load customizable configuration layout
    saveLayout() {
        localStorage.setItem('bf_widget_layout', JSON.stringify(this.widgets));
    },

    loadSavedLayout() {
        const saved = localStorage.getItem('bf_widget_layout');
        if (saved) {
            try {
                this.widgets = JSON.parse(saved);
            } catch (err) {
                console.error("Could not parse layout data, reverting to defaults.", err);
            }
        }
    },

    // Tab Switching controller
    switchTab(tabId) {
        if (this.currentTab === tabId) return;
        this.currentTab = tabId;
        this.playSynthesizedSound('tab-switch');

        // Update Bottom Nav UI
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('text-[#4F46E5]', 'active-tab');
                btn.classList.remove('text-slate-400');
            } else {
                btn.classList.remove('text-[#4F46E5]', 'active-tab');
                btn.classList.add('text-slate-400');
            }
        });

        // Trigger adaptive renders
        this.renderAll();
        this.showToastNotification("Navigation Sync", `Viewing the ${tabId.toUpperCase()} workspace.`, "success");
    },

    // Customized layout dynamic list renderer
    renderCustomizerDrawer() {
        const container = document.getElementById('customizer-widget-list');
        if (!container) return;

        // Sort widgets by order
        const sorted = [...this.widgets].sort((a, b) => a.order - b.order);

        container.innerHTML = sorted.map(widget => {
            return `
                <div class="flex items-center justify-between bg-slate-900/80 px-3.5 py-2.5 rounded-2xl border border-white/5 text-xs">
                    <div class="flex items-center gap-2">
                        <span class="text-slate-400 cursor-pointer hover:text-indigo-400" onclick="brainforge.reorderWidget('${widget.id}', 'up')">▲</span>
                        <span class="text-slate-400 cursor-pointer hover:text-indigo-400" onclick="brainforge.reorderWidget('${widget.id}', 'down')">▼</span>
                        <span class="font-bold text-white">${widget.name}</span>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <button onclick="brainforge.toggleWidgetSize('${widget.id}')" class="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5">
                            Size: <span class="text-cyan-400 font-extrabold uppercase">${widget.size}</span>
                        </button>
                        <button onclick="brainforge.toggleWidgetVisibility('${widget.id}')" class="px-2.5 py-1 rounded-full font-bold ${widget.hidden ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'}">
                            ${widget.hidden ? 'Hidden' : 'Visible'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Customizer mutations
    toggleWidgetVisibility(id) {
        this.triggerHapticFeedback();
        const widget = this.widgets.find(w => w.id === id);
        if (widget) {
            widget.hidden = !widget.hidden;
            this.saveLayout();
            this.renderCustomizerDrawer();
            this.renderAll();
        }
    },

    toggleWidgetSize(id) {
        this.triggerHapticFeedback();
        const widget = this.widgets.find(w => w.id === id);
        if (widget) {
            widget.size = widget.size === 'full' ? 'half' : 'full';
            this.saveLayout();
            this.renderCustomizerDrawer();
            this.renderAll();
        }
    },

    reorderWidget(id, direction) {
        this.playSynthesizedSound('click-pop');
        const sorted = [...this.widgets].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex(w => w.id === id);

        if (direction === 'up' && index > 0) {
            // Swap order markers
            const temp = sorted[index].order;
            sorted[index].order = sorted[index - 1].order;
            sorted[index - 1].order = temp;
        } else if (direction === 'down' && index < sorted.length - 1) {
            const temp = sorted[index].order;
            sorted[index].order = sorted[index + 1].order;
            sorted[index + 1].order = temp;
        }

        this.widgets = sorted;
        this.saveLayout();
        this.renderCustomizerDrawer();
        this.renderAll();
    },

    // Toast Popups notification manager
    showToastNotification(title, message, type = 'info') {
        const center = document.getElementById('toast-notification-center');
        if (!center) return;

        const emojis = { info: 'ℹ️', success: '🏆', warning: '⚠️', danger: '🚨' };
        const borderColors = { info: 'border-indigo-500/40', success: 'border-emerald-500/40', warning: 'border-amber-500/40', danger: 'border-rose-500/40' };
        const iconsBg = { info: 'bg-indigo-500/20', success: 'bg-emerald-500/20', warning: 'bg-amber-500/20', danger: 'bg-rose-500/20' };

        const toast = document.createElement('div');
        toast.className = `p-4 rounded-3xl bg-slate-900/90 border ${borderColors[type]} backdrop-blur-xl shadow-2xl flex items-start gap-3 transform translate-y-4 opacity-0 transition-all duration-300 pointer-events-auto`;

        toast.innerHTML = `
            <div class="w-8 h-8 rounded-full ${iconsBg[type]} flex items-center justify-center text-sm flex-shrink-0">
                ${emojis[type]}
            </div>
            <div class="flex-1">
                <h4 class="text-xs font-black text-white uppercase tracking-wider">${title}</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-normal">${message}</p>
            </div>
            <button onclick="this.closest('.transform').remove()" class="text-xs text-slate-500 hover:text-white">✕</button>
        `;

        center.appendChild(toast);
        // Force Reflow
        toast.offsetHeight;
        toast.classList.remove('translate-y-4', 'opacity-0');

        // Automatically synthesize chime sound
        this.playSynthesizedSound('toast-chime');

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => { toast.remove(); }, 300);
        }, 4000);
    },

    // Web Audio Synthesizer (Battery-friendly multi-tone sound generator)
    playSynthesizedSound(theme) {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            const now = this.audioContext.currentTime;

            if (theme === 'boot') {
                // Futuristic high-fidelity sweep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.6);
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
            }
            else if (theme === 'toast-chime') {
                // Multi-tone notification ding
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.1, now + 0.05);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
            else if (theme === 'click-pop') {
                // Micro bubble pop
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            }
            else if (theme === 'tab-switch') {
                // Soft whoosh
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
                gain.gain.setValueAtTime(0.05, now);
                gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            console.warn("Web Audio API not supported or interaction suspended.");
        }
    },

    // Browser vibration API wrapper
    triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(15); // Micro dynamic feedback
        }
    },

    // Global Action Router
    triggerAction(type) {
        this.triggerHapticFeedback();
        if (type === 'study-start') {
            this.showToastNotification("Session Boot", "Continuing focus study block: Database Architecture.", "success");
            this.playSynthesizedSound('boot');
        } else if (type === 'quick-rev') {
            this.showToastNotification("Quick Study", "Synthesizing spaced repetition card deck...", "info");
            this.playSynthesizedSound('click-pop');
        } else if (type === 'start-all-rev') {
            this.showToastNotification("Revision Initiated", "Launching structured B-Tree and Subnet revision cycles.", "success");
            this.playSynthesizedSound('boot');
        } else if (type === 'new-task') {
            const name = prompt("Enter New Task Title:");
            if (name) {
                const newTask = {
                    id: 't' + (this.db.tasks.length + 1),
                    title: name,
                    subject: 'General Study',
                    priority: 'Medium',
                    deadline: 'Today, 11:30 PM',
                    duration: '30m',
                    completed: false
                };
                this.db.tasks.unshift(newTask);
                this.renderTasksList();
                this.showToastNotification("Task Registered", "Added to your study roadmap successfully.", "success");
            }
        }
    },

    // Quick radial action modal handler
    triggerQuickAction(action) {
        this.triggerHapticFeedback();
        document.getElementById('floating-shortcuts-panel').classList.add('hidden');

        const actionsConfig = {
            'new-note': { title: 'New Note Created', msg: 'Draft notes initialized and synced to your vault.', status: 'success' },
            'scan-doc': { title: 'Camera Scanner', msg: 'Document vectorized and OCR transcription generated successfully.', status: 'info' },
            'rec-lecture': { title: 'Voice Recorder', msg: 'Voice memo recording started. Synthesizing transcripts...', status: 'info' },
            'create-fc': { title: 'Flashcard Generated', msg: 'Smart Q&A pair drafted under Database folder.', status: 'success' },
            'start-timer': { title: 'Pomodoro Timer', msg: 'Focus study timer started: 25 minutes remaining.', status: 'success' },
            'import-pdf': { title: 'PDF Ingestion Pipeline', msg: 'PDF text structures parsed and indexed in knowledge base.', status: 'success' }
        };

        const config = actionsConfig[action];
        if (config) {
            this.showToastNotification(config.title, config.msg, config.status);
            this.playSynthesizedSound('click-pop');
            // Log recent activity
            this.db.recent.unshift({
                id: 'rec' + (this.db.recent.length + 1),
                action: 'Executed Quick Action',
                target: config.title,
                time: 'Just now',
                icon: '⚡'
            });
            this.renderRecentTimeline();
        }
    },

    // Main layout renderer orchestrator
    renderAll() {
        const board = document.getElementById('widget-board');
        if (!board) return;

        // Clean container first
        board.innerHTML = '';

        if (this.currentTab === 'dashboard') {
            // Render active Dashboard Layout matching order configuration
            const sortedWidgets = [...this.widgets].sort((a, b) => a.order - b.order);

            sortedWidgets.forEach(widget => {
                if (widget.hidden) return;

                // Create shell placeholder
                const colSpanClass = widget.size === 'full' ? 'md:col-span-2' : '';
                const placeholder = document.createElement('div');
                placeholder.id = `widget-shell-${widget.id}`;
                placeholder.className = `widget-container ${colSpanClass} transition-all duration-300`;
                board.appendChild(placeholder);

                // Inject widget inner card templates
                this.injectWidgetHTML(widget.id, placeholder);
            });

            // Initialize visual animations & Charts
            this.renderHeatmap();
            this.renderTasksList();
            this.renderRevisionCards();
            this.renderUpcomingExams();
            this.initChartsJS();
            this.renderBrainPaths();
            this.renderFocusArc();
            this.renderAchievementsGrid();
            this.renderRecentTimeline();
            this.renderAiInsights();
        } else {
            // Render beautiful dedicated empty/full state workspaces for other tabs
            board.className = "mt-4 flex flex-col gap-6";

            if (this.currentTab === 'learn') {
                board.innerHTML = this.getLearnTabTemplate();
            } else if (this.currentTab === 'library') {
                board.innerHTML = this.getLibraryTabTemplate();
            } else if (this.currentTab === 'profile') {
                board.innerHTML = this.getProfileTabTemplate();
            }
        }
    },

    // Inject matching markup for each widget
    injectWidgetHTML(id, container) {
        const widgetCard = this.originalWidgets[id];
        if (widgetCard) {
            // Clone or pull node
            container.appendChild(widgetCard);
        }
    },

    // HEATMAP GENERATOR (GitHub contribution graph simulation)
    renderHeatmap() {
        const grid = document.getElementById('heatmap-grid');
        if (!grid) return;

        // Build mock day nodes (15x7 grid for weekly representation, or expanded)
        grid.innerHTML = '';
        grid.className = "grid grid-cols-15 gap-1.5 select-none mx-auto";

        // Generate 15 cols, 7 rows
        const days = 105;
        let html = '';

        // Colors mapping logic: higher values represent darker colors
        const weights = [0, 1, 2, 3, 4, 1, 0, 2, 3, 4, 2, 1, 0, 4, 3];

        for (let i = 0; i < days; i++) {
            const weight = weights[i % weights.length];
            let colorClass = 'bg-slate-800 text-slate-800';
            let colorHex = '#1e293b';

            if (weight === 1) { colorClass = 'bg-indigo-900/30 text-indigo-400'; colorHex = '#312e81'; }
            else if (weight === 2) { colorClass = 'bg-indigo-700/50 text-indigo-300'; colorHex = '#4338ca'; }
            else if (weight === 3) { colorClass = 'bg-indigo-500/70 text-indigo-200'; colorHex = '#6366f1'; }
            else if (weight === 4) { colorClass = 'bg-cyan-400 text-cyan-950 font-black'; colorHex = '#22d3ee'; }

            html += `
                <div class="w-3.5 h-3.5 rounded-sm heatmap-tile ${colorClass}" style="color: ${colorHex}" data-day="${i + 1}" data-hours="${(weight * 1.5).toFixed(1)}" onclick="brainforge.inspectHeatmapTile(this)"></div>
            `;
        }
        grid.innerHTML = html;
    },

    inspectHeatmapTile(element) {
        this.triggerHapticFeedback();
        const day = element.getAttribute('data-day');
        const hours = element.getAttribute('data-hours');
        const inspector = document.getElementById('heatmap-inspector');

        if (inspector) {
            this.playSynthesizedSound('click-pop');
            inspector.innerHTML = `
                <div>
                    <span class="text-white font-bold block text-xs">📅 Day -${105 - day} Study History</span>
                    <span class="text-slate-400 block text-[11px] mt-0.5">Focus study hours logged: <strong class="text-cyan-400">${hours} Hours</strong></span>
                </div>
                <span class="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full">Synchronized</span>
            `;
        }
    },

    // TODAY'S TASKS LIST WITH SWIPE INTERACTION
    renderTasksList() {
        const container = document.getElementById('tasks-list');
        if (!container) return;

        container.innerHTML = this.db.tasks.map(task => {
            const checkedClass = task.completed ? 'line-through text-slate-500' : 'text-slate-100';
            const checkedIcon = task.completed ? '✅' : '⭕';

            let priorityBg = 'bg-slate-800 border-white/5';
            if (task.priority === 'High') priorityBg = 'bg-rose-500/10 border-rose-500/20 text-rose-300';
            else if (task.priority === 'Medium') priorityBg = 'bg-amber-500/10 border-amber-500/20 text-amber-300';

            return `
                <div class="swipe-action-wrapper bg-slate-950/40 rounded-2xl border border-white/5 overflow-hidden shadow-inner relative" id="task-row-${task.id}">
                    <!-- Slide Delete simulation overlay background -->
                    <div class="swipe-action-bg bg-rose-600/20 text-rose-300">
                        <span>Swipe Left to Delete 🗑️</span>
                    </div>

                    <!-- Main Swipeable Front card -->
                    <div class="swipe-card relative z-10 bg-slate-900/90 p-4 flex items-center justify-between gap-4 transition-transform duration-300 hover:translate-x-1" style="transform: translateX(0px);">
                        <div class="flex items-center gap-3.5 flex-1">
                            <button onclick="brainforge.toggleTaskCompletion('${task.id}')" class="text-xl focus:scale-110 active:scale-95 transition-all">${checkedIcon}</button>
                            <div class="flex-1">
                                <h4 class="text-xs font-bold leading-tight ${checkedClass}">${task.title}</h4>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-[10px] text-indigo-400 font-extrabold uppercase">${task.subject}</span>
                                    <span class="text-[9px] text-slate-500">•</span>
                                    <span class="text-[10px] text-slate-400">🕒 Estim: ${task.duration}</span>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${priorityBg}">${task.priority}</span>
                            <button onclick="brainforge.slideTaskLeft('${task.id}')" class="text-xs text-slate-500 hover:text-white" title="Actions">💬</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    toggleTaskCompletion(id) {
        this.triggerHapticFeedback();
        const task = this.db.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.playSynthesizedSound('click-pop');
            this.renderTasksList();
            this.showToastNotification("Task Updated", task.completed ? "Marked as completed!" : "Marked as active.", "success");
        }
    },

    slideTaskLeft(id) {
        this.triggerHapticFeedback();
        const row = document.querySelector(`#task-row-${id} .swipe-card`);
        if (row) {
            this.playSynthesizedSound('click-pop');
            const isSlid = row.style.transform === 'translateX(-120px)';
            row.style.transform = isSlid ? 'translateX(0px)' : 'translateX(-120px)';

            if (!isSlid) {
                // Auto restore or prompt deletion
                setTimeout(() => {
                    if (confirm("Would you like to delete this study task?")) {
                        this.db.tasks = this.db.tasks.filter(t => t.id !== id);
                        this.renderTasksList();
                        this.showToastNotification("Task Erased", "Successfully removed from checklist.", "danger");
                    } else {
                        row.style.transform = 'translateX(0px)';
                    }
                }, 1000);
            }
        }
    },

    // COGNITIVE RETENTION BRAIN PATHS
    renderBrainPaths() {
        const lobes = document.querySelectorAll('.lobe-path');
        const info = document.getElementById('brain-insight-info');

        lobes.forEach(lobe => {
            lobe.addEventListener('click', () => {
                this.triggerHapticFeedback();
                this.playSynthesizedSound('click-pop');

                // Clear active states
                lobes.forEach(l => l.classList.remove('lobe-active'));

                // Set active
                lobe.classList.add('lobe-active');

                // Update dynamic information
                const text = lobe.getAttribute('data-lobe');
                if (info) {
                    info.innerHTML = `
                        <span class="text-indigo-300 font-extrabold block">🧠 ${text} Active</span>
                        <span class="text-slate-400 mt-0.5 block">High cognitive load detected. BrainForge suggest 15m review cycles to build neuro-pathways.</span>
                    `;
                }
            });
        });
    },

    // FOCUS GAUGE ARC TRANSITIONS
    renderFocusArc() {
        const arc = document.getElementById('focus-gauge-arc');
        if (arc) {
            // Animate stroke dashoffset to showcase transition effect
            setTimeout(() => {
                arc.style.strokeDashoffset = "35";
            }, 500);
        }
    },

    // UNLOCKED BADGES GRID
    renderAchievementsGrid() {
        const grid = document.getElementById('achievements-badges-grid');
        if (!grid) return;

        const badges = [
            { icon: '🥇', title: '100 Hrs studied', unlocked: true, desc: 'Perfect milestone focus.' },
            { icon: '💻', title: 'SQL Master', unlocked: true, desc: 'High database score.' },
            { icon: '🔥', title: '7 Day Streak', unlocked: true, desc: 'Highly consistent!' },
            { icon: '🧠', title: 'Top Performer', unlocked: false, desc: 'Requires 4.90 GPA' },
            { icon: '📇', title: '100 Flashcards', unlocked: false, desc: 'Requires 50 more reviews' },
            { icon: '🔬', title: 'System Architect', unlocked: true, desc: 'Completed basic files.' }
        ];

        grid.innerHTML = badges.map(badge => {
            const glowClass = badge.unlocked ? 'bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 border-indigo-500/40 shadow-indigo-500/10 shadow-lg' : 'bg-slate-900/40 opacity-40 border-white/5';
            const textGlow = badge.unlocked ? 'text-indigo-300' : 'text-slate-500';

            return `
                <div class="p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-105 cursor-pointer ${glowClass}">
                    <span class="text-2xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]">${badge.icon}</span>
                    <h5 class="text-[9px] font-black uppercase tracking-wider leading-none ${textGlow}">${badge.title}</h5>
                    <p class="text-[8px] text-slate-400 leading-tight normal-case mt-0.5">${badge.desc}</p>
                </div>
            `;
        }).join('');
    },

    // REVISION DUE TODAY CARDS
    renderRevisionCards() {
        const container = document.getElementById('revision-container');
        if (!container) return;

        container.innerHTML = this.db.revisions.map(rev => {
            let meterColor = 'bg-emerald-400';
            if (rev.retention < 60) meterColor = 'bg-rose-400';
            else if (rev.retention < 80) meterColor = 'bg-amber-400';

            return `
                <div class="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex flex-col gap-2.5 shadow-inner">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="text-xs font-black text-white">${rev.topic}</h4>
                            <span class="text-[10px] text-indigo-400 font-extrabold uppercase mt-0.5 block">${rev.subject}</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full bg-slate-800 text-[9px] font-extrabold uppercase text-slate-400 border border-white/5">${rev.difficulty}</span>
                    </div>

                    <div>
                        <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Memory Retention</span>
                            <span class="font-extrabold text-white">${rev.retention}%</span>
                        </div>
                        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div class="${meterColor} h-full transition-all duration-1000" style="width: ${rev.retention}%"></div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center mt-1">
                        <span class="text-[10px] text-slate-400">🕒 Rev: ${rev.duration}</span>
                        <button onclick="brainforge.triggerAction('study-start')" class="px-3 py-1 rounded-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 transition-all">
                            Start Revision
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // UPCOMING EXAMS TIMELINE ROW
    renderUpcomingExams() {
        const container = document.getElementById('exams-timeline');
        if (!container) return;

        container.innerHTML = this.db.exams.map(exam => {
            return `
                <div class="relative pl-6 border-l-2 border-indigo-500/30 py-1">
                    <!-- Chronological timeline node dot -->
                    <div class="absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full bg-indigo-500 border-4 border-[#0F172A] shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>

                    <div class="bg-slate-950/40 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="text-xs font-black text-white">${exam.name}</h4>
                                <span class="text-[10px] text-slate-400">${exam.subject} • Venue: <strong class="text-white">${exam.venue}</strong></span>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[9px] font-black uppercase tracking-wider border border-rose-500/30">${exam.days} Days Left</span>
                        </div>

                        <!-- Confidence scale meter -->
                        <div class="flex justify-between items-center mt-1">
                            <span class="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Exam Confidence</span>
                            <span class="text-[10px] font-bold text-emerald-400">${exam.confidence}%</span>
                        </div>
                        <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-emerald-400 h-full transition-all duration-1000" style="width: ${exam.confidence}%"></div>
                        </div>

                        <div class="flex gap-2 mt-2">
                            <button onclick="brainforge.triggerAction('study-start')" class="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all">
                                Prepare
                            </button>
                            <button onclick="brainforge.switchTab('library')" class="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-all border border-slate-700">
                                View Notes
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // AI INSIGHT RECOMMENDATIONS ROW
    renderAiInsights() {
        const container = document.getElementById('ai-insights-grid');
        if (!container) return;

        const insights = [
            { icon: '📈', title: 'Peak Focus Period', desc: 'Your focus density increases by 18% between 7PM and 9PM daily. Schedule high difficulty subjects then.' },
            { icon: '⚠️', title: 'Forgotten Topics Alert', desc: 'NoSQL Database Indexing concepts have not been revised for 6 days. Retention dropped by 12%.' },
            { icon: '🎯', title: 'Milestone Boost', desc: 'Complete 1 quick revision quiz on Subnet Division to hit your weekly target of 40 hours.' },
            { icon: '🔋', title: 'Power Down Insight', desc: 'Short 5-minute pauses after 25m Pomodoros reduce fatigue by 40%. Maintain balance.' }
        ];

        container.innerHTML = insights.map(ins => {
            return `
                <div class="bg-slate-950/40 p-4 rounded-2xl border border-white/5 flex items-start gap-3 shadow-inner">
                    <span class="text-2xl">${ins.icon}</span>
                    <div>
                        <h4 class="text-xs font-black text-white uppercase tracking-wider">${ins.title}</h4>
                        <p class="text-xs text-slate-300 mt-1 leading-normal">${ins.desc}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    // RECENT HISTORY TIMELINE ROW
    renderRecentTimeline() {
        const container = document.getElementById('recent-activity-timeline');
        if (!container) return;

        container.innerHTML = this.db.recent.map(rec => {
            return `
                <div class="flex items-start gap-3 bg-slate-950/20 p-3 rounded-2xl border border-white/5">
                    <span class="text-xl">${rec.icon}</span>
                    <div class="flex-1">
                        <span class="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">${rec.action}</span>
                        <h5 class="text-xs font-extrabold text-white mt-0.5">${rec.target}</h5>
                    </div>
                    <span class="text-[10px] text-slate-400 font-bold">${rec.time}</span>
                </div>
            `;
        }).join('');
    },

    // GLOBAL SEARCH ALGORITHMS
    handleSearchIndex(query) {
        const resultsList = document.getElementById('search-results-list');
        if (!resultsList) return;

        if (!query || query.trim() === '') {
            resultsList.innerHTML = '<span class="text-xs text-slate-500 italic block text-center py-4">Start typing to search notes, flashcards, or tasks...</span>';
            return;
        }

        const filteredNotes = this.db.notes.filter(n => n.title.toLowerCase().includes(query.toLowerCase()) || n.content.toLowerCase().includes(query.toLowerCase()));
        const filteredCards = this.db.flashcards.filter(f => f.question.toLowerCase().includes(query.toLowerCase()) || f.answer.toLowerCase().includes(query.toLowerCase()));

        let html = '';

        if (filteredNotes.length === 0 && filteredCards.length === 0) {
            resultsList.innerHTML = '<span class="text-xs text-slate-500 italic block text-center py-4">No academic matches found.</span>';
            return;
        }

        filteredNotes.forEach(n => {
            html += `
                <div class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer hover:bg-indigo-500/20 transition-all" onclick="brainforge.previewSearchMatch('Note', '${n.title}')">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-black text-white">${n.title}</span>
                        <span class="text-[9px] uppercase font-bold tracking-widest bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">Note</span>
                    </div>
                    <p class="text-[11px] text-slate-300 mt-1 line-clamp-1">${n.content}</p>
                </div>
            `;
        });

        filteredCards.forEach(f => {
            html += `
                <div class="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 cursor-pointer hover:bg-cyan-500/20 transition-all" onclick="brainforge.previewSearchMatch('Flashcard', '${f.question}')">
                    <div class="flex justify-between items-center">
                        <span class="text-xs font-black text-white">${f.question}</span>
                        <span class="text-[9px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded">Flashcard</span>
                    </div>
                    <p class="text-[11px] text-slate-300 mt-1 line-clamp-1">${f.answer}</p>
                </div>
            `;
        });

        resultsList.innerHTML = html;
    },

    previewSearchMatch(type, name) {
        this.triggerHapticFeedback();
        this.playSynthesizedSound('click-pop');
        this.showToastNotification("Search Match", `Loaded search index: [${type}] ${name}`, "success");
        document.getElementById('global-search-panel').classList.add('hidden');
    },

    // Chart.js 60fps setup
    initChartsJS() {
        const lineCtx = document.getElementById('bf-line-chart');
        const barCtx = document.getElementById('bf-bar-chart');

        if (!lineCtx || !barCtx) return;

        // Clear existing instances to prevent overlays
        if (this.lineChartInstance) this.lineChartInstance.destroy();
        if (this.barChartInstance) this.barChartInstance.destroy();

        // Area line chart
        this.lineChartInstance = new Chart(lineCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Study Hours',
                    data: [15, 28, 35, 34.5],
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    tension: 0.4,
                    fill: true,
                    borderWidth: 2,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } }
                }
            }
        });

        // Focus bar distribution
        this.barChartInstance = new Chart(barCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['DB', 'Net', 'OS', 'Math'],
                datasets: [{
                    label: 'Sessions',
                    data: [18, 12, 14, 23],
                    backgroundColor: ['#4F46E5', '#06B6D4', '#22C55E', '#F59E0B'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 9 } } }
                }
            }
        });
    },

    // TEMPLATE GENERATORS FOR OTHER WORKSPACES
    getLearnTabTemplate() {
        return `
            <div class="widget-card p-6 border border-white/5 flex flex-col gap-4">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-2xl">📚</span>
                    <h3 class="text-lg font-black text-white">BrainForge Interactive Syllabus</h3>
                </div>
                <p class="text-xs text-slate-400">Offline-first interactive lesson plans synced dynamically across devices.</p>

                <div class="space-y-3.5 mt-2">
                    <div class="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                        <div>
                            <span class="text-[10px] text-indigo-400 font-extrabold uppercase">Unit 1: Relational Algebra</span>
                            <h4 class="text-xs font-black text-white mt-0.5">Database schema projections and selections</h4>
                        </div>
                        <button onclick="brainforge.triggerAction('study-start')" class="px-3.5 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-xs">Start Lesson</button>
                    </div>

                    <div class="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex justify-between items-center">
                        <div>
                            <span class="text-[10px] text-cyan-400 font-extrabold uppercase">Unit 2: Computer Network Layering</span>
                            <h4 class="text-xs font-black text-white mt-0.5">Subnet mask allocation math formulas</h4>
                        </div>
                        <button onclick="brainforge.triggerAction('study-start')" class="px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700">Locked 🔒</button>
                    </div>
                </div>
            </div>
        `;
    },

    getLibraryTabTemplate() {
        return `
            <div class="widget-card p-6 border border-white/5 flex flex-col gap-4">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-2xl">📁</span>
                        <h3 class="text-lg font-black text-white">Smart PDF Document Vault</h3>
                    </div>
                    <button onclick="brainforge.triggerQuickAction('import-pdf')" class="px-3 py-1.5 rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">Import Document</button>
                </div>
                <p class="text-xs text-slate-400">Manage notes, textbooks, and recordings indexed entirely on IndexedDB.</p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-2">
                    <div class="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                        <div>
                            <h4 class="text-xs font-black text-white">Advanced Database Indexes.pdf</h4>
                            <span class="text-[9px] text-slate-400 mt-1 block">Size: 4.5 MB • 24 pages</span>
                        </div>
                        <span class="text-xl">📄</span>
                    </div>

                    <div class="p-4 rounded-2xl bg-slate-950/40 border border-white/5 flex items-center justify-between">
                        <div>
                            <h4 class="text-xs font-black text-white">System Architecture Diagrams.png</h4>
                            <span class="text-[9px] text-slate-400 mt-1 block">Size: 1.2 MB • Image asset</span>
                        </div>
                        <span class="text-xl">🎨</span>
                    </div>
                </div>
            </div>
        `;
    },

    getProfileTabTemplate() {
        return `
            <div class="widget-card p-6 border border-white/5 flex flex-col items-center gap-4 text-center">
                <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 via-cyan-500 to-emerald-500 p-[3px] shadow-2xl">
                    <div class="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-2xl font-black text-indigo-300">JM</div>
                </div>

                <div>
                    <h3 class="text-xl font-black text-white">Joshua Mujakari 👋</h3>
                    <span class="text-xs text-indigo-400 font-extrabold uppercase mt-0.5 tracking-widest block">Senior Computer Science Administrator</span>
                </div>

                <div class="grid grid-cols-3 gap-3 w-full max-w-sm mt-4 text-xs">
                    <div class="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-slate-400 block text-[10px] uppercase font-bold">GPA Score</span>
                        <span class="text-white font-extrabold mt-0.5 text-base block">4.82</span>
                    </div>
                    <div class="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-slate-400 block text-[10px] uppercase font-bold">Streak</span>
                        <span class="text-white font-extrabold mt-0.5 text-base block">14 Days</span>
                    </div>
                    <div class="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
                        <span class="text-slate-400 block text-[10px] uppercase font-bold">Hours Logged</span>
                        <span class="text-white font-extrabold mt-0.5 text-base block">34.5 hrs</span>
                    </div>
                </div>
            </div>
        `;
    }
};

// Run Initializer
brainforge.init();
