import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Lang = "en" | "hi";

// A real Indian civic platform doesn't machine-translate every sentence —
// it carries English as the primary language with Hindi alongside it at
// the high-visibility points (nav, hero, CTAs, status, footer), the way
// bilingual government signage and portals actually read. That's the
// pattern this dictionary follows: short, load-bearing strings only.
const DICT = {
  appName: { en: "Suchna Rakshak", hi: "सूचना रक्षक" },
  tagline: {
    en: "Your RTI shouldn't disappear into a portal.",
    hi: "आपका आरटीआई किसी पोर्टल में गुम नहीं होना चाहिए।",
  },
  navDashboard: { en: "My Trails", hi: "मेरे ट्रेल्स" },
  navNewRti: { en: "Create RTI", hi: "आरटीआई बनाएं" },
  navDoctor: { en: "Application Doctor", hi: "एप्लिकेशन डॉक्टर" },
  navHowItWorks: { en: "How it works", hi: "यह कैसे काम करता है" },
  navHelp: { en: "Help", hi: "सहायता" },
  navLogin: { en: "Citizen Login", hi: "नागरिक लॉगिन" },
  navLogout: { en: "Log out", hi: "लॉग आउट" },

  heroKicker: {
    en: "Build With India · Unkillable RTI",
    hi: "बिल्ड विद इंडिया · अमर आरटीआई",
  },
  heroSubhead: {
    en: "Suchna Rakshak preserves the information journey — from question to response — as a citizen-owned, verifiable trail.",
    hi: "सूचना रक्षक जानकारी की पूरी यात्रा को — सवाल से जवाब तक — नागरिक के अपने, सत्यापन-योग्य ट्रेल के रूप में सुरक्षित रखता है।",
  },
  heroCtaStart: { en: "Create an RTI", hi: "आरटीआई बनाएं" },
  heroCtaTrack: { en: "Track a Suchna ID", hi: "सूचना आईडी ट्रैक करें" },

  jaanchName: { en: "Jaanch", hi: "जांच" },
  jaanchAction: { en: "Start Jaanch", hi: "जांच करें" },
  jaanchSubtitle: {
    en: "An independent, tamper-evident trail of everything that happened on this case.",
    hi: "इस मामले पर हुई हर कार्रवाई का एक स्वतंत्र, छेड़छाड़-रोधी विवरण।",
  },

  jaanchFilterName: { en: "Jaanch Filter", hi: "जांच फ़िल्टर" },
  jaanchFilterTagline: {
    en: "A response never gets summarized. It goes through the Jaanch Filter and comes out as a verdict, item by item.",
    hi: "जवाब को कभी सारांशित नहीं किया जाता। वह जांच फ़िल्टर से गुज़रता है और हर सवाल का अलग फैसला देता है।",
  },
  jaanchFilterRun: {
    en: "Run response through Jaanch Filter",
    hi: "जांच फ़िल्टर चलाएं",
  },
  jaanchFilterRunning: { en: "Filtering…", hi: "जांच जारी है…" },
  jaanchFilterVerdictLine: {
    en: "The government responded. But did it actually answer?",
    hi: "सरकार ने जवाब दिया। पर क्या असल में उत्तर मिला?",
  },
  jaanchFilterDemoNote: {
    en: "Demo preview — a live case gets this verdict from the real Jaanch Filter classifier once the response is recorded.",
    hi: "डेमो पूर्वावलोकन — वास्तविक मामले में यह फैसला असली जांच फ़िल्टर वर्गीकरणकर्ता से आता है।",
  },

  verdictAnswered: { en: "Answered", hi: "उत्तर मिला" },
  verdictPartiallyAnswered: { en: "Partially Answered", hi: "आंशिक उत्तर" },
  verdictNotAnswered: { en: "Not Answered", hi: "कोई उत्तर नहीं" },
  verdictPotentiallyDeficient: {
    en: "Potentially Deficient",
    hi: "अपर्याप्त उत्तर",
  },
  verdictPending: { en: "Pending", hi: "लंबित" },

  langSwitchLabel: { en: "Change Language", hi: "भाषा बदलें" },

  statusDraft: { en: "Draft", hi: "मसौदा" },
  statusValidated: { en: "Validated", hi: "सत्यापित" },
  statusReadyToFile: { en: "Ready to file", hi: "दाखिल करने हेतु तैयार" },
  statusSubmitted: { en: "Filed", hi: "दाखिल" },
  statusAcknowledged: { en: "Acknowledged", hi: "स्वीकृत" },
  statusTransferred: { en: "Transferred", hi: "स्थानांतरित" },
  statusUnderProcessing: { en: "In Review", hi: "समीक्षाधीन" },
  statusResponseReceived: { en: "Response received", hi: "उत्तर प्राप्त" },
  statusResponseAnalysis: { en: "Analyzing response", hi: "उत्तर विश्लेषण" },
  statusCompleted: { en: "Completed", hi: "पूर्ण" },
  statusNoResponse: { en: "No response", hi: "कोई उत्तर नहीं" },
  statusIncompleteResponse: { en: "Incomplete response", hi: "अधूरा उत्तर" },
  statusFirstAppealEligible: { en: "Appeal eligible", hi: "अपील योग्य" },
  statusFirstAppealFiled: { en: "First appeal filed", hi: "प्रथम अपील दाखिल" },
  statusSecondAppealEligible: {
    en: "Second appeal eligible",
    hi: "द्वितीय अपील योग्य",
  },

  footerTagline: {
    en: "Built for citizens exercising the Right to Information Act, 2005.",
    hi: "सूचना का अधिकार अधिनियम, 2005 का प्रयोग करने वाले नागरिकों के लिए निर्मित।",
  },

  ctaNextStep: { en: "Next Step", hi: "अगला चरण" },
  ctaSaveDraft: { en: "Save Draft", hi: "मसौदा सहेजें" },
  ctaSubmit: { en: "Submit RTI application", hi: "आरटीआई आवेदन जमा करें" },
  ctaBack: { en: "Back", hi: "वापस" },
} as const;

