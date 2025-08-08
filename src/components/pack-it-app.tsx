"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PackagePlus, Trash2, Loader2, Cuboid, Box, Settings2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { packingFormSchema, type PackingFormValues } from "@/lib/schemas";
import { handleOptimizePacking } from "@/app/actions";
import type { OptimizePackingOutput } from "@/ai/flows/optimize-packing-configuration";
import { ResultsSummary } from "@/components/results-summary";
import { Visualization3D } from "@/components/visualization-3d";

const defaultValues: PackingFormValues = {
  containerDimensions: { length: 100, width: 100, height: 100 },
  packages: [
    { length: 30, width: 20, height: 10, quantity: 10 },
    { length: 50, width: 40, height: 30, quantity: 5 },
    { length: 10, width: 10, height: 10, quantity: 50 },
  ],
  allowRotation: true,
};

export function PackItApp() {
  const [results, setResults] = useState<OptimizePackingOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<PackingFormValues>({
    resolver: zodResolver(packingFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "packages",
  });

  const onSubmit = async (values: PackingFormValues) => {
    setIsLoading(true);
    setResults(null);
    const response = await handleOptimizePacking(values);
    setIsLoading(false);

    if (response.success) {
      setResults(response.data);
      toast({
        title: "Optimization Complete!",
        description: "The 3D model and results have been updated.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Optimization Failed",
        description: response.error,
      });
    }
  };

  const watchContainerDimensions = form.watch('containerDimensions');
  const watchPackages = form.watch('packages');

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b">
        <div className="container mx-auto flex items-center gap-2">
          <Cuboid className="w-8 h-8 text-primary"/>
          <h1 className="text-2xl font-bold tracking-tight">PackIt<span className="text-primary">3D</span></h1>
        </div>
      </header>

      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Box className="text-primary"/> Container</CardTitle>
                    <CardDescription>Enter the dimensions of your container.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="containerDimensions.length" render={({ field }) => (
                      <FormItem><FormLabel>Length</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="containerDimensions.width" render={({ field }) => (
                      <FormItem><FormLabel>Width</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="containerDimensions.height" render={({ field }) => (
                      <FormItem><FormLabel>Height</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><PackagePlus className="text-primary"/> Packages</CardTitle>
                    <CardDescription>Add the packages you want to pack.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                        <h4 className="font-medium text-sm">Package {String.fromCharCode(65 + index)}</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name={`packages.${index}.length`} render={({ field }) => (
                            <FormItem><FormLabel>Length</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`packages.${index}.width`} render={({ field }) => (
                            <FormItem><FormLabel>Width</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`packages.${index}.height`} render={({ field }) => (
                            <FormItem><FormLabel>Height</FormLabel><FormControl><Input {...field} type="number" placeholder="cm" /></FormControl><FormMessage /></FormItem>
                          )} />
                          <FormField control={form.control} name={`packages.${index}.quantity`} render={({ field }) => (
                            <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input {...field} type="number" placeholder="pcs" /></FormControl><FormMessage /></FormItem>
                          )} />
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove package</span>
                        </Button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="w-full" onClick={() => append({ length: 10, width: 10, height: 10, quantity: 1 })}>
                      <PackagePlus className="mr-2 h-4 w-4" /> Add Package Type
                    </Button>
                    <FormField control={form.control} name="packages" render={({ fieldState }) => (
                      fieldState.error ? <FormMessage>{fieldState.error.message}</FormMessage> : null
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                     <CardTitle className="flex items-center gap-2"><Settings2 className="text-primary"/> Options</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField control={form.control} name="allowRotation" render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Package Rotation</FormLabel>
                          <p className="text-[0.8rem] text-muted-foreground">Let the AI rotate packages for a better fit.</p>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-6 w-6" />
                  )}
                  {isLoading ? 'Optimizing...' : 'Optimize Packing'}
                </Button>
              </form>
            </Form>
            
            {results && <ResultsSummary results={results} packages={watchPackages} />}
          </div>

          <div className="lg:col-span-2 lg:sticky lg:top-8 self-start" style={{height: 'calc(100vh - 4rem)'}}>
            <Visualization3D results={results} containerDimensions={watchContainerDimensions} packages={watchPackages} />
          </div>
        </div>
      </div>
    </div>
  );
}
