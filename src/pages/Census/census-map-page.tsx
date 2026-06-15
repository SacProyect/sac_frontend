import { CensusMap } from "@/components/map/CensusMap";

export default function CensusMapPage() {
  return (
    <div className="relative w-full h-[calc(100dvh-64px)] lg:h-[calc(100dvh-72px)]">
      <CensusMap />
    </div>
  );
}
