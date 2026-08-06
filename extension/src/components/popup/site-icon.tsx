import { cn } from "@/lib/utils";
import type { SiteId } from "@/types/tracker";

const SITE_STYLES: Record<
	SiteId,
	{ label: string; className: string }
> = {
	youtube: {
		label: "YT",
		className: "bg-red-600 text-white",
	},
	tiktok: {
		label: "TT",
		className: "bg-neutral-900 text-white",
	},
	facebook: {
		label: "FB",
		className: "bg-blue-600 text-white",
	},
};

interface SiteIconProps {
	siteId: SiteId;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const SIZE_CLASSES = {
	sm: "size-7 text-[0.625rem]",
	md: "size-9 text-xs",
	lg: "size-12 text-sm",
};

export function SiteIcon({
	siteId,
	size = "md",
	className,
}: SiteIconProps) {
	const site = SITE_STYLES[siteId];

	return (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
				site.className,
				SIZE_CLASSES[size],
				className,
			)}
			aria-hidden
		>
			{site.label}
		</div>
	);
}
