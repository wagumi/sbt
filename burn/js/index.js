const provider = getEthersProvider();

// const polygonChainId = 137;
// const contractAddress = "0xef756b67b90026F91D047D1b991F87D657309A42";

const polygonChainId = 80001;
const contractAddress = "0x8e8B606889BbCA229C2c4D1026A3E6272894130D";

const checkTokenId = async () => {
  const accounts = await provider.send("eth_requestAccounts", []);
  if (accounts.length === 0) {
    return null;
  }

  const url = `https://apps.wagumi.xyz/sbt/tokenId?address=${accounts[0]}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    }
  });
  const result = await response.json();
  if (response.status === 200) {
    document.getElementById("tokenId").value = result.tokenId;
    console.log(result);
  }
  else if(response.status === 404){
    document.getElementById("tokenId").value = "";
    logs("このアドレスはWagumiSBTを保有していません");
    console.error(result.error);
  }
  else{
    console.error(result);
  }
};

const connect = async () => {
  if (typeof window.ethereum === "undefined") {
    logs("ウォレットが接続できていません");
    return false;
  }

  const accounts = await provider.send("eth_requestAccounts", []);
  if (accounts.length === 0) {
    logs("ウォレットが接続できていません");
    return false;
  }

  try {
    // await ethereum.request({
    //   method: "wallet_addEthereumChain",
    //   params: [
    //     {
    //       chainId: `0x${(137).toString(16)}`,
    //       chainName: "Polygon Mainnet",
    //       nativeCurrency: {
    //         name: "MATIC",
    //         symbol: "MATIC",
    //         decimals: 18,
    //       },
    //       rpcUrls: ["https://polygon-rpc.com/"],
    //       blockExplorerUrls: ["https://polygonscan.com/"],
    //     },
    //   ],
    // });

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
    logs("ウォレットでPoligonネットワークを選択してください");
    return false;
  }
  return true;
};

window.ethereum.on("chainChanged", (chainId) => {
  alert(
    "ネットワークが変更された為、再読み込みを行います。\n再読み込み完了後に再度実行してください。"
  );
  console.log(`changed chainId:${chainId}`);
  window.location.reload();
});

window.ethereum.on("accountsChanged", async (account) => {
  console.log(`changed account:${account}`);
  await checkTokenId();
});

const burnButton = document.getElementById("burnButton");
burnButton.addEventListener("click", async () => {
  if (burnButton.ariaDisabled === null) {
    try {
      burnButton.ariaDisabled = "connect";
      const result = await connect();
      if (result) {
        burnButton.ariaDisabled = "burn";
        await burn();
      }
    } catch (e) {
      console.log(e);
    } finally {
      burnButton.ariaDisabled = null;
    }
  }
});

const checkButton = document.getElementById("checkButton");
checkButton.addEventListener("click", async () => {
  if (checkButton.ariaDisabled === null) {
    try {
      checkButton.ariaDisabled = "connect";
      const result = await connect();
      if (result) {
        checkButton.ariaDisabled = "burn";
        await checkTokenId();
      }
    } catch (e) {
      console.log(e);
    } finally {
      checkButton.ariaDisabled = null;
    }
  }
});

const burn = async () => {
  const tokenId = document.getElementById("tokenId").value;
  const abi = [
    {
      inputs: [
        {
          internalType: "uint256",
          name: "_tokenId",
          type: "uint256",
        },
      ],
      name: "burn",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ];

  try {
    const signer = provider.getSigner();

    const contract = new ethers.Contract(contractAddress, abi, signer);

    logs("SBTをBurnします");
    const tx = await contract.burn(tokenId);
    logs(
      `トランザクションを開始しました<br><a href="https://polygonscan.com/tx/${tx.hash}" target="_blank">https://polygonscan.com/tx/${tx.hash}</a><br>`
    );
    await tx.wait();
    logs("SBTがBurnされました");
  } catch (e) {
    if (e.message.indexOf("CONTRACT OWNER OR CURRENT OWNER ONLY") >= 0) {
      logs(
        `<font color="red">TokenID: ${tokenId}をBurnする権限がありません</font>`
      );
    }
    logs("SBTのBurn処理を中止しました");
    if (debug) {
      logs(e);
      alert(e);
    }
  }
};

const logs = (message) => {
  document
    .getElementById("logs")
    .insertAdjacentHTML("afterbegin", `${message}<br>`);
};

function getEthersProvider() {
  return new ethers.providers.Web3Provider(window.ethereum);
}
