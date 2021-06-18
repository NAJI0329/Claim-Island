import React, { useState, useEffect } from "react";
import { useAsync } from "react-use";
import {
  useEthers,
  useTokenBalance,
  useEtherBalance,
  ChainId,
  shortenAddress,
} from "@usedapp/core";
import { connect } from "redux-zero/react";
import { actions } from "../store/redux";

import { formatUnits } from "@ethersproject/units";

import { clamNFTAddress } from "../web3/constants.js";
import getWeb3 from "../web3/getWeb3";

import Web3Avatar from "./Web3Avatar";

const ErrorAlert = ({ title, description }) => (
  <div className="w-full absolute">
    <div
      className="bg-red-200 border-t-4 border-red-600 rounded-md text-red-800 p-4 m-2 absolute z-50"
      role="alert"
    >
      <div className="flex">
        <svg
          className="h-6 w-6 fill-current text-red-500 mr-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z" />
        </svg>
        <div>
          <p className="font-bold">{title}</p>
          <p className="text-sm ">{description}</p>
        </div>
      </div>
    </div>
  </div>
);

const formatBNB = (value) => (value ? formatUnits(value, 18) : "0");
const formatClam = (value) => (value ? formatUnits(value, 0) : "0");

const Web3Navbar = ({ updateAccount, ...state }) => {
  //  is called several times thus need a state to lower the renders
  const [activateError, setActivateError] = useState("");
  const [activateBnbBalance, setActivateBnbBalance] = useState("0");
  const [activateClamBalance, setActivateClamBalance] = useState("0");
  const [activateChainId, setActivateChainId] = useState();

  const { activateBrowserWallet, account, error } = useEthers();
  const clamBalance = useTokenBalance(clamNFTAddress, account); // TODO - not working
  const bnbBalance = useEtherBalance(account);
  const web3 = getWeb3();

  useAsync(async () => {
    console.log("loaded");

    const netId = await web3.eth.net.getId();
    if (netId !== activateChainId) {
      setActivateChainId(netId);
    }
  });

  if (window.ethereum) {
    window.ethereum.on("chainChanged", (networkId) => {
      const newChainId = parseInt(networkId);
      console.log("chainChanged", newChainId);
      if (newChainId !== activateChainId) {
        setActivateChainId(newChainId);
      }
    });
  }

  useEffect(async () => {
    const netId = await web3.eth.net.getId();
    console.log("useEffect updateAccount", { activateChainId, netId });

    updateAccount({
      bnbBalance: activateBnbBalance,
      clamBalance: activateClamBalance,
      error: activateError,
      address: account,
      isConnected: account ? true : false,
      isBSChain: activateChainId === ChainId.BSC,
    });
  }, [
    account,
    activateChainId,
    activateError,
    activateBnbBalance,
    activateClamBalance,
  ]);

  useEffect(() => {
    if (error) {
      setActivateError(error.message);
    }
  }, [error]);

  useEffect(() => {
    // bnbBalance is bignumber
    const balance = formatBNB(bnbBalance);
    // console.log("useEffect", { balance });
    if (balance !== activateBnbBalance) {
      // balance is string
      setActivateBnbBalance(balance);
    }
  }, [bnbBalance]);

  useEffect(() => {
    // clamBalance is bignumber
    const balance = formatClam(clamBalance);
    // console.log("useEffect", { balance });
    if (balance !== activateClamBalance) {
      // balance is string
      setActivateClamBalance(balance);
    }
  }, [clamBalance]);

  return (
    <>
      {activateError && (
        <ErrorAlert title="Something Wrong" description={activateError} />
      )}
      {!state.account.isBSChain && (
        <ErrorAlert
          title="Wrong Network"
          description={
            <>
              You must be connected to{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.binance.org/smart-chain/wallet/metamask.html"
                className="underline"
              >
                Binance Smart Chain
              </a>{" "}
              network.
            </>
          }
        />
      )}

      <nav className="flex-1 min-h-48 min-w-full  md:flex items-center absolute top-10 z-40">
        {/* <nav className="flex items-center justify-between flex-wrap bg-white py-4 lg:px-12 shadow border-solid border-b-4 border-blue-200"> */}
        <div className="flex justify-between lg:w-auto w-full lg:border-b-0 pl-6 pr-2 border-solid border-b-2 border-gray-300 pb-0 lg:pb-2">
          <div className="flex items-center flex-shrink-0 text-gray-800 mr-16">
            {/* <span className="font-semibold text-xl tracking-tight">$CLAM</span> */}
          </div>
        </div>

        <div className="menu w-full lg:block flex-grow lg:flex lg:items-center lg:w-auto lg:px-3 px-8">
          <div className="lg:flex-grow"></div>

          <div className="flex">
            {!account && (
              <button
                // style={{ fontFamily: "AristotelicaBold", lineHeight: "0.7rem" }}
                type="button"
                className="focus:outline-none block text-md px-4 ml-2 py-2 rounded-xl border-2 border-white  bg-blue-600 text-white font-bold hover:text-white hover:bg-blue-400"
                onClick={() => activateBrowserWallet()}
              >
                Connect Wallet
              </button>
            )}

            {account && (
              <>
                <div className="flex lg:mt-0 px-4 py-2 mr-2 rounded-xl shadow bg-gray-600 bg-opacity-80">
                  <span className="p-1 text-sm text-gray-200 font-bold font-sans">
                    {activateClamBalance} CLAM
                  </span>
                </div>

                <div className="flex lg:mt-0 px-4 py-2 bg-gray-900 mr-2 rounded-xl shadow bg-black bg-opacity-80">
                  <div className="p-1 text-sm text-gray-200">
                    {shortenAddress(account)}
                  </div>

                  <Web3Avatar address={account} size={30} />
                </div>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
// just send everything
const mapToProps = (redux) => redux;
export default connect(mapToProps, actions)(Web3Navbar);
