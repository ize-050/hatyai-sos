'use client';

import { supabase, DbSOSRequest } from './supabase';
import { SOSRequest, HelpType, Severity } from './types';

// Transform database record to app type
const transformRequest = (db: DbSOSRequest): SOSRequest => ({
  id: db.id,
  name: db.name || 'ไม่ระบุชื่อ',
  phone: db.phone,
  helpType: db.help_type as HelpType,
  severity: db.severity as Severity,
  description: db.description || '',
  latitude: db.latitude,
  longitude: db.longitude,
  photoUrl: db.photo_url || undefined,
  status: db.status,
  createdAt: new Date(db.created_at),
});

// Fetch all SOS requests from Supabase
export const getStoredRequests = async (): Promise<SOSRequest[]> => {
  const { data, error } = await supabase
    .from('sos_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    return [];
  }

  return (data || []).map(transformRequest);
};

// Add new SOS request to Supabase
export const addRequest = async (
  request: Omit<SOSRequest, 'id' | 'createdAt' | 'status'>
): Promise<SOSRequest | null> => {
  const { data, error } = await supabase
    .from('sos_requests')
    .insert({
      name: request.name,
      phone: request.phone,
      help_type: request.helpType,
      severity: request.severity,
      description: request.description,
      latitude: request.latitude,
      longitude: request.longitude,
      photo_url: request.photoUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding request:', error);
    return null;
  }

  return transformRequest(data);
};

// Fetch updates from Supabase
export const getUpdates = async () => {
  const { data, error } = await supabase
    .from('updates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching updates:', error);
    return [];
  }

  return data || [];
};
