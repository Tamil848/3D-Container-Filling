"use server";

import { optimizePacking, type OptimizePackingInput, type OptimizePackingOutput } from "@/ai/flows/optimize-packing-configuration";

export async function handleOptimizePacking(input: OptimizePackingInput): Promise<{ success: true; data: OptimizePackingOutput } | { success: false; error: string }> {
  try {
    const result = await optimizePacking(input);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error optimizing packing:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during optimization.";
    return { success: false, error: errorMessage };
  }
}
