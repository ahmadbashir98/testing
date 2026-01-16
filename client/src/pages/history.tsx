import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Cpu, Users, ArrowUpDown, TrendingUp, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function History() {
  const { user } = useAuth();

  const { data: miningClaims = [], isLoading: claimsLoading } = useQuery<any[]>({
    queryKey: ["/api/mining/claims", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/mining/claims/${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch mining claims");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery<any[]>({
    queryKey: ["/api/referrals", user?.id, "commissions"],
    queryFn: async () => {
      const res = await fetch(`/api/referrals/${user?.id}/commissions`);
      if (!res.ok) throw new Error("Failed to fetch commissions");
      return res.json();
    },
    enabled: !!user?.id,
  });

  const { data: deposits = [], isLoading: depositsLoading } = useQuery<any[]>({
    queryKey: ["/api/deposits", user?.id],
    enabled: !!user?.id,
  });

  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<any[]>({
    queryKey: ["/api/withdrawals", user?.id],
    enabled: !!user?.id,
  });

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, "MMM d, yyyy h:mm a");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-blue-950/10 pb-20">
      <header className="flex items-center gap-3 py-4 px-4 border-b border-border/50">
        <Link href="/payments">
          <button className="p-2 rounded-lg hover:bg-white/10" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-xl font-bold">Account History</h1>
      </header>

      <div className="p-4">
        <Tabs defaultValue="mining" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="mining" className="text-xs sm:text-sm" data-testid="tab-mining">
              <Cpu className="w-4 h-4 mr-1 hidden sm:inline" />
              Mining
            </TabsTrigger>
            <TabsTrigger value="commission" className="text-xs sm:text-sm" data-testid="tab-commission">
              <Users className="w-4 h-4 mr-1 hidden sm:inline" />
              Commission
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm" data-testid="tab-transactions">
              <ArrowUpDown className="w-4 h-4 mr-1 hidden sm:inline" />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mining" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="font-semibold">Mining Income</h2>
            </div>
            {claimsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : miningClaims.length === 0 ? (
              <Card className="p-8 text-center">
                <Cpu className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No mining income yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start mining to see your earnings here</p>
              </Card>
            ) : (
              miningClaims.map((claim: any) => (
                <Card key={claim.id} className="p-4" data-testid={`card-mining-${claim.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-400">+${parseFloat(claim.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {claim.machinesClaimed} machine{claim.machinesClaimed > 1 ? "s" : ""} claimed
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(claim.createdAt)}</p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="commission" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold">Commission History</h2>
            </div>
            {commissionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : commissions.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No commission history yet</p>
                <p className="text-xs text-muted-foreground mt-1">Invite friends to earn referral commissions</p>
              </Card>
            ) : (
              commissions.map((commission: any) => (
                <Card key={commission.id} className="p-4" data-testid={`card-commission-${commission.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-medium text-green-400">+${parseFloat(commission.amount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          Level {commission.level} • {commission.sourceType === "daily_claim" ? "Daily earnings" : "Deposit"}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(commission.createdAt)}</p>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-5 h-5 text-blue-400" />
              <h2 className="font-semibold">Deposits & Withdrawals</h2>
            </div>
            {depositsLoading || withdrawalsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : deposits.length === 0 && withdrawals.length === 0 ? (
              <Card className="p-8 text-center">
                <ArrowUpDown className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your deposits and withdrawals will appear here</p>
              </Card>
            ) : (
              <>
                {deposits.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-green-400" />
                      Deposits
                    </h3>
                    {deposits.map((d: any) => (
                      <Card key={d.id} className="p-4" data-testid={`card-deposit-${d.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                              <ArrowDownLeft className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-green-400">+${parseFloat(d.amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">PKR {parseFloat(d.pkrAmount || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(d.status)}`}>
                              {d.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(d.createdAt)}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {withdrawals.length > 0 && (
                  <div className="space-y-3 mt-6">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-red-400" />
                      Withdrawals
                    </h3>
                    {withdrawals.map((w: any) => (
                      <Card key={w.id} className="p-4" data-testid={`card-withdrawal-${w.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                              <ArrowUpRight className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                              <p className="font-medium text-red-400">-${parseFloat(w.amount || 0).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">PKR {parseFloat(w.pkrAmount || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(w.status)}`}>
                              {w.status}
                            </span>
                            <p className="text-xs text-muted-foreground mt-1">{formatDate(w.createdAt)}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
