import { useState, useEffect } from "react";
import { Cpu, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ActiveSessionCardProps {
  session: {
    id: string;
    machineName: string;
    dailyProfit: string | number;
    startTime: string;
    endTime: string;
    remainingSeconds: number;
    status: string;
  };
  serverTimeOffset?: number;
}

export function ActiveSessionCard({ session, serverTimeOffset = 0 }: ActiveSessionCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now() + serverTimeOffset;
      const endTime = new Date(session.endTime).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("READY!");
        setIsReady(true);
        return true;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
      setIsReady(false);
      return false;
    };

    calculateTimeLeft();
    const interval = setInterval(() => {
      const expired = calculateTimeLeft();
      if (expired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.endTime, serverTimeOffset]);

  const dailyProfit = typeof session.dailyProfit === 'string' 
    ? parseFloat(session.dailyProfit) 
    : session.dailyProfit;

  return (
    <Card 
      className={`overflow-visible ${
        isReady 
          ? "bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/40 animate-pulse" 
          : "bg-gradient-to-br from-blue-500/5 to-blue-600/5 border-blue-500/20"
      }`}
      data-testid={`card-session-${session.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                isReady 
                  ? "bg-gradient-to-br from-amber-500 to-amber-600" 
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
              }`}>
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                isReady ? "bg-amber-400 animate-ping" : "bg-green-500 animate-pulse"
              }`} />
            </div>
            <div>
              <div className="font-semibold text-sm">{session.machineName}</div>
              <div className="flex items-center gap-1 text-xs text-amber-400">
                <TrendingUp className="w-3 h-3" />
                <span>${dailyProfit.toFixed(2)}/day</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <Badge 
              className={`mb-1 ${
                isReady 
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
                  : "bg-blue-500/20 text-blue-400 border-blue-500/30"
              }`}
            >
              {isReady ? "Claimable" : "Mining"}
            </Badge>
            <div className={`flex items-center gap-1 text-lg font-mono font-bold ${
              isReady ? "text-amber-400" : "text-blue-400"
            }`}>
              <Clock className="w-4 h-4" />
              <span data-testid={`timer-${session.id}`}>{timeLeft}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
