import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresá un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre es obligatorio"),
    email: z.string().email("Ingresá un correo válido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresá un correo válido"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmá la contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const adminSetPasswordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmá la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type AdminSetPasswordFormData = z.infer<typeof adminSetPasswordSchema>;
