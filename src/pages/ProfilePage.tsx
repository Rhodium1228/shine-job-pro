import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Camera, Star, Clock, Briefcase, LogOut, Save, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/button-variants";
import { Switch } from "@/components/ui/switch";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import { z } from "zod";

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  hourly_rate: z.number().min(0).optional(),
  specialties: z.array(z.string()).optional(),
});

interface WorkingHours {
  [key: string]: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newSpecialty, setNewSpecialty] = useState("");
  
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    bio: "",
    hourly_rate: 0,
    specialties: [] as string[],
    rating: 0,
    total_reviews: 0,
  });

  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { enabled: true, start: "09:00", end: "17:00" },
    tuesday: { enabled: true, start: "09:00", end: "17:00" },
    wednesday: { enabled: true, start: "09:00", end: "17:00" },
    thursday: { enabled: true, start: "09:00", end: "17:00" },
    friday: { enabled: true, start: "09:00", end: "17:00" },
    saturday: { enabled: false, start: "09:00", end: "17:00" },
    sunday: { enabled: false, start: "09:00", end: "17:00" },
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        setProfile({
          full_name: profileData.full_name || "",
          email: profileData.email || user.email || "",
          phone: profileData.phone || "",
          bio: profileData.bio || "",
          hourly_rate: profileData.hourly_rate || 0,
          specialties: profileData.specialties || [],
          rating: profileData.rating || 0,
          total_reviews: profileData.total_reviews || 0,
        });

        setAvatarUrl(profileData.avatar_url);
        
        if (profileData.working_hours) {
          setWorkingHours(profileData.working_hours as WorkingHours);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", userId);

      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      toast.success("Photo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setSaving(true);

    try {
      profileSchema.parse({
        ...profile,
        specialties: profile.specialties,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
          hourly_rate: profile.hourly_rate,
          specialties: profile.specialties,
          working_hours: workingHours,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error("Error saving profile:", error);
        toast.error("Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !profile.specialties.includes(newSpecialty.trim())) {
      setProfile({
        ...profile,
        specialties: [...profile.specialties, newSpecialty.trim()],
      });
      setNewSpecialty("");
    }
  };

  const handleRemoveSpecialty = (specialty: string) => {
    setProfile({
      ...profile,
      specialties: profile.specialties.filter((s) => s !== specialty),
    });
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to logout");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="gradient-primary text-white p-6 pb-8 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full gradient-accent flex items-center justify-center cursor-pointer hover:scale-110 transition-transform shadow-lg"
            >
              <Camera className="w-5 h-5 text-white" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
          <h2 className="text-xl font-bold mt-4">{profile.full_name}</h2>
          <p className="text-white/80 text-sm">{profile.email}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Client Ratings */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <Star className="w-6 h-6 text-warning" />
            <h3 className="text-lg font-bold text-foreground">Client Ratings</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">{profile.rating.toFixed(1)}</div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(profile.rating) ? "text-warning fill-warning" : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-foreground">{profile.total_reviews}</p>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
            </div>
          </div>
        </div>

        {/* Personal Details */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Personal Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="pl-10 opacity-75 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="mt-1"
                placeholder="Tell clients about yourself..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={profile.hourly_rate}
                onChange={(e) => setProfile({ ...profile, hourly_rate: parseFloat(e.target.value) })}
                className="mt-1"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Service Specialties */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="w-6 h-6 text-accent" />
            <h3 className="text-lg font-bold text-foreground">Service Specialties</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                placeholder="Add a specialty..."
                onKeyPress={(e) => e.key === "Enter" && handleAddSpecialty()}
              />
              <Button onClick={handleAddSpecialty} className="gradient-accent text-white">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((specialty) => (
                <div
                  key={specialty}
                  className="px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium flex items-center gap-2"
                >
                  {specialty}
                  <button
                    onClick={() => handleRemoveSpecialty(specialty)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-6 h-6 text-success" />
            <h3 className="text-lg font-bold text-foreground">Working Hours</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(workingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center gap-3">
                <Switch
                  checked={hours.enabled}
                  onCheckedChange={(checked) =>
                    setWorkingHours({
                      ...workingHours,
                      [day]: { ...hours, enabled: checked },
                    })
                  }
                />
                <span className="w-24 font-medium text-foreground capitalize">{day}</span>
                <Input
                  type="time"
                  value={hours.start}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      [day]: { ...hours, start: e.target.value },
                    })
                  }
                  disabled={!hours.enabled}
                  className="w-28"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={hours.end}
                  onChange={(e) =>
                    setWorkingHours({
                      ...workingHours,
                      [day]: { ...hours, end: e.target.value },
                    })
                  }
                  disabled={!hours.enabled}
                  className="w-28"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <GradientButton
          onClick={handleSaveProfile}
          disabled={saving}
          variant="success"
          className="w-full h-14 text-lg"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </GradientButton>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfilePage;
