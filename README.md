# Photo Display App

A simple, mobile-optimized photo display application built with Next.js, featuring heart reactions similar to Google Meet.

## Features

- **Photo Gallery**: Display photos one at a time with arrow navigation
- **Heart Reactions**: Users can react to photos with floating heart animations (Google Meet style)
- **Admin Panel**: Protected admin area for uploading and managing photos
- **Mobile Optimized**: Touch swipe support and responsive design
- **PostgreSQL Database**: Persistent storage for photos and user data
- **Docker Ready**: Easy deployment with Docker Compose

## Tech Stack

- **Frontend**: Next.js 14, React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Containerization**: Docker & Docker Compose

## Quick Start with Docker

1. **Clone and navigate to the project**:
   ```bash
   cd photoDisplayApp
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   docker compose up -d --build
   ```

4. **Access the app**:
   - Gallery: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin

5. **Default Admin Credentials**:
   - Email: `admin@photodisplay.com`
   - Password: `admin123`

## Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Start PostgreSQL** (using Docker):
   ```bash
   docker run -d --name photodisplay-db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=photodisplay \
     -p 5432:5432 \
     postgres:16-alpine
   ```

4. **Initialize database**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

## Project Structure

```
photoDisplayApp/
├── prisma/
│   ├── schema.prisma      # Database models
│   └── seed.ts            # Initial data seeding
├── public/
│   └── uploads/           # Uploaded photos storage
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── admin/         # Admin panel pages
│   │   ├── page.tsx       # Main gallery page
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   └── lib/               # Utilities (Prisma, Auth)
├── docker-compose.yml     # Docker orchestration
├── Dockerfile             # Container build
└── package.json
```

## Database Models

- **User**: Admin users who can manage photos
- **Album**: Collection of photos
- **Photo**: Individual photo with metadata

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | See .env.example |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Required |
| `NEXTAUTH_URL` | App URL | http://localhost:3000 |
| `ADMIN_EMAIL` | Initial admin email | admin@photodisplay.com |
| `ADMIN_PASSWORD` | Initial admin password | admin123 |

## Usage

### Gallery (Public)
- Navigate between photos using arrow buttons or swipe on mobile
- Press the heart button to send a reaction
- Keyboard: Left/Right arrows to navigate, Space/Enter to react

### Admin Panel
1. Go to `/admin/login`
2. Login with admin credentials
3. Select an album and upload photos
4. Delete photos by hovering and clicking the trash icon

## Production Deployment

1. Update `.env` with production values:
   - Set a strong `NEXTAUTH_SECRET`
   - Update `NEXTAUTH_URL` to your domain
   - Change admin credentials

2. Build and run:
   ```bash
   docker compose up -d --build
   ```

3. (Optional) Set up a reverse proxy (nginx/traefik) for HTTPS

## License

MIT
