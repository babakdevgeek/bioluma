import type { Lang, Stage } from "@/shared/types";

export interface Dictionary {
  meta: {
    langLabel: string;
    otherLang: string;
    dir: "ltr" | "rtl";
  };
  nav: Record<Stage, string> & {
    home: string;
    blog: string;
    contact: string;
    soundOn: string;
    soundOff: string;
    reducedMode: string;
    skipToContent: string;
  };
  home: {
    title: string;
    intro: string;
    intro2: string;
    ctaExplore: string;
    ctaBlog: string;
    whatIDo: string;
    profileLabel: string;
    depths: Record<Stage, string>;
    sections: {
      projects: string;
      bots: string;
      blog: string;
      contact: string;
    };
  };
  projects: {
    kicker: string;
    title: string;
    copy: string;
    viewCode: string;
    liveDemo: string;
    more: string;
    tech: string;
    featured: string;
    empty: string;
  };
  bots: {
    kicker: string;
    title: string;
    copy: string;
    telegram: string;
    source: string;
    problem: string;
    features: string;
  };
  blog: {
    kicker: string;
    title: string;
    copy: string;
    browse: string;
    searchLabel: string;
    searchPlaceholder: string;
    tags: string;
    category: string;
    read: string;
    back: string;
    prev: string;
    next: string;
    minutes: string;
    published: string;
    noPosts: string;
    readingOnlyIn: string;
  };
  contact: {
    kicker: string;
    title: string;
    copy: string;
    email: string;
    telegram: string;
    github: string;
    formTitle: string;
    name: string;
    budget: string;
    message: string;
    send: string;
    sent: string;
    interestingProject: string;
  };
  states: {
    loading: string;
    failed: string;
    notFound: string;
  };
}

