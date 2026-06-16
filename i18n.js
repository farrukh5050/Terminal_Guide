/* ============================================================
   StreetCars Manchester — i18n
   ============================================================
   Lightweight translation layer. No dependencies.

   USAGE
     t('entry.title')                  → translated string
     t('picker.eyebrow.welcome', { name: 'Anna' })  → with vars
     applyLang('es')                   → switch language at runtime
     detectLang()                      → best-guess from storage/browser

   HOW TO ADD A LANGUAGE
     1. Add an entry to LANGS below.
     2. Add a full block to I18N keyed by the same code.
     3. (RTL only) set `rtl: true` in LANGS.

   TRANSLATIONS POLICY
     Strings here were drafted by AI. Please have a native speaker
     proof-read before going live, especially Arabic (RTL/MSA) and
     the Chinese variants.
============================================================ */

const LANGS = [
  { code: 'en',    name: 'English',    short: 'EN', flag: '🇬🇧' },
  { code: 'es',    name: 'Español',    short: 'ES', flag: '🇪🇸' },
  { code: 'ar',    name: 'العربية',     short: 'AR', flag: '🇸🇦', rtl: true },
  { code: 'zh-CN', name: '简体中文',     short: '简', flag: '🇨🇳' },
  { code: 'zh-HK', name: '繁體中文',     short: '繁', flag: '🇭🇰' }
];

