-- Seed content. Real projects and bots pulled from github.com/babakdevgeek.
-- Edit freely: the frontend reads whatever is here, nothing is hardcoded.

DELETE FROM project_translations;
DELETE FROM projects;
DELETE FROM bot_translations;
DELETE FROM bots;

-- ---------------------------------------------------------------- projects

INSERT INTO projects (id, slug, order_index, featured, year, kind, github_url, demo_url, technologies, images, accent) VALUES
('prj_scrapeforge', 'scrapeforge', 10, 1, '2026', 'tool',
  'https://github.com/babakdevgeek/scrapeforge', NULL,
  '["TypeScript","React","Vite","Fastify","Prisma","Playwright","SQLite"]',
  '[]', '128'),
('prj_mindlink', 'mindlink', 20, 1, '2025', 'app',
  'https://github.com/babakdevgeek/mindlink', NULL,
  '["TypeScript","React","Node","yt-dlp"]',
  '[]', '318'),
('prj_bulletjournal', 'ai-powered-bullet-journal', 30, 1, '2026', 'app',
  'https://github.com/babakdevgeek/ai-powered-bullet-journal', NULL,
  '["JavaScript","LLM APIs","IndexedDB"]',
  '[]', '58'),
('prj_cryptodash', 'vanilla-js-crypto-dashboard', 40, 0, '2026', 'experiment',
  'https://github.com/babakdevgeek/vanila-js-crypto-dashboard', NULL,
  '["Vanilla JS","Canvas","WebSocket","CSS"]',
  '[]', '196'),
('prj_btcchart', 'btc-live-chart', 50, 0, '2026', 'experiment',
  'https://github.com/babakdevgeek/btc-live-chart', NULL,
  '["JavaScript","Canvas","WebSocket"]',
  '[]', '196'),
('prj_contract', 'simple-contract', 60, 0, '2025', 'contract',
  'https://github.com/babakdevgeek/simple-contract', NULL,
  '["Solidity","Hardhat","EVM"]',
  '[]', '278');

