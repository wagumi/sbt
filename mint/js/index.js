const url = new URL(window.location.href);
const owner = url.searchParams.get("owner");
const username = url.searchParams.get("username");
const userid = url.searchParams.get("userid");
const salt = url.searchParams.get("salt");
const signature = url.searchParams.get("signature");
const debug = url.searchParams.get("debug");

const provider = new ethers.providers.Web3Provider(window.ethereum);

//const chainId = 137;
const polygonChainId = 80001;

const getParams = async () => {
	if (owner && userid && salt && signature) {
		document.getElementById("address").textContent = owner;
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
		console.log("ウォレットが接続できていません");
	} else {
		await getParams();
	}

	const accounts = await provider.send("eth_requestAccounts", []);
	if (accounts.length === 0) {
		alert("ウォレットが接続できていません");
		return false;
	}

	if (accounts[0] !== owner.toLowerCase()) {
		document.getElementById("address").textContent = owner;
		alert(`ウォレットで選択されているアカウントが申請と異なります。\n申請されたアドレスは${owner}です。`);
		return false;
	}

	try {
		/*
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
*/
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
	} catch (e) {
		console.log(e);
	}

	const { chainId } = await provider.getNetwork();
	if (chainId !== polygonChainId) {
		alert("ウォレットでPoligonネットワークを選択してください");
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

const mintButton = document.getElementById("mintButton");
mintButton.addEventListener("click", async () => {
	if (mintButton.ariaDisabled === null) {
		try {
			mintButton.ariaDisabled = "True";
			const result = await connect();
			console.log(result);
			if (result) {
				await mint();
			}
		} catch {
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

	try{
		const signer = provider.getSigner();

		const contract = new ethers.Contract(
			"0xc0B3483bD8B2740b7BC070615FEb9988F793d621",
			abi,
			signer,
		);
	
		const tx = await contract.mint(owner, userid, salt, signature);
	}
	catch(e){
		console.error(e);
		if(debug){
			alert(e);
		}
	}
};

(async () => {
	await getParams();
})();
