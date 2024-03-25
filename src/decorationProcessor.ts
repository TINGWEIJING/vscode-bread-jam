import * as vscode from "vscode";
import { SemanticCodeToken } from "./type";
import { pearsonHash, scaleHash, splitString } from "./util";
import DecorationManager from "./decorationManager";

export function decorateWithEmojiPrefixByHash(
  codeTokens: SemanticCodeToken[],
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const decorationManager = DecorationManager.getInstance();
  const decorationTypes = decorationManager.emojiDecorationTypes;

  const decorationRangesList: vscode.Range[][] = Array.from(
    { length: decorationTypes.length },
    () => [],
  );
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;

    // Process prefix emoji decoration
    const pearsonHashValue = pearsonHash(text);
    const scaledHashValue = scaleHash(
      pearsonHashValue,
      decorationTypes.length - 1,
    );
    const textRange = new vscode.Range(
      token.line,
      token.start,
      token.line,
      token.start + 1,
    );
    decorationRangesList[scaledHashValue].push(textRange);
  }

  return [decorationTypes, decorationRangesList];
}

export function decorateWithSingleSolidColorByFirstCharacterOfSubstring(
  codeTokens: SemanticCodeToken[],
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const decorationManager = DecorationManager.getInstance();
  const solidColorDecorationType =
    decorationManager.solidColorDecorationTypes[0];

  const decorationRanges: vscode.Range[] = [];
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // Process subText decoration
    const subTextArr = splitString(text);
    for (let j = 0; j < subTextArr.length; j++) {
      const subText = subTextArr[j];
      const subTextLength = subText.length;
      if (subText.charAt(0) === "_") {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + 1,
      );
      subTextStartCounter = subTextStartCounter + subTextLength;
      if (j > 0) {
        decorationRanges.push(range);
      }
    }
  }

  return [[solidColorDecorationType], [decorationRanges]];
}

export function decorateWithMultiSolidColorsByFirstCharacterOfSubstring(
  codeTokens: SemanticCodeToken[],
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const decorationManager = DecorationManager.getInstance();
  const solidColorDecorationTypes = decorationManager.solidColorDecorationTypes;

  const decorationRangesList: vscode.Range[][] = Array.from(
    { length: solidColorDecorationTypes.length },
    () => [],
  );
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // Process subText decoration
    const subTextArr = splitString(text);
    for (let j = 0; j < subTextArr.length; j++) {
      const subText = subTextArr[j];
      const subTextLength = subText.length;
      if (subText.charAt(0) === "_") {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText);
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        solidColorDecorationTypes.length - 1,
      );
      const range = new vscode.Range(
        token.line,
        subTextStartCounter,
        token.line,
        subTextStartCounter + 1,
      );
      if (j > 0) {
        decorationRangesList[scaledHashValue].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  return [solidColorDecorationTypes, decorationRangesList];
}

export function decorateWithMultiGradientColorsByWholeText(
  codeTokens: SemanticCodeToken[],
): [vscode.TextEditorDecorationType[], vscode.Range[][]] {
  const decorationManager = DecorationManager.getInstance();
  const gradientColorDecorationTypesList =
    decorationManager.gradientColorDecorationTypesList;

  const decorationRanges3dList: vscode.Range[][][] = Array.from(
    gradientColorDecorationTypesList,
    (subArray) => Array.from(subArray, () => []),
  );
  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    const text = token.text;
    let subTextStartCounter = token.start;

    // Process subText decoration
    const subTextArr = splitString(text);
    for (let indexTwo = 0; indexTwo < subTextArr.length; indexTwo++) {
      const subText = subTextArr[indexTwo];
      const subTextLength = subText.length;
      if (indexTwo === 0 || subText.charAt(0) === "_") {
        // TODO (WJ): update to using regex & cover "-"
        subTextStartCounter = subTextStartCounter + subTextLength;
        continue;
      }

      const pearsonHashValue = pearsonHash(subText);
      const scaledHashValue = scaleHash(
        pearsonHashValue,
        gradientColorDecorationTypesList.length - 1,
      );
      const selectedGradientColorDecorationTypes =
        gradientColorDecorationTypesList[scaledHashValue];
      for (
        let indexThree = 0;
        indexThree < selectedGradientColorDecorationTypes.length;
        indexThree++
      ) {
        if (indexThree >= subTextLength) {
          break;
        }
        const range = new vscode.Range(
          token.line,
          subTextStartCounter + indexThree,
          token.line,
          subTextStartCounter + indexThree + 1,
        );
        decorationRanges3dList[scaledHashValue][indexThree].push(range);
      }
      subTextStartCounter = subTextStartCounter + subTextLength;
    }
  }

  const flatGradientColorDecorationTypesList =
    gradientColorDecorationTypesList.flat();
  const flatdecorationRanges3dList = decorationRanges3dList.flat();
  return [flatGradientColorDecorationTypesList, flatdecorationRanges3dList];
}
