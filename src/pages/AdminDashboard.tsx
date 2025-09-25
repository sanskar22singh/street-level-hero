import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MapIcon, 
  BarChart3, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  LogOut,
  Settings,
  TrendingUp,
  FileText,
  UserCheck,
  Bot
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockContractors } from "@/lib/mockData";
import { Report, Contractor } from "@/types";
import ReportAnalysisChatbot from "@/components/ReportAnalysisChatbot";
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [contractorSearch, setContractorSearch] = useState("");
  const [newContractor, setNewContractor] = useState({
    name: "",
    phone: "",
    specializations: "",
    rating: 4.5,
    completedJobs: 0,
    avgCompletionTime: 1.0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [reportFlags, setReportFlags] = useState<Record<string, { isFake: boolean; confidence: number; reasons: string[] }>>({});

  useEffect(() => {
    // Wait for auth to resolve before guarding
    if (isLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/admin/auth');
      return;
    }
    // Load reports strictly from localStorage (user-submitted only) and clean any demo data remnants
    try {
      const storedRaw = localStorage.getItem('roadReportUserReports');
      const storedReports: Report[] = storedRaw ? JSON.parse(storedRaw) : [];
      const demoIds = new Set(['1','2','3']);
      const looksLikeDemo = (r: Report) => {
        // Real uploads in this app are data URLs; mock had file names like pothole1.jpg
        const hasNonDataImages = Array.isArray(r.images) && r.images.some((src) => typeof src === 'string' && !src.startsWith('data:'));
        const knownNames = r.citizenName === 'Sarah Johnson' || r.citizenName === 'Mike Chen';
        return demoIds.has(String(r.id)) || hasNonDataImages || knownNames;
      };
      const cleaned = storedReports.filter(r => !looksLikeDemo(r));
      setReports(cleaned);
      if (cleaned.length !== storedReports.length) {
        try { localStorage.setItem('roadReportUserReports', JSON.stringify(cleaned)); } catch {}
      }
    } catch {
      setReports([]);
    }
    // Load contractors from localStorage, merge with mock data if none exist
    try {
      const contractorsRaw = localStorage.getItem('roadReportContractors');
      const storedContractors: Contractor[] = contractorsRaw ? JSON.parse(contractorsRaw) : [];
      
      // If no contractors exist, initialize with mock data
      if (storedContractors.length === 0) {
        const initialContractors = [...mockContractors];
        setContractors(initialContractors);
        try { localStorage.setItem('roadReportContractors', JSON.stringify(initialContractors)); } catch {}
      } else {
        setContractors(storedContractors);
      }
    } catch {
      // Fallback to mock contractors if parsing fails
      setContractors([...mockContractors]);
      try { localStorage.setItem('roadReportContractors', JSON.stringify(mockContractors)); } catch {}
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'roadReportUserReports') {
        try {
          const next: Report[] = e.newValue ? JSON.parse(e.newValue) : [];
          setReports(next);
        } catch {
          // ignore parse errors
        }
      }
    };
    const refreshFromLocalStorage = () => {
      try {
        const raw = localStorage.getItem('roadReportUserReports');
        const parsed: Report[] = raw ? JSON.parse(raw) : [];
        setReports(parsed);
      } catch {}
    };
    const onFocus = () => refreshFromLocalStorage();
    const onVisibility = () => { if (!document.hidden) refreshFromLocalStorage(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin…</div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStatusUpdate = (reportId: string, newStatus: string) => {
    setReports(prev => {
      const updated = prev.map(report => 
        report.id === reportId ? { ...report, status: newStatus as Report['status'] } : report
      );
      try {
        localStorage.setItem('roadReportUserReports', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    
    toast({
      title: "Status Updated",
      description: `Report status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  const handleAssignContractor = (reportId: string, contractorName: string) => {
    setReports(prev => {
      const updated = prev.map(report => 
        report.id === reportId ? { ...report, assignedContractor: contractorName } : report
      );
      try {
        localStorage.setItem('roadReportUserReports', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    
    toast({
      title: "Contractor Assigned",
      description: `${contractorName} has been assigned to the report`,
    });
  };

  const handleDeleteReport = (reportId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this report?');
    if (!confirmed) return;
    setReports(prev => {
      const updated = prev.filter(r => r.id !== reportId);
      try {
        localStorage.setItem('roadReportUserReports', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    toast({ title: 'Report deleted', description: 'The report has been removed.' });
  };

  const handleAnalysisComplete = (analysis: { isFake: boolean; confidence: number; reasons: string[] }) => {
    if (selectedReport) {
      setReportFlags(prev => ({
        ...prev,
        [selectedReport.id]: analysis
      }));
    }
  };

  const getReportFlag = (reportId: string) => {
    return reportFlags[reportId] || { isFake: false, confidence: 0, reasons: [] };
  };

  // Analytics data
  const statusData = [
    { name: 'Submitted', value: reports.filter(r => r.status === 'submitted').length, color: '#3B82F6' },
    { name: 'Under Review', value: reports.filter(r => r.status === 'under_review').length, color: '#EAB308' },
    { name: 'In Progress', value: reports.filter(r => r.status === 'in_progress').length, color: '#F97316' },
    { name: 'Completed', value: reports.filter(r => r.status === 'completed').length, color: '#10B981' },
    { name: 'Rejected', value: reports.filter(r => r.status === 'rejected').length, color: '#EF4444' }
  ];

  const typeData = [
    { name: 'Pothole', reports: reports.filter(r => r.type === 'pothole').length },
    { name: 'Street Light', reports: reports.filter(r => r.type === 'streetlight').length },
    { name: 'Traffic Signal', reports: reports.filter(r => r.type === 'traffic_signal').length },
    { name: 'Drainage', reports: reports.filter(r => r.type === 'drainage').length },
    { name: 'Road Damage', reports: reports.filter(r => r.type === 'road_damage').length },
  ];

  const severityData = [
    { name: 'Low', value: reports.filter(r => r.severity === 'low').length, color: '#10B981' },
    { name: 'Medium', value: reports.filter(r => r.severity === 'medium').length, color: '#EAB308' },
    { name: 'High', value: reports.filter(r => r.severity === 'high').length, color: '#F97316' },
    { name: 'Critical', value: reports.filter(r => r.severity === 'critical').length, color: '#EF4444' }
  ];

  const statusColors = {
    submitted: "bg-blue-100 text-blue-800",
    under_review: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-orange-100 text-orange-800", 
    completed: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800"
  };

  const severityColors = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800"
  };

  const FitBounds: React.FC<{ points: Array<{ lat: number; lng: number }> }> = ({ points }) => {
    const map = useMap();
    useEffect(() => {
      if (!points.length) return;
      const bounds = L.latLngBounds(points.map(p => L.latLng(p.lat, p.lng)));
      map.fitBounds(bounds.pad(0.2));
    }, [points, map]);
    return null;
  };

  const MarkerIcon = L.divIcon({
    className: 'pulse-marker',
    html: '<div class="pulse-core"></div><div class="pulse-ring"></div>',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold gradient-text">
                🏛️ Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Administrator</p>
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
        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-3xl font-bold text-foreground">{reports.length}</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </Card>

          <Card className="p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-3xl font-bold text-warning">
                  {reports.filter(r => ['submitted', 'under_review'].includes(r.status)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </Card>

          <Card className="p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-3xl font-bold text-info">
                  {reports.filter(r => r.status === 'in_progress').length}
                </p>
              </div>
              <Settings className="w-8 h-8 text-info" />
            </div>
          </Card>

          <Card className="p-6 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-3xl font-bold text-success">
                  {reports.filter(r => r.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-fit">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Map View
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="contractors" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Contractors
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-semibold border-blue-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Bot className="w-4 h-4" />
              🤖 AI Analysis
            </TabsTrigger>
          </TabsList>

          {/* Reports Management Tab */}
          <TabsContent value="reports">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Report Management</h2>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="text-red-600">
                      {reports.filter(r => r.severity === 'critical').length} Critical
                    </Badge>
                    <Badge variant="outline" className="text-orange-600">
                      {reports.filter(r => r.severity === 'high').length} High Priority
                    </Badge>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Issue</th>
                        <th className="text-left p-4">Citizen</th>
                        <th className="text-left p-4">Type</th>
                        <th className="text-left p-4">Severity</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">AI Flag</th>
                        <th className="text-left p-4">Contractor</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr key={report.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div>
                              <p className="font-medium">{report.title}</p>
                              <p className="text-sm text-muted-foreground">
                                📍 {report.location.address}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">{report.citizenName}</td>
                          <td className="p-4">
                            <span className="capitalize">{report.type.replace('_', ' ')}</span>
                          </td>
                          <td className="p-4">
                            <Badge className={severityColors[report.severity]}>
                              {report.severity}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Select
                              value={report.status}
                              onValueChange={(value) => handleStatusUpdate(report.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="under_review">Under Review</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            {(() => {
                              const flag = getReportFlag(report.id);
                              if (flag.confidence === 0) {
                                return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">⚠️ Not Analyzed</Badge>;
                              }
                              return (
                                <Badge 
                                  className={flag.isFake ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                                  title={flag.reasons.join(', ')}
                                >
                                  {flag.isFake ? 'Fake' : 'Real'} ({flag.confidence}%)
                                </Badge>
                              );
                            })()}
                          </td>
                          <td className="p-4">
                            <Select
                              value={report.assignedContractor || ""}
                              onValueChange={(value) => handleAssignContractor(report.id, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Assign..." />
                              </SelectTrigger>
                              <SelectContent>
                                {contractors.map((contractor) => (
                                  <SelectItem key={contractor.id} value={contractor.name}>
                                    {contractor.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 border-0"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setIsChatbotOpen(true);
                                }}
                              >
                                <Bot className="w-4 h-4 mr-2" />
                                🤖 AI Analyze
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteReport(report.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Details Dialog */}
              <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Details</DialogTitle>
                    <DialogDescription>Full information about the selected report.</DialogDescription>
                  </DialogHeader>

                  {selectedReport && (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Title</p>
                        <p className="font-semibold">{selectedReport.title}</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Citizen</p>
                          <p className="font-medium">{selectedReport.citizenName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p className="font-medium">{new Date(selectedReport.submittedAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium capitalize">{selectedReport.type.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Severity</p>
                          <p className="font-medium capitalize">{selectedReport.severity}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{selectedReport.status.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium break-all">{selectedReport.location.address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium whitespace-pre-wrap">{selectedReport.description}</p>
                      </div>
                      {selectedReport.images && selectedReport.images.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Photos</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedReport.images.map((src, idx) => (
                              <img
                                key={idx}
                                src={src}
                                alt={`report-${idx}`}
                                className="w-full h-32 object-cover rounded-md border"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  // Simple gray placeholder SVG
                                  target.onerror = null;
                                  target.src =
                                    'data:image/svg+xml;utf8,' +
                                    encodeURIComponent(
                                      `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14">Image not available</text></svg>`
                                    );
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedReport.videos && selectedReport.videos.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Videos</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedReport.videos.map((src, idx) => (
                              <video
                                key={idx}
                                src={src}
                                className="w-full h-48 object-cover rounded-md border"
                                controls
                                preload="metadata"
                                onError={(e) => {
                                  // Replace failed video with a placeholder block
                                  const el = e.currentTarget as HTMLVideoElement;
                                  const wrapper = document.createElement('div');
                                  wrapper.className = el.className;
                                  wrapper.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#f3f4f6;color:#6b7280;border-radius:0.375rem;border:1px solid #e5e7eb;">Video not available</div>';
                                  const parent = el.parentElement;
                                  if (parent) {
                                    parent.replaceChild(wrapper, el);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedReport.assignedContractor && (
                        <div>
                          <p className="text-sm text-muted-foreground">Assigned Contractor</p>
                          <p className="font-medium">{selectedReport.assignedContractor}</p>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Expected Completion</p>
                          <p className="font-medium">{selectedReport.expectedCompletion || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Actual Completion</p>
                          <p className="font-medium">{selectedReport.actualCompletion || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </motion.div>
          </TabsContent>

          {/* Map View Tab */}
          <TabsContent value="map">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">City Infrastructure Map</h2>
                <div className="rounded-lg overflow-hidden border">
                  <div className="h-96 w-full">
                    <MapContainer center={{ lat: 20, lng: 0 }} zoom={2} scrollWheelZoom={true} className="h-full w-full">
                      <TileLayer
                        attribution='&copy; OpenStreetMap &copy; CARTO'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                      />
                      <FitBounds
                        points={reports
                          .filter(r => typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number')
                          .map(r => ({ lat: r.location.lat as number, lng: r.location.lng as number }))
                          .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng) && !(p.lat === 0 && p.lng === 0))}
                      />
                      {reports.map((r) => (
                        (typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number' && Number.isFinite(r.location.lat) && Number.isFinite(r.location.lng) && !(r.location.lat === 0 && r.location.lng === 0)) ? (
                          <>
                            <Marker key={r.id} position={{ lat: r.location.lat, lng: r.location.lng }} icon={MarkerIcon as any} />
                            {r.severity && (
                              <Circle center={{ lat: r.location.lat, lng: r.location.lng }} radius={r.severity === 'critical' ? 150 : r.severity === 'high' ? 120 : r.severity === 'medium' ? 90 : 60} pathOptions={{ color: r.severity === 'critical' ? '#EF4444' : r.severity === 'high' ? '#F97316' : r.severity === 'medium' ? '#EAB308' : '#10B981', fillOpacity: 0.08 }} />
                            )}
                          </>
                        ) : null
                      ))}
                    </MapContainer>
                  </div>
                </div>

                {/* Map Legend */}
                <div className="mt-6 flex justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Low</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm">High</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm">Critical</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Status Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Report Status Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`status-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                {/* Severity Distribution */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Severity Distribution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={severityData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({name, value}) => `${name}: ${value}`}
                      >
                        {severityData.map((entry, index) => (
                          <Cell key={`severity-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              {/* Issue Types Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Reports by Issue Type</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="reports" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Contractors Tab */}
          <TabsContent value="contractors">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Contractor Management</h2>
                {/* Add / Search */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Add Contractor</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Name" value={newContractor.name} onChange={(e)=>setNewContractor({...newContractor, name:e.target.value})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Phone" type="tel" value={newContractor.phone} onChange={(e)=>setNewContractor({...newContractor, phone:e.target.value})} />
                      <input className="border rounded px-2 py-1 bg-background col-span-2" placeholder="Specializations (comma)" value={newContractor.specializations} onChange={(e)=>setNewContractor({...newContractor, specializations:e.target.value})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Rating" type="number" min={1} max={5} step={0.1} value={newContractor.rating} onChange={(e)=>setNewContractor({...newContractor, rating: Number(e.target.value)})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Completed Jobs" type="number" min={0} step={1} value={newContractor.completedJobs} onChange={(e)=>setNewContractor({...newContractor, completedJobs: Number(e.target.value)})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Avg Days" type="number" min={0} step={0.1} value={newContractor.avgCompletionTime} onChange={(e)=>setNewContractor({...newContractor, avgCompletionTime: Number(e.target.value)})} />
                      <Button
                        onClick={() => {
                          if (!newContractor.name || !newContractor.phone) {
                            toast({ title: 'Missing info', description: 'Name and phone are required', variant: 'destructive' });
                            return;
                          }
                          const contractor: Contractor = {
                            id: `${Date.now()}`,
                            name: newContractor.name,
                            phone: newContractor.phone,
                            specializations: newContractor.specializations.split(',').map(s=>s.trim()).filter(Boolean),
                            rating: newContractor.rating,
                            completedJobs: newContractor.completedJobs,
                            avgCompletionTime: newContractor.avgCompletionTime,
                          };
                          setContractors(prev => {
                            const next = [contractor, ...prev];
                            try { localStorage.setItem('roadReportContractors', JSON.stringify(next)); } catch {}
                            return next;
                          });
                          setNewContractor({ name:"", phone:"", specializations:"", rating:4.5, completedJobs:0, avgCompletionTime:1.0 });
                          toast({ title: 'Contractor added', description: contractor.name });
                        }}
                      >Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Search</p>
                    <input className="border rounded px-3 py-2 w-full bg-background" placeholder="Search by name, phone, or specialization" value={contractorSearch} onChange={(e)=>setContractorSearch(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-6">
                  {contractors.filter(c => {
                    if (!contractorSearch) return true;
                    const q = contractorSearch.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      (c.phone || '').toLowerCase().includes(q) ||
                      c.specializations.join(',').toLowerCase().includes(q)
                    );
                  }).map((contractor) => (
                    <Card key={contractor.id} className="p-6 hover-lift">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{contractor.name}</h3>
                          <p className="text-muted-foreground">{contractor.phone}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="font-bold">{contractor.rating}</span>
                            <span className="text-yellow-500">⭐</span>
                          </div>
                          <p className="text-sm text-muted-foreground">Rating</p>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Specializations</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contractor.specializations.map((spec) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Completed Jobs</p>
                          <p className="font-semibold">{contractor.completedJobs}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Avg. Completion Time</p>
                          <p className="font-semibold">{contractor.avgCompletionTime} days</p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setContractors(prev => {
                            const next = prev.map(c => c.id === contractor.id ? { ...c, completedJobs: c.completedJobs + 1 } : c);
                            try { localStorage.setItem('roadReportContractors', JSON.stringify(next)); } catch {}
                            toast({ title: 'Updated', description: 'Completed jobs incremented' });
                            return next;
                          });
                        }}>+1 Job</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setContractors(prev => {
                            const next = prev.filter(c => c.id !== contractor.id);
                            try { localStorage.setItem('roadReportContractors', JSON.stringify(next)); } catch {}
                            toast({ title: 'Removed', description: contractor.name });
                            return next;
                          });
                        }}>Remove</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    🤖 AI Report Analysis
                  </h2>
                  <div className="flex gap-4">
                    <Badge variant="outline" className="text-red-600">
                      {Object.values(reportFlags).filter(f => f.isFake).length} Flagged as Fake
                    </Badge>
                    <Badge variant="outline" className="text-green-600">
                      {Object.values(reportFlags).filter(f => !f.isFake && f.confidence > 0).length} Verified Real
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Select a report to analyze with AI. The system will automatically detect fake reports 
                    based on content patterns, timing, location validity, and other heuristics.
                  </p>
                  
                  <div className="grid gap-4">
                    {reports.map((report) => {
                      const flag = getReportFlag(report.id);
                      return (
                        <Card key={report.id} className="p-4 hover:bg-muted/50 cursor-pointer"
                          onClick={() => {
                            setSelectedReport(report);
                            setIsChatbotOpen(true);
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{report.title}</h3>
                              <p className="text-sm text-muted-foreground">{report.citizenName} • {report.type}</p>
                              <p className="text-xs text-muted-foreground mt-1">{report.description.substring(0, 100)}...</p>
                            </div>
                            <div className="ml-4">
                              {flag.confidence === 0 ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">⚠️ Not Analyzed</Badge>
                              ) : (
                                <Badge 
                                  className={flag.isFake ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}
                                >
                                  {flag.isFake ? 'Fake' : 'Real'} ({flag.confidence}%)
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* AI Chatbot Dialog */}
        <Dialog open={isChatbotOpen} onOpenChange={setIsChatbotOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>AI Report Analysis</DialogTitle>
              <DialogDescription>
                Analyze "{selectedReport?.title}" for authenticity using AI heuristics.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-hidden">
              <ReportAnalysisChatbot
                report={selectedReport}
                onAnalysisComplete={handleAnalysisComplete}
                onClose={() => setIsChatbotOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;