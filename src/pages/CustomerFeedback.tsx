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
import { MessageSquare, Star, TrendingUp, ThumbsUp, ThumbsDown, Send, Flag, CheckCircle, Filter } from "lucide-react";
import { format } from "date-fns";

export default function CustomerFeedback() {
  const { selectedBranch } = useBranch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("reviews");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterSentiment, setFilterSentiment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch reviews
  const { data: reviews = [], isLoading: loadingReviews } = useQuery({
    queryKey: ['customer-reviews', selectedBranch?.id, filterRating, filterSentiment, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('customer_reviews')
        .select(`
          *,
          staff:profiles!customer_reviews_staff_id_fkey(full_name),
          responder:profiles!customer_reviews_responded_by_fkey(full_name)
        `)
        .eq('salon_id', selectedBranch?.id)
        .order('created_at', { ascending: false });

      if (filterRating !== 'all') {
        query = query.eq('rating', parseInt(filterRating));
      }
      if (filterSentiment !== 'all') {
        query = query.eq('sentiment', filterSentiment);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Fetch surveys
  const { data: surveys = [], isLoading: loadingSurveys } = useQuery({
    queryKey: ['feedback-surveys', selectedBranch?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_surveys')
        .select(`
          *,
          staff:profiles!feedback_surveys_staff_id_fkey(full_name)
        `)
        .eq('salon_id', selectedBranch?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedBranch?.id,
  });

  // Calculate statistics
  const stats = {
    totalReviews: reviews.length,
    averageRating: reviews.length > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : '0.0',
    positiveReviews: reviews.filter(r => r.sentiment === 'positive').length,
    negativeReviews: reviews.filter(r => r.sentiment === 'negative').length,
    pendingReviews: reviews.filter(r => r.status === 'pending').length,
  };

  // Update review status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ reviewId, status }: { reviewId: string; status: string }) => {
      const { error } = await supabase
        .from('customer_reviews')
        .update({ status })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
      toast.success('Review status updated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  // Respond to review mutation
  const respondMutation = useMutation({
    mutationFn: async ({ reviewId, responseText }: { reviewId: string; responseText: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('customer_reviews')
        .update({
          response_text: responseText,
          responded_by: user?.id,
          responded_at: new Date().toISOString(),
          status: 'responded',
        })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
      toast.success('Response sent successfully');
    },
    onError: () => toast.error('Failed to send response'),
  });

  if (!selectedBranch) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Please select a branch to view feedback</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Feedback & Reviews</h1>
          <p className="text-muted-foreground">Manage reviews and surveys for {selectedBranch.name}</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
              <p className="text-2xl font-bold">{stats.totalReviews}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">{stats.averageRating}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <ThumbsUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Positive</p>
              <p className="text-2xl font-bold">{stats.positiveReviews}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <ThumbsDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Negative</p>
              <p className="text-2xl font-bold">{stats.negativeReviews}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingReviews}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reviews">Reviews & Ratings</TabsTrigger>
          <TabsTrigger value="surveys">Detailed Surveys</TabsTrigger>
          <TabsTrigger value="followups">Follow-up Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="space-y-4">
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-4 flex-1">
                <Select value={filterRating} onValueChange={setFilterRating}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSentiment} onValueChange={setFilterSentiment}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sentiment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sentiments</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="responded">Responded</SelectItem>
                    <SelectItem value="flagged">Flagged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{review.customer_name}</h3>
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        {review.sentiment && (
                          <Badge
                            variant={
                              review.sentiment === 'positive'
                                ? 'default'
                                : review.sentiment === 'negative'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {review.sentiment}
                          </Badge>
                        )}
                        <Badge variant="outline">{review.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Service: {review.service} • Staff: {review.staff?.full_name || 'N/A'}
                      </p>
                      <p className="text-sm mb-2">{review.review_text}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  {review.response_text && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Response:</p>
                      <p className="text-sm">{review.response_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        By {review.responder?.full_name} on{' '}
                        {review.responded_at ? format(new Date(review.responded_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    {review.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ reviewId: review.id, status: 'approved' })}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ reviewId: review.id, status: 'flagged' })}
                        >
                          <Flag className="h-4 w-4 mr-2" />
                          Flag
                        </Button>
                      </>
                    )}
                    {!review.response_text && (
                      <RespondDialog
                        reviewId={review.id}
                        customerName={review.customer_name}
                        onRespond={respondMutation.mutate}
                      />
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {reviews.length === 0 && (
              <Card className="p-8">
                <p className="text-center text-muted-foreground">No reviews found</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <Card className="p-6">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Friendliness</TableHead>
                    <TableHead>Cleanliness</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Recommend</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>{survey.customer_name}</TableCell>
                      <TableCell>{survey.service}</TableCell>
                      <TableCell>{survey.overall_rating}/5</TableCell>
                      <TableCell>{survey.service_quality_rating || '-'}/5</TableCell>
                      <TableCell>{survey.staff_friendliness_rating || '-'}/5</TableCell>
                      <TableCell>{survey.cleanliness_rating || '-'}/5</TableCell>
                      <TableCell>{survey.value_rating || '-'}/5</TableCell>
                      <TableCell>
                        {survey.would_recommend ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(survey.completed_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                  {surveys.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        No surveys found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="followups" className="space-y-4">
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Follow-up message system ready. Automated messages can be configured per review.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Respond Dialog Component
function RespondDialog({ reviewId, customerName, onRespond }: any) {
  const [responseText, setResponseText] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    onRespond({ reviewId, responseText });
    setResponseText('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Send className="h-4 w-4 mr-2" />
          Respond
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Respond to {customerName}</DialogTitle>
          <DialogDescription>
            Write a thoughtful response to this customer's review
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="response">Your Response</Label>
            <Textarea
              id="response"
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Thank you for your feedback..."
              rows={6}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Send Response</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}