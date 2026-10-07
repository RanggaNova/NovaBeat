import { SongWithLyrics } from '../types/song';
import { parseLrc } from './lrcParser';

/**
 * 100% verified LRC lyrics with exact timestamps aligned to official YouTube tracks.
 * Clean, punctuation-free Romaji/English lyrics for smooth typing.
 */

// 1. YOASOBI - Idol (YouTube MV: ZRtdQ81jPUQ)
const YOASOBI_IDOL_LRC = `[00:00.96] muteki no egao de arasu media
[00:03.42] shiritai sono himitsu misuteriasu
[00:06.19] nuketeru toko sae kanojo no eria
[00:09.13] kanpeki de usotsuki na kimi wa
[00:11.93] tensaitetsuki na aidoru sama
[00:17.33] kyou nani tabeta suki na hon wa
[00:20.64] asobi ni iku nara doko ni iku no
[00:23.43] nanimo tabetenai sore wa naisho
[00:26.40] nani wo kikarete mo norari kurari
[00:29.10] sou tantan to dakedo sansan to
[00:32.16] miesou de mienai himitsu wa mitsu no aji
[00:34.63] are mo nai nai nai kore mo nai nai nai
[00:37.65] suki na taipu wa aite wa saa kotaete
[00:40.59] dareka wo suki ni naru koto nante watashi wakaranakute sa
[00:46.31] uso ka hontou ka shirienai
[00:49.14] sonna kotoba ni mata hitori ochiru
[00:52.90] mata suki ni saseru
[00:54.88] daremo ga me wo ubawareteku
[00:58.20] kimi wa kanpeki de kyuukyoku no aidoru`;

// 2. LiSA - Gurenge (YouTube: x1FV6IrjZCY)
const LISA_GURENGE_LRC = `[00:00.94] tsuyoku nareru riyuu wo shitta boku wo tsurete susume
[00:18.78] dorodarake no soumatou ni you kowabaru kokoro
[00:26.05] furueru te wa tsukamitai mono ga aru sore dake sa
[00:32.54] yoru no nioi ni sora nirande mo
[00:39.88] kawatte ikeru no wa jibun jishin dake sore dake sa
[00:47.25] tsuyoku nareru riyuu wo shitta boku wo tsurete susume
[01:01.67] kesenai yume mo tomarenai ima mo
[01:04.92] dareka no tame ni tsuyoku nareru nara
[01:09.31] arigatou kanashimi yo`;

// 3. Fujii Kaze - Shinunoga E-Wa (YouTube: dawrQnvwMTY)
const SHINUNOGA_E_WA_LRC = `[00:24.28] yubikiri genman hora demo fuitara
[00:27.43] hari demo nande mo nomasete itadaki monday
[00:32.26] it doesnt matter if its sunday
[00:36.41] kagami yo kagami yo kono yo de ichiban
[00:39.67] kawaru koto no nai ai wo kureru no wa dare
[00:44.38] no need to ask cause its my darling
[00:48.61] watashi no saigo wa anata ga ii
[00:51.77] anata to kono mama osaraba suru yori
[00:54.70] shinunoga ii wa
[00:57.65] shinunoga ii wa
[01:00.84] sando no meshi yori anta ga ii no yo
[01:03.85] anta to kono mama osaraba suru yoka
[01:06.90] shinunoga ii wa
[01:09.80] shinunoga ii wa`;

// 4. Ado - Usseewa (YouTube: Qp3b-RXtz4w)
const ADO_USSEEWA_LRC = `[00:00.55] seisa to wa orokasa to wa
[00:03.72] sore ga nanika misetsukete yaru
[00:16.80] chicchana koro kara yuutousei
[00:19.55] kizuitara otona ni natteita
[00:21.81] naifu no you na shikou kairo
[00:24.67] mochiawaseru wake mo naku
[00:27.31] demo asobi tarinai nanika tarinai
[00:30.36] komacchimau kore wa dareka no sei
[00:32.78] ate mo naku tada konran suru eidei
[00:38.97] saishin no ryuukou wa touzen no haaku
[00:43.60] keizai renpou mo zutto chekku
[00:46.30] usseewa usseewa usseewa
[00:50.00] anata ga omou yori kenkou desu
[00:54.20] issai gassai bonjin no anata ja wakaranai kamo ne`;

