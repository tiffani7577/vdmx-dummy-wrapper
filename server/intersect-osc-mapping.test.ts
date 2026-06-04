import { describe, expect, it } from "vitest";
import { buildIntersectMappings, mapControls, filterMappableParameters } from "../shared/intersect-osc-mapping";
import { EFFECTS } from "../shared/intersect-configs";
import { controlSurfaceOscQuery } from "../shared/intersect-fx-osc";

describe("intersect-osc-mapping", () => {
  it("excludes APC / OSCQuery hardware control surfaces", () => {
    const filtered = filterMappableParameters([
      { address: "/OSCQUERY/APC Bottom/FADERS", name: "FADERS", type: "f" },
      { address: "/vdmx/intersect/effects/Kaleidoscope", name: "Kaleidoscope", type: "f" },
      { address: "/some/Slider", name: "Slider", type: "f" },
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe("Kaleidoscope");
  });

  it("excludes Audio Analysis and LFO data sources from auto-mapping", () => {
    const filtered = filterMappableParameters([
      { address: "/Audio Analysis/Filter 1/Level", name: "Level", type: "f" },
      { address: "/LFO 1/Output", name: "Output", type: "f" },
      { address: "/Canvas/Video FX/Bloom/Wet / Dry", name: "Wet / Dry", type: "f" },
    ]);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].address).toContain("Bloom");
  });

  it("maps Mirror Fold via VDMX ISF alias Kaleidoscope", () => {
    const parameters = [
      {
        address: "/OSCQUERY/INTERSECT/Kaleidoscope",
        name: "Kaleidoscope",
        type: "f",
      },
    ];

    const mapped = mapControls(
      [{ id: "kaleidoscope", name: "Mirror Fold", osc: "/intersect/fx/kaleidoscope", aliases: ["Kaleidoscope"] }],
      parameters
    );

    expect(mapped[0]?.mapped).toBe(true);
    expect(mapped[0]?.address).toBe("/OSCQUERY/INTERSECT/Kaleidoscope");
  });

  it("maps Mirror Fold to a Kaleidoscope OSCQuery parameter", () => {
    const parameters = [
      {
        address: "/vdmx/intersect/effects/Kaleidoscope",
        name: "Kaleidoscope",
        type: "f",
      },
      {
        address: "/vdmx/intersect/effects/Bloom",
        name: "Bloom",
        type: "f",
      },
    ];

    const mapped = mapControls(EFFECTS, parameters);
    const kaleidoscope = mapped.find((fx) => fx.id === "kaleidoscope");

    expect(kaleidoscope?.mapped).toBe(true);
    expect(kaleidoscope?.address).toBe("/vdmx/intersect/effects/Kaleidoscope");
    expect(kaleidoscope?.matchedName).toBe("Kaleidoscope");
    expect(kaleidoscope?.name).toBe("Mirror Fold");
  });

  it("maps Mirror Fold to Control Surface OSCQuery by button name", () => {
    const address = controlSurfaceOscQuery("Kaleidoscope");
    const parameters = [
      { address, name: "Kaleidoscope", type: "i" },
      { address: "/OSCQUERY/APC Bottom/FADERS", name: "FADERS", type: "f" },
    ];

    const mapped = mapControls(
      [
        {
          id: "kaleidoscope",
          name: "Mirror Fold",
          osc: address,
          aliases: ["Kaleidoscope"],
        },
      ],
      parameters
    );

    expect(mapped[0]?.mapped).toBe(true);
    expect(mapped[0]?.address).toBe(address);
  });

  it("falls back to hardcoded osc when no parameter matches", () => {
    const mapped = mapControls(EFFECTS, []);
    const kaleidoscope = mapped.find((fx) => fx.id === "kaleidoscope");

    expect(kaleidoscope?.mapped).toBe(false);
    expect(kaleidoscope?.address).toBe("/intersect/fx/kaleidoscope");
  });

  it("builds full intersect mappings from oscquery parameters", () => {
    const result = buildIntersectMappings(
      [{ address: "/fx/Kaleidoscope", name: "Kaleidoscope", type: "f" }],
      {
        effects: EFFECTS,
        generators: [],
        audio: [],
        blend: [],
        master: [],
      }
    );

    expect(result.parameterCount).toBe(1);
    expect(result.mappedCount).toBe(1);
    expect(result.effects.find((fx) => fx.id === "kaleidoscope")?.mapped).toBe(true);
  });
});
