import { useState } from "react";
import { Search, QrCode, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/button-variants";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startQRScanner, stopQRScanner, prepareScannerUI, cleanupScannerUI } from "@/utils/qrScanner";
import { Capacitor } from "@capacitor/core";

interface CustomerLookupProps {
  onCustomerFound: (customer: any) => void;
}

export const ACSUCustomerLookup = ({ onCustomerFound }: CustomerLookupProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const isNative = Capacitor.isNativePlatform();

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

  const handleQRScan = async () => {
    if (!isNative) {
      toast.info("QR scanning requires the native mobile app. Please install the app on your device.");
      return;
    }

    try {
      setScanning(true);
      prepareScannerUI();
      
      toast.info("Point your camera at the QR code", { duration: 2000 });
      
      const qrCode = await startQRScanner();
      
      if (qrCode) {
        // QR code should contain customer ID or phone number
        setSearchValue(qrCode);
        
        // Automatically search for the customer
        const { data, error } = await supabase.functions.invoke('acsu-customer-lookup', {
          body: { searchType: 'qr', searchValue: qrCode }
        });

        if (error) throw error;

        toast.success("Customer found via QR scan!");
        onCustomerFound(data);
      } else {
        toast.info("No QR code detected");
      }
    } catch (error) {
      console.error('QR scan error:', error);
      toast.error("Failed to scan QR code. Please try again or enter manually.");
    } finally {
      cleanupScannerUI();
      setScanning(false);
    }
  };

  const handleStopScan = async () => {
    await stopQRScanner();
    cleanupScannerUI();
    setScanning(false);
  };

  return (
    <>
      {scanning && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-10">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div>
                <h3 className="text-white font-bold text-lg">Scan QR Code</h3>
                <p className="text-white/80 text-sm">Align the QR code within the frame</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStopScan}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-64 border-4 border-white rounded-2xl shadow-glow animate-pulse"></div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-center text-sm">
              Point your camera at the customer's ACSU QR code
            </p>
          </div>
        </div>
      )}
      
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
              disabled={scanning}
            />
          </div>
          <GradientButton
            variant="secondary"
            onClick={handleQRScan}
            className="w-12 h-12 p-0"
            disabled={scanning || loading}
          >
            {scanning ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <QrCode className="w-6 h-6" />
            )}
          </GradientButton>
        </div>

        <GradientButton
          variant="primary"
          onClick={handleSearch}
          disabled={loading || scanning}
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

        {isNative && (
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Use the QR scanner for instant customer lookup
          </p>
        )}
      </div>
    </>
  );
};