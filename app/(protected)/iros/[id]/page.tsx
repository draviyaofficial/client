"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getIROByIdFn,
  createBuyIntentFn,
  confirmBuyFn,
  IRO,
} from "@/services/iro/api";
// Separate specific Solana hooks to avoid context conflicts
import { usePrivy, ConnectedWallet } from "@privy-io/react-auth";
import {
  useWallets,
  useSignAndSendTransaction,
} from "@privy-io/react-auth/solana";
import { useUser } from "@/services/auth/model/hooks/useUser";
import { toast } from "sonner";
import bs58 from "bs58";
import {
  Clock,
  ExternalLink,
  Target,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
  Loader2,
  Wallet,
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
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { connection } from "@/services/solana/connection";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

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

  // Purchase Mutation
  const handlePurchase = async () => {
    if (!iro || !amount) return;

    if (!privyUser) {
      toast.error("Please log in to purchase");
      return;
    }

    // Identify the correct wallet (prioritize embedded Privy wallet)
    const embeddedWallet = wallets.find(
      (w: any) => w.walletClientType === "privy",
    );
    const selectedWallet = embeddedWallet || wallets[0];

    if (!selectedWallet) {
      // Trigger connection flow specific to embedded wallet or general
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

      if (dbUser && userWalletAddress !== dbUser.walletAddress) {
        console.warn(
          "Wallet mismatch",
          userWalletAddress,
          dbUser.walletAddress,
        );
      }

      // Check Balance
      const balance = await connection.getBalance(
        new PublicKey(userWalletAddress),
      );
      const requiredAmount = amountNum * LAMPORTS_PER_SOL;
      if (balance < requiredAmount + 5000) {
        // 5000 lamports for gas
        const isDevnet = process.env.NODE_ENV !== "production";
        toast.error("Insufficient Funds", {
          description: isDevnet
            ? `Please airdrop SOL to ${userWalletAddress.slice(0, 4)}...${userWalletAddress.slice(-4)}`
            : "Please top up your wallet",
        });
        console.log(
          "Req Airdrop:",
          `https://faucet.solana.com/?address=${userWalletAddress}`,
        );
        return;
      }

      // 1. Create Buy Intent (Server)
      toast.loading("Initiating purchase...");
      const intent = await createBuyIntentFn(accessToken, iro.id, amountNum);
      toast.dismiss();

      // 2. Build Transaction (Client)
      toast.loading("Preparing transaction...");
      // Get latest blockhash
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();

      // Create Transfer Instruction
      const transferInstruction = getTransferSolInstruction({
        amount: BigInt(Math.round(intent.amountSol * LAMPORTS_PER_SOL)),
        destination: address(intent.depositAddress),
        source: createNoopSigner(address(selectedWallet.address)),
      });

      // Create Transaction Message
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

      // Serialize Transaction
      const serializedTransaction = new Uint8Array(
        getTransactionEncoder().encode(transactionMessage),
      );

      // 3. Sign and Send using Privy (activates popup/embedded flow)
      toast.dismiss();
      toast.loading("Please confirm in your wallet...");

      console.log(
        "Sending transaction with wallet:",
        selectedWallet.address,
        "Chain:",
        process.env.NODE_ENV === "production"
          ? "solana:mainnet"
          : "solana:devnet",
      );

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

      // Convert Uint8Array signature to base58 string
      const signature = bs58.encode(output.signature);

      toast.dismiss();
      toast.loading("Transaction sent! Verifying...");

      // 4. Confirm Buy (Server)
      // We wait for the server/blockchain to index, or send signature immediately.
      // ConfirmBuyFn usually verifies the signature on-chain anyway.
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
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    } catch (err: any) {
      console.error("Purchase Error:", err);
      toast.dismiss();
      toast.error(err.message || "Purchase failed");
    } finally {
      setIsBuying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#F2723B]" />
      </div>
    );
  }

  if (error || !iro) {
    return (
      <div className="flex h-[80vh] items-center justify-center flex-col gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
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

  // Mock Roadmap Data
  const roadmap = [
    {
      phase: "Phase 1",
      title: "Launch & Fundraising",
      date: "Q1 2024",
      status: "completed",
    },
    {
      phase: "Phase 2",
      title: "Platform Development",
      date: "Q2 2024",
      status: "current",
    },
    {
      phase: "Phase 3",
      title: "Beta Testing",
      date: "Q3 2024",
      status: "upcoming",
    },
    {
      phase: "Phase 4",
      title: "Public Release",
      date: "Q4 2024",
      status: "upcoming",
    },
  ];

  // Mock FAQ Data
  const faqs = [
    {
      q: "What is the minimum investment?",
      a: `The minimum purchase amount is ${iro.minPurchase || 0.1} SOL.`,
    },
    {
      q: "When will I receive my tokens?",
      a: "Tokens are distributed immediately upon purchase to your connected wallet.",
    },
    {
      q: "Is there a lock-up period?",
      a: "Yes, liquidity is locked for 12 months to ensure project stability.",
    },
  ];

  return (
    <div className="space-y-8 bg-white rounded-xl p-10 min-h-[calc(100vh-2.5rem)]">
      {/* Header / Hero */}
      <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
        <div className="flex items-center gap-6">
          {iro.token.logoUrl ? (
            <img
              src={iro.token.logoUrl}
              alt={iro.token.name}
              className="w-24 h-24 rounded-full shadow-lg border-4 border-white object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400 font-bold text-xl shadow-lg border-4 border-white">
              {iro.token.symbol.slice(0, 2)}
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-zinc-900">
              {iro.token.name}
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#f9efe3] text-[#F2723B] font-medium text-sm">
                ${iro.token.symbol}
              </span>
              <span className="text-zinc-500">
                by {iro.token.user.creatorProfile?.displayName || "Creator"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {iro.token.websiteUrl && (
            <Button variant="outline" asChild>
              <a href={iro.token.websiteUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Website
              </a>
            </Button>
          )}
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium border border-green-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Card */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Fundraising Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Total Raised</span>
                  <span className="font-medium text-zinc-900">
                    {parseFloat(iro.totalRaised).toLocaleString()} /{" "}
                    {parseFloat(iro.hardCap).toLocaleString()} SOL
                  </span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-xs text-zinc-500 text-right">
                  {progress.toFixed(2)}% of Hard Cap
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-100">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Price per Token</p>
                  <p className="font-semibold text-lg">{iro.tokenPrice} SOL</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Tokens Sold</p>
                  <p className="font-semibold text-lg">
                    {parseFloat(iro.tokensSold).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Participants</p>
                  <p className="font-semibold text-lg">--</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Project */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>About Project</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">
                {iro.token.description || "No description provided."}
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Audited Contract</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-600">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>KYC Verified Creator</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roadmap */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Roadmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roadmap.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${item.status === "completed" ? "bg-green-500" : item.status === "current" ? "bg-[#F2723B]" : "bg-zinc-300"}`}
                      />
                      {index !== roadmap.length - 1 && (
                        <div className="w-0.5 flex-1 bg-zinc-100 my-1" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{item.title}</p>
                      <p className="text-sm text-zinc-500">
                        {item.phase} • {item.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* FAQ */}
          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="font-medium text-zinc-900">{faq.q}</h4>
                  <p className="text-sm text-zinc-600">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Purchase */}
        <div className="space-y-6">
          <Card className="border-[#F2723B]/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-[#F2723B] to-[#fcb65a]" />
            <CardHeader>
              <CardTitle>Participate in IRO</CardTitle>
              <CardDescription>
                Minimum purchase: {iro.minPurchase || 0.1} SOL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Amount (SOL)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-12"
                    disabled={wallets.length === 0 && !privyUser?.wallet}
                  />
                  <div className="absolute right-3 top-2.5 text-sm font-medium text-zinc-500">
                    SOL
                  </div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && (
                  <p className="text-xs text-green-600 text-right">
                    You will receive ≈{" "}
                    {(
                      parseFloat(amount) / parseFloat(iro.tokenPrice)
                    ).toLocaleString()}{" "}
                    {iro.token.symbol}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-zinc-50 p-3 text-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Your Balance</span>
                  <span className="font-medium">
                    {wallets[0] ? "-- SOL" : "No Wallet"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {privyUser ? (
                <Button
                  className="w-full bg-[#F2723B] hover:bg-[#e06532] text-white"
                  size="lg"
                  onClick={handlePurchase}
                  disabled={isBuying || !amount}
                >
                  {isBuying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Buy {iro.token.symbol}
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white"
                  size="lg"
                  onClick={connectWallet}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet to Buy
                </Button>
              )}
            </CardFooter>
          </Card>

          <Card className="border-zinc-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Tokenomics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Supply</span>
                <span className="font-medium">
                  10,000,000 {iro.token.symbol}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">IRO Allocation</span>
                <span className="font-medium">
                  {parseFloat(iro.tokensForSale).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Liquidity Lock</span>
                <span className="font-medium">12 Months</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
