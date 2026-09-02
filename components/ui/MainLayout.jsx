"use client";

import { useState } from "react";
import PetCanvas from "@/components/3d/PetCanvas";
import TopBar from "@/components/ui/TopBar";
import PetStage from "@/components/ui/PetStage";
import LevelBar from "@/components/ui/LevelBar";
import BottomNav from "@/components/ui/BottomNav";
import ThemeBar from "@/components/ui/ThemeBar";
import BackgroundLayer from "@/components/ui/BackgroundLayer";
import ChatModal from "@/components/modals/ChatModal";
import ResourcesModal from "@/components/modals/ResourcesModal";
import SettingsModal from "@/components/modals/SettingsModal";
import WardrobeModal from "@/components/modals/WardrobeModal";
import HabitsModal from "@/components/modals/HabitsModal";
import ShopModal from "@/components/modals/ShopModal";
import FoodDrawer from "@/components/modals/FoodDrawer";
import ThemeDrawer from "@/components/modals/ThemeDrawer";
import usePetStats from "@/hooks/usePetStats";
import useBackground from "@/hooks/useBackground";

export default function MainLayout() {
  const [activeModal, setActiveModal] = useState(null);
  const { xp, xpToNext, coins, feed, streakJustIncreased } = usePetStats();
  const { currentBackground } = useBackground();

  function toggleModal(key) {
    setActiveModal((current) => (current === key ? null : key));
  }
  const closeModal = () => setActiveModal(null);

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {/* Capa de Fondo Global: full-bleed, siempre detrás (z-0) del resto
          de la UI. El asset/degradado depende de `currentBackground`
          (hooks/useBackground.js) para poder intercambiarse más adelante
          desde la Tienda o "Personalizar escenario" — ver lib/backgrounds.js. */}
      <BackgroundLayer background={currentBackground} />

      {/* Capa 3D: la mascota, por encima del fondo global (z-10). */}
      <PetCanvas onOpenChat={() => toggleModal("chat")} />

      <TopBar
        coins={coins}
        onOpenResources={() => toggleModal("resources")}
        onOpenSettings={() => toggleModal("settings")}
      />
      <PetStage onOpenChat={() => toggleModal("chat")} />

      {/* Capa Intermedia: Streak (nivel), centrada justo debajo de la
          sombra del personaje. El botón de comida se quitó de aquí. */}
      <div className="absolute inset-x-0 bottom-[34.7%] z-10 flex items-center justify-center px-6">
        <LevelBar xp={xp} xpToNext={xpToNext} animateFill={streakJustIncreased} />
      </div>

      {/* Capa Inferior: navegación de 3 cápsulas en abanico, con
          "Personalizar escenario" apilada justo debajo, sobre el margen
          de zona segura del dispositivo. */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 pb-[calc(env(safe-area-inset-bottom)+28px)]">
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
