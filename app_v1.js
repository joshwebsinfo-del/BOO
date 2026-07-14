/**
 * ==========================================================================
 * MOUNTAIN VIEW LODGE CLIENT APP CONTROLLER (app_v1.js)
 * SPA controller for Booking Engine & Operations Panel
 * Fully Sanitized against Stored XSS vectors
 * ==========================================================================
 */

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

class LodgeApp {
    constructor() {
        this.currentView = 'home';
        this.currentAdminTab = 'bookings';
        this.adminSession = null;

        // Dynamic caches loaded from DB
        this.rooms = [];
        this.menuItems = [];
        this.bookings = [];
        this.foodBookings = [];
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

        // Listeners for live price changes
        document.getElementById('book-room-type')?.addEventListener('change', () => this.calcBookingPrice());
        document.getElementById('book-checkin')?.addEventListener('change', () => this.calcBookingPrice());
        document.getElementById('book-checkout')?.addEventListener('change', () => this.calcBookingPrice());

        document.getElementById('mb-room-type')?.addEventListener('change', () => this.calcManualBookingPrice());
        document.getElementById('mb-checkin')?.addEventListener('change', () => this.calcManualBookingPrice());
        document.getElementById('mb-checkout')?.addEventListener('change', () => this.calcManualBookingPrice());
    }

