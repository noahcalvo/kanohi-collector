/**
 * Temporary component to test different mix-blend-modes on tahu-test.png
 */

export function MixBlendTest() {
  const blendModes = [
    "normal",
    "multiply",
    "screen",
    "overlay",
    "darken",
    "lighten",
    "color-dodge",
    "color-burn",
    "hard-light",
    "soft-light",
    "difference",
    "exclusion",
    "hue",
    "saturation",
    "color",
    "luminosity",
  ];

  const colors = [
    { name: "Red", color: "#FF0000" },
    { name: "Blue", color: "#0000FF" },
    { name: "Green", color: "#00FF00" },
    { name: "Orange", color: "#FF6600" },
    { name: "Purple", color: "#9900FF" },
  ];

  return (
    <div className="p-8 bg-gray-900">
      <h2 className="text-2xl font-bold text-white mb-6">Comparison: 50% Opaque vs 100% Opaque (Dark Background)</h2>
      <p className="text-gray-400 mb-6">Left: tahu-test.png (50% opaque) | Right: tahu-test-2.png (100% opaque)</p>
      
      {colors.map((colorInfo) => (
        <div key={`compare-${colorInfo.name}`} className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">{colorInfo.name}</h3>
          <div className="grid grid-cols-2 gap-8">
            
            {/* multiply + masked with tahu-test.png */}
            <div className="text-center">
              <div 
                className="relative w-32 h-32 mx-auto mb-2" 
                style={{ 
                  isolation: "isolate",
                  WebkitMaskImage: "url(/tahu-test.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/tahu-test.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-white" />
                <img
                  src="/tahu-test.png"
                  alt="Mask test"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundColor: colorInfo.color,
                    mixBlendMode: "multiply"
                  }}
                />
              </div>
              <p className="text-xs text-gray-300">multiply + masked (50%)</p>
            </div>

            {/* multiply + masked with tahu-test-2.png */}
            <div className="text-center">
              <div 
                className="relative w-32 h-32 mx-auto mb-2" 
                style={{ 
                  isolation: "isolate",
                  WebkitMaskImage: "url(/tahu-test-2.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/tahu-test-2.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-white" />
                <img
                  src="/tahu-test-2.png"
                  alt="Mask test"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div 
                  className="absolute inset-0"
                  style={{ 
                    backgroundColor: colorInfo.color,
                    mixBlendMode: "multiply"
                  }}
                />
              </div>
              <p className="text-xs text-gray-300">multiply + masked (100%) ⭐</p>
            </div>

          </div>
        </div>
      ))}

      <div className="mt-16 pt-8 border-t-2 border-gray-700 p-8 bg-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparison on Light Background</h2>
        <p className="text-gray-600 mb-6">Left: tahu-test.png (50% opaque) | Right: tahu-test-2.png (100% opaque)</p>
        
        {colors.map((colorInfo) => (
          <div key={`compare-light-${colorInfo.name}`} className="mb-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{colorInfo.name}</h3>
            <div className="grid grid-cols-2 gap-8">
              
              {/* multiply + masked with tahu-test.png */}
              <div className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2" 
                  style={{ 
                    isolation: "isolate",
                    WebkitMaskImage: "url(/tahu-test.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/tahu-test.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-700">multiply + masked (50%)</p>
              </div>

              {/* multiply + masked with tahu-test-2.png */}
              <div className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2" 
                  style={{ 
                    isolation: "isolate",
                    WebkitMaskImage: "url(/tahu-test-2.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/tahu-test-2.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test-2.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-700">multiply + masked (100%) ⭐</p>
              </div>

            </div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 mt-16 pt-8 border-t-2 border-gray-700">Mix-Blend-Mode Tests (Original)</h2>
      
      {colors.map((colorInfo) => (
        <div key={colorInfo.name} className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-4">{colorInfo.name}</h3>
          <div className="grid grid-cols-4 gap-4">
            {blendModes.map((mode) => (
              <div key={`${colorInfo.name}-${mode}`} className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2"
                  style={{ backgroundColor: colorInfo.color }}
                >
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ mixBlendMode: mode as any }}
                  />
                </div>
                <p className="text-xs text-gray-300">{mode}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-16 border-t-2 border-gray-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-6">Gradient-Preserving Techniques</h2>
        <p className="text-gray-400 mb-6">These preserve the grayscale gradients while applying color</p>
        
        {colors.map((colorInfo) => (
          <div key={`preserve-${colorInfo.name}`} className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-4">{colorInfo.name}</h3>
            <div className="grid grid-cols-3 gap-6">
              
              {/* Technique: Color div behind + multiply (isolated) */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2 bg-checkered" style={{ isolation: "isolate" }}>
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: colorInfo.color }}
                  />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ mixBlendMode: "multiply" }}
                  />
                </div>
                <p className="text-xs text-gray-300">multiply over color</p>
              </div>

              {/* Technique: Image on white, then multiply with color */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2" style={{ isolation: "isolate" }}>
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">color multiply on top</p>
              </div>

              {/* Technique: Image on white, multiply with color, masked */}
              <div className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2" 
                  style={{ 
                    isolation: "isolate",
                    WebkitMaskImage: "url(/tahu-test.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/tahu-test.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">multiply + masked (50% issue)</p>
              </div>

              {/* Technique: Composite mask to boost alpha */}
              <div className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2" 
                  style={{ 
                    isolation: "isolate",
                    WebkitMaskImage: "url(/tahu-test.png), url(/tahu-test.png), url(/tahu-test.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    WebkitMaskComposite: "add",
                    maskImage: "url(/tahu-test.png), url(/tahu-test.png), url(/tahu-test.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                    maskComposite: "add",
                  }}
                >
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">triple mask (boost alpha)</p>
              </div>

              {/* Technique: Just double the opacity by layering */}
              <div className="text-center">
                <div 
                  className="relative w-32 h-32 mx-auto mb-2" 
                  style={{ 
                    isolation: "isolate",
                    WebkitMaskImage: "url(/tahu-test.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/tahu-test.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-white" />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "multiply"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">double image layer</p>
              </div>

              {/* Technique: Luminosity blend mode */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2" style={{ isolation: "isolate" }}>
                  <div 
                    className="absolute inset-0"
                    style={{ backgroundColor: colorInfo.color }}
                  />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ mixBlendMode: "luminosity" }}
                  />
                </div>
                <p className="text-xs text-gray-300">luminosity blend</p>
              </div>

              {/* Technique: Color blend mode (mask provides luminosity) */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2" style={{ isolation: "isolate" }}>
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "color"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">color blend on top</p>
              </div>

              {/* Technique: Hue blend mode */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2" style={{ isolation: "isolate" }}>
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      mixBlendMode: "hue"
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">hue blend on top</p>
              </div>

              {/* Technique: Screen blend (for lighter effect) */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2" style={{ isolation: "isolate" }}>
                  <div className="absolute inset-0 bg-black" />
                  <div 
                    className="absolute inset-0"
                    style={{ 
                      backgroundColor: colorInfo.color,
                      opacity: 0.8
                    }}
                  />
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ mixBlendMode: "screen" }}
                  />
                </div>
                <p className="text-xs text-gray-300">screen over color+black</p>
              </div>

            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t-2 border-gray-700 pt-8">
        <h2 className="text-2xl font-bold text-white mb-6">Original Techniques (for reference)</h2>
        
        {colors.slice(0, 1).map((colorInfo) => (
          <div key={`old-${colorInfo.name}`} className="mb-12">
            <h3 className="text-xl font-semibold text-white mb-4">{colorInfo.name}</h3>
            <div className="grid grid-cols-3 gap-6">
              
              {/* Technique 2: Colored div behind with screen blend */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-2">
                  <img
                    src="/tahu-test.png"
                    alt="Mask test"
                    className="w-full h-full object-contain"
                    style={{ 
                      filter: `drop-shadow(0 0 0 ${colorInfo.color})`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">drop-shadow (reference)</p>
              </div>

              {/* Technique 6: Mask-based approach using background-clip */}
              <div className="text-center">
                <div 
                  className="w-32 h-32 mx-auto mb-2 relative"
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: colorInfo.color,
                      WebkitMaskImage: "url(/tahu-test.png)",
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskImage: "url(/tahu-test.png)",
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                    }}
                  />
                </div>
                <p className="text-xs text-gray-300">CSS mask (reference)</p>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
