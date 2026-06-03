import { describe, expect, it } from "vitest";
import { generateVdmxControlSurfaceTemplate } from "../shared/vdmx-control-surface";
import { INTERSECT_TEMPLATE_EFFECTS } from "../shared/intersect-template-effects";

describe("vdmx-control-surface", () => {
  it("generates a toggle button for every template effect", () => {
    const template = generateVdmxControlSurfaceTemplate();

    expect(template.keyArray).toEqual(
      expect.arrayContaining(INTERSECT_TEMPLATE_EFFECTS.map((e) => e.vdmxIsfName))
    );
    expect(template.classArray.filter((c) => c === "Button")).toHaveLength(
      INTERSECT_TEMPLATE_EFFECTS.length
    );
  });

  it("wires Kaleidoscope to the INTERSECT OSC address", () => {
    const template = generateVdmxControlSurfaceTemplate();
    const kaleidoscope = template.uiBuilder.Kaleidoscope as {
      rcvrs: { src: string }[];
      toggle: boolean;
      sendEnabled: boolean;
    };

    expect(kaleidoscope.toggle).toBe(true);
    expect(kaleidoscope.sendEnabled).toBe(true);
    expect(kaleidoscope.rcvrs[0].src).toBe("/intersect/fx/kaleidoscope");
  });

  it("includes master opacity slider", () => {
    const template = generateVdmxControlSurfaceTemplate();
    expect(template.keyArray).toContain("Master Opacity");
    expect(template.classArray).toContain("Slider");
  });
});
