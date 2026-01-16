import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Bell,
  Smartphone,
  Bitcoin,
  Building2,
  Loader2,
  Copy,
  Check,
  Upload,
  Image,
  AlertCircle,
  DollarSign,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { BottomNav } from "@/components/bottom-nav";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { depositFormSchema, EXCHANGE_RATES } from "@shared/schema";
import type { z } from "zod";

// Dynamic payment account configuration - easily changeable
const PAYMENT_ACCOUNTS = {
  easypaisa: {
    name: "Easypaisa",
    accountNumber: "03425809569",
    accountTitle: "CloudFire Services",
    icon: Smartphone,
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/50",
  },
  jazzcash: {
    name: "JazzCash",
    accountNumber: "03098249979",
    accountTitle: "CloudFire Services",
    icon: Smartphone,
    color: "from-red-500 to-red-600",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/50",
  },
  crypto: {
    name: "Crypto",
    accountNumber: "TRX: TRwFgkkk84nCb8q26S946BDMYuDtQ2PMNU",
    accountTitle: "USDT TRC20",
    icon: Bitcoin,
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/50",
  },
  bank: {
    name: "Bank Transfer",
    accountTitle: "CloudFire Pvt Ltd - MBC",
    accountNumber: "157862073105409",
    icon: Building2,
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/50",
  },
};

// accountNumber: "1234567890123",
type PaymentMethod = keyof typeof PAYMENT_ACCOUNTS;
type DepositFormData = z.infer<typeof depositFormSchema>;

