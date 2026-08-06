import type React from "react";
import { InstagramIcon } from "@/components/svg-icons/instagram-icon";
import { LinkedinIcon } from "@/components/svg-icons/linkedin-icon";
import { TiktokIcon } from "@/components/svg-icons/tiktok-icon";
import { XIcon } from "@/components/svg-icons/x-icon";
import { YoutubeIcon } from "@/components/svg-icons/youtube-icon";
import { cn } from "@/lib/utils";
import type { SiteId } from "@/types/tracker";

const SITE_ICONS: Record<
	SiteId,
	{
		Icon: React.FC<React.SVGProps<SVGSVGElement>>;
		color: string;
		label: string;
	}
> = {
	youtube: {
		Icon: YoutubeIcon,
		color: "#FF0000",
		label: "YouTube",
	},
	tiktok: {
		Icon: TiktokIcon,
		color: "#FFF",
		label: "TikTok",
	},
	instagram: {
		Icon: InstagramIcon,
		color: "#E4405F",
		label: "Instagram",
	},
	x: {
		Icon: XIcon,
		color: "#FFFFFF",
		label: "X",
	},
	linkedin: {
		Icon: LinkedinIcon,
		color: "#0A66C2",
		label: "LinkedIn",
	},
};

interface SiteIconProps {
	siteId: SiteId;
	size?: "sm" | "md" | "lg";
	className?: string;
}

const SIZE_CLASSES = {
	sm: "size-5",
	md: "size-6",
	lg: "size-10",
};

export function SiteIcon({ siteId, size = "md", className }: SiteIconProps) {
	const site = SITE_ICONS[siteId];
	const Icon = site.Icon;

	return (
		<Icon
			aria-label={site.label}
			className={cn("shrink-0", SIZE_CLASSES[size], className)}
			fill={site.color}
		/>
	);
}
