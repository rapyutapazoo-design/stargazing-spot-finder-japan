// Build a Word report on stargazing apps/services and prototype design
const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  ExternalHyperlink, PageOrientation, TabStopType, TabStopPosition,
} = require('docx');

// Helpers
const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };

const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: [new TextRun({ text, ...(opts.runOpts || {}) })],
  });
}

function PMulti(runs, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: runs,
  });
}

function H1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true })],
  });
}
function H2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 120 },
    children: [new TextRun({ text, bold: true })],
  });
}
function H3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 100 },
    children: [new TextRun({ text, bold: true })],
  });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: [new TextRun(text)],
  });
}
function bulletRich(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { after: 80 },
    children: runs,
  });
}

function link(text, url) {
  return new ExternalHyperlink({
    children: [new TextRun({ text, style: "Hyperlink" })],
    link: url,
  });
}

// Table builder
function makeTable(headers, rows, columnWidths) {
  const totalWidth = columnWidths.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders, margins: cellMargins,
      width: { size: columnWidths[i], type: WidthType.DXA },
      shading: { fill: "1F3A5F", type: ShadingType.CLEAR },
      children: [new Paragraph({
        children: [new TextRun({ text: h, bold: true, color: "FFFFFF" })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cellText, i) => new TableCell({
      borders, margins: cellMargins,
      width: { size: columnWidths[i], type: WidthType.DXA },
      shading: { fill: ri % 2 === 0 ? "FFFFFF" : "F2F2F2", type: ShadingType.CLEAR },
      children: cellText.split("\n").map(line =>
        new Paragraph({ children: [new TextRun({ text: line })] })
      ),
    })),
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ---------- Content ----------
const children = [];

// Title page
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1200, after: 200 },
  children: [new TextRun({ text: "天体観測おすすめ度マップ", bold: true, size: 56, color: "1F3A5F" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 600 },
  children: [new TextRun({ text: "気象 × 光害 × 天体イベント × 地図 を統合したサービス検討レポート", size: 28, color: "555555" })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "対象: 日本国内", size: 24 })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 200 },
  children: [new TextRun({ text: "作成日: 2026年5月11日", size: 22, color: "777777" })],
}));
children.push(new Paragraph({ children: [new PageBreak()] }));

// 1. はじめに
children.push(H1("1. はじめに"));
children.push(P("本レポートは、ユーザーが天体観測へ出かける前に「いつ・どこへ行けば良い星空が見られるか」を意思決定するためのアプリ／サイトを設計するための基礎調査である。日本国内の既存サービスを横断的に比較し、4つの判定要素 — 天候（雲量・湿度・視程）、光害（暗さ・Bortle スケール）、天体イベント（流星群・月齢など）、アクセス性（駐車場・所要時間） — を統合した「おすすめ度スコア」を算出するアーキテクチャを提案する。あわせて Open-Meteo API と Leaflet 地図を用いた最小プロトタイプの設計を示す。"));

children.push(H2("1.1 課題背景"));
children.push(P("現状、天体観測者はおおむね次の3〜4つのタブを行き来しながら出発判断を下している:"));
children.push(bullet("tenki.jp の星空指数で「指数」を確認する。"));
children.push(bullet("SCW または GPV 気象予報で雲量と雲頂高度を時系列で確認する。"));
children.push(bullet("ライトポリューションマップで暗い場所（Bortle 4 以下が望ましい）を探す。"));
children.push(bullet("国立天文台の「今日のほしぞら」や流星群カレンダーで月齢・天文現象を確認する。"));
children.push(bullet("最後に Google マップで観測候補地までの所要時間と駐車場を確認する。"));
children.push(P("これら4〜5サービスを横断するとどうしても確認漏れが起きる。1画面で「今夜・週末・このエリアで一番おすすめのスポット」が地図上に色分けで示されるサービスがあれば、観測者の行動コストを大幅に下げられる。"));

children.push(H2("1.2 想定ユーザー"));
children.push(bullet("月数回〜数年に1回、流星群や皆既月食などのイベント時にだけ星を見る初心者・家族層。"));
children.push(bullet("週末ごとに観測地を変えて移動する撮影者・アマチュア天文家。"));
children.push(bullet("観望会やイベントを企画する天文サークル・科学館スタッフ。"));

