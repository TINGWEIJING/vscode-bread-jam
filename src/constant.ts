import { QuickPickItemKind, type QuickPickItem } from "vscode";
import type { ExtensionConfig } from "./type";

export const EXTENSION_NAME: string = "bread-jam";

export const EXTENSION_ID: string = `tingcode.com.${EXTENSION_NAME}`;

export const FAULTY_EXTENSION_CONFIG: ExtensionConfig = {
  renderDelay: 500,
  ignoreFirstSubtoken: false,
  semanticForegroundColors: { variable: "#000000" },
  defaultSemanticForegroundColor: "#FF0000",
  commonColor: "#FF0000",
  gradientColors: ["#FF0000", "#00FF00", "#0000FF"],
  solidColors: ["#FF0000", "#00FF00", "#0000FF"],
  fadeInGradientSteps: [
    0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5,
  ],
  fadeOutGradientSteps: [
    1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5, 1, 0.5, 0, 0.5,
  ],
  emojis: ["🎉", "🎊", "🎈"],
  targetedSemanticTokenTypes: ["variable"],
  permutationTable: [
    234, 9, 103, 60, 5, 79, 232, 229, 45, 51, 131, 3, 168, 29, 170, 216, 99,
    161, 111, 204, 220, 209, 78, 89, 72, 191, 157, 119, 226, 184, 244, 134, 21,
    61, 175, 15, 223, 100, 230, 28, 128, 185, 84, 208, 164, 44, 113, 105, 27,
    85, 203, 146, 153, 130, 66, 42, 250, 140, 174, 133, 115, 4, 52, 73, 65, 10,
    104, 238, 30, 211, 46, 121, 2, 190, 159, 172, 112, 156, 95, 47, 124, 177,
    77, 202, 81, 38, 123, 13, 182, 242, 64, 33, 225, 0, 241, 122, 210, 37, 106,
    163, 82, 98, 34, 218, 187, 214, 125, 132, 120, 219, 252, 32, 135, 215, 245,
    48, 198, 222, 76, 231, 213, 192, 227, 144, 19, 152, 110, 12, 217, 126, 196,
    201, 248, 148, 109, 138, 63, 249, 200, 36, 197, 101, 127, 145, 149, 54, 16,
    167, 102, 80, 239, 181, 14, 83, 224, 142, 69, 176, 118, 171, 251, 136, 43,
    246, 155, 18, 165, 68, 53, 90, 94, 41, 93, 162, 116, 212, 205, 25, 235, 193,
    74, 58, 169, 199, 17, 180, 49, 147, 92, 158, 160, 75, 141, 20, 96, 31, 137,
    117, 186, 11, 67, 233, 88, 91, 24, 97, 237, 247, 86, 195, 236, 39, 221, 87,
    240, 178, 40, 206, 194, 1, 207, 71, 150, 114, 56, 107, 243, 179, 166, 183,
    50, 143, 254, 154, 129, 59, 55, 23, 7, 8, 108, 151, 22, 139, 228, 253, 173,
    26, 188, 35, 255, 62, 70, 189, 6, 57,
  ],
} as const;

export const WORKSPACE_STATE_KEYS = {
  SELECTED_RENDER_PATTERN: "selectedRenderPattern",
  IS_EXTENSION_ON: "isExtensionOn",
};

export const VSCODE_COMMANDS = {
  PROVIDE_DOCUMENT_SEMANTIC_TOKENS_LEGEND:
    "vscode.provideDocumentSemanticTokensLegend",
  PROVIDE_DOCUMENT_SEMANTIC_TOKENS: "vscode.provideDocumentSemanticTokens",
};

export const EXTENSION_COMMANDS = {
  PROMPT_RENDER_PATTERN_SELECTION: `${EXTENSION_NAME}.promptRenderPatternSelection`,
  CLEAR_RENDERINGS_TEMPORARILY: `${EXTENSION_NAME}.clearRenderingsTemporarily`,
  RELOAD_RENDERINGS: `${EXTENSION_NAME}.reloadRenderings`,
  TURN_ON_OR_OFF: `${EXTENSION_NAME}.turnOnOrOff`,
};

export const DEFAULT_SEMANTIC_KEY = "default";