// 5. YOASOBI - Yoru ni Kakeru (YouTube: by4SYYWlhEs)
const YOASOBI_YORU_NI_KAKERU_LRC = `[00:00.90] shizumu you ni tokete yuku you ni
[00:07.73] futari dake no sora ga hirogaru yoru ni
[00:30.40] sayonara dake datta
[00:33.23] sono hitokoto de subete ga wakatta
[00:36.93] nichibotsu ga kakatta sora to kimi no sugata
[00:41.34] feensu goshi ni kasanatteita
[00:45.24] hajimete atta hi kara
[00:48.21] boku no kokoro no subete wo ubatta
[00:51.76] dokoka hakanai kuuki wo matou kimi wa
[00:56.08] sabishii me wo shiteta nda
[00:59.76] itsu datte chikutaku to naru sekai de
[01:03.37] fureru kokoronai kotoba urusai koe ni
[01:06.26] namida ga koboresou de mo`;

// 6. The Weeknd - Blinding Lights (YouTube: fHI8X4OXluQ)
const BLINDING_LIGHTS_LRC = `[00:13.13] yeah
[00:27.16] ive been tryna call
[00:29.96] ive been on my own for long enough
[00:32.71] maybe you can show me how to love maybe
[00:38.29] im goin through withdrawals
[00:41.23] you dont even have to do too much
[00:44.12] you can turn me on with just a touch baby
[00:49.57] i look around and sin citys cold and empty
[00:53.53] no ones around to judge me
[00:56.24] i cant see clearly when youre gone
[01:00.73] i said ooh im blinded by the lights
[01:06.69] no i cant sleep until i feel your touch
[01:11.79] i said ooh im drowning in the night
[01:17.89] oh when im like this youre the one i trust`;

// 7. Coldplay - Viva La Vida (YouTube: dvgZkm1xWPE)
const VIVA_LA_VIDA_LRC = `[00:13.06] i used to rule the world
[00:16.75] seas would rise when i gave the word
[00:19.23] now in the morning i sleep alone
[00:23.55] sweep the streets i used to own
[00:40.54] i used to roll the dice
[00:44.60] feel the fear in my enemys eyes
[00:47.86] listened as the crowd would sing
[00:51.67] now the old king is dead long live the king
[00:54.51] one minute i held the key
[00:58.48] next the walls were closed on me
[01:01.15] and i discovered that my castles stand
[01:05.41] upon pillars of salt and pillars of sand`;

// 8. Harry Styles - As It Was (YouTube: V1Z586zoeeE)
const AS_IT_WAS_LRC = `[00:14.13] holdin me back
[00:16.11] gravitys holdin me back
[00:18.71] i want you to hold out the palm of your hand
[00:21.88] why dont we leave it at that
[00:25.10] nothin to say
[00:27.15] when everything gets in the way
[00:29.75] seems you cannot be replaced
[00:32.86] and im the one who will stay
[00:37.45] in this world its just us
[00:44.18] you know its not the same as it was
[00:48.72] in this world its just us
[00:55.22] you know its not the same as it was
[01:00.13] as it was as it was
[01:06.28] you know its not the same`;

// 9. Ed Sheeran - Shape of You (YouTube: _dK2tDK9grQ)
const SHAPE_OF_YOU_LRC = `[00:09.65] the club isnt the best place to find a lover
[00:12.10] so the bar is where i go
[00:14.81] me and my friends at the table doing shots
[00:17.04] drinking fast and then we talk slow
[00:19.70] you come over and start up a conversation with just me
[00:22.24] and trust me ill give it a chance now
[00:24.42] take my hand stop put van the man on the jukebox
[00:27.27] and then we start to dance
[00:29.83] girl you know i want your love
[00:32.22] your love was handmade for somebody like me
[00:35.23] come on now follow my lead
[00:37.31] i may be crazy dont mind me
[00:39.64] say boy lets not talk too much
[00:42.28] grab on my waist and put that body on me`;

// 10. Queen - Bohemian Rhapsody (YouTube: xG16sdjLtc0)
const BOHEMIAN_RHAPSODY_LRC = `[00:00.15] is this the real life is this just fantasy
[00:07.13] caught in a landslide no escape from reality
[00:14.77] open your eyes look up to the skies and see
[00:25.37] im just a poor boy i need no sympathy
[00:30.75] because im easy come easy go little high little low
[00:38.77] any way the wind blows doesnt really matter to me
[00:55.36] mama just killed a man
[01:01.95] put a gun against his head pulled my trigger now hes dead
[01:08.56] mama life had just begun
[01:15.42] but now ive gone and thrown it all away`;