// 2. 既存サービス調査
children.push(H1("2. 既存サービス調査"));
children.push(P("天体観測者向けに使える主要なサービスを「気象」「光害」「天体イベント」「地図・統合型」の4カテゴリーに分けて整理した。各サービスの長所と限界をふまえ、本企画の差別化ポイントを後述する。"));

children.push(H2("2.1 気象・雲量系サービス"));
const weatherTable = makeTable(
  ["サービス", "提供元", "特徴", "限界"],
  [
    ["星空指数", "日本気象協会 tenki.jp", "0〜100 の単一指数。10日先まで全国対応。一般向けで分かりやすい。", "指数算出ロジックがブラックボックス。雲頂高度や視程は分からず、撮影には情報量が不足。"],
    ["SCW (SuperC Weather)", "個人運営", "2km メッシュ、雲形・雲頂高度を含む高解像度予報。1日8回更新。", "観測地ピンの保存などの個別機能が弱い。地図 UI は独自で慣れが必要。"],
    ["GPV 気象予報", "個人運営 (weather-gpv.info)", "雲量を10%刻み・1時間単位で予報。8日先まで。", "UI は素朴。スマホ最適化は限定的。地図上の任意地点指定はやや手間。"],
    ["Windy", "Windy.s.r.o (チェコ)", "ECMWF/GFS 切替可。風・雲・気圧などレイヤー豊富。世界対応。", "日本特有の詳細メッシュ（MSM）には及ばない場合あり。指数化はされない。"],
    ["Open-Meteo", "ETH Zürich 系オープン", "完全無料・APIキー不要。雲量を低・中・高層別に取得可能。商用には別ライセンス。", "UI は自分で作る必要がある。日本の MSM 並みの細かさはモデル次第。"],
    ["雲量ナビ (iOS)", "個人開発", "GPV ベース、現在地中心の雲量グラフを一週間表示。", "iOS 限定。地図上での周辺比較は不可。"],
  ],
  [1500, 2000, 3200, 2660]
);
children.push(weatherTable);

children.push(H2("2.2 光害（Light Pollution）系サービス"));
const lpTable = makeTable(
  ["サービス", "データ源", "特徴", "限界"],
  [
    ["lightpollutionmap.info", "NASA VIIRS / World Atlas 2015", "世界対応の標準ツール。Bortle 表示、SQM オーバーレイ。", "Web は重め。トレンド比較や有料機能あり。日本語化なし。"],
    ["Light Pollution Map App", "VIIRS 年次更新", "iOS/Android アプリ。位置情報からその場で Bortle 評価。", "サブスク機能多め。流星群イベント連携などはなし。"],
    ["Dark Site Finder", "VIIRS 年次", "簡易な Bortle カラーマップ。米国寄り。", "日本向けの観測地アノテーションは少ない。"],
    ["Light Pollution Atlas (D. Lorenz)", "VIIRS + 大気モデル", "学術用途で参照される基礎データ。", "API 化されておらず、オーバーレイ画像として利用。"],
    ["環境省 光害対策ガイドライン", "環境省", "国内政策・参考資料。Bortle 直接ではないが暗い場所の参考に。", "リアルタイム性なし。観測判断には間接的。"],
  ],
  [2000, 1800, 3000, 2560]
);
children.push(lpTable);

children.push(H2("2.3 天体イベント・暦系サービス"));
const eventTable = makeTable(
  ["サービス", "提供元", "特徴", "限界"],
  [
    ["国立天文台 暦計算室", "NAOJ", "月齢・月の出入り・日出入・流星群極大日など信頼性の高い計算。", "公開 API は無く、CGI 出力をスクレイピング相当。"],
    ["AstroArts 星空ガイド", "アストロアーツ", "毎月の天体イベントを編集記事で提供。", "プログラマブルなデータ提供は限定的。"],
    ["Stellarium / Stellarium Web", "OSS", "任意の地点・時刻の星空シミュレーション。", "気象・光害との連携は標準では弱い。"],
    ["SkySafari / Star Walk 2", "商用アプリ", "AR で空にかざす UX。プラネタリウム機能。", "観測スポット推薦機能は弱い。"],
    ["Heavens-Above", "個人運営", "ISS や人工衛星の通過予報に強い。", "UI は古典的。スマホ最適化は弱い。"],
  ],
  [2000, 1500, 3360, 2500]
);
children.push(eventTable);

