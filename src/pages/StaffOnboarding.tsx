import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { CheckCircle, ArrowRight, UserCheck, FileText, Shield } from "lucide-react";

export default function StaffOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    certifications: [] as string[],
    availabilityPreferences: {},
  });

  // Check if user already has onboarding record
  const { data: existingOnboarding, isLoading } = useQuery({
    queryKey: ['my-onboarding'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('staff_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  useEffect(() => {
    if (existingOnboarding) {
      if (existingOnboarding.onboarding_status === 'approved') {
        navigate('/dashboard');
      } else if (existingOnboarding.onboarding_status === 'pending_approval') {
        setStep(4); // Show waiting for approval state
      }
    }
  }, [existingOnboarding, navigate]);

  // Submit onboarding mutation
  const submitOnboardingMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('staff_onboarding').upsert({
        user_id: user.id,
        emergency_contact_name: formData.emergencyContactName,
        emergency_contact_phone: formData.emergencyContactPhone,
        emergency_contact_relationship: formData.emergencyContactRelationship,
        certifications: formData.certifications,
        availability_preferences: formData.availabilityPreferences,
        onboarding_status: 'pending_approval',
        completed_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Onboarding information submitted!');
      setStep(4);
    },
    onError: (error) => {
      console.error('Onboarding error:', error);
      toast.error('Failed to submit onboarding information');
    },
  });

  const handleNext = () => {
    if (step === 1 && (!formData.emergencyContactName || !formData.emergencyContactPhone)) {
      toast.error('Please fill in emergency contact details');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitOnboardingMutation.mutate();
    }
  };

  const progress = (step / 4) * 100;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Awaiting Approval</h2>
            <p className="text-muted-foreground">
              Your onboarding information has been submitted successfully. An administrator will review your application shortly.
            </p>
          </div>
          <div className="p-4 bg-muted rounded-lg text-left">
            <p className="text-sm font-medium mb-2">What happens next?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Admin reviews your information</li>
              <li>• You'll receive an email notification</li>
              <li>• Once approved, you can start working!</li>
            </ul>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-6">
      <Card className="max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to BMS Pro!</h1>
          <p className="text-muted-foreground">
            Complete your onboarding to get started
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Emergency Contact</h3>
                  <p className="text-sm text-muted-foreground">Who should we contact in case of emergency?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergency_name">Contact Name *</Label>
                  <Input
                    id="emergency_name"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_phone">Contact Phone *</Label>
                  <Input
                    id="emergency_phone"
                    type="tel"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_relationship">Relationship</Label>
                  <Input
                    id="emergency_relationship"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                    placeholder="Spouse, Parent, Friend, etc."
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Certifications & Documents</h3>
                  <p className="text-sm text-muted-foreground">Add any relevant certifications (optional)</p>
                </div>
              </div>
              <div>
                <Label htmlFor="certifications">Certifications</Label>
                <Textarea
                  id="certifications"
                  value={formData.certifications.join('\n')}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    certifications: e.target.value.split('\n').filter(c => c.trim()) 
                  })}
                  placeholder="Enter each certification on a new line&#10;e.g., First Aid Certificate&#10;Food Safety Level 2"
                  rows={6}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  One certification per line
                </p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Review & Submit</h3>
                  <p className="text-sm text-muted-foreground">Review your information before submitting</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Emergency Contact</h4>
                  <p className="text-sm">{formData.emergencyContactName}</p>
                  <p className="text-sm text-muted-foreground">{formData.emergencyContactPhone}</p>
                  {formData.emergencyContactRelationship && (
                    <p className="text-sm text-muted-foreground">{formData.emergencyContactRelationship}</p>
                  )}
                </div>
                {formData.certifications.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Certifications</h4>
                    <ul className="text-sm space-y-1">
                      {formData.certifications.map((cert, idx) => (
                        <li key={idx}>• {cert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={submitOnboardingMutation.isPending}
          >
            {step === 3 ? (
              submitOnboardingMutation.isPending ? 'Submitting...' : 'Submit'
            ) : (
              <>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}