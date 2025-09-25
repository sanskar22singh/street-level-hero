import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  Zap,
  UserCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProgressToNextLevel, calculateLevel, getPointsForSeverity, getBadgeForReport } from "@/lib/mockData";
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from "@/types";

const CitizenDashboard = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    type: "",
    severity: "",
    location: ""
  });
  const [isLocating, setIsLocating] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [videos, setVideos] = useState<File[]>([]);
  const [videoPreviews, setVideoPreviews] = useState<string[]>([]);
  const [videoDataUrls, setVideoDataUrls] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'report' | 'my-reports' | 'leaderboard' | 'profile'>('report');
  const [leaderboard, setLeaderboard] = useState<{ rank: number; userId: string; userName: string; points: number; level: string; reportCount: number; }[]>([]);
  const [selectedLatLng, setSelectedLatLng] = useState<{lat: number; lng: number} | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isReadingPhotos, setIsReadingPhotos] = useState(false);
  const [isReadingVideos, setIsReadingVideos] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localityName, setLocalityName] = useState<string>("");
  const [isFetchingLocality, setIsFetchingLocality] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{display_name: string, lat: string, lon: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'citizen') {
      navigate('/citizen/auth');
      return;
    }
    // Load user's reports from localStorage only
    const storedRaw = localStorage.getItem('roadReportUserReports');
    let storedReports: Report[] = [];
    try { storedReports = storedRaw ? (JSON.parse(storedRaw) as Report[]) : []; } catch { storedReports = []; }
    const userStored = storedReports.filter(r => r.citizenId === user.id);
    setReports([...userStored]);
  
    // Build leaderboard from real local users + their report counts
    try {
      const usersRaw = localStorage.getItem('roadReportUsers');
      const storedUsers = usersRaw ? JSON.parse(usersRaw) as Array<{ id: string; name: string; email: string; role: string; points: number; level: string; }> : [];
      const byEmail = new Map<string, any>();
      storedUsers.forEach(u => byEmail.set(u.email.toLowerCase(), u));
      if (user) byEmail.set(user.email.toLowerCase(), user);

      const allReportsRaw = localStorage.getItem('roadReportUserReports');
      let allReports: Report[] = [];
      try { allReports = allReportsRaw ? (JSON.parse(allReportsRaw) as Report[]) : []; } catch { allReports = []; }

      const entries = Array.from(byEmail.values())
        .filter(u => u.role === 'citizen')
        .map((u) => {
          const reportCount = allReports.filter(r => r.citizenId === u.id).length;
          return { userId: u.id, userName: u.name, points: u.points, level: u.level, reportCount };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 4)
        .map((e, idx) => ({ ...e, rank: idx + 1 }));
      setLeaderboard(entries);
    } catch {
      setLeaderboard([]);
    }
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title || !newReport.type || !newReport.severity || !newReport.location) {
      toast({ title: 'Missing Information', description: 'Please fill title, type, severity, and location.', variant: 'destructive' });
      return;
    }
    if (isReadingPhotos || isReadingVideos) {
      toast({ title: 'Processing Media', description: 'Please wait while photos and videos are processed…' });
      return;
    }
    setIsSubmitting(true);

    try {
      // Resolve coordinates: prefer picked point; else parse; else geocode (bias India)
      const parseLatLng = (text: string): { lat: number; lng: number } | null => {
        const m = text.match(/\s*([+-]?\d+\.?\d*)\s*,\s*([+-]?\d+\.?\d*)\s*/);
        if (!m) return null;
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[2]);
        return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
      };

      const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number } | null> => {
        const tryFetch = async (url: string) => {
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (!res.ok) return null;
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
          }
          return null;
        };
        // Bias to India first
        const encoded = encodeURIComponent(query);
        const inUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1&countrycodes=in`;
        const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1&addressdetails=1`;
        return (await tryFetch(inUrl)) || (await tryFetch(globalUrl));
      };

      let coords: { lat: number; lng: number } | null = null;
      if (selectedLatLng) {
        coords = selectedLatLng;
      } else {
        coords = parseLatLng(newReport.location) || (await geocodeAddress(newReport.location));
        if (coords) {
          setSelectedLatLng(coords);
          setLocalityName(newReport.location);
        }
      }

      // Create report and persist
      const now = new Date().toISOString();
      const points = newReport.severity ? getPointsForSeverity(newReport.severity as Report['severity']) : 50;
      const generateId = () => (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`);
      const created: Report = {
        id: generateId(),
        citizenId: user.id,
        citizenName: user.name,
        title: newReport.title,
        description: newReport.description,
        type: (newReport.type || 'other') as Report['type'],
        severity: (newReport.severity || 'low') as Report['severity'],
        status: 'submitted',
        location: {
          lat: coords ? coords.lat : 0,
          lng: coords ? coords.lng : 0,
          address: newReport.location,
        },
        images: photoDataUrls,
        videos: videoDataUrls,
        submittedAt: now,
        points,
      };

      const existingRaw = localStorage.getItem('roadReportUserReports');
      let existing: Report[] = [];
      try { existing = existingRaw ? (JSON.parse(existingRaw) as Report[]) : []; } catch { existing = []; }

      // Persist with graceful fallback if quota is exceeded
      try {
        const updated = [...existing, created];
        localStorage.setItem('roadReportUserReports', JSON.stringify(updated));
      } catch {
        try {
          const updated = [...existing, { ...created, images: [] }];
          localStorage.setItem('roadReportUserReports', JSON.stringify(updated));
        } catch {
          // ignore if persistence completely fails
        }
      }

      setReports(prev => [...prev, created]);

      if (!coords) {
        toast({ title: 'Location Saved Without Coordinates', description: 'We could not resolve the address to a map location. You can edit and pin it later.', variant: 'destructive' });
      } else {
        toast({ title: 'Location Resolved', description: `Pinned at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` });
      }

      // Update user points and badges
      const newTotalPoints = (user.points || 0) + points;
      
      // Determine which badge to award for this report
      const newBadge = getBadgeForReport(created, reports);
      const earnedBadges: string[] = [];
      
      if (newBadge && !user.badges.includes(newBadge)) {
        earnedBadges.push(newBadge);
      }

      const nextLevel = calculateLevel(newTotalPoints);
      const updatedBadges = Array.from(new Set([...user.badges, ...earnedBadges]));
      // updateUser will auto-award blue_tick and special_1000 at 150+ points
      updateUser({ points: newTotalPoints, level: nextLevel, badges: updatedBadges });

    toast({
      title: "Report Submitted! 🎉",
        description: `+${points} points earned! ${earnedBadges.length ? `New badge: ${earnedBadges.join(', ')}` : ''}`,
    });

    // Reset form
    setNewReport({
      title: "",
      description: "",
      type: "",
      severity: "",
      location: ""
    });
      setPhotos([]);
      setPhotoPreviews([]);
      setPhotoDataUrls([]);
      setActiveTab('my-reports');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not submit report';
      toast({ title: 'Submit Failed', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast({
        title: 'Geolocation Unavailable',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setNewReport({ ...newReport, location: coordsString });
        setSelectedLatLng({ lat: latitude, lng: longitude });
        setLocationAccuracy(typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null);
        toast({
          title: 'Location Captured 📍',
          description: `Using current location: ${coordsString}`,
        });
        setIsLocating(false);
      },
      (err) => {
        let message = 'Unable to get current location.';
        if (err.code === err.PERMISSION_DENIED) message = 'Location permission denied. Please allow access.';
        if (err.code === err.POSITION_UNAVAILABLE) message = 'Location information is unavailable.';
        if (err.code === err.TIMEOUT) message = 'Getting location timed out. Try again.';
        toast({ title: 'Location Error', description: message, variant: 'destructive' });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Debounced search function
  const searchLocation = async (query: string) => {
    if (!query || query.length < 3) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=`
      );
      const data = await response.json();
      setSearchSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching location:', error);
      toast({ title: 'Search Error', description: 'Failed to search for location.', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (newReport.location && newReport.location.length >= 3) {
        searchLocation(newReport.location);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newReport.location]);

  const handleLocationSelect = (suggestion: {display_name: string, lat: string, lon: string}) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    
    setSelectedLatLng({ lat, lng });
    setNewReport({ ...newReport, location: suggestion.display_name });
    setLocalityName(suggestion.display_name);
    setShowSuggestions(false);
    setSearchSuggestions([]);
    
    toast({ title: 'Location Selected', description: `Selected: ${suggestion.display_name}` });
  };

  function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
    useMapEvents({
      click(e) {
        onSelect(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  function MapCenterOnSelected({ center }: { center: {lat: number; lng: number} | null }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        map.flyTo(center, map.getZoom(), { duration: 0.5 });
      }
    }, [center, map]);
    return null;
  }

  function PulsingMarker({ position }: { position: { lat: number; lng: number } }) {
    const icon = L.divIcon({
      className: 'pulse-marker',
      html: '<div class="pulse-core"></div><div class="pulse-ring"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    return <Marker position={position} icon={icon as any} />;
  }

  const handlePhotosSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    setPhotos(files);
    setIsReadingPhotos(true);
    // Compress large images to allow larger uploads within storage limits
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxDim = 1600; // px
            let { width, height } = img;
            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > width && height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            } else if (width === height && width > maxDim) {
              width = maxDim; height = maxDim;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));
            ctx.drawImage(img, 0, 0, width, height);
            // Try a couple of qualities to stay below ~800KB
            let quality = 0.8;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);
            const targetBytes = 800 * 1024;
            // Downscale quality if still too big (simple loop)
            while (dataUrl.length * 0.75 > targetBytes && quality > 0.5) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }
            resolve(dataUrl);
          };
          img.onerror = () => reject(new Error('Image decode failed'));
          img.src = String(reader.result);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    };
    try {
      const dataUrls = await Promise.all(files.map(compressImage));
      setPhotoDataUrls(dataUrls);
      setPhotoPreviews(dataUrls);
    } catch (e) {
      toast({ title: 'Photo Error', description: 'Could not read selected photos.', variant: 'destructive' });
    } finally {
      setIsReadingPhotos(false);
    }
  };

  const handleVideosSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    
    // Filter for video files only
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    if (videoFiles.length !== files.length) {
      toast({ title: 'Invalid Files', description: 'Please select only video files.', variant: 'destructive' });
    }
    if (!videoFiles.length) return;
    
    setVideos(videoFiles);
    setIsReadingVideos(true);
    
    // Process videos to data URLs (no compression for videos as it's complex)
    const processVideo = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read video file'));
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const dataUrls = await Promise.all(videoFiles.map(processVideo));
      setVideoDataUrls(dataUrls);
      setVideoPreviews(dataUrls);
    } catch (e) {
      toast({ title: 'Video Error', description: 'Could not read selected videos.', variant: 'destructive' });
    } finally {
      setIsReadingVideos(false);
    }
  };

  // Reverse geocode selected location to show locality/area names visibly
  useEffect(() => {
    const fetchLocality = async () => {
      if (!selectedLatLng) return;
      setIsFetchingLocality(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${selectedLatLng.lat}&lon=${selectedLatLng.lng}&format=json&zoom=14&addressdetails=1`);
        const data = await res.json();
        const addr = data?.address || {};
        const name = data?.display_name || [addr.neighbourhood, addr.suburb, addr.village, addr.town, addr.city, addr.state]
          .filter(Boolean)
          .join(', ');
        if (name) {
          setLocalityName(name);
          // Update the location input to a readable address
          setNewReport(prev => ({ ...prev, location: name }));
        }
      } catch (e) {
        // ignore
      } finally {
        setIsFetchingLocality(false);
      }
    };
    fetchLocality();
  }, [selectedLatLng]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<{ avatarUrl?: string; phone?: string; bio?: string }>({
    avatarUrl: user.avatarUrl,
    phone: user.phone || '',
    bio: user.bio || '',
  });

  const onAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileDraft(d => ({ ...d, avatarUrl: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    updateUser({ avatarUrl: profileDraft.avatarUrl, phone: profileDraft.phone, bio: profileDraft.bio });
    toast({ title: 'Profile updated' });
    setProfileOpen(false);
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
              <button
                className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-muted"
                onClick={() => setProfileOpen(true)}
                title="Edit profile"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full border" />
                ) : (
                  <UserCircle className="w-8 h-8" />
                )}
                <span className="hidden sm:inline text-sm">Profile</span>
              </button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/auth')}>
                Admin Portal
              </Button>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="font-semibold flex items-center gap-1 justify-end">
                  {user.name}
                  {user.badges.includes('blue_tick') && (
                    <span title="Verified (1000+ pts)">✔️</span>
                  )}
                </p>
              </div>
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

        {/* Quick Links between sections */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button variant={activeTab === 'report' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('report')}>Report Issue</Button>
          <Button variant={activeTab === 'my-reports' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('my-reports')}>My Reports</Button>
          <Button variant={activeTab === 'leaderboard' ? 'default' : 'outline'} size="sm" onClick={() => setActiveTab('leaderboard')}>Leaderboard</Button>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-fit">
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
                          <SelectItem value="low">🟢 Low Priority (+100 pts)</SelectItem>
                          <SelectItem value="medium">🟡 Medium Priority (+100 pts)</SelectItem>
                          <SelectItem value="high">🟠 High Priority (+100 pts)</SelectItem>
                          <SelectItem value="critical">🔴 Critical (+100 pts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id="location"
                              placeholder="Search for a location or enter address"
                              value={newReport.location}
                              onChange={(e) => {
                                setNewReport({ ...newReport, location: e.target.value });
                                setShowSuggestions(true);
                              }}
                              onFocus={() => {
                                if (searchSuggestions.length > 0) setShowSuggestions(true);
                              }}
                              onBlur={() => {
                                // Delay hiding suggestions to allow clicking on them
                                setTimeout(() => setShowSuggestions(false), 200);
                              }}
                              required
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              </div>
                            )}
                            
                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && searchSuggestions.length > 0 && (
                              <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                {searchSuggestions.map((suggestion, index) => (
                                  <div
                                    key={index}
                                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-b-0"
                                    onClick={() => handleLocationSelect(suggestion)}
                                  >
                                    <div className="font-medium text-foreground">
                                      {suggestion.display_name.split(',')[0]}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {suggestion.display_name.split(',').slice(1).join(',').trim()}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button type="button" variant="outline" size="icon" onClick={handleUseCurrentLocation} disabled={isLocating}>
                            <MapPin className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} />
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowMap((v) => !v)}>
                            {showMap ? 'Hide Map' : 'Pick on Map'}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tip: Type to search locations, use GPS pin, or "Pick on Map" to choose locality.
                      </p>

                      {showMap && (
                        <div className="mt-3">
                          <div className="h-56 md:h-72 rounded-md overflow-hidden border">
                            <MapContainer center={selectedLatLng || { lat: 37.7749, lng: -122.4194 }} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                              <TileLayer
                                attribution='&copy; OpenStreetMap &copy; CARTO'
                                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                              />
                              <MapCenterOnSelected center={selectedLatLng} />
                              <MapClickHandler onSelect={(lat, lng) => {
                                setSelectedLatLng({ lat, lng });
                                setNewReport({ ...newReport, location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
                                toast({ title: 'Locality Selected', description: `Pinned at ${lat.toFixed(6)}, ${lng.toFixed(6)}` });
                              }} />
                              {selectedLatLng && (
                                <>
                                  <PulsingMarker position={selectedLatLng} />
                                  {locationAccuracy && (
                                    <Circle center={selectedLatLng} radius={locationAccuracy} pathOptions={{ color: 'rgba(59,130,246,0.5)', fillOpacity: 0.12 }} />
                                  )}
                                </>
                              )}
                            </MapContainer>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Tap on the map to set your locality.
                            {localityName && (
                              <>
                                {" "}• Selected: <span className="font-medium">{isFetchingLocality ? 'Resolving…' : localityName}</span>
                              </>
                            )}
                          </p>
                        </div>
                      )}
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
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <input
                        id="photos-input"
                        type="file"
                        accept="image/*"
                        multiple
                        capture="environment"
                        className="hidden"
                        onChange={handlePhotosSelected}
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('photos-input')?.click()}>
                        <Camera className="w-4 h-4 mr-2" />
                        Select photos from device
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        JPG/PNG, multiple allowed. On mobile, you can use the camera directly.
                      </p>

                      {photoPreviews.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                          {photoPreviews.map((src, idx) => (
                            <div key={idx} className="relative">
                              <img src={src} alt={`selected-${idx}`} className="w-full h-24 object-cover rounded-md border" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Upload Videos (Optional)</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <input
                        id="videos-input"
                        type="file"
                        accept="video/*"
                        multiple
                        capture="environment"
                        className="hidden"
                        onChange={handleVideosSelected}
                      />
                      <Button type="button" variant="outline" onClick={() => document.getElementById('videos-input')?.click()}>
                        <Camera className="w-4 h-4 mr-2" />
                        Select videos from device
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        MP4/MOV/AVI, multiple allowed. On mobile, you can record videos directly.
                      </p>

                      {videoPreviews.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                          {videoPreviews.map((src, idx) => (
                            <div key={idx} className="relative">
                              <video 
                                src={src} 
                                className="w-full h-32 object-cover rounded-md border"
                                controls
                                preload="metadata"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting || isReadingPhotos || isReadingVideos}>
                    <Send className="w-5 h-5 mr-2" />
                    {isSubmitting ? 'Submitting…' : (isReadingPhotos || isReadingVideos ? 'Processing Media…' : 'Submit Report & Earn Points')}
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
                  {leaderboard.map((entry) => (
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

        </Tabs>
      </div>
      {/* Profile Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update your profile picture and basic information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {profileDraft.avatarUrl ? (
                  <img src={profileDraft.avatarUrl} alt="avatar" className="w-16 h-16 rounded-full border" />
                ) : (
                  <UserCircle className="w-16 h-16" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={onAvatarSelected}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-sm text-muted-foreground">Click photo to change</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={profileDraft.phone} onChange={(e)=>setProfileDraft(d=>({...d, phone: e.target.value}))} placeholder="e.g. +91 98765 43210" />
            </div>
            <div className="space-y-2">
              <Label>About you</Label>
              <Textarea value={profileDraft.bio} onChange={(e)=>setProfileDraft(d=>({...d, bio: e.target.value}))} rows={3} placeholder="Short bio" />
            </div>
            
            {/* Badges Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Earned Badges</h3>
              <div className="grid grid-cols-2 gap-3">
                {user.badges.map((badge, index) => (
                  <div key={badge} className="glass p-3 rounded-lg text-center">
                    <div className="text-xl mb-1">
                      {badge === 'first_report' ? '🎯' :
                       badge === 'quick_reporter' ? '⚡' :
                       badge === 'community_hero' ? '🏆' :
                       badge === 'photo_master' ? '📸' :
                       badge === 'detail_oriented' ? '🔍' :
                       badge === 'pothole_hunter' ? '🕳️' :
                       badge === 'light_keeper' ? '💡' :
                       badge === 'traffic_guardian' ? '🚦' :
                       badge === 'drainage_expert' ? '🌊' :
                       badge === 'safety_champion' ? '🛡️' :
                       badge === 'early_bird' ? '🌅' :
                       badge === 'night_owl' ? '🦉' :
                       badge === 'weekend_warrior' ? '⚔️' :
                       badge === 'high_priority' ? '🔴' :
                       badge === 'critical_eye' ? '🚨' :
                       badge === 'location_master' ? '📍' :
                       badge === 'video_director' ? '🎬' :
                       badge === 'consistency_king' ? '👑' :
                       badge === 'blue_tick' ? '✔️' :
                       badge === 'special_1000' ? '💎' : '🎖️'}
                    </div>
                    <p className="text-xs font-medium">
                      {badge.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                  </div>
                ))}
                
                {user.badges.length === 0 && (
                  <div className="col-span-2 text-center py-4">
                    <Award className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No badges earned yet. Keep reporting to unlock achievements!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={()=>setProfileOpen(false)}>Cancel</Button>
              <Button onClick={saveProfile}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CitizenDashboard;