export type DictKey = keyof typeof DICT;

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "rti-reimagined:lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "hi" ? "hi" : "en";
  });

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: DictKey) => DICT[key][lang],
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function statusKey(status: string): DictKey {
  const map: Record<string, DictKey> = {
    DRAFT: "statusDraft",
    VALIDATED: "statusValidated",
    READY_TO_FILE: "statusReadyToFile",
    SUBMITTED: "statusSubmitted",
    ACKNOWLEDGED: "statusAcknowledged",
    TRANSFERRED: "statusTransferred",
    UNDER_PROCESSING: "statusUnderProcessing",
    RESPONSE_RECEIVED: "statusResponseReceived",
    RESPONSE_ANALYSIS: "statusResponseAnalysis",
    COMPLETED: "statusCompleted",
    NO_RESPONSE: "statusNoResponse",
    INCOMPLETE_RESPONSE: "statusIncompleteResponse",
    FIRST_APPEAL_ELIGIBLE: "statusFirstAppealEligible",
    FIRST_APPEAL_FILED: "statusFirstAppealFiled",
    SECOND_APPEAL_ELIGIBLE: "statusSecondAppealEligible",
  };
  return map[status] ?? "statusDraft";
}

export function verdictKey(status: string): DictKey {
  const map: Record<string, DictKey> = {
    ANSWERED: "verdictAnswered",
    PARTIALLY_ANSWERED: "verdictPartiallyAnswered",
    NOT_ANSWERED: "verdictNotAnswered",
    POTENTIALLY_DEFICIENT: "verdictPotentiallyDeficient",
    PENDING: "verdictPending",
  };
  return map[status] ?? "verdictPending";
}

export const VERDICT_GLYPH: Record<string, string> = {
  ANSWERED: "✓",
  PARTIALLY_ANSWERED: "◐",
  NOT_ANSWERED: "✕",
  POTENTIALLY_DEFICIENT: "⚠",
  PENDING: "…",
};
