import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Flame, User, Phone, Cpu, TrendingUp, MessageCircle, Sparkles, Building2, Headset, Send, Loader2, X } from "lucide-react";
import { SiFacebook, SiWhatsapp } from "react-icons/si";
import alexanderPhoto from "@assets/generated_images/executive_chairman_professional_headshot.png";
import marcusPhoto from "@assets/generated_images/founder_ceo_professional_headshot.png";
import sophiaPhoto from "@assets/generated_images/managing_director_professional_headshot.png";
import { FloatingCoins } from "@/components/floating-coins";
import { MiningButton } from "@/components/mining-button";
import { StatsCards } from "@/components/stats-cards";
import { BottomNav } from "@/components/bottom-nav";
import { AnnouncementsCarousel } from "@/components/announcements-carousel";
import { ActiveSessionCard } from "@/components/active-session-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MINING_MACHINES_DATA } from "@shared/schema";

export default function Dashboard() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [nextClaimTime, setNextClaimTime] = useState<Date | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: supportMessages = [], refetch: refetchMessages } = useQuery<any[]>({
    queryKey: ["/api/support/messages", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/support/messages/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!user?.id && chatOpen,
    refetchInterval: chatOpen ? 5000 : false,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", "/api/support/messages", {
        userId: user?.id,
        username: user?.username,
        message,
      });
      return await res.json();
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [supportMessages, chatOpen]);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const { data: miningStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<any>({
    queryKey: ["/api/mining/status", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/mining/status/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch mining status");
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  const { data: userData } = useQuery<any>({
    queryKey: ["/api/users", user?.id],
    enabled: !!user?.id,
  });

  const { data: userMachines = [] } = useQuery<any[]>({
    queryKey: ["/api/machines/owned", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/machines/owned/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch machines");
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Fetch active mining sessions for individual timers
  const { data: activeSessions = [], refetch: refetchSessions } = useQuery<any[]>({
    queryKey: ["/api/mining/sessions", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/mining/sessions/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      return res.json();
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (miningStatus?.serverTime) {
      const serverNow = new Date(miningStatus.serverTime).getTime();
      const clientNow = Date.now();
      setServerTimeOffset(serverNow - clientNow);
    }
    if (miningStatus?.nextClaimTime) {
      setNextClaimTime(new Date(miningStatus.nextClaimTime));
    } else {
      setNextClaimTime(null);
    }
  }, [miningStatus]);

  useEffect(() => {
    if (userData) {
      login(userData);
    }
  }, [userData, login]);

  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mining/claim", { userId: user?.id });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mining/status", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/mining/sessions", user?.id] });
      toast({
        title: "Reward claimed!",
        description: `You earned $${data.reward.toFixed(2)} from ${data.machinesClaimed} machine(s)!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to claim reward",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const hasClaimable = miningStatus?.claimableMachines > 0;
  const hasMachines = miningStatus?.totalMachines > 0;
  const isLoading = statusLoading || claimRewardMutation.isPending;

  const machinesWithData = userMachines.map((um: any) => {
    const machineData = MINING_MACHINES_DATA.find(m => m.id === um.machineId);
    const purchaseDate = new Date(um.purchasedAt);
    const durationDays = machineData?.duration || 60;
    const endDate = new Date(purchaseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const totalDuration = endDate.getTime() - purchaseDate.getTime();
    const elapsed = now.getTime() - purchaseDate.getTime();
    const progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      ...um,
      machineData,
      progressPercent,
      daysRemaining,
      isActive: daysRemaining > 0,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-24 overflow-y-auto">
      <header className="flex items-center justify-center gap-2 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-50">
        <Flame className="w-8 h-8 text-amber-400" />
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
          CloudFire
        </h1>
      </header>

      <FloatingCoins />

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border/50">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-amber-500 flex items-center justify-center overflow-hidden border-2 border-amber-400/50">
            {userData?.profilePic ? (
              <img 
                src={userData.profilePic} 
                alt="Profile" 
                className="w-full h-full object-cover"
                data-testid="img-profile-pic"
              />
            ) : (
              <User className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold" data-testid="text-dashboard-username">
              {userData?.username || user?.username}
            </h2>
            {(userData?.phoneNumber || user?.phoneNumber) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground" data-testid="text-dashboard-phone">
                <Phone className="w-3 h-3" />
                {userData?.phoneNumber || user?.phoneNumber}
              </div>
            )}
          </div>
        </div>

        <StatsCards
          totalAssets={userData?.balance ?? user?.balance ?? 0}
          totalMiners={userData?.totalMiners ?? user?.totalMiners ?? 0}
        />

        <div className="flex justify-center py-6">
          <MiningButton
            hasMachines={hasMachines}
            hasClaimable={hasClaimable}
            claimableReward={miningStatus?.claimableReward || 0}
            claimableMachines={miningStatus?.claimableMachines || 0}
            nextClaimTime={nextClaimTime}
            serverTimeOffset={serverTimeOffset}
            onClaimReward={() => claimRewardMutation.mutate()}
            onTimerExpired={() => refetchStatus()}
            isLoading={isLoading}
          />
        </div>

        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Active Machines</h2>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {activeSessions.length} Mining
              </Badge>
            </div>

            <div className="space-y-3">
              {activeSessions.map((session: any) => (
                <ActiveSessionCard 
                  key={session.id} 
                  session={session}
                  serverTimeOffset={serverTimeOffset}
                />
              ))}
            </div>
          </div>
        )}

        {activeSessions.length === 0 && (
          <Card className="bg-gradient-to-br from-blue-500/5 to-amber-500/5 border-blue-500/20">
            <CardContent className="p-6 text-center">
              <Cpu className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No Active Mining Sessions</h3>
              <p className="text-sm text-muted-foreground">
                Rent mining machines to start earning!
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" style={{ filter: "drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))" }} />
            <h2 
              className="text-lg font-bold"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              What's New
            </h2>
          </div>

          <AnnouncementsCarousel />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold">Customer Support</h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
              onClick={() => window.open("https://wa.me/923001234567", "_blank")}
              data-testid="button-support-whatsapp"
            >
              <SiWhatsapp className="w-6 h-6 text-green-500" />
              <span className="text-xs">WhatsApp</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
              onClick={() => window.open("https://facebook.com/cloudfire", "_blank")}
              data-testid="button-support-facebook"
            >
              <SiFacebook className="w-6 h-6 text-blue-500" />
              <span className="text-xs">Facebook</span>
            </Button>

            <Button
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
              onClick={() => setChatOpen(true)}
              data-testid="button-support-consultant"
            >
              <Headset className="w-6 h-6 text-purple-500" />
              <span className="text-xs">Consultant</span>
            </Button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden mt-6" data-testid="section-about-cloudfire">
          <div className="bg-white p-6 space-y-6">
            <div className="flex items-center gap-2 justify-center">
              <Building2 className="w-6 h-6 text-gray-800" />
              <h2 className="text-xl font-bold text-gray-900">About CloudFire Miner</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg">
                  <img src={alexanderPhoto} alt="Alexander V. Thorne" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Alexander V. Thorne</p>
                  <p className="text-xs text-gray-600">Executive Chairman</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg">
                  <img src={marcusPhoto} alt="Marcus Sterling" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Marcus Sterling</p>
                  <p className="text-xs text-gray-600">Founder & CEO</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg">
                  <img src={sophiaPhoto} alt="Sophia Reynolds" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Sophia Reynolds</p>
                  <p className="text-xs text-gray-600">Managing Director</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Registration</span>
                <span className="font-medium text-gray-900">USA-Registered Company</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Validity</span>
                <span className="font-medium text-gray-900">2026 – 2030</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Operations</span>
                <span className="font-medium text-gray-900">Global Mining Network</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-muted-foreground">
            Press the mining button to start earning. Rent more machines to increase your daily profits!
          </p>
        </div>
      </main>

      <BottomNav />

      {/* Consultant Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-md h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-4 py-3 border-b bg-gradient-to-r from-purple-600 to-indigo-600">
            <DialogTitle className="flex items-center gap-2 text-white">
              <Headset className="w-5 h-5" />
              Customer Support
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {supportMessages.length === 0 ? (
                <div className="text-center py-8">
                  <Headset className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No messages yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Send a message to start a conversation with our support team
                  </p>
                </div>
              ) : (
                supportMessages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isFromAdmin ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        msg.isFromAdmin
                          ? "bg-gray-100 dark:bg-gray-800 text-foreground"
                          : "bg-purple-600 text-white"
                      }`}
                    >
                      {msg.isFromAdmin && (
                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
                          Support Team
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.isFromAdmin ? "text-muted-foreground" : "text-white/70"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !messageInput.trim()}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="button-send-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
