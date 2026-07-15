const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'zimhub_ultimate_secret_key_123';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist'))); // Serve frontend built files

// --- AUTHENTICATION MIDDLEWARE ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access token required' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
}

// Check role middleware
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized role access' });
        }
        next();
    };
}

// --- SEED FUNCTION ---
async function seedDatabase() {
    try {
        // If the user with requested credentials already exists, we skip!
        const adminCheck = await prisma.user.findFirst({ where: { email: 'joshuamujakari15@gmail.com' } });
        if (adminCheck) {
            console.log('Database already has joshuamujakari15@gmail.com admin user. Skipping seed.');
            return;
        }

        console.log('🌱 Reseeding database to write requested Admin credentials...');
        // Clear all tables to allow clean reseed
        await prisma.message.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.notification.deleteMany({});
        await prisma.booking.deleteMany({});
        await prisma.room.deleteMany({});
        await prisma.lodge.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.jobApplication.deleteMany({});
        await prisma.job.deleteMany({});
        await prisma.property.deleteMany({});
        await prisma.business.deleteMany({});
        await prisma.user.deleteMany({});

        const hashedAdminPassword = await bcrypt.hash('joshua#$#$', 10);
        const hashedUserPassword = await bcrypt.hash('user123', 10);

        // 1. Create Default Users (Requested Admin account)
        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                email: 'joshuamujakari15@gmail.com',
                password: hashedAdminPassword,
                name: 'System Administrator',
                role: 'Administrator',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
            }
        });

        // Seed companion alias joshua as well
        await prisma.user.create({
            data: {
                username: 'joshua',
                email: 'joshua@zimhub.co.zw',
                password: hashedAdminPassword,
                name: 'Joshua Mujakari',
                role: 'Administrator',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
            }
        });

        const owner = await prisma.user.create({
            data: {
                username: 'lodgeowner',
                email: 'owner@lodge.co.zw',
                password: hashedUserPassword,
                name: 'Tinashe Moyo',
                role: 'Lodge Owner',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
            }
        });

        const businessOwner = await prisma.user.create({
            data: {
                username: 'bizowner',
                email: 'biz@zimbiz.co.zw',
                password: hashedUserPassword,
                name: 'Chipo Sibanda',
                role: 'Business Owner',
                avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120'
            }
        });

        const customer = await prisma.user.create({
            data: {
                username: 'customer',
                email: 'customer@zimhub.co.zw',
                password: hashedUserPassword,
                name: 'Kundai Mariga',
                role: 'Customer',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
            }
        });

        // 2. Create Businesses (Directory, Restaurants, Services, Healthcare, etc.)
        await prisma.business.createMany({
            data: [
                {
                    name: 'Amanzi Restaurant',
                    description: 'Set in a beautiful colonial house surrounded by lush gardens. Serving modern international cuisine with local flavors.',
                    category: 'Restaurants',
                    subCategory: 'Fine Dining',
                    phone: '+263242497271',
                    whatsapp: '263786110762',
                    email: 'info@amanzi.co.zw',
                    website: 'https://www.amanzirestaurant.com',
                    hours: 'Mon-Sat: 12:00 PM - 10:00 PM',
                    location: 'Harare',
                    rating: 4.8,
                    isVerified: true,
                    ownerId: businessOwner.id
                },
                {
                    name: 'PowerFix Electrical Services',
                    description: 'Professional domestic and industrial electrical repairs, solar installations, and backup systems across Bulawayo.',
                    category: 'Local Services',
                    subCategory: 'Electricians',
                    phone: '+2639223455',
                    whatsapp: '263786110762',
                    email: 'fix@powerfix.co.zw',
                    hours: '24/7 Emergency Service',
                    location: 'Bulawayo',
                    rating: 4.6,
                    isVerified: true,
                    ownerId: businessOwner.id
                },
                {
                    name: 'Cresta Health Clinic',
                    description: 'State-of-the-art medical services, standard consulting, dental, pediatric care, and a fully stocked 24-hour pharmacy.',
                    category: 'Healthcare',
                    subCategory: 'Clinics & Pharmacies',
                    phone: '+263242778899',
                    whatsapp: '263786110762',
                    email: 'contact@crestahealth.co.zw',
                    hours: '24/7 Hours',
                    location: 'Harare',
                    rating: 4.5,
                    isVerified: true,
                    ownerId: businessOwner.id
                },
                {
                    name: 'ShuttlePro Zimbabwe',
                    description: 'Reliable airport transfers, intercity shuttles, car hire, and corporate transport services with professional drivers.',
                    category: 'Transport',
                    subCategory: 'Car Hire & Shuttles',
                    phone: '+263772100200',
                    whatsapp: '263786110762',
                    email: 'bookings@shuttlepro.co.zw',
                    hours: 'Daily: 5:00 AM - 11:00 PM',
                    location: 'Harare',
                    rating: 4.9,
                    isVerified: true,
                    ownerId: businessOwner.id
                }
            ]
        });

        // 3. Create Lodges & Rooms
        const lodge1 = await prisma.lodge.create({
            data: {
                name: 'Mountain View Lodge',
                description: 'Experience stunning mountain views, luxury rooms, custom local dining, and high-fidelity amenities. Standard/hourly blocks available.',
                location: 'Nyanga',
                image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
                isFeatured: true,
                ownerId: owner.id
            }
        });

        const lodge2 = await prisma.lodge.create({
            data: {
                name: 'Victoria Falls River Lodge',
                description: 'Luxury tents right on the banks of the Zambezi River. Private plunge pools, standard daily bookings, safari drives, and boat cruises.',
                location: 'Victoria Falls',
                image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=800',
                isFeatured: true,
                ownerId: owner.id
            }
        });

        // Create Rooms for Mountain View Lodge
        await prisma.room.createMany({
            data: [
                {
                    lodgeId: lodge1.id,
                    name: 'Standard Ensuite Room',
                    type: 'Standard',
                    pricePerDay: 80.00,
                    pricePerHour: 20.00, // 2-hour block
                    image: 'https://images.unsplash.com/photo-1611891404114-5090bc95c3a4?auto=format&fit=crop&q=80&w=600',
                    capacity: 2
                },
                {
                    lodgeId: lodge1.id,
                    name: 'Executive Mountain View Suite',
                    type: 'Executive Suite',
                    pricePerDay: 150.00,
                    pricePerHour: 40.00,
                    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&q=80&w=600',
                    capacity: 3
                },
                {
                    lodgeId: lodge2.id,
                    name: 'Luxury Zambezi Tent',
                    type: 'Resort Suite',
                    pricePerDay: 250.00,
                    pricePerHour: 80.00,
                    image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=600',
                    capacity: 2
                }
            ]
        });

        // 4. Create Marketplace Products
        await prisma.product.createMany({
            data: [
                {
                    name: 'iPhone 15 Pro Max (256GB)',
                    description: 'Brand new sealed in box. Midnight titanium. Fully unlocked, comes with local shop warranty.',
                    price: 1150.00,
                    category: 'Phones & Laptops',
                    condition: 'New',
                    image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=600',
                    whatsapp: '263786110762',
                    location: 'Harare',
                    isFeatured: true,
                    sellerId: businessOwner.id
                },
                {
                    name: 'Zimbabwe-grown Seed Maize (50kg)',
                    description: 'Premium SC727 seed maize. High yield variety. Certified and processed for premium agricultural outcome.',
                    price: 95.00,
                    category: 'Agriculture',
                    condition: 'New',
                    image: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=600',
                    whatsapp: '263786110762',
                    location: 'Gweru',
                    isFeatured: true,
                    sellerId: businessOwner.id
                },
                {
                    name: 'Toyota Hilux GD-6 2021',
                    description: 'Super clean, automatic transmission, diesel engine, mileage 45,000 km, pristine condition, duties fully paid.',
                    price: 32000.00,
                    category: 'Vehicles',
                    condition: 'Used',
                    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
                    whatsapp: '263786110762',
                    location: 'Harare',
                    isFeatured: true,
                    sellerId: businessOwner.id
                }
            ]
        });

        // 5. Create Jobs
        await prisma.job.createMany({
            data: [
                {
                    title: 'Senior Full Stack React Engineer',
                    company: 'EcoNet Wireless Zimbabwe',
                    description: 'We are looking for a highly skilled engineer proficient in React, Node, and database design to develop next-gen financial tech tools.',
                    location: 'Harare',
                    salary: 'USD 3,500 - 4,500 / Month',
                    type: 'Full-time',
                    category: 'Tech',
                    employerEmail: 'joshuamujakari15@gmail.com',
                    isFeatured: true,
                    employerId: admin.id
                },
                {
                    title: 'Lodge Operations Manager',
                    company: 'Mountain View Resorts',
                    description: 'Manage staff, guest bookings, scheduling, food menus, asset conditions, and ensure absolute premium hospitality in Nyanga.',
                    location: 'Nyanga',
                    salary: 'Negotiable',
                    type: 'Full-time',
                    category: 'Hospitality',
                    employerEmail: 'owner@lodge.co.zw',
                    isFeatured: false,
                    employerId: owner.id
                }
            ]
        });

        // 6. Create Property Listings
        await prisma.property.createMany({
            data: [
                {
                    title: 'Modern 3 Bedroom House in Borrowdale',
                    description: 'Luxury double-storey house featuring 3 bedrooms (all ensuite), modern fitted kitchen, active solar systems, borehole, and 24h armed security.',
                    type: 'Sale',
                    category: 'House',
                    price: 280000.00,
                    location: 'Harare',
                    bedrooms: 3,
                    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=600',
                    isFeatured: true,
                    ownerId: admin.id
                },
                {
                    title: 'Student Accommodation Near NUST',
                    description: 'Single room in student boarding house. Includes high-speed unlimited Wi-Fi, solar backup, shared kitchen, and water backup tank.',
                    type: 'Rent',
                    category: 'Student Accommodation',
                    price: 120.00,
                    location: 'Bulawayo',
                    bedrooms: 1,
                    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
                    isFeatured: true,
                    ownerId: admin.id
                }
            ]
        });

        console.log('✅ Seeding completed!');
    } catch (e) {
        console.error('❌ Database seed error:', e);
    }
}

