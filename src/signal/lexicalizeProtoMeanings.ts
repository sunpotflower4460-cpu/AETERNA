import type { ProtoMeaning, LexicalCandidate } from './types.js';

const LEXICON: Record<string, string[]> = {
  '消耗の気配': ['疲れてる感じ', '擦り減ってる感じ', 'しんどそう', '余裕がなさそう'],
  '守りたい引力': ['気になる', 'ほっとけない', '大丈夫かなと思う', 'そばにいたい感じ'],
  'まだ押せない': ['急がなくていい', '無理に決めなくていい', 'まだ焦らなくていい'],
  'でも答えたい': ['少し話せることがある', '何か伝えたい', '一緒に考えたい'],
  '開いたままでいたい': ['答えを決めなくていい', 'このまま続けてもいい', 'もう少し見ていたい'],
  '助けたい': ['何かできることがあれば', '力になりたい', '一緒に考えてもいい'],
  '何かを感じている': ['なんか感じてる', '言葉にしにくいけど', 'そういう感じがする'],
};

export function lexicalizeProtoMeanings(protoMeanings: ProtoMeaning[]): LexicalCandidate[] {
  return protoMeanings.map(pm => {
    const candidates = LEXICON[pm.glossJa] ?? [`（${pm.glossJa}）`];
    return {
      protoMeaningId: pm.id,
      candidates,
    };
  });
}
