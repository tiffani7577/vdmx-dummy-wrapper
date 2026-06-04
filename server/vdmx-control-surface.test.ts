import { describe, expect, it } from "vitest";
import {
  generateVdmxControlSurfaceTemplate,
  buildEffectSendMap,
  CONTROL_SURFACE_EFFECTS,
} from "../shared/vdmx-control-surface";
import { canvasFxWetDryOsc } from "../shared/vdmx-canvas-fx";

describe("vdmx-control-surface", () => {
  it("generates 25 toggle buttons with OSC senders", () => {
    const template = generateVdmxControlSurfaceTemplate();

    expect(CONTROL_SURFACE_EFFECTS).toHaveLength(25);
    expect(template.keyArray).toEqual(
      expect.arrayContaining(CONTROL_SURFACE_EFFECTS.map((e) => e.vdmxIsfName))
    );
    expect(template.classArray.filter((c) => c === "Button")).toHaveLength(25);
    expect(template.keyArray).not.toContain("Rutt-Etra");
  });

  it("wires Kaleidoscope sender to Canvas FX Wet/Dry", () => {
    const template = generateVdmxControlSurfaceTemplate();
    const kaleidoscope = template.uiBuilder.Kaleidoscope as {
      sndrs: { msgAddress: string; enabled: boolean; senderType: number; outputPort: number }[];
      wetDrySendAddress: string;
      toggle: boolean;
      sendEnabled: boolean;
    };

    const expected = "/Canvas/Video FX/Kaleidoscope/Wet / Dry";

    expect(kaleidoscope.toggle).toBe(true);
    expect(kaleidoscope.sendEnabled).toBe(true);
    expect(kaleidoscope.wetDrySendAddress).toBe(expected);
    expect(kaleidoscope.sndrs[0].enabled).toBe(true);
    expect(kaleidoscope.sndrs[0].senderType).toBe(4);
    expect(kaleidoscope.sndrs[0].msgAddress).toBe(expected);
    expect(kaleidoscope.sndrs[0].outputPort).toBe(1234);
  });

  it("maps user-specified send addresses for RGB Shift, Feedback, Datamosh, Pixel Sort", () => {
    const map = Object.fromEntries(buildEffectSendMap().map((e) => [e.button, e.sendAddress]));

    expect(map["RGB Shift"]).toBe("/Canvas/Video FX/Glitch Shifter/Wet / Dry");
    expect(map.Feedback).toBe("/Canvas/Video FX/Zooming Feedback/Wet / Dry");
    expect(map.Datamosh).toBe("/Canvas/Video FX/FastMosh/Wet / Dry");
    expect(map["Pixel Sort"]).toBe("/Canvas/Video FX/Sorting Smear/Wet / Dry");
  });

  it("embeds effectSendMap in _meta for all 25 effects", () => {
    const template = generateVdmxControlSurfaceTemplate();
    expect(template._meta.effectSendMap).toHaveLength(25);
    expect(
      CONTROL_SURFACE_EFFECTS.every((e) =>
        template._meta.effectSendMap.some(
          (entry: { sendAddress: string }) =>
            entry.sendAddress === canvasFxWetDryOsc(e.isfFilename)
        )
      )
    ).toBe(true);
  });

  it("includes master opacity slider", () => {
    const template = generateVdmxControlSurfaceTemplate();
    expect(template.keyArray).toContain("Master Opacity");
    expect(template.classArray).toContain("Slider");
  });

  it("embeds a one-page setup guide in _meta", () => {
    const template = generateVdmxControlSurfaceTemplate();
    expect(template._meta.setupGuide).toContain("Kaleidoscope.fs");
    expect(template._meta.setupGuide).toContain("Wet / Dry");
    expect(
      CONTROL_SURFACE_EFFECTS.every((e) => template._meta.setupGuide.includes(e.isfFilename))
    ).toBe(true);
  });
});
