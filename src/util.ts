import * as vscode from "vscode";
import { PERMUTATION_TABLE } from "./constant";
import {
  DecorationProcessor,
  ExtensionConfig,
  SemanticCodeToken,
} from "./type";

/**
 * Pearson hashing algorithm.
 * TODO (WJ): validate output
 * @param input
 * @returns integer in range 0 - 255
 */
export function pearsonHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    // Bitwise AND (& 255): Replaces % 256 for a slight performance boost
    // taking advantage of the fact that 256 is a power of two.
    hash = PERMUTATION_TABLE[(hash ^ input.charCodeAt(i)) & 255];
  }
  return hash;
}

/**
 *
 * @param hash
 * @param max inclusive max
 * @returns
 */
export function scaleHash(hash: number, max: number) {
  return Math.round(hash * (max / 255));
}

/* Randomize array in-place using Durstenfeld shuffle algorithm
 * https://stackoverflow.com/a/12646864
 */
function shuffleArray(array: Uint8Array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function splitString(input: string) {
  // Normalize the string: replace underscores, double underscores, hyphens, and em dashes with spaces
  // let normalized = input.replace(/[_-]+/g, " ");

  const regexPattern = [
    "(_+)", // Matches one or more underscores as a single group
    "(-+)", // Matches hyphens
    "(—+)", // Matches em dashes
    "(?<=[a-z])(?=[A-Z])", // Lowercase to uppercase transition for camelCase
    "(?<=[A-Z])(?=[A-Z][a-z])", // Uppercase sequence followed by a lowercase letter
    "(?<=[A-Za-z])(?=\\d)", // Letter to digit transition
    "(?<=\\d)(?=[A-Za-z])", // Digit to letter transition
  ].join("|"); // Join parts with OR operator

  const regex = new RegExp(regexPattern, "g");

  let splitTokens = input.split(regex);

  // Filter out any empty strings that might result from consecutive delimiters or leading/trailing spaces
  splitTokens = splitTokens.filter(Boolean);

  return splitTokens;
}

/**
 * https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940
 */
export function debounce<F extends (...args: Parameters<F>) => ReturnType<F>>(
  func: F,
  ms: number,
): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), ms);
  };
}

export async function readJsonFileInAssets<T = any>( // TODO (WJ): remove
  filePath: string,
): Promise<T | null> {
  try {
    const extension = vscode.extensions.getExtension(
      "tingcode.com.color-variable-alpha",
    );
    if (!extension) {
      console.log("Error: Could not find extension path");
      vscode.window.showErrorMessage("Error: Could not find extension path");
      return null;
    }
    const extensionUri = extension.extensionUri;
    const fullUri = vscode.Uri.joinPath(extensionUri, "assets", filePath);
    const uint8Array = await vscode.workspace.fs.readFile(fullUri);
    const fileContent = new TextDecoder("utf-8").decode(uint8Array);
    return JSON.parse(fileContent) as T;
  } catch (error) {
    const errorMessage =
      error instanceof SyntaxError
        ? "Failed to parse JSON file. Please check the file format."
        : "Failed to read JSON file.";
    console.error(errorMessage, error);
    vscode.window.showErrorMessage(errorMessage);
    return null;
  }
}

export function getPointerArray(length: number) {
  if (length <= 4) {
    return [0, 5, 10, 15];
  } else if (length <= 8) {
    return [0, 2, 4, 6, 9, 11, 13, 15];
  } else if (length <= 16) {
    return [0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15];
  }
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
}

export function hexToRgb(
  hex: string,
): { r: number; g: number; b: number } | null {
  // Remove the hash at the start if it's there
  hex = hex.replace(/^#/, "");

  // Parse the hex string
  let bigint = parseInt(hex, 16);

  // If the hex value isn't valid, return null
  if (isNaN(bigint)) {
    return null;
  }

  // Extract the red, green, and blue values
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;

  return { r, g, b };
}

export function rgbToHex(r: number, g: number, b: number): string {
  // A helper function to convert a single color component to a hex string.
  const toHex = (colorValue: number): string => {
    // Clamp the value between 0 and 255.
    const clampedValue = Math.max(0, Math.min(255, colorValue));
    // Convert the number to a hex string and pad with leading zero if necessary.
    return clampedValue.toString(16).padStart(2, "0");
  };

  // Convert each component and concatenate them with a leading '#'.
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function colorAlphaMixing(
  color1: string,
  color2: string,
  alpha: number,
): string | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    return null;
  }

  const r = Math.round(rgb1.r * alpha + rgb2.r * (1 - alpha));
  const g = Math.round(rgb1.g * alpha + rgb2.g * (1 - alpha));
  const b = Math.round(rgb1.b * alpha + rgb2.b * (1 - alpha));

  return rgbToHex(r, g, b);
}

/**
 * A temporary implementation for previewing the decoration.
 * @param extensionConfig
 * @returns
 */
