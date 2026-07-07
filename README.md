# Ful ko Paila — setup guide

A no-backend storefront for handmade wire flowers and scented candles. You manage
products in a Google Sheet; the site reads it live. Clicking "Order" builds a
message with the item, variant, quantity, and price, and opens WhatsApp or
Instagram with it ready to send. The site also has an English/Nepali toggle
and a "Build your own" customizer — both explained below.

## 1. Create the product sheet

Make a Google Sheet with these column headers in row 1 (order doesn't matter,
spelling does):

| Name | Category | Variant | Price | Image URL | In Stock | Description | Customizer Role |
|---|---|---|---|---|---|---|---|
| Marigold Wire Bloom | Wire Flowers | Orange, medium | 350 | https://... | Yes | | Flower |
| Rose Wire Bloom | Wire Flowers | Deep red, small | 280 | | Yes | | Flower |
| Himalayan Pine Candle | Candles | Star shape | 450 | https://... | No | Pine & cedar scent | Addon |
| Classic Red Wrap | Packaging | | 50 | | Yes | | Wrap |

Notes:
- **Category** can be anything — the filter bar at the top of the site is
  generated automatically from whatever categories appear in the sheet. Add a
  "Soaps" or "Keychains" row next month and a "Soaps" filter tab just appears;
  nothing in the code needs to change.
- **Variant** is a free-text field for shape, colour, or scent — whatever
  describes that specific piece.
- **Image URL** can be left blank; the card will show a simple icon instead —
  a flower for anything with "flower/wire/bloom" in the category, a candle
  for "candle", and a generic gift-box icon for any other category you add
  later, so new product lines never look broken without photos. To get an
  image URL, upload the photo somewhere public (e.g. an "Anyone with the
  link" Google Drive image, imgur, or your own GitHub repo) and paste the
  direct link. **Want more than one photo per item?** Paste several links
  separated by a comma or a space (e.g. `link1.jpg, link2.jpg, link3.jpg`) —
  the card will show small dots under the photo, and tapping the image
  cycles through them.
- **In Stock**: type `Yes` or `No`. Anything other than `No`/`False`/`0` counts
  as in stock.
- **Customizer Role** is optional and only matters for the "Build your own"
  section (see below). Leave it blank for anything that should just be a
  normal shelf item.
- Add a new row any time you make a new piece. Delete or mark `No` when it
  sells. That's the entire admin process — no dashboard, no app.

## 2. The "Build your own" customizer

This section lets a customer pick a piece, a quantity, an optional extra
(like a candle), and a wrapping style, then order the whole bundle on
WhatsApp with a live price. It's built entirely from the same sheet — tag
rows with a value in the **Customizer Role** column:

- `Flower` — shows up as a base piece to choose in step 1, priced per unit
- `Addon` — shows up as an optional extra in step 3 (e.g. a candle to add on)
- `Wrap` — shows up as a required wrapping/packaging choice in step 4

If you don't tag any rows `Flower`, the whole customizer section
automatically hides itself — so it's safe to ignore this column entirely
until you're ready to use it. Add-on and wrapping steps each hide themselves
too if you haven't tagged anything for that role.

## 3. Publish the sheet as CSV

1. In Google Sheets: **File → Share → Publish to web**
2. Under "Link", choose the specific sheet/tab your products are on
3. Change the format dropdown to **Comma-separated values (.csv)**
4. Click **Publish**, confirm, and copy the link it gives you

On mobile, the native Sheets app doesn't have "Publish to web" — instead,
set sharing to "Anyone with the link" and build the CSV link yourself:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
```
(`gid=0` works if it's your only tab.)

## 4. Configure the site

Open `script.js` and edit the `CONFIG` block at the top:

```js
const CONFIG = {
  SHEET_CSV_URL: "<paste the link from step 3>",
  WHATSAPP_NUMBER: "97798XXXXXXXX", // country code + number, digits only
  INSTAGRAM_HANDLE: "fulkopaila",   // no @
  CURRENCY_PREFIX: "Rs. ",
  SHOP_NAME: "Ful ko Paila",
  SHOP_NAME_NP: "फुलको पाइला",
};
```

A note on Instagram: Instagram doesn't support pre-filling DM text through a
link the way WhatsApp does. So the Instagram button copies the order details
to the clipboard and opens your DM chat — a small toast tells the customer to
paste it in. WhatsApp opens with the message already typed in, ready to send.

## 5. English / Nepali toggle

The button in the top bar switches the whole page between English and
Nepali — headings, labels, buttons, and messages. This only covers the site's
built-in text. Product data (Name, Variant, Description) shows up exactly as
you type it in the sheet — so if you want a specific product's name to read
in Nepali, just type it in Nepali in that cell; it'll display correctly in
both language modes since it's your own text either way.

## 6. Deploy on GitHub Pages

1. Create a new GitHub repository and push these three files
   (`index.html`, `style.css`, `script.js`) to it
2. Go to the repo's **Settings → Pages**
3. Under "Build and deployment", set Source to **Deploy from a branch**,
   branch `main`, folder `/ (root)`
4. Save — GitHub will give you a URL like
   `https://yourusername.github.io/repo-name/` within a minute or two

Every time you edit the sheet, the live site updates automatically the next
time someone loads the page — no rebuild or redeploy needed.

## 7. Sharing and item links

Every card has a small share icon next to the order buttons. On phones,
tapping it opens the native share sheet (so a customer can send the item
straight to WhatsApp, Instagram, Messages, wherever) — on devices/browsers
without that feature, it copies a direct link to the clipboard instead.

Each product also gets a stable link automatically, based on its name (e.g.
`yoursite.github.io/#item=rose-candle`) — no setup needed. Opening that link
scrolls straight to that item and briefly highlights it. This same link is
now included at the bottom of every WhatsApp/Instagram order message, so you
always know exactly which item (and which photo set) a customer means.

One thing worth knowing: the link is generated from the product's *name*. If
you rename an item later, its old shared links will stop pointing to it —
this is a reasonable tradeoff for not needing a separate ID column, but keep
it in mind if you're renaming something customers may have already shared.

## Customizing the look

Colors, fonts, and spacing all live at the top of `style.css` under `:root`.
The price tag, category accent bars, chip tags, and the customizer's dark
panel are the main signature details — safe to recolor, but worth keeping if
you like the handmade-market feel.

## If the shelf doesn't load

- Double-check `SHEET_CSV_URL` is the *published* link (ends in
  `output=csv`), not the normal sheet URL
- Make sure the sheet is still published (re-publishing is sometimes needed
  after big edits)
- Open the browser console (F12) for the exact error if it still won't load

