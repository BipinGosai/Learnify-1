# Learnify

Learnify is an AI-powered learning platform that generates course layouts and content, lets users enroll, and supports a verification flow for professor feedback.

## Live Demo

[Learnify on Vercel](https://vercel.com/anujs-projects-09c7f7a7/learnify-lzuj/GPj16v9h3934GrXWT4B4H9rdbhfB)

## Features

- AI-generated course layout and content
- Course creation and editing workflow
- Enroll and learning dashboard
- Verification and review flow

## Tech Stack

- Next.js (App Router) and React
- Tailwind CSS and Radix UI
- Drizzle ORM with Neon (Postgres)
- Google Gemini APIs and YouTube Data API
- Nodemailer

## Getting Started

1. Install dependencies:
	```bash
	npm install
	```
2. Run the development server:
	```bash
	npm run dev
	```
3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file in the project root and set the following values:

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string for Drizzle/Neon |
| `GEMINI_API_KEY` | yes | Google Gemini key for content generation |
| `AI_GURU_LAB_API_KEY` or `AI_GURU_LAB_API` | no | Alternative AI provider for layout generation |
| `YOUTUBE_API_KEY` | no | YouTube Data API key for video enrichment |
| `SMTP_HOST` | no | SMTP server host |
| `SMTP_PORT` | no | SMTP server port (defaults to 587) |
| `SMTP_USER` | no | SMTP username |
| `SMTP_PASS` | no | SMTP password |
| `SMTP_FROM` | no | From address (defaults to `SMTP_USER`) |
| `PROFESSOR_EMAIL` | no | Verification email recipient |
| `ABC_PROFESSOR_EMAIL` | no | Fallback recipient if `PROFESSOR_EMAIL` is empty |
| `APP_BASE_URL` | no | Base URL for verification links |

If the SMTP variables are not set, verification emails are disabled.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - build for production
- `npm run start` - start the production server
- `npm run db:push` - push Drizzle schema changes
