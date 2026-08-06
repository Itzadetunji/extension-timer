import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DoneDialogProps {
	open: boolean;
	message: string;
	onOpenChange: (open: boolean) => void;
}

export function DoneDialog({ open, message, onOpenChange }: DoneDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Done</DialogTitle>
				</DialogHeader>

				<p className="text-sm leading-relaxed text-muted-foreground">
					{message}
				</p>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