children.push(H2("2.4 地図・統合型サービス"));
const mapTable = makeTable(
  ["サービス", "種別", "特徴", "限界"],
  [
    ["Google Maps", "汎用地図", "経路・所要時間・駐車場・口コミ。地点検索の事実上の標準。", "天体観測向け情報レイヤーは存在しない。"],
    ["Stargazing Hub / Darkest Hour", "海外統合アプリ", "気象・光害・Bortle・月齢を1画面に統合。", "日本語非対応、日本の細かい気象モデル未対応。"],
    ["Astrospheric / Clear Outside", "海外統合", "天体観測者向け天気指標（seeing/transparency）を提供。", "北米中心、日本向け精度に課題。"],
    ["jaglab Astro Forecast", "Open-Meteo を使った OSS", "無料・OSS。観測者向け seeing 計算を実装。", "観測スポット候補のレコメンド機能はない。"],
  ],
  [2200, 1700, 3000, 2460]
);
children.push(mapTable);

children.push(H2("2.5 既存サービスのギャップ（差別化機会）"));
children.push(bullet("「気象 × 光害 × 月齢 × アクセス性」を一つの統合スコアに落とし込んだ日本語サービスは事実上存在しない。"));
children.push(bullet("Bortle スケールと国内地点（駐車場・展望台・公園）を結びつけた地図は限られる。"));
children.push(bullet("流星群・月食などのイベント当日に「今夜行ける現実的な候補3つ」をレコメンドする UI が無い。"));
children.push(bullet("観測者の制約（移動可能距離、車の有無、家族同伴可否）を入力に取れる UI は無い。"));

// 3. 要件定義
children.push(H1("3. 要件定義"));

children.push(H2("3.1 機能要件"));
children.push(bullet("現在地（または任意指定地点）から半径 N km の観測候補スポットを地図に表示する。"));
children.push(bullet("各スポットに 0〜100 の「おすすめ度スコア」を色付きピンで表示する。"));
children.push(bullet("スコアは 4 要素（天候 / 光害 / 天体イベント / アクセス性）の重み付き合計とし、観測時刻は今夜・明日・週末から選択可能。"));
children.push(bullet("スポットをタップすると、4要素ごとの内訳・予報グラフ・Google マップへの経路リンク・駐車場の有無を表示する。"));
children.push(bullet("月齢・主要な天体イベント（流星群極大、惑星接近、月食など）をカレンダー帯で常時表示する。"));
children.push(bullet("ユーザーが「行ったことがある観測地」「お気に入り」を保存できる（ローカル保存）。"));

children.push(H2("3.2 非機能要件"));
children.push(bullet("モバイル/PC 両対応のレスポンシブ Web。インストール不要で使えること。"));
children.push(bullet("オープン API のみで動作し、外部キー無しでも MVP が動くこと。"));
children.push(bullet("3秒以内に初期マップ＋現在地周辺スコアが表示されること。"));
children.push(bullet("オフラインの観測地リスト（CSV/JSON）でフォールバック可能であること。"));

children.push(H2("3.3 おすすめ度スコアの算出式（提案）"));
children.push(P("総合スコア S（0〜100）は次の重み付き和とする。重みはユーザーが UI 上で調整可能とする。"));
children.push(PMulti([
  new TextRun({ text: "S = w₁·S_weather + w₂·S_lightpollution + w₃·S_event + w₄·S_access", bold: true }),
]));
children.push(P("デフォルト重みは w₁=0.45, w₂=0.30, w₃=0.15, w₄=0.10 とする（撮影者は w₂ を増やし、家族連れは w₄ を増やすなど）。各サブスコアは以下のように算出する:"));
children.push(bullet("S_weather: 観測時間帯の平均雲量（低層雲は重み2倍）と相対湿度・視程から、100−雲量(%)−補正項。"));
children.push(bullet("S_lightpollution: VIIRS 値→Bortle 推定→Bortle 1=100, 9=0 の線形マップ。"));
children.push(bullet("S_event: 月齢（新月=100, 満月=20）に、当夜の流星群極大があればボーナス＋15。"));
children.push(bullet("S_access: 自宅からの距離 d (km) と所要時間 t (分) から、100−min(d,150)/1.5−min(t,180)/3。駐車場あり+5。"));