const I18N = {
  /* ====================== ENGLISH (source) ====================== */
  en: {
    'brand.name': 'StreetCars Manchester',

    // Entry
    'entry.eyebrow': 'Welcome to Manchester',
    'entry.title': 'Have you arrived?',
    'entry.subtitle': "We'll guide you from arrivals all the way to your pickup spot.",
    'entry.yes': "Yes, I've landed",
    'entry.no': 'Not yet - show me the guide',
    'book.now': 'Book now / Get a quote',

    // Footer / shared
    'footer.help_prefix': 'Need help?',
    'footer.call_us': 'Call us on 0161 228 7878',

    // Persistent contact footer
    'footer.contact_label': 'Contact StreetCars',
    'footer.call_office': 'Call office',
    'footer.request_callback': 'Request callback',
    'footer.live_chat': 'Live chat',

    // Booking
    'booking.eyebrow': 'Welcome to Manchester',
    'booking.title': 'Find your driver.',
    'booking.subtitle': 'Enter the booking ID we sent to your email or phone.',
    'booking.label': 'Booking ID',
    'booking.help': '8 digits — find it in your confirmation message.',
    'booking.continue': 'Continue',
    'booking.error.invalid': 'Please enter all 8 digits of your booking ID.',
    'booking.error.not_found': "We couldn't find that booking. Please check the number and try again.",
    'booking.error.archived': "Something's wrong with this booking. Please call us on 0161 228 7878.",
    'booking.error.server': 'Something went wrong. Please try again or call us on 0161 228 7878.',

    // Picker
    'picker.eyebrow.confirmed': 'Booking confirmed',
    'picker.eyebrow.browse': 'Browse the pickup guide',
    'picker.eyebrow.welcome': 'Welcome, {name}',
    'picker.title': 'Which terminal?',
    'picker.subtitle': "Pick where you've just landed and we'll walk you to the car.",

    // Nav
    'nav.back': 'Go back',
    'nav.step_progress': 'Step {current} of {total} · ~{time}',
    'nav.photo_count': 'Photo {current} of {total}',
    'nav.next': 'I see this — next',
    'nav.last': "I'm at the pickup spot",

    // Arrived
    'arrived.youve_arrived': "You've arrived",
    'arrived.pickup_at': 'Pickup at',
    'arrived.your_driver': 'Your driver',
    'arrived.track': 'Track driver live',
    'arrived.call_driver': 'Call office',
    'arrived.callback': 'Callback',
    'arrived.chat': 'Chat',
    'arrived.eta': 'Driver arriving shortly',
    'arrived.browse.message_1': 'This is the StreetCars pickup spot at Manchester Airport.',
    'arrived.browse.message_2_before': "Once you've landed,",
    'arrived.browse.call_us_link': 'call us on 0161 228 7878',
    'arrived.browse.message_2_after': "to book a ride and we'll bring you right back here.",
    'arrived.browse.i_landed': "I've arrived — find my driver",

    // Live chat
    'chat.title': 'Office team',
    'chat.online': 'Online · usually replies in minutes',
    'chat.empty': 'Say hi — our office team is here to help.',
    'chat.placeholder': 'Message the office…',
    'chat.send': 'Send message',

    // Dialog
    'dialog.title': 'Request a callback',
    'dialog.subtitle': "We'll ring you straight back.",
    'dialog.phone_label': 'Your phone number (optional)',
    'dialog.phone_placeholder': '07700 900123',
    'dialog.message_label': 'Your message (optional)',
    'dialog.message_placeholder': 'Anything we should know?',
    'dialog.cancel': 'Cancel',
    'dialog.send': 'Send',
    'dialog.success_title': "Got it — we'll be in touch.",
    'dialog.success_subtitle': "Here's what you sent us:",
    'dialog.preview_phone': 'Phone',
    'dialog.preview_message': 'Message',
    'dialog.done': 'Done',
    'dialog.close': 'Close',
    'dialog.error.phone_or_message': 'Please enter a phone number or a message.',
    'dialog.error.invalid_phone': 'Please enter a valid phone number.',
    'dialog.error.server': "Couldn't send right now. Please try again or call us directly.",

    // Dispatch confirmation
    'dispatch.title': "We're sending your driver",
    'dispatch.message': "Your driver will be dispatched immediately. Please continue only once you've collected your baggage and are ready to head to the pickup point. We'll then provide directions to your pickup location.",
    'dispatch.confirm': 'Confirm',
    'dispatch.cancel': 'Cancel',
    'dispatch.error': "Couldn't notify the office. Please try again or call us.",

    // Routes — Terminal 2
    'route.t2.name': 'Terminal 2',
    'route.t2.detail': 'Walk to T2 West Multi Storey, Level 0',
    'route.t2.step1.instruction': 'Keep left past Starbucks',
    'route.t2.step1.detail': 'After baggage reclaim, head left past Starbucks. Follow signs for car parks and the Pick-up zone.',
    'route.t2.step2.instruction': 'Walk to the exit doors',
    'route.t2.step2.detail': 'Continue along the corridor with KFC on your left. Head for the exit at the far end, under the "Departures / Check in" signs.',
    'route.t2.step3.instruction': 'Through the exit doors',
    'route.t2.step3.detail': 'Look for the overhead sign: "↑ Pick up zone  ↑ T2 West car park". Walk straight through.',
    'route.t2.step4.instruction': 'Enter T2 West Multi Storey',
    'route.t2.step4.detail': 'You\'ll see the "P3 T2 West Multi Storey" sign. Head inside and follow the "Pre-booked" arrow.',
    'route.t2.pickup.spot': 'T2 West Multi Storey, Level 0',
    'route.t2.pickup.detail': 'Wait in the marked pre-booked pickup area inside the car park. Your StreetCars driver will pull up to the barrier.',

    // Routes — Terminal 3
    'route.t3.name': 'Terminal 3',
    'route.t3.detail': 'Walk to the T3 Pick Up Zone (~125m)',
    'route.t3.step1.instruction': 'Exit the terminal, head left',
    'route.t3.step1.detail': 'After baggage reclaim, take the exit signed "Terminals 1 & 2 / The Station / Drop&Go / Taxi rank". Head left once outside.',
    'route.t3.step2.instruction': 'Continue along the covered walkway',
    'route.t3.step2.detail': 'Follow the overhead "T3 Pick up zone" signs down the covered walkway.',
    'route.t3.step3.instruction': 'Keep right at the end of the walkway',
    'route.t3.step3.detail': 'Where the walkway opens up, keep right and follow the pedestrian route toward the T3 Pick Up Zone.',
    'route.t3.step4.instruction': 'Keep left past the brick wall',
    'route.t3.step4.detail': 'Stay on the path — look for the yellow "T3 Pick Up Zone — Walking distance 125m" sign overhead.',
    'route.t3.step5.instruction': 'Keep right at the end of the paved walkway',
    'route.t3.step5.detail': 'The T3 Pick Up Zone signs are now in sight across the way. Keep right and follow them.',
    'route.t3.step6.instruction': 'Cross the pedestrian crossing',
    'route.t3.step6.detail': 'Head straight on. The zebra crossing leads you right into the T3 Pick Up Zone.',
    'route.t3.pickup.spot': 'T3 Pick Up Zone',
    'route.t3.pickup.detail': 'Wait at the marked pickup area just across the crossing. Your StreetCars driver will pull up to the kerb.',

    'lang.label': 'Language'
  },

  /* ====================== SPANISH ====================== */
  es: {
    'brand.name': 'StreetCars Manchester',

    'entry.eyebrow': 'Bienvenido a Manchester',
    'entry.title': '¿Ya has llegado?',
    'entry.subtitle': 'Te guiaremos desde llegadas hasta el punto de recogida.',
    'entry.yes': 'Sí, ya he aterrizado',
    'entry.no': 'Todavía no - muéstrame la guía',

    'book.now': 'Reservar ahora / Pedir presupuesto',

    'footer.help_prefix': '¿Necesitas ayuda?',
    'footer.call_us': 'Llámanos al 0161 228 7878',

    'footer.contact_label': 'Contactar con StreetCars',
    'footer.call_office': 'Llamar a la oficina',
    'footer.request_callback': 'Pedir que me llamen',
    'footer.live_chat': 'Chat en vivo',

    'booking.eyebrow': 'Bienvenido a Manchester',
    'booking.title': 'Encuentra a tu conductor.',
    'booking.subtitle': 'Introduce el número de reserva que te enviamos por correo o teléfono.',
    'booking.label': 'Número de reserva',
    'booking.help': '8 dígitos — están en tu mensaje de confirmación.',
    'booking.continue': 'Continuar',
    'booking.error.invalid': 'Por favor, introduce los 8 dígitos de tu reserva.',
    'booking.error.not_found': 'No hemos encontrado esa reserva. Comprueba el número e inténtalo de nuevo.',
    'booking.error.archived': 'Hay un problema con esta reserva. Llámanos al 0161 228 7878.',
    'booking.error.server': 'Algo ha salido mal. Inténtalo de nuevo o llámanos al 0161 228 7878.',

    'picker.eyebrow.confirmed': 'Reserva confirmada',
    'picker.eyebrow.browse': 'Explorar la guía de recogida',
    'picker.eyebrow.welcome': 'Bienvenido, {name}',
    'picker.title': '¿Qué terminal?',
    'picker.subtitle': 'Elige dónde has aterrizado y te guiaremos hasta el coche.',

    'nav.back': 'Volver',
    'nav.step_progress': 'Paso {current} de {total} · ~{time}',
    'nav.photo_count': 'Foto {current} de {total}',
    'nav.next': 'Lo veo — siguiente',
    'nav.last': 'Estoy en el punto de recogida',

    'arrived.youve_arrived': 'Has llegado',
    'arrived.pickup_at': 'Recogida en',
    'arrived.your_driver': 'Tu conductor',
    'arrived.track': 'Seguir al conductor en directo',
    'arrived.call_driver': 'Llamar a la oficina',
    'arrived.callback': 'Que me llamen',
    'arrived.chat': 'Chat',
    'arrived.eta': 'El conductor llegará en breve',
    'arrived.browse.message_1': 'Este es el punto de recogida de StreetCars en el aeropuerto de Manchester.',
    'arrived.browse.message_2_before': 'Cuando hayas aterrizado,',
    'arrived.browse.call_us_link': 'llámanos al 0161 228 7878',
    'arrived.browse.message_2_after': 'para reservar un viaje y te traeremos justo aquí.',
    'arrived.browse.i_landed': 'He llegado — encontrar a mi conductor',

    // Chat en directo
    'chat.title': 'Equipo de oficina',
    'chat.online': 'En línea · suele responder en minutos',
    'chat.empty': 'Saluda — nuestro equipo está aquí para ayudarte.',
    'chat.placeholder': 'Mensaje a la oficina…',
    'chat.send': 'Enviar mensaje',

    'dialog.title': 'Pedir que te llamen',
    'dialog.subtitle': 'Te llamaremos enseguida.',
    'dialog.phone_label': 'Tu número de teléfono (opcional)',
    'dialog.phone_placeholder': '07700 900123',
    'dialog.message_label': 'Tu mensaje (opcional)',
    'dialog.message_placeholder': '¿Algo que debamos saber?',
    'dialog.cancel': 'Cancelar',
    'dialog.send': 'Enviar',
    'dialog.success_title': 'Recibido — te contactaremos.',
    'dialog.success_subtitle': 'Esto es lo que nos has enviado:',
    'dialog.preview_phone': 'Teléfono',
    'dialog.preview_message': 'Mensaje',
    'dialog.done': 'Hecho',
    'dialog.close': 'Cerrar',
    'dialog.error.phone_or_message': 'Introduce un número de teléfono o un mensaje.',
    'dialog.error.invalid_phone': 'Introduce un número de teléfono válido.',
    'dialog.error.server': 'No se ha podido enviar. Inténtalo de nuevo o llámanos directamente.',

    'dispatch.title': 'Enviando a tu conductor',
    'dispatch.message': 'Tu conductor será enviado de inmediato. Por favor, continúa solo cuando hayas recogido tu equipaje y estés listo para dirigirte al punto de recogida. Después te indicaremos cómo llegar al punto de recogida.',
    'dispatch.confirm': 'Confirmar',
    'dispatch.cancel': 'Cancelar',
    'dispatch.error': 'No se pudo notificar a la oficina. Inténtalo de nuevo o llámanos.',

    'route.t2.name': 'Terminal 2',
    'route.t2.detail': 'Camina hasta T2 West Multi Storey, Nivel 0',
    'route.t2.step1.instruction': 'Mantente a la izquierda pasando Starbucks',
    'route.t2.step1.detail': 'Después de recoger el equipaje, gira a la izquierda pasando Starbucks. Sigue las señales de aparcamientos y zona de recogida.',
    'route.t2.step2.instruction': 'Camina hasta las puertas de salida',
    'route.t2.step2.detail': 'Continúa por el pasillo con KFC a tu izquierda. Dirígete a la salida al fondo, bajo los carteles "Departures / Check in".',
    'route.t2.step3.instruction': 'A través de las puertas de salida',
    'route.t2.step3.detail': 'Busca el cartel: "↑ Pick up zone  ↑ T2 West car park". Sigue recto.',
    'route.t2.step4.instruction': 'Entra en T2 West Multi Storey',
    'route.t2.step4.detail': 'Verás el cartel "P3 T2 West Multi Storey". Entra y sigue la flecha "Pre-booked".',
    'route.t2.pickup.spot': 'T2 West Multi Storey, Nivel 0',
    'route.t2.pickup.detail': 'Espera en la zona de recogida pre-reservada dentro del aparcamiento. Tu conductor de StreetCars llegará hasta la barrera.',

    'route.t3.name': 'Terminal 3',
    'route.t3.detail': 'Camina hasta la zona de recogida T3 (~125 m)',
    'route.t3.step1.instruction': 'Sal de la terminal, gira a la izquierda',
    'route.t3.step1.detail': 'Después de recoger el equipaje, toma la salida que indica "Terminals 1 & 2 / The Station / Drop&Go / Taxi rank". Gira a la izquierda una vez fuera.',
    'route.t3.step2.instruction': 'Continúa por el paseo cubierto',
    'route.t3.step2.detail': 'Sigue los carteles superiores "T3 Pick up zone" por el paseo cubierto.',
    'route.t3.step3.instruction': 'Mantente a la derecha al final del paseo',
    'route.t3.step3.detail': 'Cuando el paseo se abra, mantente a la derecha y sigue la ruta peatonal hacia la zona de recogida T3.',
    'route.t3.step4.instruction': 'Mantente a la izquierda pasando el muro de ladrillo',
    'route.t3.step4.detail': 'Sigue el camino — busca el cartel amarillo "T3 Pick Up Zone — Walking distance 125m" arriba.',
    'route.t3.step5.instruction': 'Mantente a la derecha al final del paseo pavimentado',
    'route.t3.step5.detail': 'Ya verás los carteles de la zona de recogida T3 al otro lado. Mantente a la derecha y síguelos.',
    'route.t3.step6.instruction': 'Cruza el paso de peatones',
    'route.t3.step6.detail': 'Sigue recto. El paso de cebra te lleva directamente a la zona de recogida T3.',
    'route.t3.pickup.spot': 'Zona de recogida T3',
    'route.t3.pickup.detail': 'Espera en el área de recogida justo al cruzar. Tu conductor de StreetCars llegará al bordillo.',

    'lang.label': 'Idioma'
  },

  /* ====================== ARABIC (RTL) ====================== */
  ar: {
    'brand.name': 'StreetCars مانشستر',

    'entry.eyebrow': 'مرحبًا بك في مانشستر',
    'entry.title': 'هل وصلت؟',
    'entry.subtitle': 'سنرشدك من بوابة الوصول إلى مكان الاستلام.',
    'entry.yes': 'نعم، لقد هبطت',
    'entry.no': 'ليس بعد - أرني الدليل',

    'book.now': 'احجز الآن / احصل على عرض سعر',

    'footer.help_prefix': 'هل تحتاج إلى مساعدة؟',
    'footer.call_us': 'اتصل بنا على 7878 228 0161',

    'footer.contact_label': 'التواصل مع StreetCars',
    'footer.call_office': 'اتصل بالمكتب',
    'footer.request_callback': 'اطلب معاودة الاتصال',
    'footer.live_chat': 'الدردشة المباشرة',

    'booking.eyebrow': 'مرحبًا بك في مانشستر',
    'booking.title': 'ابحث عن سائقك.',
    'booking.subtitle': 'أدخل رقم الحجز الذي أرسلناه إلى بريدك الإلكتروني أو هاتفك.',
    'booking.label': 'رقم الحجز',
    'booking.help': '8 أرقام — ستجدها في رسالة التأكيد.',
    'booking.continue': 'متابعة',
    'booking.error.invalid': 'يرجى إدخال جميع الأرقام الثمانية لرقم الحجز.',
    'booking.error.not_found': 'لم نتمكن من العثور على هذا الحجز. يرجى التحقق من الرقم والمحاولة مرة أخرى.',
    'booking.error.archived': 'هناك مشكلة في هذا الحجز. يرجى الاتصال بنا على 7878 228 0161.',
    'booking.error.server': 'حدث خطأ ما. يرجى المحاولة مرة أخرى أو الاتصال بنا على 7878 228 0161.',

    'picker.eyebrow.confirmed': 'تم تأكيد الحجز',
    'picker.eyebrow.browse': 'تصفح دليل الاستلام',
    'picker.eyebrow.welcome': 'مرحبًا، {name}',
    'picker.title': 'أي صالة؟',
    'picker.subtitle': 'اختر المكان الذي هبطت فيه وسنرافقك إلى السيارة.',

    'nav.back': 'رجوع',
    'nav.step_progress': 'الخطوة {current} من {total} · ~{time}',
    'nav.photo_count': 'صورة {current} من {total}',
    'nav.next': 'أرى هذا — التالي',
    'nav.last': 'أنا في مكان الاستلام',

    'arrived.youve_arrived': 'لقد وصلت',
    'arrived.pickup_at': 'الاستلام في',
    'arrived.your_driver': 'سائقك',
    'arrived.track': 'تتبع السائق مباشرة',
    'arrived.call_driver': 'اتصل بالمكتب',
    'arrived.callback': 'معاودة الاتصال',
    'arrived.chat': 'دردشة',
    'arrived.eta': 'السائق في الطريق',
    'arrived.browse.message_1': 'هذا هو مكان استلام StreetCars في مطار مانشستر.',
    'arrived.browse.message_2_before': 'بمجرد أن تهبط،',
    'arrived.browse.call_us_link': 'اتصل بنا على 7878 228 0161',
    'arrived.browse.message_2_after': 'لحجز رحلة وسنعيدك إلى هنا.',
    'arrived.browse.i_landed': 'لقد وصلت — ابحث عن سائقي',

    // الدردشة المباشرة
    'chat.title': 'فريق المكتب',
    'chat.online': 'متصل · يرد عادةً خلال دقائق',
    'chat.empty': 'ألقِ التحية — فريق المكتب هنا للمساعدة.',
    'chat.placeholder': 'رسالة إلى المكتب…',
    'chat.send': 'إرسال الرسالة',

    'dialog.title': 'اطلب معاودة الاتصال',
    'dialog.subtitle': 'سنعاود الاتصال بك على الفور.',
    'dialog.phone_label': 'رقم هاتفك (اختياري)',
    'dialog.phone_placeholder': '07700 900123',
    'dialog.message_label': 'رسالتك (اختياري)',
    'dialog.message_placeholder': 'هل هناك شيء يجب أن نعرفه؟',
    'dialog.cancel': 'إلغاء',
    'dialog.send': 'إرسال',
    'dialog.success_title': 'تم الاستلام — سنتواصل معك.',
    'dialog.success_subtitle': 'هذا ما أرسلته لنا:',
    'dialog.preview_phone': 'الهاتف',
    'dialog.preview_message': 'الرسالة',
    'dialog.done': 'تم',
    'dialog.close': 'إغلاق',
    'dialog.error.phone_or_message': 'يرجى إدخال رقم هاتف أو رسالة.',
    'dialog.error.invalid_phone': 'يرجى إدخال رقم هاتف صحيح.',
    'dialog.error.server': 'تعذر الإرسال الآن. يرجى المحاولة مرة أخرى أو الاتصال بنا مباشرة.',

    'dispatch.title': 'نُرسل سائقك إليك',
    'dispatch.message': 'سيتم إرسال سائقك فورًا. يُرجى المتابعة فقط بعد استلام أمتعتك والاستعداد للتوجه إلى نقطة الالتقاء. بعد ذلك، سنزوّدك بالتوجيهات للوصول إلى موقع الاستلام.',
    'dispatch.confirm': 'تأكيد',
    'dispatch.cancel': 'إلغاء',
    'dispatch.error': 'تعذّر إبلاغ المكتب. حاول مرة أخرى أو اتصل بنا.',

    'route.t2.name': 'الصالة 2',
    'route.t2.detail': 'امشِ إلى T2 West Multi Storey، الطابق 0',
    'route.t2.step1.instruction': 'ابقَ على اليسار بعد Starbucks',
    'route.t2.step1.detail': 'بعد استلام الأمتعة، اتجه يسارًا متجاوزًا Starbucks. اتبع لافتات مواقف السيارات ومنطقة الاستلام.',
    'route.t2.step2.instruction': 'امشِ إلى أبواب الخروج',
    'route.t2.step2.detail': 'تابع السير في الممر مع KFC على يسارك. اتجه إلى الخروج في الطرف البعيد، تحت لافتات "Departures / Check in".',
    'route.t2.step3.instruction': 'عبر أبواب الخروج',
    'route.t2.step3.detail': 'ابحث عن اللافتة العلوية: "↑ Pick up zone  ↑ T2 West car park". امشِ مباشرة.',
    'route.t2.step4.instruction': 'ادخل إلى T2 West Multi Storey',
    'route.t2.step4.detail': 'سترى لافتة "P3 T2 West Multi Storey". ادخل واتبع سهم "Pre-booked".',
    'route.t2.pickup.spot': 'T2 West Multi Storey، الطابق 0',
    'route.t2.pickup.detail': 'انتظر في منطقة الاستلام المخصصة للحجوزات المسبقة داخل موقف السيارات. سيتوقف سائق StreetCars عند الحاجز.',

    'route.t3.name': 'الصالة 3',
    'route.t3.detail': 'امشِ إلى منطقة استلام T3 (حوالي 125 م)',
    'route.t3.step1.instruction': 'اخرج من الصالة واتجه يسارًا',
    'route.t3.step1.detail': 'بعد استلام الأمتعة، اسلك المخرج الذي يحمل لافتة "Terminals 1 & 2 / The Station / Drop&Go / Taxi rank". اتجه يسارًا بمجرد الخروج.',
    'route.t3.step2.instruction': 'تابع السير على الممشى المغطى',
    'route.t3.step2.detail': 'اتبع لافتات "T3 Pick up zone" العلوية على طول الممشى المغطى.',
    'route.t3.step3.instruction': 'ابقَ على اليمين في نهاية الممشى',
    'route.t3.step3.detail': 'حيث ينفتح الممشى، ابقَ على اليمين واتبع المسار المخصص للمشاة نحو منطقة استلام T3.',
    'route.t3.step4.instruction': 'ابقَ على اليسار بعد الجدار الطوبي',
    'route.t3.step4.detail': 'ابقَ على المسار — ابحث عن اللافتة الصفراء "T3 Pick Up Zone — Walking distance 125m" في الأعلى.',
    'route.t3.step5.instruction': 'ابقَ على اليمين في نهاية الممشى المعبد',
    'route.t3.step5.detail': 'لافتات منطقة استلام T3 ظاهرة الآن على الجانب الآخر. ابقَ على اليمين واتبعها.',
    'route.t3.step6.instruction': 'اعبر معبر المشاة',
    'route.t3.step6.detail': 'تابع السير مباشرة. سيقودك معبر المشاة مباشرة إلى منطقة استلام T3.',
    'route.t3.pickup.spot': 'منطقة استلام T3',
    'route.t3.pickup.detail': 'انتظر في منطقة الاستلام المحددة بعد عبور المعبر. سيتوقف سائق StreetCars عند الرصيف.',

    'lang.label': 'اللغة'
  },

  /* ====================== MANDARIN (Simplified) ====================== */
  'zh-CN': {
    'brand.name': 'StreetCars 曼彻斯特',

    'entry.eyebrow': '欢迎来到曼彻斯特',
    'entry.title': '您到达了吗？',
    'entry.subtitle': '我们将引导您从到达大厅一路前往接送地点。',
    'entry.yes': '是的，我已经落地',
    'entry.no': '还没有 - 给我看指南',

    'book.now': '立即预订 / 获取报价',

    'footer.help_prefix': '需要帮助？',
    'footer.call_us': '请致电 0161 228 7878',

    'footer.contact_label': '联系 StreetCars',
    'footer.call_office': '致电办公室',
    'footer.request_callback': '请求回电',
    'footer.live_chat': '在线聊天',

    'booking.eyebrow': '欢迎来到曼彻斯特',
    'booking.title': '找到您的司机。',
    'booking.subtitle': '输入我们发送到您邮箱或手机的预订号。',
    'booking.label': '预订号',
    'booking.help': '8 位数字 — 可在确认信息中找到。',
    'booking.continue': '继续',
    'booking.error.invalid': '请输入完整的 8 位预订号。',
    'booking.error.not_found': '未找到该预订。请检查号码后重试。',
    'booking.error.archived': '该预订有问题。请致电 0161 228 7878。',
    'booking.error.server': '出错了。请重试或致电 0161 228 7878。',

    'picker.eyebrow.confirmed': '预订已确认',
    'picker.eyebrow.browse': '浏览接送指南',
    'picker.eyebrow.welcome': '欢迎您，{name}',
    'picker.title': '哪个航站楼？',
    'picker.subtitle': '请选择您降落的位置，我们会带您到车旁。',

    'nav.back': '返回',
    'nav.step_progress': '第 {current} 步，共 {total} 步 · ~{time}',
    'nav.photo_count': '第 {current} 张，共 {total} 张',
    'nav.next': '我看到了 — 下一步',
    'nav.last': '我已到达接送点',

    'arrived.youve_arrived': '您已到达',
    'arrived.pickup_at': '接送地点：',
    'arrived.your_driver': '您的司机',
    'arrived.track': '实时跟踪司机',
    'arrived.call_driver': '致电办公室',
    'arrived.callback': '回电',
    'arrived.chat': '聊天',
    'arrived.eta': '司机即将到达',
    'arrived.browse.message_1': '这是曼彻斯特机场的 StreetCars 接送地点。',
    'arrived.browse.message_2_before': '当您落地后，',
    'arrived.browse.call_us_link': '请致电 0161 228 7878',
    'arrived.browse.message_2_after': '预订车辆，我们会把您带回这里。',
    'arrived.browse.i_landed': '我已到达 — 找到我的司机',

    // 实时聊天
    'chat.title': '办公室团队',
    'chat.online': '在线 · 通常几分钟内回复',
    'chat.empty': '打个招呼 — 我们的办公室团队随时为您服务。',
    'chat.placeholder': '给办公室发消息…',
    'chat.send': '发送消息',

    'dialog.title': '请求回电',
    'dialog.subtitle': '我们会立即回电给您。',
    'dialog.phone_label': '您的电话号码（可选）',
    'dialog.phone_placeholder': '07700 900123',
    'dialog.message_label': '您的留言（可选）',
    'dialog.message_placeholder': '有什么我们需要知道的吗？',
    'dialog.cancel': '取消',
    'dialog.send': '发送',
    'dialog.success_title': '已收到 — 我们会联系您。',
    'dialog.success_subtitle': '这是您发送给我们的内容：',
    'dialog.preview_phone': '电话',
    'dialog.preview_message': '留言',
    'dialog.done': '完成',
    'dialog.close': '关闭',
    'dialog.error.phone_or_message': '请输入电话号码或留言。',
    'dialog.error.invalid_phone': '请输入有效的电话号码。',
    'dialog.error.server': '目前无法发送。请重试或直接致电我们。',

    'dispatch.title': '正在派遣您的司机',
    'dispatch.message': '我们将立即为您安排司机。请在领取行李并准备前往接送点后再继续。随后我们会为您提供前往接送地点的路线指引。',
    'dispatch.confirm': '确认',
    'dispatch.cancel': '取消',
    'dispatch.error': '无法通知办公室。请重试或致电我们。',

    'route.t2.name': '2 号航站楼',
    'route.t2.detail': '步行至 T2 West Multi Storey，0 层',
    'route.t2.step1.instruction': '在 Starbucks 旁靠左走',
    'route.t2.step1.detail': '取行李后，向左经过 Starbucks。按"停车场"和"Pick-up zone"指示牌走。',
    'route.t2.step2.instruction': '步行至出口大门',
    'route.t2.step2.detail': '沿走廊继续前行，KFC 在您左侧。前往尽头的出口，在"Departures / Check in"指示牌下方。',
    'route.t2.step3.instruction': '穿过出口大门',
    'route.t2.step3.detail': '寻找头顶的指示牌："↑ Pick up zone  ↑ T2 West car park"。直接穿过。',
    'route.t2.step4.instruction': '进入 T2 West Multi Storey',
    'route.t2.step4.detail': '您会看到"P3 T2 West Multi Storey"标志。进入后沿"Pre-booked"箭头走。',
    'route.t2.pickup.spot': 'T2 West Multi Storey，0 层',
    'route.t2.pickup.detail': '在停车场内标记的预订接送区等候。您的 StreetCars 司机会停在闸门旁。',

    'route.t3.name': '3 号航站楼',
    'route.t3.detail': '步行至 T3 接送区（约 125 米）',
    'route.t3.step1.instruction': '离开航站楼，向左走',
    'route.t3.step1.detail': '取行李后，从写有"Terminals 1 & 2 / The Station / Drop&Go / Taxi rank"的出口离开。出门后向左走。',
    'route.t3.step2.instruction': '沿有顶棚的走道继续前行',
    'route.t3.step2.detail': '沿有顶棚的走道按头顶的"T3 Pick up zone"指示牌走。',
    'route.t3.step3.instruction': '走道尽头靠右走',
    'route.t3.step3.detail': '走道变开阔后，靠右走并按行人通道前往 T3 接送区。',
    'route.t3.step4.instruction': '经过砖墙后靠左走',
    'route.t3.step4.detail': '保持在路上 — 注意头顶的黄色标志"T3 Pick Up Zone — Walking distance 125m"。',
    'route.t3.step5.instruction': '铺砌走道尽头靠右走',
    'route.t3.step5.detail': '现在可以看到对面的 T3 接送区指示牌。靠右走并跟随指示。',
    'route.t3.step6.instruction': '通过斑马线',
    'route.t3.step6.detail': '直行。斑马线会直接带您到 T3 接送区。',
    'route.t3.pickup.spot': 'T3 接送区',
    'route.t3.pickup.detail': '在斑马线对面的标记接送区等候。您的 StreetCars 司机会停在路边。',

    'lang.label': '语言'
  },

  /* ====================== CANTONESE (Traditional) ====================== */
  'zh-HK': {
    'brand.name': 'StreetCars 曼徹斯特',

    'entry.eyebrow': '歡迎來到曼徹斯特',
    'entry.title': '您到達了嗎？',
    'entry.subtitle': '我哋會帶您由到達大堂一路去到接送地點。',
    'entry.yes': '係，我已經落機',
    'entry.no': '未呀 - 畀我睇睇指南',

    'book.now': '立即預訂 / 索取報價',

    'footer.help_prefix': '需要幫忙？',
    'footer.call_us': '請致電 0161 228 7878',

    'footer.contact_label': '聯絡 StreetCars',
    'footer.call_office': '致電辦公室',
    'footer.request_callback': '要求回電',
    'footer.live_chat': '即時對話',

    'booking.eyebrow': '歡迎來到曼徹斯特',
    'booking.title': '搵您嘅司機。',
    'booking.subtitle': '輸入我哋寄到您電郵或手機嘅預訂編號。',
    'booking.label': '預訂編號',
    'booking.help': '8 位數字 — 喺確認訊息度搵到。',
    'booking.continue': '繼續',
    'booking.error.invalid': '請輸入完整嘅 8 位預訂編號。',
    'booking.error.not_found': '搵唔到呢個預訂。請檢查號碼再試。',
    'booking.error.archived': '呢個預訂有問題。請致電 0161 228 7878。',
    'booking.error.server': '出咗錯。請再試或致電 0161 228 7878。',

    'picker.eyebrow.confirmed': '預訂已確認',
    'picker.eyebrow.browse': '瀏覽接送指南',
    'picker.eyebrow.welcome': '歡迎，{name}',
    'picker.title': '邊個客運大樓？',
    'picker.subtitle': '揀您落機嘅位置，我哋會帶您去到車度。',

    'nav.back': '返回',
    'nav.step_progress': '第 {current} 步，共 {total} 步 · ~{time}',
    'nav.photo_count': '第 {current} 張，共 {total} 張',
    'nav.next': '見到喇 — 下一步',
    'nav.last': '我喺接送點度',

    'arrived.youve_arrived': '您已到達',
    'arrived.pickup_at': '接送地點：',
    'arrived.your_driver': '您嘅司機',
    'arrived.track': '即時追蹤司機',
    'arrived.call_driver': '致電辦公室',
    'arrived.callback': '回電',
    'arrived.chat': '對話',
    'arrived.eta': '司機即將到達',
    'arrived.browse.message_1': '呢個係曼徹斯特機場嘅 StreetCars 接送地點。',
    'arrived.browse.message_2_before': '當您落咗機之後，',
    'arrived.browse.call_us_link': '請致電 0161 228 7878',
    'arrived.browse.message_2_after': '預訂車輛，我哋會帶您返嚟呢度。',
    'arrived.browse.i_landed': '我已到達 — 搵我嘅司機',

    // 即時對話
    'chat.title': '辦公室團隊',
    'chat.online': '在線 · 通常幾分鐘內回覆',
    'chat.empty': '打個招呼 — 我哋嘅辦公室團隊隨時幫您。',
    'chat.placeholder': '畀辦公室發訊息…',
    'chat.send': '發送訊息',

    'dialog.title': '要求回電',
    'dialog.subtitle': '我哋會即刻回電畀您。',
    'dialog.phone_label': '您嘅電話號碼（可選）',
    'dialog.phone_placeholder': '07700 900123',
    'dialog.message_label': '您嘅留言（可選）',
    'dialog.message_placeholder': '有冇嘢想我哋知？',
    'dialog.cancel': '取消',
    'dialog.send': '發送',
    'dialog.success_title': '收到 — 我哋會聯絡您。',
    'dialog.success_subtitle': '以下係您發送嘅內容：',
    'dialog.preview_phone': '電話',
    'dialog.preview_message': '留言',
    'dialog.done': '完成',
    'dialog.close': '關閉',
    'dialog.error.phone_or_message': '請輸入電話號碼或留言。',
    'dialog.error.invalid_phone': '請輸入有效嘅電話號碼。',
    'dialog.error.server': '依家發送唔到。請再試或直接致電我哋。',

    'dispatch.title': '正在派遣您嘅司機',
    'dispatch.message': '我哋會即時安排您嘅司機。請喺攞齊行李並準備前往接送地點後先繼續。之後我哋會提供前往接送地點嘅指引。',
    'dispatch.confirm': '確認',
    'dispatch.cancel': '取消',
    'dispatch.error': '無法通知辦公室。請再試或致電我哋。',

    'route.t2.name': '2 號客運大樓',
    'route.t2.detail': '步行至 T2 West Multi Storey，0 層',
    'route.t2.step1.instruction': '行過 Starbucks 後靠左',
    'route.t2.step1.detail': '取行李後，向左經過 Starbucks。跟住「停車場」同「Pick-up zone」嘅指示牌行。',
    'route.t2.step2.instruction': '步行至出口大門',
    'route.t2.step2.detail': '沿走廊繼續行，KFC 喺您左邊。前往盡頭嘅出口，喺「Departures / Check in」指示牌下面。',
    'route.t2.step3.instruction': '穿過出口大門',
    'route.t2.step3.detail': '搵頭頂嘅指示牌：「↑ Pick up zone  ↑ T2 West car park」。直接行過。',
    'route.t2.step4.instruction': '進入 T2 West Multi Storey',
    'route.t2.step4.detail': '您會見到「P3 T2 West Multi Storey」標誌。入去之後跟「Pre-booked」箭頭。',
    'route.t2.pickup.spot': 'T2 West Multi Storey，0 層',
    'route.t2.pickup.detail': '喺停車場內標記嘅預訂接送區等。您嘅 StreetCars 司機會停喺閘門旁邊。',

    'route.t3.name': '3 號客運大樓',
    'route.t3.detail': '步行至 T3 接送區（約 125 米）',
    'route.t3.step1.instruction': '離開客運大樓，向左行',
    'route.t3.step1.detail': '取行李後，從寫住「Terminals 1 & 2 / The Station / Drop&Go / Taxi rank」嘅出口離開。出咗門之後向左行。',
    'route.t3.step2.instruction': '沿有蓋走道繼續行',
    'route.t3.step2.detail': '沿有蓋走道跟住頭頂嘅「T3 Pick up zone」指示牌行。',
    'route.t3.step3.instruction': '走道盡頭靠右行',
    'route.t3.step3.detail': '走道變開揚之後，靠右行並跟住行人通道前往 T3 接送區。',
    'route.t3.step4.instruction': '經過磚牆之後靠左行',
    'route.t3.step4.detail': '保持喺路上 — 留意頭頂嘅黃色標誌「T3 Pick Up Zone — Walking distance 125m」。',
    'route.t3.step5.instruction': '鋪砌走道盡頭靠右行',
    'route.t3.step5.detail': '依家可以見到對面嘅 T3 接送區指示牌。靠右行並跟住指示。',
    'route.t3.step6.instruction': '過斑馬線',
    'route.t3.step6.detail': '直行。斑馬線會直接帶您去到 T3 接送區。',
    'route.t3.pickup.spot': 'T3 接送區',
    'route.t3.pickup.detail': '喺斑馬線對面嘅標記接送區度等。您嘅 StreetCars 司機會停喺路邊。',

    'lang.label': '語言'
  }
};

