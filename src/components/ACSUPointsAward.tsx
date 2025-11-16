import { useState } from "react";
import { Award, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/button-variants";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { playSuccessSound, playCompleteSound } from "@/utils/soundEffects";

interface PointsAwardProps {
  customer: any;
  onPointsAwarded: () => void;
}

export const ACSUPointsAward = ({ customer, onPointsAwarded }: PointsAwardProps) => {
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const triggerCelebration = () => {
    // Play triumphant sound
    playCompleteSound();
    
    // Confetti burst
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: colors,
      });

      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: colors,
      });
    }, 50);
  };

  const handleAwardPoints = async () => {
    const pointsNum = parseInt(points);
    if (!pointsNum || pointsNum <= 0) {
      toast.error("Please enter a valid number of points");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for awarding points");
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .single();

      const { data, error } = await supabase.functions.invoke('acsu-points-award', {
        body: {
          customerId: customer.id,
          points: pointsNum,
          reason: reason.trim(),
          staffId: profile?.id,
        }
      });

      if (error) throw error;

      // Trigger celebration
      triggerCelebration();

      // Show success message
      toast.success(
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-success" />
          <div>
            <p className="font-bold">Points Awarded!</p>
            <p className="text-sm">{pointsNum} points sent to {customer.name}</p>
          </div>
        </div>,
        { duration: 5000 }
      );

      // Reset form
      setPoints("");
      setReason("");
      
      // Refresh customer data
      onPointsAwarded();
    } catch (error) {
      console.error('Award points error:', error);
      toast.error("Failed to award points. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full gradient-success flex items-center justify-center">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Award Points</h2>
          <p className="text-sm text-muted-foreground">Reward customer for great service</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Points Amount
          </label>
          <Input
            type="number"
            placeholder="Enter points to award"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            className="h-12 text-lg"
            min="1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Reason
          </label>
          <Textarea
            placeholder="E.g., Excellent service, Referral bonus, Special promotion"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <GradientButton
          variant="success"
          onClick={handleAwardPoints}
          disabled={loading}
          className="w-full h-12"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Awarding Points...
            </>
          ) : (
            <>
              <Award className="w-5 h-5" />
              Award {points || '0'} Points
            </>
          )}
        </GradientButton>
      </div>
    </div>
  );
};