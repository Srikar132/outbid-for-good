import { z } from "zod";
import { parseIdentity } from "@/lib/identity";

export const MAX_NAME_LENGTH = 60;
export const MAX_TAGLINE_LENGTH = 140;
export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// FormData/inputs send "" for an untouched optional field — treat that as
// absent instead of failing max-length/shape checks on an empty string.
function optionalTrimmedString(max: number, tooLongMessage: string) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
    z.string().trim().max(max, tooLongMessage).optional()
  );
}

const identitySchema = z
  .string()
  .trim()
  .min(1, "Enter a URL or @handle.")
  .transform((value, ctx) => {
    const identity = parseIdentity(value);
    if (!identity) {
      ctx.addIssue({ code: "custom", message: "Enter a valid URL or @handle." });
      return z.NEVER;
    }
    return identity.url;
  });

export const claimFieldsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a display name.")
    .max(MAX_NAME_LENGTH, `Keep it under ${MAX_NAME_LENGTH} characters.`),
  companyName: optionalTrimmedString(
    MAX_NAME_LENGTH,
    `Keep it under ${MAX_NAME_LENGTH} characters.`
  ),
  url: identitySchema,
  tagline: optionalTrimmedString(
    MAX_TAGLINE_LENGTH,
    `Keep it under ${MAX_TAGLINE_LENGTH} characters.`
  ),
});

export type ClaimFields = z.infer<typeof claimFieldsSchema>;

export const logoFileSchema = z
  .instanceof(File)
  .refine((file) => file.type.startsWith("image/"), "File must be an image.")
  .refine((file) => file.size <= MAX_LOGO_BYTES, "Image must be under 2MB.");
