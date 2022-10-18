import { Goerli } from "@usedapp/core";

export const ROUTER_ADDRESS = "";

export const DAPP_CONFIG = {
	readOnlyChainId: Goerli.chainId,
	readOnlyUrls: {
		[Goerli.chainId]: "",
	},
};
