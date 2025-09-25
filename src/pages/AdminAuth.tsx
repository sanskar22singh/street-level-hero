import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-bg.jpg";

const AdminAuth = () => {
  const navigate = useNavigate();
  const { user, login, isLoading, adminExists, createAdmin, requestPasswordReset, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  const [setupForm, setSetupForm] = useState({ name: "", email: "", password: "", city: "" });
  const [resetForm, setResetForm] = useState({ email: "", token: "", newPassword: "" });
  const [mode, setMode] = useState<'login' | 'setup' | 'forgot'>("login");

  // If already signed in, skip auth and go to dashboard
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard');
    }
    // Single admin is fixed; always show login
    setMode('login');
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(loginForm.email, loginForm.password, 'admin');
    
    if (success) {
      toast({
        title: "Admin Access Granted 🏛️",
        description: "Successfully logged in to admin dashboard.",
      });
      navigate('/admin/dashboard');
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin credentials. Try: admin@city.gov",
        variant: "destructive",
      });
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdmin(setupForm);
      toast({ title: 'Admin Setup Complete', description: 'You are now signed in as admin.' });
      navigate('/admin/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      toast({ title: 'Setup Failed', description: message, variant: 'destructive' });
    }
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await requestPasswordReset(resetForm.email);
    if (!token) {
      toast({ title: 'Not Found', description: 'No admin with that email', variant: 'destructive' });
      return;
    }
    toast({ title: 'Reset Token Generated', description: `Use this token: ${token}` });
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await resetPassword(resetForm.email, resetForm.token, resetForm.newPassword);
    if (ok) {
      toast({ title: 'Password Updated', description: 'You can sign in with your new password.' });
      setMode('login');
    } else {
      toast({ title: 'Invalid Token', description: 'Token invalid or expired', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Animated Elements */}
      <motion.div
        className="absolute top-20 left-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 5,
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
          <div className="text-center mb-8 text-white">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-accent rounded-full animate-glow">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-2">
              Admin Portal 🏛️
            </h1>
            <p className="text-white/80 text-lg">
              Secure access for city administrators
            </p>
          </div>

          <Card className="glass-strong p-8 bg-black/70 border border-white/10 text-white">
            <div className="flex gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={()=>setMode('login')}
                disabled={!adminExists}
                className={`${mode==='login' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80 hover:text-white'} border border-white/20`}
              >
                Sign In
              </Button>
              {/* Setup and Forgot Password hidden for single fixed admin */}
            </div>

            {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  Authorized Personnel Only
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter admin email"
                    className="pl-10 text-white placeholder:text-white/60 bg-white/10 border-white/20"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    className="pl-10 pr-10 text-white placeholder:text-white/60 bg-white/10 border-white/20"
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
                variant="accent" 
                size="lg" 
                className="w-full shadow-[0_10px_30px_rgba(236,72,153,0.35)]"
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Access Dashboard"}
              </Button>

              {/* Hints removed */}
            </form>
            )}

            {/* Forgot password section removed */}
          </Card>

          {/* Security Features */}
          <motion.div 
            className="mt-8 glass p-4 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center text-white/80 text-sm">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-lg">🔐</div>
                  <div>Encrypted</div>
                </div>
                <div>
                  <div className="text-lg">🛡️</div>
                  <div>Audited</div>
                </div>
                <div>
                  <div className="text-lg">⚡</div>
                  <div>Real-time</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminAuth;