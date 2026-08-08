import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DeleteSiteDialogProps {
	open: boolean;
	siteName: string;
	onOpenChange: (open: boolean) => void;
	onDelete: () => void;
}

export function DeleteSiteDialog({
	open,
	siteName,
	onOpenChange,
	onDelete,
}: DeleteSiteDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>Delete Website</DialogTitle>
				</DialogHeader>

				<p className="text-sm leading-relaxed text-muted-foreground">
					Delete {siteName}? This cannot be undone.
				</p>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={onDelete}
					>
						Delete
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
