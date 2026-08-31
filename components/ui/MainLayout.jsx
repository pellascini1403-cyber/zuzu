"use client";

import { useState } from "react";
import PetCanvas from "@/components/3d/PetCanvas";
import TopBar from "@/components/ui/TopBar";
import PetStage from "@/components/ui/PetStage";
import LevelBar from "@/components/ui/LevelBar";
import FoodPlate from "@/components/ui/FoodPlate";
import BottomNav from "@/components/ui/BottomNav";
import ThemeBar from "@/components/ui/ThemeBar";
import ChatModal from "@/components/modals/ChatModal";
import ResourcesModal from "@/components/modals/ResourcesModal";
import SettingsModal from "@/components/modals/SettingsModal";
import WardrobeModal from "@/components/modals/WardrobeModal";
import HabitsModal from "@/components/modals/HabitsModal";
import ShopModal from "@/components/modals/ShopModal";
import FoodDrawer from "@/components/modals/FoodDrawer";
import ThemeDrawer from "@/components/modals/ThemeDrawer";
import usePetStats from "@/hooks/usePetStats";

export default function MainLayout() {
  const [activeModal, setActiveModal] = useState(null);
  const { level, xp, xpToNext, hunger, coins, feed } = usePetStats();

  function toggleModal(key) {
    setActiveModal((current) => (current === key ? null : key));
  }
  const closeModal = () => setActiveModal(null);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-amber-50">
      <PetCanvas />
      <TopBar
        coins={coins}
        onOpenResources={() => toggleModal("resources")}
        onOpenSettings={() => toggleModal("settings")}
      />
      <PetStage onOpenChat={() => toggleModal("chat")} />

      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3">
        <div className="flex w-full max-w-sm items-stretch justify-center gap-3 px-4">
          <LevelBar level={level} xp={xp} xpToNext={xpToNext} />
          <FoodPlate hunger={hunger} onOpen={() => toggleModal("food")} />
        </div>
        <BottomNav activeModal={activeModal} onSelect={toggleModal} />
        <ThemeBar onOpen={() => toggleModal("theme")} />
      </div>

      {activeModal === "chat" && <ChatModal onClose={closeModal} />}
      {activeModal === "resources" && <ResourcesModal onClose={closeModal} />}
      {activeModal === "settings" && <SettingsModal onClose={closeModal} />}
      {activeModal === "characters" && <WardrobeModal onClose={closeModal} />}
      {activeModal === "habits" && <HabitsModal onClose={closeModal} />}
      {activeModal === "shop" && <ShopModal onClose={closeModal} />}
      {activeModal === "food" && (
        <FoodDrawer onClose={closeModal} onFeed={feed} />
      )}
      {activeModal === "theme" && <ThemeDrawer onClose={closeModal} />}
    </div>
  );
}
