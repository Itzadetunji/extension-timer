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

interface ReasonDialogProps {
	open: boolean;
	reason: string;
	onReasonChange: (reason: string) => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: () => void;
}

export function ReasonDialog({
	open,
	reason,
	onReasonChange,
	onOpenChange,
	onSubmit,
}: ReasonDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Why Are You Updating</DialogTitle>
				</DialogHeader>

				<div className="space-y-2">
					<Label htmlFor="update-reason">Tell us why</Label>
					<Textarea
						id="update-reason"
						placeholder="Share your reason..."
						value={reason}
						onChange={(event) => onReasonChange(event.target.value)}
						rows={4}
					/>
				</div>

				<DialogFooter>
					<Button
						type="button"
						size="sm"
						disabled={reason.trim().length === 0}
						onClick={onSubmit}
					>
						Submit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
