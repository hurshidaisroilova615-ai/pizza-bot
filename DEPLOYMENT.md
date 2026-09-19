# Production deploylash qo'llanmasi

Bu loyiha 3 ta mustaqil servisdan iborat:

- `backend/` — Express API + Prisma + Telegram bot (Node.js)
- `miniapp/` — Telegram Mini App (statik React build)
- `admin/` — Admin Dashboard (statik React build)

Quyida **Render.com** orqali (bepul tarif bilan boshlab, kerak bo'lsa pullik tarifga o'tish mumkin) to'liq deploy qilish yo'riqnomasi berilgan. `render.yaml` fayli barcha 3 ta servisni bitta "Blueprint" sifatida tavsiflaydi.

> Muqobil variantlar: backend uchun Railway/Fly.io (Dockerfile bilan, `backend/Dockerfile` tayyor), frontendlar uchun Vercel/Netlify/Cloudflare Pages. Qadamlar konseptual jihatdan bir xil — build command, output papka (`dist`) va environment variable'larni sozlash kifoya.

## 0-qadam: Muhim xavfsizlik eslatmasi

Ushbu loyihaning boshlang'ich versiyasida `backend/.env` fayli ichida haqiqiy `BOT_TOKEN` va Neon `DATABASE_URL` (parol bilan) saqlangan edi. Bu fayl Git'ga hech qachon qo'shilmagan (`.gitignore`da), lekin siz ularni allaqachon boshqa joyda (masalan shu suhbatda) ulashgan bo'lsangiz, xavfsizlik nuqtai nazaridan:

1. **@BotFather**dan `/revoke` orqali eski bot tokenini bekor qiling va yangisini oling.
2. Neon dashboard'da database parolini reset qiling (Settings → Reset password).
3. Yangi qiymatlarni faqat `.env` fayllarga yoki hosting provayderining "Environment Variables" bo'limiga yozing — hech qachon kodga yoki commit'ga qo'shmang.

## 1-qadam: Ma'lumotlar bazasi (Postgres)

Agar Neon.tech'dagi mavjud bazangizdan foydalanmoqchi bo'lsangiz, `DATABASE_URL`ni saqlab qo'ying (2-qadamda kerak bo'ladi).

**Muhim:** eski loyihada `User`/`Product`/`Order` jadvallari boshqacha (eski) struktura bilan yaratilgan edi va Prisma migration tarixisiz. Yangi schema ancha kengaydi (CRM, promo, loyalty, kategoriya va h.k.), shuning uchun **production'ga chiqishdan oldin eski bazani tozalashingiz kerak**:

