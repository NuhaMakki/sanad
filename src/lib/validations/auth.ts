import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "الرجاء إدخال رقم الطالب أو اسم المستخدم"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export type LoginInput = z.infer<typeof loginSchema>;
