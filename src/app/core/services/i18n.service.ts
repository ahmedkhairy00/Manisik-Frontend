import { Injectable, signal, effect, inject } from '@angular/core';

export type Language = 'en' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly languageSignal = signal<Language>(this.getInitialLanguage());
  public readonly language = this.languageSignal.asReadonly();

  private readonly translations: Translations = {
    // Short and long app name. Use `app.shortName` for tight UI (logo) and
    // `app.name` for full titles and SEO/meta content.
    'app.name': { en: 'Manisik Umrah Booking', ar: 'مناسك الحج والعمرة' },
    'app.shortName': { en: 'Manisik', ar: 'مناسك' },
    // Common UI phrases used across templates
    'common.viewDetails': { en: 'View Details', ar: 'عرض التفاصيل' },
    'aria.viewDetailsFor': { en: 'View details for', ar: 'عرض التفاصيل لـ' },
    'chat.new': { en: 'New Chat', ar: 'محادثة جديدة' },
    'chat.close': { en: 'Close', ar: 'إغلاق' },
    'chat.placeholder': { en: 'Ask something...', ar: 'اسأل شيئًا...' },
    'home.viewAllPackages': { en: 'View All Packages', ar: 'عرض جميع الباقات' },
    'home.trending': {
      en: 'Trending Umrah Packages',
      ar: 'الباقات الأكثر رواجًا',
    },
    'home.trendingDesc': {
      en: 'Choose from our carefully curated packages designed for every budget',
      ar: 'اختر من باقاتنا المختارة بعناية لتناسب جميع الميزانيات',
    },
    'home.howItWorks': { en: 'How It Works', ar: 'كيف تعمل الخدمة' },
    'home.howItWorksDesc': {
      en: 'Book your spiritual journey in 4 simple steps',
      ar: 'احجز رحلتك الروحية في 4 خطوات بسيطة',
    },
    'home.newsletter.title': {
      en: 'Get Exclusive Umrah Travel Tips & Deals',
      ar: 'احصل على نصائح وصفقات حصرية للعمرة',
    },
    'home.newsletter.desc': {
      en: 'Subscribe to our newsletter and be the first to know about special offers, travel guides, and updates.',
      ar: 'اشترك في نشرتنا الإخبارية لتكون أول من يتلقى العروض والدلائل والتحديثات.',
    },
    'home.newsletter.emailPlaceholder': { en: 'Enter your email address', ar: 'أدخل بريدك الإلكتروني' },
    'home.newsletter.subscribing': { en: 'Subscribing...', ar: 'جاري الاشتراك...' },
    'home.newsletter.subscribe': { en: 'Subscribe', ar: 'اشترك' },
    'home.newsletter.privacy': { en: 'Your privacy is protected. Unsubscribe anytime.', ar: 'خصوصيتك محمية. يمكنك إلغاء الاشتراك في أي وقت.' },

    // Quick Actions
    'home.actions.0.title': { en: 'Umrah Packages', ar: 'باقات العمرة' },
    'home.actions.0.desc': { en: 'All-inclusive spiritual journeys', ar: 'رحلات روحانية شاملة' },
    'home.actions.1.title': { en: 'Hotels', ar: 'الفنادق' },
    'home.actions.1.desc': { en: 'Comfortable stays near Haram', ar: 'إقامة مريحة بالقرب من الحرم' },
    'home.actions.2.title': { en: 'Transport', ar: 'النقل' },
    'home.actions.2.desc': { en: 'Reliable travel options', ar: 'خيارات سفر موثوقة' },

    // Packages
    'home.packages.title.premium': { en: 'Premium Umrah Package', ar: 'باقة العمرة المميزة' },
    'home.packages.title.standard': { en: 'Standard Umrah Package', ar: 'باقة العمرة القياسية' },
    'home.packages.title.economy': { en: 'Economy Umrah Package', ar: 'باقة العمرة الاقتصادية' },
    'home.packages.title.vip': { en: 'VIP Umrah Experience', ar: 'تجربة كبار الشخصيات' },
    'home.packages.category.All': { en: 'All', ar: 'الكل' },
    'home.packages.category.Premium': { en: 'Premium', ar: 'مميزة' },
    'home.packages.category.Standard': { en: 'Standard', ar: 'قياسية' },
    'home.packages.category.Economy': { en: 'Economy', ar: 'اقتصادية' },
    'home.packages.category.VIP': { en: 'VIP', ar: 'كبار الشخصيات' },
    'home.packages.included.5star': { en: '5-Star Hotel', ar: 'فندق 5 نجوم' },
    'home.packages.included.flights': { en: 'Flights Included', ar: 'شامل الطيران' },
    'home.packages.included.visa': { en: 'Visa Processing', ar: 'تجهيز التأشيرة' },
    'home.packages.included.transport': { en: 'Luxury Transport', ar: 'نقل فاخر' },
    'home.packages.included.4star': { en: '4-Star Hotel', ar: 'فندق 4 نجوم' },
    'home.packages.included.breakfast': { en: 'Breakfast', ar: 'إفطار' },
    'home.packages.included.3star': { en: '3-Star Hotel', ar: 'فندق 3 نجوم' },
    'home.packages.included.shared': { en: 'Shared Transport', ar: 'نقل مشترك' },
    'home.packages.included.luxury': { en: 'Luxury Suite', ar: 'جناح فاخر' },
    'home.packages.included.business': { en: 'Business Class', ar: 'درجة رجال الأعمال' },
    'home.packages.included.guide': { en: 'Private Guide', ar: 'مرشد خاص' },
    'home.packages.included.concierge': { en: '24/7 Concierge', ar: 'كونسيرج 24/7' },
    'home.packages.duration.days': { en: 'Days', ar: 'أيام' },
    'home.packages.from': { en: 'From', ar: 'من' },
    'home.packages.perPerson': { en: '/ person', ar: '/ شخص' },
    'common.verified': { en: 'Verified Pilgrim', ar: 'حاج موثق' },
    // How it works (keys already declared above)
    // Steps
    'home.steps.0.title': {
      en: 'Choose Package/Services',
      ar: 'اختر الباقة/الخدمات',
    },
    'home.steps.0.description': {
      en: 'Browse our curated packages or build your own custom journey',
      ar: 'تصفح باقاتنا المختارة أو أنشئ مسارك المخصص',
    },
    'home.steps.0.desc': {
      en: 'Browse our curated packages or build your own custom journey',
      ar: 'تصفح باقاتنا المختارة أو أنشئ مسارك المخصص',
    },
    'home.steps.1.title': { en: 'Customize Your Trip', ar: 'خصص رحلتك' },
    'home.steps.1.description': {
      en: 'Select hotels, transport, and dates that work best for you',
      ar: 'اختر الفنادق والنقل والتواريخ المناسبة لك',
    },
    'home.steps.1.desc': {
      en: 'Select hotels, transport, and dates that work best for you',
      ar: 'اختر الفنادق والنقل والتواريخ المناسبة لك',
    },
    'home.steps.2.title': { en: 'Secure Payment', ar: 'دفع آمن' },
    'home.steps.2.description': {
      en: 'Pay securely with multiple payment options and flexible plans',
      ar: 'ادفع بأمان مع خيارات دفع متعددة وخطط مرنة',
    },
    'home.steps.2.desc': {
      en: 'Pay securely with multiple payment options and flexible plans',
      ar: 'ادفع بأمان مع خيارات دفع متعددة وخطط مرنة',
    },
    'home.steps.3.title': { en: 'Receive Confirmation', ar: 'استلم التأكيد' },
    'home.steps.3.description': {
      en: 'Get instant confirmation and all travel documents via email',
      ar: 'احصل على تأكيد فوري وجميع مستندات السفر عبر البريد الإلكتروني',
    },
    'home.steps.3.desc': {
      en: 'Get instant confirmation and all travel documents via email',
      ar: 'احصل على تأكيد فوري وجميع مستندات السفر عبر البريد الإلكتروني',
    },
    // Stats
    'stats.totalBookings': { en: 'Total Bookings', ar: 'إجمالي الحجوزات' },
    'stats.satisfactionRate': { en: 'Satisfaction Rate', ar: 'معدل الرضا' },
    'stats.supportAvailable': { en: 'Support Available', ar: 'الدعم متاح' },
    'stats.destinations': { en: 'Destinations', ar: 'الوجهات' },
    'home.subscribe': { en: 'Subscribe', ar: 'اشترك' },
    'home.subscribing': { en: 'Subscribing...', ar: 'جاري الاشتراك...' },
    'home.newsletterPrivacy': {
      en: 'Your privacy is protected. Unsubscribe anytime.',
      ar: 'خصوصيتك محمية. يمكنك إلغاء الاشتراك في أي وقت.',
    },
    'home.testimonials.title': { en: 'What Our Pilgrims Say', ar: 'آراء الحجاج' },
    'home.testimonials.desc': {
      en: 'Real experiences from verified travelers',
      ar: 'تجارب حقيقية من مسافرين موثوقين',
    },
    'home.faq.title': { en: 'Frequently Asked Questions', ar: 'الأسئلة الشائعة' },
    'home.faq.desc': {
      en: 'Find answers to common questions about booking your Umrah journey',
      ar: 'اعثر على إجابات للأسئلة الشائعة حول حجز رحلة العمرة',
    },
    'chat.assistant': { en: 'Assistant', ar: 'المساعد' },
    'chat.welcome': {
      en: 'Hello! How can I help you plan your trip today?',
      ar: 'مرحبًا! كيف يمكنني مساعدتك في تخطيط رحلتك اليوم؟',
    },
    'chat.newStarted': {
      en: 'New chat started. How can I help?',
      ar: 'تم بدء محادثة جديدة. كيف أستطيع المساعدة؟',
    },
    'chat.send': { en: 'send', ar: 'ارسل' },
    // Hero slider translations
    'hero.title': {
      en: 'Your Journey to the Holy Land Begins Here',
      ar: 'رحلتك إلى الأرض المقدسة تبدأ من هنا',
    },
    'hero.subtitle': {
      en: 'Book Umrah packages, hotels, and transport - all in one place',
      ar: 'احجز باقات العمرة والفنادق والنقل - كل ذلك في مكان واحد',
    },
    'hero.explore': { en: 'Explore Packages', ar: 'استكشف الباقات' },
    'hero.findHotels': { en: 'Find Hotels', ar: 'ابحث عن الفنادق' },
    // Hero slides content (per-slide keys)
    'hero.slides.0.title': { en: 'Experience Makkah', ar: 'اكتشف مكة' },
    'hero.slides.0.subtitle': { en: 'The Sacred City', ar: 'المدينة المقدسة' },
    'hero.slides.0.description': {
      en: 'Begin your spiritual journey at the holiest site in Islam',
      ar: 'ابدأ رحلتك الروحية في أكثر الأماكن قداسة في الإسلام',
    },
    'hero.slides.1.title': { en: 'Discover Madinah', ar: 'اكتشف المدينة' },
    'hero.slides.1.subtitle': { en: 'The City of Light', ar: 'مدينة النور' },
    'hero.slides.1.description': {
      en: "Visit the Prophet's Mosque and experience tranquility",
      ar: 'زر المسجد النبوي واختبر السكون والطمأنينة',
    },
    'hero.slides.2.title': { en: 'Complete Journey', ar: 'رحلة متكاملة' },
    'hero.slides.2.subtitle': { en: 'Makkah & Madinah', ar: 'مكة والمدينة' },
    'hero.slides.2.description': {
      en: 'All-inclusive packages for a seamless pilgrimage',
      ar: 'باقات شاملة لرحلة حج متكاملة وسلسة',
    },
    'hero.slides.3.title': { en: 'Stand at Arafat', ar: 'الوقوف بعرفة' },
    'hero.slides.3.subtitle': { en: 'Mount Arafat', ar: 'جبل عرفات' },
    'hero.slides.3.description': {
      en: 'Experience the most important pillar of Hajj at the Plain of Arafat',
      ar: 'اختبر أهم ركن من أركان الحج في صعيد عرفات',
    },
    'hero.slides.4.title': { en: 'Visit Al-Baqi', ar: 'زيارة البقيع' },
    'hero.slides.4.subtitle': { en: 'Jannat Al-Baqi', ar: 'جنة البقيع' },
    'hero.slides.4.description': {
      en: 'Pay respects at the historic cemetery near the Prophet\'s Mosque',
      ar: 'زر المقبرة التاريخية بالقرب من المسجد النبوي',
    },
    // Badges used in hero slides
    'hero.badges.destinations': { en: '50+ Destinations', ar: '50+ وجهة' },
    'hero.badges.yearRound': {
      en: 'Year-Round Packages',
      ar: 'باقات على مدار السنة',
    },
    'hero.badges.pilgrims': {
      en: '10,000+ Pilgrims',
      ar: 'أكثر من 10,000 حاج',
    },
    // CTA keys used in slides
    'hero.cta.book': { en: 'Book Your Journey', ar: 'احجز رحلتك' },
    'hero.cta.explore': { en: 'Explore Packages', ar: 'استعرض الباقات' },
    // Testimonials items
    'testimonials.items.0': {
      en: 'Manisik made my Umrah journey incredibly smooth. From booking to arrival, everything was perfectly organized. The hotel was close to Haram and the support team was always available. Highly recommended!',
      ar: 'جعلت منـاسك رحلة العمرة الخاصة بي سلسة للغاية. من الحجز إلى الوصول، كان كل شيء منظماً بشكل مثالي. الفندق قريب من الحرم وكان فريق الدعم متاحاً دائماً. أنصح به بشدة!',
    },
    'testimonials.items.1': {
      en: "As a first-time pilgrim, I was nervous about planning everything. Manisik's team guided me through every step. The package was affordable and the experience was life-changing. JazakAllah Khair!",
      ar: 'بوصفي حاجًا لأول مرة، كنت قلقًا بشأن التخطيط لكل شيء. أرشدني فريق منـاسك في كل خطوة. كانت الباقة ميسورة التكلفة والتجربة مغيرة للحياة. جزاكم الله خيرًا!',
    },
    'testimonials.items.2': {
      en: "Best Umrah booking platform! The website is easy to use, prices are transparent, and customer service is exceptional. I've booked my third trip with them and will continue to do so.",
      ar: 'أفضل منصة لحجز العمرة! الموقع سهل الاستخدام، الأسعار شفافة، وخدمة العملاء متميزة. حجزت رحلتي الثالثة معهم وسأستمر في ذلك.',
    },

    // FAQ item translations
    'faq.items.0.question': {
      en: 'How do I book an Umrah package?',
      ar: 'كيف أحجز باقة عمرة؟',
    },
    'faq.items.0.answer': {
      en: "Booking is simple! Browse our packages, select your preferred dates and accommodations, fill in your details, and complete the secure payment. You'll receive instant confirmation via email.",
      ar: 'الحجز سهل! تصفح باقاتنا، اختر التواريخ والإقامة المفضلة لديك، املأ بياناتك، وأكمل الدفع الآمن. ستتلقى تأكيدًا فوريًا عبر البريد الإلكتروني.',
    },
    'faq.items.1.question': {
      en: 'What is included in the Umrah packages?',
      ar: 'ما الذي يتضمنه باقات العمرة؟',
    },
    'faq.items.1.answer': {
      en: 'Our packages typically include accommodation, visa processing assistance, transport between cities, and 24/7 customer support. Specific inclusions vary by package tier (Economy, Standard, Premium, VIP).',
      ar: 'تتضمن باقاتنا عادة الإقامة، والمساعدة في معالجة التأشيرات، والنقل بين المدن، ودعم العملاء على مدار الساعة. تختلف التفاصيل بحسب فئة الباقة.',
    },
    'faq.items.2.question': {
      en: 'Can I customize my package?',
      ar: 'هل يمكنني تخصيص باقتي؟',
    },
    'faq.items.2.answer': {
      en: 'Yes! You can build a custom package by selecting individual services like hotels, flights, and transport. Our team can also help you create a personalized itinerary.',
      ar: 'نعم! يمكنك بناء باقة مخصصة باختيار خدمات فردية مثل الفنادق والرحلات والنقل. ويمكن لفريقنا مساعدتك في إنشاء خط سير شخصي.',
    },
    'faq.items.3.question': {
      en: 'What is your cancellation policy?',
      ar: 'ما هي سياسة الإلغاء؟',
    },
    'faq.items.3.answer': {
      en: 'Cancellation policies vary by package and service provider. Generally, we offer free cancellation up to 30 days before departure. Please check specific terms during booking.',
      ar: 'تختلف سياسات الإلغاء حسب الباقة ومقدم الخدمة. عمومًا، نسمح بالإلغاء المجاني حتى 30 يومًا قبل المغادرة. يرجى مراجعة الشروط أثناء الحجز.',
    },
    'faq.items.4.question': {
      en: 'Do you assist with visa applications?',
      ar: 'هل تساعدون في طلبات التأشيرة؟',
    },
    'faq.items.4.answer': {
      en: 'Yes, we provide comprehensive visa assistance including document verification, application submission, and follow-up. Visa fees are typically included in our packages.',
      ar: 'نعم، نقدم مساعدة شاملة في التأشيرات بما في ذلك التحقق من المستندات وتقديم الطلب والمتابعة. عادةً ما تكون رسوم التأشيرة مشمولة في باقاتنا.',
    },
    'faq.items.5.question': {
      en: 'Is travel insurance included?',
      ar: 'هل التأمين على السفر مشمول؟',
    },
    'faq.items.5.answer': {
      en: 'Travel insurance is optional and can be added during booking. We highly recommend it for your peace of mind and protection during your journey.',
      ar: 'التأمين على السفر اختياري ويمكن إضافته أثناء الحجز. نوصي به بشدة لراحة بالك وحمايتك أثناء الرحلة.',
    },
    'faq.items.6.question': {
      en: 'How close are the hotels to Masjid al-Haram?',
      ar: 'ما مدى قرب الفنادق من المسجد الحرام؟',
    },
    'faq.items.6.answer': {
      en: 'We partner with hotels at various distances from the Haram. You can filter by distance during booking. Most of our hotels are within walking distance (100m-2km).',
      ar: 'نتعاون مع فنادق على مسافات مختلفة من الحرم. يمكنك التصفية حسب المسافة أثناء الحجز. معظم فنادقنا على مسافة مريحة سيرًا (100م-2كم).',
    },
    'faq.items.7.question': {
      en: 'What payment methods do you accept?',
      ar: 'ما طرق الدفع المقبولة؟',
    },
    'faq.items.7.answer': {
      en: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, bank transfers, and offer flexible installment plans for qualifying bookings.',
      ar: 'نقبل جميع بطاقات الائتمان الرئيسية (فيزا، ماستركارد، أميركان إكسبريس)، باي بال، التحويلات البنكية، ونقدم خطط تقسيط مرنة للحجوزات المؤهلة.',
    },

    // Dashboard translations
    'dashboard.menu.dashboard': { en: 'Dashboard', ar: 'لوحة التحكم' },
    'dashboard.menu.book': { en: 'Book Umrah', ar: 'حجز العمرة' },
    'dashboard.menu.hotels': { en: 'Hotels', ar: 'الفنادق' },
    'dashboard.menu.transport': { en: 'Transport', ar: 'النقل' },
    'dashboard.welcome': {
      en: 'Welcome back, John!',
      ar: 'مرحبًا بعودتك، جون!',
    },
    'dashboard.greeting': { en: 'As-salamu alaykum', ar: 'السلام عليكم' },
    'dashboard.subtitle': {
      en: 'Your next trip is in 45 days!',
      ar: 'رحلتك القادمة بعد 45 يومًا!',
    },
    'dashboard.upcomingTrips': { en: 'Upcoming Trips', ar: 'الرحلات القادمة' },
    'dashboard.nextTripDate': {
      en: 'Next: Dec 15, 2025',
      ar: 'التالي: 15 ديسمبر 2025',
    },
    'dashboard.totalBookings': { en: 'Total Bookings', ar: 'إجمالي الحجوزات' },
    'dashboard.allTime': { en: 'All time', ar: 'جميع الأوقات' },
    'dashboard.recentActivity': { en: 'Recent Activity', ar: 'النشاط الأخير' },
    'dashboard.menu.myBookings': { en: 'My Bookings', ar: 'حجوزاتي' },
    'dashboard.menu.payments': { en: 'Payments', ar: 'المدفوعات' },
    'dashboard.menu.manageUsers': { en: 'Manage Users', ar: 'إدارة المستخدمين' },
    'dashboard.menu.manageHotels': { en: 'Manage Hotels', ar: 'إدارة الفنادق' },
    'dashboard.welcome.user': { en: 'Welcome back to your spiritual journey dashboard. Your next trip is in 45 days!', ar: 'مرحبًا بك في لوحة تحكم رحلتك الروحية. رحلتك القادمة بعد 45 يومًا!' },
    'dashboard.welcome.admin': { en: 'Welcome back to the admin dashboard. Manage your platform efficiently.', ar: 'مرحبًا بك في لوحة تحكم المسؤول. أدر منصتك بكفاءة.' },
    'dashboard.welcome.hotelManager': { en: 'Welcome back to your hotel management dashboard. Monitor your bookings and reviews.', ar: 'مرحبًا بك في لوحة تحكم إدارة الفندق. راقب حجوزاتك وتقييماتك.' },
    'dashboard.stats.savedItems': { en: 'Saved Items', ar: 'العناصر المحفوظة' },
    'dashboard.stats.hotelsPackages': { en: 'Hotels & packages', ar: 'فنادق وباقات' },
    'dashboard.stats.loyaltyPoints': { en: 'Loyalty Points', ar: 'نقاط الولاء' },
    'dashboard.stats.earnMore': { en: 'Earn more rewards', ar: 'اكسب المزيد من المكافآت' },
    'dashboard.trips.daysLeft': { en: 'days left', ar: 'أيام متبقية' },
    'dashboard.trips.viewDetails': { en: 'View Details', ar: 'عرض التفاصيل' },
    'dashboard.trips.downloadDocs': { en: 'Download Docs', ar: 'تحميل المستندات' },

    // Footer translations (a subset)
    'footer.aboutTitle': { en: 'About Manisik', ar: 'حول منـاسك' },
    'footer.aboutText': {
      en: 'Your trusted partner for spiritual journeys. Making Umrah and Hajj accessible to everyone.',
      ar: 'شريكك الموثوق لرحلات الروحانية. نجعل العمرة والحج في متناول الجميع.',
    },
    'footer.quickLinks': { en: 'Quick Links', ar: 'روابط سريعة' },
    'footer.services': { en: 'Services', ar: 'الخدمات' },
    'footer.support': { en: 'Support', ar: 'الدعم' },
    'footer.contact': { en: 'Contact', ar: 'اتصل بنا' },
    'footer.bottomCopyright': {
      en: '© 2025 Manisik. All rights reserved.',
      ar: '© 2025 منـاسك. جميع الحقوق محفوظة.',
    },
    'footer.blog': { en: 'Blog', ar: 'المدونة' },
    'footer.careers': { en: 'Careers', ar: 'وظائف' },
    'footer.press': { en: 'Press', ar: 'الصحافة' },
    'footer.services.umrahPackages': { en: 'Umrah Packages', ar: 'باقات العمرة' },
    'footer.services.hotelsMakkah': { en: 'Hotels in Makkah', ar: 'فنادق مكة' },
    'footer.services.hotelsMadinah': { en: 'Hotels in Madinah', ar: 'فنادق المدينة' },
    'footer.services.airTransport': { en: 'Air Transport', ar: 'النقل الجوي' },
    'footer.services.groundTransport': { en: 'Ground Transport', ar: 'النقل البري' },
    'footer.services.travelInsurance': { en: 'Travel Insurance', ar: 'تأمين السفر' },
    'footer.helpCenter': { en: 'Help Center', ar: 'مركز المساعدة' },
    'footer.contactUs': { en: 'Contact Us', ar: 'اتصل بنا' },
    'footer.faqs': { en: 'FAQs', ar: 'الأسئلة الشائعة' },
    'footer.terms': { en: 'Terms of Service', ar: 'شروط الخدمة' },
    'footer.privacy': { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
    'footer.cookies': { en: 'Cookie Policy', ar: 'سياسة ملفات تعريف الارتباط' },
    'footer.businessHours': { en: 'Business Hours: 9 AM - 6 PM', ar: 'ساعات العمل: 9 صباحًا - 6 مساءً' },
    'footer.supportAvailable': { en: 'Support Available 24/7', ar: 'الدعم متاح 24/7' },
    'footer.weAccept': { en: 'We Accept', ar: 'نقبل' },
    'transport.reviews': { en: 'reviews', ar: 'مراجعة' },
    'common.from': { en: 'From', ar: 'من' },
    'common.perPerson': { en: '/person', ar: '/شخص' },
    'hotel.fromHaram': { en: 'km from Haram', ar: 'كم من الحرم' },
    'nav.home': { en: 'Home', ar: 'الرئيسية' },
    'nav.packages': { en: 'Packages', ar: 'الباقات' },
    'nav.hotels': { en: 'Hotels', ar: 'الفنادق' },
    'nav.transport': { en: 'Transport', ar: 'النقل' },
    'nav.about': { en: 'About', ar: 'من نحن' },
    'nav.bookings': { en: 'My Bookings', ar: 'حجوزاتي' },
    'nav.users': { en: 'Users', ar: 'المستخدمون' },
    'nav.login': { en: 'Login', ar: 'تسجيل الدخول' },
    'nav.logout': { en: 'Logout', ar: 'تسجيل الخروج' },
    'auth.login': { en: 'Login', ar: 'تسجيل الدخول' },
    'auth.register': { en: 'Register', ar: 'إنشاء حساب' },
    'auth.signIn': { en: 'Sign In', ar: 'تسجيل الدخول' },
    'auth.signUp': { en: 'Sign Up', ar: 'إنشاء حساب' },
    'auth.email': { en: 'Email', ar: 'البريد الإلكتروني' },
    'auth.password': { en: 'Password', ar: 'كلمة المرور' },
    'auth.firstName': { en: 'First Name', ar: 'الاسم الأول' },
    'auth.lastName': { en: 'Last Name', ar: 'اسم العائلة' },
    'auth.phone': { en: 'Phone', ar: 'الهاتف' },
    'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
    'common.save': { en: 'Save', ar: 'حفظ' },
    'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
    'common.delete': { en: 'Delete', ar: 'حذف' },
    'common.edit': { en: 'Edit', ar: 'تعديل' },
    'common.search': { en: 'Search', ar: 'بحث' },
    'common.filter': { en: 'Filter', ar: 'تصفية' },
    'common.apply': { en: 'Apply', ar: 'تطبيق' },
    'common.reset': { en: 'Reset', ar: 'إعادة تعيين' },

    // About Section
    'home.about.title': { en: 'About Manisik', ar: 'عن مناسك' },
    'home.about.description': { 
      en: 'Manisik is your trusted partner for spiritual journeys. We specialize in providing comprehensive Umrah services, ensuring a seamless and spiritually enriching experience for pilgrims from around the world. Our dedicated team works tirelessly to handle all logistics, allowing you to focus on your worship.', 
      ar: 'مناسك هي شريكك الموثوق للرحلات الروحانية. نحن متخصصون في تقديم خدمات عمرة شاملة، مما يضمن تجربة سلسة ومثرية روحياً للحجاج من جميع أنحاء العالم. يعمل فريقنا المتفاني بلا كلل للتعامل مع جميع الخدمات اللوجستية، مما يتيح لك التركيز على عبادتك.' 
    },
    'home.about.imageAlt': { en: 'Pilgrims at Kaaba', ar: 'حجاج في الكعبة' },
    'home.about.feature1.title': { en: 'Trusted Service', ar: 'خدمة موثوقة' },
    'home.about.feature1.desc': { en: 'Licensed by Ministry of Hajj & Umrah', ar: 'مرخصة من وزارة الحج والعمرة' },
    'home.about.feature2.title': { en: '24/7 Support', ar: 'دعم 24/7' },
    'home.about.feature2.desc': { en: 'Dedicated team to assist you anytime', ar: 'فريق مخصص لمساعدتك في أي وقت' },
    'home.about.cta': { en: 'Learn More', ar: 'اعرف المزيد' },

    /*  TRANSPORT  */
    'transport.title': { en: 'Transport Services', ar: 'خدمات النقل' },
    'transport.subtitle': { en: 'Choose your international and local transport options', ar: 'اختر خيارات النقل الدولية والمحلية' },
    'transport.international.title': { en: 'International Transport to Saudi Arabia', ar: 'النقل الدولي إلى المملكة العربية السعودية' },
    'transport.international.air': { en: 'Air Transport', ar: 'النقل الجوي' },
    'transport.international.sea': { en: 'Sea Transport', ar: 'النقل البحري' },
    'transport.domestic.title': { en: 'Transport Within Saudi Arabia', ar: 'النقل داخل المملكة العربية السعودية' },
    'transport.domestic.subtitle': { en: 'Choose your preferred mode of transport for travel between cities in Saudi Arabia', ar: 'اختر وسيلة النقل المفضلة لديك للسفر بين المدن في السعودية' },
    'transport.tabs.publicBus': { en: 'Public Bus', ar: 'حافلة عامة' },
    'transport.tabs.train': { en: 'Train', ar: 'قطار' },
    'transport.tabs.uber': { en: 'Uber/Careem', ar: 'أوبر/كريم' },
    'transport.tabs.private': { en: 'Private Car', ar: 'سيارة خاصة' },
    'transport.search.from': { en: 'From', ar: 'من' },
    'transport.search.to': { en: 'To', ar: 'إلى' },
    'transport.search.departure': { en: 'Departure Date', ar: 'تاريخ المغادرة' },
    'transport.search.fromPlaceholder': { en: 'Departure city', ar: 'مدينة المغادرة' },
    'transport.search.button': { en: 'Search Flights', ar: 'ابحث عن رحلات' },
    'transport.flight.duration': { en: 'Duration', ar: 'المدة' },
    'transport.flight.class': { en: 'Class', ar: 'الدرجة' },
    'transport.flight.stops': { en: 'Stops', ar: 'التوقفات' },
    'transport.flight.direct': { en: 'Direct', ar: 'مباشر' },
    'transport.flight.oneStop': { en: '1 Stop', ar: 'توقف واحد' },
    'transport.flight.economy': { en: 'Economy', ar: 'اقتصادية' },
    'transport.flight.meals': { en: 'Meals included', ar: 'وجبات مشمولة' },
    'transport.flight.premiumMeals': { en: 'Premium meals', ar: 'وجبات فاخرة' },
    'transport.flight.gourmetMeals': { en: 'Gourmet meals', ar: 'وجبات راقية' },
    'transport.flight.baggage': { en: 'baggage', ar: 'أمتعة' },
    'transport.flight.entertainment': { en: 'Entertainment', ar: 'ترفيه' },
    'transport.flight.wifi': { en: 'WiFi', ar: 'واي فاي' },
    'transport.flight.lounge': { en: 'Lounge access', ar: 'دخول الصالة' },
    'transport.flight.premiumEntertainment': { en: 'Premium entertainment', ar: 'ترفيه متميز' },
    'transport.book.button': { en: 'Book Flight', ar: 'احجز رحلة' },
    'transport.book.now': { en: 'Book Now', ar: 'احجز الآن' },
    'transport.service.saptco': { en: 'SAPTCO (Public Bus)', ar: 'سابتكو (حافلة عامة)' },
    'transport.service.alkhalij': { en: 'Al Khalij Bus Services', ar: 'خدمات حافلات الخليج' },
    'transport.route': { en: 'Route', ar: 'المسار' },
    'transport.route.jeddahMakkah': { en: 'Jeddah - Makkah', ar: 'جدة - مكة' },
    'transport.route.makkahMadinah': { en: 'Makkah - Madinah', ar: 'مكة - المدينة' },
    'transport.amenity.ac': { en: 'AC', ar: 'مكيف' },
    'transport.amenity.comfortSeats': { en: 'Comfortable seats', ar: 'مقاعد مريحة' },
    'transport.amenity.recliningSeats': { en: 'Reclining seats', ar: 'مقاعد قابلة للإمالة' },
    'transport.amenity.wifi': { en: 'WiFi', ar: 'واي فاي' },
    'transport.amenity.refreshments': { en: 'Refreshments', ar: 'مرطبات' },
    'transport.amenity.prayerStops': { en: 'Prayer stops', ar: 'محطات صلاة' },
    'transport.price.from': { en: 'From', ar: 'من' },
    'transport.cities.jeddah': { en: 'Jeddah', ar: 'جدة' },
    'transport.cities.riyadh': { en: 'Riyadh', ar: 'الرياض' },
    'transport.cities.dammam': { en: 'Dammam', ar: 'الدمام' },

    /* HOTEL */
    'hotel.searchPlaceholder': { en: 'Search by hotel name or area', ar: 'ابحث باسم الفندق أو المنطقة' },
    'hotel.city.makkah': { en: 'Makkah', ar: 'مكة المكرمة' },
    'hotel.city.madinah': { en: 'Madinah', ar: 'المدينة المنورة' },
    'hotel.sort.recommended': { en: 'Recommended', ar: 'موصى به' },
    'hotel.sort.distance': { en: 'Distance', ar: 'المسافة' },
    'hotel.sort.rating': { en: 'Rating', ar: 'التقييم' },
    'hotel.loading': { en: 'Loading hotel details...', ar: 'جاري تحميل تفاصيل الفندق...' },
    'hotel.notFound': { en: 'Hotel not found.', ar: 'الفندق غير موجود.' },
    'hotel.hideRooms': { en: 'Hide Rooms', ar: 'إخفاء الغرف' },
    'hotel.showRooms': { en: 'Show Available Rooms', ar: 'عرض الغرف المتاحة' },
    'hotel.capacity': { en: 'Capacity', ar: 'السعة' },
    'hotel.person': { en: 'person(s)', ar: 'شخص' },
    'hotel.available': { en: 'Available', ar: 'متاح' },
    'hotel.rooms': { en: 'room(s)', ar: 'غرفة' },
    'hotel.selected': { en: 'Selected', ar: 'محدد' },
    'hotel.book': { en: 'Book', ar: 'حجز' },
    'hotel.noRooms': { en: 'No rooms available at the moment.', ar: 'لا توجد غرف متاحة في الوقت الحالي.' },
    'nav.bookingHotel': { en: 'Booking Hotel', ar: 'حجز فندق' },

    /* BOOKING HOTEL */
    'booking.title': { en: 'Book Hotel', ar: 'حجز الفندق' },
    'booking.checkIn': { en: 'Check-In Date', ar: 'تاريخ الوصول' },
    'booking.checkOut': { en: 'Check-Out Date', ar: 'تاريخ المغادرة' },
    'booking.rooms': { en: 'Number of Rooms', ar: 'عدد الغرف' },
    'booking.totalPrice': { en: 'Total Price', ar: 'السعر الإجمالي' },
    'booking.submit': { en: 'Book Hotel', ar: 'تأكيد الحجز' },
    'booking.error.dateOrder': { en: 'Check-in date must be before check-out date.', ar: 'يجب أن يكون تاريخ الوصول قبل تاريخ المغادرة.' },
    'booking.roomType': { en: 'Room Type', ar: 'نوع الغرفة' },
    'booking.pricePerNight': { en: 'Price per night', ar: 'السعر لليلة' },
  };

  constructor() {
    effect(() => {
      const lang = this.languageSignal();
      this.applyLanguage(lang);
      this.saveLanguage(lang);
    });

    // Apply initial language
    this.applyLanguage(this.languageSignal());
  }

  translate(key: string): string {
    const translation = this.translations[key];
    if (!translation) {
      return key;
    }
    return translation[this.languageSignal()] || translation.en;
  }

  // Alias for use in templates
  t(key: string): string {
    return this.translate(key);
  }

  setLanguage(language: Language): void {
    this.languageSignal.set(language);
  }

  toggleLanguage(): void {
    this.languageSignal.update((current) => (current === 'en' ? 'ar' : 'en'));
  }

  isRTL(): boolean {
    return this.languageSignal() === 'ar';
  }

  getCurrentLanguage(): Language {
    return this.languageSignal();
  }

  private getInitialLanguage(): Language {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'en' || saved === 'ar')) {
      return saved;
    }
    return 'en';
  }

  private applyLanguage(language: Language): void {
    const html = document.documentElement;
    html.setAttribute('lang', language);
    html.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
  }

  private saveLanguage(language: Language): void {
    localStorage.setItem('language', language);
  }
}
