import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export interface Chunk {
  content: string;
  source: string;
  test_name?: string;
  score: number;
}

export interface MedicalAnalysis {
  patient_info: { 
    name?: string; 
    age_gender_raw?: string; 
    registration_date?: string; 
    report_datetime?: string;
  };
  report_type: string;
  abnormal: Array<{
    name: string;
    result: any;
    unit: string;
    flag: string;
    ref_low: any;
    ref_high: any;
  }>;
}

export interface AskResponse {
  answer: string;
  chunks: Chunk[];
}

export const askQuestion = async (question: string): Promise<AskResponse> => {
  const response = await axios.post(`${API_BASE_URL}/ask`, { question });
  return response.data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE_URL}/upload`, formData);
  return response.data;
};