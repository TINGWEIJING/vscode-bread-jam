import { QuickPickItemKind, type QuickPickItem } from "vscode";

export const EXTENSION_NAME: string = "color-variable-alpha"; // TODO (WJ): update

export const EXTENSION_ID: string = `tingcode.com.${EXTENSION_NAME}`;

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
  CLEAR_RENDERING_TEMPORARILY: `${EXTENSION_NAME}.clearRenderingTemporarily`,
  RELOAD_RENDERING: `${EXTENSION_NAME}.reloadRendering`,
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
};

export const EMOJIS: string[] = [
  // TODO (WJ): move into extension config
  "😃",
  "🥰",
  "🤢",
  "🥵",
  "🥶",
  "😎",
  "😱",
  "😡",
  "💀",
  "💩",
  "🤡",
  "👻",
  "👽",
  "🤖",
  "💖",
  "💥",
  "💫",
  "💦",
  "💨",
  "👋",
  "🙏",
  "🦷",
  "🦴",
  "👀",
  "🐵",
  "🐶",
  "🦊",
  "🐱",
  "🦁",
  "🐯",
  "🐴",
  "🦄",
  "🐮",
  "🐷",
  "🐭",
  "🐹",
  "🐰",
  "🐻",
  "🐻‍❄️",
  "🐨",
  "🐼",
  "🐔",
  "🐤",
  "🐦",
  "🐸",
  "🐳",
  "🐬",
  "🐡",
  "🐙",
  "🐚",
  "🦋",
  "💐",
  "🌸",
  "🌹",
  "🌺",
  "🌻",
  "🌼",
  "🌷",
  "🌱",
  "🌴",
  "🌵",
  "🍀",
  "🍂",
  "🍃",
  "🍄",
  "🍉",
  "🍋",
  "🍌",
  "🍎",
  "🍑",
  "🍒",
  "🥝",
  "🥥",
  "🥑",
  "🌽",
  "🌶",
  "🍞",
  "🥐",
  "🥖",
  "🥨",
  "🥯",
  "🧀",
  "🍖",
  "🍔",
  "🍟",
  "🍕",
  "🌭",
  "🥪",
  "🌮",
  "🥚",
  "🍿",
  "🍙",
  "🍚",
  "🍜",
  "🍣",
  "🍤",
  "🍥",
  "🥮",
  "🍡",
  "🍦",
  "🍩",
  "🍪",
  "🎂",
  "🍰",
  "🍫",
  "🍭",
  "🍮",
  "🍼",
  "🍺",
  "🧊",
  "🌍",
  "🧭",
  "🏖",
  "🏛",
  "🏡",
  "⛺",
  "🛟",
  "⏰",
  "🌙",
  "🌡",
  "🌟",
  "🌤",
  "🌧",
  "⛄",
  "🔥",
  "💧",
  "🌊",
  "🎃",
  "🎄",
  "✨",
  "🎈",
  "🎉",
  "🎁",
  "⚽",
  "⚾",
  "🏀",
  "🏐",
  "🏈",
  "🎾",
  "🏓",
  "🎯",
  "🎲",
  "🧩",
  "🎨",
  "🧶",
  "🛍",
  "👑",
  "🧢",
  "💍",
  "💎",
  "🎸",
  "🎹",
  "🥁",
  "📚",
  "💼",
  "📎",
  "📐",
  "🧽",
  "🗿",
];
