# 画像アセット 配置ガイド

写真を差し替える際は、下記のファイル名で各フォルダに置いてください。
既存の HTML は変更していません。写真配置後の HTML 側の参照更新は実装フェーズで行います。

## 写真を置いた後にやること（画像最適化）

写真を配置したら、リポジトリのルートで次を実行してください（Python 3 + Pillow + rsvg-convert）。

```
python3 tools/optimize_images.py
```

`assets/img/photos/` 直下の JPG/PNG から、表示用の `<slug>-600.webp` `-1200.webp` `-1800.webp` `-1200.jpg` を自動生成します
（元ファイルはそのまま残ります。HTML はこれらの生成ファイルを参照しています）。
about.html の 6 枚（factory-exterior.jpg など）は元ファイル名をそのまま HTML が参照しているため、配置後の追加作業は不要です。

推奨仕様（共通）
- 横長 1800px 以上（Retina 対応）、JPG（品質 80 程度）
- ファイル名は半角英小文字・数字・ハイフンのみ
- 縦横比は 3:2 または 16:9 を推奨（表示側で `object-fit: cover` によりトリミングされます）

---

## 1. `photos/` — about.html で参照済み（現在 404）

HTML 側で既にこのファイル名を参照しています。**同名で置くだけで表示されます。**

| ファイル名 | 内容 | 表示ページ |
|---|---|---|
| `photos/factory-exterior.jpg` | 蒲郡・自社工場の外観 | about.html / en/about.html |
| `photos/multilayer-gauze.jpg` | 多重織ガーゼの構造（断面・重なり） | 同上 |
| `photos/jacquard-loom.jpg` | ジャガード織機 | 同上 |
| `photos/weaving-process.jpg` | 製織工程 | 同上 |
| `photos/sewing-process.jpg` | 縫製工程 | 同上 |
| `photos/inspection-process.jpg` | 検品工程 | 同上 |

## 2. `photos/studio/` — 店内・体験の実写（L）

トップ／体験ページの生成画像を置き換える候補。3〜6枚。

| ファイル名 | 内容 |
|---|---|
| `photos/studio/hero.jpg` | ヒーロー用：織機に向かう参加者の手元（横長） |
| `photos/studio/interior-01.jpg` | 店内全景（織機4台が写るもの） |
| `photos/studio/interior-02.jpg` | ガーゼ製品の陳列 |
| `photos/studio/weaving-01.jpg` | 体験中の様子 |
| `photos/studio/weaving-02.jpg` | 糸を選ぶ様子 |
| `photos/studio/finished-bookmark.jpg` | 完成したしおり（実物） |
| `photos/studio/finished-omamori.jpg` | 完成したお守り（実物） |
| `photos/studio/finished-sacoche.jpg` | 完成したサコッシュ（実物） |

## 3. `photos/access/` — 行き方案内（M）

| ファイル名 | 内容 |
|---|---|
| `photos/access/station-exit-6.jpg` | 祇園四条駅 6番出口 |
| `photos/access/building-entrance.jpg` | ぎをん松本ビル入口・看板 |
| `photos/access/stairs.jpg` | 2階への階段 |
| `photos/access/storefront.jpg` | 店舗入口（2階） |

## 4. `products/` — 商品写真（O）

代表商品 3〜5 点。**ファイルと一緒に、商品名／税込価格／素材／サイズを `products/products.md` に記入してください**（Product スキーマに使用）。

| ファイル名 | 内容 |
|---|---|
| `products/handkerchief-01.jpg` | ハンカチ |
| `products/face-towel-01.jpg` | フェイスタオル |
| `products/gauze-blanket-01.jpg` | ガーゼケット |
| `products/limited-01.jpg` | BLANKED KYOTO 限定商品 |
| `products/limited-02.jpg` | 同（2点目以降は連番） |

## 5. `icons/` — アイコン類（N）

| ファイル名 | 仕様 |
|---|---|
| `icons/apple-touch-icon.png` | 180×180 PNG、背景あり・余白あり |
| `icons/icon-192.png` | 192×192 PNG（manifest 用・任意） |
| `icons/icon-512.png` | 512×512 PNG（manifest 用・任意） |
| `icons/favicon.ico` | 32×32（任意） |

※ 現在 `assets/img/apple-touch-icon.png` は拡張子 png ですが中身は SVG（40×40）のため、iOS で表示されません。上記を配置後、実装フェーズで参照を切り替えます。
