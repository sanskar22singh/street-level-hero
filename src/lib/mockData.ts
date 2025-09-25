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
  },
  {
    id: 'pothole_hunter',
    name: 'Pothole Hunter',
    description: 'Reported a pothole issue',
    icon: '🕳️'
  },
  {
    id: 'light_keeper',
    name: 'Light Keeper',
    description: 'Reported a street light issue',
    icon: '💡'
  },
  {
    id: 'traffic_guardian',
    name: 'Traffic Guardian',
    description: 'Reported a traffic signal issue',
    icon: '🚦'
  },
  {
    id: 'drainage_expert',
    name: 'Drainage Expert',
    description: 'Reported a drainage issue',
    icon: '🌊'
  },
  {
    id: 'safety_champion',
    name: 'Safety Champion',
    description: 'Reported a safety hazard',
    icon: '🛡️'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Submitted a report in the morning',
    icon: '🌅'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Submitted a report in the evening',
    icon: '🦉'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Submitted a report on weekend',
    icon: '⚔️'
  },
  {
    id: 'high_priority',
    name: 'High Priority',
    description: 'Reported a high severity issue',
    icon: '🔴'
  },
  {
    id: 'critical_eye',
    name: 'Critical Eye',
    description: 'Reported a critical severity issue',
    icon: '🚨'
  },
  {
    id: 'location_master',
    name: 'Location Master',
    description: 'Provided precise location details',
    icon: '📍'
  },
  {
    id: 'video_director',
    name: 'Video Director',
    description: 'Included video evidence in report',
    icon: '🎬'
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Submitted 5 reports in a row',
    icon: '👑'
  },
  {
    id: 'blue_tick',
    name: 'Verified Citizen',
    description: 'Earned 150+ points and verified status',
    icon: '✔️'
  },
  {
    id: 'special_1000',
    name: 'Diamond Member',
    description: 'Earned 150+ points - special achievement',
    icon: '💎'
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
  // All severity levels now give 100 points
  return 100;
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

// Function to determine which badge to award for a report submission
export const getBadgeForReport = (report: Partial<Report>, userReports: Report[]): string | null => {
  const currentHour = new Date().getHours();
  const currentDay = new Date().getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;
  
  // Priority-based badge selection (one badge per submission)
  const badgeOptions: Array<{ id: string; condition: boolean; priority: number }> = [
    // First report (highest priority)
    { id: 'first_report', condition: userReports.length === 0, priority: 1 },
    
    // Type-based badges
    { id: 'pothole_hunter', condition: report.type === 'pothole', priority: 2 },
    { id: 'light_keeper', condition: report.type === 'streetlight', priority: 2 },
    { id: 'traffic_guardian', condition: report.type === 'traffic_signal', priority: 2 },
    { id: 'drainage_expert', condition: report.type === 'drainage', priority: 2 },
    { id: 'safety_champion', condition: report.type === 'safety_hazard', priority: 2 },
    
    // Severity-based badges
    { id: 'critical_eye', condition: report.severity === 'critical', priority: 3 },
    { id: 'high_priority', condition: report.severity === 'high', priority: 4 },
    
    // Time-based badges
    { id: 'early_bird', condition: currentHour >= 5 && currentHour < 12, priority: 5 },
    { id: 'night_owl', condition: currentHour >= 18 || currentHour < 5, priority: 5 },
    { id: 'weekend_warrior', condition: isWeekend, priority: 5 },
    
    // Media-based badges
    { id: 'video_director', condition: report.videos && report.videos.length > 0, priority: 6 },
    { id: 'location_master', condition: report.location && report.location.lat && report.location.lng, priority: 7 },
    
    // Consistency badge (check if user has submitted 5 reports in a row)
    { 
      id: 'consistency_king', 
      condition: userReports.length >= 4 && userReports.slice(-4).every(r => 
        new Date(r.submittedAt).getTime() > new Date().getTime() - (5 * 24 * 60 * 60 * 1000)
      ), 
      priority: 8 
    },
    
    // Fallback badges for any report
    { id: 'detail_oriented', condition: report.description && report.description.length > 100, priority: 9 },
    { id: 'photo_master', condition: report.images && report.images.length > 0, priority: 10 },
  ];
  
  // Find the highest priority badge that meets its condition
  const eligibleBadges = badgeOptions.filter(badge => badge.condition);
  if (eligibleBadges.length === 0) return null;
  
  // Sort by priority (lower number = higher priority) and return the first one
  eligibleBadges.sort((a, b) => a.priority - b.priority);
  return eligibleBadges[0].id;
};