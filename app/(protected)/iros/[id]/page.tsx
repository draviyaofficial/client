"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getIROByIdFn,
  createBuyIntentFn,
  confirmBuyFn,
  getIROParticipantsFn,
} from "@/services/iro/api";
import { usePrivy } from "@privy-io/react-auth";
import {
  useWallets,
  useSignAndSendTransaction,
} from "@privy-io/react-auth/solana";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { toast } from "sonner";
import bs58 from "bs58";
import {
  ExternalLink,
  Loader2,
  Wallet,
  Globe,
  Twitter,
  Send as Telegram,
  MessageCircle,
  Clock,
  Users,
  Trophy,
  Copy,
  Check,
  User as UserIcon,
  ArrowLeft,
} from "lucide-react";
import {
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstructions,
  compileTransaction,
  getTransactionEncoder,
  address,
  createNoopSigner,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { connection } from "@/services/solana/connection";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IROPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: privyUser, getAccessToken, connectWallet } = usePrivy();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { wallets } = useWallets();
  const { data: dbUser } = useUser();
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState<string>("");
  const [isBuying, setIsBuying] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);

  // Fetch IRO Details
  const {
    data: iro,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["iro", id],
    queryFn: () => getIROByIdFn(id),
    enabled: !!id,
    staleTime: 1000 * 30, // 30 seconds
  });

  // Fetch Top Buyers
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ["iro-participants", id],
    queryFn: () => getIROParticipantsFn(id),
    enabled: !!id,
    staleTime: 1000 * 60, // 1 minute
  });

  const handlePurchase = async () => {
    if (!iro || !amount) return;

    if (!privyUser) {
      toast.error("Please log in to purchase");
      return;
    }

    const embeddedWallet = wallets.find(
      (w: any) => w.walletClientType === "privy",
    );
    const selectedWallet = embeddedWallet || wallets[0];

    if (!selectedWallet) {
      connectWallet();
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amountNum < parseFloat(iro.minPurchase || "0.1")) {
      toast.error(`Minimum purchase is ${iro.minPurchase || 0.1} SOL`);
      return;
    }

    setIsBuying(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Please log in again");

      const userWalletAddress = selectedWallet.address;

      // Check Balance
      const balance = await connection.getBalance(
        new PublicKey(userWalletAddress),
      );
      const requiredAmount = amountNum * LAMPORTS_PER_SOL;
      if (balance < requiredAmount + 5000) {
        const isDevnet = process.env.NODE_ENV !== "production";
        toast.error("Insufficient Funds", {
          description: isDevnet
            ? `Please airdrop SOL to ${userWalletAddress.slice(0, 4)}...${userWalletAddress.slice(-4)}`
            : "Please top up your wallet",
        });
        return;
      }

      // 1. Create Buy Intent (Server)
      toast.loading("Initiating purchase...");
      const intent = await createBuyIntentFn(accessToken, iro.id, amountNum);
      toast.dismiss();

      // 2. Build Transaction (Client)
      toast.loading("Preparing transaction...");
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      const transferInstruction = getTransferSolInstruction({
        amount: BigInt(Math.round(intent.amountSol * LAMPORTS_PER_SOL)),
        destination: address(intent.depositAddress),
        source: createNoopSigner(address(selectedWallet.address)),
      });

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) =>
          setTransactionMessageFeePayer(address(selectedWallet.address), tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            {
              blockhash: blockhash as any,
              lastValidBlockHeight: BigInt(lastValidBlockHeight),
            },
            tx,
          ),
        (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
        (tx) => compileTransaction(tx),
      );

      const serializedTransaction = new Uint8Array(
        getTransactionEncoder().encode(transactionMessage),
      );

      toast.dismiss();
      toast.loading("Please confirm in your wallet...");

      const output = await signAndSendTransaction({
        transaction: serializedTransaction,
        wallet: selectedWallet,
        chain:
          process.env.NODE_ENV === "production"
            ? "solana:mainnet"
            : "solana:devnet",
        options: {
          sponsor: false,
        },
      });

      const signature = bs58.encode(output.signature);

      toast.dismiss();
      toast.loading("Transaction sent! Verifying...");

      await confirmBuyFn(
        accessToken,
        iro.id,
        signature,
        amountNum,
        userWalletAddress,
      );

      toast.dismiss();
      toast.success("Purchase Successful!", {
        description: `You bought ${parseFloat(intent.estimatedTokens).toLocaleString()} ${iro.token.symbol}`,
      });

      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["iro", id] });
      queryClient.invalidateQueries({ queryKey: ["iro-participants", id] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    } catch (err: any) {
      console.error("Purchase Error:", err);
      toast.dismiss();
      toast.error(err.message || "Purchase failed");
    } finally {
      setIsBuying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setAddressCopied(true);
    toast.success("Address copied to clipboard");
    setTimeout(() => setAddressCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex bg-zinc-50 h-[calc(100vh-2.5rem)] items-center justify-center rounded-xl">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2723B]" />
      </div>
    );
  }

  if (error || !iro) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <p className="text-zinc-600">Failed to load IRO details</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const progress =
    parseFloat(iro.hardCap) > 0
      ? (parseFloat(iro.totalRaised) / parseFloat(iro.hardCap)) * 100
      : 0;

  const timeLeft = Math.max(
    0,
    Math.ceil(
      (new Date(iro.endTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div className="space-y-8 bg-white rounded-xl min-h-[calc(100vh-2.5rem)] p-10">
      {/* Header with Back Button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          className="gap-2 text-zinc-600 hover:text-zinc-900 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="rounded-2xl bg-linear-to-br from-[#1a1c2e] to-[#2d3250] text-white overflow-hidden shadow-xl relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F2723B]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Logo */}
            <div className="shrink-0">
              {iro.token.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iro.token.logoUrl}
                  alt={iro.token.name}
                  className="w-32 h-32 rounded-2xl shadow-2xl border-4 border-white/10 object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl bg-white/10 flex items-center justify-center text-white/40 font-bold text-3xl border-4 border-white/10 backdrop-blur-md">
                  {iro.token.symbol.slice(0, 2)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    {iro.token.name}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-[#F2723B] text-white font-semibold text-sm shadow-lg shadow-[#F2723B]/20">
                    ${iro.token.symbol}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-indigo-200">
                  <span>
                    by {iro.token.user.creatorProfile?.displayName || "Creator"}
                  </span>
                  {iro.token.user.creatorProfile?.sector && (
                    <>
                      <span>•</span>
                      <span className="capitalize">
                        {iro.token.user.creatorProfile.sector.toLowerCase()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                {iro.token.websiteUrl && (
                  <a
                    href={iro.token.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm text-white/80 hover:text-white"
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                )}
                {iro.token.twitterUrl && (
                  <a
                    href={iro.token.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm text-white/80 hover:text-white"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {iro.token.telegramUrl && (
                  <a
                    href={iro.token.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm text-white/80 hover:text-white"
                  >
                    <Telegram className="w-5 h-5" />
                  </a>
                )}
                {iro.token.discordUrl && (
                  <a
                    href={iro.token.discordUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm text-white/80 hover:text-white"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex flex-col items-end gap-2">
              {iro.status === "LIVE" && (
                <div className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg font-medium border border-green-500/30 flex items-center gap-2 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  LIVE SALE
                </div>
              )}
              {iro.status === "SCHEDULED" && (
                <div className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg font-medium border border-blue-500/30 flex items-center gap-2 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  UPCOMING
                </div>
              )}
              {iro.status === "COMPLETED" && (
                <div className="px-4 py-2 bg-zinc-500/20 text-zinc-300 rounded-lg font-medium border border-zinc-500/30 flex items-center gap-2 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  ENDED
                </div>
              )}
              {iro.status === "FAILED" && (
                <div className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg font-medium border border-red-500/30 flex items-center gap-2 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-red-400" />
                  FAILED
                </div>
              )}
              <div className="text-sm text-indigo-200 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Ends in {timeLeft} days
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-indigo-300 text-sm mb-1">Total Raised</p>
              <p className="text-2xl font-bold">
                {parseFloat(iro.totalRaised).toLocaleString()} SOL
              </p>
            </div>
            <div>
              <p className="text-indigo-300 text-sm mb-1">Hard Cap</p>
              <p className="text-2xl font-bold">
                {parseFloat(iro.hardCap).toLocaleString()} SOL
              </p>
            </div>
            <div>
              <p className="text-indigo-300 text-sm mb-1">Price</p>
              <p className="text-2xl font-bold">{iro.tokenPrice} SOL</p>
            </div>
            <div>
              <p className="text-indigo-300 text-sm mb-1">Participants</p>
              <p className="text-2xl font-bold">
                {participants?.length || "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Section */}
          <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
            <div className="flex justify-between items-end mb-4">
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">
                  Fundraising Goal
                </h3>
                <p className="text-zinc-500 text-sm">
                  {progress.toFixed(2)}% of {parseFloat(iro.hardCap)} SOL Goal
                  Reached
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#F2723B]">
                  {progress.toFixed(1)}%
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-4 bg-zinc-100" />
            <div className="mt-4 flex justify-between text-sm text-zinc-500">
              <span>0 SOL</span>
              <span>
                {parseFloat(iro.softCap).toLocaleString()} SOL (Soft Cap)
              </span>
              <span>{parseFloat(iro.hardCap).toLocaleString()} SOL</span>
            </div>
          </div>

          {/* About Project */}
          <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
            <h3 className="text-xl font-semibold text-zinc-900 mb-4">
              About Project
            </h3>
            <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
              {iro.token.description || "No description provided."}
            </p>
          </div>

          {/* Token Details */}
          <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
            <h3 className="text-xl font-semibold text-zinc-900 mb-6">
              Token Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-zinc-500">Token Name</p>
                <p className="font-medium text-zinc-900">{iro.token.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-500">Token Symbol</p>
                <p className="font-medium text-zinc-900">{iro.token.symbol}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-sm text-zinc-500">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="bg-zinc-100 px-2 py-1 rounded text-sm text-zinc-600 font-mono break-all">
                    {iro.token.mintAddress || "Minting in progress..."}
                  </code>
                  {iro.token.mintAddress && (
                    <button
                      onClick={() =>
                        copyToClipboard(iro.token.mintAddress || "")
                      }
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      {addressCopied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-500">Total Supply</p>
                <p className="font-medium text-zinc-900">
                  10,000,000 {iro.token.symbol}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-zinc-500">Tokens for Sale</p>
                <p className="font-medium text-zinc-900">
                  {parseFloat(iro.tokensForSale).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Purchase Card */}
          <Card className="border-0 shadow-lg relative overflow-hidden bg-[#1a1c2e] text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F2723B]/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#F2723B]" />
                Participate
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Join the IRO by purchasing tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label className="text-zinc-300">Amount (SOL)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-[#F2723B]"
                    disabled={wallets.length === 0 && !privyUser?.wallet}
                  />
                  <div className="absolute right-3 top-2.5 text-sm font-medium text-zinc-500">
                    SOL
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">
                    Min: {iro.minPurchase || 0.1} SOL
                  </span>
                  {amount && !isNaN(parseFloat(amount)) && (
                    <span className="text-[#F2723B]">
                      ≈{" "}
                      {(
                        parseFloat(amount) / parseFloat(iro.tokenPrice)
                      ).toLocaleString()}{" "}
                      TOKENS
                    </span>
                  )}
                </div>
              </div>

              {privyUser ? (
                <Button
                  className={`w-full font-bold py-6 text-lg shadow-lg ${
                    iro.status === "LIVE"
                      ? "bg-[#F2723B] hover:bg-[#e06532] text-white shadow-[#F2723B]/25"
                      : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                  }`}
                  onClick={handlePurchase}
                  disabled={isBuying || !amount || iro.status !== "LIVE"}
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : iro.status === "LIVE" ? (
                    "Buy Tokens"
                  ) : iro.status === "SCHEDULED" ? (
                    "Sale Starts Soon"
                  ) : (
                    "Sale Ended"
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full bg-white text-[#1a1c2e] hover:bg-zinc-200 font-bold py-6"
                  onClick={connectWallet}
                >
                  Connect Wallet
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Top Buyers */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Top Buyers
              </h3>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="divide-y divide-zinc-50">
              {isLoadingParticipants ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : participants && participants.length > 0 ? (
                participants.map((p, i) => (
                  <div
                    key={p.userId}
                    className="p-4 flex items-center gap-3 hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
                      #{i + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200">
                      {p.user?.profilePicUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.user.profilePicUrl}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-300 text-zinc-500">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 truncate">
                        {p.user?.displayName ||
                          p.user?.firstName ||
                          (p.user?.walletAddress
                            ? `${p.user.walletAddress.slice(0, 4)}...${p.user.walletAddress.slice(-4)}`
                            : "Anonymous")}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {p.totalTokenQuantity.toLocaleString()} Tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-zinc-900">
                        {Number(p.totalAmountSOL).toFixed(2)} SOL
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-zinc-500 text-sm">
                  No buyers yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
