"use client";

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getEligibleCreatorsFn, createIROFn } from "@/services/admin/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createIROSchema = z
  .object({
    tokenId: z.string().min(1, "Token selection is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    hardCap: z.coerce.number().positive("Hard cap must be positive"),
    tokensForSale: z.coerce
      .number()
      .positive("Tokens for sale must be positive"),
    vestingPeriod: z.coerce.number().min(0, "Vesting period must be 0 or more"),
    cliffPeriod: z.coerce.number().min(0, "Cliff period must be 0 or more"),
  })
  .refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

type CreateIROFormValues = z.infer<typeof createIROSchema>;

export default function CreateIROPage() {
  const { getAccessToken } = usePrivy();
  const router = useRouter();

  const {
    data: eligibleCreators,
    isLoading: isLoadingCreators,
    error: creatorsError,
  } = useQuery({
    queryKey: ["admin", "eligibleCreators"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      return await getEligibleCreatorsFn(token);
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateIROFormValues) => {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      // Convert dates to ISO strings
      const payload = {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
      };
      return await createIROFn(token, payload);
    },
    onSuccess: () => {
      toast.success("IRO Created Successfully!");
      router.push("/admin/tokens"); // Redirect to token list or IRO list
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create IRO");
    },
  });

  const form = useForm<CreateIROFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createIROSchema) as any,
    defaultValues: {
      tokenId: "",
      startTime: "",
      endTime: "",
      hardCap: 0,
      tokensForSale: 0,
      vestingPeriod: 0,
      cliffPeriod: 0,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTokenId = watch("tokenId");
  const selectedCreator = eligibleCreators?.find(
    (c) => c.createdToken?.id === selectedTokenId,
  );

  const onSubmit = (data: CreateIROFormValues) => {
    mutation.mutate(data);
  };

  if (isLoadingCreators) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Create IRO</h1>
        <p className="text-zinc-500">
          Schedule an Initial Return Offering for an approved token.
        </p>
      </div>

      {creatorsError && (
        <div className="rounded-lg bg-red-50 p-4 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h5 className="font-medium text-red-900">Error</h5>
          </div>
          <div className="mt-1 text-sm text-red-800">
            Failed to load eligible creators. Please try again.
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>IRO Details</CardTitle>
          <CardDescription>
            configure the parameters for the token offering.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="tokenId">Select Token</Label>
              <Controller
                control={control}
                name="tokenId"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a token..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleCreators?.length === 0 ? (
                        <div className="p-2 text-sm text-zinc-500 text-center">
                          No eligible tokens found
                        </div>
                      ) : (
                        eligibleCreators?.map((creator) => (
                          <SelectItem
                            key={creator.createdToken?.id}
                            value={creator.createdToken?.id || ""}
                          >
                            {creator.createdToken?.name} (
                            {creator.createdToken?.symbol}) -{" "}
                            {creator.creatorProfile?.displayName ||
                              creator.firstName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tokenId && (
                <p className="text-sm text-red-500">{errors.tokenId.message}</p>
              )}
              {selectedCreator && (
                <div className="mt-2 p-4 bg-zinc-50 rounded-lg text-sm border border-zinc-100">
                  <p>
                    <strong>Creator:</strong>{" "}
                    {selectedCreator.creatorProfile?.displayName}
                  </p>
                  <p>
                    <strong>Initial Supply:</strong>{" "}
                    {selectedCreator.tokenApplication?.initialSupply}
                  </p>
                  <p>
                    <strong>Mint Address:</strong>{" "}
                    <span className="font-mono text-xs">
                      {selectedCreator.createdToken?.mintAddress}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...register("startTime")}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">
                    {errors.startTime.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...register("endTime")}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">
                    {errors.endTime.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hardCap">Hard Cap ($)</Label>
                <Input
                  id="hardCap"
                  type="number"
                  placeholder="e.g. 500000"
                  {...register("hardCap")}
                />
                {errors.hardCap && (
                  <p className="text-sm text-red-500">
                    {errors.hardCap.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tokensForSale">Tokens For Sale</Label>
                <Input
                  id="tokensForSale"
                  type="number"
                  placeholder="e.g. 100000"
                  {...register("tokensForSale")}
                />
                {errors.tokensForSale && (
                  <p className="text-sm text-red-500">
                    {errors.tokensForSale.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="vestingPeriod">Vesting Period (Days)</Label>
                <Input
                  id="vestingPeriod"
                  type="number"
                  placeholder="e.g. 365"
                  {...register("vestingPeriod")}
                />
                {errors.vestingPeriod && (
                  <p className="text-sm text-red-500">
                    {errors.vestingPeriod.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cliffPeriod">Cliff Period (Days)</Label>
                <Input
                  id="cliffPeriod"
                  type="number"
                  placeholder="e.g. 90"
                  {...register("cliffPeriod")}
                />
                {errors.cliffPeriod && (
                  <p className="text-sm text-red-500">
                    {errors.cliffPeriod.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-[#F2723B] hover:bg-[#e06532] text-white"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating IRO...
                  </>
                ) : (
                  "Create IRO"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