// 4. アーキテクチャ
children.push(H1("4. システム構成"));
children.push(P("MVP（プロトタイプ）はサーバー無しの単一 HTML（フロントエンドのみ）で実装可能である。将来的なスケーリング先としてサーバーレス API 層を想定する。"));

children.push(H2("4.1 データソース"));
const dsTable = makeTable(
  ["要素", "一次ソース", "代替・補完", "ライセンス／注意"],
  [
    ["天気・雲量", "Open-Meteo (forecast API)", "気象庁 MSM, SCW", "Open-Meteo は非商用無料・キー不要。商用は別契約。"],
    ["光害", "VIIRS Annual (NOAA/NASA)", "World Atlas 2015 / Falchi et al.", "CC0 / CC-BY。タイル化済みのオーバーレイ画像で配信可。"],
    ["月齢・天体イベント", "クライアント側計算 (SunCalc/Meeus アルゴリズム)", "国立天文台 暦計算室を参考値検証", "SunCalc は MIT ライセンス。"],
    ["地図", "OpenStreetMap (Leaflet)", "Google Maps Embed (経路用)", "OSM タイル利用ポリシー遵守。"],
    ["観測地リスト", "自前 JSON（公園・展望台・駐車場）", "OSM タグ tourism=viewpoint", "国立公園・自治体公開リストを基に作成。"],
  ],
  [1700, 2400, 2700, 2560]
);
children.push(dsTable);

children.push(H2("4.2 コンポーネント構成（MVP）"));
children.push(bullet("フロントエンド: 単一 HTML + Vanilla JS + Leaflet。CDN のみで完結。"));
children.push(bullet("地図レイヤー: OSM ベース + 光害オーバーレイ（lightpollutionmap.info タイル等）。"));
children.push(bullet("API クライアント: Open-Meteo を fetch で直接呼び、結果を観測地ごとにキャッシュ（localStorage）。"));
children.push(bullet("月齢計算: クライアント側で SunCalc 相当のアルゴリズムを実装（外部 API 不要）。"));
children.push(bullet("おすすめ度エンジン: ピュアな JavaScript 関数。重みは UI から変更可能。"));

children.push(H2("4.3 将来拡張"));
children.push(bullet("Bortle 値の正確化: VIIRS タイルからピクセル値を読み出すサーバー API を追加。"));
children.push(bullet("混雑度・治安レイヤー: 自治体オープンデータや警察庁データを統合。"));
children.push(bullet("ユーザー投稿: 行ってみた観測地のレビュー・実績写真の共有。"));
children.push(bullet("通知: 「今週末 80 点超えのスポットが出ました」を Web Push で通知。"));

// 5. プロトタイプ概要
children.push(H1("5. プロトタイプ概要"));
children.push(P("本レポートとあわせて、同フォルダ内に prototype.html を配置している。次の機能を実装した最小実装である:"));
children.push(bullet("関東を中心とした 12 箇所のサンプル観測地（ダーク度の高い既知スポット）を地図に表示。"));
children.push(bullet("各スポットの夜間（21時）の Open-Meteo 予報を取得し、雲量から S_weather を算出。"));
children.push(bullet("各スポットに登録した推定 Bortle 値から S_lightpollution を算出。"));
children.push(bullet("当日の月齢（簡易計算）と既知の主要流星群リストから S_event を算出。"));
children.push(bullet("ユーザーが現在地を許可すると、距離・所要時間（直線距離 50km/h 換算）から S_access を算出。"));
children.push(bullet("4要素の重みをスライダーで調整可能。スコアに応じてピンが赤→橙→黄→緑にリアルタイムで色変えされる。"));
children.push(bullet("ピンのポップアップから Google マップの経路リンクを開ける。"));

children.push(H2("5.1 使用ライブラリ／API"));
children.push(bulletRich([
  new TextRun({ text: "地図: ", bold: true }),
  link("Leaflet", "https://leafletjs.com/"),
  new TextRun(" + OpenStreetMap タイル"),
]));
children.push(bulletRich([
  new TextRun({ text: "天気: ", bold: true }),
  link("Open-Meteo Forecast API", "https://open-meteo.com/en/docs"),
]));
children.push(bulletRich([
  new TextRun({ text: "光害参考: ", bold: true }),
  link("Light Pollution Map", "https://www.lightpollutionmap.info/"),
]));
children.push(bulletRich([
  new TextRun({ text: "月齢計算: ", bold: true }),
  new TextRun("Meeus 簡易式（自作、外部 API 不使用）"),
]));

