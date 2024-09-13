"use client";

import { v5 as uuidv5 } from "uuid";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3340";

export default function MainPage(props) {
  // const [uuid, setUuid] = useState(MY_NAMESPACE);
  // const [pw, setPw] = useState(MY_NAMESPACE);
  const [uuid, setUuid] = useState(props.uuid);
  const [pw, setPw] = useState(props.pw);
  const [addr, setAddr] = useState(null);
  const [timePassed, setTimePassed] = useState(0.0);
  const [msg, setMsg] = useState(null);
  const [txId, setTxId] = useState(null);
  const [scanStart, setScanStart] = useState(null);
  const [variant, setVariant] = useState(1);
  const [fastestTime, setFastestTime] = useState(
    localStorage.getItem("fastestTime") || 60
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [sendingToAddr, setSendingToAddr] = useState(false);

  const startDateRef = useRef();
  startDateRef.current = startDate;

  const sendingToAddrRef = useRef();
  sendingToAddrRef.current = sendingToAddr;

  const variantRef = useRef();
  variantRef.current = variant;

  const fastestTimeRef = useRef();
  fastestTimeRef.current = fastestTime;

  const timePassedRef = useRef();
  timePassedRef.current = timePassed;

  const txIdRef = useRef();
  txIdRef.current = txId;

  const endDateRef = useRef();
  endDateRef.current = endDate;

  const scanStartRef = useRef();
  scanStartRef.current = scanStart;

  const sendTxTo = (addr) => {
    console.log("post TX now!", addr);
    setEndDate(null);
    axios
      .post(
        `https://kaspagames.org/api/wallets/${uuid}/transactions`,
        {
          toAddr: addr,
          amount: 100000000,
          inclusiveFee: false,
        },
        {
          auth: {
            username: "0",
            password: pw,
          },
        }
      )
      .then((resp) => {
        console.log("TX ADDR", resp.data);
        setTxId(resp.data);
        setStartDate(Date.now());
      })
      .catch((err) => {
        console.log("error sending TX.", err);
      });
  };

  const startTx = (addr) => {
    console.log("sending to ", addr);
    setSendingToAddr(addr);
    if (!sendingToAddrRef.current) {
      axios.get("http://de4.kaspa.org:8000/info/blockdag").then((resp) => {
        setScanStart(resp.data.tipHashes[0]);
      });
      setTimeout(() => {
        sendTxTo(addr);
      }, 1000);
    }
  };

  // "kaspa:qqt874j85r5ga5av0q6tthj2tu89dfpchjmvjuvx5tyn2vpjjrhk7tcpsx2vu"
  // );

  useEffect(() => {
    function onScanSuccess(decodedText, decodedResult) {
      // handle the scanned code as you like, for example:
      console.log(`Code matched = ${decodedText}`, decodedResult);
      setMsg(decodedText);
      // setSendingToAddr(decodedText);
      if (!sendingToAddr) {
        startTx(decodedText);
      }
      s;
    }

    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
      setMsg(`Code scan error = ${error}`);
    }

    let html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: 0 },
      /* verbose= */ false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    const updater = setInterval(() => {
      if (!!startDateRef.current) {
        setTimePassed(
          ((endDateRef.current || Date.now()) - startDateRef.current) / 1000
        );
      }
    }, 10);

    setTimeout(() => {
      try {
        document.getElementById("reader__dashboard_section").remove();
      } 
      catch {

      }
      try {
        document.getElementById("reader__header_message").remove();
      } catch {

      }
    }, 5000);

    const txChecker = setInterval(() => {
      if (!!scanStartRef.current && !endDateRef.current) {
        axios
          .get(
            `http://de4.kaspa.org:8000/blocks?lowHash=${scanStartRef.current}&includeBlocks=true`
          )
          .then((resp) => {
            setScanStart(resp.data.blockHashes.pop());
            resp.data.blocks.forEach((block) => {
              if (block.verboseData.transactionIds.includes(txIdRef.current)) {
                setEndDate(Date.now());
                setTimeout(() => {
                  if (timePassedRef.current < fastestTimeRef.current) {
                    console.log("Time ", timePassedRef.current);
                    setFastestTime(timePassedRef.current.toFixed(2));
                    localStorage.setItem("fastestTime", timePassedRef.current);
                  }
                  setSendingToAddr(false);
                  setScanStart(null);
                  setStartDate(null);
                  setTxId(null);
                  setEndDate(null);
                  setTimePassed(0);
                  console.log("Reset done.");
                }, 5000);
              }
            });
          });
      }
    }, 500);

    const changeVariant = setInterval(() => {
      setVariant((variantRef.current + 1) % 3);
      //  setVariant(3)
    }, 5000);

    return () => {
      clearInterval(updater);
      clearInterval(txChecker);
    };
  }, []);

  useEffect(() => {
    axios
      .get(`https://kaspagames.org/api/wallets/${uuid}`)
      .then((resp) => {
        console.log("resp", resp.data.publicAddress);
        setAddr(resp.data.publicAddress);
      })
      .catch(() => {
        // no wallet yet... creating new
        axios
          .post(
            `https://kaspagames.org/api/wallets`,
            { uuid: uuid, password: pw },
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods":
                  "GET, POST, PUT, DELETE, OPTIONS, HEAD",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Allow-Headers": "Content-Type",
              },
            }
          )
          .then((resp) => {
            console.log("new wallet created.");
            setAddr(resp.data.publicAddress);
          })
          .catch((r) => {
            console.log("Error occured.", r);
          });
      });
  }, [uuid]);

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center text-white"
      style={{ fontFamily: "Rubik" }}
    >
      <div className="items-center text-6xl font-bold mb-14">KASPA FAUCET</div>
      <div className="flex flex-row">
        {uuid ? (
          <>
            <div className="w-3/5">
              {sendingToAddr && (
                <div
                  id="aaa"
                  className={`flex flex-col gap-y-16 p-16 items-start h-full align-top transition-transform animate-fade`}
                >
                  <div className="text-6xl font-extrabold text-white">
                    Sending 1 KAS to
                  </div>
                  <div className="text-sm ms-10 font-bold">{sendingToAddr}</div>
                  <div className="text-sm ms-10 font-bold">
                    TX ID:{" "}
                    <a
                      href={`https://explorer.kaspa.org/txs/${txId}`}
                      target="_blank"
                    >
                      {txId}
                    </a>
                  </div>
                  <div className="text-4xl ms-20 font-bold flex flex-row gap-6">
                    {timePassed.toFixed(2)}s{" "}
                    {endDate && (
                      <span className="text-4xl text-lime-400">✔</span>
                    )}
                  </div>
                </div>
              )}
              {!sendingToAddr && variant === 0 && (
                <div
                  id="wnd"
                  className={`flex flex-col gap-y-4 p-16 items-start h-full transition-opacity duration-700 ease-in animate-fade`}
                >
                  <div className="text-4xl ms-10 font-bold">
                    GET 1 FREE{" "}
                    <span className="text-[#ffffff] font-">$KAS</span> HERE
                  </div>
                  <div className="text-4xl ms-20 font-bold flex flex-row gap-6">
                    IN LIGHTSPEED{" "}
                    <Image
                      src="speed.svg"
                      width="50"
                      height="50"
                      style={{ color: "white" }}
                    />
                  </div>
                </div>
              )}
              {!sendingToAddr && variant === 1 && (
                <div
                  id="wnd"
                  className={`flex flex-col gap-y-4 p-16 items-start h-full transition-opacity duration-700 ease-in animate-fade`}
                >
                  <div className="text-5xl ms-10 font-bold">
                    &ldquo;BITCOIN WAS THE
                  </div>
                  <div className="text-5xl ms-16 font-bold">
                    KASPA TESTNET&rdquo;
                  </div>
                </div>
              )}
              {!sendingToAddr && variant === 2 && (
                <div
                  id="wnd"
                  className={`flex flex-col gap-y-4 p-16 items-start h-full transition-opacity duration-700 ease-in animate-fade`}
                >
                  <div className="text-4xl ms-10 font-bold">KASPA IS</div>
                  <div className="text-4xl ms-10 font-bold">THE FASTEST</div>
                  <div className="text-4xl ms-10 font-bold">
                    PROOF-OF-WORK NETWORK
                  </div>
                  <div className="text-4xl ms-20 font-bold flex flex-row gap-6">
                    ON EARTH
                  </div>
                </div>
              )}
            </div>
            <div className="w-2/5 flex flex-col items-center">
              <div className="text-xl">Scan your Kaspa wallet QR code here!</div>

              {/* <button
                classbuttonName="m-3 p-3 border-2 bg-slate-600"
                onClick={() => {
                  document.getElementById("reader__dashboard_section").remove();
                  document.getElementById("reader__header_message").remove();
                }}
              >
                Send TX
              </button> */}
              <div className={`h-64 border-red-100 p-8 m-8 mb-8`}>
                <div id="reader" width="400px"></div>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={createUuid}>
            <div className="flex flex-col">
              <div className="text-white text-3xl">
                Please enter your wallet phrase:
              </div>
              <input
                type="text"
                name="phrase"
                id="phrase"
                placeholder="Wallet phrase"
                className="p-1.5 mt-3 text-black"
              />
              <button
                type="submit"
                className="p-2 my-3 bg-emerald-300/80 border-2"
              >
                GO
              </button>
            </div>
          </form>
        )}
        {addr && (
          <div className="fixed bottom-4 left-4 text-sm text-white/50">
            <div className="">Fastest TX today: {fastestTime}s</div>
            <>
              Faucet address:{" "}
              <a
                href={`https://explorer.kaspa.org/addresses/${addr}`}
                target="_blank"
              >
                {addr}
              </a>
            </>
          </div>
        )}
        {/* {msg && (
          <div className="fixed top-4 left-4 text-sm text-red-500">{msg}</div>
        )} */}
      </div>
    </main>
  );
}
