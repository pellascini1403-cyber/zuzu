"use client";

import { useState } from "react";
import PetCanvas from "@/components/3d/PetCanvas";
import StreakBar from "@/components/ui/StreakBar";
import FoodPlate from "@/components/ui/FoodPlate";
import BottomNav from "@/components/ui/BottomNav";
import WardrobeModal from "@/components/modals/WardrobeModal";
import HabitsModal from "@/components/modals/HabitsModal";
import ShopModal from "@/components/modals/ShopModal";
import usePetStats from "@/hooks/usePetStats";

export default function Home() {
  const [activeModal, setActiveModal] = useState(null);
  const { streak, hunger, feed } = usePetStats();

  function toggleModal(key) {
    setActiveModal((current) => (current === key ? null : key));
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-sky-50">
      <PetCanvas />
      <StreakBar streak={streak} />
      <FoodPlate hunger={hunger} onFeed={feed} />
      <BottomNav activeModal={activeModal} onSelect={toggleModal} />

      {activeModal === "wardrobe" && (
        <WardrobeModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "habits" && (
        <HabitsModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === "shop" && (
        <ShopModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