/* ============================================================
   Public API
============================================================ */
const LANG_STORAGE_KEY = 'streetcars.lang';
let currentLang = 'en';

function t(key, vars) {
  const dict = I18N[currentLang] || I18N.en;
  let str = dict[key];
  if (str == null) str = I18N.en[key];     // fall back to English
  if (str == null) str = key;              // last resort: show the key
  if (vars) {
    for (const k in vars) {
      str = str.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    }
  }
  return str;
}

function langMeta(code) {
  return LANGS.find(l => l.code === code);
}

function applyLang(code) {
  if (!I18N[code]) code = 'en';
  currentLang = code;
  try { localStorage.setItem(LANG_STORAGE_KEY, code); } catch {}

  const meta = langMeta(code);
  document.documentElement.lang = code;
  document.documentElement.dir = meta && meta.rtl ? 'rtl' : 'ltr';

  // textContent translations
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Attribute translations: data-i18n-attr="aria-label:nav.back"
  document.querySelectorAll('[data-i18n-attr]').forEach(el => {
    el.dataset.i18nAttr.split(',').forEach(pair => {
      const [attr, key] = pair.split(':').map(s => s.trim());
      if (attr && key) el.setAttribute(attr, t(key));
    });
  });

  // Placeholder translations: data-i18n-placeholder="dialog.phone_placeholder"
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });

  // Update the language picker's active state
  document.querySelectorAll('.lang-picker__btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === code);
    btn.setAttribute('aria-pressed', btn.dataset.lang === code ? 'true' : 'false');
  });

  // Notify the app so it can re-render any view that holds dynamic strings
  window.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
}

