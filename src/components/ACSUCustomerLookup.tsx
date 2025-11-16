import { useState } from "react";
import { Search, QrCode, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/button-variants";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CustomerLookupProps {
  onCustomerFound: (customer: any) => void;
}

export const ACSUCustomerLookup = ({ onCustomerFound }: CustomerLookupProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Please enter a phone number or scan QR code");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('acsu-customer-lookup', {
        body: { searchType: 'phone', searchValue: searchValue.trim() }
      });

      if (error) throw error;

      toast.success("Customer found!");
      onCustomerFound(data);
    } catch (error) {
      console.error('Customer lookup error:', error);
      toast.error("Customer not found. Please check the details.");
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    toast.info("QR Scanner feature coming soon!");
    // TODO: Implement QR scanner when camera access is available
  };

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Find Customer</h2>
          <p className="text-sm text-muted-foreground">Search by phone or scan QR code</p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="tel"
            placeholder="Enter phone number"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="h-12 text-lg"
          />
        </div>
        <GradientButton
          variant="secondary"
          onClick={handleQRScan}
          className="w-12 h-12 p-0"
        >
          <QrCode className="w-6 h-6" />
        </GradientButton>
      </div>

      <GradientButton
        variant="primary"
        onClick={handleSearch}
        disabled={loading}
        className="w-full h-12"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Search Customer
          </>
        )}
      </GradientButton>
    </div>
  );
};