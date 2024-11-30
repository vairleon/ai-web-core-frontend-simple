'use client';

import { useEffect, useState } from 'react';
import { TaskTemplate } from '@/types/api';
import api from '@/utils/api';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductsPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Product routes mapping
  const productRoutes: Record<string, string> = {
    'removebg': '/remove-bg',
    'portrait': "/portrait"
    // Add more product routes here as they become available
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const data = await api.getPublicTemplates();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Available Products</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Link 
            key={template.id} 
            href={productRoutes[template.name] || '#'}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48 w-full">
              <Image
                src={template.meta?.image || '/og-image.png'}
                alt={template.name}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/og-image.png';
                }}
              />
            </div>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{template.name}</h2>
              <p className="text-gray-600 mb-4">{template.meta?.description || 'No description available'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 