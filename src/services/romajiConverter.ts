import * as wanakana from 'wanakana';

// Comprehensive dictionary of frequent Japanese lyric kanji and compounds to hiragana
const KANJI_READINGS: Record<string, string> = {
  // Common pronouns and people
  '私達': 'わたしたち', '私たち': 'わたしたち', '私': 'わたし',
  '僕達': 'ぼくたち', '僕ら': 'ぼくら', '僕': 'ぼく',
  '君達': 'きみたち', '君ら': 'きみら', '君': 'きみ',
  '貴方': 'あなた', '彼ら': 'かれら', '彼女': 'かのじょ', '彼': 'かれ',
  '誰か': 'だれか', '誰も': 'だれも', '誰': 'だれ',
  '皆': 'みんな', '一人': 'ひとり', '二人': 'ふたり',

  // Emotion & Heart
  '愛してる': 'あいしてる', '愛して': 'あいして', '愛': 'あい',
  '心': 'こころ', '気持ち': 'きもち', '思い': 'おもい', '想い': 'おもい',
  '優しさ': 'やさしさ', '優しい': 'やさしい', '寂しい': 'さびしい',
  '切ない': 'せつない', '孤独': 'こどく', '笑顔': 'えがお', '涙': 'なみだ',
  '痛み': 'いたみ', '苦しみ': 'くるしみ', '喜び': 'よろこび', '幸せ': 'しあわせ',
  '恋心': 'こいごころ', '初恋': 'はつこい', '恋': 'こい',

  // Time & Life
  '永遠': 'えいえん', '瞬間': 'しゅんかん', '未来': 'みらい', '過去': 'かこ',
  '時間': 'じかん', '時代': 'じだい', '運命': 'うんめい', '奇跡': 'きせき',
  '約束': 'やくそく', '記憶': 'きおく', '思い出': 'おもいで', '秘密': 'ひみつ',
  '生命': 'せいめい', '命': 'いのち', '人生': 'じんせい', '世界': 'せかい',
  '今日': 'きょう', '明日': 'あした', '昨日': 'きのう', '今夜': 'こんや',
  '毎日': 'まいにち', '季節': 'きせつ', '今': 'いま', '時': 'とき',

  // Nature, Sky & Universe
  '太陽': 'たいよう', '月': 'つき', '星空': 'ほしぞら', '星': 'ほし',
  '夜空': 'よぞら', '夜': 'よる', '朝': 'あさ', '夕焼け': 'ゆうやけ',
  '青空': 'あおぞら', '空': 'そら', '宇宙': 'うちゅう', '雲': 'くも',
  '桜': 'さくら', '花火': 'はなび', '花': 'はな', '風': 'かぜ',
  '雨': 'あめ', '虹': 'にじ', '海': 'うみ', '波': 'なみ',
  '光': 'ひかり', '影': 'かげ', '闇': 'やみ',

  // Actions & Words
  '言葉': 'ことば', '歌声': 'うたごえ', '歌': 'うた', '声': 'こえ',
  '旅立ち': 'たびだち', '旅': 'たび', '道': 'みち', '歩き': 'あるき',
  '走り': 'はしり', '夢': 'ゆめ', '希望': 'きぼう', '現実': 'げんじつ',
  '本当': 'ほんとう', '真実': 'しんじつ', '嘘': 'うそ',
  '完璧': 'かんぺき', '究極': 'きゅうきょく', '無敵': 'むてき',

  // Common Verbs / Adjectives
  '忘れない': 'わすれない', '忘れて': 'わすれて', '忘れ': 'わすれ',
  '信じて': 'しんじて', '信じ': 'しんじ', '願う': 'ねがう', '願い': 'ねがい',
  '祈り': 'いのり', '届け': 'とどけ', '抱きしめて': 'だきしめて',
  '手をつないで': 'てをつないで', '奪われて': 'うばわれて', '奪う': 'うばう',
  '見つめて': 'みつめて', '見つめ': 'みつめ', '見上げて': 'みあげて',
  '手': 'て', '目': 'め', '足': 'あし',
};

// Regex to check if text contains Japanese characters (Hiragana, Katakana, Kanji)
export const HAS_JAPANESE_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/;

/**
 * Checks if a string contains Japanese characters
 */
export function isJapanese(text: string): boolean {
  return HAS_JAPANESE_REGEX.test(text);
}

/**
 * Converts Japanese text (Kanji + Kana) into clean Latin QWERTY Romaji
 */
export function convertToRomaji(text: string): string {
  if (!text || !isJapanese(text)) return text;

  let processed = text;

  // 1. Replace Japanese punctuation with standard Latin equivalents
  processed = processed
    .replace(/[「」『』]/g, '"')
    .replace(/[、，]/g, ', ')
    .replace(/[。]/g, '. ')
    .replace(/[・]/g, ' ')
    .replace(/[〜～]/g, '~')
    .replace(/[！]/g, '!')
    .replace(/[？]/g, '?');

  // 2. Replace known Kanji compounds with Kana
  // Sort keys by descending length so multi-character compounds match first
  const sortedKanji = Object.keys(KANJI_READINGS).sort((a, b) => b.length - a.length);
  for (const kanji of sortedKanji) {
    if (processed.includes(kanji)) {
      processed = processed.replaceAll(kanji, KANJI_READINGS[kanji]);
    }
  }

  // 3. Convert all Hiragana and Katakana to Romaji
  let romaji = wanakana.toRomaji(processed);

  // 4. Clean up punctuation (strip (), :, ;, ?, !, ., etc. keeping only , and -) and convert to lowercase
  romaji = romaji
    .replace(/[()[\]{}:;?!"`~*^%$#@/\\|+=.]/g, '')
    .replace(/[\u2018\u2019\u201A\u201B\u201C\u201D\u201E\u201F']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  return romaji;
}
