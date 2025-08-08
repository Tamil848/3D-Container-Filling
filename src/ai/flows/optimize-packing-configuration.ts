'use server';

/**
 * @fileOverview AI-powered tool to optimize packing configurations for maximal space efficiency.
 *
 * - optimizePacking - A function to optimize packing configurations using AI.
 * - OptimizePackingInput - The input type for the optimizePacking function.
 * - OptimizePackingOutput - The return type for the optimizePacking function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ContainerDimensionsSchema = z.object({
  length: z.number().describe('The length of the container in cm.'),
  width: z.number().describe('The width of the container in cm.'),
  height: z.number().describe('The height of the container in cm.'),
});

const PackageSchema = z.object({
  length: z.number().describe('The length of the package in cm.'),
  width: z.number().describe('The width of the package in cm.'),
  height: z.number().describe('The height of the package in cm.'),
  quantity: z.number().describe('The quantity of packages of this type.'),
});

const OptimizePackingInputSchema = z.object({
  containerDimensions: ContainerDimensionsSchema.describe('The dimensions of the container.'),
  packages: z.array(PackageSchema).describe('A list of packages to be packed.'),
  allowRotation: z.boolean().describe('Whether package rotation is allowed during packing.'),
});
export type OptimizePackingInput = z.infer<typeof OptimizePackingInputSchema>;

const PackingConfigurationSchema = z.object({
  packageType: z.number().describe('The index of the package type in the input array.'),
  quantity: z.number().describe('The quantity of this package type to use.'),
  orientation: z
    .array(z.number())
    .length(3)
    .describe(
      'The orientation of the package (0=length, 1=width, 2=height), representing the axes along container length, width and height respectively.  Values must be permutations of [0, 1, 2].'
    ),
  position: z
    .array(z.number())
    .length(3)
    .describe('The starting position of the package within the container (x, y, z in cm).'),
});

const OptimizePackingOutputSchema = z.object({
  packingConfigurations: z
    .array(PackingConfigurationSchema)
    .describe('A list of packing configurations, each specifying the package type, quantity, orientation, and position.'),
  totalVolumeUsedPercentage: z
    .number()
    .describe('The percentage of the container volume that is used by the packed items.'),
  unpackedPackages: z
    .array(z.number())
    .describe(
      'A list of indices of packages from the input array that could not be packed using this configuration.'
    ),
  packingNotes: z
    .string()
    .describe(
      'Any notes or observations about the packing configuration, including suggestions for improvement or reasons for inefficiency.'
    ),
});
export type OptimizePackingOutput = z.infer<typeof OptimizePackingOutputSchema>;

export async function optimizePacking(input: OptimizePackingInput): Promise<OptimizePackingOutput> {
  return optimizePackingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizePackingPrompt',
  input: {schema: OptimizePackingInputSchema},
  output: {schema: OptimizePackingOutputSchema},
  prompt: `You are an AI-powered packing optimization expert. Given the dimensions of a container and a list of packages with their quantities, your goal is to find the most space-efficient packing configuration.

Container Dimensions:
Length: {{{containerDimensions.length}}} cm
Width: {{{containerDimensions.width}}} cm
Height: {{{containerDimensions.height}}} cm

Packages:
{{#each packages}}
  Package Type {{@index}}:
    Length: {{{this.length}}} cm
    Width: {{{this.width}}} cm
    Height: {{{this.height}}} cm
    Quantity: {{{this.quantity}}}
{{/each}}

Packing Constraints:
Allow Rotation: {{allowRotation}}

Provide a packing configuration that maximizes the space utilization within the container. The configuration should include the package type, quantity, orientation, and position for each package.  Also, identify any packages that could not be packed.

Output the packing configurations, the total volume used percentage, the list of unpacked packages, and any notes about the configuration.

Ensure that:
- The packing configurations are feasible within the container dimensions.
- The total volume used percentage is calculated accurately.
- The unpacked packages list accurately reflects any packages that could not be accommodated.
- The packingNotes include justification for why the packing solution is efficient, or any shortcomings if it is not, along with possible reasons why some packages could not be fit.
- All dimensions and positions are given in centimeters.
- All orientations are described by permutations of [0, 1, 2], indicating how the package axes are aligned with the container axes.
`,
});

const optimizePackingFlow = ai.defineFlow(
  {
    name: 'optimizePackingFlow',
    inputSchema: OptimizePackingInputSchema,
    outputSchema: OptimizePackingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
