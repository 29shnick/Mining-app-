import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Zap, 
  Thermometer, 
  TrendingUp, 
  ShieldCheck, 
  Settings, 
  MessageSquare,
  Activity,
  Bitcoin,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  XAxis, 
  Tooltip 
} from 'recharts';
import { getMiningInsights } from '../services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface MiningStats {
  hashrate: number;
  earnings: number;
  temperature: number;
  efficiency: number;
  blocksFound: number;
}

interface HistoryPoint {
  time: string;
  hashrate: number;
}

// --- Components ---

const StatCard = ({ icon: Icon, label, value, unit, color }: { icon: any, label: string, value: string | number, unit: string, color: string }) => (
  <div className="stat-card">
    <div className="flex items-center gap-2 mb-1">
      <Icon size={14} className={color} />
      <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-bold font-mono tracking-tight">{value}</span>
      <span className="text-[10px] text-white/30 font-mono">{unit}</span>
    </div>
  </div>
);

const MiningVisualizer = ({ isActive }: { isActive: boolean }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }
    
    const interval = setInterval(() => {
      setParticles(prev => [
        ...prev.slice(-20),
        { id: Math.random(), x: Math.random() * 100, y: 100, size: Math.random() * 3 + 1 }
      ]);
    }, 200);
    
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
      <div className="absolute inset-0 opacity-20">
        <div className="h-full w-full" style={{ backgroundImage: 'radial-gradient(#f7931a 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />
      </div>
      
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ y: 120, x: `${p.x}%`, opacity: 0 }}
            animate={{ y: -20, opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "linear" }}
            className="absolute bg-brand-primary rounded-full blur-[1px]"
            style={{ width: p.size, height: p.size }}
          />
        ))}
      </AnimatePresence>

      <motion.div 
        animate={isActive ? { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] } : {}}
        transition={{ repeat: Infinity, duration: 4 }}
        className={cn(
          "relative z-10 p-6 rounded-full bg-brand-primary/10 border-2 border-brand-primary/30 flex items-center justify-center",
          isActive && "mining-glow"
        )}
      >
        <Bitcoin size={48} className={cn("text-brand-primary transition-all", isActive ? "animate-pulse" : "opacity-50")} />
      </motion.div>

      {isActive && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="matrix-text animate-pulse">MINING_ACTIVE...</div>
          <div className="matrix-text">BLOCK_HEIGHT: 834,129</div>
        </div>
      )}
    </div>
  );
};

