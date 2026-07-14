const API_URL = '/api';

class QueryBuilder {
    constructor(tableName, key = null) {
        this.tableName = tableName;
        this.conditions = {};
        this.currentKey = key;
        this.isReverse = false;
        this.limitCount = null;
        this.filterFunc = null;
    }

    equals(value) {
        if (this.currentKey) {
            this.conditions[this.currentKey] = value;
            this.currentKey = null;
        }
        return this;
    }

    and(condition) {
        if (typeof condition === 'function') {
            this.filterFunc = condition;
        } else {
            Object.assign(this.conditions, condition);
        }
        return this;
    }

    reverse() {
        this.isReverse = true;
        return this;
    }

    limit(n) {
        this.limitCount = n;
        return this;
    }

    async toArray() {
        // Fallback to localStorage if API fails or is pure static Page
        try {
            const params = { ...this.conditions };
            if (this.isReverse) {
                params._sort = 'id';
                params._order = 'desc';
            }
            if (this.limitCount) {
                params._limit = this.limitCount;
            }

            const queryStr = new URLSearchParams(params).toString();
            const res = await fetch(`${API_URL}/${this.tableName}?${queryStr}`);
            if (!res.ok) throw new Error('API server unreachable');
            let data = await res.json();

            if (this.filterFunc) {
                data = data.filter(this.filterFunc);
            }

            if (db[this.tableName] && db[this.tableName].normalize) {
                data = data.map(item => db[this.tableName].normalize(item));
            }

            return data;
        } catch (err) {
            console.warn(`⚠️ db.js query fallback for [${this.tableName}] using localStorage:`, err.message);
            return this.toArrayLocal();
        }
    }

    toArrayLocal() {
        const localKey = `lodge_db_${this.tableName}`;
        let data = JSON.parse(localStorage.getItem(localKey) || '[]');

        // Filter by conditions
        for (const [k, val] of Object.entries(this.conditions)) {
            data = data.filter(item => item[k] == val);
        }

        if (this.filterFunc) {
            data = data.filter(this.filterFunc);
        }

        if (this.isReverse) {
            data.reverse();
        }

        if (this.limitCount) {
            data = data.slice(0, this.limitCount);
        }

        return data;
    }

    async first() {
        this.limitCount = 1;
        const results = await this.toArray();
        return results.length > 0 ? results[0] : undefined;
    }

    async count() {
        const results = await this.toArray();
        return results.length;
    }

    async modify(changes) {
        const results = await this.toArray();
        for (const item of results) {
            await db[this.tableName].update(item.id, changes);
        }
        return { updated: results.length };
    }

    async delete() {
        const results = await this.toArray();
        for (const item of results) {
            await db[this.tableName].delete(item.id);
        }
        return { deleted: results.length };
    }
}

class TableProxy {
    constructor(tableName) {
        this.tableName = tableName;
        this.cache = null;
        this.lastFetch = 0;
        this.CACHE_TTL = 3000; // 3 seconds cache
    }

    clearCache() {
        this.cache = null;
        this.lastFetch = 0;
    }

    where(key) {
        return new QueryBuilder(this.tableName, key);
    }

    async toArray() {
        const now = Date.now();
        if (this.cache && (now - this.lastFetch < this.CACHE_TTL)) {
            return this.cache;
        }

        const results = await new QueryBuilder(this.tableName).toArray();
        this.cache = results.map(row => this.normalize(row));
        this.lastFetch = now;
        return this.cache;
    }

    normalize(row) {
        if (!row) return row;
        
        // Scrub corruption where literal "undefined" strings might exist
        for (let key in row) {
            if (row[key] === "undefined" || row[key] === "null") {
                row[key] = null;
            }
        }
        
        // Handle lower-case column mapping from Postgres
        if (row.bookingid !== undefined && row.bookingId === undefined) row.bookingId = row.bookingid;
        if (row.guestname !== undefined && row.guestName === undefined) row.guestName = row.guestname;
        if (row.guestemail !== undefined && row.guestEmail === undefined) row.guestEmail = row.guestemail;
        if (row.guestphone !== undefined && row.guestPhone === undefined) row.guestPhone = row.guestphone;
        if (row.roomtype !== undefined && row.roomType === undefined) row.roomType = row.roomtype;
        if (row.checkin !== undefined && row.checkIn === undefined) row.checkIn = row.checkin;
        if (row.checkout !== undefined && row.checkOut === undefined) row.checkOut = row.checkout;
        if (row.totalprice !== undefined && row.totalPrice === undefined) row.totalPrice = row.totalprice;
        if (row.specialrequests !== undefined && row.specialRequests === undefined) row.specialRequests = row.specialrequests;
        if (row.createdat !== undefined && row.createdAt === undefined) row.createdAt = row.createdat;
        if (row.totalrooms !== undefined && row.totalRooms === undefined) row.totalRooms = row.totalrooms;

        return row;
    }

