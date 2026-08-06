import { CircleHelpIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface InfoTooltipProps {
	label: string;
	content: ReactNode;
}

export function InfoTooltip({ label, content }: InfoTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				type="button"
				className="inline-flex shrink-0 items-center text-muted-foreground transition-colors hover:text-foreground"
				aria-label={label}
			>
				<CircleHelpIcon className="size-3.5" />
			</TooltipTrigger>
			<TooltipContent side="top">{content}</TooltipContent>
		</Tooltip>
	);
}

export const TIME_SPENT_TODAY_TOOLTIP =
	"Time spent on this site today. Resets at midnight.";

export const TOTAL_TIME_ALLOWED_TOOLTIP =
	"Total time allowed per day for this site. Browsing stops when today's usage reaches this limit.";
