import { VNode, VNodeFlags } from "ivi";
import * as s from "ivi-svg";

const Elements: { [name: string]: (className?: string) => VNode<any> } = {
  "a": s.a,
  "altGlyph": s.altGlyph,
  "altGlyphDef": s.altGlyphDef,
  "altGlyphItem": s.altGlyphItem,
  "animate": s.animate,
  "animateColor": s.animateColor,
  "animateMotion": s.animateMotion,
  "animateTransform": s.animateTransform,
  "circle": s.circle,
  "clipPath": s.clipPath,
  "color-profile": s.colorProfile,
  "cursor": s.cursor,
  "defs": s.defs,
  "desc": s.desc,
  "discard": s.discard,
  "ellipse": s.ellipse,
  "feBlend": s.feBlend,
  "feColorMatrix": s.feColorMatrix,
  "feComponentTransfer": s.feComponentTransfer,
  "feComposite": s.feComposite,
  "feConvolveMatrix": s.feConvolveMatrix,
  "feDiffuseLighting": s.feDiffuseLighting,
  "feDisplacementMap": s.feDisplacementMap,
  "feDistantLight": s.feDistantLight,
  "feDropShadow": s.feDropShadow,
  "feFlood": s.feFlood,
  "feFuncA": s.feFuncA,
  "feFuncB": s.feFuncB,
  "feFuncG": s.feFuncG,
  "feFuncR": s.feFuncR,
  "feGaussianBlur": s.feGaussianBlur,
  "feImage": s.feImage,
  "feMerge": s.feMerge,
  "feMergeNode": s.feMergeNode,
  "feMorphology": s.feMorphology,
  "feOffset": s.feOffset,
  "fePointLight": s.fePointLight,
  "feSpecularLighting": s.feSpecularLighting,
  "feSpotLight": s.feSpotLight,
  "feTile": s.feTile,
  "feTurbulence": s.feTurbulence,
  "filter": s.filter,
  "font": s.font,
  "font-face": s.fontFace,
  "font-face-format": s.fontFaceFormat,
  "font-face-name": s.fontFaceName,
  "font-face-src": s.fontFaceSrc,
  "font-face-uri": s.fontFaceUri,
  "foreignObject": s.foreignObject,
  "g": s.g,
  "glyph": s.glyph,
  "glyphRef": s.glyphRef,
  "hatch": s.hatch,
  "hatchpath": s.hatchpath,
  "hkern": s.hkern,
  "image": s.image,
  "line": s.line,
  "linearGradient": s.linearGradient,
  "marker": s.marker,
  "mask": s.mask,
  "mesh": s.mesh,
  "meshgradient": s.meshgradient,
  "meshpatch": s.meshpatch,
  "meshrow": s.meshrow,
  "metadata": s.metadata,
  "missing-glyph": s.missingGlyph,
  "mpath": s.mpath,
  "path": s.path,
  "pattern": s.pattern,
  "polygon": s.polygon,
  "polyline": s.polyline,
  "radialGradient": s.radialGradient,
  "rect": s.rect,
  "set": s.set,
  "solidcolor": s.solidcolor,
  "stop": s.stop,
  "svg": s.svg,
  "switch": s.svgSwitch,
  "symbol": s.symbol,
  "text": s.text,
  "textPath": s.textPath,
  "title": s.title,
  "tref": s.tref,
  "tspan": s.tspan,
  "use": s.use,
  "view": s.view,
  "vkern": s.vkern,
};

const SvgElements = [
  "a",
  "altGlyph",
  "altGlyphDef",
  "altGlyphItem",
  "animate",
  "animateColor",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "color-profile",
  "cursor",
  "defs",
  "desc",
  "discard",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "font",
  "font-face",
  "font-face-format",
  "font-face-name",
  "font-face-src",
  "font-face-uri",
  "foreignObject",
  "g",
  "glyph",
  "glyphRef",
  "hatch",
  "hatchpath",
  "hkern",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "mesh",
  "meshgradient",
  "meshpatch",
  "meshrow",
  "metadata",
  "missing-glyph",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "solidcolor",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "title",
  "tref",
  "tspan",
  "use",
  "view",
  "vkern",
];

describe("src/index.ts", () => {
  describe("tag name", () => {
    for (const name of Object.keys(Elements)) {
      const factory = Elements[name];
      test(`${name}`, () => {
        const n = factory();
        expect(n._t).toBe(name);
      });
    }
  });

  describe("class name", () => {
    for (const name of Object.keys(Elements)) {
      const factory = Elements[name];
      test(`${name}`, () => {
        const n = factory("abc");
        expect(n._cs).toBe("abc");
      });
    }
  });

  describe("svg flag", () => {
    for (const name of SvgElements) {
      const factory = Elements[name];
      test(`${name}`, () => {
        const n = factory();
        expect((n._f & VNodeFlags.SvgElement) !== 0).toBe(true);
      });
    }
  });

  test(`unique tag id`, () => {
    const index = new Map<number, string>();
    for (const name of Object.keys(Elements)) {
      const factory = Elements[name];
      const n = factory();
      const tagId = (n._f & VNodeFlags.ElementIdMask);
      expect(index.get(tagId)).toBeUndefined();
      index.set(tagId, n._t as string);
    }
  });
});
