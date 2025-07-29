import { Directive, ElementRef, input, inject, effect } from "@angular/core";
import * as katex from "katex";
import { decodeHTML } from "entities";

const delimiters = [
  { left: "$$", right: "$$", display: false },
  { left: "\\(", right: "\\)", display: false },
  { left: "\\[", right: "\\]", display: false },
];

interface KatexOptions {
  displayMode?: boolean;
  throwOnError?: boolean;
  errorColor?: string;
  macros?: Record<string, string>;
  strict?: boolean;
  trust?: boolean;
  output?: "html" | "mathml";
  fleqn?: boolean;
  leqno?: boolean;
  colorIsTextColor?: boolean;
  maxSize?: number;
  maxExpand?: number;
}

@Directive({
  selector: "[appKatex]",
  standalone: true,
})
export class KatexDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  readonly content = input<string | null>(null, { alias: "appKatex" });
  readonly options = input<KatexOptions>({});

  constructor() {
    effect(() => {
      const content = this.content();
      if (content) {
        const decodedContent = decodeHTML(content).replace(/\u00A0/g, " ");

        const renderedLatex = this.renderWithDelimiters(
          decodedContent,
          delimiters
        );
        this.elementRef.nativeElement.innerHTML = renderedLatex;
      }
    });
  }

  escapeHtml(unsafe: string): string {
    const protectedB = unsafe
      .replace(/<b>/g, "___PROTECTED_B_OPEN___")
      .replace(/<\/b>/g, "___PROTECTED_B_CLOSE___");

    const escaped = protectedB
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

    return escaped
      .replace(/___PROTECTED_B_OPEN___/g, "<b>")
      .replace(/___PROTECTED_B_CLOSE___/g, "</b>");
  }

  private renderWithDelimiters(latexString: string, delimiters: any[]): string {
    let htmlString = "";
    let position = 0;

    while (position < latexString.length) {
      let match = null;
      let matchStart = -1;
      let matchEnd = -1;
      let isDisplay = false;

      for (let delimiter of delimiters) {
        let start = latexString.indexOf(delimiter.left, position);
        if (start !== -1 && (matchStart === -1 || start < matchStart)) {
          let end = latexString.indexOf(
            delimiter.right,
            start + delimiter.left.length
          );
          if (end !== -1) {
            match = delimiter;
            matchStart = start;
            matchEnd = end;
            isDisplay = delimiter.display;
          }
        }
      }

      if (match === null) {
        htmlString += this.escapeHtml(latexString.slice(position));
        break;
      }

      htmlString += this.escapeHtml(latexString.slice(position, matchStart));

      let latex = latexString.slice(matchStart + match.left.length, matchEnd);

      try {
        let renderedHTML = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: isDisplay,
          ...this.getKatexOptions(),
        });
        htmlString += renderedHTML;
      } catch (e) {
        console.error("KaTeX parse error:", e);
        htmlString += this.escapeHtml(match.left + latex + match.right);
      }

      position = matchEnd + match.right.length;
    }

    return htmlString;
  }

  private getKatexOptions(): KatexOptions {
    const defaultMacros = {
      "\\sen": "\\sin",
      "\\tg": "\\tan",
      "\\cotg": "\\cot",
      "\\cosec": "\\csc",
      "\\arcsen": "\\arcsin",
      "\\arctg": "\\arctan",
      "\\senh": "\\sinh",
      "\\cossh": "\\cosh",
      "\\tgh": "\\tanh",
    };

    const userOptions = this.options();
    return {
      ...userOptions,
      macros: {
        ...defaultMacros,
        ...(userOptions.macros || {}),
      },
      strict: false,
      trust: false,
      output: "html",
    };
  }
}