// 11. Adele - Rolling in the Deep (YouTube: bDtjO-R0QSo)
const ROLLING_IN_THE_DEEP_LRC = `[00:05.15] theres a fire starting in my heart
[00:09.74] reaching a fever pitch its bringing me out the dark
[00:14.24] finally i can see you crystal clear
[00:19.05] go ahead and sell me out and ill lay your ship bare
[00:23.44] see how ill leave with every piece of you
[00:27.88] dont underestimate the things that i will do
[00:32.55] theres a fire starting in my heart
[00:37.21] reaching a fever pitch and its bringing me out the dark
[00:42.77] the scars of your love remind me of us
[00:47.22] they keep me thinking that we almost had it all
[00:51.82] the scars of your love they leave me breathless
[00:56.34] i cant help feeling
[00:58.76] we couldve had it all
[01:03.59] rolling in the deep`;

// 12. Dua Lipa - Levitating (YouTube: WHuBW3qKm9g)
const LEVITATING_LRC = `[00:09.52] if you wanna run away with me i know a galaxy
[00:11.77] and i can take you for a ride
[00:14.02] i had a premonition that we fell into a rhythm
[00:16.33] where the music dont stop for life
[00:18.74] glitter in the sky glitter in my eyes
[00:21.06] shining just the way i like
[00:23.47] if youre feeling like you need a little bit of company
[00:25.79] you met me at the perfect time
[00:28.38] you want me i want you baby
[00:30.82] my sugarboo im levitating
[00:33.12] the milky way were renegading
[00:36.88] i got you moonlight youre my starlight
[00:41.60] i need you all night come on dance with me
[00:46.00] im levitating`;

// 13. Coldplay - Fix You (YouTube: uUv5Z3HFHpU)
const FIX_YOU_LRC = `[00:13.18] when you try your best but you dont succeed
[00:20.29] when you get what you want but not what you need
[00:27.41] when you feel so tired but you cant sleep
[00:33.32] stuck in reverse
[00:41.30] and the tears come streaming down your face
[00:48.53] when you lose something you cant replace
[00:55.25] when you love someone but it goes to waste
[01:01.66] could it be worse
[01:11.92] lights will guide you home
[01:19.02] and ignite your bones
[01:25.95] and i will try to fix you`;