export const RENDER_PATTERN_LABEL: string[] = [
  "Subtext - Fade In Gradient - Unique Subtext",
  "Subtext - Fade In Gradient - Unique Text",
  "Subtext - Fade In Gradient - Commonly",
  "Subtext - Fade Out Gradient - Unique Subtext",
  "Subtext - Fade Out Gradient - Unique Text",
  "Subtext - Fade Out Gradient - Commonly",
  "First Character - Solid Color - Unique Subtext",
  "First Character - Solid Color - Unique Text",
  "First Character - Solid Color - Commonly",
  "Subtext - Solid Color - Unique Subtext",
  "Whole Text - Emoji",
] as const;

export const QUICK_PICK_ITEMS: QuickPickItem[] = [
  {
    label: "Fade In Gradient",
    kind: QuickPickItemKind.Separator,
  },
  {
    label: "01",
    description: RENDER_PATTERN_LABEL[0],
  },
  {
    label: "02",
    description: RENDER_PATTERN_LABEL[1],
  },
  {
    label: "03",
    description: RENDER_PATTERN_LABEL[2],
  },
  {
    label: "Fade Out Gradient",
    kind: QuickPickItemKind.Separator,
  },
  {
    label: "04",
    description: RENDER_PATTERN_LABEL[3],
  },
  {
    label: "05",
    description: RENDER_PATTERN_LABEL[4],
  },
  {
    label: "06",
    description: RENDER_PATTERN_LABEL[5],
  },
  {
    label: "First Character Solid Color",
    kind: QuickPickItemKind.Separator,
  },
  {
    label: "07",
    description: RENDER_PATTERN_LABEL[6],
  },
  {
    label: "08",
    description: RENDER_PATTERN_LABEL[7],
  },
  {
    label: "09",
    description: RENDER_PATTERN_LABEL[8],
  },
  {
    label: "Whole Subtext Solid Color",
    kind: QuickPickItemKind.Separator,
  },
  {
    label: "10",
    description: RENDER_PATTERN_LABEL[9],
  },
  {
    label: "Emoji",
    kind: QuickPickItemKind.Separator,
  },
  {
    label: "11",
    description: RENDER_PATTERN_LABEL[10],
  },
];

export const REGEX_LITERAL = {
  /**
   * Matches semantic code with optional modifiers.
   *
   * - `^`: Asserts the start of the string.
   * - `(\w+)`: Captures the main token type. `\w+` matches one or more word characters.
   * - `(?:...)`: A non-capturing group, used to optionally group the colon and the modifiers that follow.
   * - `:`: Matches the literal colon character, indicating the start of the modifiers.
   * - `(\*?\w+(?:,\s*\*?\w+)*)`: Captures the modifiers with support for optional leading wildcards. This part:
   *     - `\*?`: Optionally matches a leading asterisk (`*`), allowing the modifier to act as a wildcard.
   *     - `\w+`: Matches one or more word characters for the modifier name.
   *     - `(?:,\s*\w+)*`: A non-capturing group that matches zero or more additional modifiers, preceded by an optional comma and whitespace.
   * - `?`: Makes the entire group starting with `:` optional, indicating that the main identifier may appear without any modifiers.
   * - `$`: Asserts the end of the string.
   */
  SEMANTIC_CODE: /^(\w+)(?::(\*?\w+(?:,\s*\w+)*))?$/,

  /**
   * Matches various tokens in a string.
   *
   * - `(_+)`: Matches one or more underscores.
   * - `(-+)`: Matches one or more hyphens.
   * - `(—+)`: Matches one or more em dashes.
   * - `(\.+)`: Matches one or more periods.
   * - `(\/+)`: Matches one or more forward slashes.
   * - `(\\+)`: Matches one or more backslashes.
   * - `(:+)`: Matches one or more colons.
   * - `(?<=[a-z])(?=[A-Z])`: Matches a position where a lowercase letter is followed by an uppercase letter.
   * - `(?<=[A-Z])(?=[A-Z][a-z])`: Matches a position where an uppercase letter is followed by an uppercase letter and a lowercase letter.
   * - `(?<=[A-Za-z])(?=\d)`: Matches a position where a letter is followed by a digit.
   * - `(?<=\d)(?=[A-Za-z])`: Matches a position where a digit is followed by a letter.
   */
  SPLIT_TOKEN:
    /(_+)|(-+)|(—+)|(\.+)|(\/+)|(\\+)|(:+)|(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|(?<=[A-Za-z])(?=\d)|(?<=\d)(?=[A-Za-z])/g,
  UNWANTED_CHARACTERS: /[_\-—\.\/\\:]+/g,
  HEX_RGB: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
};
