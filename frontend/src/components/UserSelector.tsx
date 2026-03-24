import React, { useState } from 'react';
import { localStorageUtils } from '../utils/localStorage';

const UserSelector: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('2');

  const users = [
    { id: '1', name: 'Admin Librarian', email: 'admin@gmail.com', role: 'admin' },
    { id: '2', name: 'Nguyen Van A', email: 'reader1@gmail.com', role: 'reader' },
    { id: '023a', name: 'sonnp', email: 'anhtuankr9122004@gmail.com', role: 'user' },
    { id: '6b1a', name: 'tuanq124', email: 'anh9122004@gmail.com', role: 'user' },
    { id: '4780', name: 'đạt đẹp trai', email: 'tiendatyyy2005@gmail.com', role: 'user' },
    { id: '77d9', name: 'tiến đạt', email: 'dat@gmail.com', role: 'user' }
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    localStorageUtils.setCurrentUserId(userId);
    window.location.reload(); // Reload để load profile mới
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Select User (Demo)</h3>
      <select
        value={selectedUserId}
        onChange={(e) => handleUserSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.role})
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 mt-1">
        Current: {users.find(u => u.id === selectedUserId)?.name}
      </p>
    </div>
  );
};

export default UserSelector;

