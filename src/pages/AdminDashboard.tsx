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
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { mockContractors } from "@/lib/mockData";
import { Report, Contractor } from "@/types";
import { MapContainer, TileLayer, Circle, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>(mockContractors);
  const [contractorSearch, setContractorSearch] = useState("");
  const [newContractor, setNewContractor] = useState({
    name: "",
    email: "",
    specializations: "",
    rating: 4.5,
    completedJobs: 0,
    avgCompletionTime: 1.0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/admin/auth');
      return;
    }
    // Load reports strictly from localStorage (user-submitted)
    try {
      const storedRaw = localStorage.getItem('roadReportUserReports');
      const storedReports: Report[] = storedRaw ? JSON.parse(storedRaw) : [];
      setReports(storedReports);
    } catch {
      setReports([]);
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleStatusUpdate = (reportId: string, newStatus: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, status: newStatus as Report['status'] } : report
    ));
    
    toast({
      title: "Status Updated",
      description: `Report status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  const handleAssignContractor = (reportId: string, contractorName: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId ? { ...report, assignedContractor: contractorName } : report
    ));
    
    toast({
      title: "Contractor Assigned",
      description: `${contractorName} has been assigned to the report`,
    });
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
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
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
                              <img key={idx} src={src} alt={`report-${idx}`} className="w-full h-32 object-cover rounded-md border" />
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedReport.videos && selectedReport.videos.length > 0 && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Videos</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedReport.videos.map((src, idx) => (
                              <video key={idx} src={src} className="w-full h-48 object-cover rounded-md border" controls preload="metadata" />
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
                      <FitBounds points={reports.filter(r => r.location && (r.location.lat || r.location.lng)).map(r => ({ lat: r.location.lat || 0, lng: r.location.lng || 0 }))} />
                      {reports.map((r) => (
                        (typeof r.location?.lat === 'number' && typeof r.location?.lng === 'number') ? (
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
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Email" value={newContractor.email} onChange={(e)=>setNewContractor({...newContractor, email:e.target.value})} />
                      <input className="border rounded px-2 py-1 bg-background col-span-2" placeholder="Specializations (comma)" value={newContractor.specializations} onChange={(e)=>setNewContractor({...newContractor, specializations:e.target.value})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Rating" type="number" min={1} max={5} step={0.1} value={newContractor.rating} onChange={(e)=>setNewContractor({...newContractor, rating: Number(e.target.value)})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Completed Jobs" type="number" min={0} step={1} value={newContractor.completedJobs} onChange={(e)=>setNewContractor({...newContractor, completedJobs: Number(e.target.value)})} />
                      <input className="border rounded px-2 py-1 bg-background" placeholder="Avg Days" type="number" min={0} step={0.1} value={newContractor.avgCompletionTime} onChange={(e)=>setNewContractor({...newContractor, avgCompletionTime: Number(e.target.value)})} />
                      <Button
                        onClick={() => {
                          if (!newContractor.name || !newContractor.email) {
                            toast({ title: 'Missing info', description: 'Name and email are required', variant: 'destructive' });
                            return;
                          }
                          const contractor: Contractor = {
                            id: `${Date.now()}`,
                            name: newContractor.name,
                            email: newContractor.email,
                            specializations: newContractor.specializations.split(',').map(s=>s.trim()).filter(Boolean),
                            rating: newContractor.rating,
                            completedJobs: newContractor.completedJobs,
                            avgCompletionTime: newContractor.avgCompletionTime,
                          };
                          setContractors(prev => [contractor, ...prev]);
                          setNewContractor({ name:"", email:"", specializations:"", rating:4.5, completedJobs:0, avgCompletionTime:1.0 });
                          toast({ title: 'Contractor added', description: contractor.name });
                        }}
                      >Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Search</p>
                    <input className="border rounded px-3 py-2 w-full bg-background" placeholder="Search by name, email, or specialization" value={contractorSearch} onChange={(e)=>setContractorSearch(e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-6">
                  {contractors.filter(c => {
                    if (!contractorSearch) return true;
                    const q = contractorSearch.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.email.toLowerCase().includes(q) ||
                      c.specializations.join(',').toLowerCase().includes(q)
                    );
                  }).map((contractor) => (
                    <Card key={contractor.id} className="p-6 hover-lift">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{contractor.name}</h3>
                          <p className="text-muted-foreground">{contractor.email}</p>
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
                          // simple increment to simulate updates
                          setContractors(prev => prev.map(c => c.id === contractor.id ? { ...c, completedJobs: c.completedJobs + 1 } : c));
                          toast({ title: 'Updated', description: 'Completed jobs incremented' });
                        }}>+1 Job</Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          setContractors(prev => prev.filter(c => c.id !== contractor.id));
                          toast({ title: 'Removed', description: contractor.name });
                        }}>Remove</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;