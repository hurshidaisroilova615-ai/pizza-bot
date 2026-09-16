# 🛍 SmartOrder — Telegram Mini App savdo platformasi

Kichik bizneslar uchun to'liq savdo platformasi: Telegram Mini App (mijozlar uchun), Admin Dashboard (boshqaruv uchun) va Telegram bot bildirishnomalari. Boshlang'ich holatda pizza yetkazib berish uchun sozlangan, lekin **kod hech qanday biznes turiga qattiq bog'lanmagan** — Admin panel orqali istalgan kichik biznesga (burger, sushi, kiyim, kosmetika va h.k.) o'zgartirib bo'ladi.

## Xususiyatlar

- **CRM** — mijozlar bazasi, buyurtmalar soni, jami xarid summasi, oxirgi buyurtma, sevimli mahsulotlar
- **Promo kodlar** — foizli/aniq summali, muddat, limit, minimal buyurtma, faqat yangi mijozlar uchun
- **Loyalty (bonus ball)** — har buyurtmadan ball, balansni ko'rish, ball bilan to'lash
- **Reorder** — oldingi buyurtmani bir tugma bilan qayta savatga qo'shish
- **Buyurtma holati** — Qabul qilindi → Tayyorlanmoqda → Kuryerda → Yetkazildi, har bir o'zgarishda Telegram bildirishnomasi
- **Analytics** — kunlik/haftalik/oylik tushum, buyurtmalar soni, yangi mijozlar, o'rtacha chek, top mahsulotlar, grafiklar
- **Upsell / Cross-sell** — mahsulotga mos qo'shimchalarni tavsiya qilish
- **Maxsus takliflar** — mijoz segmentlariga (yangi/sodiq/nofaol) maqsadli xabarlar yuborish
- **To'liq buyurtma boshqaruvi** va **mahsulot boshqaruvi** admin panelda
- **Universal konfiguratsiya** — biznes nomi, valyuta, kategoriyalar, narxlar — hammasi Admin panel orqali, kod o'zgarishisiz

## Arxitektura

```
backend/   Node.js + Express + Prisma + PostgreSQL + Telegram bot
miniapp/   Telegram Mini App (React + Vite, mobile-first)
admin/     Admin Dashboard (React + Vite + Router + Recharts)
```

Xavfsizlik: Mini App so'rovlari Telegram'ning imzolangan `initData` (HMAC) orqali tasdiqlanadi, admin panel esa JWT autentifikatsiyasidan foydalanadi.

## Local development

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # qiymatlarni to'ldiring (yoki mavjud .env'dan foydalaning)
npx prisma migrate dev
npm run seed            # demo mahsulotlar + admin login (.env dagi ADMIN_USERNAME/ADMIN_PASSWORD) yaratadi
npm run dev
```

Backend `http://localhost:4000` da, Telegram bot esa polling rejimida ishga tushadi.

### 2. Mini App

```bash
cd miniapp
npm install
cp .env.example .env
npm run dev
```

`http://localhost:5173` — brauzerda ham (mock foydalanuvchi bilan), Telegram ichida ham ishlaydi.

### 3. Admin Dashboard

```bash
cd admin
npm install
cp .env.example .env
npm run dev
```

`http://localhost:5174` ga kiring va `.env` faylidagi `ADMIN_USERNAME`/`ADMIN_PASSWORD` bilan tizimga kiring.

### 4. Botni Telegram bilan bog'lash (ngrok)

Telegram Mini App HTTPS talab qiladi. Local test uchun:

```bash
ngrok http 5173
```

Olingan HTTPS manzilni @BotFather → Bot Settings → Menu Button orqali botga bog'lang.

Windows foydalanuvchilar uchun har bir papkada tayyor `.bat` fayllar bor (`1-ornatish.bat`, `2-migratsiya.bat`, ...) — ularni ketma-ket ikki marta bosish kifoya, batafsili `0-BOSHLASH-BU-YERDAN.txt` faylida.

## Production deploy

To'liq bosqichma-bosqich yo'riqnoma: **[DEPLOYMENT.md](./DEPLOYMENT.md)** (Render.com orqali bepul deploy, boshqa hostinglar uchun ham yo'l-yo'riq bilan).

## Boshqa biznesga moslashtirish

Admin panel → **Sozlamalar** bo'limidan biznes nomi, valyuta, yetkazib berish qoidalari va loyalty sozlamalarini, **Kategoriyalar**/**Mahsulotlar** bo'limidan esa o'z assortimentingizni sozlang. Batafsil: DEPLOYMENT.md'ning oxirgi bo'limi.
