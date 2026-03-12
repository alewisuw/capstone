export type LearnTopicKey = 'billboard' | 'legislation' | 'governance';

export type LearnModule = {
  id: string;
  title: string;
  summary: string;
  details: string[];
};

export type LearnTopic = {
  key: LearnTopicKey;
  title: string;
  subtitle: string;
  modules: LearnModule[];
};

export const learnTopics: Record<LearnTopicKey, LearnTopic> = {
  billboard: {
    key: 'billboard',
    title: 'How does Bill Board Work?',
    subtitle: 'A quick tour of the main features and how personalization works.',
    modules: [
      {
        id: 'recommendations',
        title: 'Recommendations That Match You',
        summary: 'Recommendations are built from your interests and personalization preferences to surface the most relevant bills.',
        details: [
          'Your selected interests guide which policy topics and bill categories appear.',
          'Personalization preferences help refine which recommendations are most relevant.',
          'The app combines these inputs to rank bills and surface the strongest matches first.',
          'Each recommendation includes a concise summary so you can scan quickly.',
        ],
      },
      {
        id: 'saved',
        title: 'Save Bills for Later',
        summary: 'Bookmark bills to build a reading list and revisit key updates.',
        details: [
          'Tap the bookmark icon on any bill to save it.',
          'Saved bills are available in your Saved tab for quick access.',
          'Use saved bills to track votes and updates over time.',
        ],
      },
      {
        id: 'search',
        title: 'Search by Topic or Issue',
        summary: 'Find bills by keywords, themes, or specific policy areas.',
        details: [
          'Search by topic, policy area, or bill number.',
          'Results include summaries so you can compare quickly.',
          'Use filters in your head: narrow searches with specific phrases.',
          'Tip: use full words instead of abbreviations for better semantic matches.',
          'Tip: include a short phrase that captures the policy area (e.g., “affordable housing supply”).',
          'Tip: add context words like “program,” “regulation,” or “funding” to refine results.',
          'Tip: try synonyms if you do not see what you expect (e.g., “immigration” vs “migration”).',
        ],
      },
      {
        id: 'profile',
        title: 'Edit or Delete Profile Preferences',
        summary: 'Update interests and demographics any time to improve your recommendations.',
        details: [
          'Update your interests to improve the relevance of recommendations.',
          'Edit demographics if your preferences or context change.',
          'You can remove preferences to reset how personalization works.',
        ],
      },
    ],
  },
  legislation: {
    key: 'legislation',
    title: 'Understanding Canadian Legislation',
    subtitle: 'How a bill becomes law and who is involved.',
    modules: [
      {
        id: 'bill-process',
        title: 'How a Bill Becomes Law',
        summary: 'A step-by-step guide to the legislative process in Canada.',
        details: [
          'First Reading: The bill is introduced and printed without debate.',
          'Second Reading: MPs debate the principle and vote to continue.',
          'Committee Stage: A committee studies the bill and proposes amendments.',
          'Report Stage: Changes are reported back to the House for consideration.',
          'Third Reading: Final debate and vote before moving to the other chamber.',
          'Royal Assent: The bill is approved and becomes law.',
        ],
      },
      {
        id: 'lawmakers',
        title: "Who's Involved in Making Laws",
        summary: 'Learn how MPs, Senators, committees, and the public shape legislation.',
        details: [
          'Members of Parliament introduce, debate, and vote on bills.',
          'Senators review legislation and can propose amendments.',
          'Committees scrutinize details and hear expert testimony.',
          'Public input can shape proposals through consultation and advocacy.',
        ],
      },
      {
        id: 'bill-types',
        title: 'Types of Bills and What They Mean',
        summary: 'Understand public, private, and government bills.',
        details: [
          'Government bills introduce policy from the Cabinet.',
          'Private members’ bills are introduced by individual MPs.',
          'Private bills address specific individuals or organizations.',
        ],
      },
      {
        id: 'amendments',
        title: 'How Bills Are Amended',
        summary: 'See how committees review, propose changes, and report back to Parliament.',
        details: [
          'Committees can propose amendments after detailed study.',
          'Amendments are reviewed and voted on during the report stage.',
          'Changes can be accepted, rejected, or revised before final approval.',
        ],
      },
    ],
  },
  governance: {
    key: 'governance',
    title: 'Canadian Policy & Governance',
    subtitle: 'How policy is made and how government is organized.',
    modules: [
      {
        id: 'policy',
        title: 'What Is Public Policy and How Is It Made?',
        summary: 'How ideas become official policy through research and debate.',
        details: [
          'Policy is shaped by research, public input, and political priorities.',
          'Drafts are debated, refined, and implemented by government departments.',
          'Outcomes are reviewed to measure impact and guide future changes.',
        ],
      },
      {
        id: 'structure',
        title: 'How Is the Government Structured?',
        summary: 'A quick tour of federal, provincial, and municipal roles.',
        details: [
          'Federal government handles national issues like defense and immigration.',
          'Provincial governments manage health, education, and transportation.',
          'Municipal governments manage local services like transit and zoning.',
        ],
      },
      {
        id: 'parliament',
        title: 'How Parliament Works Day to Day',
        summary: 'Learn how debates, votes, and committees keep Parliament moving.',
        details: [
          'Debates allow MPs to discuss and challenge legislation.',
          'Votes determine whether bills proceed to the next stage.',
          'Committees handle detailed review and expert testimony.',
          'Question Period holds ministers accountable for government actions.',
        ],
      },
    ],
  },
};
