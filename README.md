# 星空おすすめマップ — Stargazing Spot Finder Japan

気象 × 光害 × 天体イベント（月齢・流星群）を一つの「おすすめ度スコア」に統合し、日本国内の観測候補地を地図上で可視化するプロトタイプ Web アプリと検討レポートです。現在地からの距離・所要時間は参考情報として別途表示します（スコアには含めません）。

![status](https://img.shields.io/badge/status-prototype-orange) ![license](https://img.shields.io/badge/license-MIT-blue)

## 概要

天体観測のために `tenki.jp 星空指数` `SCW` `GPV` `ライトポリューションマップ` `国立天文台 暦計算室` `Google マップ` を毎回往復するのは面倒。
本プロジェクトは、それらの情報を1画面に統合した「観測スポット推薦サービス」の検証実装です。

- 3要素（**天候・光害・月齢/イベント**）の重み付き総合スコアでスポットをランキング
- 観測時刻はプリセットボタン（今夜21時 / 明日21時 / 今週末21時）でワンタップ切替、時刻表示のシングルクリックでネイティブ日時ピッカーによる任意指定も可能
- 地図に **光害（ライトポリューション）** と **雲量予報** のレイヤーを重畳表示（チェックボックスで切替）
- 現在地を取得すると、距離順の周辺スポット一覧と Google マップ経路リンクを生成

## ファイル構成

```
.
├── README.md                                  ← このファイル
├── public/
│   └── index.html                             ← Web アプリ本体（単一HTML・Vercel 配信実体）
├── 天体観測おすすめ度マップ_検討レポート.docx     ← 既存サービス比較・要件・アーキテクチャ
└── tools/
    └── build_report.js                        ← レポート生成スクリプト（docx-js）
```

## クイックスタート

ブラウザで [`public/index.html`](./public/index.html) を直接開くだけです。サーバ不要・APIキー不要で動作します。本番は同ファイルを Vercel で配信しています。

```bash
open public/index.html
```

レポートを再生成したい場合:

```bash
cd tools
npm init -y && npm install docx
node build_report.js ../天体観測おすすめ度マップ_検討レポート.docx
```

## 使用データ・ライブラリ

| 用途 | 出典 | ライセンス |
|------|------|-----------|
| 雲量・湿度・視程・気温・風 | [Open-Meteo Forecast API](https://open-meteo.com/) | 非商用無料・APIキー不要 |
| 地図タイル | [OpenStreetMap](https://www.openstreetmap.org/) | ODbL |
| 月齢・天体イベント（スコア計算用） | クライアント側で計算（Conway 近似 + 主要流星群リスト） | — |
| 光害（参考） | [Light Pollution Map](https://www.lightpollutionmap.info/) / [国立天文台](https://eco.mtk.nao.ac.jp/) | — |
| 地図ライブラリ | [Leaflet 1.9.4](https://leafletjs.com/) | BSD-2 |
| 月の満ち欠け表示・日の出/日の入り | [SunCalc 1.9.0](https://github.com/mourner/suncalc) | BSD-2 |

## おすすめ度スコアの算出式

```
S = 0.50·S_weather + 0.35·S_lightpollution + 0.15·S_event
```

各サブスコア (0〜100) の算出:

- **S_weather**: `100 − (cloud × 0.6 + cloudLow × 0.4) − humidityPenalty + visibilityBonus`
- **S_lightpollution**: Bortle 1 → 100, Bortle 9 → 0 の線形マップ
- **S_event**: 月齢から算出（新月=100, 満月=20）+ 主要流星群極大±3日でボーナス +15

## マップレイヤー

| レイヤー | データ | 備考 |
|---------|-------|------|
| **光害** | 33 主要都市の人口データから推定した人工光ドーム | 中心が赤・外周が青の多段リング |
| **雲量予報** | Open-Meteo を 8×8 グリッドで取得 | 観測時刻スライダーに連動して再取得 |

## 既知の制約・今後の拡張

- 観測スポットは事前にキュレーションした **全国16箇所** のみ。OSM `tourism=viewpoint` 等で全国数千地点に拡張予定
- 光害データは概算値。VIIRS タイルやサーバー側ピクセル評価で精緻化予定
- Open-Meteo は非商用無料。商用化時は気象庁データへの切替が必要
- 私有地・夜間立入禁止のスポットがあり得るため、現地の最新情報を必ず確認してください
- 月齢計算はスコア算出用（Conway 近似、`moonAge()` 関数）と月相ビジュアル・日の出/日の入り表示用（SunCalc）で別実装になっており、将来的に一本化予定

## ライセンス

MIT License

## 謝辞

- データ提供: Open-Meteo, OpenStreetMap, 国立天文台, NASA/NOAA VIIRS
- ダークスカイ認定地: 井原市美星町、阿智村、神津島、北海道陸別町ほか
