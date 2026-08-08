import { useForm } from "@tanstack/react-form";
import { useEffect, useState } from "react";

import { FieldError } from "@/components/popup/shared/field-error";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getCurrentTabHostUrl } from "@/lib/tabs/get-current-tab-url";

import {
	addSiteFormSchema,
	defaultAddSiteFormValues,
	resolveAddSiteUrl,
} from "./add-site-form-schema";

interface AddSiteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (url: string) => string | null;
}

export function AddSiteDialog({
	open,
	onOpenChange,
	onAdd,
}: AddSiteDialogProps) {
	const [isLoadingCurrentPage, setIsLoadingCurrentPage] = useState(false);

	const form = useForm({
		defaultValues: defaultAddSiteFormValues,
		validators: {
			onChange: addSiteFormSchema,
			onSubmit: addSiteFormSchema,
		},
		onSubmit: ({ value, formApi }) => {
			const submissionError = onAdd(resolveAddSiteUrl(value));

			if (submissionError) {
				formApi.setFieldMeta("customUrl", (previous) => ({
					...previous,
					errorMap: {
						...previous.errorMap,
						onSubmit: submissionError,
					},
				}));
				return;
			}

			onOpenChange(false);
			formApi.reset();
		},
	});

	useEffect(() => {
		if (!open) {
			return;
		}

		form.reset(defaultAddSiteFormValues);
		setIsLoadingCurrentPage(true);

		void getCurrentTabHostUrl()
			.then((url) => {
				form.setFieldValue("currentPageUrl", url);
			})
			.finally(() => {
				setIsLoadingCurrentPage(false);
			});
	}, [form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Add Site</DialogTitle>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="urlSource">
						{(field) => (
							<RadioGroup
								value={field.state.value}
								onValueChange={(value) => {
									if (value === "current" || value === "custom") {
										field.handleChange(value);
									}
								}}
							>
								<div className="flex items-start gap-3">
									<RadioGroupItem value="current" id="url-source-current" />
									<div className="space-y-1">
										<Label htmlFor="url-source-current">Current Website</Label>
										<p className="text-xs text-muted-foreground">
											Use the tab you were on when opening the popup.
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3">
									<RadioGroupItem value="custom" id="url-source-custom" />
									<div className="space-y-1">
										<Label htmlFor="url-source-custom">Custom URL</Label>
										<p className="text-xs text-muted-foreground">
											Enter any website you want to track.
										</p>
									</div>
								</div>
							</RadioGroup>
						)}
					</form.Field>

					<form.Subscribe selector={(state) => state.values.urlSource}>
						{(urlSource) => {
							const isCurrentPageSelected = urlSource === "current";

							return (
								<form.Field name="customUrl">
									{(field) => {
										const currentPageUrl = form.getFieldValue("currentPageUrl");

										return (
											<div className="space-y-2">
												<Label htmlFor="site-url">Website URL</Label>
												<Input
													id="site-url"
													type="url"
													name={field.name}
													value={
														isCurrentPageSelected
															? currentPageUrl
															: field.state.value
													}
													readOnly={isCurrentPageSelected}
													placeholder={
														isCurrentPageSelected
															? isLoadingCurrentPage
																? "Loading current website..."
																: "No trackable page found"
															: "github.com/itzadetunji"
													}
													onBlur={field.handleBlur}
													onChange={(event) =>
														field.handleChange(event.target.value)
													}
													className={
														isCurrentPageSelected
															? "cursor-default text-muted-foreground"
															: undefined
													}
												/>
												<FieldError field={field} />
											</div>
										);
									}}
								</form.Field>
							);
						}}
					</form.Subscribe>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									size="sm"
									disabled={isLoadingCurrentPage || !canSubmit || isSubmitting}
								>
									Add
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
