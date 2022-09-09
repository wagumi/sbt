const url = new URL(window.location.href);
const address = url.searchParams.get("address");
const username = url.searchParams.get("username");
const userid = url.searchParams.get("userid");
const salt = url.searchParams.get("salt");
const signature = url.searchParams.get("signature");
const debug = url.searchParams.get("debug");

const provider = new ethers.providers.Web3Provider(window.ethereum);

const polygonChainId = 137;

const getParams = async () => {
	if (address && userid && salt && signature) {
		document.getElementById("address").textContent = address;
		document.getElementById("username").textContent = username;
		document.getElementById("userid").textContent = userid;
		mintButton.ariaDisabled = null;
		console.log("ver 1.0.0");
	} else {
		mintButton.ariaDisabled = "True";
		alert("必要なパラメータがありません");
	}
};

const connect = async () => {
	if (typeof window.ethereum === "undefined") {
		logs("ウォレットが接続できていません");
	} else {
		await getParams();
	}

	const accounts = await provider.send("eth_requestAccounts", []);
	if (accounts.length === 0) {
		logs("ウォレットが接続できていません");
		return false;
	}

	if (accounts[0] !== address.toLowerCase()) {
		document.getElementById("address").textContent = address;
		logs(`ウォレットで選択されているアカウントが申請と異なります。\n申請されたアドレスは${address}です。`);
		return false;
	}

	try {
		
		await ethereum.request({
			method: "wallet_addEthereumChain",
			params: [
				{
					chainId: `0x${(137).toString(16)}`,
					chainName: "Polygon Mainnet",
					nativeCurrency: {
						name: "MATIC",
						symbol: "MATIC",
						decimals: 18,
					},
					rpcUrls: ["https://polygon-rpc.com"],
					blockExplorerUrls: ["https://polygonscan.com/"],
				},
			],
		});
/*
		const result = await ethereum.request({
			method: "wallet_addEthereumChain",
			params: [
				{
					chainId: `0x${polygonChainId.toString(16)}`,
					chainName: "Mumbai",
					nativeCurrency: {
						name: "MATIC",
						symbol: "MATIC",
						decimals: 18,
					},
					rpcUrls: ["https://matic-mumbai.chainstacklabs.com"],
					blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
				},
			],
		});
*/
	location.reload();
	} catch (e) {
		console.log(e);
	}

	const { chainId } = await provider.getNetwork();
	if (chainId !== polygonChainId) {
		logs("ウォレットでPoligonネットワークを選択してください");
		return false;
	}

	return true;
};

const addressArea = document.getElementById("address");
addressArea.addEventListener("click", async () => {
	const content = document.getElementById("address").innerHTML;
	navigator.clipboard.writeText(content);
});

const userIdArea = document.getElementById("userid");
userIdArea.addEventListener("click", async () => {
	const content = document.getElementById("userid").innerHTML;
	navigator.clipboard.writeText(content);
});

const userNameArea = document.getElementById("username");
userNameArea.addEventListener("click", async () => {
	const content = document.getElementById("username").innerHTML;
	navigator.clipboard.writeText(content);
});

const logsArea = document.getElementById("logs");
logsArea.addEventListener("click", async () => {
	const content = document.getElementById("logs").innerHTML;
	navigator.clipboard.writeText(content);
});

const mintButton = document.getElementById("mintButton");
mintButton.addEventListener("click", async () => {
	if (mintButton.ariaDisabled === null) {
		try {
			mintButton.ariaDisabled = "connect";
			const result = await connect();
			console.log(result);
			if (result) {
				mintButton.ariaDisabled = "mint";
				await mint();
			}
		} catch (e){
			console.log(e);
		} finally {
			mintButton.ariaDisabled = null;
		}
	}
});

const mint = async () => {
	const abi = [
		{
			inputs: [
				{
					internalType: "address",
					name: "_address",
					type: "address",
				},
				{
					internalType: "uint256",
					name: "_tokenId",
					type: "uint256",
				},
				{
					internalType: "uint256",
					name: "_salt",
					type: "uint256",
				},
				{
					internalType: "bytes",
					name: "_signature",
					type: "bytes",
				},
			],
			name: "mint",
			outputs: [],
			stateMutability: "nonpayable",
			type: "function",
		},
	];

	try {
		const signer = provider.getSigner();

		const contract = new ethers.Contract(
			"0xef756b67b90026F91D047D1b991F87D657309A42",
			abi,
			signer,
		);
		
		logs("SBTを発行します");
		const tx = await contract.mint(address, userid, salt, signature);
		logs(`トランザクションを開始しました<br><a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">https://polygonscan.com/tx/${tx.hash}</a><br>`);
		const tr = await tx.wait();
		logs("SBTが発行されました");
	} catch (e) {
			if(e.message.indexOf("MINTED ALREADY") >= 0) {
				logs('<font color="red">既にSBTが発行されています</font>');				
			}
			logs("SBT発行処理を中止しました");
		if (debug) {
			logs(e);
			alert(e);
		}
	}
};

const logs = (message) =>{
	document.getElementById("logs").insertAdjacentHTML(
		"afterbegin",
		`${message}<br>`,
	);

}

(async () => {
	await getParams();
})();
