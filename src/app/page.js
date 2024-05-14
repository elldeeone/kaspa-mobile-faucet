"use client";

import { v5 as uuidv5 } from "uuid";

import { useState } from "react";
import MainPage from "./MainPage";

const MY_NAMESPACE = "1b671a64-40d5-491e-99b0-da01ff1f3340";

export default function Home(props) {
  // const [uuid, setUuid] = useState(MY_NAMESPACE);
  // const [pw, setPw] = useState(MY_NAMESPACE);
  const [uuid, setUuid] = useState(props.uuid);
  const [pw, setPw] = useState(props.pw);

  const createUuid = (e) => {
    if (e.target.phrase.value.length >= 8) {
      setUuid(uuidv5(e.target.phrase.value, MY_NAMESPACE));
      setPw(e.target.phrase.value, MY_NAMESPACE);
    }
    e.preventDefault();
  };

  return (
    <main
      className="flex min-h-screen flex-row items-center justify-center text-white"
      style={{ fontFamily: "Rubik" }}
    >
      {!uuid ? (
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
      ) : (
        <MainPage uuid={uuid} pw={pw} />
      )}
    </main>
  );
}
