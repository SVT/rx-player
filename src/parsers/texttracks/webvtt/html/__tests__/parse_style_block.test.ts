/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import startsWith from "../../../../../utils/starts_with";

describe("parsers - webvtt - parseStyleBlock", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should parse global style", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue {",
          "background-image: linear-gradient(to bottom, dimgray, lightgray);",
          "color: papayawhip;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn(() => {
      return "background-image: linear-gradient(to bottom, dimgray, lightgray);" +
      "color: papayawhip;";
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));
    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;
    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        classes: {},
        global: "background-image: linear-gradient(to bottom, dimgray, lightgray);" +
          "color: papayawhip;",
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(1);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "background-image: linear-gradient(to bottom, dimgray, lightgray);",
        "color: papayawhip;",
        "}",
      ]);
  });

  it("should parse class style", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn(() => {
      return "  color: peachpuff;";
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        classes: {
          b: "  color: peachpuff;",
        },
        global: "",
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(1);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "  color: peachpuff;",
        "}",
      ]);
  });

  it("should parse both global and class style", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue {",
          "background-image: linear-gradient(to bottom, dimgray, lightgray);",
          "color: papayawhip;",
        "}",
      ],
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn((styleBlock: string[]) => {
      if (styleBlock.length === 3) {
        return "background-image: linear-gradient(to bottom, dimgray, lightgray);" +
        "color: papayawhip;";
      } else {
        return "  color: peachpuff;";
      }
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        global: "background-image: linear-gradient(to bottom, dimgray, lightgray);" +
          "color: papayawhip;",
        classes: {
          b: "  color: peachpuff;",
        },
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(2);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "background-image: linear-gradient(to bottom, dimgray, lightgray);",
        "color: papayawhip;",
        "}",
      ]);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "  color: peachpuff;",
        "}",
      ]);
  });

  it("should parse multiple global styles and class style", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue {",
          "background-image: linear-gradient(to bottom, dimgray, lightgray);",
          "color: papayawhip;",
        "}",
      ],
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
      [
        "STYLE",
        "::cue {",
        "a: b;",
        "}",
      ],
    ];

    let i = 0;
    const mockGetStyleContent = jest.fn(() => {
      return "" + i++;
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      { global: "02", classes: { b: "1" } }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(3);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "background-image: linear-gradient(to bottom, dimgray, lightgray);",
        "color: papayawhip;",
        "}",
      ]);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "  color: peachpuff;",
        "}",
      ]);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "a: b;",
        "}",
      ]);
  });

  it("should parse multiple classes in a single style block", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue {",
          "background-image: linear-gradient(to bottom, dimgray, lightgray);",
          "color: papayawhip;",
        "}",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
        "::cue {",
        "a: b;",
        "}",
      ],
    ];

    let i = 0;
    const mockGetStyleContent = jest.fn(() => {
      return "" + i++;
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      { global: "02", classes: { b: "1" } }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(3);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "background-image: linear-gradient(to bottom, dimgray, lightgray);",
        "color: papayawhip;",
        "}",
      ]);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "  color: peachpuff;",
        "}",
      ]);
    expect(mockGetStyleContent)
      .toHaveBeenCalledWith([
        "a: b;",
        "}",
      ]);
  });

  it("should not parse unformed styles", () => {
    const webvttStyle = [
      [
        "BAD STYLE",
      ],
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn(() => {
      return "  color: peachpuff;";
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        classes: {
          b: "  color: peachpuff;",
        },
        global: "",
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(1);
  });

  it("should not override styles if class if declared several times", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
      [
        "STYLE",
        "::cue(b) {",
        "  background-color: dark;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn((styleBlock: string[]) => {
      if (startsWith(styleBlock[0], "  color")) {
        return "  color: peachpuff;";
      }
      return "  background-color: dark;";
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        classes: {
          b: "  color: peachpuff;  background-color: dark;",
        },
        global: "",
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(2);
  });

  it("should return empty style if no style block", () => {
    const webvttStyle: string[][] = [];

    const mockGetStyleContent = jest.fn(() => ({}));

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({}),
    }));
    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual({
      classes: {},
      global: "",
    });
    expect(mockGetStyleContent).toHaveBeenCalledTimes(0);
  });

  it("should add the default style elements to the result", () => {
    const webvttStyle = [
      [
        "STYLE",
        "::cue(b) {",
        "  color: peachpuff;",
        "}",
      ],
      [
        "STYLE",
        "::cue(b) {",
        "  background-color: dark;",
        "}",
      ],
    ];

    const mockGetStyleContent = jest.fn((styleBlock: string[]) => {
      if (startsWith(styleBlock[0], "  color")) {
        return "  color: peachpuff;";
      }
      return "  background-color: dark;";
    });

    jest.mock("../create_default_style_elements", () => ({
      default: () => ({ b: "foo: bar;" }),
    }));

    jest.mock("../get_style_content", () => ({
      default: mockGetStyleContent,
    }));
    const parseStyleBlock = require("../parse_style_block").default;

    expect(parseStyleBlock(webvttStyle)).toEqual(
      {
        classes: {
          b: "foo: bar;  color: peachpuff;  background-color: dark;",
        },
        global: "",
      }
    );
    expect(mockGetStyleContent).toHaveBeenCalledTimes(2);
  });
});
