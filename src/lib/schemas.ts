import { z } from "zod";

export const packageSchema = z.object({
  length: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
  width: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
  height: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
  quantity: z.coerce.number({invalid_type_error: "Invalid number"}).int().positive({ message: "Must be > 0" }),
});

export const packingFormSchema = z.object({
  containerDimensions: z.object({
    length: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
    width: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
    height: z.coerce.number({invalid_type_error: "Invalid number"}).positive({ message: "Must be > 0" }),
  }),
  packages: z.array(packageSchema).min(1, "Please add at least one package type."),
  allowRotation: z.boolean(),
});

export type PackingFormValues = z.infer<typeof packingFormSchema>;