function detectLang() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && I18N[stored]) return stored;
  } catch {}

  const browser = (navigator.language || 'en');
  if (I18N[browser]) return browser;

  // Match prefix (e.g. 'es-MX' → 'es', 'zh-TW' → 'zh-HK')
  const prefix = browser.split('-')[0];
  if (prefix === 'zh') {
    // Treat any Traditional-character locale as Cantonese (HK/TW); else Simplified.
    if (/-(TW|HK|MO)\b/i.test(browser)) return 'zh-HK';
    return 'zh-CN';
  }
  const match = LANGS.find(l => l.code.startsWith(prefix));
  return match ? match.code : 'en';
}

function renderLangPicker(containerId) {
  const root = document.getElementById(containerId);
  if (!root) return;
  root.innerHTML = LANGS.map(l => `
    <button
      class="lang-picker__btn${l.code === currentLang ? ' is-active' : ''}"
      type="button"
      data-lang="${l.code}"
      aria-pressed="${l.code === currentLang ? 'true' : 'false'}"
      title="${l.name}"
    >
      <span class="lang-picker__flag" aria-hidden="true">${l.flag}</span>
      <span class="lang-picker__short">${l.short}</span>
    </button>
  `).join('');

  root.querySelectorAll('.lang-picker__btn').forEach(btn => {
    btn.addEventListener('click', () => applyLang(btn.dataset.lang));
  });
}
