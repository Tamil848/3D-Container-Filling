"use client";

import type { OptimizePackingOutput } from "@/ai/flows/optimize-packing-configuration";
import type { PackingFormValues } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, Package, Percent, ThumbsUp, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { cn } from "@/lib/utils";

interface ResultsSummaryProps {
  results: OptimizePackingOutput;
  packages: PackingFormValues["packages"];
}

const COLORS = [
  "bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-rose-500", 
  "bg-violet-500", "bg-stone-500", "bg-pink-500", "bg-gray-500", 
  "bg-yellow-500", "bg-teal-500"
];

export function ResultsSummary({ results, packages }: ResultsSummaryProps) {
  const { totalVolumeUsedPercentage, unpackedPackages, packingConfigurations, packingNotes } = results;

  const totalPackages = packages.reduce((sum, pkg) => sum + pkg.quantity, 0);
  const packedPackagesCount = packingConfigurations.reduce((sum, config) => sum + config.quantity, 0);

  const unpackedItems = packages.map((pkg, index) => {
    const packedCount = packingConfigurations
      .filter(p => p.packageType === index)
      .reduce((sum, p) => sum + p.quantity, 0);
    const unpackedCount = pkg.quantity - packedCount;
    return { ...pkg, unpackedCount };
  }).filter(p => p.unpackedCount > 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="text-primary" />
            Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2 text-muted-foreground"><Percent className="size-4" /> Volume Used</span>
              <span>{totalVolumeUsedPercentage.toFixed(2)}%</span>
            </div>
            <Progress value={totalVolumeUsedPercentage} aria-label={`${totalVolumeUsedPercentage.toFixed(2)}% of container volume used`} />
          </div>
          <Separator />
          <div className="space-y-2">
             <div className="flex justify-between items-center text-sm font-medium">
              <span className="flex items-center gap-2 text-muted-foreground"><Package className="size-4" /> Package Fit Rate</span>
              <span>{packedPackagesCount} / {totalPackages}</span>
            </div>
            <Progress value={(packedPackagesCount / totalPackages) * 100} aria-label={`${packedPackagesCount} out of ${totalPackages} packages fitted`} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info className="text-primary"/> AI Packing Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{packingNotes}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500"><CheckCircle /> Packed Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Dimensions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg, index) => {
                 const packedCount = packingConfigurations
                  .filter(p => p.packageType === index)
                  .reduce((sum, p) => sum + p.quantity, 0);
                if (packedCount === 0) return null;
                return (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-2">
                        <span className={cn("w-3 h-3 rounded-full", COLORS[index % COLORS.length])}></span>
                        Package {String.fromCharCode(65 + index)}
                      </Badge>
                    </TableCell>
                    <TableCell>{packedCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{pkg.length}x{pkg.width}x{pkg.height} cm</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {unpackedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive"><XCircle/> Unpacked Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Dimensions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpackedItems.map((item, index) => (
                   <TableRow key={index}>
                    <TableCell>
                      <Badge variant="secondary">Package {String.fromCharCode(65 + packages.findIndex(p => p === item))}</Badge>
                    </TableCell>
                    <TableCell>{item.unpackedCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.length}x{item.width}x{item.height} cm</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
