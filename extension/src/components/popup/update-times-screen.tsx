import { PopupHeader } from "@/components/popup/popup-header";
import { SiteIcon } from "@/components/popup/site-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { TrackedSite } from "@/types/tracker";

interface UpdateTimesScreenProps {
	sites: TrackedSite[];
	draftMinutes: Record<string, number>;
	onDraftChange: (siteId: string, minutes: number) => void;
	onBack: () => void;
	onSubmit: () => void;
}

export function UpdateTimesScreen({
	sites,
	draftMinutes,
	onDraftChange,
	onBack,
	onSubmit,
}: UpdateTimesScreenProps) {
	return (
		<div className="flex min-h-full flex-col gap-6">
			<PopupHeader
				subtitle="Update Times"
				showBack
				onBack={onBack}
			/>

			<section className="space-y-1">
				{sites.map((site, index) => (
					<div key={site.id}>
						<div className="flex items-center justify-between gap-4 py-3">
							<div className="flex min-w-0 items-center gap-3">
								<SiteIcon siteId={site.id} size="sm" />
								<span className="truncate text-sm font-medium">
									{site.name}
								</span>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Input
									type="number"
									min={0}
									inputMode="numeric"
									value={draftMinutes[site.id] ?? site.minutesRemaining}
									onChange={(event) => {
										const value = Number.parseInt(event.target.value, 10);
										onDraftChange(
											site.id,
											Number.isNaN(value) ? 0 : value,
										);
									}}
									className="h-9 w-16 border border-input px-2 text-center tabular-nums"
									aria-label={`${site.name} minutes`}
								/>
								<span className="text-xs text-muted-foreground">min(s)</span>
							</div>
						</div>
						{index < sites.length - 1 && <Separator />}
					</div>
				))}
			</section>

			<div className="mt-auto pt-2">
				<Button type="button" className="w-full" onClick={onSubmit}>
					Update
				</Button>
			</div>
		</div>
	);
}