    initDatePickerLimits() {
        const todayStr = new Date().toISOString().split('T')[0];
        const checkinInputs = ['qb-checkin', 'book-checkin', 'mb-checkin', 'food-delivery-date'];
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

        if (document.getElementById('food-delivery-date')) document.getElementById('food-delivery-date').value = checkinDefault;
        if (document.getElementById('food-delivery-time')) document.getElementById('food-delivery-time').value = "12:00";
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
            this.rooms = await db.rooms.toArray();
            this.menuItems = await db.menu_items.toArray();
            this.bookings = await db.bookings.toArray();
            this.foodBookings = await db.food_bookings.toArray();
            this.messages = await db.messages.toArray();

            // Seed localStorage fallbacks if online fetching is empty and we are pure offline fallback
            this.seedLocalMockIfNeeded();

            // Render dynamic items
            this.renderRoomsPage();
            this.renderMenuPage();
            this.populateSelectSelectors();

        } catch (err) {
            console.error('❌ Database sync failed.', err.message);
        } finally {
            this.showLoader(false);
        }
    }

    seedLocalMockIfNeeded() {
        const localKey = 'lodge_db_bookings';
        if (!localStorage.getItem(localKey)) {
            localStorage.setItem(localKey, JSON.stringify(this.bookings));
            localStorage.setItem('lodge_db_rooms', JSON.stringify(this.rooms));
            localStorage.setItem('lodge_db_menu_items', JSON.stringify(this.menuItems));
            localStorage.setItem('lodge_db_food_bookings', JSON.stringify(this.foodBookings));
            localStorage.setItem('lodge_db_messages', JSON.stringify(this.messages));
        }
    }

    populateSelectSelectors() {
        // Rooms selectors
        const bookRoomType = document.getElementById('book-room-type');
        const qbRoomType = document.getElementById('qb-room-type');
        const mbRoomType = document.getElementById('mb-room-type');

        const optionsHtml = this.rooms.map(r => {
            const isHourly = r.type.startsWith('ensuite');
            const suffix = isHourly ? '/2 Hours' : '/night';
            return `<option value="${escapeHtml(r.type)}">${escapeHtml(r.name)} - $${parseFloat(r.price)}${suffix}</option>`;
        }).join('');

        if (bookRoomType) bookRoomType.innerHTML = optionsHtml;
        if (qbRoomType) qbRoomType.innerHTML = optionsHtml;
        if (mbRoomType) mbRoomType.innerHTML = optionsHtml;
    }

    // Dynamic Render of Accommodations
    renderRoomsPage() {
        const container = document.getElementById('rooms-container');
        if (!container) return;

        if (this.rooms.length === 0) {
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted); width:100%;">No accommodations logged.</p>`;
            return;
        }

        container.innerHTML = this.rooms.map(r => {
            const isHourly = r.type.startsWith('ensuite');
            const rateLabel = isHourly ? `$${parseFloat(r.price)} / 2 Hours` : `$${parseFloat(r.price)} / Night`;

            // Supporting custom base64 device uploads or local fallback images
            let imageSrc = r.image || 'assets/room_standard.jpg';

            const amenitiesList = (r.amenities || '').split(',').map(a => `<span>${escapeHtml(a.trim())}</span>`).join('');

            return `
                <div class="room-card">
                    <div class="room-image-placeholder" style="background-image: url('${imageSrc}'); background-size: cover; background-position: center; height: 260px; position:relative;">
                        <span class="room-badge">${rateLabel}</span>
                    </div>
                    <div class="room-details-content">
                        <h3>${escapeHtml(r.name)}</h3>
                        <p class="room-desc">${escapeHtml(r.description || '')}</p>
                        <div class="room-amenity-badges">
                            ${amenitiesList}
                        </div>
                        <div class="room-footer-row">
                            <span class="room-capacity">👥 Max Guests: ${r.capacity || 2}</span>
                            <button class="btn-book-now" onclick="app.openBookingModal('${escapeHtml(r.type)}')">Reserve Option</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Dynamic Render of Food Menu Items
    renderMenuPage() {
        const container = document.getElementById('menu-items-container');
        if (!container) return;

        if (this.menuItems.length === 0) {
            container.innerHTML = `<p style="text-align:center; color: var(--text-muted); width:100%;">Delicious home-style food is cooking. Check back soon!</p>`;
            return;
        }

        container.innerHTML = this.menuItems.map(m => {
            let imageSrc = m.image || 'assets/food_combo.jpg';

            return `
                <div class="highlight-card" style="display: flex; gap: 1.5rem; text-align: left; align-items: center; border: 1px solid var(--accent-dark); background-color: var(--primary-dark); padding:1rem; border-radius:8px;">
                    <div style="background-image: url('${imageSrc}'); background-size: cover; background-position: center; width: 100px; height: 100px; border-radius: 8px; flex-shrink: 0; border: 1px solid var(--accent-dark);"></div>
                    <div>
                        <h4 style="color: var(--accent); font-family:var(--font-heading); margin:0 0 0.25rem 0; font-size:1.1rem;">${escapeHtml(m.name)}</h4>
                        <p style="margin:0 0 0.5rem 0; font-size:0.85rem; color:var(--text-light); opacity:0.85;">${escapeHtml(m.description || '')}</p>
                        <div style="font-size:1.15rem; font-weight:700; color:var(--accent-light);">$${parseFloat(m.price).toFixed(2)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // DYNAMIC STAY PRICING ENGINE
    calcBookingPrice() {
        const checkinVal = document.getElementById('book-checkin')?.value;
        const checkoutVal = document.getElementById('book-checkout')?.value;
        const roomType = document.getElementById('book-room-type')?.value;

        if (!checkinVal || !checkoutVal || !roomType) return;

        const date1 = new Date(checkinVal);
        const date2 = new Date(checkoutVal);

        const timeDiff = date2.getTime() - date1.getTime();
        const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
        const finalNights = nights > 0 ? nights : 1;

        const r = this.rooms.find(room => room.type === roomType);
        if (!r) return;

        const rate = parseFloat(r.price) || 0;
        const isHourly = roomType.startsWith('ensuite');

        let durationLabel = '';
        let totalPrice = 0;
        if (isHourly) {
            durationLabel = "2-Hour Ensuite Block";
            totalPrice = rate;
        } else {
            durationLabel = `${finalNights} Night${finalNights !== 1 ? 's' : ''} Overnight Stay`;
            totalPrice = finalNights * rate;
        }

        const nightsText = document.getElementById('booking-nights-count');
        const rateText = document.getElementById('booking-room-rate');
        const totalText = document.getElementById('booking-total-price');

        if (nightsText) nightsText.innerText = durationLabel;
        if (rateText) rateText.innerText = `Rate: $${rate.toFixed(2)}`;
        if (totalText) totalText.innerText = `$${totalPrice.toFixed(2)}`;
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

        const r = this.rooms.find(room => room.type === roomType);
        if (!r) return;

        const rate = parseFloat(r.price) || 0;
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
        if (totalText) totalText.innerText = `$${totalPrice.toFixed(2)}`;
    }

    openBookingModal(preselectedRoom = '') {
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

    // FOOD BOOKING INTERFACE
    openFoodBookingModal() {
        const modal = document.getElementById('food-booking-modal');
        if (!modal) return;

        const container = document.getElementById('food-booking-items-list');
        if (container) {
            if (this.menuItems.length === 0) {
                container.innerHTML = `<p style="color:var(--text-muted); text-align:center;">No food items registered in the database yet.</p>`;
            } else {
                container.innerHTML = this.menuItems.map(m => `
                    <div style="display:flex; justify-content:space-between; align-items:center; background-color:var(--primary-dark); border:1px solid var(--accent-dark); padding:0.75rem 1rem; border-radius:6px;">
                        <div>
                            <strong style="color:var(--accent);">${escapeHtml(m.name)}</strong>
                            <div style="font-size:0.8rem; color:var(--accent-light); font-weight:700;">$${parseFloat(m.price).toFixed(2)}</div>
                        </div>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <button type="button" onclick="app.adjustFoodQty(${m.id}, -1)" style="background:var(--accent-dark); color:var(--text-light); border:none; width:30px; height:30px; border-radius:4px; font-weight:700; cursor:pointer;">-</button>
                            <input type="number" id="food-qty-${m.id}" value="0" min="0" readonly style="width:50px; text-align:center; background:none; border:none; color:var(--text-light); font-size:1rem; font-weight:700;">
                            <button type="button" onclick="app.adjustFoodQty(${m.id}, 1)" style="background:var(--accent); color:var(--primary-dark); border:none; width:30px; height:30px; border-radius:4px; font-weight:700; cursor:pointer;">+</button>
                        </div>
                    </div>
                `).join('');
            }
        }

        modal.classList.remove('hidden');
        this.calcFoodBookingPrice();
    }

    closeFoodBookingModal() {
        const modal = document.getElementById('food-booking-modal');
        if (modal) modal.classList.add('hidden');
    }

    adjustFoodQty(id, delta) {
        const input = document.getElementById(`food-qty-${id}`);
        if (!input) return;
        let val = parseInt(input.value) + delta;
        if (val < 0) val = 0;
        input.value = val;
        this.calcFoodBookingPrice();
    }

    calcFoodBookingPrice() {
        let total = 0;
        this.menuItems.forEach(m => {
            const qtyInput = document.getElementById(`food-qty-${m.id}`);
            const qty = qtyInput ? parseInt(qtyInput.value) : 0;
            total += qty * parseFloat(m.price);
        });

        const totalLabel = document.getElementById('food-booking-total-price');
        if (totalLabel) totalLabel.innerText = `$${total.toFixed(2)}`;
    }

    // Direct overlapping filter checks
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

    // WHATSAPP RESERVATION LAUNCHER
    launchWhatsAppRedirect(phone, text) {
        const encodedText = encodeURIComponent(text);
        const cleanedNumber = phone.replace(/\D/g, ''); // standard digits only
        // Zimbabwe international prefix formatting support
        const targetHost = cleanedNumber.startsWith('0') ? `263${cleanedNumber.substring(1)}` : cleanedNumber;
        const link = `https://wa.me/${targetHost}?text=${encodedText}`;

        const win = window.open(link, '_blank');
        if (!win) {
            window.location.href = link;
        }
    }

    // SUBMIT ACTIONS WITH WHATSAPP REDIRECTIONS
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

        const r = this.rooms.find(room => room.type === roomType);
        if (!r) return;

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const rate = parseFloat(r.price) || 0;

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

            // Direct WhatsApp format string Construction
            const durationText = isHourly ? "2-Hour Short Stay Block" : `${nights} Night Stay`;
            const waText = `🌅 *MOUNTAIN VIEW LODGE — STAY RESERVATION* 🌅\n\n` +
                           `Hello Host! I would like to lock in a stay at Mountain View Lodge.\n\n` +
                           `*Stay Option:* ${r.name}\n` +
                           `*Ref Code:* ${bookingRef}\n` +
                           `*Guest Name:* ${name}\n` +
                           `*Phone:* ${phone}\n` +
                           `*Check-In:* ${checkin}\n` +
                           `*Check-Out:* ${checkout}\n` +
                           `*Duration:* ${durationText}\n` +
                           `*Guests:* ${guests}\n` +
                           `*Total Cost:* $${totalPrice.toFixed(2)} USD\n` +
                           `*Special Requests:* "${requests || 'None'}"\n\n` +
                           `📍 *Location:* 13 KM PEG(9MILES) MUTARE, ZIMUNYA RD\n\n` +
                           `Please confirm this pending reservation! Thank you.`;

            // Display dynamic success confirmation modal
            const modal = document.getElementById('confirmation-modal');
            document.getElementById('confirmation-title').innerText = "Stay Reservation Successful!";
            document.getElementById('conf-id').innerText = bookingRef;
            document.getElementById('conf-name').innerText = name;
            document.getElementById('conf-room').innerText = r.name;
            document.getElementById('conf-dates').innerText = `${checkin} to ${checkout} (${durationText})`;
            document.getElementById('conf-price').innerText = `$${totalPrice.toFixed(2)}`;

            const waBtn = document.getElementById('btn-whatsapp-confirm');
            waBtn.onclick = () => this.launchWhatsAppRedirect('0786110672', waText);

            if (modal) modal.classList.remove('hidden');

            document.getElementById('booking-reservation-form').reset();
            this.initDatePickerLimits();

            // Auto redirect chat trigger
            this.launchWhatsAppRedirect('0786110672', waText);

        } catch (e) {
            this.showToast("Saved offline locally.", "warning");
        } finally {
            this.showLoader(false);
        }
    }

    async handleFoodBookingSubmit(event) {
        event.preventDefault();

        const date = document.getElementById('food-delivery-date').value;
        const time = document.getElementById('food-delivery-time').value;
        const name = document.getElementById('food-guest-name').value;
        const phone = document.getElementById('food-guest-phone').value;
        const email = document.getElementById('food-guest-email').value;

        // Extract selected food items
        const selectedItems = [];
        let total = 0;

        this.menuItems.forEach(m => {
            const qtyInput = document.getElementById(`food-qty-${m.id}`);
            const qty = qtyInput ? parseInt(qtyInput.value) : 0;
            if (qty > 0) {
                selectedItems.push({
                    name: m.name,
                    price: parseFloat(m.price),
                    qty: qty
                });
                total += qty * parseFloat(m.price);
            }
        });

        if (selectedItems.length === 0) {
            this.showToast("Please select at least 1 menu item or combo quantity.", "error");
            return;
        }

        const foodRef = `MVL-FOOD-${Math.floor(1000 + Math.random() * 9000)}`;

        const data = {
            bookingId: foodRef,
            guestName: name,
            guestPhone: phone,
            guestEmail: email,
            items: JSON.stringify(selectedItems),
            totalPrice: total,
            deliveryDate: date,
            deliveryTime: time,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        this.showLoader(true);
        try {
            const saved = await db.food_bookings.add(data);
            await this.syncStateWithDB();
            this.closeFoodBookingModal();

            // Craft beautiful multi-item list representation for WhatsApp
            const itemsSummary = selectedItems.map(i => `• ${i.qty}x ${i.name} ($${(i.qty * i.price).toFixed(2)})`).join('\n');

            const waText = `🍔 *MOUNTAIN VIEW LODGE — FOOD & COMBO BOOKING* 🍔\n\n` +
                           `Hello Host! I would like to place a food and beverage order.\n\n` +
                           `*Order Ref:* ${foodRef}\n` +
                           `*Guest Name:* ${name}\n` +
                           `*Phone:* ${phone}\n` +
                           `*Service Date:* ${date} at ${time}\n\n` +
                           `*Booked Items:*\n${itemsSummary}\n\n` +
                           `*Total Cost:* $${total.toFixed(2)} USD\n\n` +
                           `📍 *Location:* 13 KM PEG(9MILES) MUTARE, ZIMUNYA RD\n\n` +
                           `Please register and confirm this order. Thank you!`;

            // Display success modal
            const modal = document.getElementById('confirmation-modal');
            document.getElementById('confirmation-title').innerText = "Food Order Submitted Successfully!";
            document.getElementById('conf-id').innerText = foodRef;
            document.getElementById('conf-name').innerText = name;
            document.getElementById('conf-room').innerText = `${selectedItems.length} menu items selected`;
            document.getElementById('conf-dates').innerText = `${date} at ${time}`;
            document.getElementById('conf-price').innerText = `$${total.toFixed(2)}`;

            const waBtn = document.getElementById('btn-whatsapp-confirm');
            waBtn.onclick = () => this.launchWhatsAppRedirect('0786110672', waText);

            if (modal) modal.classList.remove('hidden');

            document.getElementById('food-booking-form').reset();
            this.initDatePickerLimits();

            this.launchWhatsAppRedirect('0786110672', waText);

        } catch (e) {
            this.showToast("Saved order locally.", "warning");
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

            const waText = `✉️ *MOUNTAIN VIEW LODGE — CONTACT INQUIRY* ✉️\n\n` +
                           `Hello Host! I have sent an inquiry from the website.\n\n` +
                           `*Guest Name:* ${name}\n` +
                           `*Email:* ${email}\n` +
                           `*Phone:* ${phone}\n` +
                           `*Subject:* ${subject}\n` +
                           `*Message:* "${message}"\n\n` +
                           `📍 *Location:* 13 KM PEG(9MILES) MUTARE, ZIMUNYA RD`;

            this.showToast("Your inquiry message was received and registered!", "success");
            document.getElementById('contact-form').reset();
            await this.syncStateWithDB();

            this.launchWhatsAppRedirect('0786110672', waText);
        } catch (e) {
            this.showToast("Saved locally.", "warning");
        } finally {
            this.showLoader(false);
        }
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
        const confirmedFood = this.foodBookings.filter(f => f.status === 'Confirmed');

        const roomRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.totalPrice), 0);
        const foodRevenue = confirmedFood.reduce((sum, f) => sum + parseFloat(f.totalPrice), 0);

        const revEl = document.getElementById('stat-revenue');
        if (revEl) revEl.innerText = `$${(roomRevenue + foodRevenue).toFixed(2)}`;

        const totalActive = this.bookings.filter(b => b.status !== 'Cancelled').length;
        const activeBookingsEl = document.getElementById('stat-bookings');
        if (activeBookingsEl) activeBookingsEl.innerText = totalActive;

        const pendingCount = this.bookings.filter(b => b.status === 'Pending').length;
        const pendEl = document.getElementById('stat-pending-indicator');
        if (pendEl) pendEl.innerText = `${pendingCount} Booking${pendingCount !== 1 ? 's' : ''} Pending`;

        const activeFoodEl = document.getElementById('stat-food-count');
        if (activeFoodEl) activeFoodEl.innerText = this.foodBookings.filter(f => f.status !== 'Cancelled').length;

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
        } else if (tabName === 'food_bookings') {
            this.renderFoodBookingsTable();
        } else if (tabName === 'menu_manager') {
            this.renderMenuManagerList();
        } else if (tabName === 'room_manager') {
            this.renderRoomManagerList();
        } else if (tabName === 'messages') {
            this.renderMessagesTable();
        } else if (tabName === 'settings') {
            // Settings page placeholder
        }
    }

    // LIST CUSTOMERS ROOM BOOKINGS TABLE
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
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted)">No room bookings logged.</td></tr>`;
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

            const rObj = this.rooms.find(room => room.type === b.roomType) || { name: b.roomType };

            tr.innerHTML = `
                <td style="font-family: monospace; font-weight: 700; color: var(--accent)">${escapeHtml(b.bookingId)}</td>
                <td>
                    <div class="guest-cell-name" style="color: var(--text-light);">${escapeHtml(b.guestName)}</div>
                    <div class="guest-cell-meta">✉️ ${escapeHtml(b.guestEmail)} | 📞 ${escapeHtml(b.guestPhone)}</div>
                    ${b.specialRequests ? `<div style="font-size: 0.75rem; font-style: italic; color: var(--accent-light); margin-top: 0.25rem;">📝: "${escapeHtml(b.specialRequests)}"</div>` : ''}
                </td>
                <td style="text-transform: capitalize; font-weight: 600;">${escapeHtml(rObj.name)}</td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(b.checkIn)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">to ${escapeHtml(b.checkOut)}</div>
                </td>
                <td style="font-weight: 700; color: var(--accent-light)">$${parseFloat(b.totalPrice).toFixed(2)}</td>
                <td><span class="status-badge ${b.status.toLowerCase()}">${escapeHtml(b.status)}</span></td>
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

    // FOOD BOOKINGS CATALOGUE
    renderFoodBookingsTable(filterStatus = 'all') {
        const tbody = document.getElementById('food-bookings-table-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        let filtered = [...this.foodBookings];
        if (filterStatus !== 'all') {
            filtered = filtered.filter(f => f.status === filterStatus);
        }

        filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted)">No food bookings logged.</td></tr>`;
            return;
        }

        filtered.forEach(f => {
            const tr = document.createElement('tr');

            let actionButtons = '';
            if (f.status === 'Pending') {
                actionButtons = `
                    <button class="btn-action-confirm" onclick="app.updateFoodBookingStatus(${f.id}, 'Confirmed')">Confirm</button>
                    <button class="btn-action-cancel" onclick="app.updateFoodBookingStatus(${f.id}, 'Cancelled')">Cancel</button>
                `;
            } else if (f.status === 'Confirmed') {
                actionButtons = `
                    <button class="btn-action-cancel" onclick="app.updateFoodBookingStatus(${f.id}, 'Cancelled')">Cancel</button>
                `;
            } else if (f.status === 'Cancelled') {
                actionButtons = `
                    <button class="btn-action-confirm" onclick="app.updateFoodBookingStatus(${f.id}, 'Confirmed')">Reinstate</button>
                `;
            }
            actionButtons += `<button class="btn-action-delete" onclick="app.deleteFoodBookingRecord(${f.id})">Delete</button>`;

            let parsedItems = [];
            try {
                parsedItems = typeof f.items === 'string' ? JSON.parse(f.items) : f.items;
            } catch(err) {
                parsedItems = [];
            }

            const itemsText = parsedItems.map(i => `• ${escapeHtml(i.qty)}x ${escapeHtml(i.name)}`).join('<br>');

            tr.innerHTML = `
                <td style="font-family:monospace; font-weight:700; color:var(--accent)">${escapeHtml(f.bookingId)}</td>
                <td>
                    <div style="font-weight:700; color:var(--text-light);">${escapeHtml(f.guestName)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">📞 ${escapeHtml(f.guestPhone)} | ✉️ ${escapeHtml(f.guestEmail || 'None')}</div>
                </td>
                <td style="font-size:0.85rem; line-height:1.2;">${itemsText}</td>
                <td>
                    <div style="font-weight:600;">${escapeHtml(f.deliveryDate)}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted)">at ${escapeHtml(f.deliveryTime)}</div>
                </td>
                <td style="font-weight:700; color:var(--accent-light)">$${parseFloat(f.totalPrice).toFixed(2)}</td>
                <td><span class="status-badge ${f.status.toLowerCase()}">${escapeHtml(f.status)}</span></td>
                <td><div style="display:flex; gap:0.2rem;">${actionButtons}</div></td>
            `;

            tbody.appendChild(tr);
        });
    }

    filterFoodBookings(status) {
        this.renderFoodBookingsTable(status);
    }

    async updateFoodBookingStatus(id, newStatus) {
        this.showLoader(true);
        try {
            await db.food_bookings.update(id, { status: newStatus });
            this.showToast(`Order marked ${newStatus}!`, "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed updating food order status", "error");
        } finally {
            this.showLoader(false);
        }
    }

    async deleteFoodBookingRecord(id) {
        if (!confirm("Are you sure you want to delete this food order permanently?")) return;
        this.showLoader(true);
        try {
            await db.food_bookings.delete(id);
            this.showToast("Order deleted.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch (e) {
            this.showToast("Failed deleting order", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // MANAGE FOOD ITEMS ENGINE
    renderMenuManagerList() {
        const tbody = document.getElementById('admin-menu-list-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.menuItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted)">No items in the menu catalog.</td></tr>`;
            return;
        }

        this.menuItems.forEach(m => {
            const tr = document.createElement('tr');
            let imageSrc = m.image || 'assets/food_combo.jpg';

            tr.innerHTML = `
                <td><img src="${imageSrc}" style="width:50px; height:50px; object-fit:cover; border-radius:4px; border:1px solid var(--accent-dark);"></td>
                <td>
                    <strong style="color:var(--text-light);">${escapeHtml(m.name)}</strong>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${escapeHtml(m.description || '')}</div>
                </td>
                <td style="color:var(--accent-light); font-weight:700;">$${parseFloat(m.price).toFixed(2)}</td>
                <td><button class="btn-action-delete" onclick="app.deleteMenuItem(${m.id})">Delete</button></td>
            `;

            tbody.appendChild(tr);
        });
    }

    async handleAddMenuItem(event) {
        event.preventDefault();

        const name = document.getElementById('menu-name').value;
        const desc = document.getElementById('menu-description').value;
        const price = parseFloat(document.getElementById('menu-price').value);
        const imageFile = document.getElementById('menu-image').files[0];

        const saveItem = async (base64Image = '') => {
            const data = {
                name: name,
                description: desc,
                price: price,
                image: base64Image
            };

            this.showLoader(true);
            try {
                await db.menu_items.add(data);
                this.showToast("Menu Item added successfully!", "success");
                document.getElementById('admin-add-menu-form').reset();
                await this.syncStateWithDB();
                this.updateAdminDashboardUI();
            } catch(e) {
                this.showToast("Failed adding menu item", "error");
            } finally {
                this.showLoader(false);
            }
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                saveItem(reader.result);
            };
            reader.readAsDataURL(imageFile);
        } else {
            saveItem();
        }
    }

    async deleteMenuItem(id) {
        if (!confirm("Remove this item from the active menu?")) return;
        this.showLoader(true);
        try {
            await db.menu_items.delete(id);
            this.showToast("Menu Item removed.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch(e) {
            this.showToast("Failed deleting item", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // MANAGE ROOMS ENGINE
    renderRoomManagerList() {
        const tbody = document.getElementById('admin-room-list-body');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (this.rooms.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:1.5rem; color:var(--text-muted)">No rooms logged in the catalog.</td></tr>`;
            return;
        }

        this.rooms.forEach(r => {
            const tr = document.createElement('tr');
            let imageSrc = r.image || 'assets/room_standard.jpg';

            tr.innerHTML = `
                <td><img src="${imageSrc}" style="width:60px; height:45px; object-fit:cover; border-radius:4px; border:1px solid var(--accent-dark);"></td>
                <td>
                    <strong style="color:var(--text-light);">${escapeHtml(r.name)}</strong> <span style="font-size:0.75rem; color:var(--accent); font-family:monospace;">(${escapeHtml(r.type)})</span>
                    <div style="font-size:0.75rem; color:var(--text-muted)">${escapeHtml(r.description || '')}</div>
                </td>
                <td style="color:var(--accent-light); font-weight:700;">$${parseFloat(r.price).toFixed(2)}</td>
                <td><button class="btn-action-delete" onclick="app.deleteRoomOption(${r.id})">Delete</button></td>
            `;

            tbody.appendChild(tr);
        });
    }

    async handleAddRoom(event) {
        event.preventDefault();

        const type = document.getElementById('room-type-id').value.trim();
        const name = document.getElementById('room-name').value;
        const price = parseFloat(document.getElementById('room-price').value);
        const capacity = parseInt(document.getElementById('room-capacity').value);
        const desc = document.getElementById('room-description').value;
        const amenities = document.getElementById('room-amenities').value;
        const imageFile = document.getElementById('room-image-upload').files[0];

        // Unique validation check
        if (this.rooms.some(r => r.type === type)) {
            this.showToast("A room with this ID/Slug already exists.", "error");
            return;
        }

        const saveRoom = async (base64Image = '') => {
            const data = {
                type: type,
                name: name,
                price: price,
                capacity: capacity,
                totalRooms: 5,
                description: desc,
                amenities: amenities,
                image: base64Image
            };

            this.showLoader(true);
            try {
                await db.rooms.add(data);
                this.showToast("Custom Accommodation Room added successfully!", "success");
                document.getElementById('admin-add-room-form').reset();
                await this.syncStateWithDB();
                this.updateAdminDashboardUI();
            } catch(e) {
                this.showToast("Failed adding custom room", "error");
            } finally {
                this.showLoader(false);
            }
        };

        if (imageFile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                saveRoom(reader.result);
            };
            reader.readAsDataURL(imageFile);
        } else {
            saveRoom();
        }
    }

    async deleteRoomOption(id) {
        if (!confirm("Permanently delete this accommodation option?")) return;
        this.showLoader(true);
        try {
            await db.rooms.delete(id);
            this.showToast("Lodge Room option removed successfully.", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
        } catch(e) {
            this.showToast("Failed removing room", "error");
        } finally {
            this.showLoader(false);
        }
    }

    // Manual Walk-In Injector
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

        const r = this.rooms.find(room => room.type === roomType);
        if (!r) return;

        const nights = Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 3600 * 24));
        const rate = parseFloat(r.price) || 0;
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
                <td style="white-space: nowrap; font-weight: 600;">${escapeHtml(dateStr)}</td>
                <td>
                    <div style="font-weight: 700; color: var(--text-light);">${escapeHtml(m.name)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">✉️ ${escapeHtml(m.email)} | 📞 ${escapeHtml(m.phone)}</div>
                </td>
                <td style="font-weight: 600; color: var(--accent)">${escapeHtml(m.subject)}</td>
                <td style="font-size: 0.8rem; max-width: 300px; word-wrap: break-word;">"${escapeHtml(m.message)}"</td>
                <td><span class="status-badge ${m.status === 'Unread' ? 'pending' : (m.status === 'Read' ? 'confirmed' : 'cancelled')}" style="padding: 0.2rem 0.4rem; font-size: 0.65rem;">${escapeHtml(m.status)}</span></td>
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

    async handleSettingsSave(event) {
        event.preventDefault();

        const newPass = document.getElementById('set-admin-pass').value;

        this.showLoader(true);
        try {
            if (newPass.trim() !== '') {
                const adminUser = (await db.users.toArray()).find(u => u.username === 'admin');
                if (adminUser) {
                    await db.users.update(adminUser.id, { password: newPass });
                    this.showToast("Admin password successfully updated!", "success");
                }
            }

            this.showToast("Credentials updated successfully!", "success");
            await this.syncStateWithDB();
            this.updateAdminDashboardUI();
            document.getElementById('admin-settings-form').reset();
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
            <span>${emoji} ${escapeHtml(message)}</span>
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
