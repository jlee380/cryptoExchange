import React, { useEffect, useState } from "react";
import { Contract } from "@ethersproject/contracts";
import { abis } from "@my-app/contracts";
import {
	ERC20,
	useContractFunction,
	useEthers,
	useTokenAllowance,
	useTokenBalance,
} from "@usedapp/core";
import { ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import {
	getAvailableTokens,
	getCounterpartTokens,
	findPoolByTokens,
	isOperationPending,
	getFailureMessage,
	getSuccessMessage,
} from "../utils";
import { ROUTER_ADDRESS } from "../config";
import { AmountIn, Balance, AmountOut } from "./";
import styles from "../styles";

const Exchange = ({ pools }) => {
	// getting metamask account
	const { account } = useEthers();
	const [fromValue, setfromValue] = useState("0");
	// which token is going to be exchanged from
	const [fromToken, setfromToken] = useState(pools[0].token0Address);
	const [toToken, settoToken] = useState("");
	// it will be used to reset success messages
	const [resetState, setresetState] = useState(false);

	// make sure it's always big number
	const fromValueBigNumber = parseUnits(fromValue);
	// pull a list of available tokens to exchange
	const availableTokens = getAvailableTokens(pools);
	// target token will be exchanged to
	const counterpartTokens = getCounterpartTokens(pools, fromToken);
	// when tokens to exchange are decided, it needs to find a pair address of a specific liquility pair

	const pairAddress =
		findPoolByTokens(pools, fromToken, toToken)?.address ?? "";
	const routerContract = new Contract(ROUTER_ADDRESS, abis.router02);
	const fromTokenContract = new Contract(fromToken, ERC20.abi);
	const fromTokenBalance = useTokenBalance(fromToken, account);
	const toTokenBalance = useTokenBalance(toToken, account);
	const tokenAllowance =
		useTokenAllowance(fromToken, account, ROUTER_ADDRESS) ||
		parseUnits("0");
	const approvedNeeded = fromValueBigNumber.gt(tokenAllowance);
	const fromValueIsGreaterThan0 = fromValueBigNumber.gt(parseUnits("0"));
	const hasEnoughBalance = fromValueBigNumber.lte(
		fromTokenBalance ?? parseUnits("0")
	);

	const { state: swapApproveState, send: swapApproveSend } =
		useContractFunction(fromTokenContract, "approve", {
			transactionName: "onApprovedRequested",
			getLimitBufferPercentage: 10,
		});

	const { state: swapExexuteState, send: swapExecuteSend } =
		useContractFunction(routerContract, "swapExactTokensForTokens", {
			transactionName: "swapExactTokensForTokens",
			getLimitBufferPercentage: 10,
		});

	const isApproving = isOperationPending(swapApproveState); //TODO
	const isSwapping = isOperationPending(swapExexuteState);
	const canApprove = !isApproving && approvedNeeded;
	const canSwap =
		!approvedNeeded &&
		!isSwapping &&
		fromValueIsGreaterThan0 &&
		hasEnoughBalance;

	const successMessage = getSuccessMessage(
		swapApproveState,
		swapExexuteState
	);
	const failureMessage = getFailureMessage(
		swapApproveState,
		swapExexuteState
	);

	const onApproveRequested = () => {
		swapApproveSend(ROUTER_ADDRESS, ethers.constants.MaxUint256);
	};

	const onSwapRequested = () => {
		swapExecuteSend(
			fromValueBigNumber,
			0,
			[fromToken, toToken],
			account,
			Math.floor(Date.now() / 1000) + 60 * 2
		).then(() => {
			setfromValue("0");
		});
	};

	const onFromValueChange = (value) => {
		const trimmedValue = value.trim();

		try {
			if (trimmedValue) {
				parseUnits(value);
				setfromValue(value);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const onFromTokenChange = (value) => {
		setfromToken(value);
	};

	const onTokenTokenChange = (value) => {
		settoToken(value);
	};

	useEffect(() => {}, [failureMessage, successMessage]);

	return (
		<div className="flex flex-col w-full items-center">
			<div className="mb-8">
				<AmountIn />
				<Balance />
			</div>
			<div className="mb-8 w-[100%">
				<AmountOut />
				<Balance />
			</div>
			{"approvedNeeded" && !isSwapping ? (
				<button
					disabled={!"canApprove"}
					onClick={() => {}}
					className={`${
						"canApprove"
							? "bg-site-pink text-white"
							: "bg-site-dim2 text-site-dim2"
					} ${styles.actionButton}`}>
					{isApproving ? "Approving..." : "Approve"}
				</button>
			) : (
				<button
					disabled={!"canSwap"}
					onClick={() => {}}
					className={`${
						"canSwap"
							? "bg-site-pink text-white"
							: "bg-site-dim2 text-site-dim2"
					} ${styles.actionButton}`}>
					{isSwapping
						? "Swapping..."
						: "hasEnoughBalance"
						? "Swap"
						: "Insufficient balance"}
				</button>
			)}

			{"failureMessage" && !"resetState" ? (
				<p className={styles.message}>{"failureMessage"}</p>
			) : "successMessage" ? (
				<p className={styles.message}>{"successMessage"}</p>
			) : (
				""
			)}
		</div>
	);
};

export default Exchange;
