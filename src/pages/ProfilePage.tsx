import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, Book, Review } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Star, MessageSquare } from 'lucide-react';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<(Review & { books: Book })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'reviews'>('books');

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [booksRes, reviewsRes] = await Promise.all([
        supabase
          .from('books')
          .select('*')
          .eq('added_by', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('*, books(*)')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
      ]);

      if (booksRes.error) throw booksRes.error;
      if (reviewsRes.error) throw reviewsRes.error;

      setBooks(booksRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600 mb-4">{profile?.email}</p>
          <div className="flex gap-8 text-sm">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">
                <span className="font-semibold">{books.length}</span> Books Added
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-gray-700">
                <span className="font-semibold">{reviews.length}</span> Reviews Written
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('books')}
                className={`flex-1 py-4 px-6 text-sm font-medium ${
                  activeTab === 'books'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Books ({books.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex-1 py-4 px-6 text-sm font-medium ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Reviews ({reviews.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'books' ? (
              books.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">You haven't added any books yet.</p>
                  <Link
                    to="/books/new"
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Your First Book
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {books.map((book) => (
                    <Link
                      key={book.id}
                      to={`/books/${book.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                      <p className="text-gray-700 text-sm line-clamp-2 mb-2">{book.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{book.genre}</span>
                        <span>{book.published_year}</span>
                        <span>Added {new Date(book.created_at).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">You haven't written any reviews yet.</p>
                <Link
                  to="/"
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Browse Books
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Link
                    key={review.id}
                    to={`/books/${review.book_id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{review.books.title}</h3>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm line-clamp-2 mb-2">{review.review_text}</p>
                    <p className="text-xs text-gray-500">
                      Reviewed on {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
