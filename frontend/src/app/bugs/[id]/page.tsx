'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface Bug {
  id: string;
  title: string;
  agent_name: string;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix';
  bounty: number;
  upvotes: number;
  created_at: string;
  input: string;
  logs: string;
  error_message?: string;
  fix_url?: string;
  fix_explanation?: string;
  resolved_at?: string;
}

export default function BugDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [bug, setBug] = useState<Bug | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fixUrl, setFixUrl] = useState('');
  const [explanation, setExplanation] = useState('');
  const [showFixForm, setShowFixForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchBug = async () => {
      try {
        const response = await fetch(`/api/bugs/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch bug');
        }
        const data = await response.json();
        setBug(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching bug:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if user is admin (this is a simplified check)
    // In a real app, you'd verify this with your auth system
    const checkAdmin = async () => {
      // This is a placeholder - implement proper admin check
      const adminStatus = localStorage.getItem('isAdmin') === 'true';
      setIsAdmin(adminStatus);
    };

    fetchBug();
    checkAdmin();
  }, [id]);

  const handleSubmitFix = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fixUrl || !explanation) {
      setError('Please provide both a fix URL and explanation');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bugs/${id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fixUrl,
          explanation,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit fix');
      }

      const data = await response.json();
      setBug(data);
      setShowFixForm(false);
      setFixUrl('');
      setExplanation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit fix');
      console.error('Error submitting fix:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!isAdmin) return;
    
    try {
      const response = await fetch(`/api/bugs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const data = await response.json();
      setBug(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const handleUpvote = async () => {
    try {
      const response = await fetch(`/api/bugs/${id}/upvote`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to upvote');
      }

      const data = await response.json();
      setBug(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upvote');
      console.error('Error upvoting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !bug) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error || 'Bug not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-purple-100 text-purple-800';
      case 'wont_fix':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <div className="flex">
                  <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
                    Bugs
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="h-5 w-5 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">{bug.title.substring(0, 30)}{bug.title.length > 30 ? '...' : ''}</span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="mt-2 flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">{bug.title}</h1>
            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(bug.status)}`}>
              {bug.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0">
          <button
            onClick={handleUpvote}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Upvote ({bug.upvotes})
          </button>
          <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            ${bug.bounty} Bounty
          </span>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg leading-6 font-medium text-gray-900">Bug Details</h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Reported by {bug.agent_name} on {formatDate(bug.created_at)}
              </p>
            </div>
            {isAdmin && (
              <div className="mt-4 sm:mt-0">
                <label htmlFor="status" className="sr-only">Status</label>
                <select
                  id="status"
                  name="status"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                  value={bug.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="wont_fix">Won't Fix</option>
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Input</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded">
                {bug.input}
              </dd>
            </div>
            {bug.error_message && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Error</dt>
                <dd className="mt-1 text-sm text-red-600 sm:mt-0 sm:col-span-2 whitespace-pre-wrap font-mono bg-red-50 p-3 rounded overflow-x-auto">
                  {bug.error_message}
                </dd>
              </div>
            )}
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Logs</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                  <pre className="text-xs"><code>{bug.logs}</code></pre>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {bug.status === 'resolved' && bug.fix_url && bug.fix_explanation && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">This bug has been resolved!</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  <a href={bug.fix_url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    View the fix on GitHub ↗
                  </a>
                </p>
                <div className="mt-2 p-3 bg-white rounded-md">
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {bug.fix_explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {bug.status !== 'resolved' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              {showFixForm ? 'Submit a Fix' : 'Have a solution?'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {showFixForm 
                ? 'Provide a link to a GitHub PR or commit with the fix and a brief explanation.'
                : 'Help the community by submitting a fix for this bug.'}
            </p>
          </div>
          
          {!showFixForm ? (
            <div className="px-4 py-5 sm:p-6 text-center">
              <button
                onClick={() => setShowFixForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Submit a Fix
              </button>
            </div>
          ) : (
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmitFix} className="space-y-4">
                <div>
                  <label htmlFor="fixUrl" className="block text-sm font-medium text-gray-700">
                    Fix URL (GitHub PR or commit)
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="fixUrl"
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="https://github.com/username/repo/pull/123"
                      value={fixUrl}
                      onChange={(e) => setFixUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
                    Explanation
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="explanation"
                      rows={4}
                      className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Describe the fix and how it resolves the issue..."
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFixForm(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Fix'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
