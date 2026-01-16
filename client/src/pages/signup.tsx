import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flame, Loader2, Gift, Phone, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { signupSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { z } from "zod";

type SignupFormData = z.infer<typeof signupSchema>;

const MOCK_OTP = "1234";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
    }
  }, []);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      referralCode: "",
    },
  });

  useEffect(() => {
    if (referralCode) {
      form.setValue("referralCode", referralCode);
    }
  }, [referralCode, form]);

  const handleSendOtp = () => {
    const phoneNumber = form.getValues("phoneNumber");
    if (phoneNumber.length !== 11) {
      form.setError("phoneNumber", { message: "Phone number must be 11 digits" });
      return;
    }
    
    setOtpSending(true);
    setTimeout(() => {
      setOtpSending(false);
      setShowOtpInput(true);
      setOtpError("");
      setOtpValue("");
      toast({
        title: "OTP Sent!",
        description: "A verification code has been sent to your phone (use 1234 for demo)",
      });
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otpValue === MOCK_OTP) {
      setIsPhoneVerified(true);
      setOtpError("");
      toast({
        title: "Phone Verified!",
        description: "Your phone number has been verified successfully.",
      });
    } else {
      setOtpError("Invalid OTP, please try again.");
      setIsPhoneVerified(false);
    }
  };

  const onSubmit = async (data: SignupFormData) => {
    if (!isPhoneVerified) {
      toast({
        title: "Phone not verified",
        description: "Please verify your phone number before creating an account",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiRequest("POST", "/api/auth/signup", {
        username: data.username,
        password: data.password,
        phoneNumber: data.phoneNumber,
        referralCode: data.referralCode || referralCode || undefined,
      });
      const user = await res.json();
      login(user);
      toast({
        title: "Account created!",
        description: "Welcome to CloudFire mining",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const phoneNumber = form.watch("phoneNumber");

  useEffect(() => {
    if (isPhoneVerified && phoneNumber.length !== 11) {
      setIsPhoneVerified(false);
      setShowOtpInput(false);
      setOtpValue("");
    }
  }, [phoneNumber, isPhoneVerified]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-blue-950/20">
      <Card className="w-full max-w-md border-blue-500/20 bg-card/80 backdrop-blur-md">
        <CardHeader className="text-center space-y-4 pb-2">
          <div className="flex items-center justify-center gap-2">
            <Flame className="w-10 h-10 text-amber-400" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">
              CloudFire
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create your mining account
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Choose a username"
                        className="bg-background/50"
                        data-testid="input-username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-400" />
                      Phone Number
                    </FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="03XXXXXXXXX"
                          className="bg-background/50"
                          maxLength={11}
                          data-testid="input-phone"
                          disabled={isPhoneVerified}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      {!isPhoneVerified && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSendOtp}
                          disabled={otpSending || phoneNumber.length !== 11}
                          data-testid="button-send-otp"
                        >
                          {otpSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Send OTP"
                          )}
                        </Button>
                      )}
                      {isPhoneVerified && (
                        <div className="flex items-center gap-1 px-3 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showOtpInput && !isPhoneVerified && (
                <div className="space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <label className="text-sm font-medium">Enter 4-digit OTP</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter OTP"
                      maxLength={4}
                      value={otpValue}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setOtpValue(value);
                        setOtpError("");
                      }}
                      className="bg-background/50"
                      data-testid="input-otp"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={otpValue.length !== 4}
                      data-testid="button-verify-otp"
                    >
                      Verify
                    </Button>
                  </div>
                  {otpError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm" data-testid="text-otp-error">
                      <XCircle className="w-4 h-4" />
                      {otpError}
                    </div>
                  )}
                </div>
              )}

              {isPhoneVerified && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20" data-testid="text-phone-verified">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-green-400">Phone number verified</span>
                </div>
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Create a password"
                        className="bg-background/50"
                        data-testid="input-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        className="bg-background/50"
                        data-testid="input-confirm-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="referralCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-400" />
                      Referral Code (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter referral code"
                        className="bg-background/50"
                        data-testid="input-referral-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {referralCode && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-400">
                    You were referred by a friend! You'll both earn commission rewards.
                  </p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isLoading || !isPhoneVerified}
                className="w-full bg-gradient-to-r from-blue-500 to-amber-500 hover:from-blue-600 hover:to-amber-600 disabled:opacity-50"
                data-testid="button-signup"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Create Account"
                )}
              </Button>
              {!isPhoneVerified && (
                <p className="text-xs text-center text-muted-foreground">
                  Please verify your phone number to create an account
                </p>
              )}
            </form>
          </Form>
          <p className="text-center mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-blue-400 hover:underline cursor-pointer" data-testid="link-login">
                Login
              </span>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
