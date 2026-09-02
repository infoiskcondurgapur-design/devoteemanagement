export type CourseStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED';

export interface Participant {
  id: string;
  name: string;
  contact: string;
  paymentStatus: 'PAID' | 'PENDING' | 'EXEMPTED';
  joinedDate: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  status: CourseStatus;
  dateRange: string;
  startDate?: string;
  endDate?: string;
  instructor: string;
  fees: number;
  participants: Participant[];
}
