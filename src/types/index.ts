export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  city: string;
  points: number;
  level: 'Bronze' | 'Silver' | 'Gold';
  badges: string[];
  joinDate: string;
  // Optional password for demo/local signup users stored in localStorage
  password?: string;
}

export interface Report {
  id: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  type: 'pothole' | 'streetlight' | 'traffic_signal' | 'drainage' | 'road_damage' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'under_review' | 'in_progress' | 'completed' | 'rejected';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  images: string[];
  videos: string[];
  submittedAt: string;
  assignedContractor?: string;
  expectedCompletion?: string;
  actualCompletion?: string;
  points: number;
}

export interface Contractor {
  id: string;
  name: string;
  email: string;
  specializations: string[];
  rating: number;
  completedJobs: number;
  avgCompletionTime: number;
}

export interface GameStats {
  totalReports: number;
  completedReports: number;
  pointsEarned: number;
  level: string;
  nextLevelPoints: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  points: number;
  level: string;
  reportCount: number;
}