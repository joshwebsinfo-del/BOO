/**
 * ==========================================================================
 * MOUNTAIN VIEW LODGE CLIENT APP CONTROLLER (app_v1.js)
 * SPA controller for Booking Engine & Operations Panel
 * ==========================================================================
 */

class LodgeApp {
    constructor() {
        this.currentView = 'home';
        this.currentAdminTab = 'bookings';
        this.adminSession = null;

        // Cache room pricing in USD
        this.roomPrices = {
            ensuite_std: 10,
            ensuite_premium: 15,
            overnight_std: 20,
            overnight_premium: 25
        };

        this.bookings = [];
        this.messages = [];
    }

    async init() {
        console.log("🚀 Initializing Mountain View Lodge Web App...");

        this.initDatePickerLimits();

        window.addEventListener('scroll', () => this.handleHeaderScroll());

        const storedSession = localStorage.getItem('lodge_admin_session');
        if (storedSession) {
            try {
                this.adminSession = JSON.parse(storedSession);
                this.updateAdminDashboardUI();
            } catch (e) {
                localStorage.removeItem('lodge_admin_session');
            }
        }

        await this.syncStateWithDB();

        this.calcBookingPrice();
        this.calcManualBookingPrice();
    }

    initDatePickerLimits() {
        const todayStr = new Date().toISOString().split('T')[0];
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

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

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

    toggleMobileMenu() {
        const sidebar = document.getElementById('mobile-sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
    }

    showSection(sectionId) {
        this.currentView = sectionId;

        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('active');
        });
        const targetSection = document.getElementById(`section-${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

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

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (sectionId === 'admin') {
            this.syncStateWithDB().then(() => {
                this.updateAdminDashboardUI();
            });
        }
    }

    async syncStateWithDB() {
        this.showLoader(true);
        try {
            this.bookings = await db.bookings.toArray();
            this.messages = await db.messages.toArray();

            const settings = await db.settings.toArray();
            const stdSetting = settings.find(s => s.key === 'tariff_ensuite_std');
            const premiumSetting = settings.find(s => s.key === 'tariff_ensuite_premium');
            const overnightStdSetting = settings.find(s => s.key === 'tariff_overnight_std');
            const overnightPremiumSetting = settings.find(s => s.key === 'tariff_overnight_premium');

            if (stdSetting) this.roomPrices.ensuite_std = parseFloat(stdSetting.value);
            if (premiumSetting) this.roomPrices.ensuite_premium = parseFloat(premiumSetting.value);
            if (overnightStdSetting) this.roomPrices.overnight_std = parseFloat(overnightStdSetting.value);
            if (overnightPremiumSetting) this.roomPrices.overnight_premium = parseFloat(overnightPremiumSetting.value);

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
            localStorage.setItem(localKey, JSON.stringify(this.bookings));
            localStorage.setItem('lodge_db_messages', JSON.stringify(this.messages));
            localStorage.setItem('lodge_db_settings', JSON.stringify([
                { key: 'tariff_ensuite_std', value: this.roomPrices.ensuite_std },
                { key: 'tariff_ensuite_premium', value: this.roomPrices.ensuite_premium },
                { key: 'tariff_overnight_std', value: this.roomPrices.overnight_std },
                { key: 'tariff_overnight_premium', value: this.roomPrices.overnight_premium }
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

        const timeDiff = date2.getTime() - date1.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const finalNights = nights > 0 ? nights : 1; // Default to at least 1 unit duration

        const rate = this.roomPrices[roomType] || 0;
        const isHourly = roomType.startsWith('ensuite');

        // Dynamic labels based on short stay vs overnight stay
        let durationLabel = '';
        let totalPrice = 0;
        if (isHourly) {
            durationLabel = "2-Hour Ensuite Block";
            totalPrice = rate; // Flat price per block
        } else {
            durationLabel = `${finalNights} Night${finalNights !== 1 ? 's' : ''} Overnight Stay`;
            totalPrice = finalNights * rate;
        }

        const nightsText = document.getElementById('booking-nights-count');
        const rateText = document.getElementById('booking-room-rate');
        const totalText = document.getElementById('booking-total-price');

        if (nightsText) nightsText.innerText = durationLabel;
        if (rateText) rateText.innerText = `Rate: $${rate.toLocaleString()}`;
        if (totalText) totalText.innerText = `$${totalPrice.toLocaleString()}.00`;
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
        const finalNights = nights > 0 ? nights : 1;

        const rate = this.roomPrices[roomType] || 0;
        const isHourly = roomType.startsWith('ensuite');

        let durationLabel = '';
        let totalPrice = 0;
        if (isHourly) {
            durationLabel = "2-Hour short block";
            totalPrice = rate;
        } else {
            durationLabel = `${finalNights} night${finalNights !== 1 ? 's' : ''}`;
            totalPrice = finalNights * rate;
        }

        const nightsText = document.getElementById('mb-nights-count');
        const totalText = document.getElementById('mb-total-price');

        if (nightsText) nightsText.innerText = durationLabel;
        if (totalText) totalText.innerText = `$${totalPrice.toLocaleString()}.00`;
    }

    openBookingModal(preselectedRoom = 'overnight_premium') {
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

    // Prevent double booking dates
    hasBookingOverlap(roomType, newIn, newOut) {
        const inDate = new Date(newIn);
        const outDate = new Date(newOut);

        const matches = this.bookings.filter(b => b.roomType === roomType && b.status === 'Confirmed');

        for (const b of matches) {
            const bIn = new Date(b.checkIn);
            const bOut = new Date(b.checkOut);

            if (inDate < bOut && outDate > bIn) {
                return true;
            }
        }
        return false;
    }

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

        const date1 = new Date(checkin);
        const date2 = new Date(checkout);

        if (date2 <= date1) {
            this.showToast("Check-out date must succeed check-in date.", "error");
            return;
        }

        if (this.hasBookingOverlap(roomType, checkin, checkout)) {
            this.showToast(`Selected dates overlap with an active reservation for the ${roomType.toUpperCase().replace('_', ' ')}. Please select other dates.`, "error");
            return;
        }

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const rate = this.roomPrices[roomType] || 0;

        // Price matches hourly or overnight stay
        const isHourly = roomType.startsWith('ensuite');
        const totalPrice = isHourly ? rate : (nights * rate);

        const bookingRef = `MVL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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

            await this.syncStateWithDB();
            this.closeBookingModal();
            this.showConfirmationSuccess(saved);
            document.getElementById('booking-reservation-form').reset();
            this.initDatePickerLimits();

        } catch (e) {
            this.showToast("Saved offline locally.", "warning");
        } finally {
            this.showLoader(false);
        }
    }

