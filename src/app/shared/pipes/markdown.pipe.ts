import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'markdown',
  standalone: true
})
export class MarkdownPipe implements PipeTransform {

  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    let html = value;

    // Bold: **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Unordered Lists: * item -> <ul><li>item</li></ul>
    // This is a simple implementation. For nested lists, a parser is needed.
    // We'll just convert lines starting with * or - into list items.
    
    // First, split by newlines to handle list items
    const lines = html.split('\n');
    let inList = false;
    let newHtml = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) {
          newHtml += '<ul class="list-disc pl-5 mb-2">';
          inList = true;
        }
        newHtml += `<li>${trimmed.substring(2)}</li>`;
      } else if (trimmed.match(/^\d+\.\s/)) {
         // Ordered list support: 1. item
         if (!inList) {
             // Note: mixing ul/ol in this simple parser might be tricky, assuming separate blocks for now
             // or just treat everything as ul for simplicity if mixed, but let's try to support ol?
             // For simplicity in this custom pipe, let's wrap ordered items in <ol> if we can detect start.
             // But switching between ul/ol is complex. Let's just use a generic list style or stick to ul for bullets.
             // Let's handle ordered lists separately.
             // If we were in a UL, close it?
             // Let's keep it simple: just replace the number with a list item.
             // Ideally we should track list type.
         }
         // Simple ordered list item replacement
         newHtml += `<div class="flex gap-2 mb-1"><span class="font-bold min-w-[1.5rem]">${trimmed.split('.')[0]}.</span><span>${trimmed.substring(trimmed.indexOf('.') + 1).trim()}</span></div>`;
      } else {
        if (inList) {
          newHtml += '</ul>';
          inList = false;
        }
        // Handle normal lines (paragraphs)
        if (trimmed.length > 0) {
            newHtml += `<p class="mb-2">${line}</p>`;
        }
      }
    });

    if (inList) {
      newHtml += '</ul>';
    }

    return this.sanitizer.bypassSecurityTrustHtml(newHtml);
  }
}
