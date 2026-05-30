# ROOT NEXUS - AI Powered AgroMarket Platform

ROOT NEXUS is a multilingual, offline-first agricultural marketplace for remote hill regions.  
This codebase uses Next.js + MongoDB Atlas and includes initial MVP APIs for authentication, products, and orders.

## Tech Stack

- Next.js (App Router + API Routes)
- MongoDB Atlas (Mongoose)
- Tailwind CSS
- JWT-based auth primitives
- Zod request validation

## Setup

1. Install dependencies:
   - `npm install`
2. Copy environment file:
   - `cp .env.example .env.local` (or create `.env.local` manually on Windows)
3. Configure values in `.env.local`:
   - `MONGODB_URI`
   - `JWT_SECRET`
4. Run dev server:
   - `npm run dev`

## Current API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/products`
- `POST /api/products`
- `POST /api/orders`

## Project Structure (Current)

- `src/app` - UI pages and API route handlers
- `src/lib` - DB, auth, and response helpers
- `src/models` - Mongoose models (User, Product, Order)

## Next Implementation Steps

- Auth.js session integration with role-based guards
- Cloudinary media upload APIs and product image workflows
- Farmer dashboard and buyer marketplace pages
- PWA offline sync queue and localization packs (Tamil/Malayalam)