    async get(id) {
        try {
            if (this.cache) {
                const found = this.cache.find(item => item.id == id);
                if (found) return found;
            }

            const res = await fetch(`${API_URL}/${this.tableName}/${id}`);
            if (!res.ok) throw new Error('API unreachable');
            const row = await res.json();
            return this.normalize(row);
        } catch (err) {
            const list = JSON.parse(localStorage.getItem(`lodge_db_${this.tableName}`) || '[]');
            const found = list.find(item => item.id == id);
            return found ? this.normalize(found) : undefined;
        }
    }

    async add(data) {
        this.clearCache();
        try {
            const res = await fetch(`${API_URL}/${this.tableName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('API write failed');
            const row = await res.json();

            // Sync to local storage
            this.syncLocalAdd(this.normalize(row));
            return this.normalize(row);
        } catch (err) {
            // Local fallback
            const localKey = `lodge_db_${this.tableName}`;
            const list = JSON.parse(localStorage.getItem(localKey) || '[]');
            const newItem = { id: list.length > 0 ? Math.max(...list.map(i => i.id)) + 1 : 1, ...data };
            list.push(newItem);
            localStorage.setItem(localKey, JSON.stringify(list));
            return this.normalize(newItem);
        }
    }

    syncLocalAdd(row) {
        const localKey = `lodge_db_${this.tableName}`;
        const list = JSON.parse(localStorage.getItem(localKey) || '[]');
        if (!list.some(item => item.id == row.id)) {
            list.push(row);
            localStorage.setItem(localKey, JSON.stringify(list));
        }
    }

    async put(data) {
        this.clearCache();
        if (!data.id) return this.add(data);

        try {
            const res = await fetch(`${API_URL}/${this.tableName}/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('API write failed');
            const row = await res.json();

            // Sync to local storage
            this.syncLocalPut(this.normalize(row));
            return this.normalize(row);
        } catch (err) {
            // Local fallback
            const localKey = `lodge_db_${this.tableName}`;
            let list = JSON.parse(localStorage.getItem(localKey) || '[]');
            const idx = list.findIndex(item => item.id == data.id);
            if (idx !== -1) {
                list[idx] = data;
            } else {
                list.push(data);
            }
            localStorage.setItem(localKey, JSON.stringify(list));
            return this.normalize(data);
        }
    }

    syncLocalPut(row) {
        const localKey = `lodge_db_${this.tableName}`;
        let list = JSON.parse(localStorage.getItem(localKey) || '[]');
        const idx = list.findIndex(item => item.id == row.id);
        if (idx !== -1) {
            list[idx] = row;
        } else {
            list.push(row);
        }
        localStorage.setItem(localKey, JSON.stringify(list));
    }

    async update(id, changes) {
        const item = await this.get(id);
        if (!item) return;
        return await this.put({ ...item, ...changes });
    }

    async delete(id) {
        this.clearCache();
        try {
            const res = await fetch(`${API_URL}/${this.tableName}/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('API delete failed');
        } catch (err) {
            console.warn(`⚠️ Failed deleting item id ${id} from server, applying local only.`, err.message);
        }

        // Always delete local
        const localKey = `lodge_db_${this.tableName}`;
        let list = JSON.parse(localStorage.getItem(localKey) || '[]');
        list = list.filter(item => item.id != id);
        localStorage.setItem(localKey, JSON.stringify(list));
    }

    async count() {
        const results = await this.toArray();
        return results.length;
    }

    reverse() {
        return new QueryBuilder(this.tableName).reverse();
    }
}

const db = {
    bookings: new TableProxy('bookings'),
    rooms: new TableProxy('rooms'),
    messages: new TableProxy('messages'),
    notifications: new TableProxy('notifications'),
    users: new TableProxy('users'),
    settings: new TableProxy('settings')
};

console.log("Mountain View Lodge DB adapter initialized with local localStorage fallback support");
