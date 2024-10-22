import type {
  SemanticTokens,
  SemanticTokensLegend,
  TextDocument,
  TextEditor,
  TextEditorDecorationType,
} from "vscode";
import { commands, Range } from "vscode";
import {
  ALL_RENDER_PATTERN_SET,
  DEFAULT_SEMANTIC_KEY,
  FAULTY_EXTENSION_CONFIG,
  REGEX_LITERAL,
  VSCODE_COMMANDS,
} from "./constant";
import type {
  DecorationProcessor,
  ExtensionConfig,
  IDecorationManager,
  SemanticCodeToken,
} from "./type";

export function validateExtensionConfig(
  extensionConfig: Partial<ExtensionConfig>,
  error: (message: string) => void,
): ExtensionConfig {
  let clonedExtensionConfig: Partial<ExtensionConfig> = JSON.parse(
    JSON.stringify(extensionConfig),
  );
  const renderDelay = clonedExtensionConfig.renderDelay;
  if (
    !Number.isInteger(renderDelay) ||
    !Boolean(renderDelay) ||
    renderDelay! < 100
  ) {
    error("`renderDelay` must be an integer greater than or equal to 100.");
    clonedExtensionConfig.renderDelay = FAULTY_EXTENSION_CONFIG.renderDelay;
  }

  const selectedRenderPattern = clonedExtensionConfig.selectedRenderPattern;
  if (!ALL_RENDER_PATTERN_SET.has(selectedRenderPattern || "")) {
    // TODO (WJ): test if this is correct
    error(
      `\`${selectedRenderPattern}\` is not a valid render pattern. Please select a valid render pattern.`,
    );
    clonedExtensionConfig.selectedRenderPattern =
      FAULTY_EXTENSION_CONFIG.selectedRenderPattern;
  }

  const semanticForegroundColors =
    clonedExtensionConfig.semanticForegroundColors;
  if (!Boolean(semanticForegroundColors)) {
    error("`semanticForegroundColors` must be defined.");
    clonedExtensionConfig.semanticForegroundColors =
      FAULTY_EXTENSION_CONFIG.semanticForegroundColors;
  } else {
    let isFaulty = false;
    for (const [semanticKey, hexColor] of Object.entries(
      semanticForegroundColors!,
    )) {
      if (!REGEX_LITERAL.HEX_RGB.test(hexColor)) {
        error(
          `\`${hexColor}\` is not a valid color code for the semantic key \`${semanticKey}\`.`,
        );
        isFaulty = true;
        break;
      }
    }
    if (isFaulty) {
      clonedExtensionConfig.semanticForegroundColors =
        FAULTY_EXTENSION_CONFIG.semanticForegroundColors;
    }
  }

  const defaultSemanticForegroundColor =
    clonedExtensionConfig.defaultSemanticForegroundColor;
  if (
    !Boolean(defaultSemanticForegroundColor) ||
    !REGEX_LITERAL.HEX_RGB.test(defaultSemanticForegroundColor!)
  ) {
    error(
      `\`${defaultSemanticForegroundColor}\` is not a valid color code for \`defaultSemanticForegroundColor\`.`,
    );
    clonedExtensionConfig.defaultSemanticForegroundColor =
      FAULTY_EXTENSION_CONFIG.defaultSemanticForegroundColor;
  }

  const commonColor = clonedExtensionConfig.commonColor;
  if (!Boolean(commonColor) || !REGEX_LITERAL.HEX_RGB.test(commonColor!)) {
    error(`\`${commonColor}\` is not a valid color code for \`commonColor\`.`);
    clonedExtensionConfig.commonColor = FAULTY_EXTENSION_CONFIG.commonColor;
  }

  const gradientColors = clonedExtensionConfig.gradientColors;
  if (!Boolean(gradientColors)) {
    error("`gradientColors` must be defined.");
    clonedExtensionConfig.gradientColors =
      FAULTY_EXTENSION_CONFIG.gradientColors;
  } else {
    let isFaulty = false;
    for (let i = 0; i < gradientColors!.length; i++) {
      const hexColor = gradientColors![i];
      if (!REGEX_LITERAL.HEX_RGB.test(hexColor)) {
        error(
          `\`${hexColor}\` is not a valid color code for \`gradientColors[${i}]\`.`,
        );
        isFaulty = true;
        break;
      }
    }
    if (isFaulty) {
      clonedExtensionConfig.gradientColors =
        FAULTY_EXTENSION_CONFIG.gradientColors;
    }
  }

  const solidColors = clonedExtensionConfig.solidColors;
  if (!Boolean(solidColors)) {
    error("`solidColors` must be defined.");
    clonedExtensionConfig.solidColors = FAULTY_EXTENSION_CONFIG.solidColors;
  } else {
    let isFaulty = false;
    for (let i = 0; i < solidColors!.length; i++) {
      const hexColor = solidColors![i];
      if (!REGEX_LITERAL.HEX_RGB.test(hexColor)) {
        error(
          `\`${hexColor}\` is not a valid color code for \`solidColors[${i}]\`.`,
        );
        isFaulty = true;
        break;
      }
    }
    if (isFaulty) {
      clonedExtensionConfig.solidColors = FAULTY_EXTENSION_CONFIG.solidColors;
    }
  }

  const fadeInGradientSteps = clonedExtensionConfig.fadeInGradientSteps;
  if (!Boolean(fadeInGradientSteps)) {
    error("`fadeInGradientSteps` must be defined.");
    clonedExtensionConfig.fadeInGradientSteps =
      FAULTY_EXTENSION_CONFIG.fadeInGradientSteps;
  } else {
    let isFaulty = false;
    for (let i = 0; i < fadeInGradientSteps!.length; i++) {
      const step = fadeInGradientSteps![i];
      if (!Number.isFinite(step) || step > 1 || step < 0) {
        error(
          `\`${step}\` is not a valid integer for \`fadeInGradientSteps[${i}]\`.`,
        );
        isFaulty = true;
        break;
      }
    }
    if (isFaulty) {
      clonedExtensionConfig.fadeInGradientSteps =
        FAULTY_EXTENSION_CONFIG.fadeInGradientSteps;
    }
  }

  const fadeOutGradientSteps = clonedExtensionConfig.fadeOutGradientSteps;
  if (!Boolean(fadeOutGradientSteps)) {
    error("`fadeOutGradientSteps` must be defined.");
    clonedExtensionConfig.fadeOutGradientSteps =
      FAULTY_EXTENSION_CONFIG.fadeOutGradientSteps;
  } else {
    let isFaulty = false;
    for (let i = 0; i < fadeOutGradientSteps!.length; i++) {
      const step = fadeOutGradientSteps![i];
      if (!Number.isFinite(step) || step > 1 || step < 0) {
        error(
          `\`${step}\` is not a valid integer for \`fadeOutGradientSteps[${i}]\`.`,
        );
        isFaulty = true;
        break;
      }
    }
    if (isFaulty) {
      clonedExtensionConfig.fadeOutGradientSteps =
        FAULTY_EXTENSION_CONFIG.fadeOutGradientSteps;
    }
  }

  const emojis = clonedExtensionConfig.emojis;
  if (!Boolean(emojis)) {
    error("`emojis` must be defined.");
    clonedExtensionConfig.emojis = FAULTY_EXTENSION_CONFIG.emojis;
  }

  const targetedSemanticTokenTypes =
    clonedExtensionConfig.targetedSemanticTokenTypes;
  if (!Boolean(targetedSemanticTokenTypes)) {
    error("`targetedSemanticTokenTypes` must be defined.");
    clonedExtensionConfig.targetedSemanticTokenTypes =
      FAULTY_EXTENSION_CONFIG.targetedSemanticTokenTypes;
  }

  const permutationTable = clonedExtensionConfig.permutationTable;
  if (!Boolean(permutationTable) || permutationTable!.length !== 256) {
    error("`permutationTable` must be defined with 256 integers.");
    clonedExtensionConfig.permutationTable =
      FAULTY_EXTENSION_CONFIG.permutationTable;
  }

  return clonedExtensionConfig as ExtensionConfig;
}

