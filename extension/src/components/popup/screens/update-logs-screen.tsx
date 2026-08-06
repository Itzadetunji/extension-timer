import { PopupHeader } from "@/components/popup/shared/popup-header";
import { SiteIcon } from "@/components/popup/shared/site-icon";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import {
	formatDeltaSeconds,
	formatLogSummary,
} from "@/lib/tracker/format-time";
import type { UpdateLogEntry } from "@/types/tracker";

interface UpdateLogsScreenProps {
	logs: UpdateLogEntry[];
	onBack: () => void;
}

export function UpdateLogsScreen({ logs, onBack }: UpdateLogsScreenProps) {
	return (
		<div className="flex min-h-full flex-col gap-6">
			<PopupHeader subtitle="View Update Logs" showBack onBack={onBack} />

			<section className="space-y-4">
				{logs.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						No update logs yet.
					</p>
				) : (
					logs.map((log, index) => {
						const totalDelta = log.changes.reduce(
							(sum, change) => sum + change.deltaSeconds,
							0,
						);

						return (
							<div key={log.id} className="space-y-2">
								<p className="text-sm font-medium">
									{index + 1}. {log.date} — {log.reason}
								</p>

								<Accordion className="border border-border px-3">
									<AccordionItem value={log.id}>
										<AccordionTrigger className="py-3 text-sm font-normal text-muted-foreground hover:no-underline">
											({formatLogSummary(totalDelta)})
										</AccordionTrigger>
										<AccordionContent className="space-y-3 pb-3">
											{log.changes.map((change) => (
												<div
													key={change.siteId}
													className="flex items-center justify-between gap-3"
												>
													<div className="flex items-center gap-2.5">
														<SiteIcon siteId={change.siteId} size="sm" />
														<span className="text-sm">{change.siteName}</span>
													</div>
													<span className="text-sm tabular-nums text-muted-foreground">
														{formatDeltaSeconds(change.deltaSeconds)}
													</span>
												</div>
											))}
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						);
					})
				)}
			</section>
		</div>
	);
}
