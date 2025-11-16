import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface PostServiceSurveyProps {
  bookingId: string;
  branchId: string;
  customerName: string;
  customerEmail?: string;
  staffId: string;
  service: string;
  onComplete?: () => void;
}

export function PostServiceSurvey({
  bookingId,
  branchId,
  customerName,
  customerEmail,
  staffId,
  service,
  onComplete,
}: PostServiceSurveyProps) {
  const [rating, setRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [serviceQuality, setServiceQuality] = useState<string>('');
  const [staffFriendliness, setStaffFriendliness] = useState<string>('');
  const [cleanliness, setCleanliness] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [wouldRecommend, setWouldRecommend] = useState<string>('');
  const [improvements, setImprovements] = useState('');
  const [positiveAspects, setPositiveAspects] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: any) => {
      // First, analyze sentiment
      setIsAnalyzing(true);
      let sentiment = 'neutral';
      let sentimentScore = 0;

      if (reviewText.trim()) {
        try {
          const { data: sentimentData, error: sentimentError } = await supabase.functions.invoke(
            'analyze-sentiment',
            {
              body: { reviewText },
            }
          );

          if (sentimentError) {
            console.error('Sentiment analysis error:', sentimentError);
          } else {
            sentiment = sentimentData.sentiment;
            sentimentScore = sentimentData.sentimentScore;
          }
        } catch (error) {
          console.error('Error calling sentiment analysis:', error);
        }
      }
      setIsAnalyzing(false);

      // Submit review
      const { error: reviewError } = await supabase.from('customer_reviews').insert({
        booking_id: bookingId,
        branch_id: branchId,
        customer_name: customerName,
        customer_email: customerEmail,
        staff_id: staffId,
        service,
        rating: reviewData.rating,
        review_text: reviewData.reviewText,
        sentiment,
        sentiment_score: sentimentScore,
        status: 'pending',
      });

      if (reviewError) throw reviewError;

      // Submit detailed survey
      const { error: surveyError } = await supabase.from('feedback_surveys').insert({
        booking_id: bookingId,
        branch_id: branchId,
        customer_name: customerName,
        customer_email: customerEmail,
        staff_id: staffId,
        service,
        overall_rating: reviewData.rating,
        service_quality_rating: reviewData.serviceQuality ? parseInt(reviewData.serviceQuality) : null,
        staff_friendliness_rating: reviewData.staffFriendliness ? parseInt(reviewData.staffFriendliness) : null,
        cleanliness_rating: reviewData.cleanliness ? parseInt(reviewData.cleanliness) : null,
        value_rating: reviewData.value ? parseInt(reviewData.value) : null,
        would_recommend: reviewData.wouldRecommend === 'yes',
        improvements_text: reviewData.improvements,
        positive_aspects: reviewData.positiveAspects,
      });

      if (surveyError) throw surveyError;
    },
    onSuccess: () => {
      toast.success('Thank you for your feedback!');
      if (onComplete) onComplete();
    },
    onError: (error) => {
      console.error('Survey submission error:', error);
      toast.error('Failed to submit feedback. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    submitReviewMutation.mutate({
      rating,
      reviewText,
      serviceQuality,
      staffFriendliness,
      cleanliness,
      value,
      wouldRecommend,
      improvements,
      positiveAspects,
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">How was your experience?</h3>
        <p className="text-sm text-muted-foreground">
          Your feedback helps us improve our service
        </p>
      </div>

      <Separator />

      {/* Overall Rating */}
      <div>
        <Label className="text-base mb-3 block">Overall Rating *</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-10 w-10 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Review Text */}
      <div>
        <Label htmlFor="review">Tell us about your experience</Label>
        <Textarea
          id="review"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts..."
          rows={4}
        />
      </div>

      <Separator />

      {/* Detailed Ratings */}
      <div className="space-y-4">
        <h4 className="font-medium">Rate specific aspects:</h4>

        <div>
          <Label>Service Quality</Label>
          <RadioGroup value={serviceQuality} onValueChange={setServiceQuality}>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem value={val.toString()} id={`quality-${val}`} />
                  <Label htmlFor={`quality-${val}`}>{val}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Staff Friendliness</Label>
          <RadioGroup value={staffFriendliness} onValueChange={setStaffFriendliness}>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem value={val.toString()} id={`friendliness-${val}`} />
                  <Label htmlFor={`friendliness-${val}`}>{val}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Cleanliness</Label>
          <RadioGroup value={cleanliness} onValueChange={setCleanliness}>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem value={val.toString()} id={`cleanliness-${val}`} />
                  <Label htmlFor={`cleanliness-${val}`}>{val}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div>
          <Label>Value for Money</Label>
          <RadioGroup value={value} onValueChange={setValue}>
            <div className="flex gap-4 mt-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <div key={val} className="flex items-center space-x-2">
                  <RadioGroupItem value={val.toString()} id={`value-${val}`} />
                  <Label htmlFor={`value-${val}`}>{val}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      </div>

      <Separator />

      {/* Would Recommend */}
      <div>
        <Label>Would you recommend us to others?</Label>
        <RadioGroup value={wouldRecommend} onValueChange={setWouldRecommend}>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="recommend-yes" />
              <Label htmlFor="recommend-yes">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="recommend-no" />
              <Label htmlFor="recommend-no">No</Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Additional Feedback */}
      <div>
        <Label htmlFor="positive">What did you like most?</Label>
        <Textarea
          id="positive"
          value={positiveAspects}
          onChange={(e) => setPositiveAspects(e.target.value)}
          placeholder="Tell us what we did well..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="improvements">How can we improve?</Label>
        <Textarea
          id="improvements"
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          placeholder="Suggestions for improvement..."
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitReviewMutation.isPending || isAnalyzing}
        className="w-full"
      >
        {isAnalyzing
          ? 'Analyzing feedback...'
          : submitReviewMutation.isPending
          ? 'Submitting...'
          : 'Submit Feedback'}
      </Button>
    </Card>
  );
}