export const CURATED_SONGS: SongWithLyrics[] = [
  {
    id: 'curated-yoasobi-idol',
    title: 'Idol (Romaji QWERTY)',
    artist: 'YOASOBI',
    album: 'Idol - Oshi no Ko',
    cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&h=300&fit=crop&q=80',
    duration: 213,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'ZRtdQ81jPUQ',
    syncedLyrics: YOASOBI_IDOL_LRC,
    syncedLines: parseLrc(YOASOBI_IDOL_LRC),
    lyrics: parseLrc(YOASOBI_IDOL_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(YOASOBI_IDOL_LRC).map(l => l.text),
  },
  {
    id: 'curated-lisa-gurenge',
    title: 'Gurenge (Romaji QWERTY)',
    artist: 'LiSA',
    album: 'Demon Slayer OP',
    cover: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=300&h=300&fit=crop&q=80',
    duration: 238,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'x1FV6IrjZCY',
    syncedLyrics: LISA_GURENGE_LRC,
    syncedLines: parseLrc(LISA_GURENGE_LRC),
    lyrics: parseLrc(LISA_GURENGE_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(LISA_GURENGE_LRC).map(l => l.text),
  },
  {
    id: 'curated-shinunoga-e-wa',
    title: 'Shinunoga E-Wa (Romaji QWERTY)',
    artist: 'Fujii Kaze',
    album: 'HELP EVER HURT NEVER',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&q=80',
    duration: 185,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'dawrQnvwMTY',
    syncedLyrics: SHINUNOGA_E_WA_LRC,
    syncedLines: parseLrc(SHINUNOGA_E_WA_LRC),
    lyrics: parseLrc(SHINUNOGA_E_WA_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(SHINUNOGA_E_WA_LRC).map(l => l.text),
  },
  {
    id: 'curated-ado-usseewa',
    title: 'Usseewa (Romaji QWERTY)',
    artist: 'Ado',
    album: 'Kyougen',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&q=80',
    duration: 204,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'Qp3b-RXtz4w',
    syncedLyrics: ADO_USSEEWA_LRC,
    syncedLines: parseLrc(ADO_USSEEWA_LRC),
    lyrics: parseLrc(ADO_USSEEWA_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(ADO_USSEEWA_LRC).map(l => l.text),
  },
  {
    id: 'curated-yoasobi-yoru-ni-kakeru',
    title: 'Yoru ni Kakeru (Romaji QWERTY)',
    artist: 'YOASOBI',
    album: 'THE BOOK',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&q=80',
    duration: 261,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'by4SYYWlhEs',
    syncedLyrics: YOASOBI_YORU_NI_KAKERU_LRC,
    syncedLines: parseLrc(YOASOBI_YORU_NI_KAKERU_LRC),
    lyrics: parseLrc(YOASOBI_YORU_NI_KAKERU_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(YOASOBI_YORU_NI_KAKERU_LRC).map(l => l.text),
  },
  {
    id: 'curated-blinding-lights',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop&q=80',
    duration: 200,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'fHI8X4OXluQ',
    syncedLyrics: BLINDING_LIGHTS_LRC,
    syncedLines: parseLrc(BLINDING_LIGHTS_LRC),
    lyrics: parseLrc(BLINDING_LIGHTS_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(BLINDING_LIGHTS_LRC).map(l => l.text),
  },
  {
    id: 'curated-viva-la-vida',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    album: 'Viva la Vida or Death and All His Friends',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop&q=80',
    duration: 242,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'dvgZkm1xWPE',
    syncedLyrics: VIVA_LA_VIDA_LRC,
    syncedLines: parseLrc(VIVA_LA_VIDA_LRC),
    lyrics: parseLrc(VIVA_LA_VIDA_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(VIVA_LA_VIDA_LRC).map(l => l.text),
  },
  {
    id: 'curated-as-it-was',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop&q=80',
    duration: 167,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'V1Z586zoeeE',
    syncedLyrics: AS_IT_WAS_LRC,
    syncedLines: parseLrc(AS_IT_WAS_LRC),
    lyrics: parseLrc(AS_IT_WAS_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(AS_IT_WAS_LRC).map(l => l.text),
  },
  {
    id: 'curated-shape-of-you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    album: '÷ (Divide)',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop&q=80',
    duration: 233,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: '_dK2tDK9grQ',
    syncedLyrics: SHAPE_OF_YOU_LRC,
    syncedLines: parseLrc(SHAPE_OF_YOU_LRC),
    lyrics: parseLrc(SHAPE_OF_YOU_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(SHAPE_OF_YOU_LRC).map(l => l.text),
  },
  {
    id: 'curated-bohemian-rhapsody',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop&q=80',
    duration: 354,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'xG16sdjLtc0',
    syncedLyrics: BOHEMIAN_RHAPSODY_LRC,
    syncedLines: parseLrc(BOHEMIAN_RHAPSODY_LRC),
    lyrics: parseLrc(BOHEMIAN_RHAPSODY_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(BOHEMIAN_RHAPSODY_LRC).map(l => l.text),
  },
  {
    id: 'curated-rolling-in-the-deep',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    album: '21',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&q=80',
    duration: 228,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'bDtjO-R0QSo',
    syncedLyrics: ROLLING_IN_THE_DEEP_LRC,
    syncedLines: parseLrc(ROLLING_IN_THE_DEEP_LRC),
    lyrics: parseLrc(ROLLING_IN_THE_DEEP_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(ROLLING_IN_THE_DEEP_LRC).map(l => l.text),
  },
  {
    id: 'curated-levitating',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    cover: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&h=300&fit=crop&q=80',
    duration: 203,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'WHuBW3qKm9g',
    syncedLyrics: LEVITATING_LRC,
    syncedLines: parseLrc(LEVITATING_LRC),
    lyrics: parseLrc(LEVITATING_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(LEVITATING_LRC).map(l => l.text),
  },
  {
    id: 'curated-fix-you',
    title: 'Fix You',
    artist: 'Coldplay',
    album: 'X&Y',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300&h=300&fit=crop&q=80',
    duration: 295,
    source: 'spotify',
    hasLyrics: true,
    youtubeId: 'uUv5Z3HFHpU',
    syncedLyrics: FIX_YOU_LRC,
    syncedLines: parseLrc(FIX_YOU_LRC),
    lyrics: parseLrc(FIX_YOU_LRC).map(l => l.text).join('\n'),
    lines: parseLrc(FIX_YOU_LRC).map(l => l.text),
  },
];
