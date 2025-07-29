import { Directive, ElementRef, input, inject, effect } from "@angular/core";
import * as katex from "katex";
import { decodeHTML } from "entities";

const delimiters = [
  { left: "$$", right: "$$", display: false },
  { left: "$", right: "$", display: false },
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
      let bestMatch: { delimiter: any; start: number; end: number } | null = null;

      for (const delimiter of delimiters) {
        let searchPos = position;
        
        while (true) {
            const start = latexString.indexOf(delimiter.left, searchPos);
            if (start === -1) break; 

            const end = latexString.indexOf(delimiter.right, start + delimiter.left.length);
            if (end === -1) {
                searchPos = start + 1;
                continue;
            }

            if (delimiter.left === "$") {
              const charBefore = start > 0 ? latexString[start - 1] : null;
              const charAfter = end + 1 < latexString.length ? latexString[end + 1] : null;

              if (charBefore && charBefore.toUpperCase() === 'R') {
                  searchPos = start + 1; 
                  continue;
              }

              const content = latexString.slice(start + 1, end);
              if (!isNaN(parseFloat(content)) && isFinite(Number(content))) {
                 if (charAfter === null || !/\w/.test(charAfter)) {
                    searchPos = start + 1; 
                    continue;
                 }
              }
            }

            if (bestMatch === null || start < bestMatch.start) {
              bestMatch = { delimiter, start, end };
            }
            break; 
        }
      }


      if (bestMatch === null) {
        htmlString += this.escapeHtml(latexString.slice(position));
        break;
      }

      htmlString += this.escapeHtml(latexString.slice(position, bestMatch.start));

      const latex = latexString.slice(bestMatch.start + bestMatch.delimiter.left.length, bestMatch.end);

      try {
        const renderedHTML = katex.renderToString(latex, {
          throwOnError: false,
          displayMode: bestMatch.delimiter.display,
          ...this.getKatexOptions(),
        });
        htmlString += renderedHTML;
      } catch (e) {
        console.error("KaTeX parse error:", e);
        htmlString += this.escapeHtml(bestMatch.delimiter.left + latex + bestMatch.delimiter.right);
      }

      position = bestMatch.end + bestMatch.delimiter.right.length;
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
