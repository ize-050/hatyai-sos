export type HelpType = 'food' | 'medical' | 'evacuation' | 'boat';
export type Severity = 'low' | 'medium' | 'high';

export interface SOSRequest {
  id: string;
  name: string;
  phone: string;
  helpType: HelpType;
  severity: Severity;
  description: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
  createdAt: Date;
  status: 'pending' | 'in_progress' | 'resolved';
}

export interface Update {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success';
}
