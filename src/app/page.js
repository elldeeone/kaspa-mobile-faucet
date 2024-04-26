"use client";

import { v5 as uuidv5 } from "uuid";

import Image from "next/image";
import { useEffect, useState } from "react";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";

const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3341";

export default function Home() {
  const [uuid, setUuid] = useState(MY_NAMESPACE);
  const [pw, setPw] = useState(MY_NAMESPACE);
  const [addr, setAddr] = useState(null);
  const [msg, setMsg] = useState(null);

  const createUuid = (e) => {
    setUuid(uuidv5(e.target.phrase.value, MY_NAMESPACE));
    setPw(e.target.phrase.value, MY_NAMESPACE);
    e.preventDefault();
  };

  useEffect(() => {

    setMsg("hier!")
  
    function onScanSuccess(decodedText, decodedResult) {
      // handle the scanned code as you like, for example:
      console.log(`Code matched = ${decodedText}`, decodedResult);
      setMsg("hier")
    }
    
    function onScanFailure(error) {
      // handle scan failure, usually better to ignore and keep scanning.
      // for example:
      console.warn(`Code scan error = ${error}`);
    }
    
    let html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
  }, [])

  useEffect(() => {
    axios
      .get(`https://kaspagames.org/api/wallets/${uuid}`)
      .then((resp) => {
        console.log("resp", resp.data.publicAddress);
        setAddr(resp.data.publicAddress)
      })
      .catch(() => {
        // no wallet yet... creating new
        axios
          .post(`https://kaspagames.org/api/wallets`, { uuid: uuid, password: pw }, {headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type'
          }})
          .then((resp) => {
            console.log("new wallet created.");
            setAddr(resp.data.publicAddress)
          })
          .catch((r) => {console.log("Error occured.", r)})
      });
  }, [uuid]);

  return (
    <main
      className="flex min-h-screen flex-row items-center justify-center text-white"
      style={{ fontFamily: "Rubik" }}
    >
      {uuid ? (
        <>
          <div className="w-3/5 flex flex-col gap-y-16 p-16 items-start h-full align-top">
            <div className="text-6xl font-extrabold text-white">
              KASPA FAUCET
            </div>
            <div className="text-4xl ms-10 font-bold">
              GET 1 FREE <span className="text-[#ffffff] font-">$KAS</span> HERE
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
          <div className="w-2/5 flex flex-col items-center">
            <div className="text-xl">Just scan your wallet address</div>
            <div className="h-64 border-red-100 border-4 p-8 m-8">
              QR-Code scanner here
              <div id="reader" width="400px"></div>
            </div>

            <div className="flex flex-col justify-start">
              <div className="">TX-ID: 81124.....12412F</div>
              <div className="">Block: 81124.....12412F</div>
              <div className="">Time taken: 1.49s</div>
              <div className="">High score: 0.29s</div>
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
      {addr && <div className="absolute bottom-4 left-4 text-sm text-white/50">Faucet address: <a href={`https://explorer.kaspa.org/addresses/${addr}`} target="_blank">{addr}</a></div>}
      {msg && <div className="absolute top-4 left-4 text-sm text-red-500">{msg}</div>}
    </main>
  );
}
