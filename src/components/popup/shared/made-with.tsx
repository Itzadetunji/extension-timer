import React from "react";

export const MadeWith: React.FC = () => {
	return (
		<p className="self-center">
			Made with ❤️ by{" "}
			<a
				href="https://x.com/itzadetunji"
				target="_blank"
				rel="noreferrer"
				className="underline cursor-pointer"
			>
				Adetunji
			</a>
		</p>
	);
};