export const dictionaries: Record<Lang, Dictionary> = {
  en: {
    meta: { langLabel: "EN", otherLang: "فارسی", dir: "ltr" },
    nav: {
      surface: "About",
      drift: "Projects",
      relay: "Bots",
      archive: "Blog",
      ascent: "Contact",
      home: "Home",
      blog: "Blog",
      contact: "Contact",
      soundOn: "sound on",
      soundOff: "sound off",
      reducedMode: "reduced motion",
      skipToContent: "skip to content",
    },
    home: {
      title: "Babak Bayat",
      intro: "I build web tools, Telegram bots, and weird software that starts as a bad idea and gets good once I refuse to stop.",
      intro2: "This site is not a portfolio grid. It is a descent through the stuff I make.",
      ctaExplore: "start the descent",
      ctaBlog: "just read the writing",
      whatIDo: "TypeScript, React, Workers, automation, bots, scraping, systems with personality.",
      profileLabel: "find me here",
      depths: {
        surface: "surface",
        drift: "the drift",
        relay: "the relay",
        archive: "the archive",
        ascent: "ascent",
      },
      sections: {
        projects: "Artifacts from the drift.",
        bots: "Signal creatures with jobs.",
        blog: "Thoughts that survived sediment.",
        contact: "Back into air.",
      },
    },
    projects: {
      kicker: "240 m, the drift",
      title: "Projects suspended in the water column.",
      copy: "Not cards, artifacts. Each one floats in its own pressure pocket, with enough detail to judge whether it is real.",
      viewCode: "view code",
      liveDemo: "open demo",
      more: "read the build notes",
      tech: "stack",
      featured: "featured",
      empty: "No projects yet. Which is suspicious.",
    },
    bots: {
      kicker: "900 m, the relay",
      title: "Bots that live where attention already is.",
      copy: "Good bots do not impersonate apps. They turn a task into a conversation and stay out of the way.",
      telegram: "open in Telegram",
      source: "source code",
      problem: "why it exists",
      features: "what it does",
    },
    blog: {
      kicker: "2400 m, the archive",
      title: "Writing, but calmer.",
      copy: "The homepage shows a few entries. The full archive is built for reading, not fireworks.",
      browse: "browse the archive",
      searchLabel: "search posts",
      searchPlaceholder: "search by title, excerpt, or idea",
      tags: "tags",
      category: "category",
      read: "read article",
      back: "back to blog",
      prev: "previous",
      next: "next",
      minutes: "min read",
      published: "published",
      noPosts: "Nothing published yet.",
      readingOnlyIn: "This post currently exists only in",
    },
    contact: {
      kicker: "surface again",
      title: "I build things. If your project is interesting, let's talk.",
      copy: "Short version: email me, ping me on Telegram, or send the brief here if you want me to take a look.",
      email: "email",
      telegram: "telegram",
      github: "github",
      formTitle: "send a note",
      name: "name",
      budget: "budget",
      message: "message",
      send: "send it",
      sent: "got it",
      interestingProject: "interesting project",
    },
    states: {
      loading: "loading",
      failed: "something broke",
      notFound: "nothing here",
    },
  },
  fa: {
    meta: { langLabel: "فا", otherLang: "English", dir: "rtl" },
    nav: {
      surface: "درباره من",
      drift: "پروژه‌ها",
      relay: "بات‌ها",
      archive: "وبلاگ",
      ascent: "تماس",
      home: "خانه",
      blog: "وبلاگ",
      contact: "تماس",
      soundOn: "صدا روشن",
      soundOff: "صدا خاموش",
      reducedMode: "حرکت کاهش‌یافته",
      skipToContent: "رفتن به محتوا",
    },
    home: {
      title: "بابک بیات",
      intro: "ابزار وب، بات تلگرام، و نرم‌افزارهای عجیبی می‌سازم که اول شبیه ایده‌ی بد به نظر می‌رسند و بعد چون ولشان نمی‌کنم خوب می‌شوند.",
      intro2: "این سایت یک گرید نمونه‌کار نیست. یک فرورفتن در چیزهایی است که می‌سازم.",
      ctaExplore: "شروع فرورفتن",
      ctaBlog: "فقط نوشته‌ها را بخوان",
      whatIDo: "TypeScript، React، Workers، اتوماسیون، بات، اسکرپینگ، و سیستم‌هایی که شخصیت دارند.",
      profileLabel: "اینجا پیدایم می‌کنی",
      depths: {
        surface: "سطح",
        drift: "لایه‌ی شناور",
        relay: "رله",
        archive: "بایگانی",
        ascent: "صعود",
      },
      sections: {
        projects: "اشیای باقی‌مانده در لایه‌ی شناور.",
        bots: "موجودات سیگنالی با کار مشخص.",
        blog: "فکرهایی که زیر رسوب دوام آوردند.",
        contact: "بازگشت به هوا.",
      },
    },
    projects: {
      kicker: "۲۴۰ متر، لایه‌ی شناور",
      title: "پروژه‌هایی که در ستون آب معلق مانده‌اند.",
      copy: "کارت معمولی نه، آرتیفکت. هر کدام در حباب فشار خودش شناور است و آن‌قدر جزئیات دارد که بشود فهمید واقعی است یا نه.",
      viewCode: "کد",
      liveDemo: "دمو",
      more: "یادداشت ساخت",
      tech: "استک",
      featured: "منتخب",
      empty: "هنوز پروژه‌ای نیست، که بعید است.",
    },
    bots: {
      kicker: "۹۰۰ متر، رله",
      title: "بات‌هایی که همان‌جایی زندگی می‌کنند که حواس آدم هست.",
      copy: "بات خوب خودش را جای اپ جا نمی‌زند. یک کار را به گفت‌وگو تبدیل می‌کند و مزاحم هم نمی‌شود.",
      telegram: "باز کردن در تلگرام",
      source: "سورس",
      problem: "چرا وجود دارد",
      features: "چه می‌کند",
    },
    blog: {
      kicker: "۲۴۰۰ متر، بایگانی",
      title: "نوشتن، ولی آرام‌تر.",
      copy: "صفحه‌ی اصلی فقط چند نوشته نشان می‌دهد. بایگانی کامل برای خواندن ساخته شده، نه برای نمایش افکت.",
      browse: "رفتن به بایگانی",
      searchLabel: "جست‌وجو در نوشته‌ها",
      searchPlaceholder: "بر اساس عنوان، خلاصه یا ایده جست‌وجو کن",
      tags: "برچسب‌ها",
      category: "دسته‌بندی",
      read: "خواندن مقاله",
      back: "بازگشت به وبلاگ",
      prev: "قبلی",
      next: "بعدی",
      minutes: "دقیقه مطالعه",
      published: "تاریخ انتشار",
      noPosts: "هنوز چیزی منتشر نشده.",
      readingOnlyIn: "این نوشته فعلاً فقط در این زبان وجود دارد",
    },
    contact: {
      kicker: "بازگشت به سطح",
      title: "من چیز می‌سازم. اگر پروژه‌ات جالب است، حرف بزنیم.",
      copy: "نسخه کوتاه: ایمیل بزن، در تلگرام پیام بده، یا اگر می‌خواهی نگاهی بیندازم همین‌جا خلاصه را بفرست.",
      email: "ایمیل",
      telegram: "تلگرام",
      github: "گیت‌هاب",
      formTitle: "یک پیام بفرست",
      name: "نام",
      budget: "بودجه",
      message: "پیام",
      send: "ارسال",
      sent: "رسید",
      interestingProject: "پروژه‌ی جالب",
    },
    states: {
      loading: "در حال بارگذاری",
      failed: "یک چیزی خراب شد",
      notFound: "چیزی اینجا نیست",
    },
  },
};
