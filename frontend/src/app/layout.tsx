import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BugBoard AI',
  description: 'When your AI agent breaks, let the internet fix it.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-primary-600">BugBoard AI</span>
                </Link>
                <p className="ml-4 text-sm text-gray-500 hidden md:block">
                  When your AI agent breaks, let the internet fix it.
                </p>
              </div>
              <nav className="flex space-x-4">
                <Link href="/" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                  Bugs
                </Link>
                <Link href="/submit" className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
                  Submit Bug
                </Link>
                <Link href="/admin" className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium">
                  Admin
                </Link>
              </nav>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} BugBoard AI. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
