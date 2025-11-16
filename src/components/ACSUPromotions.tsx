import { useEffect, useState } from "react";
import { Gift, Clock, Target, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface PromotionsProps {
  customer: any;
}

export const ACSUPromotions = ({ customer }: PromotionsProps) => {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromotions();
  }, [customer]);

  const loadPromotions = async () => {
    try {
      const { data } = await supabase.functions.invoke('acsu-promotions', {
        body: { customerId: customer.id }
      });
      setPromotions(data || []);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case 'multiplier':
        return <Sparkles className="w-5 h-5" />;
      case 'bonus':
        return <Target className="w-5 h-5" />;
      case 'special':
        return <Gift className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getPromotionColor = (type: string) => {
    switch (type) {
      case 'multiplier':
        return 'gradient-accent';
      case 'bonus':
        return 'gradient-secondary';
      case 'special':
        return 'gradient-primary';
      default:
        return 'gradient-primary';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">Active Promotions</h3>
        <Badge variant="secondary" className="ml-auto">
          {promotions.length} Active
        </Badge>
      </div>

      <div className="space-y-3">
        {promotions.map((promo) => (
          <Card key={promo.id} className="overflow-hidden border-0 shadow-lg animate-fade-in">
            <div className={`${getPromotionColor(promo.type)} p-4`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  {getPromotionIcon(promo.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-base mb-1">{promo.title}</h4>
                  <p className="text-white/90 text-sm mb-2">{promo.description}</p>
                  
                  {promo.progress && (
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-xs text-white/80">
                        <span>Progress</span>
                        <span>{promo.progress.current}/{promo.progress.target}</span>
                      </div>
                      <Progress 
                        value={(promo.progress.current / promo.progress.target) * 100} 
                        className="h-2 bg-white/20"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 text-white/80 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>Valid until {new Date(promo.validUntil).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {promotions.length === 0 && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No active promotions at the moment</p>
        </div>
      )}
    </div>
  );
};