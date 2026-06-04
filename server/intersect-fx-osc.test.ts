import { describe, expect, it } from "vitest";
import {
  INTERSECT_FX_OSC_ALL,
  CONTROL_SURFACE_EFFECTS,
  CONTROL_SURFACE_MASTER_OSC,
  KALEIDOSCOPE_DUAL_OSC,
  buildAllEffectsOffOscMessages,
  buildChainTriggerPhases,
  buildEffectToggleOscMessages,
  chainFxIdsToOscAddresses,
  chainFxIdsToOscMessages,
  controlSurfaceOscQuery,
  discoverFxOscPairs,
  isAllowedIntersectOutboundOsc,
  resolveIntersectFxOsc,
  resolveIntersectFxWetDryOsc,
  CANVAS_FX_OSC_ARG_TYPE,
  EFFECT_OSC_ARG_TYPE,
} from "../shared/intersect-fx-osc";

describe("intersect-fx-osc", () => {
  it("uses Control_Surface_3 OSCQuery paths", () => {
    expect(resolveIntersectFxOsc("kaleidoscope")).toBe(
      "/OSCQUERY/Control_Surface_3/Kaleidoscope"
    );
    expect(resolveIntersectFxOsc("blur")).toBe(
      "/OSCQUERY/Control_Surface_3/Gaussian Blur"
    );
    expect(CONTROL_SURFACE_MASTER_OSC.opacity).toBe(
      "/OSCQUERY/Control_Surface_3/Master Opacity"
    );
  });

  it("resolves Canvas FX Wet/Dry paths from effect ids", () => {
    expect(resolveIntersectFxWetDryOsc("kaleidoscope")).toBe(
      "/Canvas/Video FX/Kaleidoscope/Wet / Dry"
    );
    expect(resolveIntersectFxWetDryOsc("rgb_shift")).toBe(
      "/Canvas/Video FX/Glitch Shifter/Wet / Dry"
    );
    expect(resolveIntersectFxWetDryOsc("feedback_echo")).toBe(
      "/Canvas/Video FX/Zooming Feedback/Wet / Dry"
    );
  });

  it("builds dual OSC messages for Kaleidoscope toggle on", () => {
    expect(buildEffectToggleOscMessages("kaleidoscope", true)).toEqual([
      {
        address: KALEIDOSCOPE_DUAL_OSC.oscQuery,
        value: 1,
        argType: EFFECT_OSC_ARG_TYPE,
      },
      {
        address: KALEIDOSCOPE_DUAL_OSC.wetDry,
        value: 1.0,
        argType: CANVAS_FX_OSC_ARG_TYPE,
      },
    ]);
  });

  it("builds dual OSC messages for Kaleidoscope toggle off", () => {
    expect(buildEffectToggleOscMessages("kaleidoscope", false)).toEqual([
      {
        address: KALEIDOSCOPE_DUAL_OSC.oscQuery,
        value: 0,
        argType: EFFECT_OSC_ARG_TYPE,
      },
      {
        address: KALEIDOSCOPE_DUAL_OSC.wetDry,
        value: 0.0,
        argType: CANVAS_FX_OSC_ARG_TYPE,
      },
    ]);
  });

  it("lists all unique Control Surface effect button addresses", () => {
    expect(CONTROL_SURFACE_EFFECTS).toHaveLength(25);
    expect(INTERSECT_FX_OSC_ALL).toHaveLength(25);
    expect(INTERSECT_FX_OSC_ALL).toContain(controlSurfaceOscQuery("Bloom"));
    expect(INTERSECT_FX_OSC_ALL).toContain(controlSurfaceOscQuery("Waveform Displace"));
  });

  it("clears all 25 effects on both OSCQuery and Wet/Dry", () => {
    const messages = buildAllEffectsOffOscMessages();
    expect(messages.filter((m) => m.argType === "i")).toHaveLength(25);
    expect(messages.filter((m) => m.argType === "f")).toHaveLength(25);
    expect(messages.every((m) => m.value === 0 || m.value === 0.0)).toBe(true);
  });

  it("maps chain effect ids to Control Surface addresses", () => {
    expect(resolveIntersectFxOsc("feedback_echo")).toBe(
      "/OSCQUERY/Control_Surface_3/Feedback"
    );
    expect(resolveIntersectFxOsc("invert")).toBe(
      "/OSCQUERY/Control_Surface_3/Color Invert"
    );
    expect(resolveIntersectFxOsc("scanlines")).toBe(
      "/OSCQUERY/Control_Surface_3/Scan Lines"
    );
  });

  it("dedupes chain addresses when multiple ids map to the same button", () => {
    const addresses = chainFxIdsToOscAddresses(["feedback_echo", "time_glitch"]);
    expect(addresses).toEqual([
      "/OSCQUERY/Control_Surface_3/Feedback",
      "/OSCQUERY/Control_Surface_3/Zoom Feedback",
    ]);
  });

  it("builds dual chain messages with deduped addresses", () => {
    const messages = chainFxIdsToOscMessages(["kaleidoscope", "rgb_shift"], true);
    expect(messages).toHaveLength(4);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          address: "/OSCQUERY/Control_Surface_3/Kaleidoscope",
          value: 1,
          argType: "i",
        }),
        expect.objectContaining({
          address: "/Canvas/Video FX/Kaleidoscope/Wet / Dry",
          value: 1.0,
          argType: "f",
        }),
        expect.objectContaining({
          address: "/OSCQUERY/Control_Surface_3/RGB Shift",
          value: 1,
          argType: "i",
        }),
        expect.objectContaining({
          address: "/Canvas/Video FX/Glitch Shifter/Wet / Dry",
          value: 1.0,
          argType: "f",
        }),
      ])
    );
  });

  it("separates chain clear and on into two phases", () => {
    const phases = buildChainTriggerPhases(["kaleidoscope"]);
    expect(phases).toHaveLength(2);
    expect(phases[0].every((message) => message.value === 0 || message.value === 0.0)).toBe(true);
    expect(phases[1]).toEqual(buildEffectToggleOscMessages("kaleidoscope", true));
  });

  it("blocks outbound OSC to APC paths", () => {
    expect(isAllowedIntersectOutboundOsc("/OSCQUERY/APC Bottom/FADERS")).toBe(false);
    expect(isAllowedIntersectOutboundOsc("/OSCQUERY/Control_Surface_3/Kaleidoscope")).toBe(true);
    expect(isAllowedIntersectOutboundOsc("/Canvas/Video FX/Bloom/Wet / Dry")).toBe(true);
  });

  it("discovers live Wet/Dry paths from OSCQuery parameters", () => {
    const discovered = discoverFxOscPairs([
      {
        address: "/OSCQUERY/Control_Surface_3/Kaleidoscope",
        name: "Kaleidoscope",
        type: "i",
      },
      {
        address: "/Canvas/Video FX/Kaleidoscope/Wet / Dry",
        name: "Wet / Dry",
        type: "f",
      },
    ]);

    expect(discovered.kaleidoscope).toEqual({
      oscQuery: "/OSCQUERY/Control_Surface_3/Kaleidoscope",
      wetDry: "/Canvas/Video FX/Kaleidoscope/Wet / Dry",
    });
  });
});