INSERT INTO project_translations (project_id, lang, title, tagline, description, body) VALUES
('prj_scrapeforge', 'en', 'ScrapeForge', 'Point at a page. Get structured data.',
  'A self-hosted visual scraping platform. You pick elements in a real browser instead of writing selectors by hand, and it turns the result into a repeatable, scheduled job with typed output.',
  '### Why I built it

Every scraping job I wrote started the same way: open devtools, copy a selector, watch it break a week later. ScrapeForge moves that work into the browser itself. You click what you want, it infers the pattern across siblings, and the recipe survives layout changes better than a hand-written selector.

### How it works

A Fastify API drives a pool of Playwright contexts. Recipes are stored in SQLite through Prisma, runs are queued, and the React client streams progress over a socket. Everything runs on localhost, so credentials and scraped data never leave the machine.

### What was hard

Selector inference. Getting from *one clicked element* to *the right generalisation* is the whole product, and naive nth-child paths generalise terribly.'),
('prj_scrapeforge', 'fa', 'اسکریپ‌فورج', 'روی صفحه کلیک کن، داده ساخت‌یافته بگیر.',
  'یک پلتفرم استخراج داده‌ی بصری و کاملاً self-hosted. به‌جای نوشتن دستی سلکتور، عناصر را داخل یک مرورگر واقعی انتخاب می‌کنی و خروجی به یک job زمان‌بندی‌شده با ساختار مشخص تبدیل می‌شود.',
  '### چرا ساختمش

هر اسکریپر‌ی که می‌نوشتم یک الگوی تکراری داشت: باز کردن devtools، کپی کردن سلکتور، و خراب شدنش یک هفته بعد. ScrapeForge این کار را به داخل خود مرورگر منتقل می‌کند.

### چطور کار می‌کند

یک API روی Fastify مجموعه‌ای از کانتکست‌های Playwright را مدیریت می‌کند. دستورها در SQLite و از طریق Prisma ذخیره می‌شوند و کلاینت React پیشرفت اجرا را زنده نمایش می‌دهد. همه‌چیز روی localhost اجرا می‌شود.'),

('prj_mindlink', 'en', 'MindLink', 'Media downloader that does not insult you.',
  'A clean front end for pulling media off the web. The interesting part was not the download, it was making a long-running, failure-prone job feel calm and legible in the interface.',
  '### The real problem

Downloaders are ugly because the underlying process is ugly: variable bitrates, partial failures, format negotiation, progress that lies. MindLink treats those as UI problems. Every job shows what it is actually doing, and a failure explains itself instead of turning red.'),
('prj_mindlink', 'fa', 'مایندلینک', 'دانلودر رسانه‌ای که به تو توهین نمی‌کند.',
  'یک رابط تمیز برای گرفتن محتوا از وب. بخش جذاب ماجرا خود دانلود نبود، بلکه این بود که یک فرآیند طولانی و مستعد خطا در رابط کاربری آرام و قابل‌فهم به نظر برسد.',
  '### مسئله‌ی اصلی

دانلودرها زشت‌اند چون فرآیند زیرشان زشت است. MindLink این‌ها را مسئله‌ی رابط کاربری می‌داند: هر job دقیقاً می‌گوید چه می‌کند و هر خطا خودش را توضیح می‌دهد.'),

('prj_bulletjournal', 'en', 'AI Bullet Journal', 'Rapid logging, with something reading over your shoulder.',
  'A bullet journal that keeps the original method intact and adds one thing: a model that reads the log and tells you what you keep migrating instead of doing.',
  '### Design constraint

The fastest way to ruin a journal is to make writing in it slow. So the AI never sits in the input path. You log the way you always did; analysis happens after, on demand, over the whole log.'),
('prj_bulletjournal', 'fa', 'بولت ژورنال هوشمند', 'ثبت سریع، با کسی که از بالای شانه‌ات می‌خواند.',
  'یک بولت ژورنال که روش اصلی را دست‌نخورده نگه می‌دارد و فقط یک چیز اضافه می‌کند: مدلی که لاگ را می‌خواند و می‌گوید چه کارهایی را مدام جابه‌جا می‌کنی بدون این‌که انجام دهی.',
  '### محدودیت طراحی

سریع‌ترین راه خراب کردن یک ژورنال، کند کردن نوشتن در آن است. پس هوش مصنوعی هرگز در مسیر ورودی قرار نمی‌گیرد.'),

('prj_cryptodash', 'en', 'Crypto Dashboard, no framework',
  'Zero dependencies. On purpose.',
  'A live market dashboard written in plain JavaScript with hand-drawn canvas charts. Built to find out how much of React I actually needed. Answer: less than I expected, and more than I wanted to admit.',
  NULL),
('prj_cryptodash', 'fa', 'داشبورد کریپتو، بدون فریم‌ورک', 'صفر وابستگی. از روی قصد.',
  'یک داشبورد بازار زنده با جاوااسکریپت خالص و چارت‌های دست‌ساز روی canvas. ساختمش تا ببینم واقعاً چقدر به React نیاز دارم. جواب: کمتر از آنچه فکر می‌کردم، و بیشتر از آنچه دوست دارم بپذیرم.',
  NULL),

('prj_btcchart', 'en', 'BTC Live Chart', 'One chart, done properly.',
  'A single-purpose price chart focused on smooth streaming updates without dropping frames: ring buffers, off-thread math, and no re-render of anything that has not changed.',
  NULL),
('prj_btcchart', 'fa', 'چارت زنده بیت‌کوین', 'یک چارت، درست انجام‌شده.',
  'یک چارت قیمت تک‌منظوره با تمرکز بر آپدیت‌های استریم نرم و بدون افت فریم: ring buffer، محاسبات خارج از ترد اصلی، و بدون رندر مجدد چیزی که تغییر نکرده.',
  NULL),

('prj_contract', 'en', 'Deposit-Capped Contract', 'A small Solidity study.',
  'A minimal contract with per-address deposit ceilings, an owner transfer path, and unrestricted addresses that bypass the cap. Written to understand the failure modes rather than to ship a product.',
  NULL),
('prj_contract', 'fa', 'قرارداد با سقف واریز', 'یک تمرین کوچک در سالیدیتی.',
  'یک قرارداد حداقلی با سقف واریز برای هر آدرس، مسیر انتقال مالکیت، و آدرس‌های بدون محدودیت. برای فهمیدن حالت‌های خطا نوشته شد، نه برای عرضه‌ی محصول.',
  NULL);

-- ---------------------------------------------------------------- bots

INSERT INTO bots (id, slug, order_index, handle, telegram_url, source_url, users_label, technologies, images) VALUES
('bot_tamrinyar', 'tamrinyar', 10, '@tamrinyarbot', 'https://t.me/tamrinyarbot',
  'https://github.com/babakdevgeek/tamrinyarbot', NULL,
  '["TypeScript","grammY","Telegram Bot API","SQLite"]', '[]'),
('bot_dozbot', 'dozbot', 20, '@dozbot', 'https://t.me/dozbot',
  'https://github.com/babakdevgeek/dozbot', NULL,
  '["JavaScript","Node","Telegram Bot API"]', '[]'),
('bot_acharfarance', 'achar-farance', 30, NULL, NULL,
  'https://github.com/babakdevgeek/achar-farance-bot', NULL,
  '["JavaScript","Node","Telegram Bot API","Cron"]', '[]');

INSERT INTO bot_translations (bot_id, lang, name, description, problem, features) VALUES
('bot_tamrinyar', 'en', 'TamrinYar',
  'A practice partner that lives in your chat list. It hands you one exercise at a time, remembers what you got wrong, and brings it back later.',
  'Learning apps fail at retention, not content. People stop opening them. A Telegram bot does not need to be opened, it arrives.',
  '["Spaced repetition on wrong answers","One question per message, no menus to fight","Streaks that do not shame you","Inline keyboards for instant grading","Per-user progress in SQLite"]'),
('bot_tamrinyar', 'fa', 'تمرین‌یار',
  'یک همراه تمرین که داخل لیست چت‌هایت زندگی می‌کند. هر بار یک تمرین می‌دهد، اشتباه‌هایت را به خاطر می‌سپارد و بعداً برمی‌گرداندشان.',
  'اپ‌های آموزشی در نگه‌داشتن کاربر شکست می‌خورند، نه در محتوا. مردم دیگر بازشان نمی‌کنند. یک بات تلگرام نیازی به باز شدن ندارد، خودش می‌آید.',
  '["مرور فاصله‌دار روی پاسخ‌های غلط","هر پیام یک سؤال، بدون منوی اضافه","استریک بدون سرزنش","کیبورد اینلاین برای تصحیح فوری","ذخیره‌ی پیشرفت هر کاربر در SQLite"]'),

('bot_dozbot', 'en', 'DozBot',
  'A small dose tracker. You tell it what you took and when; it keeps the timeline and nudges you before the next one is due.',
  'Anything you need to do on a schedule dies in a notes app. This turns a schedule into a conversation you cannot lose track of.',
  '["Natural shorthand logging","Scheduled reminders per entry","History you can actually read back","Timezone-aware","No account, the chat is the account"]'),
('bot_dozbot', 'fa', 'دوز‌بات',
  'یک ردیاب کوچک دوز. می‌گویی چه چیزی و چه زمانی مصرف کردی؛ خط زمانی را نگه می‌دارد و قبل از نوبت بعدی یادآوری می‌کند.',
  'هر کاری که باید سر وقت انجام شود، در اپ یادداشت می‌میرد. این ابزار برنامه را به گفت‌وگویی تبدیل می‌کند که گمش نمی‌کنی.',
  '["ثبت با نگارش کوتاه و طبیعی","یادآوری زمان‌بندی‌شده برای هر مورد","تاریخچه‌ای که واقعاً خوانا است","آگاه از منطقه‌ی زمانی","بدون حساب کاربری، چت خودش حساب است"]'),

('bot_acharfarance', 'en', 'Achar Farance',
  'A utility belt bot. A pile of one-off tools I kept needing, collected behind a single chat instead of six half-finished scripts.',
  'Every developer has a folder of tiny scripts they cannot find when they need them. This is that folder, addressable from a phone.',
  '["Multiple tools behind one bot","Scheduled jobs with cron","Stateless commands, cheap to host","Added to whenever something annoys me twice"]'),
('bot_acharfarance', 'fa', 'آچار فرانسه',
  'بات جعبه‌ابزار. مجموعه‌ای از ابزارهای کوچکی که مدام لازمم می‌شد، جمع‌شده پشت یک چت به‌جای شش اسکریپت نیمه‌کاره.',
  'هر برنامه‌نویسی یک پوشه اسکریپت کوچک دارد که وقت نیاز پیدایشان نمی‌کند. این همان پوشه است، قابل دسترسی از گوشی.',
  '["چند ابزار پشت یک بات","اجرای زمان‌بندی‌شده با cron","دستورهای بدون حالت و ارزان برای هاست","هر چیزی که دو بار اذیتم کند اضافه می‌شود"]');
