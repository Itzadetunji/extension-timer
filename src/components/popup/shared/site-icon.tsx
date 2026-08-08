import { GlobeIcon } from "lucide-react";
import type React from "react";

import { InstagramIcon } from "@/components/svg-icons/instagram-icon";
import { LinkedinIcon } from "@/components/svg-icons/linkedin-icon";
import { TiktokIcon } from "@/components/svg-icons/tiktok-icon";
import { XIcon } from "@/components/svg-icons/x-icon";
import { YoutubeIcon } from "@/components/svg-icons/youtube-icon";
import { cn } from "@/lib/utils";
import type { KnownSiteId, SiteId } from "@/types/tracker";

const SITE_ICONS: Record<
	KnownSiteId,
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

function isKnownSiteId(siteId: SiteId): siteId is KnownSiteId {
	return siteId in SITE_ICONS;
}

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
	if (!isKnownSiteId(siteId)) {
		return (
			<GlobeIcon
				aria-hidden
				className={cn(
					"shrink-0 text-muted-foreground",
					SIZE_CLASSES[size],
					className,
				)}
			/>
		);
	}

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
