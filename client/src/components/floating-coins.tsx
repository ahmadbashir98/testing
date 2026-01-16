import { Coins } from "lucide-react";

const coinPositions = [
  { left: "5%", delay: "0s", size: 28, opacity: 0.7 },
  { left: "15%", delay: "0.5s", size: 22, opacity: 0.5 },
  { left: "30%", delay: "1s", size: 32, opacity: 0.8 },
  { left: "50%", delay: "0.3s", size: 26, opacity: 0.6 },
  { left: "65%", delay: "0.8s", size: 30, opacity: 0.75 },
  { left: "80%", delay: "0.2s", size: 24, opacity: 0.55 },
  { left: "92%", delay: "0.6s", size: 28, opacity: 0.65 },
];

export function FloatingCoins() {
  return (
    <div className="relative h-20 overflow-hidden">
      {coinPositions.map((coin, index) => (
        <div
          key={index}
          className="absolute top-4"
          style={{
            left: coin.left,
            animationDelay: coin.delay,
            opacity: coin.opacity,
          }}
        >
          <div
            className={index % 2 === 0 ? "animate-float" : "animate-float-slow"}
          >
            <Coins
              size={coin.size}
              className={
                index % 3 === 0
                  ? "text-amber-400 drop-shadow-lg"
                  : index % 3 === 1
                  ? "text-blue-400 drop-shadow-lg"
                  : "text-amber-500 drop-shadow-lg"
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
}
