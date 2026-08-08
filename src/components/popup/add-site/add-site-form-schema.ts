import { z } from "zod";

import { normalizeUrlInput } from "@/lib/sites/resolve-site-from-url";
import { isTrackableUrl } from "@/lib/tabs/get-current-tab-url";

export const addSiteFormSchema = z
	.object({
		urlSource: z.enum(["current", "custom"]),
		customUrl: z.string(),
		currentPageUrl: z.string(),
	})
	.superRefine((values, context) => {
		if (values.urlSource === "current") {
			if (!values.currentPageUrl.trim()) {
				context.addIssue({
					code: "custom",
					message: "No trackable page found.",
					path: ["customUrl"],
				});
				return;
			}

			if (!isTrackableUrl(values.currentPageUrl)) {
				context.addIssue({
					code: "custom",
					message:
						"The current page cannot be tracked. Switch to a website tab.",
					path: ["customUrl"],
				});
			}

			return;
		}

		if (!normalizeUrlInput(values.customUrl)) {
			context.addIssue({
				code: "custom",
				message: "Enter a valid website URL.",
				path: ["customUrl"],
			});
		}
	});

export type AddSiteFormValues = z.infer<typeof addSiteFormSchema>;

export const defaultAddSiteFormValues: AddSiteFormValues = {
	urlSource: "current",
	customUrl: "",
	currentPageUrl: "",
};

export function resolveAddSiteUrl(values: AddSiteFormValues) {
	if (values.urlSource === "current") {
		return values.currentPageUrl;
	}

	return normalizeUrlInput(values.customUrl) || values.customUrl.trim();
}
