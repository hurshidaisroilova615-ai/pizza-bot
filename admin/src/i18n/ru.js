// Every word the admin panel says, in Russian.
//
// The keys are the Uzbek originals rather than invented names. Two reasons:
// a screen that has not been translated yet shows readable Uzbek instead of
// a bare key, and there is no second file to keep in step when wording
// changes — the string in the JSX is the lookup.
//
// The owner picks their language in Settings; this is what the panel is
// translated into. A cafe in Osh cannot run a shop that only speaks Uzbek
// at it every morning.
export const RU = {
  // --- Navigation and shell -------------------------------------------
  "Statistika": "Статистика",
  "Buyurtmalar": "Заказы",
  "Mahsulotlar": "Товары",
  "Kategoriyalar": "Категории",
  "Mijozlar (CRM)": "Клиенты (CRM)",
  "Promo kodlar": "Промокоды",
  "Maxsus takliflar": "Спецпредложения",
  "Stol QR kodlari": "QR-коды столиков",
  "Sozlamalar": "Настройки",
  "Chiqish": "Выйти",
  "Shu nusxa qachon yig'ilgan": "Когда собрана эта версия",
  "Versiya": "Версия",
  "Admin": "Админ",
  "Ro'yxatdan olib tashlash": "Убрать из списка",

  // --- Shared ----------------------------------------------------------
  "Yuklanmoqda...": "Загрузка...",
  "Saqlash": "Сохранить",
  "Saqlanmoqda...": "Сохранение...",
  "Saqlandi ✓": "Сохранено ✓",
  "Bekor qilish": "Отмена",
  "Yopish": "Закрыть",
  "O'chirish": "Удалить",
  "Tahrirlash": "Изменить",
  "Qayta urinish": "Повторить",
  "Qo'llash": "Применить",
  "Nomi": "Название",
  "Narx": "Цена",
  "Turi": "Тип",
  "Holati": "Статус",
  "Sana": "Дата",
  "Jami": "Итого",
  "Izoh": "Комментарий",
  "Mijoz": "Клиент",
  "Telefon": "Телефон",
  "Ism": "Имя",
  "Rasm": "Фото",
  "Kod": "Код",
  "Limit": "Лимит",
  "Muddati": "Срок",
  "Chegirma": "Скидка",
  "Kategoriya": "Категория",
  "Ma'lumot yo'q": "Нет данных",
  "Yo'q": "Нет",
  "Barchasi": "Все",
  "Faol": "Активен",
  "Nofaol": "Неактивен",
  "Mavjud": "В наличии",
  "Tanlanmagan": "Не выбрано",
  "Yangilash": "Обновить",
  "Saralash": "Сортировка",
  "Ma'lumotlarni olishda xatolik": "Ошибка при загрузке данных",

  // --- Login -----------------------------------------------------------
  "🛍 Admin Panel": "🛍 Админ-панель",
  "Boshqaruv paneliga kirish": "Вход в панель управления",
  "Login": "Логин",
  "Parol": "Пароль",
  "Kirish": "Войти",
  "Tekshirilmoqda...": "Проверка...",

  // --- Dashboard -------------------------------------------------------
  "Bugungi tushum": "Выручка за сегодня",
  "Haftalik tushum": "Выручка за неделю",
  "Oylik tushum": "Выручка за месяц",
  "O'rtacha buyurtma": "Средний чек",
  "Yangi mijozlar (bugun)": "Новые клиенты (сегодня)",
  "Yangi mijozlar (hafta)": "Новые клиенты (неделя)",
  "Oxirgi 30 kunlik tushum": "Выручка за последние 30 дней",
  "Buyurtmalar holati": "Статусы заказов",
  "Eng ko'p sotilgan mahsulotlar": "Самые продаваемые товары",
  "Tushum": "Выручка",

  // --- Order statuses --------------------------------------------------
  "Qabul qilindi": "Принят",
  "Tayyorlanmoqda": "Готовится",
  "Kuryerda": "У курьера",
  "Yetkazildi": "Доставлен",
  "Bekor qilindi": "Отменён",
  "Olib ketishga tayyor": "Готов к самовывозу",
  "Topshirildi": "Выдан",
  "Stolga olib borilmoqda": "Несут к столику",
  "Berildi": "Подан",

  // --- Orders ----------------------------------------------------------
  "Hozircha buyurtmalar yo'q": "Заказов пока нет",
  "Keyingi qadam": "Следующий шаг",
  "Buyurtma turi": "Тип заказа",
  "Holatni o'zgartirish": "Изменить статус",
  "Manzil ko'rsatilmagan": "Адрес не указан",
  "Telefon ko'rsatilmagan": "Телефон не указан",
  "Mijoz o'zi olib ketadi": "Клиент забирает сам",

  // --- Products --------------------------------------------------------
  "+ Yangi mahsulot": "+ Новый товар",
  "Hozircha mahsulotlar yo'q": "Товаров пока нет",
  "Eski narx": "Старая цена",
  "Katalogni tozalash": "Очистить каталог",
  "📋 Menyuni ro'yxat bilan qo'shish": "📋 Добавить меню списком",
  "✅ Bor": "✅ Есть",
  "🚫 Tugadi": "🚫 Закончилось",
  "Bosing — yana sotuvga qaytadi": "Нажмите — снова в продаже",
  "Bosing — «Tugadi» qilib qo'yiladi": "Нажмите — пометить «закончилось»",
  "Yangi mahsulot qo'shish": "Добавить товар",
  "Mahsulotni tahrirlash": "Изменить товар",
  "Tarkibi / tavsif (vergul bilan ajrating)": "Состав / описание (через запятую)",
  "Tavsiya etilgan qo'shimcha (upsell)": "Рекомендуемое дополнение (upsell)",
  "Bunga mos qo'shimchalar (cross-sell)": "Подходящие дополнения (cross-sell)",
  "Mahsulot uchun rasm yuklang yoki havola kiriting": "Загрузите фото товара или вставьте ссылку",

  // --- Categories ------------------------------------------------------
  "+ Yangi kategoriya": "+ Новая категория",
  "Hozircha kategoriyalar yo'q": "Категорий пока нет",
  "Mahsulotlar soni": "Количество товаров",
  "Ikon": "Иконка",
  "Emoji / ikon": "Эмодзи / иконка",
  "Yangi kategoriya": "Новая категория",
  "Kategoriyani tahrirlash": "Изменить категорию",
  "Tartib raqami": "Порядковый номер",

  // --- Customers -------------------------------------------------------
  "Mijozlar topilmadi": "Клиенты не найдены",
  "Ism, telefon yoki Telegram ID bo'yicha qidirish": "Поиск по имени, телефону или Telegram ID",
  "Jami xarid": "Всего куплено",
  "Oxirgi buyurtma": "Последний заказ",
  "Bonus ball": "Бонусные баллы",
  "Bonus balansni to'g'rilash": "Скорректировать бонусный баланс",
  "+50 yoki -20": "+50 или -20",
  "Buyurtmalar tarixi": "История заказов",
  "Eng ko'p buyurtma qilingan mahsulotlar": "Чаще всего заказывает",
  "Ma'lumotlar": "Данные",

  // --- Promo codes -----------------------------------------------------
  "+ Yangi promo kod": "+ Новый промокод",
  "Hozircha promo kodlar yo'q": "Промокодов пока нет",
  "Amal qilish muddati": "Срок действия",
  "Ishlatilgan": "Использован",
  "Min. buyurtma": "Мин. заказ",
  "Yangi promo kod": "Новый промокод",
  "Promo kodni tahrirlash": "Изменить промокод",
  "Foizli (%)": "В процентах (%)",
  "Aniq summa": "Фиксированная сумма",
  "Qiymati": "Значение",
  "Minimal buyurtma": "Минимальный заказ",
  "Umumiy limit (bo'sh = cheksiz)": "Общий лимит (пусто = без ограничений)",
  "Har mijoz uchun limit": "Лимит на одного клиента",
  "Faqat yangi mijozlar uchun": "Только для новых клиентов",
  "Boshlanish sanasi": "Дата начала",
  "Tugash sanasi": "Дата окончания",

  // --- Offers ----------------------------------------------------------
  "+ Yangi taklif": "+ Новое предложение",
  "Hozircha takliflar yo'q": "Предложений пока нет",
  "Yangi maxsus taklif": "Новое спецпредложение",
  "Taklifni tahrirlash": "Изменить предложение",
  "Sarlavha": "Заголовок",
  "Xabar matni": "Текст сообщения",
  "Rasm URL (ixtiyoriy)": "Ссылка на фото (необязательно)",
  "Bog'liq promo kod (ixtiyoriy)": "Связанный промокод (необязательно)",
  "Maqsadli auditoriya": "Кому отправить",
  "Barcha mijozlar": "Всем клиентам",
  "Yangi mijozlar": "Новым клиентам",
  "Sodiq mijozlar": "Постоянным клиентам",
  "Sodiq mijozlar (5+ buyurtma)": "Постоянным клиентам (5+ заказов)",
  "Nofaol mijozlar": "Неактивным клиентам",
  "Uzoq vaqt buyurtma bermaganlar (30+ kun)": "Давно не заказывали (30+ дней)",
  "Yuborish": "Отправить",
  "Yuborilmoqda...": "Отправка...",

  // --- Tables / QR -----------------------------------------------------
  "Sozlash": "Настройка",
  "Chop etish": "Печать",
  "Do'kon sayti manzili": "Адрес сайта заведения",
  "Stollar soni": "Количество столиков",
  "Umumiy kod": "Общий код",
  "Zaldan buyurtma (stoldagi QR kod orqali)": "Заказ в зале (по QR-коду на столике)",
  "Kodni skanerlang va buyurtma bering": "Отсканируйте код и сделайте заказ",
  "Kodni skanerlang, buyurtma bering va stol raqamini yozing":
    "Отсканируйте код, сделайте заказ и укажите номер столика",
  "Sayt manzilini kiriting — kodlar shu yerda chiqadi.":
    "Введите адрес сайта — коды появятся здесь.",
  "1. Umumiy kod": "1. Общий код",
  "2. Har stolga o'z kodi": "2. Свой код для каждого столика",

  // --- Currency converter ----------------------------------------------
  "Narxlarni boshqa valyutaga o'tkazish": "Перевод цен в другую валюту",
  "Natijani ko'rish": "Показать результат",
  "Hisoblanmoqda...": "Считаем...",
  "Kurs (1 yangi valyuta necha eskiga teng)": "Курс (1 новая валюта = сколько старой)",
  "Yaxlitlash": "Округление",
  "Yangi valyuta belgisi": "Обозначение новой валюты",
  "So'mdan somga (O'zbekiston → Qirg'iziston)": "Из сума в сом (Узбекистан → Кыргызстан)",
  "Somdan so'mga (Qirg'iziston → O'zbekiston)": "Из сома в сум (Кыргызстан → Узбекистан)",

  // --- Settings --------------------------------------------------------
  "Biznes sozlamalari": "Настройки бизнеса",
  "Sozlamalarni saqlash": "Сохранить настройки",
  "Sozlamalarni yuklab bo'lmadi.": "Не удалось загрузить настройки.",
  "Brend": "Бренд",
  "Biznes nomi": "Название бизнеса",
  "Biznes turi": "Тип бизнеса",
  "Valyuta": "Валюта",
  "Asosiy rang": "Основной цвет",
  "Logo URL": "Ссылка на логотип",
  "Sizning tilingiz (buyurtma xabarlari)": "Ваш язык (уведомления о заказах)",
  "O'zbekcha": "Узбекский",
  "Русский": "Русский",
  "Yetkazib berish va buyurtma": "Доставка и заказ",
  "Yetkazib berish narxi": "Стоимость доставки",
  "Bepul yetkazish chegarasi (bo'sh = yo'q)": "Бесплатная доставка от (пусто = нет)",
  "Minimal buyurtma summasi": "Минимальная сумма заказа",
  "Ish vaqti": "Часы работы",
  "Ochilish vaqti": "Время открытия",
  "Yopilish vaqti": "Время закрытия",
  "Vaqt mintaqasi (UTC+)": "Часовой пояс (UTC+)",
  "O'zbekiston 5, Qirg'iziston 6": "Узбекистан 5, Кыргызстан 6",
  "Ikkala katak bo'sh bo'lsa, bot doim buyurtma qabul qiladi.":
    "Если оба поля пусты, заказы принимаются круглосуточно.",
  "Buyurtma va to'lov turlari": "Способы получения и оплаты",
  "Yetkazib berish": "Доставка",
  "Olib ketish (mijoz o'zi keladi — yetkazish narxi olinmaydi)":
    "Самовывоз (клиент забирает сам — доставка не взимается)",
  "Olib ketish manzili": "Адрес самовывоза",
  "Mijoz qaerdan oladi": "Откуда забирает клиент",
  "Karta orqali to'lov (mijoz naqd yoki karta tanlaydi)":
    "Оплата картой (клиент выбирает наличные или карту)",
  "Karta raqami": "Номер карты",
  "Karta egasining ismi": "Имя владельца карты",
  "Masalan: Alisher T.": "Например: Алишер Т.",
  "Loyalty (bonus ball) tizimi": "Бонусная программа",
  "Loyalty tizimi yoqilgan": "Бонусная программа включена",
  "Ball to'plash foizi (masalan 0.05 = 5%)": "Процент начисления баллов (например 0.05 = 5%)",
  "1 ball = necha pul birligi": "1 балл = сколько денег",
  "Aloqa va xabarlar": "Связь и уведомления",
  "Qo'llab-quvvatlash telefoni": "Телефон поддержки",
  "Qo'llab-quvvatlash Telegram username": "Telegram-ник поддержки",
  "Yangi buyurtma xabari kimga kelsin": "Кому приходят уведомления о заказах",
  "Botning /start xabari": "Приветствие бота (/start)",
  "Mini App bosh sahifasidagi tavsif": "Описание на главной странице",

  // --- Password --------------------------------------------------------
  "Parolni o'zgartirish": "Смена пароля",
  "Admin paroli": "Пароль администратора",
  "Joriy parol": "Текущий пароль",
  "Yangi parol": "Новый пароль",
  "Yangi parolni takrorlang": "Повторите новый пароль",
  "Parol o'zgartirildi ✓": "Пароль изменён ✓",
  "Yangi parol kamida 6 ta belgidan iborat bo'lsin": "Новый пароль должен быть не короче 6 символов",
  "Yangi parol ikkala katakda bir xil yozilishi kerak": "Новый пароль должен совпадать в обоих полях",

  // --- Bulk import / clear ---------------------------------------------
  "Menyuni ro'yxat bilan qo'shish": "Добавить меню списком",
  "Menyu ro'yxati": "Список меню",
  "Menyu qo'shildi": "Меню добавлено",
  "Qo'shilmoqda...": "Добавление...",
  "Tayyor:": "Готово:",
  "O'chirilmoqda...": "Удаление...",

  // --- Image field -----------------------------------------------------
  "Mahsulot rasmi": "Фото товара",
  "Rasm yuklash": "Загрузить фото",
  "Rasmni almashtirish": "Заменить фото",
  "Rasmni o'qib bo'lmadi": "Не удалось прочитать фото",
  "Rasmni siqib bo'lmadi": "Не удалось сжать фото",
  "yoki rasm havolasini shu yerga qo'ying": "или вставьте сюда ссылку на фото",

  // --- Explanations ----------------------------------------------------
  "Bu yerdagi sozlamalar Mini App va botga darhol ta'sir qiladi. Shu forma orqali platformani istalgan biznes turiga (pizza, burger, sushi, kiyim, kosmetika va h.k.) moslashtirishingiz mumkin — kodni o'zgartirish shart emas.":
    "Настройки применяются к приложению и боту сразу. Через эту форму платформу можно подстроить под любой вид бизнеса (пицца, бургеры, суши, одежда, косметика и т.д.) — менять код не нужно.",
  "Ish vaqtidan tashqarida bot buyurtma qabul qilmaydi va mijozga qachon ochilishini aytadi. Tunda yopiladigan joylar uchun yopilish vaqti ochilishdan kichik bo'lishi mumkin — masalan 07:00 dan 02:00 gacha.":
    "Вне рабочих часов бот не принимает заказы и сообщает клиенту, когда вы откроетесь. Если заведение закрывается ночью, время закрытия может быть меньше времени открытия — например с 07:00 до 02:00.",
  "Mijoz «Karta» ni tanlaganda shu raqam ko'rsatiladi va u pulni o'tkazib, chekni botga yuboradi. Raqam kiritilmasa, mijozga karta varianti umuman ko'rsatilmaydi. Bu Payme yoki Click orqali avtomatik to'lov emas — pul to'g'ridan-to'g'ri shu kartaga tushadi va tushganini o'zingiz tekshirasiz.":
    "Когда клиент выбирает «Карта», ему показывается этот номер: он переводит деньги и отправляет чек боту. Если номер не указан, вариант оплаты картой клиенту не показывается вовсе. Это не автоматическая оплата через Payme или Click — деньги приходят прямо на эту карту, и поступление вы проверяете сами.",
  "Mijoz stoldagi kodni skanerlaydi, menyu ochiladi, buyurtma beradi. Hech narsa o'rnatish kerak emas. Ikki usuldan birini tanlang:":
    "Клиент сканирует код на столике, открывается меню, он делает заказ. Ничего устанавливать не нужно. Выберите один из двух способов:",
  "Zaldan buyurtma o'chirilgan — kod skanerlansa oddiy menyu ochiladi, stol raqami qo'shilmaydi.":
    "Заказ в зале выключен — при сканировании откроется обычное меню, номер столика добавлен не будет.",
  "Rasmlar hozircha belgi ko'rinishida. Xohlagan mahsulotni ochib, o'z rasmini yuklashingiz mumkin.":
    "Пока вместо фото — заглушки. Любой товар можно открыть и загрузить своё фото.",
  "Menyuni bor holicha qo'ying — har bir taom alohida qatorda, narxi qator oxirida. Narxsiz qator kategoriya deb olinadi va undan keyingi taomlar shu kategoriyaga tushadi. Yo'q kategoriyalar o'zi yaratiladi.":
    "Вставьте меню как есть — каждое блюдо на своей строке, цена в конце строки. Строка без цены считается категорией, и следующие блюда попадают в неё. Недостающие категории создадутся сами.",
  "Eski buyurtmalar joyida qoladi — har bir buyurtmada mahsulot nomi va narxi alohida saqlangan.":
    "Старые заказы останутся на месте — в каждом заказе название и цена товара сохранены отдельно.",
  "Menyudagi barcha narxlar, yetkazib berish narxi, minimal summa va belgilangan summali promo kodlar birdan o'zgaradi. Avval natijani ko'rsatadi — rozi bo'lsangiz saqlaysiz.":
    "Все цены меню, стоимость доставки, минимальная сумма и промокоды с фиксированной суммой изменятся сразу. Сначала показывается результат — сохраняете, если согласны.",
  "— bitta kodni ko'paytirib har stolga yopishtirasiz. Stol raqamlarini alohida qo'yasiz, mijoz o'zi yozadi. Arzon, va stollar joyi o'zgarsa qayta chop etish shart emas.":
    "— один код печатается в нескольких копиях и наклеивается на каждый столик. Номера столиков вы ставите отдельно, клиент вписывает их сам. Дешевле, и при перестановке столиков ничего перепечатывать не нужно.",
  "— stol raqami kodning ichida bo'ladi, mijoz hech narsa yozmaydi va adashmaydi. Stollar soni kiritilsa, pastda chiqadi.":
    "— номер столика зашит в самом коде, клиент ничего не вписывает и не ошибается. Укажите количество столиков — коды появятся ниже.",
  "Telegram ID raqamini bilish uchun botga":
    "Чтобы узнать свой Telegram ID, напишите боту",
  "deb yozing — u raqamingizni qaytaradi. Bir nechta bo'lsa vergul bilan ajrating.":
    "— он пришлёт ваш номер. Если получателей несколько, разделите запятыми.",

  // --- Counted and interpolated -----------------------------------------
  // Three forms, because Russian picks one by the number in front of it.
  "{n} ta buyurtma": ["{n} заказ", "{n} заказа", "{n} заказов"],
  "{n} ta mahsulot": ["{n} товар", "{n} товара", "{n} товаров"],
  "{n} ta mahsulotni qo'shish": ["Добавить {n} товар", "Добавить {n} товара", "Добавить {n} товаров"],
  "{n} ta mahsulotni o'chirish": ["Удалить {n} товар", "Удалить {n} товара", "Удалить {n} товаров"],
  " (hozir {n} ta kategoriya bor)": [
    " (сейчас {n} категория)",
    " (сейчас {n} категории)",
    " (сейчас {n} категорий)",
  ],

  "«{name}» mahsulotini o'chirmoqchimisiz?": "Удалить товар «{name}»?",
  "«{name}» kategoriyasini o'chirmoqchimisiz?": "Удалить категорию «{name}»?",
  "«{code}» promo kodini o'chirmoqchimisiz?": "Удалить промокод «{code}»?",
  "«{title}» taklifini o'chirmoqchimisiz?": "Удалить предложение «{title}»?",
  "«{title}» — {segment}?": "«{title}» — {segment}?",
  "Yuborildi: {sent}/{total} mijozga": "Отправлено: {sent}/{total} клиентам",
  "Yuborib bo'lmadi: {message}": "Не удалось отправить: {message}",
  "O'zgartirib bo'lmadi: {message}": "Не удалось изменить: {message}",
  "Holatni o'zgartirib bo'lmadi: {message}": "Не удалось изменить статус: {message}",

  "va bo'sh qolgan kategoriyalar o'chiriladi": "и оставшиеся пустыми категории будут удалены",
  ". Buni qaytarib bo'lmaydi.": ". Это действие нельзя отменить.",
  "Shundan keyin yangi menyuni": "После этого новое меню добавляется через",
  "«Menyuni ro'yxat bilan qo'shish»": "«Добавить меню списком»",
  "orqali qo'yasiz.": ".",
  "Parolni o'zgartirsangiz, boshqa qurilmalardagi kirishlar darhol uziladi. Botni birovga sinab ko'rish uchun bergan bo'lsangiz, shu yerdan parolni almashtirib kirishni qaytarib olasiz.":
    "После смены пароля входы на других устройствах сразу прекратятся. Если вы давали доступ кому-то для пробы, смените пароль здесь и заберите вход обратно.",

  // --- Order list wording ----------------------------------------------
  // Assembled at render time from a table and a table number, so these are
  // looked up piece by piece rather than as finished sentences.
  "Olib ketadi": "Самовывоз",
  "Zalda": "В зале",
  "Stol": "Столик",
  "Yetkazish": "Доставка",
  "Karta": "Карта",
  "Naqd": "Наличные",

  // --- Payment received -------------------------------------------------
  "To'landi": "Оплачено",
  "Hali to'lanmagan": "Ещё не оплачено",
};

export default RU;
