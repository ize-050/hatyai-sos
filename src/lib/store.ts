'use client';

import { SOSRequest } from './types';
import { mockSOSRequests } from './mock-data';

// Client-side store using localStorage for persistence
const STORAGE_KEY = 'hatyai-crisis-requests';

export const getStoredRequests = (): SOSRequest[] => {
  if (typeof window === 'undefined') return mockSOSRequests;
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockSOSRequests));
    return mockSOSRequests;
  }
  
  return JSON.parse(stored).map((r: SOSRequest) => ({
    ...r,
    createdAt: new Date(r.createdAt),
  }));
};

export const addRequest = (request: Omit<SOSRequest, 'id' | 'createdAt' | 'status'>): SOSRequest => {
  const requests = getStoredRequests();
  const newRequest: SOSRequest = {
    ...request,
    id: Date.now().toString(),
    createdAt: new Date(),
    status: 'pending',
  };
  
  const updated = [newRequest, ...requests];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newRequest;
};
