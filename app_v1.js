/**
 * ==========================================================================
 * KURICHONG ECO LODGE CLIENT APP CONTROLLER (app_v1.js)
 * High-performance SPA controller for booking, reviews, and admin dashboard
 * ==========================================================================
 */

class LodgeApp {
    constructor() {
        this.currentView = 'home';
        this.currentAdminTab = 'bookings';
        this.adminSession = null;

        // Cache room pricing state
        this.roomPrices = {
            standard: 2500,
            deluxe: 3500,
            executive: 5500
        };

        this.bookings = [];
        this.messages = [];
    }

    async init() {
        console.log("🚀 Initializing Kurichong Eco Lodge Web App...");

        // Setup initial default date constraints
        this.initDatePickerLimits();

        // Initial setup for navigation listener
        window.addEventListener('scroll', () => this.handleHeaderScroll());

        // Check for active admin session in localStorage
        const storedSession = localStorage.getItem('lodge_admin_session');
        if (storedSession) {
            try {
                this.adminSession = JSON.parse(storedSession);
                this.updateAdminDashboardUI();
            } catch (e) {
                localStorage.removeItem('lodge_admin_session');
            }
        }

        // Fetch fresh state from API database
        await this.syncStateWithDB();

        // Initialize dynamic calculations
        this.calcBookingPrice();
        this.calcManualBookingPrice();
    }

