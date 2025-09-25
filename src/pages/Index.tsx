import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";
import citizenIcon from "@/assets/citizen-icon.png";
import adminIcon from "@/assets/admin-icon.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      {/* Vibrant gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30 mix-blend-overlay" />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-20 left-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.75, 0.4]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-[28rem] h-[28rem] bg-secondary/25 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.85, 0.5]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-10 left-1/3 w-[32rem] h-[32rem] bg-accent/25 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.7, 0.35]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Citizen Road Issue 
            <br />
            <span>Reporting System</span> 🚧
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-white max-w-3xl mx-auto leading-relaxed drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Report road issues, earn points, and help build a better community. 
            Join thousands of citizens making their cities safer and more efficient.
          </motion.p>
        </motion.div>

        {/* Action Cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 w-full max-w-4xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {/* Citizen Card */}
          <motion.div
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="glass-strong p-8 text-center hover-lift cursor-pointer group bg-gradient-to-br from-background/70 to-muted/40 ring-1 ring-primary/20 hover:ring-primary/40 transition"
                  onClick={() => navigate('/citizen/auth')}>
              <motion.div 
                className="mb-6"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src={citizenIcon} 
                  alt="Citizen Reporter" 
                  className="w-24 h-24 mx-auto mb-4 animate-float"
                />
                <Users className="w-16 h-16 mx-auto text-primary animate-pulse-soft" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Citizen Reporter 👤
              </h2>
              
              <p className="text-muted-foreground mb-6 text-lg">
                Report road issues, earn XP points, unlock badges, and climb the community leaderboard!
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>🎯</span> <span>Gamified Experience</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>📱</span> <span>Easy Photo Upload</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>🏆</span> <span>Leaderboard & Badges</span>
                </div>
              </div>
              
              <Button 
                variant="hero" 
                size="xl"
                className="w-full group-hover:shadow-glow shadow-[0_10px_30px_rgba(59,130,246,0.35)]"
              >
                Start Reporting
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>

          {/* Admin Card */}
          <motion.div
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="glass-strong p-8 text-center hover-lift cursor-pointer group bg-gradient-to-br from-background/70 to-muted/40 ring-1 ring-secondary/20 hover:ring-secondary/40 transition"
                  onClick={() => navigate('/admin/auth')}>
              <motion.div 
                className="mb-6"
                whileHover={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <img 
                  src={adminIcon} 
                  alt="City Administrator" 
                  className="w-24 h-24 mx-auto mb-4 animate-float"
                />
                <Building2 className="w-16 h-16 mx-auto text-accent animate-pulse-soft" />
              </motion.div>
              
              <h2 className="text-3xl font-bold text-foreground mb-4">
                City Administration 🏛️
              </h2>
              
              <p className="text-muted-foreground mb-6 text-lg">
                Manage reports, assign contractors, track SLAs, and monitor city-wide infrastructure health.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>🗺️</span> <span>Interactive Maps</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>📊</span> <span>Analytics Dashboard</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span>⚡</span> <span>SLA Tracking</span>
                </div>
              </div>
              
              <Button 
                variant="accent" 
                size="xl"
                className="w-full group-hover:shadow-glow shadow-[0_10px_30px_rgba(236,72,153,0.35)]"
              >
                Access Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Card>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          <div className="grid grid-cols-3 gap-8 glass p-6 rounded-xl">
            <div>
              <div className="text-3xl font-bold text-white gradient-text">2,450+</div>
              <div className="text-white/80">Issues Resolved</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white gradient-text">850+</div>
              <div className="text-white/80">Active Citizens</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white gradient-text">15</div>
              <div className="text-white/80">Cities</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