// 6. 推奨ロードマップ
children.push(H1("6. 推奨ロードマップ"));
const rmTable = makeTable(
  ["フェーズ", "ゴール", "主要タスク", "目安期間"],
  [
    ["MVP", "ブラウザだけで動く 1 画面アプリ", "プロトタイプ HTML を関東→全国へ拡張、観測地リストを 100 地点に拡充", "2〜3 週間"],
    ["β", "PWA 化と通知", "Service Worker、Web Push、お気に入り同期", "1 ヶ月"],
    ["v1", "観測地レビュー", "ユーザー投稿、写真アップロード、モデレーション", "2 ヶ月"],
    ["v2", "イベント連動", "流星群・月食特集ページ、SNS シェア用カード自動生成", "1 ヶ月"],
  ],
  [1300, 2400, 4100, 1560]
);
children.push(rmTable);

// 7. リスクと留意点
children.push(H1("7. リスク・留意点"));
children.push(bullet("Open-Meteo は非商用無料。商用化する場合は同社の有料プランか、気象庁データへの切替が必要。"));
children.push(bullet("光害データ（VIIRS）は年次更新で、街灯 LED 化の影響を完全には反映しない可能性がある。"));
children.push(bullet("OSM タイルの大量アクセスは禁止。トラフィックが増えたら自前タイルサーバーまたは MapLibre + Maptiler 等の有料 CDN を検討。"));
children.push(bullet("観測地は私有地・夜間進入禁止のケースがあり、レコメンド前に「夜間立入可」を一次情報で確認する運用が必要。"));
children.push(bullet("天体イベント情報は国立天文台の発表を一次ソースとし、自動取得ではなく定期的な手動更新を推奨。"));

// 8. 参考文献
children.push(H1("8. 参考文献・関連リンク"));

const refs = [
  ["星空指数 (tenki.jp)", "https://tenki.jp/indexes/starry_sky/"],
  ["SCW 天気予報", "https://supercweather.com/"],
  ["GPV 気象予報", "http://weather-gpv.info/"],
  ["Open-Meteo", "https://open-meteo.com/"],
  ["Light Pollution Map (info)", "https://www.lightpollutionmap.info/"],
  ["Light Pollution Map (app)", "https://lightpollutionmap.app/"],
  ["Dark Site Finder", "https://darksitefinder.com/map/"],
  ["国立天文台 暦計算室", "https://eco.mtk.nao.ac.jp/"],
  ["国立天文台 ほしぞら情報", "https://www.nao.ac.jp/astro/sky/2026/"],
  ["Stellarium Web", "https://stellarium-web.org/"],
  ["Leaflet", "https://leafletjs.com/"],
  ["BE-PAL 星空アプリ8選", "https://www.bepal.net/archives/436863"],
];
refs.forEach(([title, url]) => {
  children.push(new Paragraph({
    spacing: { after: 60 },
    numbering: { reference: "bullets", level: 0 },
    children: [link(title, url), new TextRun({ text: " — " + url, color: "777777" })],
  }));
});

// ---------- Document assembly ----------
const doc = new Document({
  creator: "Claude (Cowork)",
  title: "天体観測おすすめ度マップ — 検討レポート",
  description: "気象 × 光害 × 天体イベント × 地図情報を統合した観測スポットレコメンドサービスの検討レポート",
  styles: {
    default: { document: { run: { font: "Yu Gothic", size: 22 } } }, // 11pt
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "1F3A5F", font: "Yu Gothic" },
        paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, color: "2E5984", font: "Yu Gothic" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, color: "333333", font: "Yu Gothic" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1200, right: 1200, bottom: 1200, left: 1200 }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "天体観測おすすめ度マップ — 検討レポート", color: "888888", size: 18 })],
      })]})
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", color: "888888", size: 18 }),
                   new TextRun({ children: [PageNumber.CURRENT], color: "888888", size: 18 })],
      })]})
    },
    children,
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = process.argv[2] || "report.docx";
  fs.writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
});
