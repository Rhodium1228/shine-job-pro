import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Calendar, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface WalletCardProps {
  customer: any;
}

export const ACSUWalletCard = ({ customer }: WalletCardProps) => {
  const [tierInfo, setTierInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTierInfo();
  }, [customer]);

  const loadTierInfo = async () => {
    try {
      const { data } = await supabase.functions.invoke('acsu-customer-tier', {
        body: { customerId: customer.id }
      });
      setTierInfo(data);
    } catch (error) {
      console.error('Error loading tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-48 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="animate-scale-in">
      <div className="relative overflow-hidden rounded-2xl gradient-primary p-6 shadow-glow">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">ACSU Wallet</p>
              <h3 className="text-2xl font-bold text-white mt-1">{customer.name}</h3>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
              <Trophy className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">{tierInfo?.currentTier}</span>
            </div>
          </div>

          {/* Balance */}
          <div className="py-4">
            <p className="text-white/80 text-sm mb-1">Available Points</p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-white">{customer.walletBalance?.toLocaleString()}</span>
              <Sparkles className="w-6 h-6 text-white mb-2 animate-pulse" />
            </div>
          </div>

          {/* Progress to next tier */}
          {tierInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-white/80">
                <span>Progress to {tierInfo.nextTier}</span>
                <span>{tierInfo.pointsToNextTier} points to go</span>
              </div>
              <Progress value={tierInfo.progressPercentage} className="h-2 bg-white/20" />
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white/80 text-xs">Lifetime</span>
              </div>
              <p className="text-white font-bold text-lg">5,430</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-white" />
                <span className="text-white/80 text-xs">Expiring</span>
              </div>
              <p className="text-white font-bold text-lg">150 pts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};