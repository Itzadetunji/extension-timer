import type { AnyFieldApi } from "@tanstack/react-form";

function formatFieldError(error: unknown) {
	if (typeof error === "string") {
		return error;
	}

	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return "Invalid value";
}

interface FieldErrorProps {
	field: AnyFieldApi;
	className?: string;
}

export function FieldError({ field, className }: FieldErrorProps) {
	const errors = field.state.meta.errors;

	if (errors.length === 0) {
		return null;
	}

	return (
		<p className={className ?? "text-sm text-destructive"}>
			{errors.map(formatFieldError).join(", ")}
		</p>
	);
}
