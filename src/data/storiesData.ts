export interface QuranicStory {
  id: string;
  titleAr: string;
  titleEn: string;
  surahNumber: number;
  surahNameAr: string;
  surahNameEn: string;
  verseRange: string;
  triggerVerse: number; // The main verse to show the "Story Button" on
  topic: string;
  narrativeAr: string;
  narrativeEn: string;
  lessonsAr: string[];
  lessonsEn: string[];
  icon: string; // lucide icon name representation
  gradient: string; // Tailwind class gradient for story card background
}

export const quranicStories: QuranicStory[] = [
  {
    id: "prophet-honey",
    titleAr: "قصة النبي ﷺ والعسل وحرمة التضييق",
    titleEn: "The Prophet ﷺ and the Honey Incident",
    surahNumber: 66,
    surahNameAr: "التحريم",
    surahNameEn: "At-Tahrim",
    verseRange: "1-3",
    triggerVerse: 1,
    topic: "سلوكيات الرسول ﷺ والعدالة والرفق بالزوجات وتنزيه مقام النبوة عن التحريم الخاص",
    narrativeAr: "امتنع النبي ﷺ عن شرب العسل عند بعض نسائه إرضاءً لبعضهن الآخر بعد تظاهرهن بلطف، فنزل العتاب الإلهي العظيم يعاتب رسوله الكريم ﷺ رفقاً به لئلا يحرم على نفسه ما أحل الله له من الطيبات تطييباً لخواطر الآخرين، مرسخاً عظمة الوحي وتورع النبي ورحمته الواسعة.",
    narrativeEn: "The Prophet ﷺ abstained from drinking honey at the house of one of his wives to please others who plotted a gentle scheme. Devine revelation descended to gently admonish the Prophet ﷺ out of immense mercy, declaring that he should not forbid what Allah made lawful for him just to satisfy human hearts.",
    lessonsAr: [
      "تجنب تحريم الطيبات التي أحلها الله سبحانه تحت أي ظرف أو إرضاءً للغير.",
      "مقام وعصمة النبوة مصان بالوحي المباشر وتصحيح المسار فوراً بمحبة.",
      "أهمية الصدق والمحبة والرفق داخل بيوت المسلمين وتأصيل التفاهم العائلي."
    ],
    lessonsEn: [
      "Never forbid the lawful pure things that Allah has permitted to please anyone.",
      "The infallibility of Prophethood is preserved by continuous loving revelation.",
      "The value of absolute honesty, tenderness, and mutual respect in marital life."
    ],
    icon: "Apple",
    gradient: "from-amber-600/15 via-stone-900 to-amber-950/20"
  },
  {
    id: "blind-man",
    titleAr: "قصة النبي ﷺ والعبد الصالح ابن أم مكتوم",
    titleEn: "The Prophet ﷺ and the Blind Scholar",
    surahNumber: 80,
    surahNameAr: "عبس",
    surahNameEn: "Abasa",
    verseRange: "1-10",
    triggerVerse: 1,
    topic: "تساوي النفوس عند الله وتقديم طالب الهداية والفقير على وجهاء الدنيا المشتتين",
    narrativeAr: "كان النبي ﷺ منشغلاً بدعوة كبار صناديد قريش طمعاً في إسلامهم لدعم الدعوة، فجاءه الصحابي الأعمى الفقير عبدالله بن أم مكتوم يسأله الهداية، فأعرض عنه النبي قليلاً؛ فعاتبه الله بلطف وعظمة ليعلم الأمة أن مقاييس الخالق تزن القلوب التقية المقبلة لا المظاهر الفانية والوجاهات الدنيوية المستغنية.",
    narrativeEn: "While the Prophet ﷺ was deeply engaged in calling the wealthy chiefs of Quraish to Islam, a blind, poor companion named Abdullah ibn Umm Maktum approached him seeking guidance. The Prophet turned away slightly; God gently admonished him to teach humanity that divine criteria weigh pure hearts above false worldly prestige.",
    lessonsAr: [
      "المعيار الحقيقي لعلو الشأن عند رب العباد هو التقوى والطلب الصادق للعلم والهداية.",
      "حق الضعفاء والفقراء والمبتلين مقدم في الدعوة والتعامل الاجتماعي الحاني.",
      "عتاب الأنبياء دليل على صيانة الرسالة وبلوغ قمة الأخلاق والمعاملة الإنسانية."
    ],
    lessonsEn: [
      "The ultimate divine metric is piety and a sincere heart, not status or sight.",
      "The weak and physically challenged possess a supreme status in guidance.",
      "Divine admonishment of prophets is proof of their sacred preservation."
    ],
    icon: "EyeOff",
    gradient: "from-teal-600/15 via-stone-900 to-teal-950/20"
  },
  {
    id: "sabbath-people",
    titleAr: "قصة أصحاب السبت والتحايل على حدود الله",
    titleEn: "The Sabbath-Breakers and Devine Justice",
    surahNumber: 7,
    surahNameAr: "الأعراف",
    surahNameEn: "Al-A'raf",
    verseRange: "163-166",
    triggerVerse: 163,
    topic: "الالتزام بالشريعة وحرمة المكر والخديعة ودور الفئة المصلحة في النهي عن المنكر",
    narrativeAr: "ابتلى الله قوماً من بني إسرائيل بحظر الصيد في يوم السبت، وكانت الحيتان تأتيهم وفيرة طافحة ذلك اليوم وتختفي بقية الأيام. فتحايلوا بنصب الشباك يوم الجمعة وأخذ الصيد يوم الأحد. فانقسمت القرية لثلاث فرق: فرقة اعتدت، وفرقة صمتت، وفرقة مصلحة نهت ووعظت. فنجى الله المصلحين وأخذ الظالمين بعذاب بئيس.",
    narrativeEn: "Allah tested a nation from the Children of Israel by forbidding fishing on Saturdays. The fish appeared abundantly only on Saturdays. They plotted a trick by placing nets on Fridays and collecting fish on Sundays. They split into three groups: transgressors, passive onlookers, and the reformative preachers. God saved the righteous and punished the tricksters.",
    lessonsAr: [
      "التحايل على حدود الله عز وجل بظاهر شرعي وباطن منكر من كبائر السقوط.",
      "الإيجابية والأمر بالمعروف والنهي عن المنكر هي سبب نجاة المجتمعات الإلهية.",
      "الصمت والحياد حيال المنكرات جالب للهلاك الشامل ما لم ينهَ الخيِّرون عن السوء."
    ],
    lessonsEn: [
      "Tricking divine laws of lawful and unlawful by bypass methods is severly condemned.",
      "Proactive reform and advice are the fundamental safeguards of society.",
      "Passive silence in front of corruption brings shared destruction."
    ],
    icon: "Fish",
    gradient: "from-rose-600/15 via-stone-900 to-rose-950/20"
  },
  {
    id: "saba-flood",
    titleAr: "قصة سيل العرم وضياع جنتي سبأ المترفتين",
    titleEn: "The Flood of Arim and the Lost Gardens of Saba",
    surahNumber: 34,
    surahNameAr: "سبأ",
    surahNameEn: "Saba",
    verseRange: "15-17",
    triggerVerse: 15,
    topic: "شكر النعمة وحرمة البطر والإعراض وعاقبة كفر بالنعم وضياع الحضارات",
    narrativeAr: "منّ الله على أهل سبأ بجنتين عظيمتين يمنة ويسرة وحياة رغيدة فارهة آمنة، وأمرهم بالشكر والتوحيد. فأعرضوا وبطروا النعمة وطلبوا تباعد أسفارهم كبراً. فأرسل الله عليهم سيل العرم العارم الذي دمر السد العظيم وبدّل جنتيهم بجنتين ذواتي أكل خمط وأثل وشيء من سدر قليل عقوبة لإعراضهم.",
    narrativeEn: "Allah bestowed upon Saba two magnificent gardens and a stable, secure, luxurious life, commanding them to show gratitude. They turned ungrateful and grew arrogant of their prosperity. Allah sent the devastating Flood of Arim, destroying their dam and turning their lush gardens into bitter bushes.",
    lessonsAr: [
      "بقاء النعم واستدامتها معلق دوماً بنية الشكر القلبي بالصدقة والعمل الصالح.",
      "الإصرار على عيش البطر يدمر عرى الاقتصاد والأمن القومي للحضارات.",
      "التبديل والابتلاء عقوبة عادلة لمن شبع بنعم ربه وازدرى قيمة الخير المتاح."
    ],
    lessonsEn: [
      "The sustainability of blessings is strictly tied to gratitude and charity.",
      "Arrogance and vanity of luxury crumble the strongest economic empires.",
      "Losing ancestral gifts is the ultimate consequence of showing ingratitude."
    ],
    icon: "Compass",
    gradient: "from-emerald-600/15 via-stone-900 to-emerald-950/20"
  },
  {
    id: "joseph-story",
    titleAr: "قصة يوسف عليه السلام (أحسن القصص ومدرسة الصبر)",
    titleEn: "The Story of Joseph (The Peak of Patience)",
    surahNumber: 12,
    surahNameAr: "يوسف",
    surahNameEn: "Yusuf",
    verseRange: "4-101",
    triggerVerse: 4,
    topic: "تقلب الأحوال من ظلمات البئر وقيد العبودية وفتنة القصور إلى سدة حكم مصر بالصبر الجميل",
    narrativeAr: "قصة يوسف عليه السلام هي ملحمة إيمانية متكاملة تجسد كيف يتحول كيد الإخوة وغيابات البئر الشرس، ثم الفتنة النسائية الخانقة والسجن المظلم، إلى تمكين باهر بسدة خزائن الأرض بفضل الصبر الجميل، والتقوى والوفاء، لتجتمع العائلة في النهاية بنهاية إعجازية ساجدة لله شكراً وعفواً.",
    narrativeEn: "The story of Prophet Joseph is a timeless epic showing how the sibling conspiracy, the dark well, slavery, seductive temptation, and prison cells were transformed through supreme patience, piety, and absolute integrity into absolute sovereignty over Egypt.",
    lessonsAr: [
      "عاقبة الصبر الجميل والتقوى والتعفف هي التمكين والنصر مهما طال أمد البلاء والسجن.",
      "الرؤى الصادقة أقدار حتمية يسيرها الله العليم الحكيم بتبديل دقيق مدهش.",
      "فضيلة العفو والمغفرة عند المقدرة وسد منافذ الشيطان ترفع الإنسان لأعظم المقامات الجليلة."
    ],
    lessonsEn: [
      "Piety, self-restraint, and beautiful patience culminate in direct empowerment.",
      "Sincere dreams are part of destiny designed by the Almighty Creator.",
      "Forgiving when powerful shows extreme spiritual elevation."
    ],
    icon: "Sparkles",
    gradient: "from-violet-600/15 via-stone-900 to-violet-950/20"
  },
  {
    id: "cave-companions",
    titleAr: "قصة أصحاب الكهف وعجيب النوم والولاية الإلهية",
    titleEn: "The Companions of the Cave",
    surahNumber: 18,
    surahNameAr: "الكهف",
    surahNameEn: "Al-Kahf",
    verseRange: "9-22",
    triggerVerse: 9,
    topic: "الفرار بالدين من بطش الطغاة والمعجزة الزمنية للنوم لثلاثمائة سنين وازدادت تسعاً",
    narrativeAr: "هرب فتية مؤمنون من ملك جبار كافر فراراً بدينهم وتوحيدهم، ولجأوا إلى كهف خشن وضيق، فألقى الله عليهم نوماً عميقاً حافلاً بالرعاية الاستثنائية لمدة ٣٠٩ سنوات تقلبهم عين اللطف والمهابة، ليكونوا آية كبرى للأجيال تثبت حتمية البعث والقدرة الإلهية المطلقة على تذليل قوانين الكون لنصرة الحق.",
    narrativeEn: "Believing youths fled an oppressive tyrant king to protect their monotheistic faith. They took refuge in a narrow cave. God cast a deep, protective sleep over them for 309 years, turning them with divine grace, constituting a miraculous sign proving resurrection and sovereignty over natural laws.",
    lessonsAr: [
      "الفرار بالدين والعقيدة نية صالحة يتكفل الخالق برعايتها وتنمية أثرها التاريخي.",
      "التوكل الصادق يفتح أبواب الرحمة ويجعل الكهف الضيق الخشن فضاءً فسيحاً مريحاً.",
      "قدرة الإله على بعث الموتى وإبطال فاعلية الزمن تزيد يقين المؤمن بالآخرة."
    ],
    lessonsEn: [
      "Fleeing to protect one's faith earns miraculous, historic divine preservation.",
      "Sincere reliance on God transforms a harsh cold cave into a spacious sanctuary.",
      "The power of God to stop time and resurrect bodies is absolute comfort."
    ],
    icon: "Moon",
    gradient: "from-blue-600/15 via-stone-900 to-blue-950/20"
  },
  {
    id: "qarun-treasures",
    titleAr: "قصة قارون الباغي فاجعة الغرور بالمال المكدس",
    titleEn: "Qarun and the Devastation of Materialistic Arrogance",
    surahNumber: 28,
    surahNameAr: "القصص",
    surahNameEn: "Al-Qasas",
    verseRange: "76-82",
    triggerVerse: 76,
    topic: "عاقبة الغرور بالمال والمناداة بنسب الأفضال للذات والخسف المدمر بالأرض الشقراء",
    narrativeAr: "آتاه الله من الثروة والكنوز ما يعجز الرجال الأقوياء عن حمل مفاتيحها، فبخل وبغى ونسب هذا النجاح لعلمه الشخصي قائلاً: 'إنما أوتيته على علم عندي'، رافضاً نصح المصلحين بعدم الفرح الباطل. فخسف الله به وبداره الأرض الشقراء في لحظة مباغتة، زجراً واقتلاعاً لأسس الكبر المالي الوهمي الفاني.",
    narrativeEn: "Inordinately wealthy Qarun possessed treasures whose keys was a heavy burden for strong men. He became arrogant, claiming that his wealth was solely due to his personal cleverness. Allah caused the earth to swallow him and his grand palace, sending a stark warning that material vanity is quick to perish.",
    lessonsAr: [
      "المال وديعة وابتلاء من الخالق للمشاركة والنفع ولا يصح لغرور النفس والاستعلاء.",
      "إرجاع النعم والفتح لعلم المرء وثقافته الفردية جلب لسخط الحق وبوار الثروة الجائلة.",
      "الخاتمة الأليمة للظالم تبرهن تفاهة الزينة الدنيوية عند انسحاب الرحمة والتوحيد."
    ],
    lessonsEn: [
      "Wealth is a divine trust meant for charity and building, not for showing off.",
      "Attributing success to self-talent rather than divine grace invites fast decline.",
      "Worldly allure has zero value when the wrath of divine loss hits."
    ],
    icon: "Coins",
    gradient: "from-amber-500/15 via-stone-900 to-amber-955/20"
  },
  {
    id: "moses-khidr",
    titleAr: "قصة موسى عليه السلام والخضر وأسرار القدر الغيبي",
    titleEn: "Prophet Moses and the Righteous Scholar Al-Khidr",
    surahNumber: 18,
    surahNameAr: "الكهف",
    surahNameEn: "Al-Kahf",
    verseRange: "60-82",
    triggerVerse: 60,
    topic: "الصبر على طلب العلم وحكمة الرحمة الإلهية الكامنة في البلايا والمحن الظاهرة",
    narrativeAr: "رحلة تعليمية فريدة خاضها موسى كليم الله مع العبد الصالح الخضر ليتعلم أن وراء أحداث الكون المؤلمة ظاهرياً (كخرق السفينة، وقتل الغلام، وبناء الجدار بلا أجر) طيات حافلة من الرحمة والتدبير الإلهي الخفي الذي يحرس الأيتام والمساكين ويصون بقاء المستقبل، تعليماً للتواضع والصبر.",
    narrativeEn: "An extraordinary educational journey taken by Prophet Moses with the wise scholar Al-Khidr to learn that behind seemingly painful actions (scuttling a ship, slaying a boy, repairing a wall) lie sheets of infinite mercy and divine wisdom safeguarding the vulnerable.",
    lessonsAr: [
      "طلب العلم يتطلب الصبر الجميل، والتواضع التام أمام الشيوخ المتمكنين الصالحين.",
      "علم البشر قاصر محجوب، والقدر الإلهي يستبطن اللطف والسلامة في باطن السوء والشر الظاهر.",
      "رعاية الله تمتد لذريات الصالحين حتى بعد مماتهم صيانة للأمانات وكرامة للأبوين."
    ],
    lessonsEn: [
      "Acquiring knowledge demands loyalty, silence, and patience under mentor decisions.",
      "Human intellect is limited; divine decree works deep subtle mercy beneath hardship.",
      "Honoring pious parents extends divine protection to their orphan children."
    ],
    icon: "ShieldAlert",
    gradient: "from-indigo-600/15 via-stone-900 to-indigo-950/20"
  },
  {
    id: "paradise-owners",
    titleAr: "قصة صاحب الجنتين وعقوبة جحود النعمة بالقلب",
    titleEn: "The Owner of the Two Lush Gardens",
    surahNumber: 18,
    surahNameAr: "الكهف",
    surahNameEn: "Al-Kahf",
    verseRange: "32-44",
    triggerVerse: 32,
    topic: "حيازة العقار وجحود المنشئ والخلود الموهوم وسرعة الهلاك والرياح الرميم",
    narrativeAr: "رجل رزقه الله بجنتين عظيمتين من الأعناب محفوفتين بالنخل والزرع الخصيب وتدفق النهر العذب. فاستعلى بهما على صاحبه الفقير ونفى فناءهما بل وبكفر صريح بالساعة والميعاد. فوعظه الصاحب المؤمن بالتوحيد. فأحاط الهلاك بثمار الجنتين صاعقة أكلتها كلها فأصبح يقلب كفيه حسرة وألماً تراجعاً وندماً.",
    narrativeEn: "A man blessed with two glorious vineyards surrounded by palm trees and a free-flowing canal grew arrogant over his poorer friend, claiming his property would never perish and doubting the Day of Judgment. Sudden calamity ruined his domain, leaving him clasping his hands in utter agony.",
    lessonsAr: [
      "قيمة الثمار والوفرة زائلة إذا اقترنت بالتكبر وجحود فضل المالك والمنعم جل وعلا.",
      "الاعتراف بالضعف البشري في كل حين وسياق: 'ما شاء الله لا قوة إلا بالله' يحفظ الديار.",
      "الندم المتأخر بعد فوات الفتح إشارة تنبيه صاعقة للرجوع لأركان البساطة والتوحيد."
    ],
    lessonsEn: [
      "The value of any crop dries up when linked to vanity and denying the Creator.",
      "Uttering 'As Allah willed, there is no power but in Him' shields your blessings.",
      "Belated regret after the destruction hits stands as a harsh awakening to humility."
    ],
    icon: "Trees",
    gradient: "from-cyan-600/15 via-stone-900 to-cyan-950/20"
  },
  {
    id: "elephant-owners",
    titleAr: "قصة أصحاب الفيل وجبروت أبرهة وعصف مأكول",
    titleEn: "The Companions of the Elephant",
    surahNumber: 105,
    surahNameAr: "الفيل",
    surahNameEn: "Al-Fil",
    verseRange: "1-5",
    triggerVerse: 1,
    topic: "حماية الكعبة المشرفة وبوار مكر الجبارين بسرب الطير الأبابيل وحجارة السجيل",
    narrativeAr: "انطلق أبرهة الأشرم بجيش عرمرم تتقدمه الفيلة العاتية لهدم الكعبة المشرفة وتحويل قبلة الحجيج لصنعاء، لعجزه وخيبته. فلما عجز أهل مكة عن المواجهة وفروا، دافع الله عن بيته المعظم فأرسل على الغزاة الماكرين طيراً أبابيل تقذفهم بحجارة من سجيل حارق جعلتهم كورق شجر ممضوغ بالٍ.",
    narrativeEn: "The tyrant Abrahah set out with a massive army led by strong elephants to demolish the Holy Ka'bah. When the people of Mecca fled to the hills, Allah miraculously defended His sacred house, sending flocks of birds that pelted the attackers with stones of baked clay, leaving them like dead straw.",
    lessonsAr: [
      "لبيت الله الكعبة المشرفة معاقل قدسية حامية يدافع عنها الإله حتماً لوقف طيش البشر.",
      "مصير الطغيان والجبروت العسكري السقوط السريع بأضعف جنود الكون (سرب من الطيور).",
      "وجوب حماية المقدسات ودوام تعظيم شعائر الله وحرص الكرام على تطهير القبلة."
    ],
    lessonsEn: [
      "The Holy Ka'bah enjoys a sacred status, defended by the Lord of the worlds.",
      "The mightiest military structures can be instantly crushed by the humblest creatures.",
      "Great ruins of history stand as reminders to steer clear of abusing sacred limits."
    ],
    icon: "Activity",
    gradient: "from-orange-600/15 via-stone-900 to-orange-950/20"
  },
  {
    id: "solomon-hoopoe",
    titleAr: "قصة سليمان عليه السلام والهدهد ونور الهداية لسبأ",
    titleEn: "Prophet Solomon and the Intelligent Hoopoe",
    surahNumber: 27,
    surahNameAr: "النمل",
    surahNameEn: "An-Naml",
    verseRange: "20-28",
    triggerVerse: 20,
    topic: "الدقة الإدارية وحرص جندي صغير على نشر التوحيد وإقراء رسالة الإسلام لسبأ",
    narrativeAr: "تفقد سليمان عليه السلام الطير فلم يجد الهدهد، وتوعده لغيابه بلا عذر. فعاد الهدهد بنبأ يقين عظيم من أرض سبأ: قوم يعبدون الشمس، تحكمهم امرأة أوتيت من كل شيء ولها عرش عظيم. فسخّر سليمان ذكاء الملك وقدرة الجن لهدايتهم، فأسلمت ملكتهم بلقيس لله رب العالمين بنهاية سلمية مهيبة.",
    narrativeEn: "Prophet Solomon inspected the birds and noticed the hoopoe was missing. Soon, the hoopoe returned with certain news from Sheba: a nation worshipping the sun ruled by a queen with a magnificent throne. Solomon utilized his miraculous powers to guide them, leading Queen Bilqis to submit to God.",
    lessonsAr: [
      "حتى المخلوقات والحيوانات والرموز الصغيرة تنعم بالوعي والغيرة المحمودة لخدمة التوحيد.",
      "دقة الرصد والإدارة والعدل والاستماع لأعذار الجنود والخدم قبل إيقاع العقاب.",
      "الحكمة والدبلوماسية الإيمانية تدرأ الحروب الدامية وتقود القادة والشعوب للسلام."
    ],
    lessonsEn: [
      "Even the humblest of creatures can carry a high sense of purpose and faith.",
      "Just governance demands investigating and checking verified facts before blaming.",
      "Intelligent, peaceful diplomacy secures immense conversions over military force."
    ],
    icon: "Send",
    gradient: "from-purple-600/15 via-stone-900 to-purple-950/20"
  },
  {
    id: "dhul-qarnayn",
    titleAr: "قصة ذو القرنين وبناء السد المنيع ضد الفساد",
    titleEn: "The Just Leader Dhul-Qarnayn and the Great Barrier",
    surahNumber: 18,
    surahNameAr: "الكهف",
    surahNameEn: "Al-Kahf",
    verseRange: "83-98",
    triggerVerse: 83,
    topic: "الحكم الرشيد ونصرة المظلومين وبناء السدود الهندسية الواقية من يأجوج ومأجوج",
    narrativeAr: "ملك صالح مكن الله له في الأرض وآتاه من كل شيء سبباً، فطاف المشرق والمغرب يثبت العدل وينصر المظلومين. مر بقوم لا يكادون يفقهون قولاً يشتكون من أذى يأجوج ومأجوج. فبنى لهم بمهارة هندسية فذة سداً عظيماً من زبر الحديد المذاب والنحاس القطر، صيانة وحجراً للفساد والشرور.",
    narrativeEn: "A righteous ruler, given power and resources by Allah, traveled across the East and West. He defended the oppressed and, in a valley of helpless people, constructed a masterful barrier of iron blocks and molten copper to wall in the destructive tribes of Gog and Magog.",
    lessonsAr: [
      "تمكين القائد الصالح المخلص يثمر عمارة وسلاماً وأمناً مستداماً للمجتمعات الضعيفة.",
      "الاستعانة بالقوة العضلية والبشرية للمجتمعات وتوظيف قدراتها: 'فأعينوني بقوة' للبناء.",
      "الحضارة والهندسة الوقائية وسيلة شرعية عظيمة لوقف الإجرام وصيانة الأرواح الموحدة."
    ],
    lessonsEn: [
      "Directing power to elevate weak nations and build protective defenses is true success.",
      "Encouraging local, community-driven action ('Assist me with strength') yields wonders.",
      "Scientific engineering and security barriers are praise-worthy tools of preservation."
    ],
    icon: "Shield",
    gradient: "from-amber-700/15 via-stone-900 to-amber-955/20"
  },
  {
    id: "prophet-yunus",
    titleAr: "قصة يونس عليه السلام والنداء في ظلمات بطن الحوت",
    titleEn: "Prophet Yunus and the Supplication in the Whale",
    surahNumber: 21,
    surahNameAr: "الأنبياء",
    surahNameEn: "Al-Anbiya",
    verseRange: "87-88",
    triggerVerse: 87,
    topic: "أثر الاستغفار والتسبيح والاعتراف بالتقصير في كشف أعتى كربات ومضايق الحياة",
    narrativeAr: "خرج يونس عليه السلام مغاضباً قومه لعدم استجابتهم الفورية، فقرر ركوب السفينة حيث أصابهم الموج العاتي فاقترعوا لإلقاء أحدهم لتخفيف الحمولة، فكان يونس عليه السلام من المدحضين وأُلقي في البحر والتقمه حوت عظيم بأمر الله. وفي غيابات تلك الظلمات الثلاث نادى بتوحيد الله والاعتراف بحدود التقصير: « لا إله إلا أنت سبحانك إني كنت من الظالمين » فاستجاب الله له ونجاه من الغم.",
    narrativeEn: "Prophet Jonah left his rebellious community in anger. When he boarded a crowded ship, she was buffeted by massive waves. They drew lots to lighten the load, and Jonah was cast into the sea where a gigantic whale swallowed him. Inside that multi-layered darkness, he cried out with absolute monotheism and repentance: 'None has the right to be worshipped but You, Glorified are You! Indeed, I have been of the wrongdoers.' God rescued him immediately.",
    lessonsAr: [
      "ملازمة التسبيح والاعتراف بالتقصير تنجي العبد من مضايق ومآزق الدنيا العسرة.",
      "عدم استعجال النتائج والتحلي بالصبر المديد في الدعوة وهداية النفس والغير.",
      "الاستجابة الإلهية والنجاة من الهم هي سنة جارية لكل مصدق مستغفر موحد في كل زمان ومكان."
    ],
    lessonsEn: [
      "Constant glorification and admitting flaws save the servant from the tightest of crises.",
      "Exercising absolute patience rather than rushing outcomes in social guidance.",
      "The swift divine response to sorrow is a perpetual rule for seekers of truth in every age."
    ],
    icon: "Moon",
    gradient: "from-blue-700/15 via-stone-900 to-blue-950/20"
  },
  {
    id: "luqman-advice",
    titleAr: "وصايا لقمان الحكيم لابنه ومقومات الشخصية المتزنة",
    titleEn: "Luqman the Wise's Advice on Balanced Character",
    surahNumber: 31,
    surahNameAr: "لقمان",
    surahNameEn: "Luqman",
    verseRange: "13-19",
    triggerVerse: 13,
    topic: "التربية الإسلامية وبناء مقومات الشخصية المتزنة عقيدياً واجتماعياً وسلوكياً بالحب والرفق",
    narrativeAr: "يرسم القرآن الكريم منهجاً تربوياً متكاملاً وبليغاً يتجلى في حوار ممتلئ عطفاً ومحبة بين الأب لقمان الحكيم وولده وهو يعظه برفقه. يبدأ المنهج من تأصيل العقيدة بالتحذير من الشرك بالله باعتباره ظلماً عظيماً، ثم الحث على شكر الوالدين وبرهما، ثم استشعار رقابة الله الخالصة في أدق تفاصيل الحياة (حبة الخردل)، وإقامة الصلاة والأمر بالمعروف والصبر، وأدب المشي والتواضع وخفض الصوت.",
    narrativeEn: "An exquisite, comprehensive educational methodology preserved by the Quran showing a warm dialogue built on love and wisdom between Luqman the Wise and his son. The advice shapes a complete roadmap starting with monotheism, honoring parents with extreme benevolence, developing absolute mindfulness of God's presence, establishing prayer, advocating good, showing patience, and practicing quiet modesty in posture and speech.",
    lessonsAr: [
      "بناء العلاقات التربوية مع الأبناء على الرفق والنصح اللين والقول الحاني اللطيف.",
      "مراقبة الله عز وجل في أصغر جزئيات الكون تولد وازعاً رقابياً ذاتياً حياً للضمير.",
      "الآداب الاجتماعية والتواضع في المشي والتحدث من ركائز القبول والنجاح الحضاري والاجتماعي اليوم."
    ],
    lessonsEn: [
      "Structuring parental guidance around absolute gentleness, warmth, and supportive talk.",
      "Sensing God's vigilance even in small matters cultivates an active moral guide within.",
      "Social moderation, humble walks, and soft vocals are absolute foundations of interpersonal success."
    ],
    icon: "Send",
    gradient: "from-emerald-700/15 via-stone-900 to-emerald-950/20"
  },
  {
    id: "talut-jalut",
    titleAr: "قصة طالوت وجالوت وفتنة النهر وصبر القلة الفعالة",
    titleEn: "Talut, Goliath, and the River Test of Discipline",
    surahNumber: 2,
    surahNameAr: "البقرة",
    surahNameEn: "Al-Baqarah",
    verseRange: "246-251",
    triggerVerse: 249,
    topic: "أهمية الانضباط والصبر وصدق التوكل، وكيف تقهر القلة المؤمنة الكثرة المترهلة بوعيها",
    narrativeAr: "انطلق الملك طالوت بجيشه لمواجهة جالوت وقواته العاتية، فابتلاهم الله بنهر يحظر الشرب منه إلا غرفة يسيرة باليد لترطيب الشفاه، وذلك اختباراً لمدى انضباط الجنود والسيطرة على شهوات النفس وعطش الديار. فعصى جلهم وشربوا بشراهة وخور، فتم فرزهم لتبقى فئة قليلة مؤمنة وصابرة، فاستعانت بربها وقاتلت بثبات، ليبرز داود عليه السلام ويقتل جالوت بكل شجاعة.",
    narrativeEn: "King Saul (Talut) led his army to face the tyrant Goliath (Jalut). Allah tested them with a river and forbade them to drink more than a handful to measure their willpower and discipline. Most of them failed due to greed and impatience. Only a disciplined, small, but resilient troop crossed. Through their absolute reliance on God, young David stepped forward and slew Goliath.",
    lessonsAr: [
      "الانضباط والصبر وتجاوز المغريات اللحظية المتاحة هما المعك لتميز القادة وبناء المؤسسات.",
      "المقاييس المادية تكذب دوماً أمام عظمة الإيمان: « كم من فئة قليلة غلبت فئة كثيرة بإذن الله ».",
      "تمكين وتقديم الكفاءات لا يرجع للقرابة الطينية، بل لسلامة الأوعية والتمسك بالحق والتوكل."
    ],
    lessonsEn: [
      "Self-restraint, active discipline, and overcoming quick temptations are crucial for grand achievements.",
      "Physical standards fail in front of divine logic: 'How many a small company defeated a gigantic one'.",
      "True leadership is earned through persistent patience, unwavering faith, and strict obedience to the truth."
    ],
    icon: "Activity",
    gradient: "from-rose-700/15 via-stone-900 to-rose-950/20"
  },
  {
    id: "she-camel",
    titleAr: "قصة ناقة صالح عليه السلام وعواقب الاعتداء والتمرد",
    titleEn: "Prophet Salih and the Miraculous She-Camel",
    surahNumber: 26,
    surahNameAr: "الشعراء",
    surahNameEn: "Ash-Shu'ara",
    verseRange: "141-159",
    triggerVerse: 155,
    topic: "الآيات الإعجازية وعقوبة الاعتداء على مقدسات الخير وخرق سبل التنمية العادلة",
    narrativeAr: "طلب قوم ثمود من نبيهم صالح عليه السلام دليلاً حسياً يثبت صدق رسالته، فأخرج الله لهم ناقة عظيمة مباركة من صخرة صماء صلبة، وجعل لهم شرب مياه وللناقة شرب يوم معلوم بالإنصاف. فاستمروا في طغيانهم الطائش ورفضوا الاستجابة، وعقروها طعناً في كبر مقصود، فأنزل الخالق عليهم عذاباً مدمراً وصيحة اقتلعت بيوتهم من القواعد.",
    narrativeEn: "The tribe of Thamud demanded a physical miracle from Prophet Salih to prove his prophethood. Allah brought forth a magnificent, blessed she-camel from solid rock, setting a fair, balanced water-sharing agreement with them. Arrogant and rebellious, they refused to share and hamstrung the camel. Consequently, a devastating blast and earthquake flattened their homes.",
    lessonsAr: [
      "التمرد على شروط التعايش العادل والاعتداء على مقدسات وسبل الخير يقطع حبال السلامة والبركة.",
      "تحدي سنن الله والفساد المستمر مع وضوح البراهين يقود حتماً لتبديد الكيانات الهشة وسقوطها.",
      "التواطؤ بالسكوت والتشجيع على المنكر يجعل المجتمعات شريكة في العاقبة الهدامة العامة."
    ],
    lessonsEn: [
      "Failing to respect fair living conditions and attacking noble assets disrupt social stability.",
      "Hostile rebellion in the face of blinding truth invites systematic breakdown and ruin.",
      "Passive support of corruption makes the broader community equally liable in divine correction."
    ],
    icon: "Activity",
    gradient: "from-amber-600/15 via-stone-900 to-amber-900/20"
  },
  {
    id: "two-sons-adam",
    titleAr: "قصة ابني آدم هابيل وقابيل ومأساة الغيرة الأولى",
    titleEn: "The Two Sons of Adam (The First Tragedy)",
    surahNumber: 5,
    surahNameAr: "المائدة",
    surahNameEn: "Al-Ma'idah",
    verseRange: "27-31",
    triggerVerse: 27,
    topic: "فتنة الغيرة والحسد وحرمة الدماء وزجر النفس المتمردة قبل غوصها في الندم الأليم",
    narrativeAr: "قدّم ابنا آدم قرباناً خالصاً للفصل في خلاف، فتقبل الله من هابيل لتقواه وصدق طهارة قلبه، ورفض قربان قابيل لسوء نيته وباطنه. فثار الغيظ والغيرة الشرسة في قلب قابيل وتوعد أخاه بالقتل. فما كان من هابيل إلا أن نصحه بلسان العاطفة والتسامح والتقوى رافضاً الاعتداء، فانساق قابيل لشهوة الانتقام وقتل أخاه، ثم تملكه الندم الفادح بعدما علمه الغراب كيف يوارى السوءة.",
    narrativeEn: "The two sons of Adam offered sacrifices to resolve a dispute. Allah accepted Abel's offering due to his inner piety and rejected Cain's due to his malicious, insincere heart. Driven by intense envy and jealousy, Cain threatened to kill Abel, who responded with words of peace, caution, and fraternity. Regrettably, Cain murdered Abel and was later left in deep grief and shame, learning how to bury his brother from a crow.",
    lessonsAr: [
      "الحسد والغيرة غير المنضبطة مرض قاتل يعمي العقول ويدفع الجناة لتدمير أواصر القرابة والأخوة.",
      "تقبل العبادات والأعمال والصدقات مشروط دوماً بنقاء الصدر وإخلاص النية وتقوى القلوب.",
      "حرمة النفس الإنسانية عظيمة؛ فمن أقدم على قتل أو إحياء نفس فكأنما فعل ذلك للبشرية جمعاء."
    ],
    lessonsEn: [
      "Uncontrolled jealousy is a terminal spiritual disease that blinds intellect and destroys kinship.",
      "Divine acceptance of charity and action is strictly dependent on inner integrity and sincerity.",
      "The sanctity of life is universal; taking one innocent soul is as though one has killed all of humanity."
    ],
    icon: "EyeOff",
    gradient: "from-rose-900/20 via-stone-900 to-rose-955/20"
  },
  {
    id: "pharaoh-wizard",
    titleAr: "قصة سحرة فرعون والتحول الباهر للتوحيد واليقين",
    titleEn: "The Magicians of Pharaoh and the Victory of Truth",
    surahNumber: 20,
    surahNameAr: "طه",
    surahNameEn: "Taha",
    verseRange: "57-73",
    triggerVerse: 70,
    topic: "قوة الحق وثبات العقيدة والتحول السريع للقلوب من طلب جاه الدنيا الزائل إلى نبل الآخرة",
    narrativeAr: "انتدب فرعون كبار سحرة مملكته ليهزموا معجزة موسى عليه السلام ويفاككوا برهانه في يوم العيد والزينة الحاشد. فلما ألقوا حبالهم وعصيهم وأبهروا العيون بمهارة، ألقى موسى عصاه فإذا هي تلقف وتلتهم ألاعيبهم وبهرجهم في معجزة حية قاطعة. فخر السحرة سجداً لله العظيم في ثبات أسطوري، متحدين تهديد فرعون بالتقطيع والصلب بيقين لا يتزعزع.",
    narrativeEn: "Pharaoh marshaled the top sorcerers of Egypt to defeat the divine miracles of Prophet Moses on a festive, crowded day. As they threw their ropes and cast illusions, Moses threw his staff, and it instantly devoured their deceptions. Seeing objective truth, the sorcerers converted instantly, prostrating to Allah and defying Pharaoh's threats of execution and torture.",
    lessonsAr: [
      "الحق أبلج والباطل لجلج؛ وجولة الوهم تنهار سريعاً متى ما تجلت براهين الحقيقة الخالصة.",
      "التحول الشامل والمفاجئ للسحرة يبرهن كيف يتغلغل نور الإيمان في القلوب بلمح البصر فيقهر الخوف.",
      "اليقين الكامل يصنع المعجزات ويجعل عذابات ومضايق الطغيان الدنيوية فانية وسهلة العبور."
    ],
    lessonsEn: [
      "Truth is solid and deception is volatile; illusions crumble instantly once absolute clarity is deployed.",
      "The swift transformation of the magicians proves that divine light can touch the heart in a brief second.",
      "Unyielding certainty makes temporary worldly hardships and threats easy to face with absolute serenity."
    ],
    icon: "Sparkles",
    gradient: "from-violet-700/15 via-stone-900 to-violet-950/20"
  },
  {
    id: "queen-sheba-throne",
    titleAr: "قصة بلقيس ملكة سبأ ورجاحة العقل ونبل الشورى",
    titleEn: "Queen Bilqis of Sheba and the Power of Reason",
    surahNumber: 27,
    surahNameAr: "النمل",
    surahNameEn: "An-Naml",
    verseRange: "29-44",
    triggerVerse: 44,
    topic: "الحكمة والاتزان السياسي، ورجاحة عقل المرأة في الحفاظ على الأوطان وبناء السلام",
    narrativeAr: "تلقّت ملكة سبأ بلقيس رسالة تهيب بالقوة والتوحيد من نبي الله سليمان، فرفضت قرارات الطيش وبدأت بالشورى واستشارة كبار قادتها، مفضلة بناء جسور التواصل الاقتصادي والدبلوماسي لحماية شعبها من تدمير طاحن. وعندما وفدت على سليمان في صرحه المنسق من قوارير شفافة كشف زيف مظهرها، استسلمت ورجعت بعقل مخلص قائلة: « رب إني ظلمت نفسي وأسلمت مع سليمان لله رب العالمين ».",
    narrativeEn: "Queen Bilqis of Sheba received a sovereign letter from Prophet Solomon calling her to monotheism and submission. Rather than rushing into war, she consulted her chiefs, choosing diplomatic wisdom to shield her kingdom from military destruction. Visiting Solomon and witnessing his architectural, water-flowing marvels, she recognized the ultimate truth, stating: 'My Lord! I have indeed wronged my soul, and I submit with Solomon to the Lord of the worlds.'",
    lessonsAr: [
      "نبل الشورى وتجنب الاستقراء الفردي الحاد يحزمان شؤون الأوطان ويحفظان الديار.",
      "رجاحة عقل المرأة وتفوقها القيادي والسياسي ركن يحتفى به القرآن الكريم بإنصاف وجمال.",
      "الاعتراف بالخطأ والرجوع للحق شجاعة نادرة تعود بالمصلحة والرفعة الشاملة على الأفراد والقادة."
    ],
    lessonsEn: [
      "Active consultation and avoiding arrogant state decisions protect communities from structural failure.",
      "The exemplary leadership, wisdom, and intelligence of women are grandly celebrated in Quranic texts.",
      "Admitting self-error and submitting to the truth is rare courage that elevates leaders above their egos."
    ],
    icon: "Compass",
    gradient: "from-emerald-700/15 via-stone-900 to-emerald-950/20"
  },
  {
    id: "prophet-noah-ship",
    titleAr: "قصة نبي الله نوح عليه السلام وبناء سفينة النجاة بأمر الله",
    titleEn: "Prophet Noah and the Miraculous Ark",
    surahNumber: 11,
    surahNameAr: "هود",
    surahNameEn: "Hud",
    verseRange: "36-48",
    triggerVerse: 37,
    topic: "الصبر التاريخي المديد والعمل بالأسباب المتاحة والالتزام المتقن ببناء صروح الأمان",
    narrativeAr: "مكث نوح عليه السلام يدعو قومه مئات السنين بصبر وقوة يقهران اليأس والملل، ولكنهم واجهوه بالسخرية والإعراض التام. فأوحى الله إليه بصناعة سفينة ضخمة متعددة الطوابق في هجير الصحراء القاحلة البعيدة عن المياه. واستهزأ السفهاء من جهود البناء الجافة، فلما فار التنور وتفجرت الأرض عيوناً وهطل سيل السماء، رست فئة المؤمنين بسلام مبارك على جبل الجودي وظل الغارقون بتبكيت الخسران.",
    narrativeEn: "Prophet Noah called his community to the truth for generations with unmatched patience, yet they responded with mockery. Allah commanded him to construct a multi-decked, colossal Ark in the middle of dry land. People ridiculed this seemingly absurd mountain maritime engineering. However, when the earth erupted with water and rain poured, the Ark floated safely to Mount Judi, rescuing the believers.",
    lessonsAr: [
      "بناء سفن وطواقم النجاة والسعي بالأسباب واجب شرعي وعقلي مطلوب لسلامة الأوعية والبلاد.",
      "سخرية الغافلين وهزء المرجفين يجب ألا تشغل المصلحين عن إتمام صروح الإعمار المتينة.",
      "الروابط والقرابة الاجتماعية والطينية لا تنوب عن غياب الإيمان والعمل الصالح والتوحيد."
    ],
    lessonsEn: [
      "Building structures and platforms of safety (pious effort) is a practical and religious mandate.",
      "The mockery of spectators must never distract dedicated builders from completing their robust designs.",
      "Lineage and social family standing cannot save or substitute for individual integrity and beliefs."
    ],
    icon: "Fish",
    gradient: "from-teal-700/15 via-stone-900 to-teal-950/20"
  },
  {
    id: "hebron-prophet-fire",
    titleAr: "قصة خليل الرحمن إبراهيم وتجربة البرد والسلام في النار",
    titleEn: "Prophet Abraham and the Cool Miracle of Fire",
    surahNumber: 21,
    surahNameAr: "الأنبياء",
    surahNameEn: "Al-Anbiya",
    verseRange: "51-70",
    triggerVerse: 69,
    topic: "قوة الحجة والمنطق، وعطل قوانين الطبيعة المادية والفيزياء أمام اللطف والرحمة الربانية",
    narrativeAr: "دعا إبراهيم عليه السلام قومه لإعمال العقل والتفكر السليم وحطم أصنامهم المتصلبة لبيان ضعفها وعجزها الصارخ. فما كان منهم إلا أن ثاروا عناداً وقرروا حرقه حياً بنار مهولة هائلة متأججة. فلما ألقوه في لهيبها الحارق، ألغى خالق الكون القوانين المادية الفيزيائية وأصدر أمراً مباشراً ومباغتاً للرماد والجمر: « يا نار كوني برداً وسلاماً على إبراهيم »، ليخرج للناس معافىً.",
    narrativeEn: "Prophet Abraham engaged his people with solid logic, pleading with them to think, and broke their silent stone idols to demonstrate their helplessness. Blinded by pride, they retaliated by throwing him into a massive, roaring bonfire. At that instant, the Creator suspended the physical laws of nature, commanding the raw heat: 'O fire! Be coolness and safety upon Abraham.'",
    lessonsAr: [
      "الأسباب المادية الفيزيائية ليست آلهة صلبة، بل هي خاضعة بشكل كامل وذاتي للموجد المسبب سبحانه.",
      "من ضحى بكل ما يملك ونذر نفسه لإعلاء كلمة الحق والعدل، أحاطه الله ببدائع اللطف والتيسير.",
      "كسر خرافات التبعية العمياء والجهل المتوارث يستوجب طرح الحوار الفلسفي العقلي الهادئ المتين."
    ],
    lessonsEn: [
      "Physical and material laws are not supreme; they are subservient to the Creator who can alter them.",
      "Defending the truth and making absolute sacrifices invite divine warmth and subtle assistance.",
      "Dismantling toxic superstitions and stagnant habits demands calm, logical, and robust reasoning."
    ],
    icon: "Sparkles",
    gradient: "from-orange-700/15 via-stone-900 to-orange-950/20"
  },
  {
    id: "prophet-moses-birth",
    titleAr: "قصة ولادة موسى عليه السلام وربط الله لقلب أمه المفجوع",
    titleEn: "The Birth of Moses and his Mother's Resilient Heart",
    surahNumber: 28,
    surahNameAr: "القصص",
    surahNameEn: "Al-Qasas",
    verseRange: "7-13",
    triggerVerse: 7,
    topic: "أسرار اللطف والرحمة الإلهية الكامنة في أشد مخاوف الحياة، وكيف يصنع الخالق قادته",
    narrativeAr: "في عهد طغيان فرعون وقتله لمواليد بني إسرائيل بحقد، أنجبت أم موسى وليدها معبأة بمخاوف هائلة وقلق مريع. فأوحى الله لها بوحي غريب ومدهش: أن تضع ثقتها وتلقي طفلها في صندوق صغير ثم تقذفه في اليم العاتي بلا يد، واعداً إياها بحمايته ورده بل وجعله من المرسلين. فساق النهر الرضيع لقصر فرعون نفسه، ليربط الله عرى قلبها الملهوف بصبر حتى عاد لحضنها آمناً يرضع.",
    narrativeEn: "Under Pharaoh's tyrannical system of slaughtering newborn boys, the mother of Moses gave birth to her child in extreme terror. Allah inspired her with an extraordinary plan: place the infant into a chest and cast him into the strong currents of the Nile, promising to return him as a prophet. The river carried him into the fortress of his enemy, where God anchored her heart until Moses returned safely to her arms.",
    lessonsAr: [
      "أقدار الله تتبدى بعجائب من اللطف؛ فالبلاء المرعب (التابوت في النيل) كان هو الطريق الوحيد الممهد للنجاة.",
      "الربط الإلهي للقلوب والصبر والتوكل التام يعصم الإنسان من الانهيار النفسي حيال الأزمات الكبرى المزعجة.",
      "من استودع قضاياه وأماناته وعائلته للخالق سبحانه حصد الطمأنينة الكاملة والكرامة والفتح."
    ],
    lessonsEn: [
      "Divine plans deploy beautiful anomalies; a terrifying ordeal (casting child into the river) was the only path to safety.",
      "Divine comforting of the heart and resolute patience protect individuals from emotional collapse during crises.",
      "Trusting your beloved ones and struggles to the Lord of the worlds yields deep security and joyful returns."
    ],
    icon: "Apple",
    gradient: "from-teal-700/15 via-stone-900 to-teal-950/20"
  },
  {
    id: "prophet-jonah",
    titleAr: "قصة ذي النون يونس عليه السلام في بطن الحوت والظلمات الثلاث",
    titleEn: "Prophet Jonah (Yunus) and the Whale",
    surahNumber: 21,
    surahNameAr: "الأنبياء",
    surahNameEn: "Al-Anbiya",
    verseRange: "87-88",
    triggerVerse: 87,
    topic: "التضرع في ظلمات بطن الحوت والبحر والليل وقوة الاستغفار كمنقذ كوني من الكرب والغم",
    narrativeAr: "امتنع يونس عليه السلام من قومه لمثابرتهم على الكفر فتركهم من دون إذن مباشر، وركب السفينة فساهم فكان من المدحضين وألقي في اليم. فالتقمه حوت عظيم بأمر ربه ليعي العبرة. فنادى في الظلمات الثلاث (ظلمة الليل، وظلمة البحر، وظلمة بطن الحوت): 'لا إله إلا أنت سبحانك إني كنت من الظالمين'، فاستجاب الله له ونجّاه من الغم الكرب وبسط له اليقطين ليشفى.",
    narrativeEn: "Prophet Jonah left his rebellious people in anger without a direct divine command. Boarding a laden ship, lots were cast, and he was thrown into the tempestuous sea. A giant whale swallowed him with divine care. Inside the triple darkness (of night, sea, and the whale's belly), he cried out: 'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.' Allah answered his prayer and rescued him.",
    lessonsAr: [
      "قيمة لا إله إلا أنت سبحانك إني كنت من الظالمين كصيغة استغاثة كونية لرفع الهم والغم والمصائب.",
      "عدم استعجال النتائج والتحلي بالصبر حتى في أشد المواقف تعقيداً وضيقاً.",
      "المسؤولية الإيمانية والاضطلاع بالتبليغ والرجوع السريع للخالق عز وجل وتطهير النفس بالاستغفار."
    ],
    lessonsEn: [
      "The ultimate power of Jonah's prayer of repentance for lifting gloom, anxiety, and seemingly impossible hardships.",
      "The importance of endless patience and never abandoning one's core calling or duty in frustration.",
      "Returning immediately to divine sanctuary through accountability and clearing the heart from negative thoughts."
    ],
    icon: "Compass",
    gradient: "from-blue-700/15 via-stone-900 to-blue-950/20"
  },
  {
    id: "prophet-job",
    titleAr: "قصة الصبر العظيم لنبي الله أيوب والشفاء المبارك",
    titleEn: "Prophet Job (Ayyub) and the Sovereign Cure",
    surahNumber: 21,
    surahNameAr: "الأنبياء",
    surahNameEn: "Al-Anbiya",
    verseRange: "83-84",
    triggerVerse: 83,
    topic: "أعلى مراتب الأدب في مناجاة المعبود والأمل الراسخ بالرحمة والشفاء المطلق بالأسباب المتاحة",
    narrativeAr: "أصيب أيوب عليه السلام بابتلاء مريض شديد في جسده وماله وولده لسنوات طوال، فصبر واحتسب ولم يشتكِ أو يجزع. بل وناجى ربه بأقصى درجات الأدب والتوقير صائحاً: 'أني مسني الضر وأنت أرحم الراحمين'. فاستجاب الله له فوراً وأمره أن يركض برجليه ليتفجر له نبع ماء بارد يغتسل منه ويشرب؛ ليزول كل الضر ويعود له أهله ومثيله معهم رحمةً وذكرى للعابدين.",
    narrativeEn: "Prophet Job experienced severe physical illness and the loss of his family and property for many years, enduring all of it with tranquil patience and complete reserve. He supplicated with utmost nobility: 'Indeed, adversity has touched me, and You are the most merciful of the merciful.' God commanded him to strike the ground with his foot, springing up a cool, refreshing water fountain for washing and drinking to fully restore his health, assets, and peace.",
    lessonsAr: [
      "أدب الدعاء والاعتراف بالرحمة الإلهية من دون نسبة الشر لساحة الرحمن والتوحيد الخالص.",
      "الصبر الجميل ليس خنوعاً، بل هو ثقة مطلقة بقدرة الله على تفريج الكرب وتبديل العسر باليسر.",
      "الشفاء والرزق قد يتطلب عملاً بسيطاً مباركاً ومحاولةً جادة (اركض برجلك) لإظهار السعي."
    ],
    lessonsEn: [
      "The highest standard of etiquette in supplication: focus on divine mercy rather than complaining.",
      "True patience means active inner tranquility and unshakeable certainty in divine relief rather than despair.",
      "Healing and restorative blessings often require a simple step of personal action ('strike with your foot')."
    ],
    icon: "Activity",
    gradient: "from-emerald-700/15 via-stone-900 to-emerald-950/20"
  },
  {
    id: "queen-of-sheba",
    titleAr: "قصة ملكة سبأ بلقيس والصرح الممرد من قوارير",
    titleEn: "Queen of Sheba and Solomon's Glass Palace",
    surahNumber: 27,
    surahNameAr: "النمل",
    surahNameEn: "An-Naml",
    verseRange: "38-44",
    triggerVerse: 44,
    topic: "العلم والتقنية العميقة في خدمة الدعوة وإقناع القادة بالحجة والبراهين الهندسية الفائقة",
    narrativeAr: "قدمت ملكة سبأ بلقيس إلى القدس لتتفاوض وتتحقق من نبوة سليمان عليه السلام. فحضر عرشها بلمح البصر بفضل علم الكتاب. ثم دخلت الصرح المهيب المصنوع أرضيته من زجاج نقي صافٍ تجري الأنهار من تحته، فظنته ماءاً جارياً مائجاً فكشفت عن ساقيها رعباً وتأهباً، فأوضح لها سليمان دقة الصنعة أنه صرح ممهد ممرد من قوارير مصقولة، فبهرها العلم والإعجاز فقالت مستسلمة: 'رب إني ظلمت نفسي وأسلمت مع سليمان لله رب العالمين'.",
    narrativeEn: "The Queen of Sheba visited Jerusalem to meet Prophet Solomon. After her grand throne was teleported instantly using deep knowledge, she entered a unique palace constructed with a floor of transparent, highly-polished glass over flowing water. Mistaking it for deep water, she lifted her skirt. Solomon explained it was a smooth pathway of crystal glass. Astonished by the miraculous science, she submitted, declaring: 'My Lord, indeed I have wronged myself, and I submit with Solomon to Allah, Lord of the worlds.'",
    lessonsAr: [
      "أهمية تسخير العلوم والصناعات والهندسة والتقنيات العالية لإظهار عظمة الإيمان وسماحة الدولة.",
      "ضرورة الحوار والإقناع العقلي والبرهان التجريبي العلمي لقيادة المجتمعات نحو الفضيلة واليقين.",
      "الرجوع السريع للحق والفضيلة عند وضوح البراهين والاعتراف الفوري بالهداية والتوحيد."
    ],
    lessonsEn: [
      "The crucial role of utilizing science, technology, and engineering to elevate faith and human progress.",
      "Guidance and conversion are nurtured by intellectual dialogue and convincing proofs of wisdom.",
      "The nobility of quickly acknowledging error and surrendering to absolute truth upon enlightenment."
    ],
    icon: "Sparkles",
    gradient: "from-amber-600/15 via-stone-900 to-amber-950/20"
  },
  {
    id: "heavenly-table",
    titleAr: "نزول مائدة السماء الحاشدة بالبركات مع المسيح عيسى وحوارييه",
    titleEn: "Jesus and the Heavenly Table Spread",
    surahNumber: 5,
    surahNameAr: "المائدة",
    surahNameEn: "Al-Ma'idah",
    verseRange: "112-115",
    triggerVerse: 112,
    topic: "تلبية المطالب المادية للقلوب القلقة لترسيخ الاطمئنان وبلوغ قمة الشهود والمسؤولية الكبرى",
    narrativeAr: "طلب الحواريون من عيسى عليه السلام طلباً مدهشاً لمزيد من اليقين القلبي والاستقرار: 'هل يستطيع ربك أن ينزل علينا مائدة من السماء؟'، فنصحهم بتقوى الله أولاً. ولما أكدوا رغبتهم بالأكل والشهادة والاطمئنان، دعا عيسى ربه بأقصى تضرع: 'اللهم ربنا أنزل علينا مائدة من السماء تكون لنا عيداً لأولنا وآخرنا وآية منك وارزقنا وأنت خير الرازقين'. فاستجاب الله بتنزيل مائدة هائلة خضراء محملة ببركات مشهودة لتكون عيداً وميثاقاً غليظاً من أخلّ به فقد استحق العذاب.",
    narrativeEn: "The disciples of Jesus sought a physical miracle for absolute heart assurance, asking: 'Can your Lord send down to us a table spread from heaven?' Urged to fear Allah, they explained they desired to eat, have their hearts assured, and bear witness. Jesus prayed: 'O Allah, our Lord, send down to us a table spread from heaven to be for us a festival for the first of us and the last of us, and a sign from You.' God granted it as a direct covenant of blessings and immense responsibility.",
    lessonsAr: [
      "مشروعية السعي لطلب طمأنينة القلب واليقين المادي المباشر بالرفق والأدب الخالصة.",
      "البركات والنعم العظمى تستوجب دائماً حماية ومسؤولية وإخلاصاً تاماً لئلا ينقلب الجزاء توبيخاً.",
      "أهمية التآزر والاجتماع والبر في تنظيم الأعياد والمناسبات كأيام شكر وذكر دائم لله سبحانه."
    ],
    lessonsEn: [
      "It is natural to seek reassurance and cognitive peace, provided it is done with profound respect and faith.",
      "Great divine breakthroughs and resources demand high standards of moral accountability and integrity.",
      "The importance of forming social bonds, group sharing, and communal celebrations centered on gratitude."
    ],
    icon: "Heart",
    gradient: "from-red-700/15 via-stone-900 to-red-950/20"
  },
  {
    id: "moses-split-sea",
    titleAr: "معجزة انفلاق البحر الأحمر العظيم لإنقاذ موسى وقومه ومصرع الطاغية",
    titleEn: "Moses and the Miraculous Splitting of the Sea",
    surahNumber: 26,
    surahNameAr: "الشعراء",
    surahNameEn: "Ash-Shu'ara",
    verseRange: "60-68",
    triggerVerse: 62,
    topic: "اليقين الهائل في زحام مخاوف الفناء الشديد وانهيار التحليلات الحسابية البشرية",
    narrativeAr: "حاصر فرعون وجيشه الجرار موسى وقومه المذعورين لدرجة اليأس المطلق أمام الأمواج العاتية العميقة للبحر الأحمر، فقال قوم موسى بذعر مستسلم: 'إنا لمدركون'. فرد موسى عليه السلام بيقين يرتجف له ثبات التاريخ: 'كلا إن معي ربي سيهدين'. فأمره الله أن يضرب البحر بعصاه الخشبية البسيطة، فانفلق البحر برعب عظيم إلى اثني عشر طريقاً جافاً كأن كل فرق كالطود العظيم، ليعبر المؤمنون بسلام ويغرق الطاغية فرعون بجنوده.",
    narrativeEn: "Trapped between the roaring waters of the Red Sea and Pharaoh's ruthless pursuing army, the people of Moses cried out in utter despair: 'Indeed, we are overtaken!' Prophet Moses stood with granite fortress-like conviction, proclaiming: 'No! Indeed, with me is my Lord; He will guide me.' Allah commanded him to strike the sea with his staff. The sea instantly split into twelve dry passages, columns of water rising like massive mountains, paving safety for the believers and sealing the tyrant's end.",
    lessonsAr: [
      "اليقين الساحق والقول الجريء المتدبر (كلا إن معي ربي سيهدين) في أكثر الظروف قسوة وإزعاجاً.",
      "المعجزات الكبرى والحلول الربانية تولد من معاقل الاستحالة البشرية وزوال الحلول الطبيعية.",
      "عاقبة الظلم والصلف والتجبر والسعي لسحق المصلحين هي دوماً الغرق والتبدد والدمار التاريخي المذل."
    ],
    lessonsEn: [
      "Proclaiming absolute faith ('No! My Lord is with me') when calculations, logic, and physical resources collapse.",
      "Divine intervention and dramatic breakthroughs blossom from the depths of absolute human helplessness.",
      "Arrogance, tyrant forces, and attempts of crushing vulnerable communities inevitably end in complete downfall."
    ],
    icon: "Activity",
    gradient: "from-cyan-700/15 via-stone-900 to-cyan-950/20"
  },
  {
    id: "people-of-cave",
    titleAr: "قصة أصحاب الكهف والفيئة الإيمانية الهادئة",
    titleEn: "The Companions of the Cave and Divine Sleep",
    surahNumber: 18,
    surahNameAr: "الكهف",
    surahNameEn: "Al-Kahf",
    verseRange: "9-22",
    triggerVerse: 9,
    topic: "حفظ العقيدة والفرار من الفتن واللجوء للكهف طلباً للرحمة واليقظة عقب قرون",
    narrativeAr: "مجموعة من الفتية المؤمنين في زمن غابر لجأوا إلى كهف موحش هرباً من ظلم مَلِك جبار هدد دينهم، فدعوا ربهم لتهيئة الرشد والرحمة. فأنامهم الله في الكهف ٣٠٩ سنوات شمسية ممتدة مع تقليب أجسادهم يمنة ويسرة صوناً لها، وحراسة بمهابة كلبهم الباسط ذراعيه بالوصيد. ولما بعثهم الله، وجدوا بلدهم قد آمن وذهبت عقود الفتن في عبرة أبدية للبعث واليقين وقدرة الخالق العليم.",
    narrativeEn: "A group of young believers fled from a tyrannical king threatening their monotheistic faith, seeking refuge in a desolate cave while praying for divine grace and guidance. Allah cast a miraculous sleep over them for 309 solar years, physically protecting their bodies through continuous rotation while their loyal dog stood guard near the entrance. When awakened, they discovered their nation had turned righteous, presenting an eternal evidence of resurrection.",
    lessonsAr: [
      "الفرار بالدين والأخلاق والاعتزال المؤقت عند انتشار الفتن والفساد لحماية النفس والقلب واليقين.",
      "الرأفة والرحمة تفاض في أضيق وحلك الأماكن (الكهف لفتية) ويضيق القصر الفاره الكئيب بغير إيمان وطاعة.",
      "اليقين المطلق بأن الله متكفل برعاية الصادقين وإرسال آيات العناية الإلهية في طيات العجائب والأقدار."
    ],
    lessonsEn: [
      "Sacrificing absolute comfort to shield your faith, mental peace, and ethical code during spiritual crises.",
      "Divine tranquility and abundance can flourish in a narrow cave, whereas vast palace halls feel tight without god.",
      "Complete reliance upon the Creator guarantees unique shelter, care, and timely awakening."
    ],
    icon: "Compass",
    gradient: "from-purple-700/15 via-stone-900 to-purple-950/20"
  },
  {
    id: "owners-of-garden",
    titleAr: "قصة أصحاب الجنة وحرمان الفقراء والرجوع السريع للحق",
    titleEn: "The Owners of the Garden and the Test of Greed",
    surahNumber: 68,
    surahNameAr: "القلم",
    surahNameEn: "Al-Qalam",
    verseRange: "17-33",
    triggerVerse: 17,
    topic: "شكر النعم وحرمة احتكار الأرزاق وحرمان الضعفاء وبركة الصدقة والرجوع للحق",
    narrativeAr: "عزم ثلاثة إخوة ورثوا بستاناً كبيراً يانعاً على جني ثمار بستانهم فجراً في الخفاء حلفاً وعقداً عازمين على منع الفقراء والمساكين من أخذ نصيبهم المعتاد من الصدقة. فطاف على جنتهم بلاء هائل حارق من ربك في الليل وهم نائمون، فأصبحت كالصريم الرماد الأسود. فلما أقبلوا وضحوا بجمال بستانهم المفقود، تابوا وأنابوا معترفين بظلمهم ومؤملين أن يبدلهم الله خيراً منها تائبین خاشعین.",
    narrativeEn: "Three brothers inherited a lush, bountiful orchard and swore to harvest all fruits at dawn in secrecy, explicitly intending to deprive the poor and needy of their traditional charity. While they slept, a sudden heavenly fire swept over the garden, reducing it to black ashes. Confronted with the complete loss, they repented, confessed their greed, and asked Allah to replace it with a purer orchard.",
    lessonsAr: [
      "شكر النعم بالبذل والإحسان ورعاية حقوق الفقراء والضعفاء كصمام أمان أصيل لاستمرارية وسلامة الرزق.",
      "عاقبة البخل والأثرة والطمع والجشع هي الخسران المبين والتبدد السريع للمال والبركة في لمح البصر.",
      "الاعتراف بالخطأ والندم والإنابة السريعة والتوبة الصادقة يفتح أبواب التعويض الإلهي والرحمة الكبرى."
    ],
    lessonsEn: [
      "Gratitude for material wealth is realized by helping the needy and maintaining their regular rights.",
      "Greed and selfish hoarding destroy the true spiritual and physical blessing of worldly assets.",
      "Immediate self-reflection, repentance, and admitting errors redeem a person to divine grace and compensation."
    ],
    icon: "Flame",
    gradient: "from-orange-700/15 via-stone-900 to-orange-950/20"
  }
];

export function getStoryForVerse(surahNumber: number, verseNumber: number): QuranicStory | undefined {
  return quranicStories.find(s => s.surahNumber === surahNumber && s.triggerVerse === verseNumber);
}

export function hasStory(surahNumber: number, verseNumber: number): boolean {
  return quranicStories.some(s => s.surahNumber === surahNumber && s.triggerVerse === verseNumber);
}
