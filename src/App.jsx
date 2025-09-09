
import React from "react";
import CasesList from "./components/CasesList";
import PromoInput from "./components/PromoInput";
import Inventory from "./components/Inventory";
import Leaders from "./components/Leaders";

export default function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-4">🎁 Gifts Battle</h1>
      <CasesList />
      <PromoInput />
      <Inventory />
      <Leaders />
    </div>
  );
}
