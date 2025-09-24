import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Trophy, 
  MapPin, 
  Camera, 
  Send, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  LogOut,
  FileText,
  Award,
  Target,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockReports, mockLeaderboard, getProgressToNextLevel, calculateLevel } from "@/lib/mockData";
import { Report } from "@/types";

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    location: ""
  });

  useEffect(() => {
    if (!user || user.role !== 'citizen') {
      navigate('/citizen/auth');
      return;
    }
    
    // Load user's reports
    const userReports = mockReports.filter(r => r.citizenId === user.id);
    setReports(userReports);
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock submission
    toast({
      title: "Report Submitted! 🎉",
      description: `+${newReport.severity === 'critical' ? 200 : 150} points earned!`,
    });

    // Reset form
    setNewReport({
      title: "",
      description: "",
      type: "",
      severity: "",
      location: ""
    });
  };

  const progress = getProgressToNextLevel(user.points);
  const statusColors = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800", 
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text">
                🚧 Road Reporter
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="font-semibold">{user.name}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          {/* Level Card */}
          <Card className="p-6 hover-lift">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                <span className="font-semibold">Level</span>
              </div>
              <Badge className={`badge-${user.level.toLowerCase()}`}>
                {user.level}
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(progress.percentage)}%</span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {progress.current} / {progress.required} XP
              </div>
            </div>
          </Card>

          {/* Points Card */}
          <Card className="p-6 hover-lift">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-accent" />
              <span className="font-semibold">Total Points</span>
            </div>
            <div className="text-3xl font-bold gradient-text">
              {user.points.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Lifetime earnings
            </p>
          </Card>

          {/* Reports Card */}
          <Card className="p-6 hover-lift">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">Reports</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {reports.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Issues reported
            </p>
          </Card>

          {/* Badges Card */}
          <Card className="p-6 hover-lift">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-secondary" />
              <span className="font-semibold">Badges</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {user.badges.length}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Achievements unlocked
            </p>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="report" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="report" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Report Issue
            </TabsTrigger>
            <TabsTrigger value="my-reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              My Reports
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Report Issue Tab */}
          <TabsContent value="report">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6">Report a New Issue</h2>
                
                <form onSubmit={handleSubmitReport} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Issue Title</Label>
                      <Input
                        id="title"
                        placeholder="Brief description of the issue"
                        value={newReport.title}
                        onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Issue Type</Label>
                      <Select onValueChange={(value) => setNewReport({ ...newReport, type: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pothole">Pothole</SelectItem>
                          <SelectItem value="streetlight">Street Light</SelectItem>
                          <SelectItem value="traffic_signal">Traffic Signal</SelectItem>
                          <SelectItem value="drainage">Drainage</SelectItem>
                          <SelectItem value="road_damage">Road Damage</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="severity">Severity Level</Label>
                      <Select onValueChange={(value) => setNewReport({ ...newReport, severity: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Low Priority (+50 pts)</SelectItem>
                          <SelectItem value="medium">🟡 Medium Priority (+100 pts)</SelectItem>
                          <SelectItem value="high">🟠 High Priority (+150 pts)</SelectItem>
                          <SelectItem value="critical">🔴 Critical (+200 pts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="flex gap-2">
                        <Input
                          id="location"
                          placeholder="Enter address or description"
                          value={newReport.location}
                          onChange={(e) => setNewReport({ ...newReport, location: e.target.value })}
                          required
                        />
                        <Button type="button" variant="outline" size="icon">
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about the issue..."
                      rows={4}
                      value={newReport.description}
                      onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-4">
                    <Label>Upload Photos (Optional)</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Click to upload photos or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Photos help verify issues and earn bonus points!
                      </p>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full">
                    <Send className="w-5 h-5 mr-2" />
                    Submit Report & Earn Points
                  </Button>
                </form>
              </Card>
            </motion.div>
          </TabsContent>

          {/* My Reports Tab */}
          <TabsContent value="my-reports">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">My Reports</h2>
                
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id} className="p-4 hover-lift">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-lg">{report.title}</h3>
                        <Badge className={statusColors[report.status]}>
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <p className="text-muted-foreground mb-3">
                        {report.description}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>📍 {report.location.address}</span>
                          <span>🏷️ {report.type.replace('_', ' ')}</span>
                          <span>⚡ {report.severity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-accent" />
                          <span>+{report.points} pts</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                  
                  {reports.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No reports yet. Start by reporting your first issue!
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Community Leaderboard</h2>
                
                <div className="space-y-3">
                  {mockLeaderboard.map((entry) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.userId === user.id ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-primary-foreground font-bold">
                          {entry.rank <= 3 ? 
                            (entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉') : 
                            entry.rank
                          }
                        </div>
                        <div>
                          <p className="font-semibold">{entry.userName}</p>
                          <p className="text-sm text-muted-foreground">
                            {entry.reportCount} reports • {entry.level} level
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold gradient-text">
                          {entry.points.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Profile & Achievements</h2>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                    <div className="space-y-4">
                      <div>
                        <Label>Name</Label>
                        <p className="text-foreground font-medium">{user.name}</p>
                      </div>
                      <div>
                        <Label>Email</Label>
                        <p className="text-muted-foreground">{user.email}</p>
                      </div>
                      <div>
                        <Label>City</Label>
                        <p className="text-muted-foreground">{user.city}</p>
                      </div>
                      <div>
                        <Label>Member Since</Label>
                        <p className="text-muted-foreground">
                          {new Date(user.joinDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Earned Badges</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {user.badges.map((badge, index) => (
                        <div key={badge} className="glass p-4 rounded-lg text-center">
                          <div className="text-2xl mb-2">
                            {badge === 'first_report' ? '🎯' :
                             badge === 'quick_reporter' ? '⚡' :
                             badge === 'community_hero' ? '🏆' : '🎖️'}
                          </div>
                          <p className="text-sm font-medium">
                            {badge.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                      ))}
                      
                      {user.badges.length === 0 && (
                        <div className="col-span-2 text-center py-8">
                          <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            No badges earned yet. Keep reporting to unlock achievements!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CitizenDashboard;