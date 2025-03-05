import type { Metadata } from './types';

// Define the query item interface
export interface QueryItem {
  id: string;
  text: string;
  category: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  responseText: string;
  metadata: Metadata | null;
  loading: boolean;
  error: any;
  saveStatus: {
    saved: boolean;
    error: string | null;
  };
}

// Define the store state interface
export interface QueryQueueState {
  queue: QueryItem[];
  activeQueries: string[];
  maxConcurrent: number;
  processing: boolean;
  batchId: string | null;
}

// Helper function to generate UUID
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 