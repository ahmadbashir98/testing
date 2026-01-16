import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame, User, Wallet, Cpu, Gift, LogOut, Shield, Camera, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useState } from "react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: userData, isLoading } = useQuery<any>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("profilePic", file);
    formData.append("userId", user.id);

    try {
      const response = await fetch("/api/uploads/profile-pic", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/users", user.id] });
      toast({
        title: "Profile picture updated!",
        description: "Your new profile picture is now visible.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const displayUser = userData || user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-20">
      <header className="flex items-center justify-center gap-2 py-4 border-b border-border/50">
        <Flame className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
          CloudFire
        </h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-amber-500 flex items-center justify-center overflow-hidden border-3 border-amber-400/50">
              {displayUser?.profilePic ? (
                <img 
                  src={displayUser.profilePic} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  data-testid="img-profile-avatar"
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center border-2 border-background transition-colors"
              data-testid="button-upload-profile-pic"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleProfilePicUpload}
              className="hidden"
              data-testid="input-profile-pic"
            />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <h2 className="text-2xl font-bold" data-testid="text-username">
              {displayUser?.username}
            </h2>
          )}
          <p className="text-sm text-muted-foreground">Tap camera to upload profile picture</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Balance</div>
                {isLoading ? (
                  <Skeleton className="h-6 w-20" />
                ) : (
                  <div className="font-bold text-amber-400" data-testid="text-profile-balance">
                    ${(displayUser?.balance || 0).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Cpu className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Miners</div>
                {isLoading ? (
                  <Skeleton className="h-6 w-12" />
                ) : (
                  <div className="font-bold text-blue-400" data-testid="text-profile-miners">
                    {displayUser?.totalMiners || 0}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Gift className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground">Referral Earnings</div>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <div className="font-bold text-green-400" data-testid="text-profile-referral">
                  ${(displayUser?.totalReferralEarnings || 0).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => setLocation("/team")}
              data-testid="button-goto-team"
            >
              <Gift className="w-5 h-5" />
              Refer & Earn
            </Button>
            {displayUser?.isAdmin && (
              <Button
                variant="outline"
                className="w-full justify-start gap-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                onClick={() => setLocation("/admin-portal")}
                data-testid="button-goto-admin"
              >
                <Shield className="w-5 h-5" />
                Admin Panel
              </Button>
            )}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