/**
 * Pearson hashing algorithm.
 *
 * @param input
 * @returns integer in range 0 - 255
 */
export function pearsonHash(input: string, permutationTable: number[]) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    // Bitwise AND (& 255): Replaces % 256 for a slight performance boost
    // taking advantage of the fact that 256 is a power of two.
    hash = permutationTable[(hash ^ input.charCodeAt(i)) & 255];
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

export function splitString(input: string) {
  let splitTokens = input.split(REGEX_LITERAL.SPLIT_TOKEN);

  // Filter out any empty strings that might result from consecutive delimiters or leading/trailing spaces
  splitTokens = splitTokens.filter(Boolean);

  return splitTokens;
}

export function parseSemanticCode(
  semanticCode: string,
): [string | null, string[]] {
  const match = semanticCode.match(REGEX_LITERAL.SEMANTIC_CODE);
  if (match !== null) {
    const tokenType = match[1];
    const modifiers = match[2] ? match[2].split(/,\s*/) : [];
    return [tokenType, modifiers];
  }
  return [null, []];
}

export function buildSemanticKey(
  tokenType: string,
  modifiers: string[],
): string {
  if (modifiers.length === 0) {
    return tokenType;
  }
  return `${tokenType}:${modifiers.sort().join(",")}`;
}

/**
 *
 * Given the mapping definition, Key -> Value
 * - "variable:*readonly" -> #3FC1FF
 * - "variable" -> #4FC1FF
 * - "parameter" -> #2FC1FF
 * - "parameter:declaration,readonly,local" -> #1FC1FF
 *
 * Expected results:
 * 1. "variable:declaration,readonly" -> #3FC1FF
 * 2. "parameter:declaration" -> #2FC1FF
 * 3. "variable:readonly" -> #3FC1FF
 * 4. "variable" -> #4FC1FF
 * 5. "parameter:declaration,readonly,local" -> #1FC1FF
 */
