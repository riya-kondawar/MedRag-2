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

export type ChatMessage = {
  role: "user" | "ai";
  text: string;
  chunks?: Chunk[];
};
