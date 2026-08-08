import "@/style.css";

import { createRoot } from "react-dom/client";
import { MadeWith } from "@/components/popup/shared/made-with";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { KnownSiteId } from "@/types/tracker";

const SITE_ROWS: {
	id: KnownSiteId;
	name: string;
	used: string;
	allowed: string;
}[] = [
	{ id: "youtube", name: "Youtube", used: "4:41", allowed: "10:00" },
	{ id: "tiktok", name: "TikTok", used: "0:00", allowed: "15:00" },
	{ id: "instagram", name: "Instagram", used: "0:00", allowed: "15:00" },
	{ id: "linkedin", name: "LinkedIn", used: "0:00", allowed: "15:00" },
	{ id: "x", name: "X", used: "0:00", allowed: "15:00" },
];

function PopupMock() {
	return (
		<div className="popup-root pointer-events-none w-[380px] min-h-[520px] shadow-[0_0_0_1px_oklch(1_0_0_/_0.08),0_32px_80px_-24px_rgba(0,0,0,0.55)]">
			<div className="flex min-h-full flex-1 flex-col justify-between gap-6">
				<header className="flex items-start justify-between gap-3">
					<h2 className="font-heading text-base font-semibold tracking-wider uppercase">
						Web Time Tracker
					</h2>
					<Button type="button" variant="outline" size="xs" tabIndex={-1}>
						View Logs
					</Button>
				</header>

				<section className="flex flex-col items-center gap-3 py-2 text-center">
					<p className="text-5xl leading-none font-semibold tabular-nums">
						4:41
					</p>
					<div className="flex items-center gap-2.5">
						<SiteIcon siteId="youtube" size="lg" />
						<span className="text-sm font-medium">Youtube</span>
					</div>
					<p className="text-xs text-muted-foreground">Time spent today</p>
				</section>

				<div className="flex flex-1 flex-col justify-between gap-1">
					<section className="space-y-3">
						<h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
							Track Times
						</h3>
						<div>
							{SITE_ROWS.map((site, index) => (
								<div key={site.id}>
									<div className="flex items-center justify-between gap-3 py-2.5">
										<div className="flex min-w-0 items-center gap-3">
											<SiteIcon siteId={site.id} size="sm" />
											<span className="truncate text-sm font-medium">
												{site.name}
											</span>
										</div>
										<span className="shrink-0 text-sm tabular-nums text-muted-foreground">
											{site.used} / {site.allowed}
										</span>
									</div>
									{index < SITE_ROWS.length - 1 && <Separator />}
								</div>
							))}
						</div>
					</section>

					<div className="flex flex-col gap-2">
						<div className="flex gap-2 pt-2">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								tabIndex={-1}
							>
								See All Times
							</Button>
							<Button type="button" className="flex-1" tabIndex={-1}>
								Update Times
							</Button>
						</div>
						<MadeWith />
					</div>
				</div>
			</div>
		</div>
	);
}

function StoreLanding() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background p-6 antialiased [-webkit-font-smoothing:antialiased]">
			{/* Chrome Web Store marquee: 1400 × 560 */}
			<div
				id="store-artboard"
				className="relative h-[560px] w-[1400px] overflow-hidden bg-background"
			>
				{/* Soft warm lift — same hue as the extension, just a touch lighter in the center */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0"
					style={{
						background:
							"radial-gradient(ellipse 55% 70% at 22% 50%, oklch(0.28 0.012 43.1 / 0.9), transparent 70%), radial-gradient(ellipse 45% 60% at 78% 45%, oklch(0.26 0.01 43.1 / 0.7), transparent 65%)",
					}}
				/>

				{/* Subtle Linear-style grid in warm white */}
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 opacity-[0.04]"
					style={{
						backgroundImage:
							"linear-gradient(oklch(0.986 0.002 67.8) 1px, transparent 1px), linear-gradient(90deg, oklch(0.986 0.002 67.8) 1px, transparent 1px)",
						backgroundSize: "56px 56px",
						maskImage:
							"radial-gradient(ellipse 75% 65% at 50% 50%, black 15%, transparent 72%)",
					}}
				/>

				<div className="relative z-10 grid h-full grid-cols-[1fr_auto] items-center gap-16 px-20">
					<div className="flex max-w-xl flex-col gap-7">
						<div className="flex items-center gap-3">
							<img
								src="/logo.svg"
								alt=""
								width={40}
								height={40}
								className="size-10 brightness-0 invert"
							/>
							<span className="font-heading text-sm font-semibold tracking-[0.2em] text-foreground uppercase">
								Web Extension Timer
							</span>
						</div>

						<div className="space-y-4">
							<h1 className="font-heading text-[3.25rem] leading-[1.05] font-semibold tracking-tight text-balance text-foreground">
								Track your time.
								<br />
								<span className="text-muted-foreground">
									Block when it matters.
								</span>
							</h1>
							<p className="max-w-md text-pretty font-sans text-base leading-relaxed text-muted-foreground">
								Set daily limits for YouTube, TikTok, Instagram, and more — then
								see exactly when and how much time you spend.
							</p>
						</div>

						<div className="flex items-center gap-3 pt-1">
							<Button type="button" size="lg" tabIndex={-1}>
								Add to Chrome
							</Button>
							<span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
								Free · Privacy-first
							</span>
						</div>
					</div>

					<div className="relative flex items-center justify-center pr-4">
						<div className="origin-center scale-[0.88]">
							<PopupMock />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

const root = document.getElementById("app");
if (root) {
	createRoot(root).render(<StoreLanding />);
}
