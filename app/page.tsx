'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Compare Products,
          <br />
          Make Smarter Choices
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Find and compare the best phones and cameras with detailed specifications
        </p>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for products..."
            className="pl-12 h-14 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery) {
                window.location.href = `/products/phones?q=${searchQuery}`;
              }
            }}
          />
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
        <Link
          href="/products/phones"
          className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-blue-500 to-blue-700 p-8 flex flex-col justify-end">
            <h2 className="text-3xl font-bold text-white mb-2">Smartphones</h2>
            <p className="text-blue-100">Compare the latest phones</p>
          </div>
        </Link>

        <Link
          href="/products/cameras"
          className="group relative overflow-hidden rounded-lg border-2 border-border hover:border-primary transition-all duration-300"
        >
          <div className="aspect-[4/3] bg-gradient-to-br from-purple-500 to-purple-700 p-8 flex flex-col justify-end">
            <h2 className="text-3xl font-bold text-white mb-2">Cameras</h2>
            <p className="text-purple-100">Find your perfect camera</p>
          </div>
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Side-by-Side Comparison</h3>
          <p className="text-muted-foreground">
            Compare up to 4 products with detailed spec breakdowns
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Smart Search</h3>
          <p className="text-muted-foreground">
            Fast, filterable search to find exactly what you need
          </p>
        </div>

        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">AI Assistant</h3>
          <p className="text-muted-foreground">
            Get personalized recommendations based on your needs
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <Link href="/assistant">
          <Button size="lg" className="text-lg px-8">
            Try AI Assistant
          </Button>
        </Link>
      </div>
    </div>
  );
}
