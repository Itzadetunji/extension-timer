import {
	InfoTooltip,
	TOTAL_TIME_ALLOWED_TOOLTIP,
} from "@/components/popup/shared/info-tooltip";
import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { TrackedSite } from "@/types/tracker";
import { TrashIcon } from "lucide-react";

interface UpdateTimesScreenProps {
	sites: TrackedSite[];
	draftAllowedSeconds: Record<string, number>;
	onDraftChange: (siteId: string, seconds: number) => void;
	onDeleteSite: (siteId: string) => void;
	onBack: () => void;
	onSubmit: () => void;
	onAddSite: () => void;
}

function secondsToMinutesInput(seconds: number) {
	return Math.floor(seconds / 60);
}

export function UpdateTimesScreen({
	sites,
	draftAllowedSeconds,
	onDraftChange,
	onDeleteSite,
	onBack,
	onSubmit,
	onAddSite,
}: UpdateTimesScreenProps) {
	return (
		<div className="flex min-h-full flex-col gap-6">
			<PopupHeader
				subtitle="Update Times"
				showBack
				onBack={onBack}
				action={
					<Button
						type="button"
						variant="outline"
						size="xs"
						onClick={onAddSite}
					>
						Add
					</Button>
				}
			/>

			<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
				<span>Total time allowed per day (in minutes)</span>
				<InfoTooltip
					label="Total time allowed per day"
					content={TOTAL_TIME_ALLOWED_TOOLTIP}
				/>
			</div>

			<section className="space-y-1">
				{sites.map((site, index) => (
					<div key={site.id}>
						<div className="flex items-center justify-between gap-4 py-3">
							<div className="flex min-w-0 items-center gap-3">
								<SiteIcon
									siteId={site.id}
									size="sm"
								/>
								<span className="truncate text-sm font-medium">
									{site.name}
								</span>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Input
									type="number"
									min={0}
									inputMode="numeric"
									value={secondsToMinutesInput(
										draftAllowedSeconds[site.id] ?? site.allowedSeconds,
									)}
									onChange={(event) => {
										const minutes = Number.parseInt(event.target.value, 10);
										onDraftChange(
											site.id,
											(Number.isNaN(minutes) ? 0 : minutes) * 60,
										);
									}}
									className="h-9 w-12 border border-input px-2 text-center tabular-nums"
									aria-label={`${site.name} daily limit in minutes`}
								/>
								<Button
									type="button"
									variant="destructive"
									size="xs"
									onClick={() => onDeleteSite(site.id)}
								>
									<TrashIcon />
								</Button>
							</div>
						</div>
						{index < sites.length - 1 && <Separator />}
					</div>
				))}
			</section>

			<div className="mt-auto pt-2">
				<Button
					type="button"
					className="w-full"
					onClick={onSubmit}
				>
					Update
				</Button>
			</div>
		</div>
	);
}
