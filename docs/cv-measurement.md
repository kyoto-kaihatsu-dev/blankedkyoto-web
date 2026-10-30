# 予約ページ到達 CV 計測 — 実装メモ・運用手順

元仕様: 「予約ページ遷移 コンバージョン計測設計 手順書」v1.0（2026-10-26）
対象: blankedkyoto.com（JA 7 ページ + EN 7 ページ + privacy 2 ページ）

---

## 1. 実装の構成

| ファイル | 役割 |
|---|---|
| `assets/js/oaiq.js` | OpenAI Measurement Pixel の読み込み・同意制御・イベント送信を一元管理 |
| `assets/js/consent.js` | 同意バナー（JA/EN 自動切替）。初回のみ表示 |
| `assets/css/style.css` | `.consent*` バナーのスタイル |
| `privacy.html` / `en/privacy.html` | プライバシーポリシー（計測・Cookie・同意の説明）。全ページのフッターからリンク |
| `thanks.html` / `en/thanks.html` | 予約完了ページ（noindex）。`appointment_scheduled` の発火地点 |
| 各 HTML `<head>` 冒頭 | `window.BK_OAIQ = { pixelId, debug }` と `oaiq.js` の読み込み（GTM より前） |
| 各 HTML `</body>` 直前 | `consent.js` |
| 予約リンク | `data-booking-site="jalan|klook|viator"` を付与（仕様 3.4） |

### 送信イベント（仕様 2.2）

| イベント | 種別 | 発火 | 実装箇所 |
|---|---|---|---|
| `page_viewed` | 標準 | 全ページ表示時 | `oaiq.js` |
| `booking_page_view` | カスタム | `booking.html` / `en/booking.html` 表示時（主CV） | `oaiq.js`（パスで判定） |
| `booking_site_click` | カスタム | `[data-booking-site]` クリック時（参考値） | `oaiq.js` |
| `appointment_scheduled` | 標準 | `thanks.html` / `en/thanks.html` 表示時（予約完了・第2段階） | `oaiq.js`（パスで判定）。`{ type: "customer_action" }`、金額なし。`event_id` をセッション内で固定しリロード時の重複を排除 |

金額は付与しない（仕様 2.4）。`appointment_scheduled` に金額を付ける場合は、自社予約フォーム等でコース・金額が確定できるようになってから `{ type: "customer_action", amount: 5500, currency: "JPY" }` の形で追加する。

### 同意の流れ（仕様 3.5）

1. ページ読み込み時、`oaiq("consent", false)` → `oaiq("init", …)` の順で実行（拒否状態で初期化）
2. `page_viewed` / `booking_page_view` は **サイト側のキューに保留**
3. 訪問者が「同意する」を押すと `oaiq("consent", true)` → 保留イベントを送信
4. 「同意しない」を押すと保留を破棄、以後送信しない
5. 選択は `localStorage["bk_consent"]` に保存（SDK 側も 30 日 Cookie に保存）

> SDK は拒否中のイベントを再送しないため（仕様 CAUTION）、サイト側で保留→再送を実装している。
> これにより「バナーを見てから同意した人」の予約ページ到達も取りこぼさない。

---

## 2. 公開前にやること（オーナー作業）

### 2-1. Pixel ID を発行して差し替える（仕様 3.1）

1. OpenAI Ads Manager → **Conversions** タブ → 新しい Pixel ID を作成
2. リポジトリで一括置換:

```bash
# <YOUR-PIXEL-ID> を実際の ID に置換（全 16 ページ）
grep -rl '<YOUR-PIXEL-ID>' --include=*.html . | xargs sed -i 's/<YOUR-PIXEL-ID>/ここに実IDを貼る/g'
```

3. 検証中は `debug: false` → `debug: true` に変更するとコンソールに `[oaiq]` ログが出る。**本番公開前に必ず `false` に戻す**（仕様 5.2）。

> Pixel ID が未設定（`<YOUR-PIXEL-ID>` のまま）の間、`oaiq.js` は SDK を読み込まず何も送信しない。バナーも表示されない。

### 2-2. 管理画面の設定（仕様 4.1）

1. Conversions タブで `booking_page_view` が受信一覧に表示されることを確認
2. コンバージョンとして登録
3. キャンペーンの最適化目標として選択できるか確認
4. 選択できない場合 → 仕様 4.3 の `contents_viewed` 代替へ（`oaiq.js` の `isBooking` ブロックを差し替え）

---

## 3. 検証チェックリスト（仕様 5.1 / 5.2）

| 済 | 確認項目 | 方法 |
|---|---|---|
| ☐ | 全ページに SDK が入っている | `grep -L oaiq.js *.html en/*.html` が 404.html 以外を出さない |
| ☐ | Pixel ID が正しい | `grep -c '<YOUR-PIXEL-ID>' *.html en/*.html` が全て 0、管理画面の ID と一致 |
| ☐ | 同意前は送信されない | DevTools Network で `bzr.openai.com` へのリクエストが無い |
| ☐ | 同意後に `booking_page_view` が送信される | booking.html で「同意する」→ Network に `v1/sdk/events` POST、ボディに `booking_page_view` |
| ☐ | 外部リンククリックが記録される | 予約ボタンをクリック → 管理画面で `booking_site_click` 受信 |
| ☐ | CSP でブロックされていない | コンソールにエラーなし（GitHub Pages は CSP 未設定のため通常は問題なし） |
| ☐ | イベントが受信一覧に表示される | Conversions タブ |
| ☐ | コンバージョンとして登録済み | 設定画面 |
| ☐ | 最適化目標として選択できる | 広告セット編集画面 |
| ☐ | 本番で `debug: false` | ソース確認 |

### 数値の妥当性（設置 3 日後、仕様 5.3）
- 予約ページ到達数 > 予約件数（月 20 件ベース）
- 予約ページ到達数 ≪ LP ビュー数（6,018/30 日）
- 社内アクセス・テスト送信が混ざっていない

---

## 4. 運用ルール（仕様 6）

- **イベント名は変更しない**（`booking_page_view` / `booking_site_click`）
- CV 地点の変更は月 1 回まで。変更後 3 日間は数値を判断材料にしない
- 「予約ページ到達 CPA」と「予約 CPA」は別指標として管理する
- 月次: 到達数と予約件数の比率、到達→外部クリック率、じゃらん/Klook 経由予約の突合、祝日営業日の配信設定

---

## 5. 未解決事項（仕様 7.2）

| 項目 | 状態 |
|---|---|
| カスタムイベントの最適化目標への指定可否 | 管理画面で確認 → 不可なら `contents_viewed` 代替 |
| 予約ページ到達 CPA の許容値 | 未設定 |
| サンクスページへの誘導 | ページは整備済み。**じゃらん／Klook／Viator は予約完了後に自社 URL へリダイレクトできないため、現時点では到達経路がない。** 確認メールや予約サイトの「予約後メッセージ」に `https://blankedkyoto.com/thanks.html` を記載して誘導する運用、または自社予約フォーム導入時に完了先として指定する |
| Google フォームの扱い | 未定 |

---

## 6. 変更履歴

| 日付 | 内容 |
|---|---|
| 2026-10-26 | 初版実装。全 16 ページに Pixel・同意バナー・プライバシーポリシーを設置 |
| 2026-10-26 | `appointment_scheduled` を実装。`thanks.html` / `en/thanks.html` を新設 |
