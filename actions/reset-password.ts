"use server";

import * as zod from "zod";

import { getPasswordResetTokenByEmail } from "@/data/password-reset-token";
import { sendPasswordResetEmail } from "@/lib/mail";
import { generatePasswordResetToken } from "@/lib/tokens";
import { getUserByEmail } from "@/data/user";
import { ResetSchema } from "@/schemas";

export const resetPassword = async (values: zod.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid email!",
    };
  }

  const { email } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return {
      error: "Email not found!",
    };
  }

  const existingPasswordResetToken = await getPasswordResetTokenByEmail(email);
  if (existingPasswordResetToken) {
    const hasExpired =
      new Date(existingPasswordResetToken.expires) < new Date();
    if (!hasExpired) {
      return {
        error: "Reset password email already sent! Please check your inbox!",
      };
    }
  }

  const passwordResetToken = await generatePasswordResetToken(email);

  await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token
  );

  return {
    success: "Reset email sent!",
  };
};