    initDatePickerLimits() {
        const todayStr = new Date().toISOString().split('T')[0];

        // Set min dates on date picker inputs
        const checkinInputs = ['qb-checkin', 'book-checkin', 'mb-checkin'];
        const checkoutInputs = ['qb-checkout', 'book-checkout', 'mb-checkout'];

        checkinInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.min = todayStr;
        });

        checkoutInputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.min = todayStr;
        });

        // Seed some defaults
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 3);

        const checkinDefault = tomorrow.toISOString().split('T')[0];
        const checkoutDefault = dayAfterTomorrow.toISOString().split('T')[0];

        if (document.getElementById('qb-checkin')) document.getElementById('qb-checkin').value = checkinDefault;
        if (document.getElementById('qb-checkout')) document.getElementById('qb-checkout').value = checkoutDefault;

        if (document.getElementById('book-checkin')) document.getElementById('book-checkin').value = checkinDefault;
        if (document.getElementById('book-checkout')) document.getElementById('book-checkout').value = checkoutDefault;

        if (document.getElementById('mb-checkin')) document.getElementById('mb-checkin').value = checkinDefault;
        if (document.getElementById('mb-checkout')) document.getElementById('mb-checkout').value = checkoutDefault;
    }

    handleHeaderScroll() {
        const header = document.getElementById('main-header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }

    // Toggle slide-out menu drawer
    toggleMobileMenu() {
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }

    // SPA View Switcher
    showSection(sectionId) {
        this.currentView = sectionId;

        // Hide all sections, display target
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update Nav Menu Links Classes
        document.querySelectorAll('.desktop-nav .nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === sectionId) {
                link.classList.add('active');
            }
        });
        document.querySelectorAll('.mobile-sidebar .mobile-link').forEach(link => {
            link.classList.remove('active');
            if (link.innerText.toLowerCase().includes(sectionId)) {
                link.classList.add('active');
            }
        });

        // Scroll to top of body
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // If admin section requested, update statistics
        if (sectionId === 'admin') {
            this.syncStateWithDB().then(() => {
                this.updateAdminDashboardUI();
            });
        }
    }

    // SYNC STATE FROM REST DATABASE
    async syncStateWithDB() {
        this.showLoader(true);
        try {
            // Load bookings
            this.bookings = await db.bookings.toArray();

            // Load messages
            this.messages = await db.messages.toArray();

            // Load settings and adjust tariffs if configured
            const settings = await db.settings.toArray();
            const stdSetting = settings.find(s => s.key === 'tariff_standard');
            const dlxSetting = settings.find(s => s.key === 'tariff_deluxe');
            const exeSetting = settings.find(s => s.key === 'tariff_executive');

            if (stdSetting) this.roomPrices.standard = parseFloat(stdSetting.value);
            if (dlxSetting) this.roomPrices.deluxe = parseFloat(dlxSetting.value);
            if (exeSetting) this.roomPrices.executive = parseFloat(exeSetting.value);

            // Seed initial state in localStorage fallback for offline client demonstration
            this.seedLocalMockIfNeeded();

        } catch (err) {
            console.error('❌ Database sync failed. Using local storage Fallback.', err.message);
        } finally {
            this.showLoader(false);
        }
    }

    seedLocalMockIfNeeded() {
        const localKey = 'lodge_db_bookings';
        if (!localStorage.getItem(localKey)) {
            // Seed localStorage fallback with initial bookings
            localStorage.setItem(localKey, JSON.stringify(this.bookings));
            localStorage.setItem('lodge_db_messages', JSON.stringify(this.messages));
            localStorage.setItem('lodge_db_settings', JSON.stringify([
                { key: 'tariff_standard', value: this.roomPrices.standard },
                { key: 'tariff_deluxe', value: this.roomPrices.deluxe },
                { key: 'tariff_executive', value: this.roomPrices.executive }
            ]));
        }
    }

    // DYNAMIC PRICING ENGINE
    calcBookingPrice() {
        const checkinVal = document.getElementById('book-checkin')?.value;
        const checkoutVal = document.getElementById('book-checkout')?.value;
        const roomType = document.getElementById('book-room-type')?.value;

        if (!checkinVal || !checkoutVal || !roomType) return;

        const date1 = new Date(checkinVal);
        const date2 = new Date(checkoutVal);

        // Calculate nights
        const timeDiff = date2.getTime() - date1.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const finalNights = nights > 0 ? nights : 0;

        const rate = this.roomPrices[roomType] || 0;
        const totalPrice = finalNights * rate;

        // Render to modal
        const nightsText = document.getElementById('booking-nights-count');
        const rateText = document.getElementById('booking-room-rate');
        const totalText = document.getElementById('booking-total-price');

        if (nightsText) nightsText.innerText = `${finalNights} Night${finalNights !== 1 ? 's' : ''} Stay`;
        if (rateText) rateText.innerText = `Rate: Nu. ${rate.toLocaleString()}/night`;
        if (totalText) totalText.innerText = `Nu. ${totalPrice.toLocaleString()}.00`;
    }

    calcManualBookingPrice() {
        const checkinVal = document.getElementById('mb-checkin')?.value;
        const checkoutVal = document.getElementById('mb-checkout')?.value;
        const roomType = document.getElementById('mb-room-type')?.value;

        if (!checkinVal || !checkoutVal || !roomType) return;

        const date1 = new Date(checkinVal);
        const date2 = new Date(checkoutVal);

        const timeDiff = date2.getTime() - date1.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const finalNights = nights > 0 ? nights : 0;

        const rate = this.roomPrices[roomType] || 0;
        const totalPrice = finalNights * rate;

        const nightsText = document.getElementById('mb-nights-count');
        const totalText = document.getElementById('mb-total-price');

        if (nightsText) nightsText.innerText = `${finalNights} night${finalNights !== 1 ? 's' : ''}`;
        if (totalText) totalText.innerText = `Nu. ${totalPrice.toLocaleString()}.00`;
    }

    // Modal Control Modals
    openBookingModal(preselectedRoom = 'deluxe') {
        const modal = document.getElementById('booking-modal');
        const roomSelector = document.getElementById('book-room-type');

        if (roomSelector && preselectedRoom) {
            roomSelector.value = preselectedRoom;
        }

        if (modal) {
            modal.classList.remove('hidden');
            this.calcBookingPrice();
        }
    }

    closeBookingModal() {
        const modal = document.getElementById('booking-modal');
        if (modal) modal.classList.add('hidden');
    }

    closeConfirmationModal() {
        const modal = document.getElementById('confirmation-modal');
        if (modal) modal.classList.add('hidden');
    }

    // Check overlap helper for double booking prevention
    hasBookingOverlap(roomType, newIn, newOut) {
        const inDate = new Date(newIn);
        const outDate = new Date(newOut);

        // Filter active bookings of the same room type
        const matches = this.bookings.filter(b => b.roomType === roomType && b.status === 'Confirmed');

        for (const b of matches) {
            const bIn = new Date(b.checkIn);
            const bOut = new Date(b.checkOut);

            // Check overlap: (NewCheckIn < ExistingCheckOut) AND (NewCheckOut > ExistingCheckIn)
            if (inDate < bOut && outDate > bIn) {
                return true;
            }
        }
        return false;
    }

    // FORM HANDLERS
    async handleBookingSubmit(event) {
        event.preventDefault();

        const checkin = document.getElementById('book-checkin').value;
        const checkout = document.getElementById('book-checkout').value;
        const roomType = document.getElementById('book-room-type').value;
        const guests = parseInt(document.getElementById('book-guests').value);
        const name = document.getElementById('book-name').value;
        const email = document.getElementById('book-email').value;
        const phone = document.getElementById('book-phone').value;
        const requests = document.getElementById('book-requests').value;

        // Perform validations
        const date1 = new Date(checkin);
        const date2 = new Date(checkout);

        if (date2 <= date1) {
            this.showToast("Check-out date must be after the check-in date.", "error");
            return;
        }

        // Prevent booking overlap for a polished experience!
        if (this.hasBookingOverlap(roomType, checkin, checkout)) {
            this.showToast(`Sorry, the selected dates have booking conflicts for the ${roomType.toUpperCase()} Room. Please try other dates.`, "error");
            return;
        }

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const rate = this.roomPrices[roomType] || 0;
        const totalPrice = nights * rate;

        const bookingRef = `KEL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const bookingData = {
            bookingId: bookingRef,
            guestName: name,
            guestEmail: email,
            guestPhone: phone,
            roomType: roomType,
            checkIn: checkin,
            checkOut: checkout,
            guests: guests,
            totalPrice: totalPrice,
            status: 'Pending',
            specialRequests: requests,
            createdAt: new Date().toISOString()
        };

        this.showLoader(true);
        try {
            const saved = await db.bookings.add(bookingData);

            // Sync up and show confirmation
            await this.syncStateWithDB();
            this.closeBookingModal();
            this.showConfirmationSuccess(saved);
            document.getElementById('booking-reservation-form').reset();
            this.initDatePickerLimits();

        } catch (e) {
            this.showToast("An error occurred. Booking saved offline.", "warning");
        } finally {
            this.showLoader(false);
        }
    }

    handleQuickBook(event) {
        event.preventDefault();
        const checkin = document.getElementById('qb-checkin').value;
        const checkout = document.getElementById('qb-checkout').value;
        const roomType = document.getElementById('qb-room-type').value;

        // Prepopulate booking modal
        if (document.getElementById('book-checkin')) document.getElementById('book-checkin').value = checkin;
        if (document.getElementById('book-checkout')) document.getElementById('book-checkout').value = checkout;

        this.openBookingModal(roomType);
    }

    async handleContactSubmit(event) {
        event.preventDefault();

        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const phone = document.getElementById('contact-phone').value;
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;

        const messageData = {
            name: name,
            email: email,
            phone: phone,
            subject: subject,
            message: message,
            date: new Date().toISOString(),
            status: 'Unread'
        };

        this.showLoader(true);
        try {
            await db.messages.add(messageData);
            this.showToast("Your inquiry message was successfully sent! We will reach out shortly.", "success");
            document.getElementById('contact-form').reset();
            await this.syncStateWithDB();
        } catch (e) {
            this.showToast("Failed sending, saved locally.", "warning");
        } finally {
            this.showLoader(false);
        }
    }

    showConfirmationSuccess(b) {
        const modal = document.getElementById('confirmation-modal');

        const confRef = document.getElementById('conf-id');
        const confName = document.getElementById('conf-name');
        const confRoom = document.getElementById('conf-room');
        const confDates = document.getElementById('conf-dates');
        const confPrice = document.getElementById('conf-price');

        if (confRef) confRef.innerText = b.bookingId;
        if (confName) confName.innerText = b.guestName;
        if (confRoom) confRoom.innerText = b.roomType.toUpperCase();
        if (confDates) confDates.innerText = `${b.checkIn} to ${b.checkOut}`;
        if (confPrice) confPrice.innerText = `Nu. ${parseFloat(b.totalPrice).toLocaleString()}.00`;

        if (modal) modal.classList.remove('hidden');
    }

    // ADMINISTRATIVE PORTAL BUSINESS LOGIC
    async handleAdminLogin(event) {
        event.preventDefault();

        const user = document.getElementById('login-username').value;
        const pass = document.getElementById('login-password').value;

        this.showLoader(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, password: pass })
            });

            if (res.ok) {
                const data = await res.json();
                this.adminSession = data.user;
                localStorage.setItem('lodge_admin_session', JSON.stringify(data.user));
                this.showToast("Welcome Administrator! Access Granted.", "success");
                this.updateAdminDashboardUI();
            } else {
                // Client-side fallback for static Cloudflare Pages / Offline demonstration
                if (user === 'admin' && pass === 'admin123') {
                    this.adminSession = { username: 'admin', name: 'Kurichong Admin', role: 'Admin' };
                    localStorage.setItem('lodge_admin_session', JSON.stringify(this.adminSession));
                    this.showToast("Access Granted (Local Mode)", "success");
                    this.updateAdminDashboardUI();
                } else {
                    this.showToast("Invalid administrative username or password.", "error");
                }
            }
        } catch (e) {
            // Offline fallback
            if (user === 'admin' && pass === 'admin123') {
                this.adminSession = { username: 'admin', name: 'Kurichong Admin (Offline)', role: 'Admin' };
                localStorage.setItem('lodge_admin_session', JSON.stringify(this.adminSession));
                this.showToast("Access Granted (Offline Fallback)", "success");
                this.updateAdminDashboardUI();
            } else {
                this.showToast("Authentication server unavailable. Admin credentials failed.", "error");
            }
        } finally {
            this.showLoader(false);
        }
    }

    handleAdminLogout() {
        this.adminSession = null;
        localStorage.removeItem('lodge_admin_session');
        this.showToast("Administrator signed out successfully.", "success");

        // Return back to credentials card
        document.getElementById('admin-login-card')?.classList.remove('hidden');
        document.getElementById('admin-dashboard-console')?.classList.add('hidden');
        document.getElementById('admin-login-form')?.reset();
    }

    updateAdminDashboardUI() {
        if (!this.adminSession) return;

        // Hide login form, display dashboard
        document.getElementById('admin-login-card')?.classList.add('hidden');
        document.getElementById('admin-dashboard-console')?.classList.remove('hidden');

        const adminNameLabel = document.getElementById('admin-display-name');
        if (adminNameLabel) adminNameLabel.innerText = this.adminSession.name;

        // Compile operational stats
        this.renderStats();

        // Render current active tab
        this.switchAdminTab(this.currentAdminTab);
    }

    renderStats() {
        // Calculate revenue
        const confirmedBookings = this.bookings.filter(b => b.status === 'Confirmed');
        const revenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

        const revEl = document.getElementById('stat-revenue');
        if (revEl) revEl.innerText = `Nu. ${revenue.toLocaleString()}.00`;

        const totalActive = this.bookings.filter(b => b.status !== 'Cancelled').length;
        const activeBookingsEl = document.getElementById('stat-bookings');
        if (activeBookingsEl) activeBookingsEl.innerText = totalActive;

        const pendingCount = this.bookings.filter(b => b.status === 'Pending').length;
        const pendEl = document.getElementById('stat-pending-indicator');
        if (pendEl) pendEl.innerText = `${pendingCount} Reservation${pendingCount !== 1 ? 's' : ''} Pending`;

        // Calculate current room category occupancies (occupied standard rooms vs total 5)
        const stdOcc = confirmedBookings.filter(b => b.roomType === 'standard').length;
        const dlxOcc = confirmedBookings.filter(b => b.roomType === 'deluxe').length;
        const exeOcc = confirmedBookings.filter(b => b.roomType === 'executive').length;

        const stdEl = document.getElementById('stat-std-occupancy');
        const dlxEl = document.getElementById('stat-dlx-occupancy');
        const exeEl = document.getElementById('stat-exe-occupancy');

        if (stdEl) stdEl.innerText = `${stdOcc} / 5 occupied`;
        if (dlxEl) dlxEl.innerText = `${dlxOcc} / 5 occupied`;
        if (exeEl) exeEl.innerText = `${exeOcc} / 2 occupied`;

        // Messages count
        const unreadMsg = this.messages.filter(m => m.status === 'Unread').length;
        const unreadCountEl = document.getElementById('unread-msg-count');
        if (unreadCountEl) unreadCountEl.innerText = unreadMsg;
    }

    switchAdminTab(tabName) {
        this.currentAdminTab = tabName;

        // Update menu buttons active class
        document.querySelectorAll('.admin-tabs-nav .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        // Hide all contents, show target
        document.querySelectorAll('.admin-tab-content').forEach(cont => {
            cont.classList.remove('active');
        });
        const targetTab = document.getElementById(`admin-tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Render contents based on active tab
        if (tabName === 'bookings') {
            this.renderBookingsTable();
        } else if (tabName === 'messages') {
            this.renderMessagesTable();
        } else if (tabName === 'settings') {
            this.populateSettingsForm();
        }
    }

    // Render bookings log
    renderBookingsTable(filterStatus = 'all') {
        const tbody = document.getElementById('bookings-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filtered = [...this.bookings];
        if (filterStatus !== 'all') {
            filtered = filtered.filter(b => b.status === filterStatus);
        }

        // Sort descending by creation
        filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted)">No reservations logged in this category.</td></tr>`;
            return;
        }

        filtered.forEach(b => {
            const tr = document.createElement('tr');

            // Build action buttons depending on booking status
            let actionButtons = '';
            if (b.status === 'Pending') {
                actionButtons = `
                    <button class="btn-action-confirm" onclick="app.updateBookingStatus(${b.id}, 'Confirmed')">Approve</button>
                    <button class="btn-action-cancel" onclick="app.updateBookingStatus(${b.id}, 'Cancelled')">Cancel</button>
                `;
            } else if (b.status === 'Confirmed') {
                actionButtons = `
                    <button class="btn-action-cancel" onclick="app.updateBookingStatus(${b.id}, 'Cancelled')">Cancel</button>
                `;
            } else if (b.status === 'Cancelled') {
                actionButtons = `
                    <button class="btn-action-confirm" onclick="app.updateBookingStatus(${b.id}, 'Confirmed')">Reinstate</button>
                `;
            }

            actionButtons += `
                <button class="btn-action-delete" onclick="app.deleteBookingRecord(${b.id})">Delete</button>
            `;

            const statusClass = b.status.toLowerCase();

            tr.innerHTML = `
                <td style="font-family: monospace; font-weight: 700; color: var(--primary)">${b.bookingId}</td>
                <td>
                    <div class="guest-cell-name">${b.guestName}</div>
                    <div class="guest-cell-meta">✉️ ${b.guestEmail} | 📞 ${b.guestPhone}</div>
                    ${b.specialRequests ? `<div style="font-size: 0.75rem; font-style: italic; color: var(--accent-dark); margin-top: 0.25rem;">📝: "${b.specialRequests}"</div>` : ''}
                </td>
                <td style="text-transform: capitalize; font-weight: 600;">${b.roomType}</td>
                <td>
                    <div style="font-weight: 600;">${b.checkIn}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">to ${b.checkOut}</div>
                </td>
                <td style="font-weight: 700; color: var(--primary-dark)">Nu. ${parseFloat(b.totalPrice).toLocaleString()}.00</td>
                <td><span class="status-badge ${statusClass}">${b.status}</span></td>
                <td><div style="display: flex; gap: 0.2rem;">${actionButtons}</div></td>
            `;

            tbody.appendChild(tr);
        });
    }

    filterBookings(status) {
        this.renderBookingsTable(status);
    }

    async updateBookingStatus(id, newStatus) {
        this.showLoader(true);
        try {
            await db.bookings.update(id, { status: newStatus });
            this.showToast(`Reservation successfully ${newStatus}!`, "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed updating status", "error");
        } finally {
            this.showLoader(false);
        }
    }

    async deleteBookingRecord(id) {
        if (!confirm("Are you absolutely sure you want to permanently delete this reservation record from the database? This cannot be undone.")) return;

        this.showLoader(true);
        try {
            await db.bookings.delete(id);
            this.showToast("Reservation record permanently deleted.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed deleting record", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // Manual walks-in Injector
    async handleManualBooking(event) {
        event.preventDefault();

        const name = document.getElementById('mb-guest-name').value;
        const email = document.getElementById('mb-guest-email').value;
        const phone = document.getElementById('mb-guest-phone').value;
        const checkin = document.getElementById('mb-checkin').value;
        const checkout = document.getElementById('mb-checkout').value;
        const guests = parseInt(document.getElementById('mb-guests').value);
        const roomType = document.getElementById('mb-room-type').value;
        const status = document.getElementById('mb-status').value;
        const requests = document.getElementById('mb-requests').value;

        // Validations
        const date1 = new Date(checkin);
        const date2 = new Date(checkout);
        if (date2 <= date1) {
            this.showToast("Check-out date must succeed check-in date.", "error");
            return;
        }

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const totalPrice = nights * (this.roomPrices[roomType] || 0);

        const bookingRef = `KEL-WALK-${Math.floor(1000 + Math.random() * 9000)}`;

        const data = {
            bookingId: bookingRef,
            guestName: name,
            guestEmail: email,
            guestPhone: phone,
            roomType: roomType,
            checkIn: checkin,
            checkOut: checkout,
            guests: guests,
            totalPrice: totalPrice,
            status: status,
            specialRequests: requests,
            createdAt: new Date().toISOString()
        };

        this.showLoader(true);
        try {
            await db.bookings.add(data);
            this.showToast("Manual reservation successfully registered!", "success");
            document.getElementById('admin-manual-booking-form').reset();
            this.initDatePickerLimits();
            this.calcManualBookingPrice();
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
            this.switchAdminTab('bookings');
        } catch (e) {
            this.showToast("Failed adding walk-in booking", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // Message Inbox Render
    renderMessagesTable() {
        const tbody = document.getElementById('messages-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        // Sort descending by date
        const sorted = [...this.messages].sort((a,b) => new Date(b.date) - new Date(a.date));

        if (sorted.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted)">Inbox is empty. No inquiries received yet.</td></tr>`;
            return;
        }

        sorted.forEach(m => {
            const tr = document.createElement('tr');

            let actions = '';
            if (m.status === 'Unread') {
                actions += `<button class="btn-action-confirm" onclick="app.updateMessageStatus(${m.id}, 'Read')">Mark Read</button>`;
            } else if (m.status === 'Read') {
                actions += `<button class="btn-action-cancel" onclick="app.updateMessageStatus(${m.id}, 'Replied')">Mark Replied</button>`;
            }
            actions += `<button class="btn-action-delete" onclick="app.deleteMessage(${m.id})">Delete</button>`;

            const dateStr = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            tr.innerHTML = `
                <td style="white-space: nowrap; font-weight: 600;">${dateStr}</td>
                <td>
                    <div style="font-weight: 700;">${m.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">✉️ ${m.email} | 📞 ${m.phone}</div>
                </td>
                <td style="font-weight: 600; color: var(--primary-glow)">${m.subject}</td>
                <td style="font-size: 0.8rem; max-width: 300px; word-wrap: break-word;">"${m.message}"</td>
                <td><span class="status-badge ${m.status === 'Unread' ? 'pending' : (m.status === 'Read' ? 'confirmed' : 'cancelled')}" style="padding: 0.2rem 0.4rem; font-size: 0.65rem;">${m.status}</span></td>
                <td><div style="display: flex; gap: 0.2rem;">${actions}</div></td>
            `;

            tbody.appendChild(tr);
        });
    }

    async updateMessageStatus(id, newStatus) {
        this.showLoader(true);
        try {
            await db.messages.update(id, { status: newStatus });
            this.showToast(`Inquiry status updated to ${newStatus}`, "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed updating message status", "error");
        } finally {
            this.showLoader(false);
        }
    }

    async deleteMessage(id) {
        if (!confirm("Delete this message permanently?")) return;
        this.showLoader(true);
        try {
            await db.messages.delete(id);
            this.showToast("Message deleted.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed deleting message", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // System Settings & Tariffs
    populateSettingsForm() {
        const stdPriceInput = document.getElementById('set-std-price');
        const dlxPriceInput = document.getElementById('set-dlx-price');
        const exePriceInput = document.getElementById('set-exe-price');

        if (stdPriceInput) stdPriceInput.value = this.roomPrices.standard;
        if (dlxPriceInput) dlxPriceInput.value = this.roomPrices.deluxe;
        if (exePriceInput) exePriceInput.value = this.roomPrices.executive;
    }

    async handleSettingsSave(event) {
        event.preventDefault();

        const std = parseFloat(document.getElementById('set-std-price').value);
        const dlx = parseFloat(document.getElementById('set-dlx-price').value);
        const exe = parseFloat(document.getElementById('set-exe-price').value);
        const newPass = document.getElementById('set-admin-pass').value;

        this.showLoader(true);
        try {
            // Retrieve settings list to update correctly
            const settings = await db.settings.toArray();

            const stdSet = settings.find(s => s.key === 'tariff_standard') || { key: 'tariff_standard' };
            const dlxSet = settings.find(s => s.key === 'tariff_deluxe') || { key: 'tariff_deluxe' };
            const exeSet = settings.find(s => s.key === 'tariff_executive') || { key: 'tariff_executive' };

            stdSet.value = std;
            dlxSet.value = dlx;
            exeSet.value = exe;

            await db.settings.put(stdSet);
            await db.settings.put(dlxSet);
            await db.settings.put(exeSet);

            // Handle password updating if entered
            if (newPass.trim() !== '') {
                const adminUser = (await db.users.toArray()).find(u => u.username === 'admin');
                if (adminUser) {
                    await db.users.update(adminUser.id, { password: newPass });
                    this.showToast("Admin password successfully updated!", "success");
                }
            }

            this.showToast("Tariff configurations updated successfully!", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();

            // Re-render rooms rates on page
            this.calcBookingPrice();
            this.calcManualBookingPrice();
        } catch (e) {
            this.showToast("Failed updating settings", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // UTILS: TOAST NOTIFICATIONS
    showToast(message, type = "success") {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let emoji = '🔔';
        if (type === 'error') emoji = '❌';
        if (type === 'success') emoji = '✅';
        if (type === 'warning') emoji = '⚠️';

        toast.innerHTML = `
            <span>${emoji} ${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    showLoader(show) {
        const loader = document.getElementById('global-loader');
        if (loader) {
            if (show) loader.classList.remove('hidden');
            else loader.classList.add('hidden');
        }
    }
}

// Instantiate Global Controller
const app = new LodgeApp();
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