export function buildPreviewDebouncedDecorateVariablesFunction(
  extensionConfig: Partial<ExtensionConfig>,
) {
  const delay = extensionConfig.renderDelay ?? 500;

  return debounce(
    async (
      editor: vscode.TextEditor | undefined,
      decorationProcessor: DecorationProcessor,
    ) => {
      if (editor === undefined) {
        return;
      }
      const uri = editor.document.uri;
      const [legend, semanticTokens] = await Promise.all([
        vscode.commands.executeCommand<vscode.SemanticTokensLegend | undefined>(
          "vscode.provideDocumentSemanticTokensLegend",
          uri,
        ),
        vscode.commands.executeCommand<vscode.SemanticTokens | undefined>(
          "vscode.provideDocumentSemanticTokens",
          uri,
        ),
      ]);

      if (legend === undefined || semanticTokens === undefined) {
        return;
      }
      const result = decodeSemanticTokensData(
        legend,
        semanticTokens.data,
        editor.document,
      );

      // filter out the tokens that are not variables
      const variableTokens = result.filter(
        (token) =>
          ["variable", "parameter", "property"].includes(token.tokenType), // TODO (WJ): make into configuration
      );

      const [resultDecorationTypes, resultDecorationRange2dArray] =
        decorationProcessor(variableTokens);
      for (let i = 0; i < resultDecorationTypes.length; i++) {
        editor.setDecorations(
          resultDecorationTypes[i],
          resultDecorationRange2dArray[i],
        );
      }
    },
    delay,
  );
}

export function buildDebouncedDecorateVariablesFunction(
  decorationProcessor: DecorationProcessor,
  extensionConfig: Partial<ExtensionConfig>,
) {
  const delay = extensionConfig.renderDelay ?? 500;

  return debounce(async (editor: vscode.TextEditor | undefined) => {
    if (editor === undefined) {
      return;
    }

    console.time("Retrieve raw tokens"); // TODO (WJ): remove
    const uri = editor.document.uri;

    const [legend, semanticTokens] = await Promise.all([
      vscode.commands.executeCommand<vscode.SemanticTokensLegend | undefined>(
        "vscode.provideDocumentSemanticTokensLegend",
        uri,
      ),
      vscode.commands.executeCommand<vscode.SemanticTokens | undefined>(
        "vscode.provideDocumentSemanticTokens",
        uri,
      ),
    ]);
    console.timeEnd("Retrieve raw tokens");
    if (legend === undefined || semanticTokens === undefined) {
      return;
    }
    console.time("Preprocess tokens");
    const result = decodeSemanticTokensData(
      legend,
      semanticTokens.data,
      editor.document,
    );

    // filter out the tokens that are not variables
    const variableTokens = result.filter(
      (token) =>
        ["variable", "parameter", "property"].includes(token.tokenType), // TODO (WJ): make into configuration
    );
    console.timeEnd("Preprocess tokens");

    console.time("decorate");
    const [resultDecorationTypes, resultDecorationRange2dArray] =
      decorationProcessor(variableTokens);
    for (let i = 0; i < resultDecorationTypes.length; i++) {
      editor.setDecorations(
        resultDecorationTypes[i],
        resultDecorationRange2dArray[i],
      );
    }
    console.timeEnd("decorate");
  }, delay);
}

function decodeSemanticTokensData(
  legend: vscode.SemanticTokensLegend,
  data: Uint32Array,
  document: vscode.TextDocument,
): SemanticCodeToken[] {
  const documentText = document.getText();
  const tokens: SemanticCodeToken[] = [];
  let lineCounter = 0;
  let characterPositionCounter = 0;
  for (let i = 0; i < data.length; i += 5) {
    const deltaLine = data[i];
    const deltaStart = data[i + 1];
    const length = data[i + 2];
    const tokenTypeIndex = data[i + 3];
    const encodedTokenModifiers = data[i + 4];

    // Calculate the line and start character for the current token
    if (deltaLine === 0) {
      // If on the same line, adjust the start character
      characterPositionCounter += deltaStart;
    } else {
      // Move to the new line and set the start character
      lineCounter += deltaLine;
      characterPositionCounter = deltaStart;
    }

    const tokenType = legend.tokenTypes[tokenTypeIndex];
    const tokenModifiers = decodeTokenModifiers(encodedTokenModifiers, legend);
    const range = new vscode.Range(
      lineCounter,
      characterPositionCounter,
      lineCounter,
      characterPositionCounter + length,
    );
    tokens.push({
      line: lineCounter,
      start: characterPositionCounter,
      length,
      tokenType,
      tokenModifiers,
      text: documentText.substring(
        document.offsetAt(range.start),
        document.offsetAt(range.end),
      ),
    });
  }
  return tokens;
}

function decodeTokenModifiers(
  encodedTokenModifiers: number,
  legend: vscode.SemanticTokensLegend,
) {
  const modifiers = [];

  for (let i = 0; i < legend.tokenModifiers.length; i++) {
    const mask = 1 << i; // Calculate the bitmask for the current modifier
    if ((encodedTokenModifiers & mask) === mask) {
      // If the bitmask is set in tokenModifiers, add the modifier to the list
      modifiers.push(legend.tokenModifiers[i]);
    }
  }

  return modifiers;
}
