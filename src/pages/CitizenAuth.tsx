import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Mail, Lock, User, MapPin, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-bg.jpg";

const CitizenAuth = () => {
  const navigate = useNavigate();
  const { user, login, signup, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    city: ""
  });

  // Location search state for signup city
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{display_name: string}> | []>([]);

  // If already signed in, skip auth and go to dashboard
  useEffect(() => {
    if (user && user.role === 'citizen') {
      navigate('/citizen/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(loginForm.email, loginForm.password, 'citizen');
    
    if (success) {
      toast({
        title: "Welcome back! 🎉",
        description: "Successfully logged in to your citizen account.",
      });
      navigate('/citizen/dashboard');
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Try: sarah@example.com",
        variant: "destructive",
      });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      await signup({
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        role: 'citizen',
        city: signupForm.city,
      });

      toast({
        title: "Account Created! 🎊",
        description: "Welcome to the Road Reporter community! You earned 50 starter points.",
      });
      navigate('/citizen/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create account';
      toast({
        title: "Signup Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  // Debounced city/location search for signup
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      const query = signupForm.city;
      if (!query || query.trim().length < 3) {
        setSearchSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setIsSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        setSearchSuggestions(Array.isArray(data) ? data : []);
        setShowSuggestions(true);
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    };
    const t = setTimeout(run, 450);
    return () => { clearTimeout(t); controller.abort(); };
  }, [signupForm.city]);

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Animated Elements */}
      <motion.div
        className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-2xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.5, 0.2]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-8 left-8"
        >
          <Button
            variant="glass"
            size="sm"
            onClick={() => navigate('/')}
            className="text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Citizen Portal 👤
            </h1>
            <p className="text-white/80 text-lg">
              Join the community of road reporters
            </p>
          </div>

          <Card className="glass-strong p-8">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>

                  {/* <div className="text-center text-sm text-muted-foreground mt-4">
                    Demo: Use <strong>sarah@example.com</strong> for testing
                  </div> */}
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        className="pl-10"
                        value={signupForm.name}
                        onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className="pl-10"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        type="text"
                        placeholder="Search your city or area"
                        className="pl-10"
                        value={signupForm.city}
                        onChange={(e) => { setSignupForm({ ...signupForm, city: e.target.value }); setShowSuggestions(true); }}
                        onFocus={() => { if (searchSuggestions.length > 0) setShowSuggestions(true); }}
                        onBlur={() => { setTimeout(() => setShowSuggestions(false), 150); }}
                        required
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                      {showSuggestions && searchSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
                          {searchSuggestions.map((s: any, idx: number) => (
                            <div
                              key={`${s.place_id ?? idx}`}
                              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b border-border last:border-b-0"
                              onClick={() => { setSignupForm({ ...signupForm, city: s.display_name }); setShowSuggestions(false); }}
                            >
                              <div className="font-medium text-foreground">{String(s.display_name).split(',')[0]}</div>
                              <div className="text-xs text-muted-foreground">{String(s.display_name).split(',').slice(1).join(',').trim()}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        className="pl-10"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    size="lg" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CitizenAuth;