import type { Course } from '../types';

export const initialCourses: Course[] = [
  {
    id: 'course-1',
    title: 'IDC (ISKCON DESIPLE COURSE)',
    description: 'No description provided.',
    status: 'UPCOMING',
    dateRange: '10/06/2026 - 14/06/2026',
    startDate: '2026-06-10',
    endDate: '2026-06-14',
    instructor: 'SHYAMSUNDAR PRABHU',
    fees: 400,
    participants: [
      { id: 'p1', name: 'Arjun Das', contact: '+91 98765 43210', paymentStatus: 'PAID', joinedDate: '2026-05-15' },
      { id: 'p2', name: 'Radha Priya Devi Dasi', contact: '+91 98123 45678', paymentStatus: 'PAID', joinedDate: '2026-05-18' },
      { id: 'p3', name: 'Govinda Murari Das', contact: '+91 97234 56789', paymentStatus: 'PENDING', joinedDate: '2026-05-20' },
      { id: 'p4', name: 'Tulasi Devi Dasi', contact: '+91 96345 67890', paymentStatus: 'PAID', joinedDate: '2026-05-22' }
    ]
  },
  {
    id: 'course-2',
    title: 'Bhakti Sastri 2026',
    description: 'No description provided.',
    status: 'ONGOING',
    dateRange: 'N/A',
    startDate: '2026-01-15',
    endDate: '2026-12-20',
    instructor: 'HG',
    fees: 0,
    participants: [
      { id: 'p5', name: 'Madhavananda Das', contact: '+91 95456 78901', paymentStatus: 'EXEMPTED', joinedDate: '2026-01-10' },
      { id: 'p6', name: 'Gopika Devi Dasi', contact: '+91 94567 89012', paymentStatus: 'EXEMPTED', joinedDate: '2026-01-12' },
      { id: 'p7', name: 'Jagannath Prasad Das', contact: '+91 93678 90123', paymentStatus: 'EXEMPTED', joinedDate: '2026-01-14' }
    ]
  }
];
