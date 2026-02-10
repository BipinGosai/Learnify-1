# Learnify



<img width="1888" height="878" alt="Screenshot 2026-02-09 105806" src="https://github.com/user-attachments/assets/1c4c2f30-415a-433b-89b4-fb58464a3018" />

Learnify is an AI-powered learning platform that generates course layouts and content, enables enrollment, and supports a professor verification workflow with feedback.
## Key Capabilities

- AI-generated course layout (chapters, topics, durations)
- AI-generated course content with optional video enrichment
- Course creation, editing, and banner management
- Enrollment and learning dashboard
- Professor verification workflow with email review links

## Course Model (What A Course Includes)

Each course stores both the high-level layout and the generated content:

- `name`, `description`, `level`, `category`, `courseDomain`
- `noOfChapters`, `includeVideo`, `bannerImageUrl`
- `courseJson`: structured layout for chapters and topics
- `courseContent`: generated learning content mapped to the layout
- `reviewStatus`: `draft`, `pending`, `approved`, or `changes_requested`

### Layout Structure

The generated layout is stored in `courseJson` and follows a consistent structure:

```json
{
  "course": {
    "name": "Course title",
    "category": "Category",
    "level": "Beginner | Intermediate | Advanced",
    "chapters": [
      {
        "chapterName": "Chapter 1",
        "duration": "45 minutes",
        "topics": ["Topic A", "Topic B"]
      }
    ]
  }
}
```

### Learning Experience

- Learners enroll into a course and track chapter completion.
- Chapters and topics appear in a sidebar with content in the main view.
- If a course is pending review, learning access is restricted until verified.

## Verification Workflow

1. Creator submits a course for review.
2. A professor receives a verification link via email.
3. The professor can approve or request changes, updating the course status.
4. Approved courses become available for learning and enrollment.

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

## Core Routes

- `/workspace` - creator dashboard
- `/workspace/edit-course/[courseId]` - create/edit course
- `/workspace/view-course/[courseId]` - view course details
- `/course/[courseId]` - learner view
- `/verify/[token]` - professor verification page

## Scripts

- `npm run dev` - start the dev server
- `npm run dev` - start the dev server
- `npm run build` - build for production
- `npm run start` - start the production server
- `npm run db:push` - push Drizzle schema changes


