import type { ReactNode } from "react";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PopupHeaderProps {
	title?: string;
	subtitle?: string;
	showBack?: boolean;
	onBack?: () => void;
	action?: ReactNode;
	className?: string;
}

export function PopupHeader({
	title = "Web Time Tracker",
	subtitle,
	showBack = false,
	onBack,
	action,
	className,
}: PopupHeaderProps) {
	return (
		<header className={cn("space-y-3", className)}>
			<div className="flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-start gap-2">
					{showBack && (
						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className="mt-0.5 shrink-0"
							onClick={onBack}
							aria-label="Go back"
						>
							<ChevronLeftIcon />
						</Button>
					)}
					<div className="min-w-0">
						<h1 className="font-heading text-base font-semibold tracking-wider uppercase">
							{title}
						</h1>
						{subtitle && (
							<p className="mt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
								{subtitle}
							</p>
						)}
					</div>
				</div>
				{action && <div className="shrink-0">{action}</div>}
			</div>
		</header>
	);
}
