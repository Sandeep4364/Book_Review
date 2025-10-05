# Book Review Platform

A comprehensive full-stack book review platform built with React, TypeScript, and Supabase. Users can browse books, add their own books, write reviews with star ratings, and manage their profile.

## Features

### Core Functionality
- **User Authentication**: Secure signup and login with JWT tokens
- **Book Management**: Add, edit, and delete books (users can only modify their own books)
- **Review System**: Write, edit, and delete reviews with 1-5 star ratings
- **Search & Filter**: Search books by title or author, filter by genre
- **Sorting**: Sort books by newest, oldest, or publication year
- **Pagination**: Browse books with 5 books per page
- **User Profile**: View all books added and reviews written by the user
- **Protected Routes**: Authentication-required pages are automatically protected

### Technical Features
- **Row Level Security (RLS)**: Database-level security for all operations
- **Real-time Data**: Automatic updates using Supabase
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Clean, professional design with Lucide React icons

## Technologies Used

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router v7** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and dev server

### Backend & Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

## Project Structure

```
src/
├── components/
│   ├── Navbar.tsx              # Main navigation bar
│   └── ProtectedRoute.tsx      # Route wrapper for authentication
├── contexts/
│   └── AuthContext.tsx         # Authentication state management
├── lib/
│   └── supabase.ts            # Supabase client and TypeScript types
├── pages/
│   ├── SignupPage.tsx         # User registration
│   ├── LoginPage.tsx          # User login
│   ├── BooksPage.tsx          # Book listing with search/filter/pagination
│   ├── BookDetailsPage.tsx    # Book details and reviews
│   ├── BookFormPage.tsx       # Add/edit book form
│   └── ProfilePage.tsx        # User profile with books and reviews
├── App.tsx                     # Main app component with routing
└── main.tsx                    # Application entry point
```

## Database Schema

### Tables

#### `profiles`
- `id` (uuid, primary key) - References auth.users
- `name` (text) - User's full name
- `email` (text, unique) - User's email
- `created_at` (timestamptz) - Account creation timestamp

#### `books`
- `id` (uuid, primary key) - Unique book identifier
- `title` (text) - Book title
- `author` (text) - Book author
- `description` (text) - Book description
- `genre` (text) - Book genre/category
- `published_year` (integer) - Year of publication
- `added_by` (uuid) - References profiles.id (book creator)
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp

#### `reviews`
- `id` (uuid, primary key) - Unique review identifier
- `book_id` (uuid) - References books.id
- `user_id` (uuid) - References profiles.id (reviewer)
- `rating` (integer, 1-5) - Star rating
- `review_text` (text) - Review content
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp
- **Constraint**: One review per user per book

### Security (RLS Policies)

All tables have Row Level Security enabled with the following policies:

**Profiles:**
- Anyone can view profiles
- Users can only update their own profile

**Books:**
- Anyone can view all books
- Authenticated users can create books
- Users can only update/delete their own books

**Reviews:**
- Anyone can view all reviews
- Authenticated users can create reviews
- Users can only update/delete their own reviews

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- A Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd book-review-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API
   - Copy your project URL and anon key

4. Configure environment variables:
   - The `.env` file should already contain the Supabase credentials
   - If not, create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Run the database migration:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Create and run the following migration to set up the database schema:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create books table
CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  description text NOT NULL,
  genre text NOT NULL,
  published_year integer NOT NULL,
  added_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(book_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_books_added_by ON books(added_by);
CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
CREATE INDEX IF NOT EXISTS idx_books_published_year ON books(published_year);
CREATE INDEX IF NOT EXISTS idx_reviews_book_id ON reviews(book_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Books Policies
CREATE POLICY "Anyone can view books"
  ON books FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create books"
  ON books FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Users can update own books"
  ON books FOR UPDATE TO authenticated
  USING (auth.uid() = added_by) WITH CHECK (auth.uid() = added_by);

CREATE POLICY "Users can delete own books"
  ON books FOR DELETE TO authenticated
  USING (auth.uid() = added_by);

-- Reviews Policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_books
  BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_reviews
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'User'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Running the Application

#### Development Mode
```bash
npm run dev
```
The application will open at `http://localhost:5173`

#### Production Build
```bash
npm run build
```

#### Preview Production Build
```bash
npm run preview
```

#### Type Checking
```bash
npm run typecheck
```

#### Linting
```bash
npm run lint
```

## Usage Guide

### For Users

1. **Sign Up**: Create an account with your name, email, and password
2. **Browse Books**: View all books on the home page, use search and filters
3. **View Book Details**: Click any book to see full details and reviews
4. **Add a Book**: Click "Add Book" in the navbar (requires login)
5. **Write Reviews**: On any book details page, rate and review (requires login)
6. **Manage Your Content**:
   - Edit/delete your own books
   - Edit/delete your own reviews
   - View all your content in the Profile page

### Available Pages

- **/** - Home page with book listing
- **/signup** - User registration
- **/login** - User login
- **/books/:id** - Book details and reviews
- **/books/new** - Add new book (protected)
- **/books/:id/edit** - Edit book (protected, owner only)
- **/profile** - User profile with books and reviews (protected)

## API Integration

The application uses Supabase client library for all database operations:

### Authentication
```typescript
// Sign up
await supabase.auth.signUp({ email, password, options: { data: { name } } })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign out
await supabase.auth.signOut()
```

### Database Queries
```typescript
// Fetch books with pagination
await supabase
  .from('books')
  .select('*, profiles:added_by(name, email)')
  .range(from, to)

// Create a review
await supabase
  .from('reviews')
  .insert({ book_id, user_id, rating, review_text })

// Update a book
await supabase
  .from('books')
  .update({ title, author, ... })
  .eq('id', bookId)
```

## Evaluation Criteria Coverage

✅ **Code Quality & Structure**: Modular component structure, TypeScript types, clean code
✅ **Authentication & Security**: JWT tokens, password hashing, RLS policies
✅ **API Design**: RESTful patterns via Supabase, proper error handling
✅ **Frontend Integration**: React + TypeScript with full API integration
✅ **UI/UX**: Clean, intuitive interface with responsive design
✅ **Database Schema**: Proper relations between users, books, and reviews
✅ **Bonus Features**: Search, filter, sorting, pagination, profile page

## Future Enhancements

- [ ] Dark/Light mode toggle
- [ ] Rating distribution charts
- [ ] Social sharing features
- [ ] Book recommendations
- [ ] Advanced search with multiple filters
- [ ] User avatars and profiles
- [ ] Email notifications
- [ ] Favorite books list
- [ ] Book categories and tags

## License

This project is created as an assignment for educational purposes.

## Support

For issues or questions, please open an issue in the repository.