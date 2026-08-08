import "@/style.css";

import { createRoot } from "react-dom/client";

function PrivacyPolicy() {
	return (
		<div className="flex min-h-dvh justify-center bg-background px-6 py-16 text-foreground antialiased [-webkit-font-smoothing:antialiased]">
			<article className="w-full max-w-2xl space-y-10 text-center">
				<header className="space-y-3">
					<p className="font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
						Web Extension Timer
					</p>
					<h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
						Privacy Policy
					</h1>
					<p className="text-sm text-muted-foreground">
						Last updated: August 8, 2026
					</p>
				</header>

				<div className="space-y-8 text-center text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Overview
						</h2>
						<p>
							Web Extension Timer (“the Extension”) helps you track time spent
							on websites you choose and block those sites when a daily limit is
							reached. This Privacy Policy explains what information the
							Extension uses and how it is handled.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Information We Collect
						</h2>
						<p>
							The Extension stores the following information locally on your
							device: websites you choose to track, daily time limits, time spent
							today, weekly usage totals, and a history of limit updates
							(including the reason you enter). It also reads the active tab URL
							only to detect tracked sites and to let you add the current site
							when you choose to.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							How Information Is Used
						</h2>
						<p>
							Information stored by the Extension is used solely to measure time
							on websites you track, enforce daily limits by blocking sites when
							a limit is reached, and show today’s usage, weekly totals, and your
							update history.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Data Storage and Sharing
						</h2>
						<p>
							All Extension data is stored locally in your browser using Chrome’s
							storage APIs. The Extension does not send your browsing data,
							usage history, or limit settings to a remote server operated by us.
							We do not sell, rent, or share your personal information with third
							parties for advertising or analytics.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Permissions
						</h2>
						<p>
							The Extension requests browser permissions only as needed for its
							core features: detecting the active tab, measuring time on tracked
							sites, showing a block screen when a limit is reached, and saving
							your settings and usage history on your device.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Data Retention and Deletion
						</h2>
						<p>
							Your data remains on your device for as long as the Extension is
							installed. Uninstalling the Extension removes its locally stored
							data according to your browser’s normal behavior for extension
							storage.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Children’s Privacy
						</h2>
						<p>
							The Extension is not directed to children under 13, and we do not
							knowingly collect personal information from children.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Changes to This Policy
						</h2>
						<p>
							We may update this Privacy Policy from time to time. The “Last
							updated” date at the top of this page will reflect the latest
							revision. Continued use of the Extension after changes means you
							accept the updated policy.
						</p>
					</section>

					<section className="space-y-3">
						<h2 className="font-heading text-base font-semibold tracking-wide text-foreground uppercase">
							Contact
						</h2>
						<p>
							If you have questions about this Privacy Policy, contact the
							developer at{" "}
							<a
								href="https://x.com/itzadetunji"
								className="text-foreground underline underline-offset-4"
								target="_blank"
								rel="noreferrer"
							>
								@itzadetunji1
							</a>
							.
						</p>
					</section>
				</div>

				<footer className="pt-4">
					<a
						href="/"
						className="text-xs font-semibold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
					>
						← Back to home
					</a>
				</footer>
			</article>
		</div>
	);
}

const root = document.getElementById("app");
if (root) {
	createRoot(root).render(<PrivacyPolicy />);
}
