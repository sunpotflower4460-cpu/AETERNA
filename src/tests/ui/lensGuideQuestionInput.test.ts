/**
 * lensGuideQuestionInput.test.ts
 * v1.9: Lens-aware AI Guide
 *
 * Tests for renderLensGuideQuestionInputHTML.
 */

import { describe, it, expect } from 'vitest';
import { renderLensGuideQuestionInputHTML } from '../../ui/guide/LensGuideQuestionInput.tsx';

describe('renderLensGuideQuestionInputHTML', () => {
  it('renders shortcut buttons', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain('これなに？');
    expect(html).toContain('どう仮説できる？');
    expect(html).toContain('次どこを見る？');
    expect(html).toContain('これは証明になる？');
  });

  it('shows placeholder in input', () => {
    const html = renderLensGuideQuestionInputHTML({
      currentMode: 'explain',
      placeholder: 'Type your question here',
    });
    expect(html).toContain('Type your question here');
  });

  it('shows default placeholder when none provided', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain('Ask about the current observation');
  });

  it('shortcut buttons dispatch guide:ask events', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain("CustomEvent('guide:ask'");
  });

  it('shortcut button for これなに dispatches explain mode', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain("mode:'explain'");
  });

  it('shortcut button for どう仮説できる dispatches hypothesis mode', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain("mode:'hypothesis'");
  });

  it('shortcut button for 次どこを見る dispatches nextObservation mode', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain("mode:'nextObservation'");
  });

  it('renders submit button', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain('Ask</button>');
  });

  it('data-current-mode attribute is set', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'hypothesis' });
    expect(html).toContain('data-current-mode="hypothesis"');
  });

  it('renders text input element', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain('<input');
    expect(html).toContain('type="text"');
  });

  it('active shortcut class applied to matching mode', () => {
    const html = renderLensGuideQuestionInputHTML({ currentMode: 'explain' });
    expect(html).toContain('lens-guide-question-input__shortcut--active');
  });
});
