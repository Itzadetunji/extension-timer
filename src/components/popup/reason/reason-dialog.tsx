import { useForm } from "@tanstack/react-form";
import { useEffect } from "react";

import { FieldError } from "@/components/popup/shared/field-error";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
	defaultReasonFormValues,
	reasonFormSchema,
} from "./reason-form-schema";

interface ReasonDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (reason: string) => void;
}

export function ReasonDialog({
	open,
	onOpenChange,
	onSubmit,
}: ReasonDialogProps) {
	const form = useForm({
		defaultValues: defaultReasonFormValues,
		validators: {
			onChange: reasonFormSchema,
			onSubmit: reasonFormSchema,
		},
		onSubmit: ({ value, formApi }) => {
			onSubmit(value.reason.trim());
			onOpenChange(false);
			formApi.reset();
		},
	});

	useEffect(() => {
		if (open) {
			form.reset(defaultReasonFormValues);
		}
	}, [form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Why Are You Updating</DialogTitle>
				</DialogHeader>

				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<form.Field name="reason">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Tell us why</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Share your reason..."
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
									rows={4}
								/>
								<FieldError field={field} />
							</div>
						)}
					</form.Field>

					<DialogFooter>
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									size="sm"
									disabled={!canSubmit || isSubmitting}
								>
									Submit
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