export function buildPossibleSemanticKeys(
  tokenType: string,
  modifiers: string[],
): string[] {
  const keys = [];
  if (modifiers.length === 0) {
    keys.push(tokenType);
    return keys;
  }
  keys.push(`${tokenType}:${modifiers.sort().join(",")}`);
  for (const modifier of modifiers) {
    keys.push(`${tokenType}:*${modifier}`);
  }
  keys.push(tokenType);
  return keys;
}

export function initializeEmptyRange3dArray(
  rows: number,
  cols: number,
): Range[][][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => []),
  );
}

export function setRange3dArray(
  semanticToRange3dArray: Map<string, Range[][][]>,
  key: string,
  hashValue: number,
  gradientLevel: number,
  range: Range,
  rows: number,
  cols: number,
) {
  const range3dArray = semanticToRange3dArray.get(key);
  if (range3dArray === undefined) {
    const newRange3dArray = initializeEmptyRange3dArray(rows, cols);
    newRange3dArray[hashValue][gradientLevel].push(range);
    semanticToRange3dArray.set(key, newRange3dArray);
  } else {
    range3dArray[hashValue][gradientLevel].push(range);
  }
}

export function setRange2dArray(
  semanticToRange2dArray: Map<string, Range[][]>,
  key: string,
  gradientLevel: number,
  range: Range,
  cols: number,
) {
  const range2dArray = semanticToRange2dArray.get(key);
  if (range2dArray === undefined) {
    const newRange2dArray = Array.from<Range, Range[]>(
      { length: cols },
      () => [],
    );
    newRange2dArray[gradientLevel].push(range);
    semanticToRange2dArray.set(key, newRange2dArray);
  } else {
    range2dArray[gradientLevel].push(range);
  }
}

export function buildSetDecorationsFunctionParamsFrom3DArray(
  semanticToDecorationType2dArray: Map<string, TextEditorDecorationType[][]>,
  semanticToRange3dArray: Map<string, Range[][][]>,
  rows: number,
  cols: number,
): [TextEditorDecorationType[], Range[][]] {
  const returnDecorationTypes: TextEditorDecorationType[] = [];
  const returnRange2dArray: Range[][] = [];
  const emptyRange2dArray: Range[][] = Array.from(
    { length: rows * cols },
    () => [],
  );
  for (const [key, decorationType2dArray] of semanticToDecorationType2dArray) {
    returnDecorationTypes.push(...decorationType2dArray.flat());
    const range3dArray = semanticToRange3dArray.get(key);
    if (range3dArray !== undefined) {
      returnRange2dArray.push(...range3dArray.flat());
    } else {
      returnRange2dArray.push(...emptyRange2dArray);
    }
  }
  return [returnDecorationTypes, returnRange2dArray];
}

