/**
 * Staff API Service
 * High-level service layer for staff-related API operations
 */

import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export interface StaffProfile {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    bio: string | null;
    specialties: string[] | null;
    hourly_rate: number | null;
    rating: number | null;
    total_reviews: number | null;
    availability_status: string | null;
    working_hours: any;
    default_salon_id: string | null;
    role: string | null;
  };
  branches: Array<{
    id: string;
    isDefault: boolean;
    name: string;
    address: string | null;
    phone: string | null;
    logo_url: string | null;
  }>;
}

export interface Booking {
  id: string;
  staff_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  service: string;
  price: string;
  duration: string;
  booking_time: string;
  status: string;
  notes: string | null;
  salon_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingsResponse {
  bookings: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EarningsSummary {
  totalJobs: number;
  totalHours: number;
  totalRevenue: number;
  estimatedEarnings: number;
  hourlyRate: number;
  averageJobValue: number;
}

export interface DailyBreakdown {
  date: string;
  jobs: number;
  hours: number;
  revenue: number;
}

export interface EarningsResponse {
  summary: EarningsSummary;
  dailyBreakdown: DailyBreakdown[];
}

class StaffApiService {
  async getProfile(): Promise<StaffProfile> {
    try {
      return await apiClient.getStaffProfile();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      toast.error(message);
      throw error;
    }
  }

  async getBookings(params?: {
    status?: string;
    branchId?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<BookingsResponse> {
    try {
      return await apiClient.getStaffBookings(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch bookings';
      toast.error(message);
      throw error;
    }
  }

  async acceptBooking(bookingId: string): Promise<void> {
    try {
      await apiClient.acceptBooking(bookingId);
      toast.success('Booking accepted successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept booking';
      toast.error(message);
      throw error;
    }
  }

  async declineBooking(bookingId: string, reason?: string): Promise<void> {
    try {
      await apiClient.declineBooking(bookingId, reason);
      toast.success('Booking declined');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to decline booking';
      toast.error(message);
      throw error;
    }
  }

  async startJob(bookingId: string): Promise<void> {
    try {
      await apiClient.startJob(bookingId);
      toast.success('Job started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start job';
      toast.error(message);
      throw error;
    }
  }

  async pauseJob(jobId: string, reason?: string): Promise<void> {
    try {
      await apiClient.pauseJob(jobId, reason);
      toast.success('Job paused');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to pause job';
      toast.error(message);
      throw error;
    }
  }

  async resumeJob(jobId: string): Promise<void> {
    try {
      await apiClient.resumeJob(jobId);
      toast.success('Job resumed');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resume job';
      toast.error(message);
      throw error;
    }
  }

  async completeJob(jobId: string): Promise<void> {
    try {
      await apiClient.completeJob(jobId);
      toast.success('Job completed!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete job';
      toast.error(message);
      throw error;
    }
  }

  async cancelJob(jobId: string, reason?: string): Promise<void> {
    try {
      await apiClient.cancelJob(jobId, reason);
      toast.success('Job cancelled');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel job';
      toast.error(message);
      throw error;
    }
  }

  async startBreak(duration: number): Promise<void> {
    try {
      await apiClient.startBreak(duration);
      toast.success(`Break started for ${duration} minutes`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start break';
      toast.error(message);
      throw error;
    }
  }

  async endBreak(): Promise<void> {
    try {
      await apiClient.endBreak();
      toast.success('Break ended');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to end break';
      toast.error(message);
      throw error;
    }
  }

  async awardAcsuPoints(
    customerId: string,
    points: number,
    reason?: string,
    branchId?: string
  ): Promise<void> {
    try {
      await apiClient.awardAcsuPoints(customerId, points, reason, branchId);
      toast.success(`${points} points awarded successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to award points';
      toast.error(message);
      throw error;
    }
  }

  async getEarnings(params?: {
    dateFrom?: string;
    dateTo?: string;
    branchId?: string;
  }): Promise<EarningsResponse> {
    try {
      return await apiClient.getStaffEarnings(params);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch earnings';
      toast.error(message);
      throw error;
    }
  }
}

export const staffApi = new StaffApiService();
