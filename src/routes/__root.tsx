import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const TanStackRouterDevtools =
	import.meta.env.PROD
		? () => null
		: React.lazy(() =>
			import("@tanstack/react-router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		);

const ReactQueryDevtools =
	import.meta.env.PROD
		? () => null
		: React.lazy(() =>
			import("@tanstack/react-query-devtools").then((res) => ({
				default: res.ReactQueryDevtools,
			})),
		);

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<React.Fragment>
			<TooltipProvider>
				<Outlet />
				<Toaster />
			</TooltipProvider>
			<React.Suspense fallback={null}>
				<TanStackRouterDevtools position="bottom-right" />
				<ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
			</React.Suspense>
		</React.Fragment>
	);
}