export function buildSetDecorationsFunctionParamsFrom2DArray(
  semanticToDecorationTypes: Map<string, TextEditorDecorationType[]>,
  semanticToRange2dArray: Map<string, Range[][]>,
  cols: number,
): [TextEditorDecorationType[], Range[][]] {
  const returnDecorationTypes: TextEditorDecorationType[] = [];
  const returnRange2dArray: Range[][] = [];
  const emptyRange2dArray: Range[][] = Array.from({ length: cols }, () => []);
  for (const [key, decorationTypes] of semanticToDecorationTypes) {
    returnDecorationTypes.push(...decorationTypes.flat());
    const range2dArray = semanticToRange2dArray.get(key);
    if (range2dArray !== undefined) {
      returnRange2dArray.push(...range2dArray);
    } else {
      returnRange2dArray.push(...emptyRange2dArray);
    }
  }
  return [returnDecorationTypes, returnRange2dArray];
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

export function getPointerArray(length: number) {
  if (length <= 2) {
    return [4, 6];
  } else if (length <= 4) {
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
  decorationManager: IDecorationManager,
  extensionConfig: Partial<ExtensionConfig>,
) {
  const delay = extensionConfig.renderDelay ?? 500;

  return debounce(
    async (
      editor: TextEditor | undefined,
      decorationProcessor: DecorationProcessor,
    ) => {
      if (editor === undefined) {
        return;
      }
      const uri = editor.document.uri;
      const [legend, semanticTokens] = await Promise.all([
        commands.executeCommand<SemanticTokensLegend | undefined>(
          VSCODE_COMMANDS.PROVIDE_DOCUMENT_SEMANTIC_TOKENS_LEGEND,
          uri,
        ),
        commands.executeCommand<SemanticTokens | undefined>(
          VSCODE_COMMANDS.PROVIDE_DOCUMENT_SEMANTIC_TOKENS,
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

      // filter out the tokens that are not within the targeted semantic token types & modifiers
      const targetedSemanticTokenTypes =
        extensionConfig.targetedSemanticTokenTypes ?? [];
      const variableTokens = result.filter((token) =>
        targetedSemanticTokenTypes.includes(token.tokenType),
      );

      const [resultDecorationTypes, resultDecorationRange2dArray] =
        decorationProcessor(variableTokens, decorationManager);
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
  decorationManager: IDecorationManager,
  extensionConfig: Partial<ExtensionConfig>,
) {
  const delay = extensionConfig.renderDelay ?? 500;

  return debounce(async (editor: TextEditor | undefined) => {
    if (editor === undefined) {
      return;
    }
    const uri = editor.document.uri;

    const [legend, semanticTokens] = await Promise.all([
      commands.executeCommand<SemanticTokensLegend | undefined>(
        VSCODE_COMMANDS.PROVIDE_DOCUMENT_SEMANTIC_TOKENS_LEGEND,
        uri,
      ),
      commands.executeCommand<SemanticTokens | undefined>(
        VSCODE_COMMANDS.PROVIDE_DOCUMENT_SEMANTIC_TOKENS,
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

    // filter out the tokens that are not within the targeted semantic token types
    const targetedSemanticTokenTypes =
      extensionConfig.targetedSemanticTokenTypes ?? [];
    const variableTokens = result.filter((token) =>
      targetedSemanticTokenTypes.includes(token.tokenType),
    );

    const [resultDecorationTypes, resultDecorationRange2dArray] =
      decorationProcessor(variableTokens, decorationManager);
    for (let i = 0; i < resultDecorationTypes.length; i++) {
      editor.setDecorations(
        resultDecorationTypes[i],
        resultDecorationRange2dArray[i],
      );
    }
  }, delay);
}

export function getDecorationTypeByKey<T>(
  tokenType: string,
  modifiers: string[],
  decorationMap: Map<string, T>,
  defaultDecoration: T,
): [string, T] {
  const keys = buildPossibleSemanticKeys(tokenType, modifiers);
  for (const key of keys) {
    const decorationType = decorationMap.get(key);
    if (decorationType !== undefined) {
      return [key, decorationType];
    }
  }
  // Directly assign the default one despite can be accessed by DEFAULT_SEMANTIC_KEY key
  // (premature optimization)
  return [DEFAULT_SEMANTIC_KEY, defaultDecoration];
}

function decodeSemanticTokensData(
  legend: SemanticTokensLegend,
  data: Uint32Array,
  document: TextDocument,
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
    const range = new Range(
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
  legend: SemanticTokensLegend,
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
