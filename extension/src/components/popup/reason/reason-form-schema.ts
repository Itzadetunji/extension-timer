import { z } from "zod";

export const reasonFormSchema = z.object({
	reason: z.string().trim().min(1, "Tell us why you're updating your limits."),
});

export type ReasonFormValues = z.infer<typeof reasonFormSchema>;

export const defaultReasonFormValues: ReasonFormValues = {
	reason: "",
};
