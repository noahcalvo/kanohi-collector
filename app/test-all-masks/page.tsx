import { useMemo } from "react";
import { colorToHex } from "../../lib/colors";
import { getAvailableColors } from "../../lib/engine";
import { masks } from "../../lib/staticData";
import { type Rarity } from "../../lib/types";
import { ColoredMask } from "../components/ColoredMask";

export default function TestAllMasksPage() {
  const allMasks = useMemo(() => masks, []);
  const rarities: Rarity[] = useMemo(() => ["COMMON", "RARE", "MYTHIC"], []);

  const masksByGeneration = useMemo(() => {
    return allMasks.reduce<Record<number, typeof allMasks>>((acc, mask) => {
      const gen = mask.generation;
      if (!acc[gen]) acc[gen] = [];
      acc[gen].push(mask);
      return acc;
    }, {});
  }, [allMasks]);

  const colorsByGeneration = useMemo(() => {
    const result: Record<number, Record<Rarity, string[]>> = {};
    Object.keys(masksByGeneration).forEach((genKey) => {
      const genNum = Number(genKey);
      result[genNum] = {} as Record<Rarity, string[]>;
      rarities.forEach((rarity) => {
        result[genNum][rarity] = getAvailableColors(rarity, genNum);
      });
    });
    return result;
  }, [masksByGeneration, rarities]);

  const allColors = useMemo(() => {
    const colors = new Set<string>();
    Object.values(colorsByGeneration).forEach((colorMap) => {
      Object.values(colorMap).forEach((colorList) => {
        colorList.forEach((color) => colors.add(color));
      });
    });
    return Array.from(colors).sort();
  }, [colorsByGeneration]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
            Test: All Masks & Colors
          </h1>
          <p className="text-slate-600 text-lg mt-2">
            Complete catalog of all masks and available colors in the drop pool
          </p>
          
          {/* Color Unlock Mechanic Explanation */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Color Unlock Mechanic</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Standard color:</strong> Always available (60% drop rate)</li>
              <li>• <strong>Original color:</strong> Marked with ★ - 20% drop rate when available</li>
              <li>• <strong>Other colors:</strong> Equally split 20% combined drop rate when available</li>
              <li>• <strong>Unlock mechanics:</strong> Each non-standard color can only be unlocked once per mask. Once unlocked, it won&apos;t drop again for that mask, making room for other colors to drop at higher rates.</li>
              <li>• <strong>When all colors unlocked:</strong> Only standard color drops (100% drop rate)</li>
            </ul>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm uppercase tracking-wide">
              Total Masks
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {allMasks.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm uppercase tracking-wide">
              Total Colors
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {allColors.length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="text-slate-600 text-sm uppercase tracking-wide">
              Rarities
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {rarities.length}
            </div>
          </div>
        </div>

        {/* All Colors Palette */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-200 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">
            All Available Colors
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {allColors.map((color) => (
              <div key={color} className="flex flex-col items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                  style={{ backgroundColor: colorToHex(color) }}
                  title={color}
                />
                <div className="text-sm text-slate-700 text-center font-medium">
                  {color}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Masks by Generation and Rarity */}
        {Object.entries(masksByGeneration)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([generationKey, masks]) => {
            const generation = Number(generationKey);
            return (
              <div key={generation} className="space-y-6 mb-12">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-600 text-white">
                    Generation {generation}
                  </div>
                  <span className="text-slate-700 text-lg">
                    {masks.length} mask{masks.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {rarities.map((rarity) => {
                  const masksOfRarity = masks.filter(
                    (m) => m.base_rarity === rarity
                  );
                  if (masksOfRarity.length === 0) return null;

                  const colors = colorsByGeneration[generation]?.[rarity] || [];

                  return (
                    <div
                      key={`${generation}-${rarity}`}
                      className="bg-white rounded-lg p-8 shadow-sm border border-slate-200"
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                            rarity === "MYTHIC"
                              ? "bg-purple-600"
                              : rarity === "RARE"
                                ? "bg-blue-600"
                                : "bg-slate-600"
                          }`}
                        >
                          {rarity}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                          {masksOfRarity.length} mask
                          {masksOfRarity.length !== 1 ? "s" : ""}
                        </h2>
                        <span className="text-slate-600 text-lg">
                          {colors.length} color
                          {colors.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      <div className="space-y-8">
                        {masksOfRarity.map((mask) => (
                          <div
                            key={mask.mask_id}
                            className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                          >
                            {/* Mask Header */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                  {mask.name}
                                </h3>
                                <p className="text-sm text-slate-600 mt-1">
                                  ID: {mask.mask_id}
                                </p>
                                <p className="text-sm text-slate-700 mt-3">
                                  {mask.description}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <div className="text-slate-600 uppercase text-xs tracking-wide">
                                    Buff Type
                                  </div>
                                  <div className="font-semibold text-slate-900">
                                    {mask.buff_type}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-600 uppercase text-xs tracking-wide">
                                    Max Level
                                  </div>
                                  <div className="font-semibold text-slate-900">
                                    {mask.max_level}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Colors */}
                            <div>
                              <div className="text-sm text-slate-600 uppercase tracking-wide font-semibold mb-6">
                                Colors ({colors.length})
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                                {colors.map((color) => (
                                  <div
                                    key={color}
                                    className="flex flex-col items-center gap-3"
                                  >
                                    {/* Mask Image */}mask image
                                    <div className="bg-white rounded-lg p-4 h-40 w-40 flex items-center justify-center border-2 border-slate-200 shadow-sm">
                                      <ColoredMask
                                        maskId={mask.mask_id}
                                        color={color}
                                        className="w-32 h-32"
                                        alt={`${mask.name} - ${color}`}
                                        transparent={mask.transparent}
                                      />
                                    </div>
                                    
                                    {/* Color Name & Badge */}
                                    <div className="text-xs text-slate-700 text-center font-medium">
                                      {color}
                                      {color === mask.original_color && (
                                        <div className="text-xs text-yellow-600 font-semibold">
                                          ★ Original
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Drop Rate */}
                                    {color !== "standard" && colors.length > 2 && (
                                      <div className="text-xs text-slate-500 text-center">
                                        {color === mask.original_color
                                          ? "20% (original)"
                                          : `${(20 / (colors.length - 2)).toFixed(1)}% (shared)`}
                                      </div>
                                    )}
                                    {color === "standard" && (
                                      <div className="text-xs text-slate-500 text-center">
                                        60% (standard)
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Special Properties */}
                            {(mask.transparent || mask.is_unique_mythic) && (
                              <div className="mt-6 pt-6 border-t border-slate-200 flex gap-2">
                                {mask.transparent && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                    Transparent
                                  </span>
                                )}
                                {mask.is_unique_mythic && (
                                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                    Unique Mythic
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
}