// Run Seeding on Startup
seedDatabase();

// --- 1. AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password, name, role } = req.body;
        if (!username || !email || !password || !name) {
            return res.status(400).json({ error: 'Please provide all required fields' });
        }

        const existingUser = await prisma.user.findFirst({
            where: { OR: [{ username }, { email }] }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                name,
                role: role || 'Customer'
            }
        });

        const token = jwt.sign(
            { id: newUser.id, username: newUser.username, role: newUser.role, name: newUser.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            token,
            user: { id: newUser.id, username: newUser.username, email: newUser.email, name: newUser.name, role: newUser.role }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Please provide username and password' });
        }

        // Support login by email OR username (crucial for email login with joshuamujakari15@gmail.com!)
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email: username }
                ]
            }
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, avatar: user.avatar }
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, avatar: user.avatar });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 2. BUSINESS DIRECTORY ROUTES ---
app.get('/api/businesses', async (req, res) => {
    try {
        const { category, search, location } = req.query;
        const where = {};

        if (category) {
            where.category = String(category);
        }
        if (location) {
            where.location = String(location);
        }
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { description: { contains: String(search) } },
                { subCategory: { contains: String(search) } }
            ];
        }

        const businesses = await prisma.business.findMany({ where, orderBy: { rating: 'desc' } });
        res.json(businesses);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/businesses', authenticateToken, async (req, res) => {
    try {
        const { name, description, category, subCategory, phone, whatsapp, email, website, hours, location, logo, coverImage } = req.body;
        const newBiz = await prisma.business.create({
            data: {
                name,
                description,
                category,
                subCategory,
                phone,
                whatsapp,
                email,
                website,
                hours,
                location,
                logo,
                coverImage,
                ownerId: req.user.id
            }
        });
        res.status(201).json(newBiz);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/businesses/:id', authenticateToken, async (req, res) => {
    try {
        const biz = await prisma.business.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!biz) return res.status(404).json({ error: 'Business not found' });

        if (biz.ownerId !== req.user.id && req.user.role !== 'Administrator') {
            return res.status(403).json({ error: 'Unauthorized to delete this business' });
        }

        await prisma.business.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Business successfully deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 3. LODGE BOOKING ROUTES ---
app.get('/api/lodges', async (req, res) => {
    try {
        const lodges = await prisma.lodge.findMany({
            include: { rooms: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(lodges);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/lodges', authenticateToken, requireRole(['Lodge Owner', 'Administrator']), async (req, res) => {
    try {
        const { name, description, location, image, isFeatured } = req.body;
        const newLodge = await prisma.lodge.create({
            data: {
                name,
                description,
                location,
                image,
                isFeatured: isFeatured || false,
                ownerId: req.user.id
            }
        });
        res.status(201).json(newLodge);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/lodges/:id/rooms', authenticateToken, requireRole(['Lodge Owner', 'Administrator']), async (req, res) => {
    try {
        const lodgeId = parseInt(req.params.id);
        const { name, type, pricePerDay, pricePerHour, image, capacity } = req.body;
        const newRoom = await prisma.room.create({
            data: {
                lodgeId,
                name,
                type,
                pricePerDay: parseFloat(pricePerDay),
                pricePerHour: parseFloat(pricePerHour),
                image,
                capacity: parseInt(capacity) || 2
            }
        });
        res.status(201).json(newRoom);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
    try {
        let bookings;
        if (req.user.role === 'Administrator') {
            bookings = await prisma.booking.findMany({
                include: { room: { include: { lodge: true } }, user: true },
                orderBy: { createdAt: 'desc' }
            });
        } else if (req.user.role === 'Lodge Owner') {
            bookings = await prisma.booking.findMany({
                where: { room: { lodge: { ownerId: req.user.id } } },
                include: { room: { include: { lodge: true } }, user: true },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            bookings = await prisma.booking.findMany({
                where: { userId: req.user.id },
                include: { room: { include: { lodge: true } } },
                orderBy: { createdAt: 'desc' }
            });
        }
        res.json(bookings);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const { roomId, startDate, endDate, isHourly, hourlyBlock, totalPrice, paymentMethod, guestName, guestPhone } = req.body;

        if (isHourly) {
            const conflict = await prisma.booking.findFirst({
                where: {
                    roomId: parseInt(roomId),
                    startDate,
                    isHourly: true,
                    hourlyBlock,
                    status: { not: 'Cancelled' }
                }
            });
            if (conflict) {
                return res.status(400).json({ error: 'This specific hourly slot is already booked' });
            }
        } else {
            const conflict = await prisma.booking.findFirst({
                where: {
                    roomId: parseInt(roomId),
                    isHourly: false,
                    status: { not: 'Cancelled' },
                    NOT: [
                        { endDate: { lte: startDate } },
                        { startDate: { gte: endDate } }
                    ]
                }
            });
            if (conflict) {
                return res.status(400).json({ error: 'These dates are already booked for this room' });
            }
        }

        const booking = await prisma.booking.create({
            data: {
                userId: req.user.id,
                roomId: parseInt(roomId),
                startDate,
                endDate,
                isHourly: isHourly || false,
                hourlyBlock,
                totalPrice: parseFloat(totalPrice),
                paymentMethod,
                guestName,
                guestPhone,
                status: 'Paid'
            }
        });

        await prisma.notification.create({
            data: {
                userId: req.user.id,
                title: 'Booking Confirmed!',
                message: `Your booking for room has been confirmed via ${paymentMethod}. Enjoy your stay!`,
                type: 'Booking'
            }
        });

        res.status(201).json(booking);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/bookings/:id/cancel', authenticateToken, async (req, res) => {
    try {
        const booking = await prisma.booking.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.userId !== req.user.id && req.user.role !== 'Administrator' && req.user.role !== 'Lodge Owner') {
            return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
        }

        const updated = await prisma.booking.update({
            where: { id: booking.id },
            data: { status: 'Cancelled' }
        });

        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 4. MARKETPLACE ROUTES ---
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice } = req.query;
        const where = {};

        if (category) where.category = String(category);
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }
        if (search) {
            where.OR = [
                { name: { contains: String(search) } },
                { description: { contains: String(search) } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: { seller: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(products);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/products', authenticateToken, async (req, res) => {
    try {
        const { name, description, price, category, condition, image, whatsapp, location, isFeatured } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                category,
                condition,
                image,
                whatsapp,
                location,
                isFeatured: isFeatured || false,
                sellerId: req.user.id
            }
        });
        res.status(201).json(product);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
    try {
        const prod = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!prod) return res.status(404).json({ error: 'Product not found' });

        if (prod.sellerId !== req.user.id && req.user.role !== 'Administrator') {
            return res.status(403).json({ error: 'Unauthorized to delete this product' });
        }

        await prisma.product.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ success: true, message: 'Product deleted' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 5. JOBS ROUTES ---
app.get('/api/jobs', async (req, res) => {
    try {
        const { search, category, location } = req.query;
        const where = {};

        if (category) where.category = String(category);
        if (location) where.location = String(location);
        if (search) {
            where.OR = [
                { title: { contains: String(search) } },
                { company: { contains: String(search) } },
                { description: { contains: String(search) } }
            ];
        }

        const jobs = await prisma.job.findMany({
            where,
            include: { employer: true, applications: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(jobs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/jobs', authenticateToken, requireRole(['Employer', 'Administrator']), async (req, res) => {
    try {
        const { title, company, description, location, salary, type, category, employerEmail, isFeatured } = req.body;
        const job = await prisma.job.create({
            data: {
                title,
                company,
                description,
                location,
                salary,
                type,
                category,
                employerEmail: employerEmail || req.user.email,
                isFeatured: isFeatured || false,
                employerId: req.user.id
            }
        });
        res.status(201).json(job);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/jobs/:id/apply', authenticateToken, async (req, res) => {
    try {
        const jobId = parseInt(req.params.id);
        const { name, email, coverLetter, cvUrl } = req.body;

        const application = await prisma.jobApplication.create({
            data: {
                jobId,
                userId: req.user.id,
                name,
                email,
                coverLetter,
                cvUrl
            }
        });
        res.status(201).json(application);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/applications/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body; // Accepted, Rejected, Reviewed
        const appRecord = await prisma.jobApplication.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { job: true }
        });

        if (!appRecord) return res.status(404).json({ error: 'Application not found' });
        if (appRecord.job.employerId !== req.user.id && req.user.role !== 'Administrator') {
            return res.status(403).json({ error: 'Unauthorized to review this application' });
        }

        const updated = await prisma.jobApplication.update({
            where: { id: appRecord.id },
            data: { status }
        });

        // Notify Candidate
        await prisma.notification.create({
            data: {
                userId: appRecord.userId,
                title: 'Application Status Updated',
                message: `Your application status for "${appRecord.job.title}" at ${appRecord.job.company} was updated to "${status}".`,
                type: 'Job'
            }
        });

        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/applications', authenticateToken, async (req, res) => {
    try {
        let applications;
        if (req.user.role === 'Administrator') {
            applications = await prisma.jobApplication.findMany({
                include: { job: true, user: true }
            });
        } else {
            const isEmp = req.user.role === 'Employer';
            if (isEmp) {
                applications = await prisma.jobApplication.findMany({
                    where: { job: { employerId: req.user.id } },
                    include: { job: true, user: true }
                });
            } else {
                applications = await prisma.jobApplication.findMany({
                    where: { userId: req.user.id },
                    include: { job: true }
                });
            }
        }
        res.json(applications);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 6. REAL ESTATE / PROPERTY ROUTES ---
app.get('/api/properties', async (req, res) => {
    try {
        const { type, category, location, minPrice, maxPrice } = req.query;
        const where = {};

        if (type) where.type = String(type);
        if (category) where.category = String(category);
        if (location) where.location = String(location);
        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        const properties = await prisma.property.findMany({
            where,
            include: { owner: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(properties);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/properties', authenticateToken, requireRole(['Property Owner', 'Administrator']), async (req, res) => {
    try {
        const { title, description, type, category, price, location, bedrooms, image, isFeatured } = req.body;
        const property = await prisma.property.create({
            data: {
                title,
                description,
                type,
                category,
                price: parseFloat(price),
                location,
                bedrooms: parseInt(bedrooms) || 1,
                image,
                isFeatured: isFeatured || false,
                ownerId: req.user.id
            }
        });
        res.status(201).json(property);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 7. REVIEWS & NOTIFICATIONS ---
app.post('/api/reviews', authenticateToken, async (req, res) => {
    try {
        const { targetId, targetType, rating, comment } = req.body;
        const review = await prisma.review.create({
            data: {
                userId: req.user.id,
                targetId: parseInt(targetId),
                targetType,
                rating: parseInt(rating),
                comment
            }
        });

        // Recalculate average rating for business if targetType === Business
        if (targetType === 'Business') {
            const allReviews = await prisma.review.findMany({
                where: { targetId: parseInt(targetId), targetType: 'Business' }
            });
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            await prisma.business.update({
                where: { id: parseInt(targetId) },
                data: { rating: parseFloat(avg.toFixed(1)) }
            });
        }

        res.status(201).json(review);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/reviews/:targetType/:targetId', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: {
                targetType: req.params.targetType,
                targetId: parseInt(req.params.targetId)
            },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reviews);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
    try {
        const notifs = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
        const updated = await prisma.notification.update({
            where: { id: parseInt(req.params.id) },
            data: { isRead: true }
        });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// --- 7.5 REAL-TIME CHAT MESSAGES ROUTING ---
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const msg = await prisma.message.create({
            data: {
                senderId: req.user.id,
                receiverId: parseInt(receiverId),
                text
            }
        });
        res.status(201).json(msg);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const chatWithId = parseInt(req.query.chatWithId);
        if (!chatWithId) return res.status(400).json({ error: 'chatWithId query param required' });

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: req.user.id, receiverId: chatWithId },
                    { senderId: chatWithId, receiverId: req.user.id }
                ]
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/messages/contacts', authenticateToken, async (req, res) => {
    try {
        const sent = await prisma.message.findMany({
            where: { senderId: req.user.id },
            select: { receiverId: true }
        });
        const received = await prisma.message.findMany({
            where: { receiverId: req.user.id },
            select: { senderId: true }
        });

        const contactIds = Array.from(new Set([
            ...sent.map(m => m.receiverId),
            ...received.map(m => m.senderId)
        ]));

        const contacts = await prisma.user.findMany({
            where: { id: { in: contactIds } },
            select: { id: true, username: true, name: true, role: true, avatar: true }
        });

        res.json(contacts);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 8. SIMULATED PAYMENT ROUTE ---
app.post('/api/payments/checkout', authenticateToken, async (req, res) => {
    try {
        const { amount, phone, paymentMethod, reference } = req.body;
        const isSuccess = !phone.endsWith('00'); // Simulate failure for phones ending with 00
        if (!isSuccess) {
            return res.status(400).json({ error: 'Payment declined by mobile operator. Try another number.' });
        }

        res.json({
            success: true,
            status: 'Paid',
            reference: 'TX-' + Math.floor(Math.random() * 900000000 + 100000000),
            message: `Simulated payment of $${amount} via ${paymentMethod} approved successfully!`
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 9. AI CHAT & SEARCH & TRANSLATION ROUTE ---
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message, language } = req.body; // English, Shona, Ndebele
        const lower = message.toLowerCase();
        let reply = "I am ZimHub's AI assistant. Ask me anything about Zimbabwe lodges, jobs, businesses, or real estate!";

        if (lower.includes('lodge') || lower.includes('accommodation')) {
            reply = "We have high-fidelity lodges listed! Check out Mountain View Lodge in Nyanga (standard suites for $80/day) or luxury tents at Victoria Falls River Lodge. Would you like me to filter availability?";
        } else if (lower.includes('job') || lower.includes('work')) {
            reply = "EcoNet Wireless is currently hiring a Senior Full Stack React Engineer in Harare (Salary: USD 3,500 - 4,500/Month). You can apply right now by uploading your CV!";
        } else if (lower.includes('buy') || lower.includes('sell') || lower.includes('iphone') || lower.includes('maize')) {
            reply = "ZimHub Marketplace features high-demand listing items. An iPhone 15 Pro Max is listed for $1,150, and 50kg SC727 Seed Maize is available for agricultural buyers at $95. Contact sellers instantly on WhatsApp.";
        } else if (lower.includes('house') || lower.includes('rent') || lower.includes('borrowdale')) {
            reply = "Check out our Real Estate section. There is a magnificent 3-bedroom luxury house in Borrowdale, Harare for $280,000, and single-room boarding student accommodation near NUST in Bulawayo for $120/month.";
        } else if (lower.includes('hello') || lower.includes('hi')) {
            reply = "Mhoro! Sani-bonani! Hello! Welcome to ZimHub. How can I help you find lodges, jobs, products, or services in Zimbabwe today?";
        }

        if (language === 'Shona' || lower.includes('shona')) {
            reply += " [ZimHub AI in Shona]: Ndinogona kukubatsira kutsvaga mahotera, mabasa, nemba dzekuroja zviri nyore muZimbabwe.";
        } else if (language === 'Ndebele' || lower.includes('ndebele')) {
            reply += " [ZimHub AI in Ndebele]: Ngingakusiza ukudinga ama-lodges, imisebenzi, kanye lezindlu zokurenta eZimbabwe.";
        }

        res.json({ reply });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/ai/translate', async (req, res) => {
    try {
        const { text, targetLang } = req.body; // 'English', 'Shona', 'Ndebele'
        let translation = text;

        if (targetLang === 'Shona') {
            if (text.toLowerCase().includes('welcome')) translation = "Wamukirwa ku ZimHub - Zvese zvemu Zimbabwe paIndaneti imwe chete!";
            else if (text.toLowerCase().includes('lodge')) translation = "Mba dzekugara dzinofadza dzeZimbabwe";
            else translation = text + " (Kushandurirwa muShona: Kudada neZimHub)";
        } else if (targetLang === 'Ndebele') {
            if (text.toLowerCase().includes('welcome')) translation = "Zisukile ku ZimHub - Konke kweZimbabwe endaweni eyodwa!";
            else if (text.toLowerCase().includes('lodge')) translation = "Izindlu zokulala ezinhle zeZimbabwe";
            else translation = text + " (Kuhunyushwe ngesiNdebele: Ukuzigaja ngeZimHub)";
        } else {
            translation = text + " (Translated to English)";
        }

        res.json({ translation });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 10. DASHBOARD & SYSTEM ANALYTICS ---
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const usersCount = await prisma.user.count();
        const businessesCount = await prisma.business.count();
        const lodgesCount = await prisma.lodge.count();
        const jobsCount = await prisma.job.count();
        const propertiesCount = await prisma.property.count();
        const productsCount = await prisma.product.count();
        const bookingsCount = await prisma.booking.count();

        const bookingsList = await prisma.booking.findMany({ where: { status: 'Paid' } });
        const totalEarnings = bookingsList.reduce((sum, b) => sum + b.totalPrice, 0);

        res.json({
            users: usersCount,
            businesses: businessesCount,
            lodges: lodgesCount,
            jobs: jobsCount,
            properties: propertiesCount,
            products: productsCount,
            bookings: bookingsCount,
            earnings: totalEarnings,
            commission: parseFloat((totalEarnings * 0.1).toFixed(2))
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- 11. ADMIN DASHBOARD CONTROL PANEL ENDPOINTS ---
app.get('/api/admin/users', authenticateToken, requireRole(['Administrator']), async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, username: true, email: true, name: true, role: true, createdAt: true }
        });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.delete('/api/admin/users/:id', authenticateToken, requireRole(['Administrator']), async (req, res) => {
    try {
        const targetId = parseInt(req.params.id);
        if (targetId === req.user.id) return res.status(400).json({ error: 'Cannot delete own admin profile.' });
        await prisma.user.delete({ where: { id: targetId } });
        res.json({ success: true, message: 'User account successfully pruned.' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/admin/businesses/:id/verify', authenticateToken, requireRole(['Administrator']), async (req, res) => {
    try {
        const bizId = parseInt(req.params.id);
        const biz = await prisma.business.findUnique({ where: { id: bizId } });
        if (!biz) return res.status(404).json({ error: 'Business not found.' });

        const updated = await prisma.business.update({
            where: { id: bizId },
            data: { isVerified: !biz.isVerified }
        });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// Catch-all route to serve compiled client SPA in production
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the integrated Express Server
app.listen(port, () => {
    console.log(`🚀 ZimHub Backend running on port ${port}`);
});
