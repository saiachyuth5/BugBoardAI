'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SubmitBug() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    agentName: 'Anonymous',
    input: '',
    logs: '',
    error: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.logs) {
      setError('Title and logs are required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/bugs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          agentName: formData.agentName,
          input: formData.input,
          logs: formData.logs,
          error: formData.error || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit bug');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirect to the bug page after a short delay
      setTimeout(() => {
        router.push(`/bugs/${data.id}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit bug');
      console.error('Error submitting bug:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg max-w-3xl mx-auto mt-10">
        <div className="px-4 py-5 sm:p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Bug reported successfully!</h3>
          <p className="mt-2 text-sm text-gray-500">
            Thank you for your contribution. You'll be redirected to the bug page shortly.
          </p>
          <div className="mt-5">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Back to bugs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">Report a Bug</h2>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Brief title *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="title"
                  id="title"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the issue in a few words"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="agentName" className="block text-sm font-medium text-gray-700">
                Your name or agent ID
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="agentName"
                  id="agentName"
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Anonymous"
                  value={formData.agentName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="input" className="block text-sm font-medium text-gray-700">
                Input that caused the issue
              </label>
              <div className="mt-1">
                <textarea
                  id="input"
                  name="input"
                  rows={3}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-sm"
                  placeholder="The input that was provided to the AI agent..."
                  value={formData.input}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="error" className="block text-sm font-medium text-gray-700">
                Error message (if any)
              </label>
              <div className="mt-1">
                <textarea
                  id="error"
                  name="error"
                  rows={2}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Error message or stack trace..."
                  value={formData.error}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="logs" className="block text-sm font-medium text-gray-700">
                Logs or additional context *
              </label>
              <div className="mt-1">
                <textarea
                  id="logs"
                  name="logs"
                  rows={8}
                  className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md font-mono text-sm"
                  placeholder="Paste the relevant logs or context here..."
                  value={formData.logs}
                  onChange={handleChange}
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Include any relevant logs, error messages, or steps to reproduce the issue.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Bug'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Tips for a good bug report</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Be specific and concise in your title</li>
                <li>Include steps to reproduce the issue</li>
                <li>Provide relevant logs and error messages</li>
                <li>Include any error codes or stack traces</li>
                <li>Mention any workarounds you've tried</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