```sql
-- Neon SQL Editor yoki psql orqali:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Bu **barcha eski ma'lumotlarni** (test uchun qo'shilgan 4 ta pizza va eski buyurtmalarni) o'chiradi. Agar eski ma'lumotlarni saqlab qolish kerak bo'lsa, oldin backup oling.

Boshqa variant: yangi, bo'sh Neon (yoki Render/Supabase) Postgres bazasi yarating va shuni ishlating.

## 2-qadam: Backend'ni Render'ga deploy qilish

1. Repositoriyani GitHub'ga push qiling (agar hali qilmagan bo'lsangiz).
2. https://dashboard.render.com/blueprints → **New Blueprint Instance** → repo'ni tanlang. Render `render.yaml` faylini avtomatik topadi va 3 ta servisni taklif qiladi.
3. `smartorder-backend` xizmati uchun quyidagi environment variable'larni to'ldiring (Render dashboard → Environment):
   - `DATABASE_URL` — Postgres ulanish satri
   - `BOT_TOKEN` — @BotFather'dan olingan (yangi/rotate qilingan) token
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` — birinchi ishga tushganda avtomatik yaratiladigan admin login/parol
   - `BUSINESS_NAME` — biznes nomi (masalan "Pizza Mania")
   - `MINIAPP_ORIGIN`, `ADMIN_ORIGIN` — 3-4-qadamlardan keyin frontend URL'lari bilan to'ldiriladi (masalan `https://smartorder-miniapp.onrender.com`)
   - `MINIAPP_PUBLIC_URL` — Mini App'ning ochiq URL'i (bot tugmasi shunga yo'naltiradi)
   - `ADMIN_CHAT_IDS` — (ixtiyoriy) yangi buyurtma haqida xabar oladigan Telegram chat ID'lar, vergul bilan
   - `JWT_SECRET` — Render avtomatik generatsiya qiladi (`generateValue: true`), qo'lda kiritish shart emas
4. Deploy tugagach, backend URL'ini oling (masalan `https://smartorder-backend.onrender.com`). Sog'liqni tekshirish: `https://smartorder-backend.onrender.com/api/health` → `{"status":"ok"}` qaytishi kerak.

## 3-qadam: Mini App va Admin Panel'ni deploy qilish

`render.yaml` ikkala frontendni ham statik sayt sifatida tavsiflaydi. Har biri uchun:

1. `VITE_API_URL` environment variable'ini backend URL + `/api` qilib kiriting, masalan: `https://smartorder-backend.onrender.com/api`.
2. Deploy qiling (Vite build vaqtida bu qiymat bundle ichiga yoziladi — shuning uchun uni backend deploy bo'lgandan **keyin** to'ldiring va kerak bo'lsa "Manual Deploy" orqali qayta build qiling).
3. Deploy tugagach ikkala URL'ni yozib oling (masalan `https://smartorder-miniapp.onrender.com` va `https://smartorder-admin.onrender.com`).

## 4-qadam: Backend'ni frontend URL'lari bilan yangilash

Backend xizmatiga qaytib, quyidagilarni to'ldiring va qayta deploy qiling:

- `MINIAPP_ORIGIN` = miniapp URL'i (CORS uchun)
- `ADMIN_ORIGIN` = admin URL'i (CORS uchun)
- `MINIAPP_PUBLIC_URL` = miniapp URL'i (bot tugmasi uchun)

## 5-qadam: Telegram botni sozlash (qo'lda bajariladigan qadam)

1. Telegram'da **@BotFather** bilan suhbatlashing.
2. `/mybots` → botingizni tanlang → **Bot Settings** → **Menu Button** → **Configure Menu Button**.
3. So'ralganda Mini App URL'ini kiriting (3-qadamdagi miniapp URL'i, masalan `https://smartorder-miniapp.onrender.com`).
4. Tugma matnini kiriting, masalan: `🛍 Buyurtma berish`.

Botga `/start` yuborib tekshiring — Mini App tugmasi ochilishi kerak.

### Webhook rejimi (ixtiyoriy, tavsiya etiladi)

Standart holatda bot **polling** rejimida ishlaydi (kod hech narsa o'zgartirmasdan ishlaydi). Agar webhook orqali ishlatmoqchi bo'lsangiz (ko'proq samarali, ba'zi hostinglarda majburiy):

- Backend'da `BOT_WEBHOOK_URL` environment variable'ini backend'ning HTTPS manziliga o'rnating (masalan `https://smartorder-backend.onrender.com`).
- Bot avtomatik ravishda `POST {BOT_WEBHOOK_URL}/api/bot/webhook/{BOT_TOKEN}` manzilini Telegram'ga ro'yxatdan o'tkazadi.

## 6-qadam: Birinchi tekshiruv

1. Admin panelga kiring (`ADMIN_USERNAME`/`ADMIN_PASSWORD` bilan) va **Sozlamalar** bo'limidan biznes nomi, valyuta, yetkazib berish narxi, loyalty foizini o'zingizga moslang.
2. **Kategoriyalar** va **Mahsulotlar** bo'limidan haqiqiy mahsulotlaringizni qo'shing (yoki demo pizza ma'lumotlarini tahrirlang/o'chiring).
3. Botdan `/start` bosib, Mini App orqali test buyurtma bering.
4. Admin panelning **Buyurtmalar** bo'limida buyurtma ko'rinishini va holatni o'zgartirib, Telegram orqali bildirishnoma kelishini tekshiring.
5. **Statistika** bo'limida tushum va grafiklar ko'rinishini tekshiring.

## HTTPS haqida

Render (va Vercel/Netlify/Railway kabi ko'pchilik zamonaviy hostinglar) barcha xizmatlarga avtomatik ravishda bepul HTTPS sertifikat beradi — qo'shimcha sozlash shart emas. Telegram Mini App **faqat HTTPS** manzillar bilan ishlaydi, shuning uchun `localhost`ni to'g'ridan-to'g'ri botga ulab bo'lmaydi (buning uchun local development'da ngrok ishlatiladi, README.md'ga qarang).

## Boshqa biznesga moslashtirish (universal arxitektura)

Kodni o'zgartirmasdan boshqa biznesga (burger, sushi, kiyim, kosmetika...) moslashtirish uchun:

1. Admin panel → **Sozlamalar**: biznes nomi, turi, valyuta, yetkazib berish, loyalty parametrlarini yangilang.
2. Admin panel → **Kategoriyalar**: o'z kategoriyalaringizni yarating (masalan "Burgerlar", "Ichimliklar" yoki "Erkaklar kiyimi", "Ayollar kiyimi").
3. Admin panel → **Mahsulotlar**: mahsulotlaringizni qo'shing, har biriga kategoriya va (ixtiyoriy) cross-sell tavsiyalarini belgilang.
4. Kerak bo'lsa bot username/rasmini @BotFather orqali, Mini App logotipini esa Sozlamalar'dagi "Logo URL" orqali o'zgartiring.

Database schema, API va frontend componentlarning barchasi shu konfiguratsiyaga qarab ishlaydi — "pizza" degan so'z kodning hech bir joyida qattiq yozilmagan (faqat demo seed ma'lumotlarida, ular ixtiyoriy).

## Mijozga 2–3 kunlik sinov berish

Sinov davrida mijoz botni o'z biznesida ishlatib ko'radi. Ikki xil yo'l bor va
ular bir-biridan jiddiy farq qiladi.

**A) Mijozga alohida bot (tavsiya etiladi).** @BotFather'da yangi bot ochiladi,
Render'da yangi backend + yangi baza yaratiladi, katalog mijozning menyusi bilan
to'ldiriladi. Mijozning buyurtmalari va mijozlar bazasi butunlay o'zinikida
qoladi; sinovdan keyin xizmat davom etsa hech narsani ko'chirish shart emas,
to'xtatilsa xizmat o'chiriladi. Bitta bot sozlash ~40 daqiqa.

**B) Demo botni vaqtincha berish.** Tez, lekin bir vaqtning o'zida faqat
**bitta** mijozga: biznes nomi, katalog va buyurtmalar butun bot uchun umumiy,
ya'ni ikki mijoz bir vaqtda sinasa ikkalasi bir xil menyuni ko'radi. Sinov
tugagach demo katalogini qaytadan tiklashga to'g'ri keladi.

Har ikki holatda ham admin panelga kirish mijozga beriladi. Sinov tugagandan
so'ng kirishni qaytarib olish uchun: **Admin panel → Sozlamalar → Admin paroli**
bo'limidan parolni almashtiring. Parol o'zgargan zahoti eski parol bilan
olingan barcha sessiyalar bekor bo'ladi — mijozning ochiq turgan brauzeri ham
darhol chiqib ketadi.

Sinov davrida `KEEP_AWAKE=true` bo'lgani ma'qul: bepul Render xizmati 15 daqiqa
harakatsizlikdan keyin uxlab qoladi va birinchi buyurtma ~50 soniya kutadi,
mijoz esa buni "ishlamayapti" deb tushunadi.

## Bir nechta mijozga bir vaqtda demo qilish

Har bir mijozga alohida **bot + backend + baza** kerak, lekin Mini App va
admin panelni qaytadan deploy qilish shart emas — bitta deploy hammasiga
xizmat qiladi. Backend manzili havolada beriladi:

```
Mini App URL (@BotFather'da):
https://smartorder-miniapp.onrender.com/?api=https://MIJOZ-backend.onrender.com/api

Admin panel (mijozga beriladigan havola):
https://smartorder-admin.onrender.com/?api=https://MIJOZ-backend.onrender.com/api
```

Havola bir marta ochilsa manzil eslab qolinadi, keyin parametrsiz ham
ishlayveradi. Xavfsizlik uchun faqat `onrender.com` manzillari qabul
qilinadi. Admin sessiyasi har bir backend uchun alohida saqlanadi, shuning
uchun bir telefondan bir nechta mijoz panelini ochib turish mumkin.

**Yangi mijoz uchun qadamlar (~30 daqiqa):**

1. @BotFather → yangi bot → token
2. Neon'da o'sha loyihada yangi **database** (yangi loyiha ochish shart emas)
3. Render → New Web Service → shu repozitoriy → `BOT_TOKEN`, `DATABASE_URL`,
   `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`
4. Admin panelga yuqoridagi `?api=` havolasi bilan kiring → Sozlamalar →
   biznes nomi → Mahsulotlar → menyuni ro'yxat bilan qo'shish
5. @BotFather → Mini App URL'ni yuqoridagidek qilib qo'ying

**Bepul tarif chegarasi:** Render'da barcha xizmatlar uchun oyiga 750 soat
beriladi va xizmat 15 daqiqa harakatsizlikdan keyin uxlaydi. Shuning uchun
bir vaqtda 4–5 ta demo backend bemalol sig'adi, lekin `KEEP_AWAKE=true`ni
faqat hozir ko'rsatayotgan bittasida yoqing — u xizmatni uxlatmaydi va
soatlarni tez yeydi.

## Mijozning menyusini deploy orqali yuklash

Menyuni admin paneldan qo'lda kiritish o'rniga, uni **fayl** ko'rinishida
tayyorlab, deploy paytida yuklash mumkin. Mijozga tayyor bot ko'rsatish
uchun eng tez yo'l — biznes nomi, telefoni, valyutasi, butun katalogi va
qo'shimcha tavsiyalari bitta faylda keladi.

**Qanday ishlaydi:**

1. Katalog fayli: `backend/prisma/catalogs/<nom>.json`
2. Render'da o'sha xizmatga `APPLY_CATALOG=<nom>` qo'shiladi
3. Keyingi deployda katalog o'z-o'zidan yuklanadi

**Ikkita himoya bor:**

- `APPLY_CATALOG` qo'yilmagan deploymentga umuman tegmaydi — ya'ni boshqa
  mijozlarning serverlari xavfsiz
- Yuklangandan keyin `Settings.appliedCatalog` ga belgi yoziladi, shuning
  uchun har bir deployda takrorlanmaydi va egasining keyingi
  o'zgartirishlari saqlanib qoladi. Qayta yuklash kerak bo'lsa, fayldagi
  `revision` raqami oshiriladi.

Eski buyurtmalar saqlanadi: har bir buyurtma qatorida mahsulot nomi va
narxi alohida yozilgan, tozalash faqat mahsulotga bog'lanishni uzadi.

Rasm yuklanmagan mahsulotlarga nomiga qarab belgi qo'yiladi (pitsa → 🍕,
xot-dog → 🌭, shaverma → 🌯), keyin egasi panel orqali haqiqiy rasmlarini
qo'yishi mumkin.
