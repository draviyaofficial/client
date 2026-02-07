"use client";

import React, { useState, useEffect } from "react";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  checkTickerAvailabilityFn,
  applyTokenFn,
  fetchTokenApplicationsFn,
  TokenApplication,
} from "@/services/token/api";
import { getTokenAnalytics } from "@/services/solana/token";
import { useUser } from "@/services/auth/model/hooks/useUser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Coins,
  Calendar,
  Target,
  Clock,
  DollarSign,
  Rocket,
} from "lucide-react";
import NextImage from "next/image";
import ImageUpload from "@/components/ui/image-upload";
import { StatCard } from "@/components/dashboard/StatCard";

// Schema Validation
const tokenSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  symbol: z
    .string()
    .min(2, "Symbol must be at least 2 characters")
    .max(10, "Symbol cannot exceed 10 characters")
    .regex(/^[A-Za-z0-9]+$/, "Symbol must be alphanumeric"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  logoUrl: z.string().url("Invalid URL"),
  initialSupply: z.coerce
    .number()
    .min(1000, "Initial supply must be at least 1000"),
  websiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  twitterUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  telegramUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  discordUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type TokenFormValues = z.infer<typeof tokenSchema>;

export default function TokenLaunchPage() {
  const { getAccessToken } = usePrivy();
  const { data: user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tickerAvailable, setTickerAvailable] = useState<boolean | null>(null);
  const [checkingTicker, setCheckingTicker] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Check for existing application
  const { data: existingToken, isLoading: isLoadingToken } = useQuery({
    queryKey: ["my-token-application", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const token = await getAccessToken();
      if (!token) return null;
      try {
        const res = await fetchTokenApplicationsFn(token, { limit: 100 });
        return (
          res.data.find((app: TokenApplication) => app.userId === user.id) ||
          null
        );
      } catch (e) {
        console.error("Failed to fetch existing token:", e);
        return null;
      }
    },
    enabled: !!user?.id && user.role === "CREATOR",
  });

  // Fetch On-Chain Analytics if Token is Minted (Approved)
  // Casting to any because TokenApplication interface might not have mintAddress explicitly defined yet on client side, though server sends it.
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["token-analytics", existingToken?.id],
    queryFn: async () => {
      if (!existingToken?.mintAddress) return null;
      return await getTokenAnalytics(existingToken.mintAddress);
    },
    enabled: !!existingToken && existingToken.status === "APPROVED", // Only fetch if approved/minted
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on 429s immediately or too many times
      if (error?.message?.includes("429")) return false;
      return failureCount < 3;
    },
  });

  const form = useForm<TokenFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tokenSchema) as any,
    defaultValues: {
      name: "",
      symbol: "",
      description: "",
      logoUrl: "",
      initialSupply: 1000000,
      websiteUrl: "",
      twitterUrl: "",
      telegramUrl: "",
      discordUrl: "",
    },
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
    trigger,
  } = form;

  const symbol = watch("symbol");

  // Check Ticker Availability
  const checkTicker = async () => {
    if (!symbol || symbol.length < 2) return;
    setCheckingTicker(true);
    try {
      const data = await checkTickerAvailabilityFn(symbol);

      if (form.getValues("symbol") !== symbol) return;

      setTickerAvailable(data.available);
      if (!data.available) {
        form.setError("symbol", {
          type: "manual",
          message: "Ticker is already taken",
        });
      } else {
        form.clearErrors("symbol");
      }
    } catch (error) {
      console.error(error);
      setTickerAvailable(false);
    } finally {
      if (form.getValues("symbol") === symbol) {
        setCheckingTicker(false);
      }
    }
  };

  // Debounce check ticker
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (symbol && symbol.length >= 2) {
        checkTicker();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol]);

  const mutation = useMutation({
    mutationFn: async (data: TokenFormValues) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await applyTokenFn(token, data);
    },
    onSuccess: () => {
      toast.success("Application Submitted!", {
        description: "Your token application is under review.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-token-application"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });

  const onSubmit = (data: TokenFormValues) => {
    if (tickerAvailable === false) {
      form.setError("symbol", {
        type: "manual",
        message: "Ticker is already taken",
      });
      return;
    }
    mutation.mutate(data);
  };

  if (!user || user.role !== "CREATOR") {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-zinc-800">Access Denied</h1>
          <p className="text-zinc-600">
            You must be an approved Creator to launch a token.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoadingToken) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (existingToken) {
    const iro = existingToken.user?.createdToken?.iro;
    const createdToken = existingToken.user?.createdToken;

    const stats = [
      {
        title: "Total Supply",
        value: createdToken?.totalSupply
          ? parseInt(createdToken.totalSupply).toLocaleString()
          : parseInt(existingToken.initialSupply).toLocaleString(),
        change: "Fixed Supply",
        icon: Coins,
      },
      {
        title: "IRO Status",
        value: iro?.status || "Not Scheduled",
        change: iro ? "Active Phase" : "Pending Admin",
        icon: Rocket,
      },
      {
        title: "Funds Raised",
        value: iro
          ? `$${parseFloat(iro.totalRaised).toLocaleString()}`
          : "$0.00",
        change:
          iro && parseFloat(iro.hardCap) > 0
            ? `${(
                (parseFloat(iro.totalRaised) / parseFloat(iro.hardCap)) *
                100
              ).toFixed(1)}% of Hard Cap`
            : "N/A",
        icon: DollarSign,
        variant: "gradient" as const,
      },
      {
        title: "Token Price",
        value: iro ? `$${iro.tokenPrice}` : "TBD",
        change: "Initial Offering",
        icon: Target,
        variant: "gradient" as const,
      },
    ];

    return (
      <div className="space-y-8 bg-white rounded-xl p-10">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
              Token Dashboard
            </h1>
            <p className="text-zinc-400 mt-1 text-lg">
              Manage your asset and monitor IRO performance.
            </p>
          </div>
          <div
            className={`px-4 py-2 rounded-full text-sm font-bold border ${
              existingToken.status === "APPROVED"
                ? "bg-green-100 text-green-700 border-green-200"
                : existingToken.status === "REJECTED"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-blue-100 text-blue-700 border-blue-200"
            }`}
          >
            Application: {existingToken.status}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Token Identity & IRO Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Token Identity Card */}
            <Card className="border-zinc-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-6">
                    {existingToken.logoUrl ? (
                      <NextImage
                        src={existingToken.logoUrl}
                        alt={existingToken.symbol}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full shadow-lg border-4 border-white"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-xl shadow-lg border-4 border-white">
                        {existingToken.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div className="space-y-1">
                      <CardTitle className="text-3xl font-bold text-zinc-900">
                        {existingToken.name}
                      </CardTitle>
                      <CardDescription className="text-xl font-medium text-[#F2723B]">
                        ${existingToken.symbol}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-zinc max-w-none">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                    About Project
                  </h3>
                  <p className="text-zinc-600 leading-relaxed">
                    {existingToken.description}
                  </p>
                </div>

                {existingToken.status === "REJECTED" &&
                  existingToken.rejectionReason && (
                    <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-semibold text-red-900 mb-1 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Rejection Reason
                      </h4>
                      <p className="text-red-800 text-sm">
                        {existingToken.rejectionReason}
                      </p>
                    </div>
                  )}

                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-100">
                  {existingToken.websiteUrl && (
                    <a
                      href={existingToken.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                      Website ↗
                    </a>
                  )}
                  {existingToken.twitterUrl && (
                    <a
                      href={existingToken.twitterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                      Twitter ↗
                    </a>
                  )}
                  {existingToken.telegramUrl && (
                    <a
                      href={existingToken.telegramUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                      Telegram ↗
                    </a>
                  )}
                  {existingToken.discordUrl && (
                    <a
                      href={existingToken.discordUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-zinc-500 hover:text-indigo-600 transition-colors"
                    >
                      Discord ↗
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* IRO Detailed Stats (If exists) */}
            {iro && (
              <Card className="border-l-4 border-l-[#F2723B] shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-[#F2723B]" />
                    IRO Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-zinc-600">Progress</span>
                      <span className="text-zinc-900">
                        {parseFloat(iro.hardCap) > 0
                          ? (
                              (parseFloat(iro.totalRaised) /
                                parseFloat(iro.hardCap)) *
                              100
                            ).toFixed(1)
                          : "0.0"}
                        %
                      </span>
                    </div>
                    <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-[#F2723B] to-[#fcb65a] transition-all duration-500"
                        style={{
                          width: `${
                            parseFloat(iro.hardCap) > 0
                              ? (parseFloat(iro.totalRaised) /
                                  parseFloat(iro.hardCap)) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>{iro.totalRaised} SOL Raised</span>
                      <span>Target: {iro.hardCap} SOL</span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          Start Date
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-900">
                        {new Date(iro.startTime).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(iro.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                      <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">
                          End Date
                        </span>
                      </div>
                      <p className="font-semibold text-zinc-900">
                        {new Date(iro.endTime).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(iro.endTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Holders & Analytics */}
          <div className="space-y-8">
            {/* Top Holders */}
            {existingToken.status === "APPROVED" && (
              <Card className="h-full shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5 text-zinc-500" />
                    Top Holders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAnalytics ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-300" />
                    </div>
                  ) : analytics?.topHolders?.length ? (
                    <div className="space-y-4">
                      {analytics.topHolders.slice(0, 5).map((holder, i) => (
                        <div
                          key={holder.address}
                          className="flex items-center justify-between text-sm group hover:bg-zinc-50 p-2 rounded-lg transition-colors cursor-default"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold ring-2 ring-white shadow-sm">
                              {i + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-mono text-zinc-900 font-medium text-xs">
                                {holder.address.slice(0, 4)}...
                                {holder.address.slice(-4)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-zinc-900 font-semibold">
                              {holder.percentage.toFixed(2)}%
                            </div>
                            <div className="text-xs text-zinc-400">
                              {parseInt(
                                holder.amount.toString(),
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      {existingToken.mintAddress
                        ? "No holder data available yet."
                        : "Token not yet minted."}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)] space-y-8">
      <div>
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900">
          Launch Your Token
        </h1>
        <p className="text-zinc-400 mt-1 text-lg">
          Submit your token details for approval. Once approved, you can mint
          and launch your IRO.
        </p>
      </div>

      <Card className="border-0 shadow-none p-0">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-2xl">Token Details</CardTitle>
          <CardDescription className="text-base">
            Provide the core information about your asset.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 max-w-4xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-base">
                  Token Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. Draviya DAO"
                  className="h-12 text-lg"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="symbol" className="text-base">
                  Ticker Symbol
                </Label>
                <div className="relative">
                  <Input
                    id="symbol"
                    placeholder="e.g. DRV"
                    {...register("symbol")}
                    onBlur={() => {
                      trigger("symbol");
                    }}
                    onChange={(e) => {
                      form.setValue("symbol", e.target.value.toUpperCase());
                      setTickerAvailable(null); // Reset availability status on change
                    }}
                    className="uppercase h-12 text-lg"
                  />
                  <div className="absolute right-3 top-4">
                    {checkingTicker ? (
                      <Loader2 className="animate-spin h-5 w-5 text-zinc-400" />
                    ) : tickerAvailable === true ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : tickerAvailable === false ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {errors.symbol && (
                  <p className="text-sm text-red-500">
                    {errors.symbol.message}
                  </p>
                )}
                {tickerAvailable === true && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    Ticker is available
                  </p>
                )}
                {tickerAvailable === false && (
                  <p className="text-xs text-red-600 font-medium mt-1">
                    Ticker is already taken
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-base">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your project, utility, and vision..."
                className="resize-none min-h-[120px] text-base p-4"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label htmlFor="initialSupply" className="text-base">
                  Initial Supply
                </Label>
                <Input
                  id="initialSupply"
                  type="number"
                  placeholder="1000000"
                  className="h-12 text-lg"
                  {...register("initialSupply")}
                />
                {errors.initialSupply && (
                  <p className="text-sm text-red-500">
                    {errors.initialSupply.message}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-base">Token Logo</Label>
                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="logoUrl"
                    render={({ field }) => (
                      <ImageUpload
                        value={field.value || ""}
                        onChange={field.onChange}
                        disabled={mutation.isPending}
                      />
                    )}
                  />
                  {errors.logoUrl && (
                    <p className="text-sm text-red-500">
                      {errors.logoUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-4">
              <h3 className="text-xl font-medium text-zinc-900 border-b border-zinc-100 pb-4">
                Social Links (Optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="websiteUrl" className="text-base">
                    Website
                  </Label>
                  <Input
                    id="websiteUrl"
                    placeholder="https://yourproject.com"
                    className="h-11"
                    {...register("websiteUrl")}
                  />
                  {errors.websiteUrl && (
                    <p className="text-sm text-red-500">
                      {errors.websiteUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="twitterUrl" className="text-base">
                    Twitter / X
                  </Label>
                  <Input
                    id="twitterUrl"
                    placeholder="https://x.com/..."
                    className="h-11"
                    {...register("twitterUrl")}
                  />
                  {errors.twitterUrl && (
                    <p className="text-sm text-red-500">
                      {errors.twitterUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="telegramUrl" className="text-base">
                    Telegram
                  </Label>
                  <Input
                    id="telegramUrl"
                    placeholder="https://t.me/..."
                    className="h-11"
                    {...register("telegramUrl")}
                  />
                  {errors.telegramUrl && (
                    <p className="text-sm text-red-500">
                      {errors.telegramUrl.message}
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="discordUrl" className="text-base">
                    Discord
                  </Label>
                  <Input
                    id="discordUrl"
                    placeholder="https://discord.gg/..."
                    className="h-11"
                    {...register("discordUrl")}
                  />
                  {errors.discordUrl && (
                    <p className="text-sm text-red-500">
                      {errors.discordUrl.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Button
                type="submit"
                className="w-full md:w-auto md:min-w-[200px] h-12 text-lg bg-[#F2723B] hover:bg-[#e06532] text-white shadow-lg shadow-orange-500/20"
                disabled={mutation.isPending || checkingTicker}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