export default function Deposit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("easypaisa");
  const [copied, setCopied] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<"select" | "details">("select");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const depositForm = useForm<DepositFormData>({
    resolver: zodResolver(depositFormSchema),
    defaultValues: {
      amount: 0,
      transactionId: "",
    },
  });

  const watchedAmount = depositForm.watch("amount");
  const pkrRequired = watchedAmount * EXCHANGE_RATES.DEPOSIT_RATE;

  const depositMutation = useMutation({
    mutationFn: async (data: DepositFormData) => {
      const res = await apiRequest("POST", "/api/deposits/request", {
        userId: user?.id,
        amount: data.amount,
        transactionId: data.transactionId,
        screenshotUrl: screenshotUrl,
        method: selectedMethod,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits", user?.id] });
      depositForm.reset();
      setScreenshotUrl(null);
      setStep("select");
      toast({
        title: "Deposit submitted!",
        description: "Your deposit will be credited after verification.",
      });
      navigate("/payments");
    },
    onError: (error: any) => {
      toast({
        title: "Deposit submission failed",
        description: error.message || "Could not submit deposit",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("screenshot", file);

    try {
      const res = await fetch("/api/uploads/screenshot", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setScreenshotUrl(data.url);
        toast({ title: "Screenshot uploaded!" });
      }
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyAccountNumber = async () => {
    await navigator.clipboard.writeText(PAYMENT_ACCOUNTS[selectedMethod].accountNumber);
    setCopied(true);
    toast({ title: "Copied!", description: "Account number copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    const amount = depositForm.getValues("amount");
    if (!amount || amount <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    setStep("details");
  };

  const onSubmit = (data: DepositFormData) => {
    if (!screenshotUrl) {
      toast({ title: "Please upload payment screenshot", variant: "destructive" });
      return;
    }
    depositMutation.mutate(data);
  };

  const selectedAccount = PAYMENT_ACCOUNTS[selectedMethod];
  const IconComponent = selectedAccount.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-purple-950/80 backdrop-blur-lg border-b border-purple-800/30">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <button
            onClick={() => step === "details" ? setStep("select") : navigate("/payments")}
            className="p-2 rounded-full hover:bg-purple-800/50 transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Deposit</h1>
          <button
            className="p-2 rounded-full hover:bg-purple-800/50 transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="w-6 h-6 text-white" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {step === "select" ? (
          <>
            {/* Payment Method Grid */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Select Payment Method</h2>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(PAYMENT_ACCOUNTS) as PaymentMethod[]).map((method) => {
                  const account = PAYMENT_ACCOUNTS[method];
                  const Icon = account.icon;
                  const isSelected = selectedMethod === method;

                  return (
                    <button
                      key={method}
                      onClick={() => setSelectedMethod(method)}
                      className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? `${account.borderColor} ${account.bgColor} scale-[1.02]`
                          : "border-purple-700/50 bg-purple-900/30 hover:border-purple-600/70"
                      }`}
                      data-testid={`button-method-${method}`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-green-500" />
                      )}
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className={`text-sm font-medium ${isSelected ? "text-white" : "text-purple-200"}`}>
                        {account.name}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-white">Enter Amount</h2>
              <Form {...depositForm}>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-12 pr-4 py-6 text-xl font-semibold bg-purple-900/50 border-purple-700/50 text-white placeholder:text-purple-500 rounded-2xl focus:border-purple-500 focus:ring-purple-500"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-deposit-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </Form>
              {watchedAmount > 0 && (
                <p className="text-sm text-purple-300">
                  PKR Required: <span className="font-bold text-white">Rs. {pkrRequired.toLocaleString()}</span>
                  <span className="text-purple-400 ml-1">(Rate: 1 USD = {EXCHANGE_RATES.DEPOSIT_RATE} PKR)</span>
                </p>
              )}
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-400 shadow-lg shadow-purple-500/30"
              data-testid="button-continue-deposit"
            >
              Continue Deposit
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            {/* Deposit Instructions */}
            <Card className="bg-purple-900/30 border-purple-700/50 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  Deposit Instructions
                </h3>
                <ul className="space-y-3 text-sm text-purple-200">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                    <span>Select your preferred payment method above</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                    <span>Enter the USD amount you want to deposit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                    <span>Make payment to the account shown on next screen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                    <span>Upload screenshot & enter transaction ID</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-purple-400 shrink-0" />
                    <span>Deposits are processed within 10-30 minutes</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-amber-300">Minimum deposit: $5 USD</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Payment Details Step */}
            <Card className="bg-purple-900/30 border-purple-700/50 rounded-2xl overflow-hidden">
              <div className={`p-4 bg-gradient-to-r ${selectedAccount.color}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{selectedAccount.name}</p>
                    <p className="text-white/80 text-sm">{selectedAccount.accountTitle}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-5 space-y-4">
                <div>
                  <p className="text-sm text-purple-300 mb-2">Send payment to:</p>
                  <div className="flex items-center justify-between p-3 bg-purple-800/50 rounded-xl">
                    <span className="text-white font-mono text-lg">{selectedAccount.accountNumber}</span>
                    <button
                      onClick={copyAccountNumber}
                      className="p-2 rounded-lg bg-purple-700/50 hover:bg-purple-600/50 transition-colors"
                      data-testid="button-copy-account"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-purple-800/30 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">Deposit Amount</span>
                    <span className="text-white font-bold">${watchedAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-purple-300">PKR to Send</span>
                    <span className="text-amber-400 font-bold">Rs. {pkrRequired.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Details Form */}
            <Form {...depositForm}>
              <form onSubmit={depositForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={depositForm.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Enter Transaction ID"
                          className="py-6 bg-purple-900/50 border-purple-700/50 text-white placeholder:text-purple-500 rounded-2xl"
                          {...field}
                          data-testid="input-transaction-id"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Screenshot Upload */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    data-testid="input-screenshot"
                  />
                  {screenshotUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-green-500/50">
                      <img
                        src={screenshotUrl}
                        alt="Payment screenshot"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshotUrl(null)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-red-500/80 hover:bg-red-500"
                        data-testid="button-remove-screenshot"
                      >
                        <AlertCircle className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-purple-600/50 rounded-2xl bg-purple-900/20 hover:bg-purple-800/30 transition-colors"
                      disabled={uploading}
                      data-testid="button-upload-screenshot"
                    >
                      {uploading ? (
                        <Loader2 className="w-8 h-8 mx-auto text-purple-400 animate-spin" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                          <p className="text-purple-300 font-medium">Upload Payment Screenshot</p>
                          <p className="text-purple-500 text-sm mt-1">Tap to browse files</p>
                        </div>
                      )}
                    </button>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full py-6 text-lg font-bold rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-500 hover:from-purple-500 hover:via-purple-400 hover:to-indigo-400 shadow-lg shadow-purple-500/30"
                  disabled={depositMutation.isPending}
                  data-testid="button-submit-deposit"
                >
                  {depositMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Submit Deposit"
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
