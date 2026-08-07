import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";
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
	onSubmit: (draftAllowedSeconds: Record<string, number>) => void;
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
	const form = useForm({
		defaultValues: {
			draftAllowedSeconds,
		},
		onSubmit: ({ value }) => {
			onSubmit(value.draftAllowedSeconds);
		},
	});

	useEffect(() => {
		form.setFieldValue("draftAllowedSeconds", draftAllowedSeconds, {
			dontUpdateMeta: true,
		});
	}, [draftAllowedSeconds, form]);

	return (
		<form
			className="flex min-h-full flex-col gap-6"
			onSubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				void form.handleSubmit();
			}}
		>
			<PopupHeader
				subtitle="Update Times"
				showBack
				onBack={onBack}
				action={
					<Button type="button" variant="outline" size="xs" onClick={onAddSite}>
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
									value={secondsToMinutesInput(
										draftAllowedSeconds[site.id] ?? site.allowedSeconds,
									)}
									onChange={(event) => {
										const minutes = Number.parseInt(event.target.value, 10);
										const nextSeconds =
											(Number.isNaN(minutes) ? 0 : minutes) * 60;
										onDraftChange(site.id, nextSeconds);
										form.setFieldValue("draftAllowedSeconds", {
											...form.state.values.draftAllowedSeconds,
											[site.id]: nextSeconds,
										});
									}}
									className="h-9 w-12 border border-input px-2 text-center tabular-nums"
									aria-label={`${site.name} daily limit in minutes`}
								/>
								<Button
									type="button"
									variant="destructive"
									onClick={() => onDeleteSite(site.id)}
									className="self-stretch px-4"
								>
									<TrashIcon />
								</Button>
							</div>
						</div>
						{index < sites.length - 1 && <Separator />}
					</div>
				))}
			</section>

			<form.Subscribe selector={(state) => state.isDirty}>
				{(isDirty) =>
					isDirty ? (
						<div className="mt-auto pt-2">
							<Button type="submit" className="w-full">
								Update
							</Button>
						</div>
					) : null
				}
			</form.Subscribe>
		</form>
	);
}
