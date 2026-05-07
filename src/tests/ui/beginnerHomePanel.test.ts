import { describe, it, expect } from 'vitest';
import { renderBeginnerHomePanelHTML } from '../../ui/onboarding/BeginnerHomePanel.js';

describe('BeginnerHomePanel: basic render', () => {
  it('renders the panel container', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('beginner-home-panel');
  });

  it('renders the title はじめに', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('はじめに');
  });
});

describe('BeginnerHomePanel: links', () => {
  it('has data-panel="glossary" link', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('data-panel="glossary"');
  });

  it('has data-panel="route" link', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('data-panel="route"');
  });
});

describe('BeginnerHomePanel: actions', () => {
  it('has data-action="safe-reset" button', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('data-action="safe-reset"');
  });
});

describe('BeginnerHomePanel: not-list section', () => {
  it('has "意識・生命・知性を証明するものではありません" disclaimer', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('意識・生命・知性を証明するものではありません');
  });

  it('has LLM disclaimer', () => {
    const html = renderBeginnerHomePanelHTML({});
    expect(html).toContain('LLM');
  });
});
