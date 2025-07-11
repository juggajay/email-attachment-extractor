# Email Attachment Extractor

A clean, professional web application that helps users extract and organize email attachments using AI-powered suggestions. Built with Next.js, TypeScript, Supabase, and OpenAI.

## Features

- **IMAP Email Connection**: Connect to any email provider using IMAP credentials
- **Smart Attachment Detection**: Automatically lists emails with attachments
- **AI-Powered Organization**: Get intelligent suggestions for file names and folder structures
- **One-Click Extraction**: Extract single or multiple attachments with ease
- **Learning System**: The AI learns from your corrections to improve future suggestions
- **Secure Session Management**: Passwords are never stored, only kept in encrypted sessions
- **Clean Interface**: Minimal, professional design that feels like an extension of your email client

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Email**: IMAP protocol support for all major providers
- **AI**: OpenAI GPT-4 for intelligent file organization
- **File Handling**: Browser-based downloads with ZIP support
- **Authentication**: Session-based with iron-session
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ and npm
2. Supabase account
3. OpenAI API key
4. Email account with IMAP access enabled

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd email-attachment-extractor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
SESSION_PASSWORD=your_32_character_session_password
```

4. Set up Supabase database:
- Create a new Supabase project
- Run the SQL schema from `supabase/schema.sql`
- Enable Row Level Security (RLS) as configured in the schema

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Your Email**:
   - Enter your email credentials
   - Select your provider or enter custom IMAP settings
   - For Gmail, use an app-specific password

2. **Browse Emails**:
   - View all emails with attachments
   - Green checkmarks indicate processed emails
   - Click any email to view details

3. **Extract Attachments**:
   - Click "Extract Files" on any email
   - Review AI suggestions for file names and locations
   - Edit suggestions if needed
   - Click "Confirm & Download"

4. **Download Options**:
   - Single files download directly
   - Multiple files download as a ZIP with folder structure

## IMAP Settings

Common IMAP configurations:

| Provider | Host | Port | Security |
|----------|------|------|----------|
| Gmail | imap.gmail.com | 993 | SSL |
| Outlook | outlook.office365.com | 993 | SSL |
| Yahoo | imap.mail.yahoo.com | 993 | SSL |
| iCloud | imap.mail.me.com | 993 | SSL |

## Security

- Passwords are never stored in the database
- All credentials are encrypted in session storage
- Row-level security ensures users only see their own data
- Rate limiting prevents API abuse
- HTTPS required in production

## Deployment

### Vercel Deployment

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The `vercel.json` file is pre-configured with optimal settings.

## API Endpoints

- `POST /api/imap/connect` - Test and save IMAP connection
- `GET /api/imap/list` - List emails with attachments
- `GET /api/imap/fetch/[uid]` - Get email details and attachments
- `POST /api/extract/suggest` - Generate AI suggestions
- `POST /api/extract/download` - Download prepared files

## Database Schema

Key tables:
- `users` - User accounts
- `email_accounts` - Connected email accounts
- `processed_emails` - Track extracted emails
- `extracted_files` - File metadata
- `filing_patterns` - AI learning patterns
- `user_corrections` - Track user edits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT License - see LICENSE file for details