export default function MinerDashboard() {
  const [isMining, setIsMining] = useState(false);
  const [stats, setStats] = useState<MiningStats>({
    hashrate: 0,
    earnings: 0,
    temperature: 32,
    efficiency: 98.4,
    blocksFound: 0
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("Initializing AI core...");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showBlockAnim, setShowBlockAnim] = useState(false);

  // Watch for block changes
  useEffect(() => {
    if (stats.blocksFound > 0) {
      setShowBlockAnim(true);
      const timer = setTimeout(() => setShowBlockAnim(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [stats.blocksFound]);
  
  // Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMining) {
      interval = setInterval(() => {
        setStats(prev => {
          const targetHash = 45.2 + (Math.random() * 5);
          const newHash = prev.hashrate + (targetHash - prev.hashrate) * 0.1;
          const newTemp = 32 + (newHash / 5) + (Math.random() * 2);
          
          const blockFound = Math.random() > 0.995; // Increased chance for demo
          if (blockFound) {
            // Trigger a small visual feedback if needed
          }

          return {
            ...prev,
            hashrate: Number(newHash.toFixed(2)),
            earnings: prev.earnings + (newHash * 0.00000001),
            temperature: Number(newTemp.toFixed(1)),
            blocksFound: blockFound ? prev.blocksFound + 1 : prev.blocksFound
          };
        });

        setHistory(prev => {
          const now = new Date();
          const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
          return [...prev.slice(-19), { time: timeStr, hashrate: stats.hashrate }];
        });
      }, 1000);
    } else {
      setStats(prev => ({ ...prev, hashrate: 0, temperature: 32 }));
    }
    return () => clearInterval(interval);
  }, [isMining, stats.hashrate]);

  // AI Insights Loop
  useEffect(() => {
    if (isMining) {
      const fetchInsight = async () => {
        setIsAiLoading(true);
        const insight = await getMiningInsights({
          hashrate: stats.hashrate,
          efficiency: stats.efficiency,
          temperature: stats.temperature
        });
        setAiInsight(insight || "AI core stable.");
        setIsAiLoading(false);
      };
      
      fetchInsight();
      const interval = setInterval(fetchInsight, 30000); // Every 30s
      return () => clearInterval(interval);
    }
  }, [isMining]);

  const toggleMining = () => setIsMining(!isMining);

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-4 gap-4 overflow-y-auto pb-24">
      {/* Header */}
      <header className="flex justify-between items-center py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <Bitcoin size={20} className="text-brand-dark" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">BitAI Miner</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">v2.4.0-stable</p>
          </div>
        </div>
        <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white/60">
          <Settings size={20} />
        </button>
      </header>

      {/* Main Visualizer */}
      <div className="relative">
        <MiningVisualizer isActive={isMining} />
        <AnimatePresence>
          {showBlockAnim && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.5, opacity: 0, y: -20 }}
              className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            >
              <div className="bg-brand-accent text-brand-dark px-4 py-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(0,255,65,0.5)] flex items-center gap-2">
                <ShieldCheck size={16} />
                NEW BLOCK DISCOVERED!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={Cpu} 
          label="Hashrate" 
          value={stats.hashrate} 
          unit="TH/s" 
          color="text-brand-primary" 
        />
        <StatCard 
          icon={Zap} 
          label="Efficiency" 
          value={stats.efficiency} 
          unit="%" 
          color="text-brand-accent" 
        />
        <StatCard 
          icon={Thermometer} 
          label="Temp" 
          value={stats.temperature} 
          unit="°C" 
          color={stats.temperature > 70 ? "text-red-500" : "text-blue-400"} 
        />
        <StatCard 
          icon={ShieldCheck} 
          label="Blocks" 
          value={stats.blocksFound} 
          unit="FOUND" 
          color="text-purple-400" 
        />
      </div>

      {/* Earnings Panel */}
      <div className="glass-panel p-4 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Total Earnings</span>
          <div className="flex items-center gap-1 text-brand-primary">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold">+2.4%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-mono font-bold tracking-tighter">
            {stats.earnings.toFixed(8)}
          </span>
          <span className="text-xs text-white/30 font-mono">BTC ≈ ${(stats.earnings * 65000).toFixed(2)} USD</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel p-4 h-40">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-white/40 uppercase tracking-widest">Performance History</span>
          <Activity size={14} className="text-white/20" />
        </div>
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <Line 
                type="monotone" 
                dataKey="hashrate" 
                stroke="#f7931a" 
                strokeWidth={2} 
                dot={false} 
                isAnimationActive={false}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <XAxis hide dataKey="time" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                itemStyle={{ color: '#f7931a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="glass-panel p-4 bg-brand-primary/5 border-brand-primary/20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded bg-brand-primary flex items-center justify-center">
            <MessageSquare size={12} className="text-brand-dark" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-primary">AI Mining Insight</span>
          {isAiLoading && <RefreshCw size={10} className="animate-spin text-brand-primary ml-auto" />}
        </div>
        <p className="text-xs leading-relaxed text-white/80 italic">
          "{aiInsight}"
        </p>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-dark/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto">
        <button 
          onClick={toggleMining}
          className={cn(
            "w-full py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            isMining 
              ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20" 
              : "bg-brand-primary text-brand-dark shadow-[0_0_30px_rgba(247,147,26,0.3)] hover:scale-[1.02]"
          )}
        >
          {isMining ? (
            <>
              <Zap size={18} className="animate-pulse" />
              Stop Mining Core
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              Initialize Mining
            </>
          )}
        </button>
      </div>
    </div>
  );
}
