import { User, Report, Contractor, Badge, LeaderboardEntry } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'citizen',
    city: 'San Francisco',
    points: 2450,
    level: 'Gold',
    badges: ['first_report', 'quick_reporter', 'community_hero'],
    joinDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike@example.com',
    role: 'citizen',
    city: 'San Francisco',
    points: 1200,
    level: 'Silver',
    badges: ['first_report', 'photo_master'],
    joinDate: '2024-03-01',
  },
  {
    id: 'admin1',
    name: 'Jessica Martinez',
    email: 'admin@city.gov',
    role: 'admin',
    city: 'San Francisco',
    points: 0,
    level: 'Bronze',
    badges: [],
    joinDate: '2024-01-01',
  }
];

export const mockReports: Report[] = [
  {
    id: '1',
    citizenId: '1',
    citizenName: 'Sarah Johnson',
    title: 'Large pothole on Main Street',
    description: 'Dangerous pothole causing vehicle damage near intersection with Oak Street.',
    type: 'pothole',
    severity: 'high',
    status: 'in_progress',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      address: '123 Main Street, San Francisco, CA'
    },
    images: ['pothole1.jpg'],
    videos: [],
    submittedAt: '2024-09-20T10:30:00Z',
    assignedContractor: 'ABC Road Works',
    expectedCompletion: '2024-09-25T17:00:00Z',
    points: 150,
  },
  {
    id: '2',
    citizenId: '2',
    citizenName: 'Mike Chen',
    title: 'Broken street light',
    description: 'Street light has been out for 3 days, creating safety hazard.',
    type: 'streetlight',
    severity: 'medium',
    status: 'under_review',
    location: {
      lat: 37.7849,
      lng: -122.4094,
      address: '456 Pine Street, San Francisco, CA'
    },
    images: ['streetlight1.jpg'],
    videos: [],
    submittedAt: '2024-09-22T14:15:00Z',
    points: 100,
  },
  {
    id: '3',
    citizenId: '1',
    citizenName: 'Sarah Johnson',
    title: 'Traffic signal malfunction',
    description: 'Traffic light stuck on red in all directions causing major delays.',
    type: 'traffic_signal',
    severity: 'critical',
    status: 'completed',
    location: {
      lat: 37.7649,
      lng: -122.4294,
      address: '789 Market Street, San Francisco, CA'
    },
    images: ['traffic1.jpg'],
    videos: [],
    submittedAt: '2024-09-18T08:45:00Z',
    assignedContractor: 'City Electric Services',
    expectedCompletion: '2024-09-18T12:00:00Z',
    actualCompletion: '2024-09-18T11:30:00Z',
    points: 200,
  }
];

export const mockContractors: Contractor[] = [
  {
    id: '1',
    name: 'ABC Road Works',
    phone: '+1 (415) 555-0123',
    specializations: ['pothole', 'road_damage'],
    rating: 4.5,
    completedJobs: 127,
    avgCompletionTime: 2.3,
  },
  {
    id: '2',
    name: 'City Electric Services',
    phone: '+1 (415) 555-0456',
    specializations: ['streetlight', 'traffic_signal'],
    rating: 4.8,
    completedJobs: 89,
    avgCompletionTime: 1.5,
  },
  {
    id: '3',
    name: 'Drainage Solutions Inc',
    phone: '+1 (415) 555-0789',
    specializations: ['drainage'],
    rating: 4.2,
    completedJobs: 56,
    avgCompletionTime: 3.1,
  }
];

export const mockBadges: Badge[] = [
  {
    id: 'first_report',
    name: 'First Reporter',
    description: 'Submitted your first issue report',
    icon: '🎯'
  },
  {
    id: 'quick_reporter',
    name: 'Quick Reporter',
    description: 'Submitted 10 reports in one month',
    icon: '⚡'
  },
  {
    id: 'community_hero',
    name: 'Community Hero',
    description: 'Earned 2000+ points helping your community',
    icon: '🏆'
  },
  {
    id: 'photo_master',
    name: 'Photo Master',
    description: 'Included helpful photos in 20+ reports',
    icon: '📸'
  },
  {
    id: 'detail_oriented',
    name: 'Detail Oriented',
    description: 'Provided detailed descriptions in 15+ reports',
    icon: '🔍'
  }
];

export const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    userId: '1',
    userName: 'Sarah Johnson',
    points: 2450,
    level: 'Gold',
    reportCount: 15
  },
  {
    rank: 2,
    userId: '3',
    userName: 'Alex Rodriguez',
    points: 1890,
    level: 'Silver',
    reportCount: 12
  },
  {
    rank: 3,
    userId: '2',
    userName: 'Mike Chen',
    points: 1200,
    level: 'Silver',
    reportCount: 8
  },
  {
    rank: 4,
    userId: '4',
    userName: 'Emma Davis',
    points: 950,
    level: 'Bronze',
    reportCount: 6
  },
  {
    rank: 5,
    userId: '5',
    userName: 'David Kim',
    points: 720,
    level: 'Bronze',
    reportCount: 5
  }
];

// Helper functions for game mechanics
export const getPointsForSeverity = (severity: Report['severity']): number => {
  const points = {
    low: 50,
    medium: 100,
    high: 150,
    critical: 200
  };
  return points[severity];
};

export const getLevelRequirements = () => ({
  Bronze: { min: 0, max: 999 },
  Silver: { min: 1000, max: 2499 },
  Gold: { min: 2500, max: Infinity }
});

export const calculateLevel = (points: number): 'Bronze' | 'Silver' | 'Gold' => {
  if (points >= 2500) return 'Gold';
  if (points >= 1000) return 'Silver';
  return 'Bronze';
};

export const getProgressToNextLevel = (points: number) => {
  const level = calculateLevel(points);
  if (level === 'Gold') return { current: points, required: 2500, percentage: 100 };
  if (level === 'Silver') return { 
    current: points - 1000, 
    required: 1500, 
    percentage: Math.min(((points - 1000) / 1500) * 100, 100) 
  };
  return { 
    current: points, 
    required: 1000, 
    percentage: (points / 1000) * 100 
  };
};