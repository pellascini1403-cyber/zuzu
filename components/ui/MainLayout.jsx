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
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#FFF8ED] via-[#FCECD7] to-[#F5E2C8]">
      {/* Brillo cálido central detrás de la mascota, para dar profundidad */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_42%,rgba(255,196,110,0.55),transparent_60%)]" />

      {/* Capa 3D / Background */}
      <PetCanvas />

      <TopBar
        coins={coins}
        onOpenResources={() => toggleModal("resources")}
        onOpenSettings={() => toggleModal("settings")}
      />
      <PetStage onOpenChat={() => toggleModal("chat")} />

      {/* Capa Intermedia: Streak (nivel) & Food */}
      <div className="absolute bottom-[28%] left-1/2 z-10 -translate-x-1/2">
        <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-3">
          <LevelBar level={level} xp={xp} xpToNext={xpToNext} />
          <FoodPlate hunger={hunger} onOpen={() => toggleModal("food")} />
        </div>
      </div>

      {/* Capa Inferior: navegación de 3 cápsulas */}
      <div className="absolute inset-x-0 bottom-6 z-10 px-6">
        <BottomNav activeModal={activeModal} onSelect={toggleModal} />
      </div>

      <ThemeBar onOpen={() => toggleModal("theme")} />

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
