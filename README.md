<!-- omit from toc -->
# Bread Jam

This extension provides various render patterns for code components, particularly for variable names, making it easier to differentiate code and enhance readability.

<p align="center" width="100%">
    <img width="100%" src="https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/main-demo.gif?raw=true" alt="Demo">
</p>

> [!NOTE]
> Having too much color rendered in your editor may cause eye strain. Please use the <kbd>Alt</kbd> + <kbd>B</kbd>, <kbd>Alt</kbd> + <kbd>J</kbd> (Windows & Linux) or <kbd>⌥</kbd> + <kbd>B</kbd>, <kbd>⌥</kbd> + <kbd>J</kbd> (MacOS) keyboard shortcuts to toggle the extension's effects on and off. You may also adjust the number of colors to use in the [extension settings](#extension-settings) to make it easier on your eyes.

- [Features](#features)
  - [Commands](#commands)
- [Supported Languages \& Requirements](#supported-languages--requirements)
- [Render Patterns](#render-patterns)
- [Extension Settings](#extension-settings)
  - [Basic](#basic)
  - [Experimental](#experimental)
- [FAQ](#faq)
- [License](#license)

## Features
- 11 render patterns to select:
  - 01 Subtext - Fade In Gradient - Unique Subtext
  - 02 Subtext - Fade In Gradient - Unique Text
  - 03 Subtext - Fade In Gradient - Commonly
  - 04 Subtext - Fade Out Gradient - Unique Subtext
  - 05 Subtext - Fade Out Gradient - Unique Text
  - 06 Subtext - Fade Out Gradient - Commonly
  - 07 First Character - Solid Color - Unique Subtext
  - 08 First Character - Solid Color - Unique Text
  - 09 First Character - Solid Color - Commonly
  - 10 Subtext - Solid Color - Unique Subtext
  - 11 Whole Text - Emoji
- Quick preview of render patterns.

### Commands
| Command                                 | Description                                                                                                                                        | Key Binding                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bread Jam: Select Render Pattern        | Displays a quick-pick list of render patterns. Use the Up and Down keys to navigate and preview the render patterns.                               | -                                                                                                                                                 |
| Bread Jam: Clear Renderings Temporarily | Temporarily removes all renderings in the currently active editor. Renderings will reappear when you refocus or edit the code in that editor.      | -                                                                                                                                                 |
| Bread Jam: Reload Renderings            | Reloads all renderings. Use this command if the renderings behave unexpectedly or appear buggy.                                                    | -                                                                                                                                                 |
| Bread Jam: Turn On/Off                  | Toggles the extension's effects on or off. This command allows you to quickly enable or disable the visual enhancements provided by the extension. | Windows & Linux: <kbd>Alt</kbd> + <kbd>B</kbd>, <kbd>Alt</kbd> + <kbd>J</kbd><br> MacOS: <kbd>⌥</kbd> + <kbd>B</kbd>, <kbd>⌥</kbd> + <kbd>J</kbd> |

## Supported Languages & Requirements
This extension utilizes [Semantic Tokenization](https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide) supported by [Language Server Extensions](https://code.visualstudio.com/api/language-extensions/overview) for various programming languages. Below is a table listing the required language extensions. You only need to install the language extension(s) for the languages you plan to use.

| Language   | Required Extension (Extension ID)                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| TypeScript | [ms-vscode.vscode-typescript-next](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next) |
| C++        | [ms-vscode.cpptools](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)                             |
| Dart       | [Dart-Code.dart-code](https://marketplace.visualstudio.com/items?itemName=Dart-Code.dart-code)                           |
| Java       | [redhat.java](https://marketplace.visualstudio.com/items?itemName=redhat.java)                                           |
| Python     | [ms-python.python](https://marketplace.visualstudio.com/items?itemName=ms-python.python)                                 |
| Julia      | [julialang.language-julia](https://marketplace.visualstudio.com/items?itemName=julialang.language-julia)                 |
| Lua        | [sumneko.lua](https://marketplace.visualstudio.com/items?itemName=sumneko.lua)                                           |
| R          | [REditorSupport.r](https://marketplace.visualstudio.com/items?itemName=REditorSupport.r)                                 |
| Ruby       | [Shopify.ruby-lsp](https://marketplace.visualstudio.com/items?itemName=Shopify.ruby-lsp)                                 |
| Rust       | [rust-lang.rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)                   |
| Go         | [golang.go](https://marketplace.visualstudio.com/items?itemName=golang.go)                                               |
| C#         | [ms-dotnettools.csdevkit](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit)                   |


## Render Patterns
- 01 Subtext - Fade In Gradient - Unique Subtext
- 02 Subtext - Fade In Gradient - Unique Text
- 03 Subtext - Fade In Gradient - Commonly
- 04 Subtext - Fade Out Gradient - Unique Subtext
- 05 Subtext - Fade Out Gradient - Unique Text
- 06 Subtext - Fade Out Gradient - Commonly
- 07 First Character - Solid Color - Unique Subtext
- 08 First Character - Solid Color - Unique Text
- 09 First Character - Solid Color - Commonly
- 10 Subtext - Solid Color - Unique Subtext
- 11 Whole Text - Emoji

<p align="center" width="100%">
    <img width="100%" src="https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/preview-render-patterns.gif?raw=true" alt="Preview render patterns">
</p>

## Extension Settings
This section demonstrates **a few** of the effects of available extension's settings. For detailed explanations of each setting, please refer to the settings description in the VS Code extension settings UI.

### Basic
- Ignore First Subtoken
    ![Ignore First Subtoken](https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/ignore-first-subtoken.gif?raw=true)

### Experimental
These settings are experimental and may be changed or removed in future update.

- Semantic Foreground Colors
    ![Semantic Foreground Colors](https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/semantic-foreground-colors.gif?raw=true)
- Fade In Gradient Steps
    ![Fade In Gradient Steps](https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/fade-in-gradient-steps.gif?raw=true)
- Emojis
    ![Emojis](https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/emojis.gif?raw=true)
- Targeted Semantic Token Types
    ![Targeted Semantic Token Types](https://github.com/TINGWEIJING/vscode-bread-jam/blob/main/images/targeted-semantic-token-types.gif?raw=true)

## FAQ
1. Why is it called "Bread Jam"?

    Initially, I thought about naming this extension something straightforward like "Variable Color." However, it offers more than just adding color—it also has the option to decorate with emojis. In the future, I plan to add various other render patterns. This led me to a fun metaphor:

    Think of coding in your editor/IDE as having breakfast. Just as people enjoy different types of breads—like white bread, bagels, croissants, and buns—programmers have their favorite themes, such as Dracula, Monokai Pro, One Dark Pro, Night Owl, etc. But sometimes, just bread isn't enough; it can get a bit boring. You might want to jazz it up with different jams or ingredients to enhance the flavor. Similarly, "Bread Jam" aims to spice up your coding environment. Of course, just like with actual bread, not everyone will want to add jam—that's perfectly fine too!

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.