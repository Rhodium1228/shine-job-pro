import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranch } from "@/contexts/BranchContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, Award, History, TrendingUp, Plus, Edit, Trash2, DollarSign, Gift } from "lucide-react";
import { format } from "date-fns";

export default function ACSULoyaltyConfig() {
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("rules");

  // Fetch loyalty config
  const { data: loyaltyConfig, isLoading: loadingConfig } = useQuery({
    queryKey: ['loyalty-config', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_config')
        .select('*')
        .eq('branch_id', selectedBranch?.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch loyalty tiers
  const { data: tiers = [], isLoading: loadingTiers } = useQuery({
    queryKey: ['loyalty-tiers', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_tiers')
        .select('*')
        .eq('branch_id', selectedBranch?.id)
        .order('tier_order');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['loyalty-transactions', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_transactions')
        .select(`
          *,
          staff:profiles!loyalty_transactions_staff_id_fkey(full_name)
        `)
        .eq('branch_id', selectedBranch?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch promotions
  const { data: promotions = [], isLoading: loadingPromotions } = useQuery({
    queryKey: ['loyalty-promotions', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_promotions')
        .select(`
          *,
          creator:profiles!loyalty_promotions_created_by_fkey(full_name)
        `)
        .eq('branch_id', selectedBranch?.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Save loyalty config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (config: any) => {
      if (loyaltyConfig?.id) {
        const { error } = await supabase
          .from('loyalty_config')
          .update(config)
          .eq('id', loyaltyConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_config')
          .insert({ ...config, branch_id: selectedBranch?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-config'] });
      toast.success('Configuration saved successfully');
    },
    onError: () => toast.error('Failed to save configuration'),
  });

  if (!selectedBranch) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please select a branch to manage loyalty settings</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ACSU Loyalty Configuration</h1>
          <p className="text-muted-foreground">Manage points, tiers, and promotions for {selectedBranch.name}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="rules" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Points Rules
          </TabsTrigger>
          <TabsTrigger value="tiers" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Tier Management
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Transaction Ledger
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Promotions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          <PointsRulesEditor 
            config={loyaltyConfig} 
            onSave={saveConfigMutation.mutate}
            isLoading={loadingConfig}
          />
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <TierManagement 
            tiers={tiers}
            branchId={selectedBranch.id}
            isLoading={loadingTiers}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <TransactionLedger 
            transactions={transactions}
            branchId={selectedBranch.id}
            isLoading={loadingTransactions}
          />
        </TabsContent>

        <TabsContent value="promotions" className="space-y-4">
          <PromotionManager 
            promotions={promotions}
            branchId={selectedBranch.id}
            isLoading={loadingPromotions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Points Rules Editor Component
function PointsRulesEditor({ config, onSave, isLoading }: any) {
  const [formData, setFormData] = useState({
    points_per_dollar: config?.points_per_dollar || 1,
    redeem_rate: config?.redeem_rate || 0.01,
    minimum_redeem_points: config?.minimum_redeem_points || 100,
    points_expiry_days: config?.points_expiry_days || null,
    welcome_bonus_points: config?.welcome_bonus_points || 0,
    referral_bonus_points: config?.referral_bonus_points || 0,
    birthday_bonus_points: config?.birthday_bonus_points || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Earning Rules</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="points_per_dollar">Points Per Dollar Spent</Label>
              <Input
                id="points_per_dollar"
                type="number"
                step="0.01"
                value={formData.points_per_dollar}
                onChange={(e) => setFormData({ ...formData, points_per_dollar: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Customer earns {formData.points_per_dollar} points for every $1 spent
              </p>
            </div>
            <div>
              <Label htmlFor="points_expiry_days">Points Expiry (Days)</Label>
              <Input
                id="points_expiry_days"
                type="number"
                placeholder="No expiry"
                value={formData.points_expiry_days || ''}
                onChange={(e) => setFormData({ ...formData, points_expiry_days: e.target.value ? parseInt(e.target.value) : null })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Leave empty for no expiry
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Redemption Rules</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="redeem_rate">Redemption Rate ($ per point)</Label>
              <Input
                id="redeem_rate"
                type="number"
                step="0.001"
                value={formData.redeem_rate}
                onChange={(e) => setFormData({ ...formData, redeem_rate: parseFloat(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                1 point = ${formData.redeem_rate}
              </p>
            </div>
            <div>
              <Label htmlFor="minimum_redeem_points">Minimum Points to Redeem</Label>
              <Input
                id="minimum_redeem_points"
                type="number"
                value={formData.minimum_redeem_points}
                onChange={(e) => setFormData({ ...formData, minimum_redeem_points: parseInt(e.target.value) })}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Minimum: {formData.minimum_redeem_points} points (${(formData.minimum_redeem_points * formData.redeem_rate).toFixed(2)})
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Bonus Points</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="welcome_bonus_points">Welcome Bonus</Label>
              <Input
                id="welcome_bonus_points"
                type="number"
                value={formData.welcome_bonus_points}
                onChange={(e) => setFormData({ ...formData, welcome_bonus_points: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="referral_bonus_points">Referral Bonus</Label>
              <Input
                id="referral_bonus_points"
                type="number"
                value={formData.referral_bonus_points}
                onChange={(e) => setFormData({ ...formData, referral_bonus_points: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="birthday_bonus_points">Birthday Bonus</Label>
              <Input
                id="birthday_bonus_points"
                type="number"
                value={formData.birthday_bonus_points}
                onChange={(e) => setFormData({ ...formData, birthday_bonus_points: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={isLoading}>
          Save Configuration
        </Button>
      </form>
    </Card>
  );
}

// Tier Management Component
function TierManagement({ tiers, branchId, isLoading }: any) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const queryClient = useQueryClient();

  const saveTierMutation = useMutation({
    mutationFn: async (tier: any) => {
      if (tier.id) {
        const { error } = await supabase
          .from('loyalty_tiers')
          .update(tier)
          .eq('id', tier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_tiers')
          .insert({ ...tier, branch_id: branchId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Tier saved successfully');
      setDialogOpen(false);
      setEditingTier(null);
    },
    onError: () => toast.error('Failed to save tier'),
  });

  const deleteTierMutation = useMutation({
    mutationFn: async (tierId: string) => {
      const { error } = await supabase
        .from('loyalty_tiers')
        .delete()
        .eq('id', tierId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers'] });
      toast.success('Tier deleted successfully');
    },
    onError: () => toast.error('Failed to delete tier'),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Loyalty Tiers</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTier(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tier
            </Button>
          </DialogTrigger>
          <TierDialog
            tier={editingTier}
            onSave={saveTierMutation.mutate}
            maxOrder={tiers.length}
          />
        </Dialog>
      </div>

      <div className="space-y-4">
        {tiers.map((tier: any) => (
          <Card key={tier.id} className="p-4" style={{ borderLeft: `4px solid ${tier.color}` }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{tier.name}</h4>
                  <Badge variant="outline">Order: {tier.tier_order}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div>Points Range: {tier.min_points} - {tier.max_points || '∞'}</div>
                  <div>Multiplier: {tier.points_multiplier}x</div>
                  {tier.discount_percentage > 0 && (
                    <div>Discount: {tier.discount_percentage}%</div>
                  )}
                </div>
                {tier.benefits && Array.isArray(tier.benefits) && tier.benefits.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Benefits:</p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside">
                      {tier.benefits.map((benefit: string, idx: number) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingTier(tier);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTierMutation.mutate(tier.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {tiers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No tiers configured. Add your first tier to get started.
          </p>
        )}
      </div>
    </Card>
  );
}

// Tier Dialog Component
function TierDialog({ tier, onSave, maxOrder }: any) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    min_points: tier?.min_points || 0,
    max_points: tier?.max_points || null,
    points_multiplier: tier?.points_multiplier || 1,
    discount_percentage: tier?.discount_percentage || 0,
    color: tier?.color || '#6366f1',
    tier_order: tier?.tier_order ?? maxOrder + 1,
    benefits: tier?.benefits || [],
  });
  const [benefitInput, setBenefitInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: tier?.id });
  };

  const addBenefit = () => {
    if (benefitInput.trim()) {
      setFormData({
        ...formData,
        benefits: [...formData.benefits, benefitInput.trim()],
      });
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter((_: any, i: number) => i !== index),
    });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{tier ? 'Edit Tier' : 'Add New Tier'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="tier_name">Tier Name</Label>
            <Input
              id="tier_name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="tier_order">Display Order</Label>
            <Input
              id="tier_order"
              type="number"
              value={formData.tier_order}
              onChange={(e) => setFormData({ ...formData, tier_order: parseInt(e.target.value) })}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="min_points">Minimum Points</Label>
            <Input
              id="min_points"
              type="number"
              value={formData.min_points}
              onChange={(e) => setFormData({ ...formData, min_points: parseInt(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="max_points">Maximum Points</Label>
            <Input
              id="max_points"
              type="number"
              placeholder="No limit"
              value={formData.max_points || ''}
              onChange={(e) => setFormData({ ...formData, max_points: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="points_multiplier">Points Multiplier</Label>
            <Input
              id="points_multiplier"
              type="number"
              step="0.1"
              value={formData.points_multiplier}
              onChange={(e) => setFormData({ ...formData, points_multiplier: parseFloat(e.target.value) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="discount_percentage">Discount %</Label>
            <Input
              id="discount_percentage"
              type="number"
              step="0.1"
              value={formData.discount_percentage}
              onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="color">Tier Color</Label>
            <Input
              id="color"
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Benefits</Label>
          <div className="flex gap-2">
            <Input
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              placeholder="Add a benefit"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
            />
            <Button type="button" onClick={addBenefit}>Add</Button>
          </div>
          <div className="mt-2 space-y-1">
            {formData.benefits.map((benefit: string, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm">{benefit}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBenefit(idx)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button type="submit">Save Tier</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Transaction Ledger Component
function TransactionLedger({ transactions, branchId, isLoading }: any) {
  const [manualAdjustmentOpen, setManualAdjustmentOpen] = useState(false);
  const [buyPointsOpen, setBuyPointsOpen] = useState(false);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <div className="flex gap-2">
          <Dialog open={buyPointsOpen} onOpenChange={setBuyPointsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Buy Points Checkout
              </Button>
            </DialogTrigger>
            <BuyPointsDialog branchId={branchId} />
          </Dialog>
          <Dialog open={manualAdjustmentOpen} onOpenChange={setManualAdjustmentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Gift className="h-4 w-4 mr-2" />
                Manual Adjustment
              </Button>
            </DialogTrigger>
            <ManualAdjustmentDialog branchId={branchId} onClose={() => setManualAdjustmentOpen(false)} />
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Balance After</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Staff</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx: any) => (
              <TableRow key={tx.id}>
                <TableCell>{format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                <TableCell className="font-mono text-sm">{tx.customer_id}</TableCell>
                <TableCell>
                  <Badge variant={
                    tx.transaction_type === 'earn' ? 'default' :
                    tx.transaction_type === 'redeem' ? 'secondary' :
                    tx.transaction_type === 'bonus' ? 'outline' :
                    'destructive'
                  }>
                    {tx.transaction_type}
                  </Badge>
                </TableCell>
                <TableCell className={tx.points_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                  {tx.points_amount > 0 ? '+' : ''}{tx.points_amount}
                </TableCell>
                <TableCell>{tx.balance_after}</TableCell>
                <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                <TableCell>{tx.staff?.full_name || '-'}</TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No transactions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// Manual Adjustment Dialog
function ManualAdjustmentDialog({ branchId, onClose }: any) {
  const [formData, setFormData] = useState({
    customer_id: '',
    points_amount: 0,
    description: '',
    transaction_type: 'adjustment' as const,
  });
  const queryClient = useQueryClient();

  const adjustmentMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Call ACSU API to adjust points
      const { data, error } = await supabase.functions.invoke('acsu-points-award', {
        body: {
          customerId: formData.customer_id,
          points: formData.points_amount,
          reason: formData.description,
          staffId: user?.id,
        },
      });

      if (error) throw error;

      // Record in local ledger
      const { error: dbError } = await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: formData.customer_id,
          branch_id: branchId,
          transaction_type: formData.transaction_type,
          points_amount: formData.points_amount,
          balance_after: data.newBalance,
          description: formData.description,
          staff_id: user?.id,
          metadata: { transaction_id: data.transactionId },
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
      toast.success('Points adjusted successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Adjustment error:', error);
      toast.error('Failed to adjust points');
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Manual Point Adjustment</DialogTitle>
        <DialogDescription>
          Manually add or deduct points from a customer's account
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={(e) => { e.preventDefault(); adjustmentMutation.mutate(); }} className="space-y-4">
        <div>
          <Label htmlFor="customer_id">Customer ID</Label>
          <Input
            id="customer_id"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            placeholder="Enter ACSU customer ID"
            required
          />
        </div>
        <div>
          <Label htmlFor="points_amount">Points Amount</Label>
          <Input
            id="points_amount"
            type="number"
            value={formData.points_amount}
            onChange={(e) => setFormData({ ...formData, points_amount: parseInt(e.target.value) })}
            placeholder="Positive to add, negative to deduct"
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Reason</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Explain why this adjustment is being made"
            required
          />
        </div>
        <DialogFooter>
          <Button type="submit" disabled={adjustmentMutation.isPending}>
            {adjustmentMutation.isPending ? 'Processing...' : 'Apply Adjustment'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// Buy Points Dialog
function BuyPointsDialog({ branchId }: any) {
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: 0,
    points: 0,
  });

  const handleAmountChange = (amount: number) => {
    // Assuming 1 dollar = 100 points for purchase
    setFormData({ ...formData, amount, points: amount * 100 });
  };

  const handleCheckout = async () => {
    // This would integrate with a payment processor
    toast.info('Payment integration would go here');
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Buy Points Checkout</DialogTitle>
        <DialogDescription>
          Allow customers to purchase loyalty points directly
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="buy_customer_id">Customer ID</Label>
          <Input
            id="buy_customer_id"
            value={formData.customer_id}
            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
            placeholder="Enter ACSU customer ID"
          />
        </div>
        <div>
          <Label htmlFor="buy_amount">Purchase Amount ($)</Label>
          <Input
            id="buy_amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => handleAmountChange(parseFloat(e.target.value))}
            placeholder="0.00"
          />
        </div>
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">Points to receive:</p>
          <p className="text-2xl font-bold">{formData.points.toLocaleString()} points</p>
        </div>
        <DialogFooter>
          <Button onClick={handleCheckout} disabled={!formData.customer_id || formData.amount <= 0}>
            Proceed to Checkout
          </Button>
        </DialogFooter>
      </div>
    </DialogContent>
  );
}

// Promotion Manager Component
function PromotionManager({ promotions, branchId, isLoading }: any) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const queryClient = useQueryClient();

  const savePromotionMutation = useMutation({
    mutationFn: async (promotion: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (promotion.id) {
        const { error } = await supabase
          .from('loyalty_promotions')
          .update(promotion)
          .eq('id', promotion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('loyalty_promotions')
          .insert({ ...promotion, branch_id: branchId, created_by: user?.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-promotions'] });
      toast.success('Promotion saved successfully');
      setDialogOpen(false);
      setEditingPromotion(null);
    },
    onError: () => toast.error('Failed to save promotion'),
  });

  const togglePromotionMutation = useMutation({
    mutationFn: async ({ id, is_active }: any) => {
      const { error } = await supabase
        .from('loyalty_promotions')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-promotions'] });
      toast.success('Promotion status updated');
    },
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Promotional Campaigns</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPromotion(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Promotion
            </Button>
          </DialogTrigger>
          <PromotionDialog
            promotion={editingPromotion}
            onSave={savePromotionMutation.mutate}
          />
        </Dialog>
      </div>

      <div className="space-y-4">
        {promotions.map((promo: any) => {
          const isActive = promo.is_active && new Date(promo.end_date) > new Date();
          const isExpired = new Date(promo.end_date) < new Date();
          
          return (
            <Card key={promo.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{promo.name}</h4>
                    <Badge variant={isActive ? 'default' : isExpired ? 'destructive' : 'secondary'}>
                      {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{promo.promotion_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Value:</span>{' '}
                      {promo.promotion_type === 'multiplier' && `${promo.value}x`}
                      {promo.promotion_type === 'bonus' && `+${promo.value} pts`}
                      {promo.promotion_type === 'discount' && `${promo.value}%`}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Start:</span>{' '}
                      {format(new Date(promo.start_date), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span>{' '}
                      {format(new Date(promo.end_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Created by: {promo.creator?.full_name || 'Unknown'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={promo.is_active ? "default" : "outline"}
                    onClick={() => togglePromotionMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                  >
                    {promo.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingPromotion(promo);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}

        {promotions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No promotions created yet. Create your first campaign to boost engagement!
          </p>
        )}
      </div>
    </Card>
  );
}

// Promotion Dialog
function PromotionDialog({ promotion, onSave }: any) {
  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    description: promotion?.description || '',
    promotion_type: promotion?.promotion_type || 'multiplier',
    value: promotion?.value || 1,
    start_date: promotion?.start_date ? format(new Date(promotion.start_date), 'yyyy-MM-dd') : '',
    end_date: promotion?.end_date ? format(new Date(promotion.end_date), 'yyyy-MM-dd') : '',
    is_active: promotion?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, id: promotion?.id });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{promotion ? 'Edit Promotion' : 'Create New Promotion'}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="promo_name">Promotion Name</Label>
          <Input
            id="promo_name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="promo_description">Description</Label>
          <Textarea
            id="promo_description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="promo_type">Promotion Type</Label>
            <Select value={formData.promotion_type} onValueChange={(value) => setFormData({ ...formData, promotion_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="multiplier">Points Multiplier</SelectItem>
                <SelectItem value="bonus">Bonus Points</SelectItem>
                <SelectItem value="discount">Discount %</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="promo_value">Value</Label>
            <Input
              id="promo_value"
              type="number"
              step="0.1"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save Promotion</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}