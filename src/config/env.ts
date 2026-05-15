// import { z } from "zod";

// const envSchema = z.object({
//   EXPO_PUBLIC_API_BASE_URL: z.string().url(),
//   EXPO_PUBLIC_ENV: z.enum(["development", "staging", "production"]),
// });

// const parsed = envSchema.safeParse(process.env);

// if (!parsed.success) {
//   console.error("Invalid environment variables:", parsed.error.format());
//   throw new Error(
//     "App cannot start: missing or invalid environment variables.",
//   );
// }

// export const env = parsed.data;

import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url(),
  EXPO_PUBLIC_ENV: z.enum(["development", "staging", "production"]),
});

const parsed = envSchema.safeParse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_ENV: process.env.EXPO_PUBLIC_ENV,
});

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  throw new Error(
    "App cannot start: missing or invalid environment variables.",
  );
}

export const env = parsed.data;