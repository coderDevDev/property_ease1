# PropertyEase - Property Management System

A modern property management system built with Next.js, TypeScript, and Supabase.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Supabase account and project

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd client
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Set up the database**

   - Go to your Supabase dashboard
   - Navigate to the SQL Editor
   - Run the contents of `scripts/create-tables.sql`
   - This will create all necessary tables, triggers, and policies

5. **Start the development server**

```bash
pnpm dev
```

## 🗄️ Database Setup

### Manual Setup (Recommended)

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `scripts/create-tables.sql`
4. Click **Run** to execute the script

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Push the database schema
supabase db push
```

## 🏗️ Project Structure

```
client/
├── app/                    # Next.js app directory
├── components/             # React components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── types/                  # TypeScript type definitions
├── scripts/                # Database setup scripts
└── public/                 # Static assets
```

## 🔐 Authentication

The system supports two user roles:

- **Property Owner/Manager**: Can manage properties and tenants
- **Tenant/Resident**: Can view their rental information

### Registration Flow

1. User selects role (owner/tenant)
2. Fills registration form with validation
3. Account created in Supabase Auth
4. User profile created in database via trigger
5. Email verification required before login

## 🛠️ Development

### Key Technologies

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Form Validation**: React Hook Form + Zod

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 📝 Database Schema

### Users Table

- Extends Supabase Auth users
- Role-based access (owner/tenant)
- Profile information and preferences
- Role-specific fields (company info, emergency contacts)

### Properties Table

- Property management for owners
- Unit tracking and occupancy
- Rent and status management

### Tenants Table

- Tenant-property relationships
- Lease information and documents
- Status tracking

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Email Verification**: Required for account activation
- **Role-based Access**: Users can only access appropriate areas
- **Form Validation**: Client and server-side validation
- **Password Strength**: Enforced strong password requirements

## 🚨 Troubleshooting

### Common Issues

1. **404 Error on Users Table**

   - Ensure you've run the database setup scripts
   - Check that the `users` table exists in your Supabase database

2. **Authentication Errors**

   - Verify your environment variables are correct
   - Check that email verification is enabled in Supabase Auth settings

3. **Form Validation Errors**
   - Ensure all required fields are filled
   - Check password strength requirements
   - Verify email format is valid

### Getting Help

- Check the Supabase documentation
- Review the database setup scripts in `scripts/`
- Ensure all environment variables are set correctly

## 📄 License

This project is licensed under the MIT License.
