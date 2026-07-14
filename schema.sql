-- Mountain View Lodge Database Schema

CREATE TABLE IF NOT EXISTS "bookings" (
    id SERIAL PRIMARY KEY,
    "bookingId" VARCHAR(100) UNIQUE,
    "guestName" VARCHAR(255),
    "guestEmail" VARCHAR(255),
    "guestPhone" VARCHAR(100),
    "roomType" VARCHAR(100),
    "checkIn" VARCHAR(100),
    "checkOut" VARCHAR(100),
    "guests" INTEGER,
    "totalPrice" DECIMAL(10,2),
    "status" VARCHAR(100) DEFAULT 'Pending',
    "specialRequests" TEXT,
    "createdAt" VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS "rooms" (
    id SERIAL PRIMARY KEY,
    "type" VARCHAR(100) UNIQUE,
    "name" VARCHAR(255),
    "price" DECIMAL(10,2),
    "capacity" INTEGER,
    "totalRooms" INTEGER,
    "description" TEXT,
    "amenities" TEXT
);

CREATE TABLE IF NOT EXISTS "messages" (
    id SERIAL PRIMARY KEY,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(100),
    "subject" VARCHAR(255),
    "message" TEXT,
    "date" VARCHAR(100),
    "status" VARCHAR(100) DEFAULT 'Unread'
);

CREATE TABLE IF NOT EXISTS "notifications" (
    id SERIAL PRIMARY KEY,
    "title" VARCHAR(255),
    "message" TEXT,
    "date" VARCHAR(100),
    "type" VARCHAR(100),
    "read" INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "users" (
    id SERIAL PRIMARY KEY,
    "username" VARCHAR(255) UNIQUE,
    "password" VARCHAR(255),
    "role" VARCHAR(100),
    "name" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "settings" (
    id SERIAL PRIMARY KEY,
    "key" VARCHAR(255) UNIQUE,
    "value" TEXT
);
