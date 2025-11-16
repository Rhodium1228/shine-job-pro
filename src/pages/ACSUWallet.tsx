import { useState } from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ACSUCustomerLookup } from "@/components/ACSUCustomerLookup";
import { ACSUWalletCard } from "@/components/ACSUWalletCard";
import { ACSUPointsAward } from "@/components/ACSUPointsAward";
import { ACSUPromotions } from "@/components/ACSUPromotions";
import BottomNav from "@/components/BottomNav";

const ACSUWallet = () => {
  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleCustomerFound = (customer: any) => {
    setSelectedCustomer(customer);
  };

  const handlePointsAwarded = () => {
    // Refresh customer data
    if (selectedCustomer) {
      setSelectedCustomer({
        ...selectedCustomer,
        walletBalance: selectedCustomer.walletBalance + parseInt('0'),
      });
    }
  };

  const handleBack = () => {
    if (selectedCustomer) {
      setSelectedCustomer(null);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary p-6 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Wallet className="w-7 h-7 text-white" />
            <h1 className="text-2xl font-bold text-white">ACSU Wallet</h1>
          </div>
        </div>
        <p className="text-white/90 text-sm ml-12">
          Award and manage customer loyalty points
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {!selectedCustomer ? (
          <ACSUCustomerLookup onCustomerFound={handleCustomerFound} />
        ) : (
          <div className="space-y-6 animate-fade-in">
            <ACSUWalletCard customer={selectedCustomer} />

            <Tabs defaultValue="award" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="award">Award Points</TabsTrigger>
                <TabsTrigger value="promotions">Promotions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="award" className="mt-6">
                <ACSUPointsAward 
                  customer={selectedCustomer} 
                  onPointsAwarded={handlePointsAwarded}
                />
              </TabsContent>
              
              <TabsContent value="promotions" className="mt-6">
                <ACSUPromotions customer={selectedCustomer} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ACSUWallet;