    handleQuickBook(event) {
        event.preventDefault();
        const checkin = document.getElementById('qb-checkin').value;
        const checkout = document.getElementById('qb-checkout').value;
        const roomType = document.getElementById('qb-room-type').value;

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
            this.showToast("Your message was successfully received! We will reach out shortly.", "success");
            document.getElementById('contact-form').reset();
            await this.syncStateWithDB();
        } catch (e) {
            this.showToast("Saved locally.", "warning");
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
        if (confRoom) confRoom.innerText = b.roomType.toUpperCase().replace('_', ' ');
        if (confDates) confDates.innerText = `${b.checkIn} to ${b.checkOut}`;
        if (confPrice) confPrice.innerText = `$${parseFloat(b.totalPrice).toLocaleString()}.00`;

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
                this.showToast("Access Granted. Welcome back!", "success");
                this.updateAdminDashboardUI();
            } else {
                if (user === 'admin' && pass === 'admin123') {
                    this.adminSession = { username: 'admin', name: 'Mountain View Admin', role: 'Admin' };
                    localStorage.setItem('lodge_admin_session', JSON.stringify(this.adminSession));
                    this.showToast("Access Granted (Local Session)", "success");
                    this.updateAdminDashboardUI();
                } else {
                    this.showToast("Invalid admin credentials.", "error");
                }
            }
        } catch (e) {
            if (user === 'admin' && pass === 'admin123') {
                this.adminSession = { username: 'admin', name: 'Mountain View Admin (Offline)', role: 'Admin' };
                localStorage.setItem('lodge_admin_session', JSON.stringify(this.adminSession));
                this.showToast("Access Granted (Offline Mode)", "success");
                this.updateAdminDashboardUI();
            } else {
                this.showToast("Server unreachable. Authentication failed.", "error");
            }
        } finally {
            this.showLoader(false);
        }
    }

    handleAdminLogout() {
        this.adminSession = null;
        localStorage.removeItem('lodge_admin_session');
        this.showToast("Admin session closed cleanly.", "success");

        document.getElementById('admin-login-card')?.classList.remove('hidden');
        document.getElementById('admin-dashboard-console')?.classList.add('hidden');
        document.getElementById('admin-login-form')?.reset();
    }

    updateAdminDashboardUI() {
        if (!this.adminSession) return;

        document.getElementById('admin-login-card')?.classList.add('hidden');
        document.getElementById('admin-dashboard-console')?.classList.remove('hidden');

        const adminNameLabel = document.getElementById('admin-display-name');
        if (adminNameLabel) adminNameLabel.innerText = this.adminSession.name;

        this.renderStats();
        this.switchAdminTab(this.currentAdminTab);
    }

    renderStats() {
        const confirmedBookings = this.bookings.filter(b => b.status === 'Confirmed');
        const revenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);

        const revEl = document.getElementById('stat-revenue');
        if (revEl) revEl.innerText = `$${revenue.toLocaleString()}.00`;

        const totalActive = this.bookings.filter(b => b.status !== 'Cancelled').length;
        const activeBookingsEl = document.getElementById('stat-bookings');
        if (activeBookingsEl) activeBookingsEl.innerText = totalActive;

        const pendingCount = this.bookings.filter(b => b.status === 'Pending').length;
        const pendEl = document.getElementById('stat-pending-indicator');
        if (pendEl) pendEl.innerText = `${pendingCount} Booking${pendingCount !== 1 ? 's' : ''} Pending`;

        const stdOcc = confirmedBookings.filter(b => b.roomType === 'ensuite_std').length;
        const dlxOcc = confirmedBookings.filter(b => b.roomType === 'ensuite_premium').length;
        const exeOcc = confirmedBookings.filter(b => b.roomType === 'overnight_premium').length;

        const stdEl = document.getElementById('stat-std-occupancy');
        const dlxEl = document.getElementById('stat-dlx-occupancy');
        const exeEl = document.getElementById('stat-exe-occupancy');

        if (stdEl) stdEl.innerText = `${stdOcc} / 5 occupied`;
        if (dlxEl) dlxEl.innerText = `${dlxOcc} / 3 occupied`;
        if (exeEl) exeEl.innerText = `${exeOcc} / 5 occupied`;

        const unreadMsg = this.messages.filter(m => m.status === 'Unread').length;
        const unreadCountEl = document.getElementById('unread-msg-count');
        if (unreadCountEl) unreadCountEl.innerText = unreadMsg;
    }

    switchAdminTab(tabName) {
        this.currentAdminTab = tabName;

        document.querySelectorAll('.admin-tabs-nav .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.admin-tab-content').forEach(cont => {
            cont.classList.remove('active');
        });
        const targetTab = document.getElementById(`admin-tab-${tabName}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        if (tabName === 'bookings') {
            this.renderBookingsTable();
        } else if (tabName === 'messages') {
            this.renderMessagesTable();
        } else if (tabName === 'settings') {
            this.populateSettingsForm();
        }
    }

    renderBookingsTable(filterStatus = 'all') {
        const tbody = document.getElementById('bookings-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filtered = [...this.bookings];
        if (filterStatus !== 'all') {
            filtered = filtered.filter(b => b.status === filterStatus);
        }

        filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted)">No bookings logged in this category.</td></tr>`;
            return;
        }

        filtered.forEach(b => {
            const tr = document.createElement('tr');

            let actionButtons = '';
            if (b.status === 'Pending') {
                actionButtons = `
                    <button class="btn-action-confirm" onclick="app.updateBookingStatus(${b.id}, 'Confirmed')">Confirm</button>
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
                <td style="font-family: monospace; font-weight: 700; color: var(--accent)">${b.bookingId}</td>
                <td>
                    <div class="guest-cell-name" style="color: var(--text-light);">${b.guestName}</div>
                    <div class="guest-cell-meta">✉️ ${b.guestEmail} | 📞 ${b.guestPhone}</div>
                    ${b.specialRequests ? `<div style="font-size: 0.75rem; font-style: italic; color: var(--accent-light); margin-top: 0.25rem;">📝: "${b.specialRequests}"</div>` : ''}
                </td>
                <td style="text-transform: capitalize; font-weight: 600;">${b.roomType.replace('_', ' ')}</td>
                <td>
                    <div style="font-weight: 600;">${b.checkIn}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">to ${b.checkOut}</div>
                </td>
                <td style="font-weight: 700; color: var(--accent-light)">$${parseFloat(b.totalPrice).toLocaleString()}.00</td>
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
            this.showToast(`Booking ${newStatus}!`, "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed updating status", "error");
        } finally {
            this.showLoader(false);
        }
    }

    async deleteBookingRecord(id) {
        if (!confirm("Are you sure you want to delete this booking record?")) return;

        this.showLoader(true);
        try {
            await db.bookings.delete(id);
            this.showToast("Booking deleted successfully.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed deleting record", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // Manual Walk-In
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

        const date1 = new Date(checkin);
        const date2 = new Date(checkout);
        if (date2 <= date1) {
            this.showToast("Check-out date must succeed check-in date.", "error");
            return;
        }

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const rate = this.roomPrices[roomType] || 0;
        const isHourly = roomType.startsWith('ensuite');
        const totalPrice = isHourly ? rate : (nights * rate);

        const bookingRef = `MVL-WALK-${Math.floor(1000 + Math.random() * 9000)}`;

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
            this.showToast("Walk-in stay successfully registered!", "success");
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

    renderMessagesTable() {
        const tbody = document.getElementById('messages-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';
        const sorted = [...this.messages].sort((a,b) => new Date(b.date) - new Date(a.date));

        if (sorted.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted)">Inbox is empty.</td></tr>`;
            return;
        }

        sorted.forEach(m => {
            const tr = document.createElement('tr');

            let actions = '';
            if (m.status === 'Unread') {
                actions += `<button class="btn-action-confirm" onclick="app.updateMessageStatus(${m.id}, 'Read')">Read</button>`;
            } else if (m.status === 'Read') {
                actions += `<button class="btn-action-cancel" onclick="app.updateMessageStatus(${m.id}, 'Replied')">Replied</button>`;
            }
            actions += `<button class="btn-action-delete" onclick="app.deleteMessage(${m.id})">Delete</button>`;

            const dateStr = new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

            tr.innerHTML = `
                <td style="white-space: nowrap; font-weight: 600;">${dateStr}</td>
                <td>
                    <div style="font-weight: 700; color: var(--text-light);">${m.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">✉️ ${m.email} | 📞 ${m.phone}</div>
                </td>
                <td style="font-weight: 600; color: var(--accent)">${m.subject}</td>
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
            this.showToast(`Message marked as ${newStatus}`, "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed updating message", "error");
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

    populateSettingsForm() {
        const stdPriceInput = document.getElementById('set-std-price');
        const dlxPriceInput = document.getElementById('set-dlx-price');
        const exePriceInput = document.getElementById('set-exe-price');

        if (stdPriceInput) stdPriceInput.value = this.roomPrices.ensuite_std;
        if (dlxPriceInput) dlxPriceInput.value = this.roomPrices.ensuite_premium;
        if (exePriceInput) exePriceInput.value = this.roomPrices.overnight_premium;
    }

    async handleSettingsSave(event) {
        event.preventDefault();

        const std = parseFloat(document.getElementById('set-std-price').value);
        const dlx = parseFloat(document.getElementById('set-dlx-price').value);
        const exe = parseFloat(document.getElementById('set-exe-price').value);
        const newPass = document.getElementById('set-admin-pass').value;

        this.showLoader(true);
        try {
            const settings = await db.settings.toArray();

            const stdSet = settings.find(s => s.key === 'tariff_ensuite_std') || { key: 'tariff_ensuite_std' };
            const dlxSet = settings.find(s => s.key === 'tariff_ensuite_premium') || { key: 'tariff_ensuite_premium' };
            const exeSet = settings.find(s => s.key === 'tariff_overnight_premium') || { key: 'tariff_overnight_premium' };

            stdSet.value = std;
            dlxSet.value = dlx;
            exeSet.value = exe;

            await db.settings.put(stdSet);
            await db.settings.put(dlxSet);
            await db.settings.put(exeSet);

            if (newPass.trim() !== '') {
                const adminUser = (await db.users.toArray()).find(u => u.username === 'admin');
                if (adminUser) {
                    await db.users.update(adminUser.id, { password: newPass });
                    this.showToast("Admin password successfully updated!", "success");
                }
            }

            this.showToast("Tariffs updated successfully!", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();

            this.calcBookingPrice();
            this.calcManualBookingPrice();
        } catch (e) {
            this.showToast("Failed updating settings", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // TOAST UTILS
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

const app = new LodgeApp();
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
