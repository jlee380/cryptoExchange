import { Goerli } from "@usedapp/core";

export const ROUTER_ADDRESS = "0xb44ebe4C74cfAf8531F19eC846Bffd8c24519D64";

export const DAPP_CONFIG = {
	readOnlyChainId: Goerli.chainId,
	readOnlyUrls: {
		[Goerli.chainId]:
			"https://eth-goerli.g.alchemy.com/v2/j0TDHrmoYjBmP_qQjP27ZUTsWoWyDu6-",
	},
};
