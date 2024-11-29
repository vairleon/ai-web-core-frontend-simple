'use client';

import { useState, useEffect } from 'react';
import { User, UserExtraInfo } from '@/types/api';
import api from '@/utils/api';
import Image from 'next/image';
import { FaCoins, FaEdit } from 'react-icons/fa';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [lastName, setLastName] = useState('');
  const [extraInfo, setExtraInfo] = useState<UserExtraInfo>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await api.getProfile();
        setUser(userData);
        setLastName(userData.lastName || '');
        setExtraInfo(userData.extraInfo || {});
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <div className="flex justify-center p-4">Loading...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!user) return <div className="p-4">No user data</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="absolute -bottom-16 left-8">
            <div className="relative w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-white">
              <Image
                src={user.extraInfo?.profileImage || '/imageIcon.png'}
                alt="Profile"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
          <div className="absolute right-8 top-8 flex items-center bg-white/90 rounded-full px-4 py-2 shadow-md">
            <FaCoins className="text-yellow-500 mr-2" />
            <span className="font-semibold">{user.credit || 0} Credits</span>
          </div>
        </div>

        <div className="pt-20 px-8 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.lastName}
              </h1>
              <p className="text-gray-500 mt-1">{user.userName}</p>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-gray-700">About Me</h2>
              <button
                onClick={() => setIsEditingDescription(!isEditingDescription)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            </div>
            {isEditingDescription ? (
              <textarea
                value={extraInfo.description || ''}
                onChange={(e) => setExtraInfo({ ...extraInfo, description: e.target.value })}
                className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 p-4 min-h-[120px] text-base"
                placeholder="Write something about yourself..."
                style={{ textIndent: '0.5rem', lineHeight: '1.5' }}
              />
            ) : (
              <p className="mt-2 text-gray-600 pl-2">
                {extraInfo.description || 'Click edit to add a description'}
              </p>
            )}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={user.phone || 'Not set'}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 px-4 py-2 shadow-sm bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => api.updateLastName(lastName).then(setUser)}
                    className="mt-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                  >
                    Modification
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={extraInfo.gender || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, gender: e.target.value as 'male' | 'female' | 'other' })}
                  className="mt-1 block w-full rounded-md border-gray-300 px-4 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Birthday</label>
                <input
                  type="date"
                  value={extraInfo.birthday?.toString().split('T')[0] || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, birthday: new Date(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={extraInfo.country || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, country: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={extraInfo.city || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={extraInfo.location || ''}
                  onChange={(e) => setExtraInfo({ ...extraInfo, location: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => api.updateProfile(extraInfo).then(setUser)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 