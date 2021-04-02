import { getParser } from "./parser";
import parserBabel from "prettier/parser-babel";
import parserFlow from "prettier/parser-flow";
import parserTypescript from "prettier/parser-typescript";
import prettier, { SupportOption } from "prettier";
import { JsdocOptions } from "./types";

const options: Record<keyof JsdocOptions, SupportOption> = {
  jsdocParser: {
    name: "jsdocParser",
    type: "boolean",
    category: "jsdoc",
    default: true,
    description: "Format with jsdoc if is true",
  },
  jsdocSpaces: {
    name: "jsdocSpaces",
    type: "int",
    category: "jsdoc",
    default: 1,
    description: "How many spaces will be used to separate tag elements.",
  },
  jsdocDescriptionWithDot: {
    name: "jsdocDescriptionWithDot",
    type: "boolean",
    category: "jsdoc",
    default: false,
    description: "Should dot be inserted at the end of description",
  },
  jsdocDescriptionTag: {
    name: "jsdocDescriptionTag",
    type: "boolean",
    category: "jsdoc",
    default: false,
    description: "Should description tag be used",
  },
  jsdocVerticalAlignment: {
    name: "jsdocVerticalAlignment",
    type: "boolean",
    category: "jsdoc",
    default: false,
    description: "Should tags, types, names and description be aligned",
  },
  jsdocKeepUnParseAbleExampleIndent: {
    name: "jsdocKeepUnParseAbleExampleIndent",
    type: "boolean",
    category: "jsdoc",
    default: false,
    description:
      "Should unParseAble example (pseudo code or no js code) keep its indentation",
  },
  jsdocSingleLineComment: {
    name: "jsdocSingleLineComment",
    type: "boolean",
    category: "jsdoc",
    default: true,
    description: "Should compact single line comment",
  },
  tsdoc: {
    name: "tsdoc",
    type: "boolean",
    category: "jsdoc",
    default: false,
    description: "Should format as tsdoc",
  },
};

const defaultOptions: JsdocOptions = {
  jsdocParser: options.jsdocParser.default as boolean,
  jsdocSpaces: options.jsdocSpaces.default as number,
  jsdocDescriptionWithDot: options.jsdocDescriptionWithDot.default as boolean,
  jsdocDescriptionTag: options.jsdocDescriptionTag.default as boolean,
  jsdocVerticalAlignment: options.jsdocVerticalAlignment.default as boolean,
  jsdocKeepUnParseAbleExampleIndent: options.jsdocKeepUnParseAbleExampleIndent
    .default as boolean,
  jsdocSingleLineComment: options.jsdocSingleLineComment.default as boolean,
  tsdoc: options.tsdoc.default as boolean,
};

const languages = prettier
  .getSupportInfo()
  .languages.filter(({ name }) =>
    [
      "JavaScript",
      "Flow",
      "JSX",
      "TSX",
      "TypeScript",
      "Markdown",
      "MDX",
    ].includes(name),
  );

const parsers = {
  // JS - Babel
  get babel() {
    const parser = parserBabel.parsers.babel;
    return mergeParsers(parser, "babel-babel");
  },
  get "babel-flow"() {
    const parser = parserBabel.parsers["babel-flow"];
    return mergeParsers(parser, "babel-flow");
  },
  get "babel-ts"() {
    const parser = parserBabel.parsers["babel-ts"];
    return mergeParsers(parser, "babel-ts");
  },
  // JS - Flow
  get flow() {
    const parser = parserFlow.parsers.flow;
    return mergeParsers(parser, "flow");
  },
  // JS - TypeScript
  get typescript(): prettier.Parser {
    const parser = parserTypescript.parsers.typescript;

    return mergeParsers(parser, "typescript");
    // require("./parser-typescript").parsers.typescript;
  },
  get "jsdoc-parser"() {
    // Backward compatible, don't use this in new version since 1.0.0
    const parser = parserBabel.parsers["babel-ts"];

    return mergeParsers(parser, "babel-ts");
  },
};

function mergeParsers(originalParser: prettier.Parser, parserName: string) {
  let pluginParse = originalParser.parse;

  const jsDocParse = getParser(pluginParse) as any;
  const jsDocPreprocess = (text: string, options: prettier.ParserOptions) => {
    const tsPlugin = options.plugins.find((plugin) => {
      return (
        typeof plugin === "object" &&
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        //@ts-ignore
        plugin.name &&
        plugin.parsers &&
        // eslint-disable-next-line no-prototype-builtins
        plugin.parsers.hasOwnProperty(parserName)
      );
    }) as prettier.Plugin | undefined;

    if (
      !tsPlugin || // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      tsPlugin.name === "prettier-plugin-jsdoc" ||
      tsPlugin.parsers?.hasOwnProperty("jsdoc-parser")
    ) {
      return originalParser.preprocess
        ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          originalParser.preprocess(text, options)
        : text;
    }

    const tsPluginParser = tsPlugin.parsers?.typescript || originalParser;

    pluginParse = tsPluginParser.parse || pluginParse;

    const preprocess = tsPluginParser.preprocess || originalParser.preprocess;

    Object.assign(parser, {
      ...parser,
      ...tsPluginParser,
      preprocess: jsDocPreprocess,
      parse: jsDocParse,
    });

    return preprocess ? preprocess(text, options) : text;
  };

  const parser = {
    ...originalParser,
    preprocess: jsDocPreprocess,
    parse: jsDocParse,
  };

  return parser;
}

export { languages, options, parsers, defaultOptions };
